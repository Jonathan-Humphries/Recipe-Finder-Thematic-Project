const express = require('express');
const pool    = require('./db');
const path    = require('path');
const crypto  = require('crypto');
const bcrypt  = require('bcrypt');

const app  = express();
const PORT = process.env.PORT || 3000;
const SALT_ROUNDS = 10;

app.use(express.json());

// Serve the frontend from the /public folder
app.use(express.static(path.join(__dirname, '..', 'public')));


// ── Helpers ───────────────────────────────────────────────────

/** Generate a secure random session token */
function makeToken() {
  return crypto.randomBytes(32).toString('hex');
}

/** Middleware: require a valid session token in the Authorization header.
 *  Sets req.accountId on success. */
async function requireAuth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token  = header.replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const result = await pool.query(
      'SELECT account_id FROM session WHERE token = $1',
      [token]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid or expired session' });
    req.accountId = result.rows[0].account_id;
    next();
  } catch (err) {
    console.error('requireAuth error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

//  AUTH ROUTES

// ── POST /api/auth/signup ─────────────────────────────────────
app.post('/api/auth/signup', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password)
    return res.status(400).json({ error: 'Name, email, and password are required' });

  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });

  try {
    // Check email not already taken
    const existing = await pool.query(
      'SELECT id FROM account WHERE LOWER(email) = LOWER($1)', [email]
    );
    if (existing.rows.length > 0)
      return res.status(409).json({ error: 'An account with this email already exists' });

    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await pool.query(
      'INSERT INTO account (username, email, pword_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username.trim(), email.trim().toLowerCase(), hash]
    );

    const user  = result.rows[0];
    const token = makeToken();

    await pool.query(
      'INSERT INTO session (token, account_id) VALUES ($1, $2)',
      [token, user.id]
    );

    res.status(201).json({
      token,
      user: { id: user.id, name: user.username, email: user.email }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error during signup' });
  }
});


