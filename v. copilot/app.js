// app.js

const express       = require('express');
const session       = require('express-session');
const SQLiteStore   = require('connect-sqlite3')(session);
const bodyParser    = require('body-parser');
const { Parser }    = require('json2csv');
const PDFDocument   = require('pdfkit');
const db            = require('./db');            // better-sqlite3 instance
const path          = require('path');

const app = express();

// view engine и статика
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// сессии в SQLite
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
  cookie: { maxAge: 1000*60*60*24, secure: false }
}));

// auth middleware
function requireRole(role) {
  return (req, res, next) => {
    if (!req.session.user || (role && req.session.user.role !== role)) {
      return res.redirect('/login');
    }
    next();
  };
}

// корень → логин
app.get('/', (req, res) => res.redirect('/login'));

// login / logout
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare(
    'SELECT * FROM users WHERE username=? AND password=?'
  ).get(username, password);
  if (!user) {
    return res.render('login', { error: 'Неверный логин или пароль' });
  }
  req.session.user = user;
  res.redirect(user.role === 'admin' ? '/admin' : '/cashier');
});
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// POS-интерфейс кассира
app.get('/cashier', requireRole('cashier'), (req, res) => {
  const prods = db.prepare('SELECT * FROM products').all();
  res.render('cashier', { prods, user: req.session.user });
});
app.post('/sale', requireRole('cashier'), (req, res) => {
  const { product_id, quantity } = req.body;
  const prod = db.prepare('SELECT * FROM products WHERE id=?').get(product_id);
  if (!prod) return res.status(400).json({ success: false, error: 'Товар не найден' });

  const qty   = parseInt(quantity, 10) || 1;
  const total = prod.price * qty;
  db.prepare(`
    INSERT INTO sales(user_id,product_id,quantity,total)
    VALUES(?,?,?,?)
  `).run(req.session.user.id, prod.id, qty, total);

  res.json({ success: true, total });
});

// спец-наборы «обеды» для кассира
app.get('/lunches', requireRole('cashier'), (req, res) => {
  const lunches = db.prepare('SELECT * FROM lunches').all();
  res.render('cashier-lunches', { lunches, user: req.session.user });
});
app.post('/sale-lunch', requireRole('cashier'), (req, res) => {
  const { lunch_id, quantity } = req.body;
  const lunch = db.prepare('SELECT * FROM lunches WHERE id=?').get(lunch_id);
  if (!lunch) return res.status(400).json({ success: false, error: 'Набор не найден' });

  const qty   = parseInt(quantity, 10) || 1;
  const total = lunch.price * qty;

  // регистрируем состав набора как продажи
  const items = db.prepare(`
    SELECT product_id, quantity FROM lunch_items WHERE lunch_id=?
  `).all(lunch_id);

  items.forEach(i => {
    db.prepare(`
      INSERT INTO sales(user_id,product_id,quantity,total)
      VALUES(?,?,?,0)
    `).run(req.session.user.id, i.product_id, i.quantity * qty);
  });

  // итоговый чек как отдельная запись
  db.prepare(`
    INSERT INTO sales(user_id,product_id,quantity,total)
    VALUES(?,?,?,?,?)
  `.replace(/,product_id/, ',NULL AS product_id') // hack для вставки null
  ).run(req.session.user.id, qty, total);

  res.json({ success: true, total });
});

// Админ-панель основной
app.get('/admin', requireRole('admin'), (req, res) => {
  const prods = db.prepare('SELECT * FROM products').all();
  const sales = db.prepare(`
    SELECT s.id, u.username, p.name AS product,
           s.quantity, s.total, s.timestamp
    FROM sales s
    JOIN users u    ON u.id = s.user_id
    JOIN products p ON p.id = s.product_id
    ORDER BY s.timestamp DESC
  `).all();
  res.render('admin', { prods, sales, user: req.session.user });
});

