# Chaoticum Papillonae : générateur de papillons + import de planches
FROM python:3.12-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    CP_HOTE=0.0.0.0 \
    CP_PORT=8765 \
    CP_DATA=/app/data

# libglib est nécessaire à OpenCV même en version « headless »
RUN apt-get update \
    && apt-get install -y --no-install-recommends libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY serveur.py extractPapillons.py index.html genClaudePapi.html genQwenPapi.html ./
COPY asset/ asset/
COPY docs/ docs/
COPY papillons_svg/ papillons_svg/
COPY papillons_extraits/ papillons_extraits/

# utilisateur sans privilèges ; seuls les dossiers modifiés par l'import lui appartiennent
RUN useradd --system --uid 1000 --home /app papillon \
    && mkdir -p data asset/img/sources \
    && chown -R papillon:papillon data asset/img/sources papillons_svg papillons_extraits
USER papillon

EXPOSE 8765
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD python3 -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8765/api/moi')" || exit 1

CMD ["python3", "serveur.py"]
