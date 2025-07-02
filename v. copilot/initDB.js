// initDB.js
const Database = require('better-sqlite3');
const db = new Database('./data/pos.sqlite', { verbose: console.log });

// ������ ����� data, ���� �����
const fs = require('fs');
if (!fs.existsSync('./data')) fs.mkdirSync('./data');

// �������
db.exec(`
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY,
  username TEXT UNIQUE,
  password TEXT,
  role TEXT
);

CREATE TABLE IF NOT EXISTS products(
  id INTEGER PRIMARY KEY,
  name TEXT,
  price REAL
);

CREATE TABLE IF NOT EXISTS sales(
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  product_id INTEGER,
  quantity INTEGER,
  total REAL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

// ���� �������������
const users = [
    { u: 'admin', p: 'Z7mKp4Lx', r: 'admin' },
    { u: 'mechnikova', p: 'G9fjR1sP', r: 'cashier' },
    { u: 'klio', p: 'T2nV4bCk', r: 'cashier' },
    { u: 'pyshka', p: 'W8mH9uEz', r: 'cashier' },
    { u: 'obzhorka', p: 'R5tJ6dLm', r: 'cashier' },
    { u: 'pochta', p: 'X3bN2qDe', r: 'cashier' },
    { u: 'borodinka', p: 'K7gY4rTp', r: 'cashier' },
    { u: 'mercury', p: 'S1dL8wRq', r: 'cashier' }
];
let insUser = db.prepare('INSERT OR IGNORE INTO users(username,password,role) VALUES(@u,@p,@r)');
users.forEach(u => insUser.run(u));

// ���� ��������
const products = [
    ["�����", 18], ["������� ����", 15], ["������� ������", 15],
    ["������� �������", 15], ["�������� ����/�����", 16],
    ["������� ������� ����", 8], ["������� ������� ������", 8],
    ["������� ������� �������", 8], ["�����", 16], ["���� ������", 13],
    ["������� � ����� �������", 11], ["������", 20], ["���� ���/���/���", 6],
    ["���� ����/������", 6], ["���� ����", 6], ["������� ����/���", 18],
    ["������� ������/����", 18], ["��������� ������/�����", 18],
    ["�������� �������/������", 18], ["������ �������", 25],
    ["�������", 16], ["������� �������/���", 17], ["�������", 16],
    ["�������� ����/��������", 18], ["�������� ������/������", 18],
    ["�������� �������", 18], ["�����", 10],
    ["������� � ����� �������", 10], ["������� ���. �������", 7],
    ["������� ���. ��������", 7], ["������� ��������", 10],
    ["�������� �������", 15], ["�������� �����", 15],
    ["���� �������", 6], ["���� ��������", 6], ["������ � ������", 18],
    ["��������", 11], ["�������� �����", 16], ["�������� ������", 13],
    ["������� �������� ���", 16], ["������� ��������", 7],
    ["������� ����", 15], ["������� ������", 15],
    ["���������� �����", 15], ["��������", 15]
];
let insProd = db.prepare('INSERT OR IGNORE INTO products(name,price) VALUES(?,?)');
products.forEach(p => insProd.run(p[0], p[1]));

console.log('DB initialized.');
db.close();