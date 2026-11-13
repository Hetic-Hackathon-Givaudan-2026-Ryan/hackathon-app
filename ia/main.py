"""L'API de l'équipe Data/IA. Swagger : http://localhost:8000/docs"""

import html
import json
import os
import re
import threading
import time
from contextlib import asynccontextmanager
from typing import Annotated, Literal

import httpx
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel

# Configuration dans .env (uvicorn --env-file .env), ou dans compose.yaml pour la démo.
# Sans clé, le service refuse de démarrer.
API_KEY = os.environ["API_KEY"]
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")
MODEL = os.environ.get("MODEL", "llama3.2:1b")
# Délai maximal d'une rédaction de fiche, en secondes
TIMEOUT = float(os.environ.get("FICHE_TIMEOUT", "100"))


# --- Le modèle : téléchargé et chargé par ce service, sans commande manuelle ----
# Un fil de fond attend Ollama, télécharge le modèle s'il manque (avec reprise
# en cas d'erreur), le charge en mémoire, puis vérifie qu'il reste présent.
# Pendant ce temps, /fiche répond 503 avec un message lisible.

ModelState = Literal["attente", "telechargement", "chargement", "pret"]
model_status: dict = {"state": "attente", "progress": None, "detail": "Connexion à Ollama…"}


def set_status(state: ModelState, detail: str, progress: int | None = None) -> None:
    model_status.update(state=state, detail=detail, progress=progress)


def model_present() -> bool:
    tags = httpx.get(f"{OLLAMA_URL}/api/tags", timeout=5).json()
    names = [m["name"] for m in tags.get("models", [])]
    return any(n == MODEL or n == f"{MODEL}:latest" for n in names)


def pull_model() -> None:
    """Télécharge le modèle en suivant la progression ; lève une erreur si le pull échoue."""
    set_status("telechargement", f"Téléchargement du modèle {MODEL}…", 0)
    timeout = httpx.Timeout(30, read=300)
    with httpx.stream("POST", f"{OLLAMA_URL}/api/pull", json={"model": MODEL}, timeout=timeout) as r:
        r.raise_for_status()
        for line in r.iter_lines():
            if not line:
                continue
            event = json.loads(line)
            if "error" in event:
                raise RuntimeError(event["error"])
            total, done = event.get("total"), event.get("completed")
            if total and done is not None and total > 10_000_000:  # la couche des poids
                set_status("telechargement", f"Téléchargement du modèle {MODEL}…", int(100 * done / total))


def load_model() -> None:
    """Charge le modèle en mémoire (requête sans prompt), pour une première fiche rapide."""
    set_status("chargement", f"Chargement du modèle {MODEL} en mémoire…")
    response = httpx.post(
        f"{OLLAMA_URL}/api/generate", json={"model": MODEL, "keep_alive": -1}, timeout=300
    )
    response.raise_for_status()


def keep_model_ready() -> None:
    delay = 2
    while True:
        try:
            if not model_present():
                pull_model()
                continue  # vérifie que le modèle est bien là
            if model_status["state"] != "pret":
                load_model()
                set_status("pret", f"Modèle {MODEL} prêt")
            delay = 2
            time.sleep(30)  # le volume a pu être vidé : on revérifie de temps en temps
        except (httpx.HTTPError, RuntimeError, ValueError) as e:
            if model_status["state"] != "telechargement":
                set_status("attente", "Ollama démarre, nouvel essai dans quelques secondes…")
            print(f"Modèle {MODEL} pas encore prêt ({type(e).__name__}: {e}), nouvel essai dans {delay} s", flush=True)
            time.sleep(delay)
            delay = min(delay * 2, 30)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    threading.Thread(target=keep_model_ready, daemon=True).start()
    yield


app = FastAPI(title="IA de l'équipe Data/IA", version="1.2.0", lifespan=lifespan)


def check_key(x_api_key: str) -> None:
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Clé d'API invalide")


class Question(BaseModel):
    question: str


class Answer(BaseModel):
    answer: str
    model: str


@app.post("/answer")
def answer(body: Question, x_api_key: Annotated[str, Header()] = "") -> Answer:
    """Répond à une question. Exige l'en-tête X-API-Key."""
    check_key(x_api_key)
    # Le travail de l'équipe Data/IA : prompt, RAG, modèle affiné… Ici, Ollama en local.
    response = httpx.post(
        f"{OLLAMA_URL}/api/chat",
        json={
            "model": MODEL,
            "messages": [{"role": "user", "content": body.question}],
            "stream": False,
        },
        timeout=60,
    )
    response.raise_for_status()
    return Answer(answer=response.json()["message"]["content"], model=MODEL)


class Health(BaseModel):
    status: Literal["ok"]
    model: str
    model_ready: bool
    model_state: ModelState
    progress: int | None = None  # pourcentage du téléchargement
    detail: str


