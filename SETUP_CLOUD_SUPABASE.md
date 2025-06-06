# Настройка облачного Supabase для Science Hub MVP

## 🔧 Шаги настройки

### 1. Получение конфигурации из Supabase Dashboard

1. Откройте ваш проект в [Supabase Dashboard](https://app.supabase.com/)
2. Перейдите в **Settings** → **API**
3. Найдите следующие данные:

```
Project URL: https://your-project-ref.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Обновление переменных окружения

Отредактируйте файл `frontend/.env.local`:

```bash
# Замените значения на ваши реальные данные
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Применение миграций базы данных

Если у вас еще нет схемы в облачном Supabase, примените миграции:

```bash
# Подключиться к облачному проекту
supabase link --project-ref your-project-ref

# Применить миграции
supabase db push
```

### 4. Развертывание Edge Functions

```bash
# Развернуть все функции
supabase functions deploy

# Или по отдельности:
supabase functions deploy projects
supabase functions deploy applications  
supabase functions deploy chats
supabase functions deploy reviews
```

### 5. Запуск фронтенда

```bash
npm run dev
```

Приложение будет доступно по адресу: http://localhost:5173

## 🔑 Необходимые секреты для CI/CD

Для GitHub Actions нужно добавить в **Settings** → **Secrets and variables** → **Actions**:

```
SUPABASE_PROJECT_ID=your-project-ref
SUPABASE_ACCESS_TOKEN=your-access-token
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Access Token можно получить в: **Settings** → **Access Tokens**

## 🗄️ Проверка схемы базы данных

Убедитесь, что в вашем Supabase проекте есть следующие таблицы:

- `company_profiles`
- `researcher_profiles` 
- `projects`
- `applications`
- `chats`
- `messages`
- `reviews`

Также должны быть настроены RLS политики для безопасности.

## 🚀 После настройки

1. Проверьте работу аутентификации
2. Создайте тестовые профили компании и исследователя
3. Протестируйте создание проектов и подачу заявок
4. Проверьте работу чатов

## ❗ Важные моменты

- Убедитесь, что RLS (Row Level Security) включена
- Проверьте CORS настройки для вашего домена
- Настройте Email Authentication если планируете использовать
- Регулярно делайте бэкапы данных

## 🐛 Устранение неполадок

### Ошибки подключения:
- Проверьте правильность URL и ключей
- Убедитесь, что проект активен в Supabase

### Ошибки авторизации:
- Проверьте RLS политики
- Убедитесь, что anon key корректный

### Ошибки API:
- Проверьте развертывание Edge Functions
- Посмотрите логи в Supabase Dashboard 