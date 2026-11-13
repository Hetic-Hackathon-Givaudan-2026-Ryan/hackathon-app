import express from 'express';
import pg from 'pg';

// En dev, la configuration vient de api/.env ; en production, de l'hébergeur
try {
  process.loadEnvFile();
} catch {
  // Pas de .env : on garde l'environnement tel quel
}

const { DATABASE_URL, AI_BASE_URL, AI_MODEL, AI_API_KEY = '' } = process.env;
// Service IA de l'équipe Data/IA (ia/main.py), qui rédige les fiches prospect
const { IA_URL, IA_API_KEY = '' } = process.env;
const FICHE_TIMEOUT_MS = Number(process.env.FICHE_TIMEOUT_MS ?? 110_000);
const PORT = Number(process.env.PORT ?? 3000);

const db = new pg.Pool({ connectionString: DATABASE_URL });
const app = express();
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  const { rows } = await db.query('SELECT version()');
  res.json({ status: 'ok', db: rows[0].version });
});

app.get('/api/questions', async (_req, res) => {
  const { rows } = await db.query(
    'SELECT * FROM questions ORDER BY id DESC LIMIT 10',
  );
  res.json(rows);
});

app.post('/api/questions', async (req, res) => {
  const question = String(req.body?.question ?? '').trim();
  if (!question) {
    res.status(400).json({ error: 'Question manquante' });
    return;
  }
  const answer = await ask(question);
  const { rows } = await db.query(
    'INSERT INTO questions (question, answer) VALUES ($1, $2) RETURNING *',
    [question, answer],
  );
  res.status(201).json(rows[0]);
});

// --- Prospects (jalon M2) ---------------------------------------------------
// Une ligne par prospect, au format Prospect de web/src/types.ts : signaux,
// interlocuteurs et fiche la plus récente sont agrégés par PostgreSQL.
const PROSPECTS_SQL = `
  SELECT * FROM (
    SELECT p.*,
      row_number() OVER (ORDER BY p.score_total DESC, p.name) AS rank,
      COALESCE((
        SELECT json_agg(json_build_object(
          'kind', s.kind, 'summary', s.summary, 'source', s.source,
          'date', to_char(s.date, 'YYYY-MM-DD')) ORDER BY s.position)
        FROM signals s WHERE s.prospect_id = p.id), '[]') AS signals,
      COALESCE((
        SELECT json_agg(json_strip_nulls(json_build_object(
          'name', c.name, 'role', c.role, 'since', c.since,
          'buyingRole', c.buying_role, 'why', c.why, 'email', c.email,
          'recommended', c.recommended)) ORDER BY c.position)
        FROM contacts c WHERE c.prospect_id = p.id), '[]') AS contacts,
      f.takeaways, f.questions, f.model AS fiche_model,
      f.origin AS fiche_origin, f.created_at AS fiche_created_at
    FROM prospects p
    LEFT JOIN LATERAL (
      SELECT * FROM fiches WHERE prospect_id = p.id
      ORDER BY created_at DESC, id DESC LIMIT 1
    ) f ON true
  ) x`;

// Les lignes renvoyées par pg ne sont pas typées
type Row = Record<string, unknown> & { fiche_created_at?: Date | null };

function toProspect(r: Row) {
  return {
    id: r.id,
    name: r.name,
    segment: r.segment,
    activity: r.activity,
    country: r.country,
    city: r.city,
    size: r.size,
    revenue: r.revenue ?? undefined,
    reach: r.reach,
    website: r.website,
    why: r.why,
    score: {
      total: r.score_total,
      trend: r.score_trend,
      rank: Number(r.rank),
      reliability: r.score_reliability,
      sources: r.score_sources,
      axes: r.score_axes,
    },
    signals: r.signals,
    takeaways: r.takeaways ?? [],
    questions: r.questions ?? [],
    contacts: r.contacts,
    history: r.history,
    fiche: r.fiche_created_at
      ? {
          model: r.fiche_model,
          origin: r.fiche_origin,
          createdAt: r.fiche_created_at.toISOString(),
        }
      : undefined,
  };
}

