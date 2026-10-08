"""
Serveur de Chaoticum Papillonae.

Sert les fichiers publics du projet et ajoute l'import de planches,
réservé aux personnes connectées :

  POST /api/connexion          {"utilisateur": ..., "mot_de_passe": ...}
  POST /api/deconnexion
  GET  /api/moi                -> {"utilisateur": nom | null}
  POST /api/extraire?nom=planche.jpg&prefixe=xxx   corps = octets de l'image
  POST /api/extraire?url=https://...&prefixe=xxx   image téléchargée par le serveur
  POST /api/retourner?fichier=papillons_svg/xxx.svg  retourne une aile haut/bas (bascule)

Usage :
  python3 serveur.py [port]                         lance le serveur
  python3 serveur.py --ajouter-utilisateur NOM      crée / change le mot de passe
  python3 serveur.py --supprimer-utilisateur NOM
  python3 serveur.py --utilisateurs                 liste les comptes

Variables d'environnement :
  CP_HOTE            adresse d'écoute (défaut 127.0.0.1, 0.0.0.0 dans Docker)
  CP_PORT            port (défaut 8765)
  CP_DATA            dossier des données privées (défaut data/)
  CP_COOKIE_SECURE   1 si le site est servi en HTTPS (cookie « Secure »)
  CP_PROXY           1 derrière un proxy inverse (lit X-Forwarded-For)
  CP_ADMIN_USER / CP_ADMIN_PASSWORD   crée ou met à jour ce compte au démarrage
"""
import getpass
import hashlib
import hmac
import ipaddress
import json
import os
import re
import secrets
import socket
import sys
import threading
import time
import traceback
import urllib.parse
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

import extractPapillons

TAILLE_MAX = 60 * 1024 * 1024          # 60 Mo par image
EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff", ".bmp"}
DUREE_SESSION = 12 * 3600              # secondes
ESSAIS_MAX, FENETRE_ESSAIS = 10, 15 * 60  # échecs de connexion tolérés par IP
ITERATIONS = 240_000                   # PBKDF2-SHA256

DATA = os.environ.get("CP_DATA", "data")
FICHIER_UTILISATEURS = os.path.join(DATA, "utilisateurs.json")
COOKIE_SECURE = os.environ.get("CP_COOKIE_SECURE") == "1"
DERRIERE_PROXY = os.environ.get("CP_PROXY") == "1"

# fichiers servis : pages à la racine et dossiers publics, rien d'autre
# (pas de .py, data/, .git/, ni de listes de dossiers)
DOSSIERS_PUBLICS = ("asset/", "papillons_svg/", "papillons_extraits/", "docs/")
EXT_RACINE = {".html", ".htm", ".css"}

verrou_extraction = threading.Lock()   # une extraction à la fois (manifeste partagé)
verrou_comptes = threading.Lock()
sessions = {}                          # jeton -> (utilisateur, expiration)
echecs = {}                            # ip -> [horodatages des échecs]


# ---------------------------------------------------------------------------
# Comptes
# ---------------------------------------------------------------------------
def lire_utilisateurs():
    if not os.path.exists(FICHIER_UTILISATEURS):
        return {}
    with open(FICHIER_UTILISATEURS, encoding="utf-8") as f:
        return json.load(f)


def ecrire_utilisateurs(u):
    os.makedirs(DATA, exist_ok=True)
    tmp = FICHIER_UTILISATEURS + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(u, f, indent=1)
    os.chmod(tmp, 0o600)
    os.replace(tmp, FICHIER_UTILISATEURS)


def hacher(mot_de_passe, sel=None):
    sel = sel or secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac("sha256", mot_de_passe.encode(), bytes.fromhex(sel), ITERATIONS)
    return {"sel": sel, "hash": h.hex(), "iterations": ITERATIONS}


def definir_mot_de_passe(nom, mot_de_passe):
    if not re.fullmatch(r"[A-Za-z0-9_.@-]{2,64}", nom):
        raise ValueError("nom d'utilisateur : 2 à 64 caractères parmi lettres, chiffres, _ . @ -")
    if len(mot_de_passe) < 10:
        raise ValueError("mot de passe trop court (10 caractères minimum)")
    with verrou_comptes:
        u = lire_utilisateurs()
        u[nom] = hacher(mot_de_passe)
        ecrire_utilisateurs(u)


def verifier(nom, mot_de_passe):
    compte = lire_utilisateurs().get(nom)
    if not compte:
        hacher(mot_de_passe)           # même durée qu'un compte existant
        return False
    h = hashlib.pbkdf2_hmac("sha256", mot_de_passe.encode(), bytes.fromhex(compte["sel"]),
                            compte.get("iterations", ITERATIONS))
    return hmac.compare_digest(h.hex(), compte["hash"])


