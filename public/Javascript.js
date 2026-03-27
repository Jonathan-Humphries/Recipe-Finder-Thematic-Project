// ─── Local state ────────────────────────────────────────────
let availableIngredients = [];
let recipes = [];

// ─── Fetch all ingredients from server ──────────────────────
async function fetchAllIngredients() {
  try {
    const response = await fetch('/api/ingredients');
    availableIngredients = await response.json();
    console.log('Ingredients loaded:', availableIngredients);
  } catch (error) {
    console.error('Error getting ingredients:', error);
  }
}

// ─── Set ingredients from the text input field ──────────────
function setUserIngredients() {
  const inputField = document.getElementById('ingredient-input');
  if (!inputField || !inputField.value.trim()) return;

  const newItems = inputField.value.split(',').map(item => ({
    name: item.trim(),
    amount: 1
  }));

  availableIngredients = [...availableIngredients, ...newItems];
  inputField.value = '';

  // Update the count bubble
  const bubble = document.querySelector('.count-bubble');
  if (bubble) bubble.textContent = availableIngredients.length;

  // Show tags under the input
  renderIngredientTags();
}

// ─── Render ingredient tags below input ─────────────────────
function renderIngredientTags() {
  const container = document.querySelector('.selected-ingredients');
  if (!container) return;
  container.innerHTML = availableIngredients.map((ing, i) => `
    <span class="ingredient-tag">
      ${ing.name}
      <button class="tag-remove" onclick="removeIngredient(${i})">×</button>
    </span>
  `).join('');
}

// ─── Remove a single ingredient tag ─────────────────────────
function removeIngredient(index) {
  availableIngredients.splice(index, 1);
  const bubble = document.querySelector('.count-bubble');
  if (bubble) bubble.textContent = availableIngredients.length;
  renderIngredientTags();
}

// ─── Find recipes based on current ingredients ──────────────
async function findRecipes() {
  try {
    const response = await fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inventory: availableIngredients })
    });
    recipes = await response.json();
    populateRecipePage();
  } catch (error) {
    console.error('Error getting recipes:', error);
  }
}

// ─── Fill recipe grid with recipe data ──────────────────────
function populateRecipePage() {
  const container = document.getElementById('recipe-display');
  if (!container) return;
  container.innerHTML = '';

  recipes.forEach(recipe => {
    const div = document.createElement('div');
    div.className = 'recipe-card';
    div.innerHTML = `
      <div class="card-image-wrap">
        <img src="${recipe.image || 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80'}" alt="${recipe.name}">
        <span class="card-badge">Easy</span>
        <button class="btn-save-card" onclick="saveRecipe(${JSON.stringify(recipe).replace(/"/g, '&quot;')})">🤍</button>
      </div>
      <div class="card-body">
        <h3 class="card-title">${recipe.name}</h3>
        <p class="card-desc">Ingredients: ${recipe.ingredients.map(i => i.name || i).join(', ')}</p>
      </div>
      <div class="card-footer">
        <button class="btn-view-recipe" onclick="completeRecipe('${recipe.id}')">Make This →</button>
      </div>
    `;
    container.appendChild(div);
  });
}

// ─── Mark recipe as made, subtract ingredients ──────────────
function completeRecipe(recipeId) {
  const recipe = recipes.find(r => r.id === recipeId);
  if (recipe) {
    recipe.ingredients.forEach(reqIng => {
      const index = availableIngredients.findIndex(i => i.name === reqIng.name);
      if (index !== -1) {
        availableIngredients[index].amount -= reqIng.amount;
      }
    });
    alert(`Finished making ${recipe.name}! Inventory updated.`);
    populateRecipePage();
  }
}

// ─── Save a recipe to the server ────────────────────────────
async function saveRecipe(newRecipe) {
  try {
    const response = await fetch('/api/recipes/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecipe)
    });
    if (response.ok) alert('Recipe saved to server!');
  } catch (error) {
    console.error('Error saving recipe:', error);
  }
}

// ─── Wire up on page load ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // Load ingredients from server on startup
  fetchAllIngredients();

  // "Find recipes" button
  const findBtn = document.querySelector('.btn-find-recipes');
  if (findBtn) {
    findBtn.addEventListener('click', () => {
      // If user typed something but didn't press Enter, grab it first
      const inputField = document.getElementById('ingredient-input');
      if (inputField && inputField.value.trim()) setUserIngredients();
      findRecipes();
    });
  }

  // Add ingredient on Enter key
  const inputField = document.getElementById('ingredient-input');
  if (inputField) {
    inputField.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        setUserIngredients();
      }
    });
  }

  // Quick-add tag buttons
  document.querySelectorAll('.quick-tag').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.textContent.replace(/[^\w\s]/g, '').trim();
      availableIngredients.push({ name, amount: 1 });
      const bubble = document.querySelector('.count-bubble');
      if (bubble) bubble.textContent = availableIngredients.length;
      renderIngredientTags();
    });
  });
});