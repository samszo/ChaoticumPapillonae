"""
Extraction des papillons de la planche « Histoire naturelle, Papillons N°1 »
et vectorisation d'une aile au format de asset/svg/papiAile.svg.

Pour chaque papillon détecté :
  - papillons_extraits/papillon_XX.png : image détourée (fond transparent)
  - papillons_svg/papillon_XX.svg      : contour de l'aile + taches (paths
    fermés en courbes de Bézier, ellipses pour les petites taches rondes),
    trait rouge sans remplissage, aile orientée comme dans l'exemple
    (attache au corps à droite).

Usage : python3 extractPapillons.py [image] [--debug]
"""
import glob
import os
import sys

import cv2
import numpy as np

IMAGE_PATH = "asset/img/btv1b6938165v_1.jpg"
DIR_PNG = "papillons_extraits"
DIR_SVG = "papillons_svg"
STROKE = "#e10000"

AIRE_MIN = 15000          # aire minimale (px) d'un papillon sur la planche
AIRE_SPLIT = 50000        # deux noyaux de cette taille dans un même bloc = deux papillons
NB_COULEURS = 4           # nombre de couleurs pour découper les motifs de l'aile


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
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    fg = ((hsv[..., 1] > 45) | (hsv[..., 2] < 150)).astype(np.uint8)

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
        if st[i, 4] < AIRE_MIN:
            continue
        x, y, w, h = st[i, :4]
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


def motifs(crop, aile):
    """Découpe l'intérieur de l'aile en cellules : zones claires de couleur
    homogène, séparées par les traits sombres (nervures, bordures)."""
    h, w = aile.shape
    aire = int((aile > 0).sum())
    lab = cv2.cvtColor(cv2.bilateralFilter(crop, 9, 40, 9), cv2.COLOR_BGR2LAB)
    lab = cv2.medianBlur(lab, 5)
    L = lab[..., 0]
    k = max(3, (min(h, w) // 70) | 1)
    # traits sombres = plus sombres que leur voisinage
    fond = cv2.blur(L, (k * 4 + 1, k * 4 + 1)).astype(int)
    sombre = ((L.astype(int) < fond - 12) | (L < np.percentile(L[aile > 0], 12))) & (aile > 0)
    sombre = cv2.morphologyEx(sombre.astype(np.uint8) * 255, cv2.MORPH_CLOSE, ellipse(k))

    clair = (aile > 0) & (sombre == 0)
    pix = lab[clair].astype(np.float32)
    if len(pix) < NB_COULEURS * 10:
        return []
    crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0)
    _, lbl, _ = cv2.kmeans(pix, NB_COULEURS, None, crit, 3, cv2.KMEANS_PP_CENTERS)
    carte = np.full((h, w), 255, np.uint8)
    carte[clair] = lbl.ravel()

    # marge intérieure : les cellules ne touchent pas le contour
    interieur = cv2.erode(aile, ellipse(2 * k + 1))
    formes = []
    for c in range(NB_COULEURS):
        z = np.where((carte == c) & (interieur > 0), 255, 0).astype(np.uint8)
        z = cv2.morphologyEx(z, cv2.MORPH_OPEN, ellipse(2 * k + 1))
        z = cv2.morphologyEx(z, cv2.MORPH_CLOSE, ellipse(k))
        z = fill_holes(z)
        z = cv2.erode(z, ellipse(k))          # écart entre cellules voisines
        cs, _ = cv2.findContours(z, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        for cnt in cs:
            a = cv2.contourArea(cnt)
            if a < aire * 0.003 or a > aire * 0.5:
                continue
            formes.append((a, cnt))
    # une cellule ne doit pas en contenir une autre (garde la plus petite)
    garde = []
    for a, cnt in sorted(formes, key=lambda f: f[0]):
        if any(cv2.pointPolygonTest(cnt, tuple(map(float, g[1][0][0])), False) > 0 for g in garde):
            continue
        garde.append((a, cnt))
    return garde


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

    for a, cnt in sorted(motifs(crop, aile), key=lambda f: -f[0]):
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
def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    debug = "--debug" in sys.argv
    img = cv2.imread(args[0] if args else IMAGE_PATH)
    if img is None:
        sys.exit(f"Image introuvable : {args[0] if args else IMAGE_PATH}")

    os.makedirs(DIR_PNG, exist_ok=True)
    os.makedirs(DIR_SVG, exist_ok=True)
    for f in glob.glob(f"{DIR_PNG}/papillon_*.png") + glob.glob(f"{DIR_SVG}/papillon_*.svg"):
        os.remove(f)

    fg, labels, nid = detecter_papillons(img)
    papillons = ordonner(labels, nid)
    marge = 30

    for idx, (i, x0, y0, x1, y1) in enumerate(papillons, 1):
        x0, y0 = max(0, x0 - marge), max(0, y0 - marge)
        x1, y1 = min(img.shape[1], x1 + marge), min(img.shape[0], y1 + marge)
        crop = img[y0:y1, x0:x1]
        corps = np.where(labels[y0:y1, x0:x1] == i, 255, 0).astype(np.uint8)

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
        cv2.imwrite(f"{DIR_PNG}/papillon_{idx:02d}.png", rgba)

        # SVG : une aile
        wcrop, aile, score, axe = isoler_aile(crop, corps)
        elements = vectoriser(wcrop, aile)
        ecrire_svg(f"{DIR_SVG}/papillon_{idx:02d}.svg", elements, aile.shape[1], aile.shape[0])
        if debug:
            print(f"{idx:02d} axe={axe} sym={score:.2f} aile={aile.shape[1]}x{aile.shape[0]} "
                  f"formes={len(elements)}")

    print(f"Extraction terminée : {len(papillons)} PNG dans {DIR_PNG}/ et "
          f"{len(papillons)} SVG dans {DIR_SVG}/")


if __name__ == "__main__":
    main()
