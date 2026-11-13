# Service IA (FastAPI) pour la démo : même code que `uvicorn main:app` en local
FROM python:3.13-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY main.py .

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --start-interval=2s \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health', timeout=2)"
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
