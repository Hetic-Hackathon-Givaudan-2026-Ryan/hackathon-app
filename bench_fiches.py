#!/usr/bin/env python3
"""Banc d'essai des fiches prospect (service ia/, route POST /fiche).

À lancer depuis le dossier hackathon-app, avec la stack démarrée
(`docker compose up -d`) :

    python bench_fiches.py

La relecture humaine (faits inventés, français, utilité) reste à faire à la main
dans la feuille review_<modèle>.csv.
"""

import csv
import json
import statistics
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

OUT = Path("bench_results")
RUNNER_FILE = Path("bench_runner.py")
RUNNER_REMOTE = "/tmp/bench_runner.py"
WAIT_MODEL_SECONDS = 20 * 60

SQL = """
SELECT json_build_object(
  'id', p.id, 'name', p.name, 'segment', p.segment, 'activity', p.activity,
  'country', p.country, 'city', p.city, 'size', p.size, 'revenue', p.revenue,
  'reach', p.reach, 'why', p.why, 'history', p.history,
  'signals', (SELECT coalesce(json_agg(json_build_object(
      'kind', s.kind, 'summary', s.summary, 'source', s.source, 'date', s.date::text)
      ORDER BY s.position), '[]'::json) FROM signals s WHERE s.prospect_id = p.id),
  'contacts', (SELECT coalesce(json_agg(json_build_object(
      'name', c.name, 'role', c.role, 'buyingRole', c.buying_role, 'why', c.why)
      ORDER BY c.position), '[]'::json) FROM contacts c WHERE c.prospect_id = p.id)
)
FROM prospects p ORDER BY p.id;
"""

RUNNER = '''
import json, os, sys, time
import httpx

BASE = "http://localhost:8000"
if len(sys.argv) > 1 and sys.argv[1] == "health":
    print(json.dumps(httpx.get(BASE + "/health", timeout=10).json()))
    sys.exit(0)

facts = json.load(sys.stdin)
facts.pop("id", None)
start = time.time()
try:
    r = httpx.post(BASE + "/fiche", json=facts,
                   headers={"X-API-Key": os.environ["API_KEY"]}, timeout=130)
    try:
        body = r.json()
    except ValueError:
        body = {"raw": r.text[:300]}
    out = {"status": r.status_code, "body": body}
except Exception as e:
    out = {"status": 0, "body": {"error": repr(e)}}
out["elapsed"] = round(time.time() - start, 1)
print(json.dumps(out))
'''


def dc(*args, stdin=None):
    r = subprocess.run(
        ["docker", "compose", *args],
        input=stdin, capture_output=True, text=True, encoding="utf-8", errors="replace",
    )
    return r.returncode, r.stdout


def fail(msg):
    sys.exit(f"\nERREUR : {msg}")


def load_prospects():
    code, out = dc("exec", "-T", "db", "psql", "-U", "app", "-d", "app", "-t", "-A", stdin=SQL)
    if code:
        fail("impossible de lire la base. La stack tourne-t-elle ? (docker compose ps)")
    prospects = [json.loads(line) for line in out.splitlines() if line.strip().startswith("{")]
    if not prospects:
        fail("aucun prospect trouvé dans la base.")
    return prospects


def health():
    code, out = dc("exec", "-T", "ia", "python", RUNNER_REMOTE, "health")
    if code:
        return None
    try:
        return json.loads(out.strip().splitlines()[-1])
    except (ValueError, IndexError):
        return None


def wait_model():
    deadline = time.time() + WAIT_MODEL_SECONDS
    last = ""
    while time.time() < deadline:
        h = health()
        if h and h.get("model_ready"):
            return h["model"]
        msg = (h or {}).get("detail", "service ia pas encore joignable")
        if msg != last:
            print(f"  … {msg}")
            last = msg
        time.sleep(10)
    fail("le modèle n'est pas prêt après 20 minutes.")


def ollama_memory():
    code, cid = dc("ps", "-q", "ollama")
    cid = cid.strip()
    if code or not cid:
        return "n/d"
    r = subprocess.run(
        ["docker", "stats", "--no-stream", "--format", "{{.MemUsage}}", cid],
        capture_output=True, text=True, encoding="utf-8", errors="replace",
    )
    return r.stdout.strip() or "n/d"


def main():
    OUT.mkdir(exist_ok=True)
    RUNNER_FILE.write_text(RUNNER, encoding="utf-8")
    try:
        code, _ = dc("cp", str(RUNNER_FILE), f"ia:{RUNNER_REMOTE}")
        if code:
            fail("copie du script dans le conteneur ia impossible (la stack tourne-t-elle ?).")
    finally:
        RUNNER_FILE.unlink(missing_ok=True)

    prospects = load_prospects()
    print(f"{len(prospects)} prospects lus dans la base.")
    print("Attente du modèle du service ia…")
    model = wait_model()
    print(f"Modèle prêt : {model}\n")

    started = datetime.now(timezone.utc)
    results = []
    for i, p in enumerate(prospects, 1):
        code, out = dc("exec", "-T", "ia", "python", RUNNER_REMOTE, stdin=json.dumps(p))
        try:
            res = json.loads(out.strip().splitlines()[-1])
        except (ValueError, IndexError):
            res = {"status": -1, "body": {"error": "sortie illisible"}, "elapsed": 0}
        res["id"], res["name"] = p["id"], p["name"]
        results.append(res)
        print(f"[{i:2}/{len(prospects)}] {p['name']:<22} HTTP {res['status']}  {res['elapsed']} s")

    _, logs = dc("logs", "ia", "--no-log-prefix", "--since", started.strftime("%Y-%m-%dT%H:%M:%SZ"))
    rejected = logs.count("non conforme (essai")

    ok = [r for r in results if r["status"] == 200]
    times = [r["elapsed"] for r in ok]
    stamp = datetime.now().strftime("%Y%m%d-%H%M")
    safe = model.replace(":", "-").replace("/", "-")
    summary = {
        "modele": model,
        "date": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "prospects": len(results),
        "fiches_ok_http200": len(ok),
        "echecs": len(results) - len(ok),
        "rejets_filtre_dans_les_logs": rejected,
        "temps_median_s": round(statistics.median(times), 1) if times else "",
        "temps_moyen_s": round(statistics.mean(times), 1) if times else "",
        "temps_max_s": max(times) if times else "",
        "memoire_ollama": ollama_memory(),
    }

    (OUT / f"results_{safe}_{stamp}.json").write_text(
        json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")

    summary_path = OUT / "summary.csv"
    new_file = not summary_path.exists()
    with summary_path.open("a", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=list(summary))
        if new_file:
            w.writeheader()
        w.writerow(summary)

    with (OUT / f"review_{safe}_{stamp}.csv").open("w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["prospect", "a_retenir", "questions",
                    "faits_inventes (oui/non)", "francais (1-3)", "utilite_questions (1-3)"])
        for r in ok:
            body = r["body"]
            w.writerow([
                r["name"],
                " | ".join(t["text"] for t in body.get("takeaways", [])),
                " | ".join(q["text"] for q in body.get("questions", [])),
                "", "", "",
            ])

    print("\n=== Résumé ===")
    for k, v in summary.items():
        print(f"{k:32} {v}")
    print(f"\nFichiers écrits dans {OUT.resolve()}")


if __name__ == "__main__":
    main()
