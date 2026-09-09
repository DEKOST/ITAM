import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const themes = [
    { value: 'light', label: '☀️', title: 'Светлая тема' },
    { value: 'dark', label: '🌙', title: 'Тёмная тема' },
    { value: 'system', label: '💻', title: 'Системная тема' },
  ];

  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      {themes.map((t) => (
        <button
          key={t.value}
          onClick={() => setTheme(t.value as any)}
          title={t.title}
          className={`px-2 py-1 rounded-md text-sm transition-all ${
            theme === t.value
              ? 'bg-white dark:bg-gray-700 shadow-sm'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
