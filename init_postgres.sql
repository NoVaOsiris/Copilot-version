CREATE TABLE IF NOT EXISTS sellers (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(5, 2) NOT NULL
);
-- Вставка пирожков и других продуктов
INSERT INTO products (id, name, price) VALUES
(27, 'Беляш', 10),
(40, 'Булочка «Маковый рай»', 16),
(41, 'Булочка школьная', 7),
(21, 'Гусарка', 16),
(10, 'Ежик сырный', 13),
(45, 'Кармашек', 15),
(22, 'Колосок сосиска/сыр', 17),
(4, 'Конверт Капуста', 15),
(2, 'Конверт Мясо', 15),
(3, 'Конверт Творог', 15),
(31, 'Котлета жаренная', 10),
(37, 'Крендель', 11),
(33, 'Круассан кокос', 15),
(32, 'Круассан шоколад', 15),
(17, 'Лодочка грудка/гриб', 18),
(16, 'Лодочка колб/сыр', 18),
(34, 'Мини абрикос', 6),
(14, 'Мини брын/творог', 6),
(13, 'Мини вет/сыр/зел', 6),
(35, 'Мини клубника', 6),
(15, 'Мини мясо', 6),
(44, 'Осетинский пирог', 15),
(12, 'Пирога', 20),
(29, 'Пирожки жар. капуста', 7),
(30, 'Пирожки жарен. картошка', 7),
(8, 'Пирожок печеный капуста', 8),
(6, 'Пирожок печеный мясо', 8),
(7, 'Пирожок печеный творог', 8),
(9, 'Пицца', 16),
(25, 'Плацинда брынза/творог', 18),
(26, 'Плацинда капуста', 18),
(24, 'Плацинда мясо/картошка', 18),
(36, 'Пончик с кремом', 18),
(1, 'Самса', 18),
(19, 'Синнабон ветчина/брынза', 18),
(18, 'Синнанбон грудка/грибы', 18),
(28, 'Сосиска в тесте жареная', 10),
(11, 'Сосиска в тесте печеная', 11),
(23, 'Сэндвич', 16),
(43, 'Чебурек брынза', 15),
(42, 'Чебурек мясо', 15),
(20, 'Шашлык куриный', 25),
(38, 'Штрудель Вишня', 16),
(5, 'Штрудель Мясо/грибы', 16),
(39, 'Штрудель Яблоко', 13)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER REFERENCES sellers(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER,
    sale_time TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER REFERENCES sellers(id),
    product_id INTEGER REFERENCES products(id),
    date DATE,
    opening_balance INTEGER,
    receipt INTEGER,
    transfer INTEGER,
    write_off INTEGER,
    closing_balance INTEGER,
    UNIQUE(seller_id, product_id, date)
);

INSERT INTO sellers (name, password, role) VALUES
    ('mechnikova','1234','seller'),
    ('borodinka','1234','seller'),
    ('merkury','1234','seller'),
    ('pochta','1234','seller'),
    ('obzhorka','1234','seller'),
    ('pyshka','1234','seller'),
    ('klio','1234','seller'),
    ('admin','admin','admin')
ON CONFLICT (name) DO NOTHING;
