import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { User } from '../types';

export default function Users() {
  const { users, addUser, updateUser, deleteUser } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', department: '', position: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await updateUser(editing, form);
    } else {
      await addUser(form);
    }
    setForm({ firstName: '', lastName: '', email: '', department: '', position: '' });
    setShowForm(false);
    setEditing(null);
  };

  const startEdit = (user: User) => {
    setForm({ firstName: user.firstName, lastName: user.lastName, email: user.email, department: user.department, position: user.position });
    setEditing(user.id);
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Сотрудники</h2>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ firstName: '', lastName: '', email: '', department: '', position: '' }); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Отдел</label>
              <input value={form.department} onChange={e => setForm({...form, department: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ФИО</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Отдел</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Должность</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Нет сотрудников</td></tr>
            ) : users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{user.lastName} {user.firstName}</td>
                <td className="px-4 py-3 text-gray-600">{user.email}</td>
                <td className="px-4 py-3 text-gray-600">{user.department}</td>
                <td className="px-4 py-3 text-gray-600">{user.position}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(user)} className="px-2 py-1 text-amber-600 hover:bg-amber-50 rounded text-xs">✏️</button>
                    <button onClick={async () => { if (confirm('Удалить сотрудника?')) await deleteUser(user.id); }} className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