async function findProspect(id: string) {
  const { rows } = await db.query(`${PROSPECTS_SQL} WHERE id = $1`, [id]);
  return rows[0] ? toProspect(rows[0]) : undefined;
}

app.get('/api/prospects', async (_req, res) => {
  const { rows } = await db.query(`${PROSPECTS_SQL} ORDER BY rank`);
  res.json(rows.map(toProspect));
});

app.get('/api/prospects/:id', async (req, res) => {
  const prospect = await findProspect(req.params.id);
  if (!prospect) {
    res.status(404).json({ error: 'Prospect introuvable' });
    return;
  }
  res.json(prospect);
});

// Régénère la fiche avec le service IA. Si l'IA échoue ou dépasse le délai,
// la fiche déjà en base est renvoyée telle quelle (status « repli »).
app.post('/api/prospects/:id/fiche', async (req, res) => {
  const prospect = await findProspect(req.params.id);
  if (!prospect) {
    res.status(404).json({ error: 'Prospect introuvable' });
    return;
  }
  try {
    const fiche = await writeFiche(prospect);
    await db.query(
      `INSERT INTO fiches (prospect_id, takeaways, questions, model, origin)
       VALUES ($1, $2, $3, $4, 'regeneration')`,
      [
        prospect.id,
        JSON.stringify(fiche.takeaways),
        JSON.stringify(fiche.questions),
        fiche.model,
      ],
    );
    res.json({
      status: 'regeneree',
      prospect: await findProspect(req.params.id),
    });
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    console.warn(
      `Fiche ${prospect.id} : repli sur la fiche existante (${reason})`,
    );
    res.json({ status: 'repli', reason, prospect });
  }
});

interface Fiche {
  takeaways: unknown[];
  questions: unknown[];
  model: string;
}

async function writeFiche(prospect: object): Promise<Fiche> {
  if (!IA_URL) throw new Error('IA_URL non configurée');
  let response: Response;
  try {
    response = await fetch(`${IA_URL}/fiche`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': IA_API_KEY },
      body: JSON.stringify(prospect),
      signal: AbortSignal.timeout(FICHE_TIMEOUT_MS),
    });
  } catch (e) {
    if (e instanceof Error && e.name === 'TimeoutError')
      throw new Error(`délai de ${FICHE_TIMEOUT_MS / 1000} s dépassé`, {
        cause: e,
      });
    throw new Error('service IA injoignable', { cause: e });
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    console.warn(`Service IA : ${response.status} ${body.detail ?? ''}`);
    // 503 : modèle en cours de téléchargement, le message est déjà lisible
    if (response.status === 503 && body.detail) throw new Error(body.detail);
    throw new Error(
      response.status === 502
        ? 'la réponse de l’IA était inutilisable'
        : 'l’IA n’a pas répondu à temps',
    );
  }
  return response.json();
}

// État du modèle d'IA, pour que le front annonce un téléchargement en cours
app.get('/api/ia', async (_req, res) => {
  try {
    if (!IA_URL) throw new Error('IA_URL non configurée');
    const response = await fetch(`${IA_URL}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    const h = await response.json();
    res.json({
      model: h.model,
      ready: h.model_ready,
      state: h.model_state,
      progress: h.progress ?? undefined,
      detail: h.detail,
    });
  } catch {
    res.json({
      ready: false,
      state: 'injoignable',
      detail: 'Service IA injoignable',
    });
  }
});

// Même appel pour Ollama, Mistral, OpenAI… : seule la configuration change
async function ask(question: string): Promise<string> {
  const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [{ role: 'user', content: question }],
    }),
  });
  if (!response.ok) {
    throw new Error(`IA : ${response.status} ${await response.text()}`);
  }
  const data = await response.json();
  return data.choices[0].message.content;
}

// Sans adresse, Node écoute sur toutes les interfaces : joignable hors du conteneur
app.listen(PORT, () => console.log(`API sur http://localhost:${PORT}`));
