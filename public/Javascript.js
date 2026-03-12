// local state to track ingridients
let availableIngredients = [];
let reciples = [];

//gets ingredients from server
async function fetchAllIngredients() {
  try {
    const response = await fetch('/api/ingredients');
    availableIngredientns = await respone.json();
    console.log("Ingredients loaded:", availableIngredients);
  } catch (error) {
    console.error("Error getting ingredients:", error);
  }
}

//get recipes based on ingredients and amounts
async function findRecipes() 
{
  method: 'POST',
    headers: { 'Content-Type': 'application/json'},
  body: JSON.stringify({ inventory: availableIngredients })
});
recipes = await response.json();
populatedRecipePage();
} catch (error) {
  console.error("Error getting recipes:", error);
}
}

//fill recipe page with recipe data
function populatedRecipePage()
const container = document.getElementById('recipe-display');
container.innerHTML -''; // clears old results

recipes.forEach(recipe => {
  const div = document.creareElement('div');
  div.className = 'recipe-card':
  div.innerHTML = `
  <h3>${recipe.name}</h3>
            <p>Ingredients: ${recipe.ingredients.join(', ')}</p>
            <button onclick="completeRecipe('${recipe.id}')">Make This</button>
        `;
        container.appendChild(div);
    });
}

//change available ingredients upon completion
function completeRecipe(recipeId) {
    const recipe = recipes.find(r => r.id === recipeId);
    if (recipe) {
        // Subtract amounts (simplified logic)
        recipe.ingredients.forEach(reqIng => {
            const index = availableIngredients.findIndex(i => i.name === reqIng.name);
            if (index !== -1) {
                availableIngredients[index].amount -= reqIng.amount;
            }
        });
        alert(`Finished making ${recipe.name}! Inventory updated.`);
        // Refresh UI
        populateRecipePage();
    }
}

//set available ingredients based on user input
function setUserIngredients() {
    const inputField = document.getElementById('ingredient-input');
    const newItems = inputField.value.split(',').map(item => ({
        name: item.trim(),
        amount: 1 // Defaulting to 1 for basic example
    }));
    
    availableIngredients = [...availableIngredients, ...newItems];
    alert("Inventory updated manually!");
}
