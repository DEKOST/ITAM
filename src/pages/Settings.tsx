import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user } = useAuth();
  const [timezone, setTimezone] = useState<string>('');
  const [saved, setSaved] = useState(false);

  // Список популярных часовых поясов
  const timezones = [
    { value: 'UTC', label: 'UTC (Всемирное координированное время)' },
    { value: 'Europe/Moscow', label: 'Москва (UTC+3)' },
    { value: 'Europe/Kiev', label: 'Киев (UTC+2)' },
    { value: 'Europe/Minsk', label: 'Минск (UTC+3)' },
    { value: 'Asia/Yekaterinburg', label: 'Екатеринбург (UTC+5)' },
    { value: 'Asia/Novosibirsk', label: 'Новосибирск (UTC+7)' },
    { value: 'Asia/Vladivostok', label: 'Владивосток (UTC+10)' },
    { value: 'America/New_York', label: 'Нью-Йорк (UTC-5)' },
    { value: 'America/Los_Angeles', label: 'Лос-Анджелес (UTC-8)' },
    { value: 'Europe/London', label: 'Лондон (UTC+0)' },
    { value: 'Europe/Berlin', label: 'Берлин (UTC+1)' },
    { value: 'Asia/Tokyo', label: 'Токио (UTC+9)' },
    { value: 'Asia/Shanghai', label: 'Шанхай (UTC+8)' },
  ];

  useEffect(() => {
    // Загружаем сохранённый часовой пояс из localStorage
    const savedTimezone = localStorage.getItem('user_timezone');
    if (savedTimezone) {
      setTimezone(savedTimezone);
    } else {
      // Если не сохранён, используем часовой пояс браузера
      const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setTimezone(browserTimezone);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('user_timezone', timezone);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Настройки</h1>
        
        <div className="space-y-6">
          {/* Профиль пользователя */}
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Профиль</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Имя пользователя: <span className="font-medium">{user?.username}</span></p>
              <p className="text-sm text-gray-600">Роль: <span className="font-medium">{user?.role === 'admin' ? 'Администратор' : 'Пользователь'}</span></p>
            </div>
          </div>

          {/* Часовой пояс */}
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Часовой пояс</h2>
            <p className="text-sm text-gray-600 mb-3">
              Выберите часовой пояс для отображения дат и времени в системе
            </p>
            <div className="flex gap-3">
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {timezones.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Сохранить
              </button>
            </div>
            {saved && (
              <p className="text-sm text-green-600 mt-2">✓ Настройки сохранены</p>
            )}
          </div>

          {/* Информация */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">ℹ️ Информация</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Часовой пояс влияет на отображение всех дат и времени в системе</li>
              <li>• Настройка сохраняется в вашем браузере</li>
              <li>• По умолчанию используется часовой пояс вашего браузера</li>
              <li>• Изменения применяются сразу после сохранения</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
