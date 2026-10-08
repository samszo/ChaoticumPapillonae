"""
Extraction des papillons d'une planche d'histoire naturelle
et vectorisation d'une aile au format de asset/svg/papiAile.svg.

Pour chaque papillon détecté :
  - papillons_extraits/<prefixe>_XX.png : image détourée (fond transparent)
  - papillons_svg/<prefixe>_XX.svg      : contour de l'aile + cellules délimitées
    par les nervures (paths fermés en courbes de Bézier, ellipses pour les
    petites cellules rondes),
    trait rouge sans remplissage, aile orientée comme dans l'exemple
    (attache au corps à droite).
Les modèles produits sont recensés dans papillons_svg/modeles.json,
que chaoticumPapillonae.js lit pour proposer les ailes.

Usage :
  python3 extractPapillons.py                       # planche par défaut (préfixe « papillon »)
  python3 extractPapillons.py image.jpg             # fichier local
  python3 extractPapillons.py https://.../planche.webp --prefixe godart53
  python3 extractPapillons.py --retourner papillon_17 papillon_28   # retourne haut/bas (bascule)
Options : --prefixe NOM (défaut : nom du fichier), --debug
"""
import glob
import json
import os
import re
import sys
import urllib.parse
import urllib.request

import cv2
import numpy as np

IMAGE_PATH = "asset/img/btv1b6938165v_1.jpg"
PREFIXE_DEFAUT = "papillon"     # préfixe des fichiers de la planche par défaut
DIR_SOURCES = "asset/img/sources"
DIR_PNG = "papillons_extraits"
DIR_SVG = "papillons_svg"
MANIFESTE = f"{DIR_SVG}/modeles.json"
# ailes à retourner (haut/bas) que la détection automatique oriente mal
CORRECTIONS = f"{DIR_SVG}/corrections.json"
STROKE = "#e10000"

AIRE_MIN = 15000          # aire minimale (px) d'un papillon sur la planche
AIRE_SPLIT = 50000        # deux noyaux de cette taille dans un même bloc = deux papillons
PAS_ANGLE = 10            # pas (degrés) des orientations testées pour les nervures


# ---------------------------------------------------------------------------
# 1. Détection des papillons sur la planche
# ---------------------------------------------------------------------------
def ellipse(k):
    return cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))


def fill_holes(mask):
    cs, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    out = np.zeros_like(mask)
    cv2.drawContours(out, cs, -1, 255, -1)
    return out


def detecter_papillons(img):
    """Renvoie (fg, labels, liste d'ids) : fg = encre brute, labels = un id par papillon."""
    # encre = pixels éloignés de la couleur du papier (estimée sur les zones claires,
    # ce qui marche pour un papier blanc, gris ou crème)
    lab = cv2.cvtColor(cv2.GaussianBlur(img, (0, 0), 2), cv2.COLOR_BGR2LAB).astype(np.float32)
    clair = lab[..., 0] > np.percentile(lab[..., 0], 40)
    papier = np.median(lab[clair], axis=0)
    d = np.linalg.norm(lab - papier, axis=2)
    # seuil adapté au grain du papier : un papier irrégulier demande un seuil plus haut
    seuil = max(25.0, 4 * float(np.median(d)))
    fg = (d > seuil).astype(np.uint8)

    # zone de papier = plus grande composante de fond (exclut le passe-partout)
    n, lab, st, _ = cv2.connectedComponentsWithStats(1 - fg)
    big = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])
    px, py, pw, ph = st[big, :4]
    inner = np.zeros_like(fg)
    inner[py + 40:py + ph - 40, px + 40:px + pw - 40] = 1
    fg = fg * inner * 255

    m = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, ellipse(9))
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, ellipse(11))   # coupe les antennes
    filled = fill_holes(m)
    core = cv2.morphologyEx(filled, cv2.MORPH_OPEN, ellipse(31))

    n, lab, st, _ = cv2.connectedComponentsWithStats(filled)
    labels = np.zeros(lab.shape, np.int32)
    nid = 0
    for i in range(1, n):
        x, y, w, h = st[i, :4]
        # ignore les petits éléments et les lignes de texte (très allongées)
        if st[i, 4] < AIRE_MIN or max(w, h) > 5 * min(w, h):
            continue
        comp = (lab[y:y + h, x:x + w] == i).astype(np.uint8)
        # un bloc contenant plusieurs gros noyaux = papillons qui se touchent
        cn, clab, cst, _ = cv2.connectedComponentsWithStats(core[y:y + h, x:x + w] * comp)
        seeds = [j for j in range(1, cn) if cst[j, 4] > AIRE_SPLIT]
        if len(seeds) > 1:
            markers = np.zeros((h, w), np.int32)
            for j in seeds:
                nid += 1
                markers[clab == j] = nid
            markers[comp == 0] = -1
            roi = img[y:y + h, x:x + w].copy()
            cv2.watershed(roi, markers)
            sub = labels[y:y + h, x:x + w]
            sub[(markers > 0) & (comp > 0)] = markers[(markers > 0) & (comp > 0)]
        else:
            nid += 1
            labels[y:y + h, x:x + w][comp > 0] = nid
    return fg, labels, nid


