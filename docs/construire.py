"""
Génère les pages HTML de la documentation à partir des fichiers Markdown de docs/.

Chaque page embarque son Markdown et l'affiche avec marked ; les blocs ```mermaid
deviennent des diagrammes. Usage : python3 docs/construire.py
"""
import glob
import html
import os
import re

DOCS = os.path.dirname(os.path.abspath(__file__))

PAGE = r"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{titre} — Chaoticum Papillonae</title>
<style>
  :root {{ --fond: #fdfcf8; --texte: #222; --doux: #666; --lien: #2a5db0; --code: #f1efe8; --bord: #ddd8cc; }}
  @media (prefers-color-scheme: dark) {{
    :root {{ --fond: #1d1c1a; --texte: #e8e6e1; --doux: #a29f97; --lien: #8ab4f8; --code: #2a2926; --bord: #3d3b37; }}
  }}
  body {{ margin: 0; background: var(--fond); color: var(--texte);
         font: 16px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif; }}
  nav {{ border-bottom: 1px solid var(--bord); padding: 10px 16px; display: flex; flex-wrap: wrap; gap: 6px 18px; }}
  nav a {{ color: var(--lien); text-decoration: none; }}
  nav a.actif {{ font-weight: bold; color: var(--texte); }}
  main {{ max-width: 900px; margin: 0 auto; padding: 8px 16px 48px; }}
  h1 {{ font-family: Georgia, serif; font-style: italic; }}
  h2 {{ border-bottom: 1px solid var(--bord); padding-bottom: 4px; margin-top: 2em; }}
  a {{ color: var(--lien); }}
  code {{ background: var(--code); padding: 1px 4px; border-radius: 3px; font-size: 0.92em; }}
  pre {{ background: var(--code); padding: 12px; border-radius: 6px; overflow-x: auto; }}
  pre code {{ padding: 0; background: none; }}
  pre.mermaid {{ background: none; text-align: center; }}
  table {{ border-collapse: collapse; display: block; overflow-x: auto; margin: 1em 0; }}
  th, td {{ border: 1px solid var(--bord); padding: 6px 10px; text-align: left; vertical-align: top; }}
  th {{ background: var(--code); }}
  blockquote {{ margin: 1em 0; padding: 4px 14px; border-left: 4px solid var(--bord); color: var(--doux); }}
</style>
</head>
<body>
<nav>{nav}</nav>
<main id="contenu"></main>
<script type="text/markdown" id="md">{markdown}</script>
<script src="https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js"></script>
<script>
  const md = document.getElementById("md").textContent
    .replace(/<\\\/script/gi, "</script");
  const main = document.getElementById("contenu");
  main.innerHTML = marked.parse(md);
  // liens vers les autres documents : .md -> .html
  main.querySelectorAll("a[href$='.md']").forEach(a => a.href = a.getAttribute("href").replace(/\.md$/, ".html"));
  // blocs ```mermaid -> diagrammes
  main.querySelectorAll("pre > code.language-mermaid").forEach(c => {{
    const pre = document.createElement("pre");
    pre.className = "mermaid";
    pre.textContent = c.textContent;
    c.parentElement.replaceWith(pre);
  }});
  const sombre = matchMedia("(prefers-color-scheme: dark)").matches;
  mermaid.initialize({{ startOnLoad: false, theme: sombre ? "dark" : "default", securityLevel: "strict" }});
  mermaid.run();
</script>
</body>
</html>
"""

PAGES = [("README.md", "index.html", "Sommaire"),
         ("utilisation.md", "utilisation.html", "Manuel d'utilisation"),
         ("installation.md", "installation.html", "Installation"),
         ("technique.md", "technique.html", "Documentation technique")]


def main():
    for source, cible, titre in PAGES:
        with open(os.path.join(DOCS, source), encoding="utf-8") as f:
            md = f.read()
        nav = " ".join(
            '<a href="%s"%s>%s</a>' % (c, ' class="actif"' if c == cible else "", html.escape(t))
            for _, c, t in PAGES) + ' <a href="../index.html">← Retour aux papillons</a>'
        # le Markdown est embarqué tel quel : seule la fin de balise script est neutralisée
        md = re.sub(r"</script", r"<\\/script", md, flags=re.I)
        with open(os.path.join(DOCS, cible), "w", encoding="utf-8") as f:
            f.write(PAGE.format(titre=html.escape(titre), nav=nav, markdown=md))
        print(f"docs/{cible}")


if __name__ == "__main__":
    main()
