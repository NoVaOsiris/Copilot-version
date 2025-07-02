// initDB.js
const Database = require('better-sqlite3');
const db = new Database('./data/pos.sqlite', { verbose: console.log });

// Создаём папку data, если нужно
const fs = require('fs');
if (!fs.existsSync('./data')) fs.mkdirSync('./data');

// Таблицы
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

// Сеем пользователей
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

// Сеем продукты
const products = [
    ["Самса", 18], ["Конверт Мясо", 15], ["Конверт Творог", 15],
    ["Конверт Капуста", 15], ["Штрудель Мясо/грибы", 16],
    ["Пирожок печеный мясо", 8], ["Пирожок печеный творог", 8],
    ["Пирожок печеный капуста", 8], ["Пицца", 16], ["Ежик сырный", 13],
    ["Сосиска в тесте печеная", 11], ["Пирога", 20], ["Мини вет/сыр/зел", 6],
    ["Мини брын/творог", 6], ["Мини мясо", 6], ["Лодочка колб/сыр", 18],
    ["Лодочка грудка/гриб", 18], ["Синнанбон грудка/грибы", 18],
    ["Синнабон ветчина/брынза", 18], ["Шашлык куриный", 25],
    ["Гусарка", 16], ["Колосок сосиска/сыр", 17], ["Сэндвич", 16],
    ["Плацинда мясо/картошка", 18], ["Плацинда брынза/творог", 18],
    ["Плацинда капуста", 18], ["Беляш", 10],
    ["Сосиска в тесте жареная", 10], ["Пирожки жар. капуста", 7],
    ["Пирожки жар. картошка", 7], ["Котлета жаренная", 10],
    ["Круассан шоколад", 15], ["Круассан кокос", 15],
    ["Мини абрикос", 6], ["Мини клубника", 6], ["Пончик с кремом", 18],
    ["Крендель", 11], ["Штрудель Вишня", 16], ["Штрудель Яблоко", 13],
    ["Булочка «Маковый рай»", 16], ["Булочка школьная", 7],
    ["Чебурек мясо", 15], ["Чебурек брынза", 15],
    ["Осетинский пирог", 15], ["Кармашек", 15]
];
let insProd = db.prepare('INSERT OR IGNORE INTO products(name,price) VALUES(?,?)');
products.forEach(p => insProd.run(p[0], p[1]));

console.log('DB initialized.');
db.close();