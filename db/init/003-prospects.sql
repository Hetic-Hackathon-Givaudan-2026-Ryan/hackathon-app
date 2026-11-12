-- Prospects du dashboard (jalon M2). Le contrat côté front est web/src/types.ts.

CREATE TABLE prospects (
  id TEXT PRIMARY KEY, -- identifiant lisible, utilisé dans l'URL de la fiche
  name TEXT NOT NULL,
  segment TEXT NOT NULL CHECK (segment IN ('Taste & Wellbeing', 'Fragrance & Beauty')),
  activity TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  size TEXT NOT NULL CHECK (size IN ('PME', 'ETI', 'GE')),
  revenue TEXT, -- CA estimé, déjà mis en forme
  reach TEXT NOT NULL CHECK (reach IN ('Locale', 'Régionale', 'Internationale')),
  website TEXT NOT NULL,
  why TEXT NOT NULL, -- « Pourquoi maintenant »
  history TEXT NOT NULL, -- historique des échanges avec Givaudan
  score_total INTEGER NOT NULL CHECK (score_total BETWEEN 0 AND 100),
  score_trend INTEGER NOT NULL DEFAULT 0, -- évolution récente, en points
  score_reliability TEXT NOT NULL CHECK (score_reliability IN ('élevée', 'moyenne', 'faible')),
  score_sources INTEGER NOT NULL,
  -- Détail du score : les 3 axes (Potentiel, Opportunité, Accessibilité),
  -- avec leurs critères et leurs notes, au format ScoreAxis de types.ts
  score_axes JSONB NOT NULL
);

-- Signaux d'achat, le plus marquant en premier (position 1)
CREATE TABLE signals (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  prospect_id TEXT NOT NULL REFERENCES prospects (id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  kind TEXT NOT NULL,
  summary TEXT NOT NULL,
  source TEXT NOT NULL,
  date DATE NOT NULL,
  UNIQUE (prospect_id, position)
);

CREATE TABLE contacts (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  prospect_id TEXT NOT NULL REFERENCES prospects (id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  since TEXT,
  buying_role TEXT NOT NULL,
  why TEXT,
  email TEXT NOT NULL,
  recommended BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (prospect_id, position)
);

-- Fiches rédigées par l'IA : « À retenir » et « Questions à poser ».
-- On garde l'historique : la fiche affichée est la plus récente.
CREATE TABLE fiches (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  prospect_id TEXT NOT NULL REFERENCES prospects (id) ON DELETE CASCADE,
  takeaways JSONB NOT NULL, -- Takeaway[] de types.ts
  questions JSONB NOT NULL, -- Question[] de types.ts
  model TEXT NOT NULL, -- modèle qui a rédigé la fiche
  origin TEXT NOT NULL CHECK (origin IN ('seed', 'regeneration')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX fiches_latest ON fiches (prospect_id, created_at DESC);