// ── POST /api/auth/login ──────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' });

  try {
    const result = await pool.query(
      'SELECT id, username, email, pword_hash FROM account WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (result.rows.length === 0)
      return res.status(401).json({ error: 'No account found with this email' });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.pword_hash);

    if (!match)
      return res.status(401).json({ error: 'Incorrect password' });

    const token = makeToken();
    await pool.query(
      'INSERT INTO session (token, account_id) VALUES ($1, $2)',
      [token, user.id]
    );

    res.json({
      token,
      user: { id: user.id, name: user.username, email: user.email }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});


// ── POST /api/auth/logout ─────────────────────────────────────
app.post('/api/auth/logout', requireAuth, async (req, res) => {
  const token = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
  try {
    await pool.query('DELETE FROM session WHERE token = $1', [token]);
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


// ── GET /api/auth/me ──────────────────────────────────────────
app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email FROM account WHERE id = $1',
      [req.accountId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const u = result.rows[0];
    res.json({ id: u.id, name: u.username, email: u.email });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


// ── PUT /api/auth/profile — update display name ───────────────
app.put('/api/auth/profile', requireAuth, async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim())
    return res.status(400).json({ error: 'Name cannot be empty' });

  try {
    const result = await pool.query(
      'UPDATE account SET username = $1 WHERE id = $2 RETURNING id, username, email',
      [name.trim(), req.accountId]
    );
    const u = result.rows[0];
    res.json({ id: u.id, name: u.username, email: u.email });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


// ── PUT /api/auth/password — change password ──────────────────
app.put('/api/auth/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword)
    return res.status(400).json({ error: 'Both current and new password are required' });

  if (newPassword.length < 6)
    return res.status(400).json({ error: 'New password must be at least 6 characters' });

  try {
    const result = await pool.query(
      'SELECT pword_hash FROM account WHERE id = $1',
      [req.accountId]
    );

    const match = await bcrypt.compare(currentPassword, result.rows[0].pword_hash);
    if (!match)
      return res.status(401).json({ error: 'Current password is incorrect' });

    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await pool.query(
      'UPDATE account SET pword_hash = $1 WHERE id = $2',
      [newHash, req.accountId]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


// ── DELETE /api/auth/account — delete account ─────────────────
app.delete('/api/auth/account', requireAuth, async (req, res) => {
  try {
    // Cascade will clean up sessions and saved recipes via FK constraints
    await pool.query('DELETE FROM account WHERE id = $1', [req.accountId]);
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

//  INGREDIENT ROUTES

// ── GET /api/ingredients ──────────────────────────────────────
app.get('/api/ingredients', async (req, res) => {
  try {
    const result = await pool.query('SELECT name FROM ingredient ORDER BY name ASC');
    res.json(result.rows.map(r => r.name));
  } catch (err) {
    console.error('Ingredients error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

//  RECIPE ROUTES

/** Helper: fetch full recipe rows with their ingredients as JSON */
async function fetchRecipes(whereClause = '', params = []) {
  const sql = `
    SELECT
      r.id,
      r.name,
      r.description,
      r.image,
      r.time_mins,
      r.servings,
      r.difficulty,
      r.dietary,
      r.tags,
      r.notes,
      r.steps,
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'name',          i.name,
  'quantity',      ri.quantity,
  'unit',          ri.unit,
  'calories',      i.calories,
  'protein',       i.protein,
  'carbohydrates', i.carbohydrates,
  'sugar',         i.sugar,
  'fat',           i.fat,
  'salt',          i.salt,
  'ratio',         i.ratio
          )
          ORDER BY i.name
        ) FILTER (WHERE i.id IS NOT NULL),
        '[]'
      ) AS ingredients
    FROM recipe r
    LEFT JOIN recipe_ingredient ri ON ri.recipe_id = r.id
    LEFT JOIN ingredient        i  ON i.id = ri.ingredient_id
    ${whereClause}
    GROUP BY r.id
    ORDER BY r.id ASC
  `;
  const result = await pool.query(sql, params);
  return result.rows.map(row => ({
    id:          row.id,
    title:       row.name,
    description: row.description,
    image:       row.image,
    time:        `${row.time_mins} min`,
    time_mins:   row.time_mins,
    servings:    row.servings,
    difficulty:  row.difficulty,
    dietary:     row.dietary || [],
    tags:        row.tags    || [],
    notes:       row.notes,
    steps:       row.steps   || [],
    ingredients: row.ingredients
  }));
}


// ── GET /api/recipes — all recipes ───────────────────────────
app.get('/api/recipes', async (req, res) => {
  try {
    const recipes = await fetchRecipes();
    res.json(recipes);
  } catch (err) {
    console.error('Recipes error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


// ── GET /api/recipes/:id — single recipe ─────────────────────
app.get('/api/recipes/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid recipe ID' });

  try {
    const recipes = await fetchRecipes('WHERE r.id = $1', [id]);
    if (recipes.length === 0) return res.status(404).json({ error: 'Recipe not found' });
    res.json(recipes[0]);
  } catch (err) {
    console.error('Recipe by ID error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


// ── POST /api/recipes/search — filter by ingredients & dietary
app.post('/api/recipes/search', async (req, res) => {
  try {
    const { ingredients = [], dietary = [] } = req.body;
    let recipes = await fetchRecipes();

    // Score each recipe by how many selected ingredients it contains
    recipes = recipes.map(recipe => {
      const ingNames = recipe.ingredients.map(i => i.name.toLowerCase());
      let matchCount = 0;
      if (ingredients.length > 0) {
        ingredients.forEach(sel => {
          if (ingNames.some(n => n.includes(sel.toLowerCase()) || sel.toLowerCase().includes(n))) {
            matchCount++;
          }
        });
      }
      const score = ingredients.length > 0
        ? Math.round((matchCount / ingredients.length) * 100)
        : 100;
      return { ...recipe, matchScore: score };
    });

    // Filter by dietary if any selected
    if (dietary.length > 0) {
      recipes = recipes.filter(r =>
        dietary.every(d => r.dietary.includes(d))
      );
    }

    // Sort by match score descending
    recipes.sort((a, b) => b.matchScore - a.matchScore);

    res.json(recipes);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


//  SAVED RECIPES 

// ── GET /api/saved — get all saved recipes for current user ───
app.get('/api/saved', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT recipe_id FROM account_saved_recipe WHERE account_id = $1',
      [req.accountId]
    );
    // Return the full recipe objects for each saved id
    const ids = result.rows.map(r => r.recipe_id);
    if (ids.length === 0) return res.json([]);

    const recipes = await fetchRecipes(
      `WHERE r.id = ANY($1::int[])`,
      [ids]
    );
    res.json(recipes);
  } catch (err) {
    console.error('Get saved error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


// ── GET /api/saved/ids — just the IDs (for checking saved state)
app.get('/api/saved/ids', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT recipe_id FROM account_saved_recipe WHERE account_id = $1',
      [req.accountId]
    );
    res.json(result.rows.map(r => r.recipe_id));
  } catch (err) {
    console.error('Saved IDs error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


// ── POST /api/saved/:id — save a recipe ──────────────────────
app.post('/api/saved/:id', requireAuth, async (req, res) => {
  const recipeId = parseInt(req.params.id);
  if (isNaN(recipeId)) return res.status(400).json({ error: 'Invalid recipe ID' });

  try {
    await pool.query(
      `INSERT INTO account_saved_recipe (recipe_id, account_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [recipeId, req.accountId]
    );
    res.json({ message: 'Recipe saved' });
  } catch (err) {
    console.error('Save recipe error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


// ── DELETE /api/saved/:id — unsave a recipe ───────────────────
app.delete('/api/saved/:id', requireAuth, async (req, res) => {
  const recipeId = parseInt(req.params.id);
  if (isNaN(recipeId)) return res.status(400).json({ error: 'Invalid recipe ID' });

  try {
    await pool.query(
      'DELETE FROM account_saved_recipe WHERE recipe_id = $1 AND account_id = $2',
      [recipeId, req.accountId]
    );
    res.json({ message: 'Recipe unsaved' });
  } catch (err) {
    console.error('Unsave recipe error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


// ═══════════════════════════════════════════════════════════════
//  DATABASE SETUP ROUTE
//  GET /api/setup — run schema + import seed data
// ═══════════════════════════════════════════════════════════════
app.get('/api/setup', async (req, res) => {
  const fs   = require('fs');
  const fsp  = require('fs').promises;

  try {
    // 1. Run the schema SQL
    const sample = fs.readFileSync(path.join(__dirname, 'sample.sql'), 'utf8');
    await pool.query(sample);

    // 2. Seed ingredients
    const ingredients = JSON.parse(
      await fsp.readFile(path.join(__dirname, 'ingredient.json'), 'utf8')
    );
    for (const ing of ingredients) {
      await pool.query(
        `INSERT INTO ingredient (name, calories, protein, carbohydrates, sugar, fat, salt, ratio)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (name) DO NOTHING`,
        [ing.name, ing.calories, ing.protein, ing.carbohydrates, ing.sugar, ing.fat, ing.salt, ing.ratio]
      );
    }

    // 3. Seed recipes + their ingredient links
    const recipes = JSON.parse(
      await fsp.readFile(path.join(__dirname, 'recipe.json'), 'utf8')
    );

    for (const r of recipes) {
      // Insert recipe
      const rResult = await pool.query(
        `INSERT INTO recipe (name, description, image, time_mins, servings, difficulty, dietary, tags, notes, steps)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (name) DO UPDATE SET
           description = EXCLUDED.description,
           image       = EXCLUDED.image,
           time_mins   = EXCLUDED.time_mins,
           servings    = EXCLUDED.servings,
           difficulty  = EXCLUDED.difficulty,
           dietary     = EXCLUDED.dietary,
           tags        = EXCLUDED.tags,
           notes       = EXCLUDED.notes,
           steps       = EXCLUDED.steps
         RETURNING id`,
        [r.name, r.description, r.image, r.time_mins, r.servings,
         r.difficulty, r.dietary, r.tags, r.notes, r.steps]
      );

      const recipeId = rResult.rows[0].id;

      // Link ingredients
      for (const ing of (r.ingredients || [])) {
        // Try to find the ingredient in DB
        const ingResult = await pool.query(
          'SELECT id FROM ingredient WHERE LOWER(name) = LOWER($1)', [ing.name]
        );
        if (ingResult.rows.length > 0) {
          const ingId = ingResult.rows[0].id;
          await pool.query(
            `INSERT INTO recipe_ingredient (recipe_id, ingredient_id, quantity, unit)
             VALUES ($1,$2,$3,$4)
             ON CONFLICT (recipe_id, ingredient_id) DO UPDATE SET
               quantity = EXCLUDED.quantity,
               unit     = EXCLUDED.unit`,
            [recipeId, ingId, ing.quantity, ing.unit]
          );
        }
      }
    }

    res.json({
      message: `Setup complete. ${ingredients.length} ingredients, ${recipes.length} recipes seeded.`
    });
  } catch (err) {
    console.error('Setup error:', err);
    res.status(500).json({ error: err.message });
  }
});


app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});


app.listen(PORT, () => {
  console.log(`🌿 Freshly server running on http://localhost:${PORT}`);
  console.log(`   Visit http://localhost:${PORT}/api/setup to initialise the database`);
});