// 1) Учёт остатков
app.get('/admin/stock', requireRole('admin'), (req, res) => {
  const stock = db.prepare(`
    SELECT p.name, pt.name AS point, se.type, se.quantity, se.timestamp
      FROM stock_entries se
      JOIN products p ON p.id = se.product_id
      JOIN points pt  ON pt.id = se.point_id
      ORDER BY se.timestamp DESC
  `).all();
  res.render('admin-stock', { stock, user: req.session.user });
});
app.post('/admin/stock', requireRole('admin'), (req, res) => {
  const { product_id, point_id, type, quantity } = req.body;
  db.prepare(`
    INSERT INTO stock_entries(product_id,point_id,type,quantity)
    VALUES(?,?,?,?)
  `).run(product_id, point_id, type, quantity);
  res.redirect('/admin/stock');
});

// 2) Перемещения
app.get('/admin/movements', requireRole('admin'), (req, res) => {
  const moves = db.prepare(`
    SELECT p.name, f.name AS from_point, t.name AS to_point,
           m.quantity, m.timestamp
      FROM movements m
      JOIN products p       ON p.id = m.product_id
      JOIN points f         ON f.id = m.from_point
      JOIN points t         ON t.id = m.to_point
      ORDER BY m.timestamp DESC
  `).all();
  res.render('admin-movements', { moves, user: req.session.user });
});
app.post('/admin/movements', requireRole('admin'), (req, res) => {
  const { product_id, from_point, to_point, quantity } = req.body;
  db.prepare(`
    INSERT INTO movements(product_id,from_point,to_point,quantity)
    VALUES(?,?,?,?)
  `).run(product_id, from_point, to_point, quantity);
  res.redirect('/admin/movements');
});

// 3) Управление аккаунтами
app.get('/admin/users', requireRole('admin'), (req, res) => {
  const users = db.prepare('SELECT id,username,role FROM users').all();
  res.render('admin-users', { users, user: req.session.user });
});
app.post('/admin/users', requireRole('admin'), (req, res) => {
  const { username, password } = req.body;
  db.prepare(`
    INSERT INTO users(username,password,role)
    VALUES(?,?, 'cashier')
  `).run(username, password);
  res.redirect('/admin/users');
});
app.post('/admin/users/:id/password', requireRole('admin'), (req, res) => {
  const { newpass } = req.body;
  db.prepare('UPDATE users SET password=? WHERE id=?')
    .run(newpass, req.params.id);
  res.redirect('/admin/users');
});

// 4) Отчёты с фильтрацией
app.get('/admin/reports', requireRole('admin'), (req, res) => {
  const { date_from, date_to, point_id, product_id } = req.query;
  let sql = `
    SELECT u.username, pt.name AS point, p.name AS product,
           s.quantity, s.total, s.timestamp
      FROM sales s
      JOIN users u    ON u.id = s.user_id
      LEFT JOIN products p ON p.id = s.product_id
      LEFT JOIN points pt  ON pt.id = s.point_id
     WHERE 1=1
  `;
  const params = [];
  if (date_from)   { sql += ' AND date(s.timestamp)>=?'; params.push(date_from); }
  if (date_to)     { sql += ' AND date(s.timestamp)<=?'; params.push(date_to); }
  if (point_id)    { sql += ' AND s.point_id=?';        params.push(point_id); }
  if (product_id)  { sql += ' AND p.id=?';              params.push(product_id); }
  sql += ' ORDER BY s.timestamp DESC';

  const rows = db.prepare(sql).all(...params);
  res.render('admin-reports', { rows, user: req.session.user });
});

// 5) Экспорт CSV / PDF
app.get('/admin/export.csv', requireRole('admin'), (req, res) => {
  const rows = db.prepare('SELECT * FROM sales').all();
  const csv  = new Parser().parse(rows);
  res.header('Content-Type', 'text/csv; charset=utf-8');
  res.attachment('sales.csv').send(csv);
});
app.get('/admin/export.pdf', requireRole('admin'), (req, res) => {
  const doc = new PDFDocument();
  res.setHeader('Content-Disposition', 'attachment; filename="sales.pdf"');
  doc.pipe(res);
  doc.fontSize(14).text('Отчёт по продажам', { align: 'center' });
  const sales = db.prepare('SELECT * FROM sales').all();
  sales.forEach(s => {
    doc.moveDown(0.5)
       .fontSize(10)
       .text(`${s.timestamp} | user:${s.user_id} | prod:${s.product_id} | qty:${s.quantity} | total:${s.total}`);
  });
  doc.end();
});

// 404
app.use((req, res) => res.status(404).send('Страница не найдена'));

// старт
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
