# Задача 4.3: Backend: Настройка Realtime для Чатов

## Информация о задаче
- **ID:** 4.3
- **Статус:** Ожидание
- **Зависимости:** 4.1
- **Приоритет:** Высокий
- **Ответственный:** AI-Backend-Agent
- **Фаза:** 4 - Заявки и Коммуникация

## Описание
Настроить Supabase Realtime для таблицы `chat_messages` с безопасными RLS-политиками для real-time коммуникации между участниками чата.

### Основные задачи:
1. В настройках проекта Supabase включить Realtime для таблицы `chat_messages`
2. Создать RLS-политики для таблицы `chat_messages`, которые разрешают `SELECT` и `INSERT` только для участников чата
3. Участники чата: `researcher`, подавший заявку, и `user` из компании-владельца проекта

## Критерии приемки
- Realtime для `chat_messages` включен в Supabase
- RLS-политики не позволяют пользователям читать или писать в чужие чаты
- Только участники чата могут видеть и отправлять сообщения
- Политики работают через сложные JOIN запросы для определения участников

## Технические детали
Создать RLS-политики с использованием JOIN для определения участников чата:

### Пример RLS для SELECT:
```sql
CREATE POLICY "Allow read for chat participants" ON chat_messages FOR SELECT USING (
  auth.uid() IN (
    SELECT a.researcher_id FROM applications a 
    JOIN chats c ON c.application_id = a.id 
    WHERE c.id = chat_id
    UNION
    SELECT p.company_id FROM projects p 
    JOIN applications a ON a.project_id = p.id 
    JOIN chats c ON c.application_id = a.id 
    WHERE c.id = chat_id
  )
);
```

### Пример RLS для INSERT:
```sql
CREATE POLICY "Allow insert for chat participants" ON chat_messages FOR INSERT WITH CHECK (
  auth.uid() IN (
    SELECT a.researcher_id FROM applications a 
    JOIN chats c ON c.application_id = a.id 
    WHERE c.id = chat_id
    UNION
    SELECT p.company_id FROM projects p 
    JOIN applications a ON a.project_id = p.id 
    JOIN chats c ON c.application_id = a.id 
    WHERE c.id = chat_id
  )
);
```

## Связанные файлы
- `supabase/migrations/` - RLS политики для chat_messages
- Настройки Supabase проекта - включение Realtime
- Модели данных: chat_messages, chats, applications, projects

## Входные данные
Конфигурация Supabase Realtime и RLS политики

## Выходные данные
Безопасная real-time система сообщений с ограниченным доступом 