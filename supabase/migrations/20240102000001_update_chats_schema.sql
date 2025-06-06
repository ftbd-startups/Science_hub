-- Обновление схемы чатов для соответствия реализованному API

-- Добавляем новые типы для чатов и сообщений
CREATE TYPE chat_status AS ENUM ('active', 'closed', 'archived');
CREATE TYPE message_type AS ENUM ('text', 'file');

-- Обновляем таблицу chats
ALTER TABLE public.chats 
ADD COLUMN company_id UUID REFERENCES public.company_profiles(id) ON DELETE CASCADE,
ADD COLUMN researcher_id UUID REFERENCES public.researcher_profiles(id) ON DELETE CASCADE,
ADD COLUMN status chat_status DEFAULT 'active';

-- Заполняем новые поля на основе существующих данных
UPDATE public.chats SET 
  company_id = (
    SELECT p.company_id 
    FROM public.applications a
    JOIN public.projects p ON a.project_id = p.id
    WHERE a.id = chats.application_id
  ),
  researcher_id = (
    SELECT a.researcher_id 
    FROM public.applications a
    WHERE a.id = chats.application_id
  );

-- Добавляем NOT NULL ограничения после заполнения данных
ALTER TABLE public.chats 
ALTER COLUMN company_id SET NOT NULL,
ALTER COLUMN researcher_id SET NOT NULL;

-- Переименовываем таблицу chat_messages в messages
ALTER TABLE public.chat_messages RENAME TO messages;

-- Добавляем новые поля в таблицу messages
ALTER TABLE public.messages
ADD COLUMN message_type message_type DEFAULT 'text',
ADD COLUMN file_url TEXT;

-- Обновляем существующие сообщения
UPDATE public.messages SET message_type = 'text';

-- Делаем message_type NOT NULL
ALTER TABLE public.messages ALTER COLUMN message_type SET NOT NULL;

-- Обновляем индексы
DROP INDEX IF EXISTS idx_chat_messages_chat_id;
DROP INDEX IF EXISTS idx_chat_messages_created_at;

CREATE INDEX idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_chats_company_id ON public.chats(company_id);
CREATE INDEX idx_chats_researcher_id ON public.chats(researcher_id);
CREATE INDEX idx_chats_status ON public.chats(status);

-- Обновляем триггеры
DROP TRIGGER IF EXISTS update_chat_messages_updated_at ON public.chat_messages;
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 