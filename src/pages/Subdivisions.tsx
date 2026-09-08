import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Subdivision } from '../types';

export default function Subdivisions() {
  const { subdivisions, addSubdivision, updateSubdivision, deleteSubdivision } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', parentId: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await updateSubdivision(editing, form);
    } else {
      await addSubdivision(form);
    }
    setForm({ name: '', description: '', parentId: '' });
    setShowForm(false);
    setEditing(null);
  };

  const startEdit = (subdivision: Subdivision) => {
    setForm({ 
      name: subdivision.name, 
      description: subdivision.description, 
      parentId: subdivision.parentId || '' 
    });
    setEditing(subdivision.id);
    setShowForm(true);
  };

  const getParentName = (parentId: string | null) => {
    if (!parentId) return '—';
    const parent = subdivisions.find(s => s.id === parentId);
    return parent ? parent.name : '—';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Подразделения</h2>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ name: '', description: '', parentId: '' }); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          {showForm ? 'Скрыть форму' : '+ Добавить'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">{editing ? 'Редактировать подразделение' : 'Новое подразделение'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
              <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Родительское подразделение</label>
              <select value={form.parentId} onChange={e => setForm({...form, parentId: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Нет (корневое)</option>
                {subdivisions.filter(s => s.id !== editing).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">{editing ? 'Сохранить' : 'Добавить'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Отмена</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subdivisions.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">Нет подразделений</div>
        ) : subdivisions.map(subdivision => (
          <div key={subdivision.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800">{subdivision.name}</h4>
                <p className="text-sm text-gray-500 mt-1">Родитель: {getParentName(subdivision.parentId)}</p>
                {subdivision.description && <p className="text-xs text-gray-400 mt-2">{subdivision.description}</p>}
              </div>
              <div className="flex gap-1 ml-2">
                <button onClick={() => startEdit(subdivision)} className="px-2 py-1 text-amber-600 hover:bg-amber-50 rounded text-xs">✏️</button>
                <button onClick={async () => { if (confirm('Удалить подразделение?')) await deleteSubdivision(subdivision.id); }} className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs">🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
