const fs = require('fs');
const path = require('path');
const pool = require('./db'); // db.js is in the same folder

async function importIngredients() {
  try {
    // Load JSON file from the same directory
    const filePath = path.join(__dirname, 'ingredient.json');
    const raw = fs.readFileSync(filePath, 'utf8');
    const ingredients = JSON.parse(raw);

    console.log(`Importing ${ingredients.length} ingredients...`);

    for (const ing of ingredients) {
      await pool.query(
        `INSERT INTO ingredient 
          (name, calories, protein, carbohydrates, sugar, fat, salt, ratio)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (name) DO NOTHING`,
        [
          ing.name,
          ing.calories,
          ing.protein,
          ing.carbohydrates,
          ing.sugar,
          ing.fat,
          ing.salt,
          ing.ratio
        ]
      );
    }

    console.log("Ingredient import complete");
  } catch (err) {
    console.error("Error importing ingredients:", err);
  } finally {
    pool.end();
  }
}

importIngredients();
