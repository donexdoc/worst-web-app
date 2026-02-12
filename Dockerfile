# Сборка
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем package.json (будет создан при первом запуске)
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходники
COPY . .

# Компилируем TypeScript
RUN npm run build

# Продакшн образ
FROM node:20-alpine

WORKDIR /app

# Копируем package.json
COPY package*.json ./

# Устанавливаем только production зависимости
RUN npm install --omit=dev

# Копируем скомпилированный код и шаблоны
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/views ./views
COPY --from=builder /app/public ./public

# Порт приложения
EXPOSE 3000

# Запуск
CMD ["node", "dist/app.js"]
