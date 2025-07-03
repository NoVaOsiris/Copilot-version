
const express = require('express');

module.exports = (pool) => {
    const router = express.Router();

    // Получить остатки по продавцу, дате или продукту
    router.get('/', async (req, res) => {
        const { seller_id, date, product_id } = req.query;
        let query = 'SELECT * FROM inventory WHERE 1=1';
        const params = [];

        if (seller_id) {
            params.push(seller_id);
            query += ` AND seller_id = $${params.length}`;
        }
        if (date) {
            params.push(date);
            query += ` AND date = $${params.length}`;
        }
        if (product_id) {
            params.push(product_id);
            query += ` AND product_id = $${params.length}`;
        }

        try {
            const result = await pool.query(query, params);
            res.json(result.rows);
        } catch (err) {
            res.status(500).json({ error: 'DB error' });
        }
    });

    // Добавить или обновить остатки
    router.post('/', async (req, res) => {
        const { seller_id, product_id, date, opening_balance, receipt, transfer, write_off, closing_balance } = req.body;

        try {
            await pool.query(`
                INSERT INTO inventory (seller_id, product_id, date, opening_balance, receipt, transfer, write_off, closing_balance)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (seller_id, product_id, date)
                DO UPDATE SET opening_balance=$4, receipt=$5, transfer=$6, write_off=$7, closing_balance=$8
            `, [seller_id, product_id, date, opening_balance, receipt, transfer, write_off, closing_balance]);

            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: 'DB error' });
        }
    });

    return router;
};
