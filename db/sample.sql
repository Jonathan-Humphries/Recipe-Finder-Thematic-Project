CREATE TABLE users (
    ID int NOT NULL,
    FirstName varchar(255),
    LastName varchar(255),
    Email varchar(255),
    Age int,
    UserWeight int,
    goalWeight int,
    CalorieGoal int,
    PRIMARY KEY (ID)
);

INSERT INTO users (id, FirstName, LastName, Email, Age, UserWeight, CalorieGoal) 
VALUES (57981, 'Paul', 'Smith', '57981@example.com', 56, 65, 2500);

CREATE TABLE food (
    ID SERIAL,
    FoodType varchar(255),
    FoodName varchar(255),
    CalorieCount int,
    UserID int,
    DiaryDate date,
    PRIMARY KEY (ID),
    FOREIGN KEY (UserID) REFERENCES users(ID)
);

INSERT INTO food (FoodType, FoodName, CalorieCount, UserID, DiaryDate) 
VALUES 
('breakfast', 'food 1', 120, 57981, '2025-12-14'),
('breakfast', 'food 2', 73, 57981, '2025-12-14'), 
('lunch', 'food 3', 75, 57981, '2025-12-14'), 
('lunch', 'food 4', 98, 57981, '2025-12-14'), 
('dinner', 'food 5', 166, 57981, '2025-12-14');

CREATE TABLE exercise (
    ID SERIAL,
    ExerciseType varchar(255),
    ExerciseName varchar(255),
    CalorieCount int,
    UserID int,
    DiaryDate date,
    PRIMARY KEY (ID),
    FOREIGN KEY (UserID) REFERENCES users(ID)
);

INSERT INTO exercise (ExerciseType, ExerciseName, CalorieCount, UserID, DiaryDate) 
VALUES 
('directions_walk', 'Walk 1', 265, 57981, '2025-12-14'),
('hiking', 'Hike 2', 587, 57981, '2025-12-14'), 
('pool', 'Swim 3', 396, 57981, '2025-12-14');