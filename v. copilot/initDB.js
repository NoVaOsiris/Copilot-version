// initDB.js

const fs       = require('fs');
const path     = require('path');
const Database = require('better-sqlite3');

// 1) Создаём папку data, если нужно
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

// 2) Открываем или создаём базу
const dbPath = path.join(dataDir, 'pos.sqlite');
const db     = new Database(dbPath);

// Включаем внешние ключи
db.pragma('foreign_keys = ON');

// 3) Создаём таблицы
db.exec(`
CREATE TABLE IF NOT EXISTS points (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT    NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS users (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT    NOT NULL UNIQUE,
  password TEXT    NOT NULL,
  role     TEXT    NOT NULL CHECK(role IN ('admin','cashier')),
  point_id INTEGER,
  FOREIGN KEY(point_id) REFERENCES points(id)
);

CREATE TABLE IF NOT EXISTS products (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  name  TEXT    NOT NULL UNIQUE,
  price REAL    NOT NULL
);

CREATE TABLE IF NOT EXISTS lunches (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  name  TEXT    NOT NULL UNIQUE,
  price REAL    NOT NULL
);

CREATE TABLE IF NOT EXISTS lunch_items (
  lunch_id   INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity   INTEGER NOT NULL,
  PRIMARY KEY (lunch_id, product_id),
  FOREIGN KEY(lunch_id)   REFERENCES lunches(id),
  FOREIGN KEY(product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS stock_entries (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  point_id   INTEGER NOT NULL,
  type       TEXT    NOT NULL CHECK(type IN ('in','out')),
  quantity   INTEGER NOT NULL,
  timestamp  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(product_id) REFERENCES products(id),
  FOREIGN KEY(point_id)   REFERENCES points(id)
);

CREATE TABLE IF NOT EXISTS movements (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id  INTEGER NOT NULL,
  from_point  INTEGER NOT NULL,
  to_point    INTEGER NOT NULL,
  quantity    INTEGER NOT NULL,
  timestamp   DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(product_id) REFERENCES products(id),
  FOREIGN KEY(from_point) REFERENCES points(id),
  FOREIGN KEY(to_point)   REFERENCES points(id)
);

CREATE TABLE IF NOT EXISTS sales (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL,
  product_id  INTEGER,
  quantity    INTEGER NOT NULL,
  total       REAL    NOT NULL,
  point_id    INTEGER NOT NULL,
  timestamp   DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id)    REFERENCES users(id),
  FOREIGN KEY(product_id) REFERENCES products(id),
  FOREIGN KEY(point_id)   REFERENCES points(id)
);
`);

// 4) Подготавливаем операторы INSERT
const insPoint     = db.prepare(`INSERT OR IGNORE INTO points(name) VALUES(?)`);
const getPoint     = db.prepare(`SELECT id FROM points WHERE name = ?`);

const insUser      = db.prepare(`
  INSERT OR IGNORE INTO users(username,password,role,point_id)
  VALUES(@username,@password,@role,@point_id)
`);

const insProd      = db.prepare(`
  INSERT OR IGNORE INTO products(name,price)
  VALUES(@name,@price)
`);
const getProdId    = db.prepare(`SELECT id FROM products WHERE name = ?`);

const insLunch     = db.prepare(`INSERT OR IGNORE INTO lunches(name,price) VALUES(?,?)`);
const getLunchId   = db.prepare(`SELECT id FROM lunches WHERE name = ?`);
const insLunchItem = db.prepare(`
  INSERT OR IGNORE INTO lunch_items(lunch_id,product_id,quantity)
  VALUES(?,?,?)
`);

// 5) Сеем точки (points)
const points = [
  'mechnikova','klio','pyshka','obzhorka',
  'pochta','borodinka','mercury'
];
console.log('Seeding points…');
for (const name of points) {
  const info = insPoint.run(name);
  if (info.changes) console.log(`  + point: ${name}`);
}

