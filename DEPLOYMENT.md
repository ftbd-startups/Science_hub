# Руководство по развертыванию Science Hub MVP

Это руководство описывает процесс развертывания MVP платформы Science Hub в production окружении.

## Архитектура

- **Frontend**: React 18 + TypeScript + Vite (развертывается на Vercel)
- **Backend**: Supabase (PostgreSQL + Edge Functions + Auth + Storage)
- **CI/CD**: GitHub Actions
- **Мониторинг**: Встроенные инструменты Vercel и Supabase

## Предварительные требования

### Локальная разработка
- Node.js 18+
- npm или yarn
- Git
- Supabase CLI: `npm install -g supabase`

### Production развертывание
- Аккаунт GitHub (для CI/CD)
- Аккаунт Supabase (для backend)
- Аккаунт Vercel (для frontend)

## Настройка окружения

### 1. Supabase

1. Создайте новый проект в [Supabase Dashboard](https://app.supabase.com)
2. Получите следующие данные:
   - Project URL
   - Anon public key
   - Service role key (для развертывания)
   - Project ID

### 2. Vercel

1. Создайте аккаунт на [Vercel](https://vercel.com)
2. Подключите ваш GitHub репозиторий
3. Получите:
   - Vercel Token
   - Organization ID
   - Project ID

### 3. GitHub Secrets

Добавьте следующие секреты в настройки вашего GitHub репозитория:

```
SUPABASE_PROJECT_ID=your_project_id
SUPABASE_ACCESS_TOKEN=your_access_token
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id
```

## Автоматическое развертывание

### GitHub Actions

Автоматическое развертывание настроено через GitHub Actions:

1. **При push в main**: Полное развертывание (тесты → база данных → фронтенд)
2. **При pull request**: Только тестирование

Workflow включает:
- Линтинг и проверка типов TypeScript
- Запуск тестов
- Сборка приложения
- Развертывание миграций БД
- Развертывание Edge Functions
- Развертывание фронтенда на Vercel

### Ручное развертывание

Для ручного развертывания используйте скрипт:

```bash
# Полное развертывание
./scripts/deploy.sh

# Только база данных
./scripts/deploy.sh database

# Только фронтенд
./scripts/deploy.sh frontend

# Проверка статуса
./scripts/deploy.sh verify
```

## Локальная разработка

### Первоначальная настройка

1. Клонируйте репозиторий:
```bash
git clone <repository-url>
cd science-hub
```

2. Установите зависимости:
```bash
cd frontend
npm install
cd ..
```

3. Настройте Supabase:
```bash
supabase init
supabase start
supabase link --project-ref your_project_id
```

4. Примените миграции:
```bash
supabase db push
```

5. Развертывание функций:
```bash
supabase functions deploy
```

### Запуск в режиме разработки

```bash
# Запуск Supabase локально
supabase start

# Запуск фронтенда
cd frontend
npm run dev
```

Приложение будет доступно по адресу `http://localhost:5173`

## Структура проекта

```
science-hub/
├── .github/workflows/     # GitHub Actions
├── frontend/             # React приложение
│   ├── src/
│   ├── public/
│   └── package.json
├── supabase/            # Backend конфигурация
│   ├── functions/       # Edge Functions
│   ├── migrations/      # Миграции БД
│   └── config.toml
├── scripts/             # Скрипты развертывания
└── docs/               # Документация
```

## Мониторинг и логи

### Supabase
- Dashboard: `https://app.supabase.com/project/your_project_id`
- Логи Edge Functions
- Метрики базы данных
- Мониторинг аутентификации

### Vercel
- Dashboard: `https://vercel.com/dashboard`
- Логи развертывания
- Аналитика производительности
- Мониторинг доступности

### GitHub Actions
- Статус CI/CD: `https://github.com/your_username/science-hub/actions`
- Логи развертывания
- История изменений

## Резервное копирование

### База данных
Supabase автоматически создает резервные копии. Для ручного бэкапа:

```bash
# Экспорт схемы
supabase db dump --schema-only > schema.sql

# Экспорт данных
supabase db dump --data-only > data.sql
```

### Код
- Код хранится в Git
- Автоматические бэкапы через GitHub

## Безопасность

### Переменные окружения
- Никогда не коммитьте секретные ключи
- Используйте GitHub Secrets для CI/CD
- Регулярно ротируйте API ключи

### База данных
- Row Level Security (RLS) включена
- Политики безопасности настроены
- Регулярные обновления Supabase

### Фронтенд
- HTTPS принудительно
- CSP заголовки настроены
- Зависимости регулярно обновляются

## Масштабирование

### Supabase
- Автоматическое масштабирование
- Мониторинг использования ресурсов
- Upgrade плана при необходимости

### Vercel
- Автоматическое масштабирование
- CDN по всему миру
- Serverless функции

## Устранение неполадок

### Частые проблемы

1. **Ошибки миграций**:
```bash
supabase db reset
supabase db push
```

2. **Проблемы с Edge Functions**:
```bash
supabase functions deploy --no-verify-jwt
```

3. **Ошибки сборки фронтенда**:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Логи и отладка

- Supabase логи: Dashboard → Logs
- Vercel логи: Dashboard → Functions → View Function Logs
- GitHub Actions: Repository → Actions → Select workflow

## Поддержка

Для получения помощи:
1. Проверьте документацию
2. Просмотрите логи ошибок
3. Создайте issue в GitHub репозитории

## Обновления

### Зависимости
```bash
cd frontend
npm update
npm audit fix
```

### Supabase
- Обновления применяются автоматически
- Следите за changelog в Dashboard

### Vercel
- Обновления платформы автоматические
- Обновляйте CLI: `npm i -g vercel@latest`

---

**Важно**: Всегда тестируйте изменения в staging окружении перед развертыванием в production! 