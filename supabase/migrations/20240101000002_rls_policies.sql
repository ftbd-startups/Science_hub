-- Включаем Row Level Security (RLS) для всех таблиц
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.researcher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Политики для таблицы users
-- Пользователи могут читать свою собственную запись
CREATE POLICY "Users can view own user data" ON public.users
FOR SELECT USING (auth.uid() = id);

-- Пользователи могут обновлять свою собственную запись
CREATE POLICY "Users can update own user data" ON public.users
FOR UPDATE USING (auth.uid() = id);

-- Политики для таблицы company_profiles
-- Компания может просматривать свой профиль
CREATE POLICY "Companies can view own profile" ON public.company_profiles
FOR SELECT USING (user_id = auth.uid());

-- Все пользователи могут просматривать профили компаний (для поиска проектов)
CREATE POLICY "Anyone can view company profiles" ON public.company_profiles
FOR SELECT USING (true);

-- Компания может создавать свой профиль
CREATE POLICY "Companies can create own profile" ON public.company_profiles
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Компания может обновлять свой профиль
CREATE POLICY "Companies can update own profile" ON public.company_profiles
FOR UPDATE USING (user_id = auth.uid());

-- Политики для таблицы researcher_profiles
-- Исследователь может просматривать свой профиль
CREATE POLICY "Researchers can view own profile" ON public.researcher_profiles
FOR SELECT USING (user_id = auth.uid());

-- Все пользователи могут просматривать профили исследователей (для поиска)
CREATE POLICY "Anyone can view researcher profiles" ON public.researcher_profiles
FOR SELECT USING (true);

-- Исследователь может создавать свой профиль
CREATE POLICY "Researchers can create own profile" ON public.researcher_profiles
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Исследователь может обновлять свой профиль
CREATE POLICY "Researchers can update own profile" ON public.researcher_profiles
FOR UPDATE USING (user_id = auth.uid());

-- Политики для таблицы projects
-- Все пользователи могут просматривать активные проекты
CREATE POLICY "Anyone can view active projects" ON public.projects
FOR SELECT USING (status = 'active');

-- Компания может просматривать свои проекты (любого статуса)
CREATE POLICY "Companies can view own projects" ON public.projects
FOR SELECT USING (
    company_id IN (
        SELECT id FROM public.company_profiles WHERE user_id = auth.uid()
    )
);

-- Компания может создавать проекты
CREATE POLICY "Companies can create projects" ON public.projects
FOR INSERT WITH CHECK (
    company_id IN (
        SELECT id FROM public.company_profiles WHERE user_id = auth.uid()
    )
);

-- Компания может обновлять свои проекты
CREATE POLICY "Companies can update own projects" ON public.projects
FOR UPDATE USING (
    company_id IN (
        SELECT id FROM public.company_profiles WHERE user_id = auth.uid()
    )
);

-- Компания может удалять свои проекты
CREATE POLICY "Companies can delete own projects" ON public.projects
FOR DELETE USING (
    company_id IN (
        SELECT id FROM public.company_profiles WHERE user_id = auth.uid()
    )
);

-- Политики для таблицы applications
-- Исследователь может просматривать свои заявки
CREATE POLICY "Researchers can view own applications" ON public.applications
FOR SELECT USING (
    researcher_id IN (
        SELECT id FROM public.researcher_profiles WHERE user_id = auth.uid()
    )
);

-- Компания может просматривать заявки на свои проекты
CREATE POLICY "Companies can view applications to own projects" ON public.applications
FOR SELECT USING (
    project_id IN (
        SELECT p.id FROM public.projects p
        JOIN public.company_profiles cp ON p.company_id = cp.id
        WHERE cp.user_id = auth.uid()
    )
);

-- Исследователь может создавать заявки
CREATE POLICY "Researchers can create applications" ON public.applications
FOR INSERT WITH CHECK (
    researcher_id IN (
        SELECT id FROM public.researcher_profiles WHERE user_id = auth.uid()
    )
);

-- Исследователь может обновлять свои заявки (только статус withdrawn)
CREATE POLICY "Researchers can update own applications" ON public.applications
FOR UPDATE USING (
    researcher_id IN (
        SELECT id FROM public.researcher_profiles WHERE user_id = auth.uid()
    )
) WITH CHECK (status = 'withdrawn');

-- Компания может обновлять статус заявок на свои проекты
CREATE POLICY "Companies can update application status" ON public.applications
FOR UPDATE USING (
    project_id IN (
        SELECT p.id FROM public.projects p
        JOIN public.company_profiles cp ON p.company_id = cp.id
        WHERE cp.user_id = auth.uid()
    )
);

-- Политики для таблицы chats
-- Участники заявки могут просматривать чат
CREATE POLICY "Application participants can view chat" ON public.chats
FOR SELECT USING (
    application_id IN (
        SELECT a.id FROM public.applications a
        JOIN public.researcher_profiles rp ON a.researcher_id = rp.id
        JOIN public.projects p ON a.project_id = p.id
        JOIN public.company_profiles cp ON p.company_id = cp.id
        WHERE rp.user_id = auth.uid() OR cp.user_id = auth.uid()
    )
);

-- Система автоматически создает чаты при принятии заявки
CREATE POLICY "System can create chats" ON public.chats
FOR INSERT WITH CHECK (true);

-- Политики для таблицы chat_messages
-- Участники чата могут просматривать сообщения
CREATE POLICY "Chat participants can view messages" ON public.chat_messages
FOR SELECT USING (
    chat_id IN (
        SELECT c.id FROM public.chats c
        JOIN public.applications a ON c.application_id = a.id
        JOIN public.researcher_profiles rp ON a.researcher_id = rp.id
        JOIN public.projects p ON a.project_id = p.id
        JOIN public.company_profiles cp ON p.company_id = cp.id
        WHERE rp.user_id = auth.uid() OR cp.user_id = auth.uid()
    )
);

-- Участники чата могут отправлять сообщения
CREATE POLICY "Chat participants can send messages" ON public.chat_messages
FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    chat_id IN (
        SELECT c.id FROM public.chats c
        JOIN public.applications a ON c.application_id = a.id
        JOIN public.researcher_profiles rp ON a.researcher_id = rp.id
        JOIN public.projects p ON a.project_id = p.id
        JOIN public.company_profiles cp ON p.company_id = cp.id
        WHERE rp.user_id = auth.uid() OR cp.user_id = auth.uid()
    )
);

-- Политики для таблицы reviews
-- Все пользователи могут просматривать отзывы
CREATE POLICY "Anyone can view reviews" ON public.reviews
FOR SELECT USING (true);

-- Участники заявки могут создавать отзывы друг на друга
CREATE POLICY "Application participants can create reviews" ON public.reviews
FOR INSERT WITH CHECK (
    reviewer_id = auth.uid() AND
    application_id IN (
        SELECT a.id FROM public.applications a
        JOIN public.researcher_profiles rp ON a.researcher_id = rp.id
        JOIN public.projects p ON a.project_id = p.id
        JOIN public.company_profiles cp ON p.company_id = cp.id
        WHERE (rp.user_id = auth.uid() AND reviewee_id = cp.user_id) OR
              (cp.user_id = auth.uid() AND reviewee_id = rp.user_id)
    )
);

-- Функция для автоматического создания записи в public.users при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, role)
    VALUES (NEW.id, NEW.email, 'researcher'); -- По умолчанию роль исследователя
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер для автоматического создания пользователя
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 