# ---------------------------------------------------------------------------
# Téléchargement d'une URL (limité aux adresses publiques)
# ---------------------------------------------------------------------------
def verifier_url(url):
    p = urllib.parse.urlparse(url)
    if p.scheme not in ("http", "https") or not p.hostname:
        raise ValueError("URL invalide")
    for info in socket.getaddrinfo(p.hostname, p.port or (443 if p.scheme == "https" else 80)):
        ip = ipaddress.ip_address(info[4][0])
        if not ip.is_global:
            raise ValueError("URL refusée : adresse non publique")


class RedirectionVerifiee(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        verifier_url(newurl)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def telecharger(url):
    verifier_url(url)
    nom = os.path.basename(urllib.parse.urlparse(url).path) or "planche.jpg"
    base, ext = os.path.splitext(nom)
    if ext.lower() not in EXTENSIONS:
        ext = ".jpg"
    base = re.sub(r"[^A-Za-z0-9_-]+", "_", base).strip("_") or "planche"
    chemin = os.path.join(extractPapillons.DIR_SOURCES, base + ext.lower())
    ouvreur = urllib.request.build_opener(RedirectionVerifiee)
    with ouvreur.open(url, timeout=60) as r:
        donnees = r.read(TAILLE_MAX + 1)
    if len(donnees) > TAILLE_MAX:
        raise ValueError("image trop grosse (60 Mo max)")
    os.makedirs(extractPapillons.DIR_SOURCES, exist_ok=True)
    with open(chemin, "wb") as f:
        f.write(donnees)
    return chemin


# ---------------------------------------------------------------------------
# Serveur HTTP
# ---------------------------------------------------------------------------
class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # évite les modèles et le manifeste périmés dans le cache du navigateur
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    # -- fichiers statiques --------------------------------------------------
    def chemin_public(self):
        chemin = urllib.parse.unquote(urllib.parse.urlparse(self.path).path).lstrip("/")
        if chemin == "" or ".." in chemin.split("/"):
            return chemin == ""
        if any(chemin.startswith(d) for d in DOSSIERS_PUBLICS):
            return not chemin.endswith("/") and not chemin.endswith(".py")
        return "/" not in chemin and os.path.splitext(chemin)[1].lower() in EXT_RACINE

    def do_GET(self):
        url = urllib.parse.urlparse(self.path)
        if url.path == "/api/moi":
            return self.repondre(200, {"utilisateur": self.utilisateur()})
        if not self.chemin_public():
            return self.send_error(404)
        super().do_GET()

    def do_HEAD(self):
        if not self.chemin_public():
            return self.send_error(404)
        super().do_HEAD()

    def list_directory(self, path):
        self.send_error(404)

    # -- outils ----------------------------------------------------------------
    def repondre(self, code, data, cookie=None):
        corps = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(corps)))
        if cookie is not None:
            self.send_header("Set-Cookie", cookie)
        self.end_headers()
        self.wfile.write(corps)

    def ip(self):
        if DERRIERE_PROXY and self.headers.get("X-Forwarded-For"):
            return self.headers["X-Forwarded-For"].split(",")[0].strip()
        return self.client_address[0]

    def jeton(self):
        for morceau in self.headers.get("Cookie", "").split(";"):
            k, _, v = morceau.strip().partition("=")
            if k == "cp_session":
                return v
        return None

    def utilisateur(self):
        s = sessions.get(self.jeton() or "")
        if not s or s[1] < time.time():
            return None
        return s[0]

    def cookie(self, valeur, age):
        c = f"cp_session={valeur}; Path=/; HttpOnly; SameSite=Strict; Max-Age={age}"
        return c + ("; Secure" if COOKIE_SECURE else "")

    def lire_json(self):
        taille = int(self.headers.get("Content-Length", 0))
        if taille > 10_000:
            raise ValueError("requête trop grosse")
        return json.loads(self.rfile.read(taille) or b"{}")

    # -- API -------------------------------------------------------------------
    def do_POST(self):
        chemin = urllib.parse.urlparse(self.path).path
        try:
            if chemin == "/api/connexion":
                return self.connexion()
            if chemin == "/api/deconnexion":
                sessions.pop(self.jeton() or "", None)
                return self.repondre(200, {"utilisateur": None}, self.cookie("", 0))
            if chemin in ("/api/extraire", "/api/retourner") and not self.utilisateur():
                return self.repondre(401, {"erreur": "connexion requise"})
            if chemin == "/api/extraire":
                return self.extraire()
            if chemin == "/api/retourner":
                q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
                with verrou_extraction:
                    res = extractPapillons.basculer_retournement(q.get("fichier", [""])[0])
                return self.repondre(200, res)
            self.repondre(404, {"erreur": "inconnu"})
        except ValueError as e:
            self.repondre(400, {"erreur": str(e)})
        except Exception as e:
            traceback.print_exc()
            self.repondre(500, {"erreur": f"{type(e).__name__} : {e}"})

    def connexion(self):
        ip, maintenant = self.ip(), time.time()
        recents = [t for t in echecs.get(ip, []) if maintenant - t < FENETRE_ESSAIS]
        if len(recents) >= ESSAIS_MAX:
            return self.repondre(429, {"erreur": "trop d'essais, réessayer dans quelques minutes"})
        d = self.lire_json()
        nom, mdp = str(d.get("utilisateur", "")), str(d.get("mot_de_passe", ""))
        if not verifier(nom, mdp):
            echecs[ip] = recents + [maintenant]
            return self.repondre(401, {"erreur": "identifiants incorrects"})
        echecs.pop(ip, None)
        # purge des sessions expirées
        for j in [j for j, s in sessions.items() if s[1] < maintenant]:
            sessions.pop(j, None)
        jeton = secrets.token_urlsafe(32)
        sessions[jeton] = (nom, maintenant + DUREE_SESSION)
        self.repondre(200, {"utilisateur": nom}, self.cookie(jeton, DUREE_SESSION))

    def extraire(self):
        q = {k: v[0] for k, v in urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query).items()}
        prefixe = q.get("prefixe") or None
        if q.get("url"):
            source = telecharger(q["url"])
        else:
            taille = int(self.headers.get("Content-Length", 0))
            if not taille or taille > TAILLE_MAX:
                raise ValueError("fichier vide ou trop gros (60 Mo max)")
            base, ext = os.path.splitext(os.path.basename(q.get("nom", "planche.jpg")))
            if ext.lower() not in EXTENSIONS:
                raise ValueError(f"format non géré : {ext}")
            base = re.sub(r"[^A-Za-z0-9_-]+", "_", base).strip("_") or "planche"
            os.makedirs(extractPapillons.DIR_SOURCES, exist_ok=True)
            source = os.path.join(extractPapillons.DIR_SOURCES, base + ext.lower())
            with open(source, "wb") as f:
                f.write(self.rfile.read(taille))
        try:
            with verrou_extraction:
                res = extractPapillons.extraire(source, prefixe)
        except ValueError:
            # image illisible : on ne la garde pas
            if os.path.exists(source):
                os.remove(source)
            raise
        res["ailes"] = sum(1 for m in res["modeles"] if m["axe"])
        self.repondre(200, res)


