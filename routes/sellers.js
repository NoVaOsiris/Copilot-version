
const express = require('express');

module.exports = (pool) => {
    const router = express.Router();

    router.get('/', async (req, res) => {
        try {
            const result = await pool.query('SELECT id, name, role FROM sellers ORDER BY name');
            res.json(result.rows);
        } catch (err) {
            res.status(500).json({ error: 'DB error' });
        }
    });

    router.post('/', async (req, res) => {
        const { id, name, password, role } = req.body;
        try {
            if (id) {
                if (password) {
                    await pool.query('UPDATE sellers SET name=$1, password=$2, role=$3 WHERE id=$4', [name, password, role, id]);
                } else {
                    await pool.query('UPDATE sellers SET name=$1, role=$2 WHERE id=$3', [name, role, id]);
                }
            } else {
                await pool.query('INSERT INTO sellers (name, password, role) VALUES ($1, $2, $3)', [name, password, role]);
            }
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: 'DB error' });
        }
    });

    router.delete('/:id', async (req, res) => {
        try {
            await pool.query('DELETE FROM sellers WHERE id=$1', [req.params.id]);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: 'DB error' });
        }
    });

    return router;
};
