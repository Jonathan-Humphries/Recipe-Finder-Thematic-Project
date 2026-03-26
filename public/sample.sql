CREATE TABLE ingredient(
	id SERIAL PRIMARY KEY NOT NULL,

	name TEXT NOT NULL,

	calories INT NOT NULL, --all nutrients per 100g

	protein INT NOT NULL,

	carbohydrates INT NOT NULL,

	sugar INT NOT NULL,

	fat INT NOT NULL,

	salt INT NOT NULL,
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