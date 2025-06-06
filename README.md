# Science Hub MVP

Онлайн-платформа (marketplace) для поиска и привлечения ученых в проекты компаний.

## 🎯 Цель проекта

Создание централизованной площадки для коммуникации между компаниями и индивидуальными учеными. Основной сценарий: компания публикует проект, ученый подает заявку, стороны общаются в чате и фиксируют договоренности.

## 🛠 Технологический стек

- **Frontend:** React 18, TypeScript, Vite, TailwindCSS, Zustand, React Query
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions)
- **Инфраструктура:** Docker, Docker Compose, GitHub Actions

## 🚀 Быстрый старт

### Предварительные требования

- Node.js 18+
- npm или yarn
- Docker и Docker Compose
- Supabase CLI

### Установка

1. Клонируйте репозиторий:
```bash
git clone <repository-url>
cd science-hub-mvp
```

2. Установите зависимости:
```bash
# Корневые зависимости
npm install

# Зависимости фронтенда
cd frontend
npm install
cd ..
```

3. Настройте переменные окружения:
```bash
cp .env.example .env.local
# Отредактируйте .env.local с вашими настройками Supabase
```

4. Запустите в режиме разработки:
```bash
# Через Docker Compose (рекомендуется)
npm run docker:dev

# Или локально
npm run supabase:start
npm run dev
```

## 📁 Структура проекта

```
science-hub-mvp/
├── frontend/           # React приложение
│   ├── src/
│   │   ├── components/ # UI компоненты
│   │   ├── features/   # Фичи (auth, projects, etc.)
│   │   ├── hooks/      # React хуки
│   │   ├── lib/        # Утилиты и библиотеки
│   │   ├── services/   # API сервисы
│   │   ├── store/      # Zustand store
│   │   └── types/      # TypeScript типы
├── supabase/          # Supabase конфигурация
│   ├── functions/     # Edge Functions
│   └── migrations/    # SQL миграции
├── tasks/             # Задачи разработки
└── project_docs/      # Документация проекта
```

## 🎬 Основные команды

```bash
# Разработка
npm run dev              # Запуск dev сервера фронтенда
npm run docker:dev       # Запуск через Docker Compose

# Сборка
npm run build            # Сборка для production

# Качество кода
npm run lint             # Линтинг
npm run lint:fix         # Автоисправление линтинга
npm run format           # Форматирование кода

# Supabase
npm run supabase:start   # Запуск локального Supabase
npm run supabase:stop    # Остановка локального Supabase
npm run supabase:reset   # Сброс и применение миграций
```

## 🎉 Статус проекта

**MVP ПОЛНОСТЬЮ ЗАВЕРШЕН!** ✅

### ✅ Фаза 1: Инициализация (0.5 недели)
- [x] Настройка проекта и репозитория
- [x] Настройка Supabase и Docker
- [x] Создание схемы БД и RLS политик

### ✅ Фаза 2: Аутентификация (1 неделя)
- [x] UI для регистрации и входа
- [x] Создание профилей после регистрации
- [x] UI для редактирования профилей

### ✅ Фаза 3: Проекты (1.5 недели)
- [x] CRUD API для проектов
- [x] UI для списка и просмотра проектов
- [x] UI для управления проектами компании

### ✅ Фаза 4: Заявки и чаты (2 недели)
- [x] CRUD API для заявок
- [x] UI подачи заявок
- [x] Настройка Realtime для чатов
- [x] UI чата

### ✅ Фаза 5: Отзывы и CI/CD (1 неделя)
- [x] API для отзывов
- [x] UI системы отзывов
- [x] Настройка CI/CD

## 🚀 Готов к production!

Все основные функции MVP реализованы:
- 🔐 Аутентификация и профили пользователей
- 📋 Управление проектами
- 📝 Система заявок
- 💬 Real-time чаты
- ⭐ Система отзывов
- 🛠 CI/CD и автоматическое развертывание

См. [MVP_COMPLETION_REPORT.md](MVP_COMPLETION_REPORT.md) для подробного отчета.

## 🤝 Принципы разработки

- **MVP-подход:** Фокус на основных функциях без усложнений
- **Безопасность:** Row Level Security (RLS) для всех операций с данными
- **Производительность:** Оптимистичные обновления UI, кеширование запросов
- **UX:** Интуитивный интерфейс, адаптивность для мобильных устройств

## 📝 Лицензия

MIT License 