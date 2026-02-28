const express = require('express')
const pool = require('./db')
const port = 3000

const app = express()
app.use(express.json())

app.get('/', async (req, res) =>{
    try{
        const data = await pool.query('SELECT * FROM ingredients')
        res.status(200).send({ingredients: data.rows})

    }   catch (err){
            console.log(error)
            res.sendStatus(500)
    } 
    res.sendStatus(200)
})

app.post('/', async (req, res) => {
    const {name, calories, protein, carbohydrates, sugar, fat, salt} = req.body
    try{
        await pool.query('INSERT INTO ingredients (name, calories, protein, carbohydrates, sugar, fat, salt) VALUES ($1, $2)', [name, calories, protein, carbohydrates, sugar, fat, salt])
        res.status(200).send({message: "Successfully added ingredient"})

    }   catch (err){
            console.log(error)
            res.sendStatus(500)
    } 
})

app.get('/setup', async (req, res) => {
    try{
        await pool.query('CREATE TABLE ingredients( id SERIAL PRIMARY KEY, name VARCHAR(100), calories int, protein int, carbohydrates int, sugar int, fat int, salt int, )')
    } catch (err){
        console.log(err)
        res.sendStatus(500)
    }
})

app.listen(port, () => console.log('server started on port ', port))