def ordonner(labels, nid):
    """Ordre de lecture : par rangées (haut → bas) puis gauche → droite."""
    boxes = []
    for i in range(1, nid + 1):
        ys, xs = np.nonzero(labels == i)
        if len(xs) == 0:
            continue
        boxes.append((i, xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    boxes.sort(key=lambda b: (b[2] + b[4]) / 2)
    rangees, courante = [], []
    for b in boxes:
        cy = (b[2] + b[4]) / 2
        if courante and cy - np.mean([(c[2] + c[4]) / 2 for c in courante]) > 150:
            rangees.append(courante)
            courante = []
        courante.append(b)
    if courante:
        rangees.append(courante)
    return [b for r in rangees for b in sorted(r, key=lambda b: b[1])]


def affiner_masque(corps):
    """Bouche les trous et entailles dus aux zones d'aile pâles (proches du papier) :
    fermeture proportionnelle à la taille du papillon, limitée à son voisinage."""
    ys, xs = np.nonzero(corps)
    if len(xs) == 0:
        return corps
    k = max(5, int(min(np.ptp(xs), np.ptp(ys)) / 20) | 1)
    m = cv2.morphologyEx(corps, cv2.MORPH_CLOSE, ellipse(k))
    m = fill_holes(m)
    return cv2.bitwise_and(m, cv2.dilate(corps, ellipse(k)))


# ---------------------------------------------------------------------------
# 2. Isolement d'une aile
# ---------------------------------------------------------------------------
def score_symetrie(mask, c, axe):
    """IoU entre la moitié gauche (ou haute) et le miroir de l'autre moitié."""
    m = mask if axe == "v" else mask.T
    w = m.shape[1]
    half = min(c, w - c)
    if half < 10:
        return 0
    a = m[:, c - half:c]
    b = m[:, c:c + half][:, ::-1]
    inter = np.logical_and(a, b).sum()
    union = np.logical_or(a, b).sum()
    return inter / union if union else 0


def axe_symetrie(mask):
    best = (0, None, None)
    for axe, size in (("v", mask.shape[1]), ("h", mask.shape[0])):
        for c in range(int(size * 0.3), int(size * 0.7)):
            s = score_symetrie(mask, c, axe)
            if s > best[0]:
                best = (s, axe, c)
    return best


def isoler_aile(crop, mask):
    """Renvoie (image, masque) de l'aile gauche, attache au corps à droite."""
    score, axe, c = axe_symetrie(mask > 0)
    if axe is None or score < 0.8:
        # papillon vu de profil / non symétrique : on garde toute la silhouette
        return crop, mask, score, None
    if axe == "h":
        # corps horizontal : on prend la moitié haute et on la tourne
        crop = cv2.rotate(crop, cv2.ROTATE_90_CLOCKWISE)
        mask = cv2.rotate(mask, cv2.ROTATE_90_CLOCKWISE)
        c = mask.shape[1] - c
        # après rotation horaire, la moitié haute est à droite : on retourne
        crop, mask = crop[:, ::-1], mask[:, ::-1]
        c = mask.shape[1] - c

    # demi-largeur du corps : plus petites largeurs de la colonne centrale
    largeurs = []
    for y in range(mask.shape[0]):
        row = mask[y] > 0
        if not row[c]:
            continue
        l = c
        while l > 0 and row[l - 1]:
            l -= 1
        r = c
        while r < len(row) - 1 and row[r + 1]:
            r += 1
        largeurs.append(min(c - l, r - c))
    corps = int(np.percentile(largeurs, 10)) if largeurs else 0
    corps = min(corps, int(mask.shape[1] * 0.04))   # un corps reste étroit
    coupe = max(1, c - int(corps * 1.3))
    aile = mask[:, :coupe].copy()
    # supprime le reste de corps (bande verticale étroite le long de la coupe)
    L = max(5, min(aile.shape) // 8)
    ouvert = cv2.morphologyEx(aile, cv2.MORPH_OPEN, np.ones((1, L), np.uint8))
    bord = int(aile.shape[1] * 0.75)
    aile[:, bord:] = ouvert[:, bord:]
    # on garde la plus grande composante (enlève les bouts d'antennes)
    n, lab, st, _ = cv2.connectedComponentsWithStats(aile)
    if n > 1:
        k = 1 + np.argmax(st[1:, 4])
        aile = np.where(lab == k, 255, 0).astype(np.uint8)
    return np.ascontiguousarray(crop[:, :coupe]), aile, score, axe


# ---------------------------------------------------------------------------
# 3. Vectorisation
# ---------------------------------------------------------------------------
def lisser_contour(cnt, eps):
    """Contour fermé -> path SVG en Bézier cubiques (Catmull-Rom)."""
    pts = cnt.reshape(-1, 2).astype(float)
    if len(pts) > 30:
        k = 7
        pad = np.vstack([pts[-k:], pts, pts[:k]])
        ker = np.ones(2 * k + 1) / (2 * k + 1)
        pts = np.stack([np.convolve(pad[:, 0], ker, "valid"),
                        np.convolve(pad[:, 1], ker, "valid")], 1)
    approx = cv2.approxPolyDP(pts.astype(np.float32).reshape(-1, 1, 2), eps, True)
    p = approx.reshape(-1, 2).astype(float)
    if len(p) < 3:
        return None
    n = len(p)
    d = f"M {p[0][0]:.2f},{p[0][1]:.2f} C"
    segs = []
    for i in range(n):
        p0, p1, p2, p3 = p[i - 1], p[i], p[(i + 1) % n], p[(i + 2) % n]
        c1 = p1 + (p2 - p0) / 6
        c2 = p2 - (p3 - p1) / 6
        segs.append(f"{c1[0]:.2f},{c1[1]:.2f} {c2[0]:.2f},{c2[1]:.2f} {p2[0]:.2f},{p2[1]:.2f}")
    return d + " " + " ".join(segs) + " z"


def ligne(L, angle):
    """Élément structurant : segment de longueur L orienté selon angle (degrés)."""
    k = np.zeros((L, L), np.uint8)
    c = L // 2
    dx, dy = np.cos(np.radians(angle)) * c, np.sin(np.radians(angle)) * c
    cv2.line(k, (int(round(c - dx)), int(round(c - dy))), (int(round(c + dx)), int(round(c + dy))), 1, 1)
    return k


def nervures(crop, aile, centile=85):
    """Masque des nervures : traits sombres, fins et allongés de la gravure.
    Le pointillé et les aplats de couleur sont écartés. Un centile plus bas
    rend la détection plus sensible (nervures pâles)."""
    s = min(aile.shape)
    L = cv2.cvtColor(crop, cv2.COLOR_BGR2LAB)[..., 0]
    L = cv2.createCLAHE(2.0, (8, 8)).apply(L)                      # renforce le contraste local
    L = cv2.GaussianBlur(L, (0, 0), max(1.0, s / 300))             # fond le pointillé
    # détails plus sombres que leur voisinage (chapeau haut-de-forme noir)
    noir = cv2.morphologyEx(L, cv2.MORPH_BLACKHAT, ellipse(max(5, (s // 40) | 1))).astype(np.float32)
    noir[aile == 0] = 0
    # ouverture par des segments orientés : seules les structures allongées survivent
    lg = max(11, (s // 14) | 1)
    angles = list(range(0, 180, PAS_ANGLE))
    reps = np.stack([cv2.morphologyEx(noir, cv2.MORPH_OPEN, ligne(lg, a)) for a in angles])
    maxi = reps.max(0)
    # une nervure répond dans une direction, un pointillé dans toutes
    aniso = maxi - np.median(reps, 0)
    seuil = max(4.0, float(np.percentile(aniso[aile > 0], centile)))
    v = ((aniso > seuil) & (maxi > seuil)).astype(np.uint8) * 255
    n, lab, st, _ = cv2.connectedComponentsWithStats(v)
    for i in range(1, n):
        if max(st[i, 2], st[i, 3]) < lg * 1.2:                     # trop court pour une nervure
            v[lab == i] = 0
    # recolle les morceaux alignés : fermeture par un segment dans la direction de chaque morceau
    direction = reps.argmax(0)
    lg2 = max(11, (s // 9) | 1)
    recolle = np.zeros_like(v)
    for k, a in enumerate(angles):
        vk = np.where((v > 0) & (np.abs(direction - k) <= 1), 255, 0).astype(np.uint8)
        recolle = np.maximum(recolle, cv2.morphologyEx(vk, cv2.MORPH_CLOSE, ligne(lg2, a)))
    v = np.maximum(v, recolle)
    v[aile == 0] = 0
    return v


def cellules(crop, aile):
    """Cellules de l'aile délimitées par les nervures (comme papiAile.svg).
    Si les nervures sont trop pâles pour découper l'aile, la détection est
    relancée avec une sensibilité plus grande."""
    meilleur = []
    for centile in (85, 75, 65):
        formes = cellules_nervures(crop, aile, centile)
        if len(formes) >= 4:
            return formes
        if len(formes) > len(meilleur):
            meilleur = formes
    return meilleur


def cellules_nervures(crop, aile, centile):
    s = min(aile.shape)
    aire = int((aile > 0).sum())
    k = max(3, (s // 90) | 1)
    murs = cv2.dilate(nervures(crop, aile, centile), ellipse(k))
    murs = cv2.morphologyEx(murs, cv2.MORPH_CLOSE, ellipse(k * 3))   # referme les petites coupures
    # marge intérieure : les cellules ne touchent pas le contour de l'aile
    interieur = cv2.erode(aile, ellipse(k * 2 + 1))
    z = np.where((interieur > 0) & (murs == 0), 255, 0).astype(np.uint8)
    z = cv2.morphologyEx(z, cv2.MORPH_OPEN, ellipse(k * 2 + 1))
    cs, _ = cv2.findContours(z, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    formes = [(cv2.contourArea(c), c) for c in cs]
    # écarte les miettes et la cellule unique qui couvrirait toute l'aile
    return [(a, c) for a, c in formes if aire * 0.004 <= a <= aire * 0.6]


def vectoriser(crop, aile):
    h, w = aile.shape
    eps = max(1.0, min(h, w) / 110)
    elements = []

    k = max(3, (min(h, w) // 25) | 1)
    lisse = cv2.morphologyEx(aile, cv2.MORPH_OPEN, ellipse(k))
    cs, _ = cv2.findContours(lisse, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    aire = cv2.contourArea(max(cs, key=cv2.contourArea)) if cs else 0
    for cnt in cs:
        if cv2.contourArea(cnt) < aire * 0.05:
            continue
        d = lisser_contour(cnt, eps)
        if d:
            elements.append(("path", d))

    for a, cnt in sorted(cellules(crop, aile), key=lambda f: -f[0]):
        per = cv2.arcLength(cnt, True)
        circ = 4 * np.pi * a / (per * per) if per else 0
        if circ > 0.8 and len(cnt) >= 5 and a < (h * w) * 0.02:
            (cx, cy), (ax1, ax2), ang = cv2.fitEllipse(cnt)
            elements.append(("ellipse", (cx, cy, ax1 / 2, ax2 / 2, ang)))
        else:
            d = lisser_contour(cnt, eps)
            if d:
                elements.append(("path", d))
    return elements


def ecrire_svg(chemin, elements, w, h):
    sw = max(1.0, max(w, h) / 230)
    style = (f"fill:none;stroke:{STROKE};stroke-width:{sw:.2f};"
             "stroke-dasharray:none;stroke-opacity:1")
    lignes = []
    for i, (kind, data) in enumerate(elements, 1):
        if kind == "path":
            lignes.append(f'<path\n       style="{style}"\n       d="{data}"\n       id="path{i}" />')
        else:
            cx, cy, rx, ry, ang = data
            lignes.append(f'<ellipse\n       style="{style}"\n       id="path{i}"\n'
                          f'       cx="{cx:.2f}"\n       cy="{cy:.2f}"\n'
                          f'       rx="{rx:.2f}"\n       ry="{ry:.2f}"\n'
                          f'       transform="rotate({ang:.2f} {cx:.2f} {cy:.2f})" />')
    svg = (f'<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n'
           f'<svg\n   width="{w}"\n   height="{h}"\n   viewBox="0 0 {w} {h}"\n'
           f'   version="1.1"\n   id="svg1"\n   xmlns="http://www.w3.org/2000/svg">'
           f'<g\n     id="layer1">' + "".join(lignes) + "</g></svg>\n")
    with open(chemin, "w", encoding="utf-8") as f:
        f.write(svg)


# ---------------------------------------------------------------------------
def charger_source(source):
    """Fichier local ou URL (téléchargée une fois dans asset/img/sources/)."""
    if not re.match(r"https?://", source):
        return source
    nom = os.path.basename(urllib.parse.urlparse(source).path) or "planche.jpg"
    chemin = os.path.join(DIR_SOURCES, nom)
    if not os.path.exists(chemin):
        os.makedirs(DIR_SOURCES, exist_ok=True)
        print(f"Téléchargement de {source}")
        urllib.request.urlretrieve(source, chemin)
    return chemin


def prefixe_pour(chemin):
    nom = os.path.splitext(os.path.basename(chemin))[0]
    return re.sub(r"[^A-Za-z0-9]+", "_", nom).strip("_") or "planche"


def lire_json(chemin, defaut):
    if not os.path.exists(chemin):
        return defaut
    with open(chemin, encoding="utf-8") as f:
        return json.load(f)


def ecrire_json(chemin, data):
    with open(chemin, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)


RETOURNEMENT = re.compile(r'(<g\s+id="layer1")( transform="matrix\(1 0 0 -1 0 [0-9.]+\)")?')


def retourner_svg(chemin, retourne):
    """Applique (ou retire) une symétrie haut/bas au groupe de l'aile."""
    with open(chemin, encoding="utf-8") as f:
        svg = f.read()
    h = re.search(r'viewBox="0 0 [0-9.]+ ([0-9.]+)"', svg).group(1)
    attr = f' transform="matrix(1 0 0 -1 0 {h})"' if retourne else ""
    svg = RETOURNEMENT.sub(lambda m: m.group(1) + attr, svg, count=1)
    with open(chemin, "w", encoding="utf-8") as f:
        f.write(svg)


def basculer_retournement(nom):
    """Retourne l'aile <nom> (ex. papillon_17) ou annule son retournement.
    La correction est mémorisée et réappliquée aux extractions suivantes."""
    nom = os.path.splitext(os.path.basename(nom))[0]
    fichier = f"{DIR_SVG}/{nom}.svg"
    data = lire_json(MANIFESTE, {"modeles": []})
    modele = next((m for m in data["modeles"] if m["fichier"] == fichier), None)
    if modele is None or not os.path.exists(fichier):
        raise ValueError(f"aile inconnue : {nom}")
    corrections = lire_json(CORRECTIONS, {})
    retourne = not corrections.get(nom, {}).get("retourner", False)
    if retourne:
        corrections[nom] = {"retourner": True}
    else:
        corrections.pop(nom, None)
    ecrire_json(CORRECTIONS, corrections)
    retourner_svg(fichier, retourne)
    modele["retourne"] = retourne
    ecrire_json(MANIFESTE, data)
    return {"fichier": fichier, "retourne": retourne}


def maj_manifeste(prefixe, source, modeles):
    """Remplace les modèles de ce préfixe dans modeles.json."""
    data = {"modeles": []}
    if os.path.exists(MANIFESTE):
        with open(MANIFESTE, encoding="utf-8") as f:
            data = json.load(f)
    data["modeles"] = [m for m in data["modeles"] if m["prefixe"] != prefixe]
    for m in modeles:
        m.update({"prefixe": prefixe, "source": source})
    data["modeles"] += modeles
    ecrire_json(MANIFESTE, data)


def extraire(source, prefixe=None, debug=False):
    """Extrait les papillons d'une image (chemin ou URL) et met à jour le manifeste.
    Renvoie {"prefixe", "modeles"} ; lève ValueError si l'image est illisible."""
    chemin = charger_source(source)
    img = cv2.imread(chemin)
    if img is None:
        raise ValueError(f"Image introuvable ou illisible : {chemin}")
    if prefixe:
        prefixe = re.sub(r"[^A-Za-z0-9]+", "_", prefixe).strip("_")
    if not prefixe:
        prefixe = PREFIXE_DEFAUT if chemin == IMAGE_PATH else prefixe_pour(chemin)

    os.makedirs(DIR_PNG, exist_ok=True)
    os.makedirs(DIR_SVG, exist_ok=True)
    for f in glob.glob(f"{DIR_PNG}/{prefixe}_[0-9]*.png") + glob.glob(f"{DIR_SVG}/{prefixe}_[0-9]*.svg"):
        os.remove(f)

    fg, labels, nid = detecter_papillons(img)
    papillons = ordonner(labels, nid)
    marge = 30
    modeles = []
    corrections = lire_json(CORRECTIONS, {})

    for idx, (i, x0, y0, x1, y1) in enumerate(papillons, 1):
        x0, y0 = max(0, x0 - marge), max(0, y0 - marge)
        x1, y1 = min(img.shape[1], x1 + marge), min(img.shape[0], y1 + marge)
        crop = img[y0:y1, x0:x1]
        corps = np.where(labels[y0:y1, x0:x1] == i, 255, 0).astype(np.uint8)
        # les voisins ne doivent pas être englobés par l'affinage
        autres = (labels[y0:y1, x0:x1] > 0) & (labels[y0:y1, x0:x1] != i)
        corps = affiner_masque(corps)
        corps[autres] = 0
        nom = f"{prefixe}_{idx:02d}"

        # PNG : silhouette + antennes (encre brute proche du papillon)
        zone = cv2.dilate(corps, ellipse(61))
        alpha = cv2.bitwise_or(corps, cv2.bitwise_and(fg[y0:y1, x0:x1], zone))
        n, lab, st, _ = cv2.connectedComponentsWithStats(alpha)
        if n > 1:
            k = 1 + np.argmax(st[1:, 4])
            alpha = np.where(lab == k, 255, 0).astype(np.uint8)
        alpha = cv2.GaussianBlur(alpha, (3, 3), 0)
        rgba = cv2.cvtColor(crop, cv2.COLOR_BGR2BGRA)
        rgba[..., 3] = alpha
        cv2.imwrite(f"{DIR_PNG}/{nom}.png", rgba)

        # SVG : une aile
        wcrop, aile, score, axe = isoler_aile(crop, corps)
        elements = vectoriser(wcrop, aile)
        ecrire_svg(f"{DIR_SVG}/{nom}.svg", elements, aile.shape[1], aile.shape[0])
        retourne = corrections.get(nom, {}).get("retourner", False)
        if retourne:
            retourner_svg(f"{DIR_SVG}/{nom}.svg", True)
        modeles.append({"fichier": f"{DIR_SVG}/{nom}.svg", "image": f"{DIR_PNG}/{nom}.png",
                        "axe": axe, "sym": round(float(score), 3), "retourne": retourne})
        if debug:
            print(f"{idx:02d} axe={axe} sym={score:.2f} aile={aile.shape[1]}x{aile.shape[0]} "
                  f"formes={len(elements)}")

    maj_manifeste(prefixe, source, modeles)
    return {"prefixe": prefixe, "modeles": modeles}


def main():
    args = sys.argv[1:]
    if args[:1] == ["--retourner"]:
        # python3 extractPapillons.py --retourner papillon_17 papillon_28 ...
        for nom in args[1:]:
            try:
                r = basculer_retournement(nom)
                print(f"{r['fichier']} : {'retournée' if r['retourne'] else 'remise dans le sens d’origine'}")
            except ValueError as e:
                print(e)
        return
    debug = "--debug" in args
    prefixe = None
    if "--prefixe" in args:
        i = args.index("--prefixe")
        prefixe = args[i + 1]
        del args[i:i + 2]
    args = [a for a in args if not a.startswith("--")]
    try:
        res = extraire(args[0] if args else IMAGE_PATH, prefixe, debug)
    except ValueError as e:
        sys.exit(str(e))
    modeles = res["modeles"]
    ailes = sum(1 for m in modeles if m["axe"])
    print(f"Extraction terminée : {len(modeles)} papillons ({res['prefixe']}_XX), "
          f"{ailes} ailes symétriques utilisables comme modèles. Manifeste : {MANIFESTE}")


if __name__ == "__main__":
    main()
