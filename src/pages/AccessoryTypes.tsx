import React, { useState, useEffect } from 'react';
import { getAccessoryTypes, createAccessoryType, updateAccessoryType, deleteAccessoryType } from '../api';

interface AccessoryType {
  id: string;
  name: string;
  icon: string;
}

export default function AccessoryTypes() {
  const [types, setTypes] = useState<AccessoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', icon: '🔌' });

  const iconOptions = ['🔌', '🖱️', '⌨️', '📷', '🎧', '🔊', '🖨️', '💾', '💿', '📀', '🎮', '🕹️'];

  useEffect(() => {
    loadTypes();
  }, []);

  const loadTypes = async () => {
    try {
      const data = await getAccessoryTypes();
      setTypes(data);
    } catch (error) {
      console.error('Ошибка загрузки типов аксессуаров:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name.trim()) {
      alert('Введите название типа аксессуара');
      return;
    }

    try {
      if (editing) {
        await updateAccessoryType(editing, form.name, form.icon);
      } else {
        await createAccessoryType(form.name, form.icon);
      }
      
      await loadTypes();
      setShowForm(false);
      setEditing(null);
      setForm({ name: '', icon: '🔌' });
    } catch (error: any) {
      alert('Ошибка: ' + error.message);
    }
  };

  const startEdit = (type: AccessoryType) => {
    setForm({ name: type.name, icon: type.icon });
    setEditing(type.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить этот тип аксессуара?')) return;

    try {
      await deleteAccessoryType(id);
      await loadTypes();
    } catch (error: any) {
      alert('Ошибка удаления: ' + error.message);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Загрузка...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Типы аксессуаров</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditing(null);
            setForm({ name: '', icon: '🔌' });
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          {showForm ? 'Скрыть форму' : '+ Добавить тип'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            {editing ? 'Редактировать тип аксессуара' : 'Новый тип аксессуара'}
          </h3>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Например: Мышь"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Иконка</label>
              <div className="grid grid-cols-6 gap-2">
                {iconOptions.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setForm({ ...form, icon })}
                    className={`p-3 text-2xl rounded-lg border-2 transition-all ${
                      form.icon === icon
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              {editing ? 'Сохранить' : 'Создать'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditing(null);
                setForm({ name: '', icon: '🔌' });
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
            >
              Отмена
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Иконка</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Название</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {types.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                  Нет типов аксессуаров
                </td>
              </tr>
            ) : (
              types.map(type => (
                <tr key={type.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-2xl">{type.icon}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{type.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(type)}
                        className="px-2 py-1 text-amber-600 hover:bg-amber-50 rounded text-xs"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(type.id)}
                        className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">💡 Информация</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Типы аксессуаров используются для привязки периферии к оборудованию</li>
          <li>• Можно добавлять свои типы с выбором иконки</li>
          <li>• Удаление типа не удаляет уже привязанные аксессуары</li>
        </ul>
      </div>
    </div>
  );
}