# ---------------------------------------------------------------------------
def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    args = sys.argv[1:]
    try:
        if args[:1] == ["--ajouter-utilisateur"] and len(args) == 2:
            mdp = getpass.getpass(f"Mot de passe pour {args[1]} : ")
            if mdp != getpass.getpass("Confirmation : "):
                sys.exit("Les deux mots de passe diffèrent.")
            definir_mot_de_passe(args[1], mdp)
            return print(f"Compte « {args[1]} » enregistré dans {FICHIER_UTILISATEURS}")
        if args[:1] == ["--supprimer-utilisateur"] and len(args) == 2:
            with verrou_comptes:
                u = lire_utilisateurs()
                if u.pop(args[1], None) is None:
                    sys.exit(f"Compte inconnu : {args[1]}")
                ecrire_utilisateurs(u)
            return print(f"Compte « {args[1]} » supprimé")
        if args[:1] == ["--utilisateurs"]:
            return print("\n".join(sorted(lire_utilisateurs())) or "(aucun compte)")
    except ValueError as e:
        sys.exit(str(e))

    if os.environ.get("CP_ADMIN_USER") and os.environ.get("CP_ADMIN_PASSWORD"):
        definir_mot_de_passe(os.environ["CP_ADMIN_USER"], os.environ["CP_ADMIN_PASSWORD"])
    if not lire_utilisateurs():
        print("Aucun compte : l'import de planches est inaccessible. "
              "Créer un compte avec : python3 serveur.py --ajouter-utilisateur NOM")

    hote = os.environ.get("CP_HOTE", "127.0.0.1")
    port = int(args[0]) if args else int(os.environ.get("CP_PORT", 8765))
    print(f"Chaoticum Papillonae : http://{'localhost' if hote == '127.0.0.1' else hote}:{port}/", flush=True)
    ThreadingHTTPServer((hote, port), Handler).serve_forever()


if __name__ == "__main__":
    main()
