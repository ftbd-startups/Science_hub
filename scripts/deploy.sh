#!/bin/bash

# Science Hub Deployment Script
# Этот скрипт автоматизирует процесс развертывания MVP

set -e

echo "🚀 Starting Science Hub deployment..."

# Проверка зависимостей
check_dependencies() {
    echo "📋 Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo "❌ npm is not installed"
        exit 1
    fi
    
    if ! command -v supabase &> /dev/null; then
        echo "❌ Supabase CLI is not installed"
        echo "Install it with: npm install -g supabase"
        exit 1
    fi
    
    echo "✅ All dependencies are installed"
}

# Проверка переменных окружения
check_env() {
    echo "🔧 Checking environment variables..."
    
    if [ -z "$SUPABASE_PROJECT_ID" ]; then
        echo "❌ SUPABASE_PROJECT_ID is not set"
        exit 1
    fi
    
    if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
        echo "❌ SUPABASE_ACCESS_TOKEN is not set"
        exit 1
    fi
    
    echo "✅ Environment variables are set"
}

# Развертывание базы данных
deploy_database() {
    echo "🗄️ Deploying database..."
    
    # Связывание с проектом Supabase
    supabase link --project-ref $SUPABASE_PROJECT_ID
    
    # Применение миграций
    supabase db push
    
    # Развертывание Edge Functions
    supabase functions deploy --no-verify-jwt
    
    echo "✅ Database deployed successfully"
}

# Сборка и развертывание фронтенда
deploy_frontend() {
    echo "🎨 Building and deploying frontend..."
    
    cd frontend
    
    # Установка зависимостей
    npm ci
    
    # Линтинг
    npm run lint
    
    # Проверка типов
    npm run type-check
    
    # Сборка
    npm run build
    
    cd ..
    
    echo "✅ Frontend built successfully"
}

# Проверка развертывания
verify_deployment() {
    echo "🔍 Verifying deployment..."
    
    # Проверка статуса Supabase
    supabase status
    
    echo "✅ Deployment verified"
}

# Основная функция
main() {
    echo "🌟 Science Hub MVP Deployment"
    echo "=============================="
    
    check_dependencies
    check_env
    deploy_database
    deploy_frontend
    verify_deployment
    
    echo ""
    echo "🎉 Deployment completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Configure your domain in Vercel"
    echo "2. Set up monitoring and analytics"
    echo "3. Configure backup strategies"
    echo ""
    echo "🔗 Useful links:"
    echo "- Supabase Dashboard: https://app.supabase.com/project/$SUPABASE_PROJECT_ID"
    echo "- Frontend: Check your Vercel dashboard"
    echo ""
}

# Обработка аргументов командной строки
case "${1:-}" in
    "database")
        check_dependencies
        check_env
        deploy_database
        ;;
    "frontend")
        check_dependencies
        deploy_frontend
        ;;
    "verify")
        check_dependencies
        check_env
        verify_deployment
        ;;
    *)
        main
        ;;
esac 