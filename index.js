const express = require('express');
const {Pool} = require("pg");
const app = express();

app.use(express.json());

const pool = new Pool({
    user: 'admin',
    host: 'localhost',
    database: 'shop_db',
    password: 'password123',
    port: 5432
})

app.post('/products', async (req, res) => {
    try {
        const { name, description, price, stock_quantity } = req.body;
        // SQL Injection safe query using $1, $2, etc.
        const query = `
        INSERT INTO products (name, description, price, stock_quantity)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
        `;
        const values = [name, description, price, stock_quantity];
        const result  = await pool.query(query, values);
        res.status(201).json(result.rows[0])
     } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

app.get("/products", async (req, res)=>{
    try{
        const { min_price, page = 1, limit = 5 } = req.query;


        const offset = (page - 1) * limit;

        let queryText = 'SELECT * FROM products';
        const queryParams = [];
        let paramIndex = 1;

        if(min_price) {
            queryText += ` WHERE price >= $${paramIndex}`;
            queryParams.push(min_price);
            paramIndex++;
        }

        queryText += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(limit, offset);

        const result = await pool.query(queryText, queryParams);
        res.json(result.rows)
    }catch(err){
        console.log(err);
        res.status(500).send('Server Error');
    }
});

app.listen(3000, ()=>{
    console.log('Shop Backend runnning on port 3000')
})