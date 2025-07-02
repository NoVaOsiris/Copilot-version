// initDB.js
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// 1) Убедиться, что папка data есть
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// 2) Открыть (или создать) БД
const dbPath = path.join(dataDir, 'pos.sqlite');
const db = new Database(dbPath);

// 3) Включить Foreign Keys (хорошая практика)
db.pragma('foreign_keys = ON');

// 4) Создать таблицы с UNIQUE-ограничениями
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  price REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  total REAL NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(product_id) REFERENCES products(id)
);
`);

// 5) Подготовить запросы
const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users(username, password, role)
  VALUES (@username, @password, @role)
`);

const insertProduct = db.prepare(`
  INSERT OR IGNORE INTO products(name, price)
  VALUES (@name, @price)
`);

// 6) Сеем пользователей
const users = [
  { username: 'admin',      password: 'admin', role: 'admin' },
  { username: 'mechnikova', password: '1234', role: 'cashier' },
  { username: 'klio',       password: '1234', role: 'cashier' },
  { username: 'pyshka',     password: '1234', role: 'cashier' },
  { username: 'obzhorka',   password: '1234', role: 'cashier' },
  { username: 'pochta',     password: '1234', role: 'cashier' },
  { username: 'borodinka',  password: '1234', role: 'cashier' },
  { username: 'mercury',    password: '1234', role: 'cashier' }
];

console.log('Seeding users…');
for (const u of users) {
  try {
    const info = insertUser.run(u);
    if (info.changes) console.log(`  + added user ${u.username}`);
  } catch (e) {
    console.error(`  ! user ${u.username} — ${e.message}`);
  }
}

// 7) Сеем товары (названия обрезаются и «пустые» пропускаются)
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
for (const [rawName, price] of rawProducts) {
  const name = rawName.trim();
  if (!name) {
    console.warn('  ! skipped empty product name');
    continue;
  }
  try {
    const info = insertProduct.run({ name, price });
    if (info.changes) console.log(`  + added product "${name}"`);
  } catch (e) {
    console.error(`  ! product "${name}" — ${e.message}`);
  }
}

console.log('✔️  Database initialized at', dbPath);
db.close();
