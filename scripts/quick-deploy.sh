#!/bin/bash

# Quick Deploy Script для Science Hub
# Этот скрипт поможет быстро развернуть проект

echo "🚀 Science Hub - Quick Deploy"
echo "=============================="

# Проверка git статуса
echo "📊 Проверка Git статуса..."
if ! git diff --quiet; then
    echo "⚠️  Есть несохраненные изменения. Сохраняем..."
    git add .
    git commit -m "🚀 Deploy: $(date '+%Y-%m-%d %H:%M:%S')"
fi

# Пуш в main для автоматического деплоя
echo "🔄 Отправка изменений в GitHub..."
git push origin main

echo ""
echo "✅ Готово! Автоматический деплой начался."
echo ""
echo "🔍 Проверить статус:"
echo "   GitHub Actions: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^.]*\).*/\1/')/actions"
echo "   Vercel: https://vercel.com/dashboard"
echo "   Supabase: https://app.supabase.com"
echo ""
echo "⏱️  Ожидаемое время деплоя: 3-5 минут" 