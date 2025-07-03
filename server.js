
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
    store: new pgSession({
        pool,
        createTableIfMissing: true  // ⬅️ вот это добавили
    }),
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

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
