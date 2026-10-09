import math
import random
import time

def generate_butterfly(seed=None, output_file="papillon_ecailles.svg"):
    # Graine aléatoire dynamique si non spécifiée
    if seed is None:
        seed = int(time.time() * 1000) % 1000000
    random.seed(seed)
    
    width, height = 900, 900
    cx, cy = width / 2, height / 2
    
    # Palettes de couleurs inspirées d'espèces réelles
    palettes = [
        {"nom": "Monarque", "base": "#ff9e00", "mid": "#ff6b00", "marge": "#121212", "accent": "#ffffff", "ocelle": "#e63946", "ecaille": "#ffc300"},
        {"nom": "Morpho", "base": "#90e0ef", "mid": "#00b4d8", "marge": "#03045e", "accent": "#caf0f8", "ocelle": "#ff006e", "ecaille": "#48cae4"},
        {"nom": "Machaon", "base": "#ffea00", "mid": "#ffb703", "marge": "#1a1a1a", "accent": "#0077b6", "ocelle": "#d90429", "ecaille": "#ffe600"},
        {"nom": "Émeraude", "base": "#74c69d", "mid": "#2a9d8f", "marge": "#051923", "accent": "#e9c46a", "ocelle": "#f4a261", "ecaille": "#52b788"},
        {"nom": "Nymphale", "base": "#c77dff", "mid": "#7b2cbf", "marge": "#10002b", "accent": "#e0aaff", "ocelle": "#ffb703", "ecaille": "#9d4edd"}
    ]
    pal = random.choice(palettes)
    
    # Variables de morphologie alaire
    fw_length = random.uniform(270, 330)
    fw_width = random.uniform(160, 210)
    fw_apex_y = random.uniform(230, 280)
    has_tail = random.choice([True, False])
    tail_len = random.uniform(40, 75) if has_tail else 0
    hw_length = random.uniform(170, 220)
    hw_width = random.uniform(130, 180)
    num_dots = random.randint(5, 9)
    s = random.choice([8, 10, 12])  # Taille des micro-tuiles d'écailles
    
    svg = []
    svg.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="100%">')
    svg.append('  <defs>')
    
    # Motif d'écailles microscopiques imbriquées (Tuiles d'écailles)
    svg.append(f'    <pattern id="motifEcailles" width="{s}" height="{s}" patternUnits="userSpaceOnUse">')
    svg.append(f'      <rect width="{s}" height="{s}" fill="none"/>')
    svg.append(f'      <path d="M 0,{s/2} C 0,0 {s/2},0 {s/2},{s/2} C {s/2},{s} 0,{s} 0,{s/2} Z" fill="{pal["ecaille"]}" fill-opacity="0.35" stroke="#000" stroke-width="0.3" stroke-opacity="0.35"/>')
    svg.append(f'      <path d="M {s/2},{s/2} C {s/2},0 {s},0 {s},{s/2} C {s},{s} {s/2},{s} {s/2},{s/2} Z" fill="{pal["base"]}" fill-opacity="0.3" stroke="#000" stroke-width="0.3" stroke-opacity="0.35"/>')
    svg.append(f'      <path d="M {s/4},0 C {s/4},-{s/2} {3*s/4},-{s/2} {3*s/4},0 C {3*s/4},{s/2} {s/4},{s/2} {s/4},0 Z" fill="{pal["mid"]}" fill-opacity="0.25" stroke="#000" stroke-width="0.3" stroke-opacity="0.3"/>')
    svg.append('    </pattern>')
    
    svg.append('    <linearGradient id="wingGrad" x1="0%" y1="0%" x2="100%" y2="100%">')
    svg.append(f'      <stop offset="0%" stop-color="{pal["base"]}"/>')
    svg.append(f'      <stop offset="65%" stop-color="{pal["mid"]}"/>')
    svg.append(f'      <stop offset="100%" stop-color="{pal["marge"]}"/>')
    svg.append('    </linearGradient>')
    
    svg.append('    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">')
    svg.append('      <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000" flood-opacity="0.6"/>')
    svg.append('    </filter>')
    svg.append('  </defs>')
    
    svg.append(f'  <rect width="{width}" height="{height}" fill="#0b0c10"/>')
    svg.append(f'  <text x="40" y="50" fill="#f8fafc" font-family="Georgia, serif" font-size="22" font-weight="bold">Spécimen Lépidoptère n°{seed}</text>')
    svg.append(f'  <text x="40" y="78" fill="#94a3b8" font-family="sans-serif" font-size="14" font-style="italic">Taxon : {pal["nom"]} - Écailles imbriquées (Tuiles {s}px)</text>')
    
    svg.append('  <g filter="url(#shadow)">')
    
    for mirror in [False, True]:
        sign = -1 if mirror else 1
        
        p_base_fw = (cx, cy - 25)
        p_apex_fw = (cx + sign * fw_length, cy - fw_apex_y)
        p_margin_fw = (cx + sign * (fw_length * 0.85), cy + 20)
        p_tornus_fw = (cx + sign * 140, cy + 30)
        
        d_forewing = (
            f"M {p_base_fw[0]},{p_base_fw[1]} "
            f"C {cx + sign*fw_length*0.55},{cy - fw_apex_y - 40} {cx + sign*fw_length*0.85},{cy - fw_apex_y - 30} {p_apex_fw[0]},{p_apex_fw[1]} "
            f"C {p_apex_fw[0] + sign*20},{cy - 100} {p_margin_fw[0] + sign*20},{cy - 20} {p_margin_fw[0]},{p_margin_fw[1]} "
            f"C {cx + sign*220},{cy + 40} {cx + sign*100},{cy + 10} {p_base_fw[0]},{p_base_fw[1]} Z"
        )
        
        p_base_hw = (cx, cy + 15)
        p_apex_hw = (cx + sign * hw_width, cy + hw_length)
        p_tail_hw = (cx + sign * (hw_width * 0.7), cy + hw_length + tail_len)
        p_tornus_hw = (cx + sign * 30, cy + hw_length * 0.85)
        
        if has_tail:
            d_hindwing = (
                f"M {p_base_hw[0]},{p_base_hw[1]} "
                f"C {cx + sign*hw_width*0.9},{cy + 30} {cx + sign*hw_width*1.1},{cy + hw_length*0.6} {p_apex_hw[0]},{p_apex_hw[1]} "
                f"C {p_apex_hw[0] - sign*20},{cy + hw_length + 20} {p_tail_hw[0] + sign*15},{p_tail_hw[1] - 10} {p_tail_hw[0]},{p_tail_hw[1]} "
                f"C {p_tail_hw[0] - sign*25},{p_tail_hw[1] - 30} {p_tornus_hw[0] + sign*30},{p_tornus_hw[1] + 20} {p_tornus_hw[0]},{p_tornus_hw[1]} "
                f"C {cx + sign*15},{cy + 120} {cx + sign*10},{cy + 60} {p_base_hw[0]},{p_base_hw[1]} Z"
            )
        else:
            d_hindwing = (
                f"M {p_base_hw[0]},{p_base_hw[1]} "
                f"C {cx + sign*hw_width*0.9},{cy + 30} {cx + sign*hw_width*1.1},{cy + hw_length*0.6} {p_apex_hw[0]},{p_apex_hw[1]} "
                f"C {cx + sign*hw_width*0.6},{cy + hw_length + 30} {p_tornus_hw[0] + sign*40},{p_tornus_hw[1] + 20} {p_tornus_hw[0]},{p_tornus_hw[1]} "
                f"C {cx + sign*15},{cy + 120} {cx + sign*10},{cy + 60} {p_base_hw[0]},{p_base_hw[1]} Z"
            )
            
        # Membrane + Écailles
        svg.append(f'    <path d="{d_hindwing}" fill="url(#wingGrad)" opacity="0.95" stroke="{pal["marge"]}" stroke-width="2"/>')
        svg.append(f'    <path d="{d_hindwing}" fill="url(#motifEcailles)"/>')
        
        # Ocelle marginal
        oc_x = cx + sign * (hw_width * 0.45)
        oc_y = cy + hw_length * 0.65
        svg.append(f'    <circle cx="{oc_x}" cy="{oc_y}" r="16" fill="#000"/>')
        svg.append(f'    <circle cx="{oc_x}" cy="{oc_y}" r="11" fill="{pal["ocelle"]}"/>')
        svg.append(f'    <circle cx="{oc_x + sign*3}" cy="{oc_y - 2}" r="4" fill="{pal["accent"]}"/>')

        # Membrane + Écailles aile antérieure
        svg.append(f'    <path d="{d_forewing}" fill="url(#wingGrad)" opacity="0.98" stroke="{pal["marge"]}" stroke-width="2"/>')
        svg.append(f'    <path d="{d_forewing}" fill="url(#motifEcailles)"/>')
        svg.append(f'    <path d="{d_forewing}" fill="none" stroke="{pal["marge"]}" stroke-width="12" stroke-linejoin="round" opacity="0.85"/>')
        
        for i in range(num_dots):
            t = (i + 1) / (num_dots + 1)
            dot_x = p_apex_fw[0] * (1 - t) + p_margin_fw[0] * t + sign * random.uniform(-4, 4)
            dot_y = p_apex_fw[1] * (1 - t) + p_margin_fw[1] * t + random.uniform(-4, 4)
            svg.append(f'    <circle cx="{dot_x:.1f}" cy="{dot_y:.1f}" r="{random.uniform(2.5, 4.5):.1f}" fill="{pal["accent"]}"/>')

        # Cellule discoïdale & nervures
        d_cell = (
            f"M {p_base_fw[0]},{p_base_fw[1]} "
            f"C {cx + sign*fw_length*0.3},{cy - fw_apex_y*0.5} {cx + sign*fw_length*0.45},{cy - fw_apex_y*0.55} {cx + sign*fw_length*0.52},{cy - fw_apex_y*0.42} "
            f"C {cx + sign*fw_length*0.45},{cy - fw_apex_y*0.25} {cx + sign*fw_length*0.25},{cy - 20} {p_base_fw[0]},{p_base_fw[1]} Z"
        )
        svg.append(f'    <path d="{d_cell}" fill="none" stroke="{pal["marge"]}" stroke-width="2.5"/>')
        
        p_disc = (cx + sign * fw_length * 0.52, cy - fw_apex_y * 0.42)
        veins = [
            f"M {p_base_fw[0]},{p_base_fw[1]} Q {cx + sign*fw_length*0.4},{cy - fw_apex_y*0.8} {p_apex_fw[0]},{p_apex_fw[1]}",
            f"M {p_disc[0]},{p_disc[1]} Q {cx + sign*fw_length*0.75},{cy - fw_apex_y*0.65} {cx + sign*fw_length*0.9},{cy - fw_apex_y*0.6}",
            f"M {p_disc[0]},{p_disc[1]} Q {cx + sign*fw_length*0.7},{cy - fw_apex_y*0.35} {p_margin_fw[0]},{p_margin_fw[1]}",
            f"M {p_disc[0]},{p_disc[1]} Q {cx + sign*fw_length*0.55},{cy - 10} {p_tornus_fw[0]},{p_tornus_fw[1]}"
        ]
        for v in veins:
            svg.append(f'    <path d="{v}" fill="none" stroke="{pal["marge"]}" stroke-width="2" stroke-linecap="round"/>')

    # Corps Anatomique
    svg.append(f'    <ellipse cx="{cx}" cy="{cy + 105}" rx="13" ry="80" fill="#1c1917" stroke="#000" stroke-width="2"/>')
    for i in range(1, 8):
        y_seg = cy + 40 + i * 16
        svg.append(f'    <line x1="{cx - 11}" y1="{y_seg}" x2="{cx + 12}" y2="{y_seg}" stroke="#44403c" stroke-width="2"/>')
        
    svg.append(f'    <ellipse cx="{cx}" cy="{cy}" rx="17" ry="30" fill="#292524" stroke="#000" stroke-width="2"/>')
    svg.append(f'    <ellipse cx="{cx}" cy="{cy}" rx="12" ry="22" fill="#44403c" opacity="0.6"/>')
    svg.append(f'    <circle cx="{cx}" cy="{cy - 38}" r="12" fill="#1c1917" stroke="#000" stroke-width="2"/>')
    svg.append(f'    <ellipse cx="{cx - 9}" cy="{cy - 41}" rx="4.5" ry="6.5" fill="#78716c"/>')
    svg.append(f'    <ellipse cx="{cx + 9}" cy="{cy - 41}" rx="4.5" ry="6.5" fill="#78716c"/>')
    svg.append(f'    <path d="M {cx},{cy - 50} C {cx - 8},{cy - 56} {cx - 12},{cy - 46} {cx - 5},{cy - 42}" fill="none" stroke="#d97706" stroke-width="1.8"/>')
    
    for side in [-1, 1]:
        ant_path = f"M {cx + side*4},{cy - 48} C {cx + side*35},{cy - 105} {cx + side*85},{cy - 150} {cx + side*115},{cy - 160}"
        svg.append(f'    <path d="{ant_path}" fill="none" stroke="#1c1917" stroke-width="2.5" stroke-linecap="round"/>')
        svg.append(f'    <ellipse cx="{cx + side*115}" cy="{cy - 160}" rx="4" ry="7" transform="rotate({side*30} {cx + side*115} {cy - 160})" fill="#1c1917"/>')

    svg.append(f'    <circle cx="{cx}" cy="{cy - 5}" r="4" fill="#ffd700" stroke="#b8860b" stroke-width="1"/>')

    svg.append('  </g>')
    svg.append('</svg>')
    
    with open(output_file, "w", encoding="utf-8") as f:
        f.write("\n".join(svg))
    return seed

if __name__ == "__main__":
    s = generate_butterfly()