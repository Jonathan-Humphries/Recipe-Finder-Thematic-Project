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
