// db.js
const Database = require('better-sqlite3');
const db = new Database('./data/pos.sqlite');
module.exports = db;