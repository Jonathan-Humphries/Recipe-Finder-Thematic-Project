const express = require('express')
const pool = require('./db')
const path = require('path')
const port = 3000

const app = express()
app.use(express.json())


app.use(express.static(path.join(__dirname, 'public')));


app.get('/ingredients', async (req, res) =>{
    try{
        const data = await pool.query('SELECT * FROM ingredients')
        res.status(200).send({ingredients: data.rows})

    }   catch (err){
            console.log(err)
            res.sendStatus(500)
    } 
})

app.post('/ingredients', async (req, res) => {
    const {name, calories, protein, carbohydrates, sugar, fat, salt, ratio} = req.body
    try{
        await pool.query('INSERT INTO ingredients (name, calories, protein, carbohydrates, sugar, fat, salt, ratio) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [name, calories, protein, carbohydrates, sugar, fat, salt, ratio])
        res.status(200).send({message: "Successfully added ingredient"})

    }   catch (err){
            console.log(err)
            res.sendStatus(500)
    } 
})

app.get('/setup', async (req, res) => {
    try{
        await pool.query('CREATE TABLE IF NOT EXISTS ingredients( id SERIAL PRIMARY KEY, name VARCHAR(100), calories int, protein int, carbohydrates int, sugar int, fat int, salt int )')
        res.status(200).send("Table created")
    } catch (err){
        console.log(err)
        res.sendStatus(500)
    }
})

app.listen(port, () => console.log('server started on port ', port))