// 6) Сеем пользователей
const users = [
  { username: 'admin',      password: 'admin', role: 'admin',   point: null },
  { username: 'mechnikova', password: '1234', role: 'cashier', point: 'mechnikova' },
  { username: 'klio',       password: '1234', role: 'cashier', point: 'klio' },
  { username: 'pyshka',     password: '1234', role: 'cashier', point: 'pyshka' },
  { username: 'obzhorka',   password: '1234', role: 'cashier', point: 'obzhorka' },
  { username: 'pochta',     password: '1234', role: 'cashier', point: 'pochta' },
  { username: 'borodinka',  password: '1234', role: 'cashier', point: 'borodinka' },
  { username: 'mercury',    password: '1234', role: 'cashier', point: 'mercury' }
];
console.log('Seeding users…');
for (const u of users) {
  const pointId = u.point
    ? getPoint.get(u.point)?.id
    : null;
  const info = insUser.run({
    username: u.username,
    password: u.password,
    role: u.role,
    point_id: pointId
  });
  if (info.changes) console.log(`  + user: ${u.username}`);
}

// 7) Сеем продукты
const rawProducts = [
  ["Самса",18],["Конверт Мясо",15],["Конверт Творог",15],
  ["Конверт Капуста",15],["Штрудель Мясо/грибы",16],
  ["Пирожок печеный мясо",8],["Пирожок печеный творог",8],
  ["Пирожок печеный капуста",8],["Пицца",16],["Ежик сырный",13],
  ["Сосиска в тесте печеная",11],["Пирога",20],["Мини вет/сыр/зел",6],
  ["Мини брын/творог",6],["Мини мясо",6],["Лодочка колб/сыр",18],
  ["Лодочка грудка/гриб",18],["Синнанбон грудка/грибы",18],
  ["Синнабон ветчина/брынза",18],["Шашлык куриный",25],
  ["Гусарка",16],["Колосок сосиска/сыр",17],["Сэндвич",16],
  ["Плацинда мясо/картошка",18],["Плацинда брынза/творог",18],
  ["Плацинда капуста",18],["Беляш",10],
  ["Сосиска в тесте жареная",10],["Пирожки жар. капуста",7],
  ["Пирожки жар. картошка",7],["Котлета жаренная",10],
  ["Круассан шоколад",15],["Круассан кокос",15],
  ["Мини абрикос",6],["Мини клубника",6],["Пончик с кремом",18],
  ["Крендель",11],["Штрудель Вишня",16],["Штрудель Яблоко",13],
  ["Булочка «Маковый рай»",16],["Булочка школьная",7],
  ["Чебурек мясо",15],["Чебурек брынза",15],
  ["Осетинский пирог",15],["Кармашек",15]
];
console.log('Seeding products…');
for (const [nameRaw, price] of rawProducts) {
  const name = nameRaw.trim();
  if (!name) continue;
  const info = insProd.run({ name, price });
  if (info.changes) console.log(`  + product: ${name}`);
}

// 8) Сеем «обеды» (lunches)
const lunches = [
  {
    name: 'Обед №1',
    price: 100,
    items: [
      { name: 'Самса', quantity: 1 },
      { name: 'Ежик сырный', quantity: 1 }
    ]
  },
  {
    name: 'Обед №2',
    price: 120,
    items: [
      { name: 'Пицца', quantity: 1 },
      { name: 'Пончик с кремом', quantity: 1 }
    ]
  }
];
console.log('Seeding lunches…');
for (const l of lunches) {
  const info = insLunch.run(l.name, l.price);
  if (info.changes) console.log(`  + lunch: ${l.name}`);
  const lunchId = getLunchId.get(l.name).id;
  for (const it of l.items) {
    const prodId = getProdId.get(it.name)?.id;
    if (!prodId) continue;
    insLunchItem.run(lunchId, prodId, it.quantity);
  }
}

console.log('✔️  Database initialized at', dbPath);
db.close();
