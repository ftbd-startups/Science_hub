# 🔐 Настройка GitHub Secrets для Science Hub

## Необходимые секреты

Перейдите в ваш GitHub репозиторий:
```
Settings > Secrets and variables > Actions > New repository secret
```

Добавьте следующие секреты:

### 📊 Supabase Secrets
```
SUPABASE_PROJECT_ID=ваш_project_id
SUPABASE_ACCESS_TOKEN=ваш_access_token  
VITE_SUPABASE_URL=https://ваш-проект.supabase.co
VITE_SUPABASE_ANON_KEY=ваш_anon_key
```

### 🚀 Vercel Secrets  
```
VERCEL_TOKEN=ваш_vercel_token
VERCEL_ORG_ID=ваш_org_id
VERCEL_PROJECT_ID=ваш_project_id
```

## 📋 Где получить эти данные:

### Supabase:
1. Зайдите на [supabase.com](https://supabase.com)
2. Создайте новый проект или откройте существующий
3. **Settings > General**:
   - `SUPABASE_PROJECT_ID` = Reference ID
4. **Settings > API**:
   - `VITE_SUPABASE_URL` = Project URL
   - `VITE_SUPABASE_ANON_KEY` = anon public key
5. **Settings > Access Tokens**:
   - `SUPABASE_ACCESS_TOKEN` = создать новый токен

### Vercel:
1. Зайдите на [vercel.com](https://vercel.com)
2. Подключите GitHub репозиторий
3. **Settings > Tokens**:
   - `VERCEL_TOKEN` = создать новый токен
4. **Settings > General**:
   - `VERCEL_ORG_ID` и `VERCEL_PROJECT_ID` в настройках проекта

## ✅ После добавления секретов:

1. Сделайте любой коммит в main ветку
2. GitHub Actions автоматически развернет проект
3. Проверьте статус в разделе Actions

## 🔍 Проверка статуса:
- GitHub Actions: `https://github.com/ваш-username/Science_hub/actions`
- Vercel Dashboard: `https://vercel.com/dashboard`  
- Supabase Dashboard: `https://app.supabase.com` 