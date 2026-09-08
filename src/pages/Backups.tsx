import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../api';

interface Backup {
  filename: string;
  size: number;
  sizeFormatted: string;
  created: string;
  isManual: boolean;
}

export default function Backups() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      const data = await api.getBackups();
      setBackups(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    if (!confirm('Создать резервную копию БД?')) return;
    setCreating(true);
    try {
      await api.createBackup();
      await loadBackups();
      alert('✅ Резервная копия создана');
    } catch (err: any) {
      alert('❌ Ошибка: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const restoreBackup = async (filename: string) => {
    if (!confirm(`Восстановить БД из ${filename}?\n\n⚠️ ВСЕ ТЕКУЩИЕ ДАННЫЕ БУДУТ УТЕРЯНЫ!`)) return;
    if (!confirm('Вы уверены? Это действие необратимо!')) return;
    try {
      await api.restoreBackup(filename);
      alert('✅ БД восстановлена. Перезапустите сервер.');
    } catch (err: any) {
      alert('❌ Ошибка: ' + err.message);
    }
  };

  const deleteBackup = async (filename: string) => {
    if (!confirm(`Удалить бэкап ${filename}?`)) return;
    try {
      await api.deleteBackup(filename);
      await loadBackups();
    } catch (err: any) {
      alert('❌ Ошибка: ' + err.message);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Загрузка...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Резервные копии БД</h2>
          <p className="text-sm text-gray-500 mt-1">Автоматическое копирование ежедневно в 3:00</p>
        </div>
        <button
          onClick={createBackup}
          disabled={creating}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {creating ? 'Создание...' : '+ Создать бэкап'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Файл</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Тип</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Размер</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Создан</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {backups.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Нет резервных копий</td></tr>
            ) : backups.map(backup => (
              <tr key={backup.filename} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-800">{backup.filename}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${backup.isManual ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                    {backup.isManual ? 'Ручной' : 'Авто'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{backup.sizeFormatted}</td>
                <td className="px-4 py-3 text-gray-600">{new Date(backup.created).toLocaleString('ru-RU')}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button
                      onClick={() => restoreBackup(backup.filename)}
                      className="px-2 py-1 text-green-600 hover:bg-green-50 rounded text-xs"
                      title="Восстановить"
                    >
                      🔄
                    </button>
                    <button
                      onClick={() => deleteBackup(backup.filename)}
                      className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs"
                      title="Удалить"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">ℹ️ Информация</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Автоматические бэкапы создаются ежедневно в 3:00</li>
          <li>• Хранится максимум 30 последних копий</li>
          <li>• Файлы бэкапов находятся в папке <code className="bg-blue-100 px-1 rounded">server/backups/</code></li>
          <li>• При восстановлении сервер нужно перезапустить</li>
        </ul>
      </div>
    </div>
  );
}
