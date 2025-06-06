# Задача 1.3: Создание начальной схемы БД и RLS политик

## Информация о задаче
- **ID:** 1.3
- **Статус:** Ожидание
- **Зависимости:** 1.2
- **Приоритет:** Высокий
- **Ответственный:** AI-Backend-Agent
- **Фаза:** 1 - Инициализация и Настройка

## Описание
Создать SQL-миграцию в `supabase/migrations/` для всех таблиц, перечисленных в разделе 2.5. Для каждой таблицы включить RLS и создать базовые политики, разрешающие пользователям управлять только своими данными.

## Критерии приемки
- Команда `supabase db reset` успешно применяет миграцию
- RLS включен для всех таблиц

## Технические детали
- Создание таблиц: users, company_profiles, researcher_profiles, projects, applications, chats, chat_messages, reviews
- Настройка Row Level Security (RLS) политик
- Создание индексов для оптимизации запросов
- Настройка внешних ключей и ограничений

## Схема БД
```sql
-- users (управляется Supabase Auth)
-- company_profiles
-- researcher_profiles  
-- projects
-- applications
-- chats
-- chat_messages
-- reviews
```

## Связанные файлы
- `supabase/migrations/` - SQL миграции
- `supabase/seed.sql` - тестовые данные 