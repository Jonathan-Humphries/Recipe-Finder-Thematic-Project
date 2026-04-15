-- Drop existing tables in dependency order
DROP TABLE IF EXISTS session CASCADE;
DROP TABLE IF EXISTS account_saved_recipe CASCADE;
DROP TABLE IF EXISTS recipe_ingredient CASCADE;
DROP TABLE IF EXISTS recipe CASCADE;
DROP TABLE IF EXISTS ingredient CASCADE;
DROP TABLE IF EXISTS account CASCADE;

-- ── Ingredients ──────────────────────────────────────────────
CREATE TABLE ingredient (
  id            SERIAL PRIMARY KEY NOT NULL,
  name          TEXT    NOT NULL UNIQUE,
  calories      INTEGER NOT NULL,
  protein       NUMERIC NOT NULL,
  carbohydrates NUMERIC NOT NULL,
  sugar         NUMERIC NOT NULL,
  fat           NUMERIC NOT NULL,
  salt          NUMERIC NOT NULL,
  ratio         NUMERIC NOT NULL  -- multiply per-100g values by this to get per-serving
);

-- ── Recipes ──────────────────────────────────────────────────
CREATE TABLE recipe (
  id          SERIAL  PRIMARY KEY NOT NULL,
  name        TEXT    NOT NULL UNIQUE,
  description TEXT    NOT NULL DEFAULT '',
  image       TEXT    NOT NULL DEFAULT '',
  time_mins   INTEGER NOT NULL DEFAULT 30,
  servings    INTEGER NOT NULL DEFAULT 4,
  difficulty  TEXT    NOT NULL DEFAULT 'Easy',  -- Easy | Medium | Hard
  dietary     TEXT[]  NOT NULL DEFAULT '{}',    -- e.g. {vegetarian,vegan}
  tags        TEXT[]  NOT NULL DEFAULT '{}',    -- e.g. {pasta,italian}
  notes       TEXT    NOT NULL DEFAULT '',
  steps       TEXT[]  NOT NULL DEFAULT '{}'
);

-- ── Recipe ↔ Ingredient join ─────────────────────────────────
CREATE TABLE recipe_ingredient (
  recipe_id     INT REFERENCES recipe(id)     ON DELETE CASCADE,
  ingredient_id INT REFERENCES ingredient(id) ON DELETE CASCADE,
  quantity      NUMERIC NOT NULL DEFAULT 1,
  unit          TEXT    NOT NULL DEFAULT '',
  PRIMARY KEY (recipe_id, ingredient_id)
);

-- ── Accounts ─────────────────────────────────────────────────
CREATE TABLE account (
  id         SERIAL PRIMARY KEY NOT NULL,
  username   TEXT   NOT NULL,
  email      TEXT   NOT NULL UNIQUE,
  pword_hash TEXT   NOT NULL,              -- bcrypt hash
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Sessions ─────────────────────────────────────────────────
CREATE TABLE session (
  token      TEXT PRIMARY KEY,
  account_id INT  REFERENCES account(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Saved Recipes ────────────────────────────────────────────
CREATE TABLE account_saved_recipe (
  recipe_id  INT REFERENCES recipe(id)  ON DELETE CASCADE,
  account_id INT REFERENCES account(id) ON DELETE CASCADE,
  saved_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (recipe_id, account_id)
);
