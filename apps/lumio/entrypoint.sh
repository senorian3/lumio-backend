#!/bin/sh
set -e

echo "========================================"
echo "🚀 Starting Lumio Backend"
echo "========================================"

echo "📦 NODE_ENV: $NODE_ENV"
echo "🔧 Applying database migrations..."

# Применяем миграции
npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo "✅ Database migrations applied successfully"
else
    echo "❌ Failed to apply migrations"
    echo "⚠️ Trying db push as fallback..."
    npx prisma db push --accept-data-loss
fi

echo "========================================"
echo "🚀 Starting application..."
echo "========================================"

# Запускаем приложение
exec node dist/apps/lumio/app/main