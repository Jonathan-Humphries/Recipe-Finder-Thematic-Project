const fs = require('fs');
const path = require('path');
const pool = require('./db'); // db.js is in the same folder

async function importRecipes() {
  try {
    // Load JSON file from the same directory
    const filePath = path.join(__dirname, 'recipe.json');
    const raw = fs.readFileSync(filePath, 'utf8');
    const recipes = JSON.parse(raw);

    console.log(`Importing ${recipes.length} recipes...`);

    for (const ing of recipes) {
      await pool.query(
        `INSERT INTO recipe
          (name, instructions)
         VALUES ($1,$2)
         ON CONFLICT (name) DO NOTHING`,
        [
          ing.name,
          ing.instructions
        ]
      );
    }

    console.log("recipe import complete");
  } catch (err) {
    console.error("Error importing recipes:", err);
  } finally {
    pool.end();
  }
}

importRecipes();