@app.get("/health")
def health() -> Health:
    """Le service répond ; dit aussi où en est le modèle (téléchargement, chargement, prêt). Sans clé."""
    return Health(
        status="ok",
        model=MODEL,
        model_ready=model_status["state"] == "pret",
        model_state=model_status["state"],
        progress=model_status["progress"],
        detail=model_status["detail"],
    )


# --- Rédaction de la fiche « À retenir » et « Questions à poser » ---------------
# Le LLM ne reçoit que des faits numérotés et sourcés, et cite le numéro du fait
# qu'il reformule : la source affichée vient du fait, jamais du LLM.


class Signal(BaseModel):
    kind: str
    summary: str
    source: str
    date: str


class Contact(BaseModel):
    name: str
    role: str
    buyingRole: str
    why: str | None = None


class ProspectFacts(BaseModel):
    name: str
    segment: str
    activity: str
    country: str
    city: str
    size: str
    revenue: str | None = None
    reach: str
    why: str
    signals: list[Signal] = []
    contacts: list[Contact] = []
    history: str = ""


class Takeaway(BaseModel):
    text: str
    source: str


class FicheQuestion(BaseModel):
    text: str
    links: list[int] | Literal["contacts"]


class Fiche(BaseModel):
    takeaways: list[Takeaway]
    questions: list[FicheQuestion]
    model: str


SYSTEM = """Tu aides un commercial de Givaudan (arômes et parfums) à préparer un rendez-vous.
On te donne des FAITS numérotés sur un prospect. Tu n'inventes rien : chaque phrase reprend un ou plusieurs faits.
Écris à la troisième personne, sur le prospect (« ils », « l'entreprise »), jamais « nous ».
Recopie le nom du prospect tel quel. Les takeaways parlent du prospect, pas de Givaudan, et ne sont pas des questions.
Réponds uniquement en JSON, en français, avec exactement ces clés :
{"takeaways": [{"text": "une phrase claire, avec **gras** sur l'élément clé", "fact": numéro du fait}],
 "questions": [{"text": "une question ouverte à poser au client", "facts": [numéros des faits liés]}]}
Donne 3 takeaways et 4 questions. Chaque phrase fait moins de 25 mots. Les questions font émerger des besoins implicites (goût, formulation, réglementation, calendrier, décision)."""

# Structure imposée au LLM (sortie structurée d'Ollama) : évite les JSON cassés
SCHEMA = {
    "type": "object",
    "properties": {
        "takeaways": {
            "type": "array",
            "minItems": 3,
            "maxItems": 3,
            "items": {
                "type": "object",
                "properties": {"text": {"type": "string"}, "fact": {"type": "integer"}},
                "required": ["text", "fact"],
            },
        },
        "questions": {
            "type": "array",
            "minItems": 4,
            "maxItems": 4,
            "items": {
                "type": "object",
                "properties": {
                    "text": {"type": "string"},
                    "facts": {"type": "array", "items": {"type": "integer"}},
                },
                "required": ["text", "facts"],
            },
        },
    },
    "required": ["takeaways", "questions"],
}

# Signes d'une réponse à jeter : consigne recopiée ou texte écrit au nom de Givaudan
BAD = re.compile(r"phrase (claire|courte)|\b(nous|notre|nos|je)\b", re.I)

MONTHS = "janv. févr. mars avr. mai juin juil. août sept. oct. nov. déc.".split()


def fr_date(iso: str) -> str:
    year, month, day = iso[:10].split("-")
    return f"{int(day)} {MONTHS[int(month) - 1]} {year}"


def facts_of(p: ProspectFacts) -> list[dict]:
    """Les faits numérotés : texte, source, et s'il s'agit d'un interlocuteur."""
    revenue = f" (CA estimé {p.revenue})" if p.revenue else ""
    company = f"{p.size}{revenue} · {p.activity} · {p.city}, {p.country} · portée {p.reach.lower()}"
    facts = [{"text": f"Entreprise : {company}.", "source": "Fiche entreprise"}]
    facts += [
        {"text": f"{s.kind} : {s.summary}", "source": f"{s.source} · {fr_date(s.date)}"}
        for s in p.signals
    ]
    facts.append({"text": f"Pourquoi maintenant : {p.why}", "source": "Synthèse des signaux"})
    facts += [
        {
            "text": f"Interlocuteur : {c.name}, {c.role}, rôle dans l'achat : {c.buyingRole}"
            + (f", {c.why}" if c.why else ""),
            "source": "Interlocuteurs identifiés",
            "contact": True,
        }
        for c in p.contacts
    ]
    if p.history:
        facts.append({"text": f"Historique Givaudan : {p.history}", "source": "Historique Givaudan"})
    return facts


