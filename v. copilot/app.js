// app.js
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const db = require('./db');
const path = require('path');

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'pos-secret-key',
    resave: false,
    saveUninitialized: false
}));

// Auth middleware
function requireRole(role) {
    return (req, res, next) => {
        if (!req.session.user || (role && req.session.user.role !== role)) {
            return res.redirect('/login');
        }
        next();
    };
}

// Login
app.get('/login', (req, res) => {
    res.render('login', { error: null });
});
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?')
        .get(username, password);
    if (!user) return res.render('login', { error: 'Неверный логин или пароль' });
    req.session.user = user;
    res.redirect(user.role === 'admin' ? '/admin' : '/cashier');
});
app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/login'));
});

// Cashier panel
app.get('/cashier', requireRole('cashier'), (req, res) => {
    const prods = db.prepare('SELECT * FROM products').all();
    res.render('cashier', { prods, user: req.session.user });
});
app.post('/sale', requireRole('cashier'), (req, res) => {
    const { product_id, quantity } = req.body;
    const prod = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
    const total = prod.price * +quantity;
    db.prepare(`INSERT INTO sales(user_id,product_id,quantity,total) VALUES(?,?,?,?)`)
        .run(req.session.user.id, product_id, quantity, total);
    res.json({ success: true, total });
});

// Admin panel
app.get('/admin', requireRole('admin'), (req, res) => {
    const prods = db.prepare('SELECT * FROM products').all();
    const sales = db.prepare(`
    SELECT s.id, u.username, p.name, s.quantity, s.total, s.timestamp
    FROM sales s
    JOIN users u ON u.id = s.user_id
    JOIN products p ON p.id = s.product_id
    ORDER BY s.timestamp DESC
  `).all();
    res.render('admin', { prods, sales, user: req.session.user });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));