
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Middleware
app.use(session({
    store: new pgSession({ pool }),
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 86400000 }
}));
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/products', require('./routes/products')(pool));
app.use('/api/sellers', require('./routes/sellers')(pool));
app.use('/api/inventory', require('./routes/inventory')(pool));
app.use('/api/sales', require('./routes/sales')(pool));

app.post('/api/login', async (req, res) => {
  const { name, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM sellers WHERE name = $1 AND password = $2',
      [name, password]
    );
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Неверное имя или пароль' });
    }
    req.session.user = { id: user.id, name: user.name, role: user.role };
    res.json({ name: user.name, role: user.role });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});
app.post('/api/login', async (req, res) => {
  const { name, password } = req.body;
  console.log("Попытка входа:", name, password); // 👈 лог

  try {
    const result = await pool.query(
      'SELECT * FROM sellers WHERE name = $1 AND password = $2',
      [name, password]
    );
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Неверное имя или пароль' });
    }
    req.session.user = { id: user.id, name: user.name, role: user.role };
    res.json({ name: user.name, role: user.role });
  } catch (err) {
    console.error("Ошибка в /api/login:", err); // 👈 лог ошибки
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});
const res = await fetch('/api/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'  // ← это обязательно!
  },
  body: JSON.stringify({ name, password }) // ← это тоже
});


app.get('/', (req, res) => {
  res.redirect('/login.html');
});
// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
