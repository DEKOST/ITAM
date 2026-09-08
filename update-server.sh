#!/bin/bash

# Скрипт обновления ITAM Service на сервере

echo "🚀 Начинаем обновление ITAM Service..."

# Копирование новых файлов
echo "📦 Копирование файлов на сервер..."
scp -r dist/* user@server:/opt/itam-service/dist/
scp server/db.js user@server:/opt/itam-service/server/
scp server/routes/maintenanceTypes.js user@server:/opt/itam-service/server/routes/
scp server/routes/maintenance.js user@server:/opt/itam-service/server/routes/

# Перезапуск сервера
echo "🔄 Перезапуск сервера..."
ssh user@server "cd /opt/itam-service/server && pm2 restart itam-service"

echo "✅ Обновление завершено!"
echo ""
echo "📋 Что было обновлено:"
echo "  - Год в копирайте теперь динамический"
echo "  - Добавлено предупреждение о безопасности на странице входа"
echo "  - Типы обслуживания привязаны к категориям"
echo "  - Убраны поля 'Стоимость' и 'Кем выполнено'"
echo "  - Обслуживание отображается на странице полной информации"
echo ""
echo "🌐 Откройте: https://itam.donhen.ru"
