"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Инициализация базы данных
const db = new better_sqlite3_1.default('database.sqlite');
// Создание таблиц
db.exec(`
  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    password TEXT NOT NULL
  );
`);
// Добавляем тестового админа если его нет
const adminExists = db.prepare('SELECT * FROM admins WHERE username = ?').get('admin');
if (!adminExists) {
    db.prepare('INSERT INTO admins (username, password) VALUES (?, ?)').run('admin', 'supersecret123');
}
// Добавляем тестовые отзывы если их нет
const reviewsCount = db.prepare('SELECT COUNT(*) as count FROM reviews').get();
if (reviewsCount.count === 0) {
    const testReviews = [
        { name: 'Алексей Петров', text: 'Отличная команда! Сделали сайт для нашего магазина за 2 недели. Рекомендую!' },
        { name: 'Мария Иванова', text: 'Профессиональный подход к работе. Всегда на связи, оперативно вносят правки.' },
        { name: 'ООО "ТехноСтарт"', text: 'Разработали CRM-систему под наши нужды. Работает стабильно уже полгода.' }
    ];
    const insertReview = db.prepare('INSERT INTO reviews (name, text) VALUES (?, ?)');
    testReviews.forEach(r => insertReview.run(r.name, r.text));
}
// Middleware
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
// View engine
app.set('view engine', 'ejs');
app.set('views', path_1.default.join(__dirname, '../views'));
// ===================
// ПУБЛИЧНЫЕ СТРАНИЦЫ
// ===================
// Главная страница
app.get('/', (req, res) => {
    // УЯЗВИМОСТЬ XSS: отзывы выводятся без экранирования
    const reviews = db.prepare('SELECT * FROM reviews ORDER BY created_at DESC').all();
    res.render('index', { reviews });
});
// Отправка отзыва
// УЯЗВИМОСТЬ XSS: данные сохраняются без санитизации
app.post('/review', (req, res) => {
    const { name, text } = req.body;
    if (name && text) {
        db.prepare('INSERT INTO reviews (name, text) VALUES (?, ?)').run(name, text);
    }
    res.redirect('/#reviews');
});
// Отправка формы обратной связи
// УЯЗВИМОСТЬ SQL INJECTION: данные вставляются через конкатенацию строк
app.post('/contact', (req, res) => {
    const { email, message } = req.body;
    if (email && message) {
        // НЕБЕЗОПАСНО: SQL injection возможен через поле email или message
        const query = `INSERT INTO contacts (email, message) VALUES ('${email}', '${message}')`;
        try {
            db.exec(query);
            res.redirect('/?success=1');
        }
        catch (error) {
            console.error('Database error:', error);
            res.redirect('/?error=1');
        }
    }
    else {
        res.redirect('/?error=1');
    }
});
// ===================
// АДМИН-ПАНЕЛЬ
// ===================
// Страница входа
app.get('/admin/login', (req, res) => {
    res.render('admin-login', { error: req.query.error });
});
// Авторизация
// УЯЗВИМОСТЬ SQL INJECTION: проверка логина/пароля через конкатенацию
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    // НЕБЕЗОПАСНО: SQL injection позволяет обойти авторизацию
    const query = `SELECT * FROM admins WHERE username = '${username}' AND password = '${password}'`;
    try {
        const admin = db.prepare(query).get();
        if (admin) {
            // Простая "сессия" через query параметр (для демонстрации)
            res.redirect('/admin/dashboard?auth=1');
        }
        else {
            res.redirect('/admin/login?error=1');
        }
    }
    catch (error) {
        console.error('Login error:', error);
        res.redirect('/admin/login?error=1');
    }
});
// Админ-панель (dashboard)
app.get('/admin/dashboard', (req, res) => {
    // Простая проверка "авторизации"
    if (req.query.auth !== '1') {
        return res.redirect('/admin/login');
    }
    const contacts = db.prepare('SELECT * FROM contacts ORDER BY created_at DESC').all();
    const reviews = db.prepare('SELECT * FROM reviews ORDER BY created_at DESC').all();
    res.render('admin-dashboard', { contacts, reviews });
});
// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
    console.log(`Админ-панель: http://localhost:${PORT}/admin/login`);
});
