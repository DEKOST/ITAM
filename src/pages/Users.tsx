import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { User } from '../types';

export default function Users() {
  const { users, subdivisions, addUser, updateUser, deleteUser, addSubdivision } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', middleName: '', email: '', subdivisionId: '', position: '' });
  const [search, setSearch] = useState('');
  const [filterSubdivision, setFilterSubdivision] = useState('');
  const [showSubdivisionModal, setShowSubdivisionModal] = useState(false);
  const [newSubdivisionName, setNewSubdivisionName] = useState('');

  const filtered = users.filter(user => {
    const fullName = `${user.lastName} ${user.firstName} ${user.middleName || ''}`.toLowerCase();
    const matchSearch = fullName.includes(search.toLowerCase()) || 
                       user.email.toLowerCase().includes(search.toLowerCase()) ||
                       user.position.toLowerCase().includes(search.toLowerCase());
    const matchSubdivision = !filterSubdivision || user.subdivisionId === filterSubdivision;
    return matchSearch && matchSubdivision;
  });

  const getSubdivisionName = (subdivisionId: string | null) => {
    if (!subdivisionId) return '—';
    const subdivision = subdivisions.find(s => s.id === subdivisionId);
    return subdivision ? subdivision.name : '—';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await updateUser(editing, form);
    } else {
      await addUser(form);
    }
    setForm({ firstName: '', lastName: '', middleName: '', email: '', subdivisionId: '', position: '' });
    setShowForm(false);
    setEditing(null);
  };

  const startEdit = (user: User) => {
    setForm({ 
      firstName: user.firstName, 
      lastName: user.lastName, 
      middleName: user.middleName || '',
      email: user.email, 
      subdivisionId: user.subdivisionId || '', 
      position: user.position 
    });
    setEditing(user.id);
    setShowForm(true);
  };

  const handleCreateSubdivision = async () => {
    if (!newSubdivisionName.trim()) {
      alert('Введите название подразделения');
      return;
    }
    try {
      const newSubdivision = await addSubdivision({
        name: newSubdivisionName.trim(),
        description: '',
        parentId: null
      });
      setForm({ ...form, subdivisionId: newSubdivision.id });
      setShowSubdivisionModal(false);
      setNewSubdivisionName('');
    } catch (error: any) {
      alert('Ошибка создания подразделения: ' + error.message);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Сотрудники</h2>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ firstName: '', lastName: '', middleName: '', email: '', subdivisionId: '', position: '' }); }} className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          {showForm ? 'Скрыть форму' : '+ Добавить'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">{editing ? 'Редактировать сотрудника' : 'Новый сотрудник'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Фамилия *</label>
              <input required value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Имя *</label>
              <input required value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Отчество</label>
              <input value={form.middleName} onChange={e => setForm({...form, middleName: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Подразделение</label>
              <div className="flex gap-2">
                <select value={form.subdivisionId} onChange={e => setForm({...form, subdivisionId: e.target.value})} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Не указано</option>
                  {subdivisions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <button 
                  type="button"
                  onClick={() => setShowSubdivisionModal(true)}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                  title="Создать новое подразделение"
                >
                  +
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Должность</label>
              <input value={form.position} onChange={e => setForm({...form, position: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">{editing ? 'Сохранить' : 'Добавить'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Отмена</button>
          </div>
        </form>
      )}

      {/* Фильтры и поиск */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Поиск по ФИО, email, должности..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select value={filterSubdivision} onChange={e => setFilterSubdivision(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Все подразделения</option>
            {subdivisions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="sm:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">Сотрудники не найдены</div>
        ) : filtered.map(user => (
          <div key={user.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <Link to={`/users/${user.id}`} className="block">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 truncate">{user.lastName} {user.firstName} {user.middleName}</h3>
                  <p className="text-xs text-gray-500 truncate">{user.position}</p>
                </div>
                <div className="flex gap-1 ml-2">
                  <button onClick={(e) => { e.preventDefault(); startEdit(user); }} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg">✏️</button>
                  <button onClick={(e) => { e.preventDefault(); if (confirm('Удалить сотрудника?')) deleteUser(user.id); }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">🗑️</button>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600 space-y-1">
                {user.email && <p><span className="text-gray-400">Email:</span> {user.email}</p>}
                <p><span className="text-gray-400">Подразделение:</span> {getSubdivisionName(user.subdivisionId)}</p>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <span className="text-xs text-blue-600 font-medium">👁️ Просмотр оборудования →</span>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ФИО</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Подразделение</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Должность</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Сотрудники не найдены</td></tr>
            ) : filtered.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">
                  <Link to={`/users/${user.id}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                    {user.lastName} {user.firstName} {user.middleName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{user.email}</td>
                <td className="px-4 py-3 text-gray-600">{getSubdivisionName(user.subdivisionId)}</td>
                <td className="px-4 py-3 text-gray-600">{user.position}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Link to={`/users/${user.id}`} className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded text-xs">👁️</Link>
                    <button onClick={() => startEdit(user)} className="px-3 py-1.5 text-amber-600 hover:bg-amber-50 rounded text-xs">✏️</button>
                    <button onClick={async () => { if (confirm('Удалить сотрудника?')) await deleteUser(user.id); }} className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded text-xs">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-gray-500 mt-3">Найдено: {filtered.length} из {users.length}</p>

      {/* Модальное окно создания подразделения */}
      {showSubdivisionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Новое подразделение</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Название подразделения *</label>
                <input
                  type="text"
                  value={newSubdivisionName}
                  onChange={e => setNewSubdivisionName(e.target.value)}
                  placeholder="Введите название"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleCreateSubdivision} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">Создать</button>
              <button onClick={() => { setShowSubdivisionModal(false); setNewSubdivisionName(''); }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
