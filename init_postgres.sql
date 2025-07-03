
-- sellers: продавцы
CREATE TABLE IF NOT EXISTS sellers (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL
);

-- products: товары
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    price INTEGER NOT NULL
);

-- sales: продажи
CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER REFERENCES sellers(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    sale_time TIMESTAMP NOT NULL DEFAULT NOW()
);

-- inventory: остатки с графой "обеды"
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER REFERENCES sellers(id),
    product_id INTEGER REFERENCES products(id),
    date DATE NOT NULL,
    opening_balance INTEGER,
    receipt INTEGER,
    transfer INTEGER,
    write_off INTEGER,
    lunches INTEGER,
    closing_balance INTEGER,
    UNIQUE (seller_id, product_id, date)
);
