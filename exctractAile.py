import os
from PIL import Image, ImageFilter, ImageOps

# 1. Chargement de l'image (adaptez le nom du fichier à votre image locale)
IMAGE_PATH = "asset/img/btv1b6938165v_1.jpg"
img = Image.open(IMAGE_PATH).convert("RGB")

os.makedirs("papillons_extraits", exist_ok=True)
os.makedirs("papillons_svg", exist_ok=True)

# 2. Liste des 84 boîtes englobantes (x, y, largeur, hauteur) détectées sur la planche (1272x1054)
BOXES = [
    # Rangée 1
    (94, 85, 193, 110), (302, 85, 62, 112), (372, 92, 209, 102), (582, 96, 56, 95),
    (648, 93, 148, 104), (801, 93, 111, 100), (924, 93, 213, 107), (1152, 93, 42, 52), (1120, 148, 72, 52),
    # Rangée 2
    (98, 197, 103, 169), (209, 197, 68, 96), (281, 197, 81, 56), (376, 197, 117, 94),
    (504, 198, 134, 98), (650, 198, 149, 91), (802, 199, 116, 78), (924, 203, 165, 100), (1091, 202, 101, 171),
    # Rangée 3
    (286, 260, 72, 48), (205, 300, 74, 58), (286, 318, 74, 43), (381, 302, 119, 55),
    (514, 298, 115, 67), (657, 293, 139, 72), (799, 291, 116, 78), (924, 311, 86, 54), (1015, 314, 73, 53),
    # Rangée 4
    (96, 379, 102, 149), (213, 380, 141, 94), (375, 390, 143, 78), (525, 391, 114, 92),
    (651, 382, 74, 115), (738, 386, 174, 88), (931, 384, 147, 106), (1094, 385, 96, 159),
    # Rangée 5
    (205, 482, 66, 96), (285, 476, 77, 128), (374, 472, 143, 82), (519, 496, 120, 78),
    (650, 508, 96, 68), (755, 496, 156, 86), (929, 492, 56, 84), (993, 496, 94, 66),
    # Rangée 6
    (104, 535, 92, 119), (201, 597, 83, 56), (286, 606, 75, 52), (373, 571, 136, 86),
    (518, 580, 119, 86), (649, 590, 113, 69), (776, 591, 137, 72), (928, 588, 52, 76),
    (994, 584, 93, 62), (1089, 548, 107, 62), (1088, 613, 46, 51), (1147, 610, 42, 51),
    # Rangée 7
    (101, 678, 84, 58), (217, 674, 46, 118), (272, 673, 92, 146), (369, 675, 140, 82),
    (516, 685, 120, 82), (650, 675, 116, 80), (779, 678, 134, 95), (923, 679, 84, 59),
    (1013, 676, 72, 120), (1100, 676, 90, 172),
    # Rangée 8
    (89, 746, 101, 206), (209, 802, 43, 56), (370, 759, 137, 94), (519, 780, 119, 76),
    (649, 763, 111, 68), (770, 777, 142, 93), (929, 742, 78, 124),
    # Rangée 9
    (205, 875, 55, 76), (278, 813, 74, 138), (372, 853, 139, 98), (516, 871, 117, 80),
    (651, 835, 111, 65), (648, 902, 45, 48), (715, 904, 52, 47), (784, 875, 57, 77),
    (860, 877, 54, 76), (929, 892, 74, 61), (1003, 809, 82, 144), (1089, 835, 104, 118)
]

def trace_wing_and_veins_pil(wing_gray):
    """Calcule le contour externe de l'aile et les segments de nervures uniquement avec PIL."""
    w, h = wing_gray.size
    px = wing_gray.load()
    
    # Profil du contour de l'aile (enveloppe supérieure et inférieure colonne par colonne)
    top_pts, bot_pts = [], []
    for x in range(0, w, 2):
        ys = [y for y in range(h) if px[x, y] < 178]
        if ys:
            top_pts.append((x, ys[0]))
            bot_pts.append((x, ys[-1]))
            
    outline_pts = top_pts + bot_pts[::-1]
    if outline_pts:
        wing_d = f"M {outline_pts[0][0]},{outline_pts[0][1]} " + \
                 " ".join(f"L {x},{y}" for x, y in outline_pts[1:]) + " Z"
    else:
        wing_d = ""

    # Détection des nervures par filtre de contours PIL
    edges = wing_gray.filter(ImageFilter.FIND_EDGES)
    epx = edges.load()
    vein_cmds = []
    for y in range(4, h - 4, 3):
        in_seg = False
        for x in range(4, w - 4, 2):
            # Nervure = zone sombre interne à fort contraste local
            if px[x, y] < 145 and epx[x, y] > 35:
                vein_cmds.append(f"{'L' if in_seg else 'M'} {x},{y}")
                in_seg = True
            else:
                in_seg = False

    return wing_d, " ".join(vein_cmds)

for idx, (x, y, w, h) in enumerate(BOXES, 1):
    crop = img.crop((x, y, x + w, y + h))
    gray_crop = ImageOps.grayscale(crop)
    
    # Création du masque de transparence (fond papier > 180 devient transparent)
    alpha = gray_crop.point(lambda p: 255 if p < 180 else 0)
    rgba = crop.copy()
    rgba.putalpha(alpha)
    rgba.save(f"papillons_extraits/papillon_{idx:02d}.png")

    # Sélection d'une aile (moitié droite si horizontal, moitié haute si vertical)
    if w >= h:
        wing_box = (w // 2, 0, w, h)
    else:
        wing_box = (0, 0, w, h // 2)
    wing_gray = gray_crop.crop(wing_box)
    ww, wh = wing_gray.size

    wing_path_d, vein_path_d = trace_wing_and_veins_pil(wing_gray)

    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {ww} {wh}">
  <path id="contour-aile" fill="none" stroke="#111111" stroke-width="1.8" d="{wing_path_d}" />
  <path id="nervures" fill="none" stroke="#555555" stroke-width="1.0" d="{vein_path_d}" />
</svg>'''
    with open(f"papillons_svg/papillon_{idx:02d}.svg", "w", encoding="utf-8") as f:
        f.write(svg_content)

print("Extraction terminée : 84 images PNG et 84 fichiers SVG générés !")