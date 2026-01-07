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

app.post("/categories", async(req, res) => {
    try{
        const { name } = req.body;
        const result = await pool.query(
            'INSERT INTO categories (name) VALUES ($1) RETURNING *',
            [name]
        );
        res.status(201).json(result.rows[0])
    }catch(err){
        console.log(err);
        res.status(500).send('Internal server error')
    }
});

app.get("/product-details", async(req, res)=>{
    try{
        const query = `
        SELECT
            p.id, 
            p.name as product_name,
            p.price,
            c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id;
        `;
        const result = await pool.query(query);
        res.json(result.rows)
    }catch(err){
        console.log(err);
        res.status(500).send(err.message)
    }
})

app.listen(8000, ()=>{
    console.log('Shop Backend runnning on port 8000')
})