const ingredientList = document.getElementById("ingredient-list");
const addBtn = document.getElementById("add-ingredient-btn");


addBtn.addEventListener("click", () => {
  const row = document.createElement("div");
  row.classList.add("ingredient-row");

  row.innerHTML = `
    <input type="text" placeholder="Ingredient ID" class="ingredient-id" />
    <input type="number" placeholder="Qty" class="ingredient-qty" />
    <input type="text" placeholder="Unit" class="ingredient-unit" />
    <button class="remove-btn">X</button>
  `;


  row.querySelector(".remove-btn").addEventListener("click", () => {
    row.remove();
  });

  ingredientList.appendChild(row);
});

document.getElementById("save-recipe-btn").addEventListener("click", () => {
  const rows = document.querySelectorAll(".ingredient-row");

  const ingredients = [];

  rows.forEach(row => {
    const ingredient_id = row.querySelector(".ingredient-id").value;
    const quantity = row.querySelector(".ingredient-qty").value;
    const unit = row.querySelector(".ingredient-unit").value;

    if (ingredient_id) {
      ingredients.push({
        ingredient_id: parseInt(ingredient_id),
        quantity: parseFloat(quantity),
        unit: unit
      });
    }
  });

  console.log(ingredients);

  
  fetch("/api/recipe-ingredients", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      recipe_id: 1, 
      ingredients: ingredients
    })
  });
});