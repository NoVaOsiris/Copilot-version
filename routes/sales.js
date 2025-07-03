
const express = require('express');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

module.exports = (pool) => {
    const router = express.Router();

    router.get('/', async (req, res) => {
        const { seller_id, date_from, date_to } = req.query;
        let query = 'SELECT * FROM sales WHERE 1=1';
        const params = [];

        if (seller_id) {
            params.push(seller_id);
            query += ` AND seller_id = $${params.length}`;
        }
        if (date_from) {
            params.push(date_from);
            query += ` AND sale_time >= $${params.length}`;
        }
        if (date_to) {
            params.push(date_to);
            query += ` AND sale_time <= $${params.length}`;
        }

        try {
            const result = await pool.query(query, params);
            res.json(result.rows);
        } catch (err) {
            res.status(500).json({ error: 'DB error' });
        }
    });

    router.get('/export', async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT s.id, sl.name AS seller, p.name AS product, s.quantity, s.sale_time
                FROM sales s
                JOIN sellers sl ON s.seller_id = sl.id
                JOIN products p ON s.product_id = p.id
                ORDER BY s.sale_time DESC
            `);

            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Sales');

            sheet.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Seller', key: 'seller', width: 20 },
                { header: 'Product', key: 'product', width: 25 },
                { header: 'Quantity', key: 'quantity', width: 10 },
                { header: 'Date', key: 'sale_time', width: 20 }
            ];

            result.rows.forEach(row => sheet.addRow(row));

            const tempPath = path.join(__dirname, '../sales-export.xlsx');
            await workbook.xlsx.writeFile(tempPath);
            res.download(tempPath, 'sales.xlsx');
        } catch (err) {
            res.status(500).json({ error: 'Export error' });
        }
    });

    return router;
};
