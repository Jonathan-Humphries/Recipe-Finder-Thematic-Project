CREATE TABLE ingredient(
	id SERIAL PRIMARY KEY NOT NULL,

	name TEXT NOT NULL,

	calories NUMERIC NOT NULL, --all nutrients per 100g

	protein NUMERIC NOT NULL,

	carbohydrates NUMERIC NOT NULL,

	sugar NUMERIC NOT NULL,

	fat NUMERIC NOT NULL,

	salt NUMERIC NOT NULL,

	ratio NUMERIC NOT NULL,  -- multiply nutrients by this number to get them per serving
)

CREATE TABLE recipe(
	id SERIAL PRIMARY KEY NOT NULL,

	name TEXT NOT NULL,

	instructions TEXT NOT NULL,
)

CREATE TABLE recipe_ingredient (
    recipe_id INT REFERENCES recipe(id),
    ingredient_id INT REFERENCES ingredient(id),
    quantity NUMERIC,
    unit TEXT,
    PRIMARY KEY (recipe_id, ingredient_id)
);

CREATE TABLE account(
	id SERIAL PRIMARY KEY NOT NULL,

	username TEXT NOT NULL,

	pword  TEXT NOT NULL,

	email TEXT NOT NULL,
)

CREATE TABLE account_saved_recipe (
    recipe_id INT REFERENCES recipe(id),
    account_id INT REFERENCES account(id),
    quantity NUMERIC,						-- number of amounts of servings
    unit TEXT,								-- servings or grams etc
    PRIMARY KEY (recipe_id, account_id)
);
