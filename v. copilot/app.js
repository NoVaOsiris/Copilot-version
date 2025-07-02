// app.js

const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const bodyParser = require('body-parser');
const db = require('./db');           // better-sqlite3 instance
const path = require('path');

const app = express();

// Настройка view engine и статики
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Сессии в SQLite
app.use(session({
  store: new SQLiteStore({
    dir: path.join(__dirname, 'data'),
    db: 'sessions.sqlite',
    table: 'sessions',
    concurrentDB: true
  }),
  secret: 'pos-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 день
    secure: false               // true, если HTTPS
  }
}));

// Перенаправление корня на /login
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Middleware проверки роли
function requireRole(role) {
  return (req, res, next) => {
    if (!req.session.user || (role && req.session.user.role !== role)) {
      return res.redirect('/login');
    }
    next();
  };
}

// Страница логина
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// Обработка логина
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = db
    .prepare('SELECT * FROM users WHERE username = ? AND password = ?')
    .get(username, password);

  if (!user) {
    return res.render('login', {
      error: 'Неверный логин или пароль'
    });
  }

  req.session.user = user;
  res.redirect(user.role === 'admin' ? '/admin' : '/cashier');
});

// Выход
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// POS-интерфейс для кассира
app.get('/cashier', requireRole('cashier'), (req, res) => {
  const prods = db.prepare('SELECT * FROM products').all();
  res.render('cashier', {
    prods,
    user: req.session.user
  });
});

// Регистрация продажи
app.post('/sale', requireRole('cashier'), (req, res) => {
  const { product_id, quantity } = req.body;
  const prod = db
    .prepare('SELECT * FROM products WHERE id = ?')
    .get(product_id);

  if (!prod) {
    return res.status(400).json({ success: false, error: 'Товар не найден' });
  }

  const qty = parseInt(quantity, 10) || 1;
  const total = prod.price * qty;

  db.prepare(`
    INSERT INTO sales(user_id, product_id, quantity, total)
    VALUES(?, ?, ?, ?)
  `).run(req.session.user.id, prod.id, qty, total);

  res.json({ success: true, total });
});

// Админ-панель
app.get('/admin', requireRole('admin'), (req, res) => {
  const prods = db.prepare('SELECT * FROM products').all();
  const sales = db.prepare(`
    SELECT
      s.id,
      u.username,
      p.name       AS product,
      s.quantity,
      s.total,
      s.timestamp
    FROM sales s
    JOIN users u    ON u.id = s.user_id
    JOIN products p ON p.id = s.product_id
    ORDER BY s.timestamp DESC
  `).all();

  res.render('admin', {
    prods,
    sales,
    user: req.session.user
  });
});

// Обработчик 404
app.use((req, res) => {
  res.status(404).send('Страница не найдена');
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
