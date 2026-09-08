import React, { useState, useEffect } from 'react';
import * as api from '../api';
import { useData } from '../context/DataContext';

interface MaintenanceType {
  id: string;
  name: string;
  description: string;
  category_id: string | null;
  category_name?: string;
  interval_days: number;
  interval_months: number;
  interval_years: number;
}

export default function MaintenanceTypes() {
  const { categories } = useData();
  const [types, setTypes] = useState<MaintenanceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    category_id: '',
    interval_days: 0,
    interval_months: 0,
    interval_years: 0
  });

  useEffect(() => {
    loadTypes();
  }, []);

  const loadTypes = async () => {
    try {
      const data = await api.getMaintenanceTypes();
      setTypes(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        ...form,
        category_id: form.category_id || null
      };
      if (editing) {
        await api.updateMaintenanceType(editing, submitData);
      } else {
        await api.createMaintenanceType(submitData);
      }
      await loadTypes();
      setShowForm(false);
      setEditing(null);
      setForm({ name: '', description: '', category_id: '', interval_days: 0, interval_months: 0, interval_years: 0 });
    } catch (err: any) {
      alert('Ошибка: ' + err.message);
    }
  };

  const startEdit = (type: MaintenanceType) => {
    setForm({
      name: type.name,
      description: type.description,
      category_id: type.category_id || '',
      interval_days: type.interval_days,
      interval_months: type.interval_months,
      interval_years: type.interval_years
    });
    setEditing(type.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить тип обслуживания?')) return;
    try {
      await api.deleteMaintenanceType(id);
      await loadTypes();
    } catch (err: any) {
      alert('Ошибка: ' + err.message);
    }
  };

  const getIntervalText = (type: MaintenanceType) => {
    const parts = [];
    if (type.interval_days > 0) parts.push(`${type.interval_days} дн.`);
    if (type.interval_months > 0) parts.push(`${type.interval_months} мес.`);
    if (type.interval_years > 0) parts.push(`${type.interval_years} лет`);
    return parts.length > 0 ? parts.join(' ') : 'Не указан';
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Загрузка...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Типы обслуживания</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditing(null);
            setForm({ name: '', description: '', category_id: '', interval_days: 0, interval_months: 0, interval_years: 0 });
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          {showForm ? 'Скрыть форму' : '+ Добавить'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            {editing ? 'Редактировать тип обслуживания' : 'Новый тип обслуживания'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
              <input
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Категория оборудования</label>
              <select
                value={form.category_id}
                onChange={e => setForm({ ...form, category_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Все категории</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Оставьте пустым для применения ко всем категориям</p>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
              <input
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Интервал (дни)</label>
              <input
                type="number"
                min="0"
                value={form.interval_days}
                onChange={e => setForm({ ...form, interval_days: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Интервал (месяцы)</label>
              <input
                type="number"
                min="0"
                value={form.interval_months}
                onChange={e => setForm({ ...form, interval_months: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Интервал (годы)</label>
              <input
                type="number"
                min="0"
                value={form.interval_years}
                onChange={e => setForm({ ...form, interval_years: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              {editing ? 'Сохранить' : 'Добавить'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditing(null);
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
              <th className="text-left px-4 py-3 font-medium text-gray-600">Название</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Категория</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Описание</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Интервал</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {types.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  Нет типов обслуживания
                </td>
              </tr>
            ) : (
              types.map(type => (
                <tr key={type.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{type.name}</td>
                  <td className="px-4 py-3 text-gray-600">{type.category_name || 'Все категории'}</td>
                  <td className="px-4 py-3 text-gray-600">{type.description || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{getIntervalText(type)}</td>
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
    </div>
  );
}
