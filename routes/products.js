
const express = require('express');

module.exports = (pool) => {
    const router = express.Router();

    // Получить список продуктов
    router.get('/', async (req, res) => {
        try {
            const result = await pool.query('SELECT * FROM products ORDER BY name');
            res.json(result.rows);
        } catch (err) {
            res.status(500).json({ error: 'Database error' });
        }
    });

    // Добавить или обновить продукт
    router.post('/', async (req, res) => {
        const { id, name, price } = req.body;
        try {
            if (id) {
                await pool.query('UPDATE products SET name=$1, price=$2 WHERE id=$3', [name, price, id]);
            } else {
                await pool.query('INSERT INTO products (name, price) VALUES ($1, $2)', [name, price]);
            }
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: 'Database error' });
        }
    });

    // Удалить продукт
    router.delete('/:id', async (req, res) => {
        try {
            await pool.query('DELETE FROM products WHERE id=$1', [req.params.id]);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: 'Database error' });
        }
    });

    return router;
};