def tidy(text: str, bold: bool) -> str:
    """Retire les ** en trop (ou tous, si le gras n'est pas voulu)."""
    text = " ".join(html.unescape(text).split()).strip("«»\" :;-–")
    if not bold or text.count("**") % 2:
        text = text.replace("**", "")
    return text[:1].upper() + text[1:]


def links_of(refs: list[int], facts: list[dict], point_of: dict[int, int]) -> list[int] | Literal["contacts"]:
    """Points « À retenir » liés à une question, ou « contacts » si elle porte sur un interlocuteur."""
    if any(facts[i - 1].get("contact") for i in refs):
        return "contacts"
    return sorted({point_of[i] for i in refs if i in point_of}) or [1]


def clean(facts: list[dict], out: dict) -> tuple[list[Takeaway], list[FicheQuestion]] | None:
    """Garde seulement ce qui est conforme ; None si l'ensemble est inutilisable."""

    def ref(x) -> int | None:
        try:
            i = int(x)
        except (TypeError, ValueError):
            return None
        return i if 1 <= i <= len(facts) else None

    takeaways: list[Takeaway] = []
    point_of: dict[int, int] = {}  # numéro du fait -> numéro du point « À retenir »
    for t in out.get("takeaways") or []:
        if not (isinstance(t, dict) and isinstance(t.get("text"), str) and t["text"].strip()):
            continue
        i = ref(t.get("fact"))
        # Un point doit reprendre un fait sourcé, et ne pas être une question
        if not i or "?" in t["text"] or len(takeaways) == 3:
            continue
        takeaways.append(Takeaway(text=tidy(t["text"], bold=True), source=facts[i - 1]["source"]))
        point_of.setdefault(i, len(takeaways))

    questions: list[FicheQuestion] = []
    for q in out.get("questions") or []:
        if not (isinstance(q, dict) and isinstance(q.get("text"), str) and q["text"].strip()):
            continue
        refs = [i for i in (ref(x) for x in q.get("facts") or []) if i]
        questions.append(FicheQuestion(text=tidy(q["text"], bold=False), links=links_of(refs, facts, point_of)))
    questions = questions[:4]

    texts = [t.text for t in takeaways] + [q.text for q in questions]
    if any(BAD.search(x) for x in texts) or len(takeaways) < 2 or len(questions) < 2:
        return None
    return takeaways, questions


@app.post(
    "/fiche",
    responses={
        502: {"description": "Réponse du LLM inutilisable"},
        503: {"description": "Modèle pas encore prêt (téléchargement ou chargement en cours)"},
        504: {"description": "Ollama injoignable ou trop lent"},
    },
)
def fiche(body: ProspectFacts, x_api_key: Annotated[str, Header()] = "") -> Fiche:
    """Rédige « À retenir » et « Questions à poser » à partir des faits du prospect. Exige X-API-Key."""
    check_key(x_api_key)
    if model_status["state"] != "pret":
        progress = model_status["progress"]
        raise HTTPException(
            status_code=503,
            detail=model_status["detail"] + (f" ({progress} %)" if progress is not None else ""),
        )
    facts = facts_of(body)
    prompt = f"Prospect : {body.name} · {body.segment} · {body.activity}\nFAITS :\n" + "\n".join(
        f"{i}. {f['text']}" for i, f in enumerate(facts, 1)
    )
    try:
        response = httpx.post(
            f"{OLLAMA_URL}/api/chat",
            json={
                "model": MODEL,
                "messages": [
                    {"role": "system", "content": SYSTEM},
                    {"role": "user", "content": prompt},
                ],
                "format": SCHEMA,
                "stream": False,
                "options": {"temperature": 0.2, "num_predict": 600, "repeat_penalty": 1.15},
                "keep_alive": "30m",  # modèle gardé en mémoire entre deux fiches
            },
            timeout=TIMEOUT,
        )
        response.raise_for_status()
        out = json.loads(response.json()["message"]["content"])
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:  # modèle supprimé entre-temps : le fil de fond le retélécharge
            set_status("attente", f"Modèle {MODEL} introuvable, nouveau téléchargement…")
            raise HTTPException(status_code=503, detail=model_status["detail"])
        raise HTTPException(status_code=504, detail=f"Ollama : {e.response.status_code} {e.response.text[:200]}")
    except httpx.HTTPError as e:
        raise HTTPException(status_code=504, detail=f"Ollama injoignable ou trop lent : {type(e).__name__}")
    except (ValueError, KeyError):
        raise HTTPException(status_code=502, detail="Réponse du LLM illisible")
    cleaned = clean(facts, out if isinstance(out, dict) else {})
    if not cleaned:
        raise HTTPException(status_code=502, detail="Réponse du LLM non conforme (faits non cités ou texte à la première personne)")
    takeaways, questions = cleaned
    return Fiche(takeaways=takeaways, questions=questions, model=MODEL)
