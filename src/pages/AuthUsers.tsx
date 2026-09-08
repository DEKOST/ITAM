import React, { useState, useEffect } from 'react';
import * as api from '../api';
import { useAuth } from '../context/AuthContext';

interface AuthUser {
  id: string;
  username: string;
  full_name: string;
  email: string;
  role: string;
  is_active: number;
  last_login: string;
  created_at: string;
  active_sessions: number;
}

export default function AuthUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ username: '', password: '', fullName: '', email: '', role: 'user' });
  const [activeTab, setActiveTab] = useState<'users' | 'logs'>('users');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [usersData, logsData] = await Promise.all([api.getAuthUsers(), api.getAuthLogs(50)]);
      setUsers(usersData);
      setLogs(logsData);
    } catch (e: any) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        const data: any = { fullName: form.fullName, email: form.email, role: form.role };
        if (form.password) data.password = form.password;
        await api.updateAuthUser(editing, data);
      } else {
        await api.createAuthUser(form);
      }
      setShowForm(false);
      setEditing(null);
      setForm({ username: '', password: '', fullName: '', email: '', role: 'user' });
      loadData();
    } catch (e: any) { alert(e.message); }
  };

  const startEdit = (user: AuthUser) => {
    setForm({ username: user.username, password: '', fullName: user.full_name, email: user.email, role: user.role });
    setEditing(user.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить пользователя?')) return;
    try {
      await api.deleteAuthUser(id);
      loadData();
    } catch (e: any) { alert(e.message); }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await api.updateAuthUser(id, { isActive: !isActive });
      loadData();
    } catch (e: any) { alert(e.message); }
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Загрузка...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Пользователи системы</h2>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ username: '', password: '', fullName: '', email: '', role: 'user' }); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          {showForm ? 'Скрыть' : '+ Добавить пользователя'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-600 hover:text-gray-800'}`}>
          👥 Пользователи
        </button>
        <button onClick={() => setActiveTab('logs')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'logs' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-600 hover:text-gray-800'}`}>
          📋 Журнал входов
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">{editing ? 'Редактировать пользователя' : 'Новый пользователь'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Логин *</label>
              <input required disabled={!!editing} value={form.username} onChange={e => setForm({...form, username: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{editing ? 'Новый пароль (оставьте пустым)' : 'Пароль *'} </label>
              <input type="password" required={!editing} value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder={editing ? 'Не менять' : 'Минимум 6 символов'} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ФИО</label>
              <input value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Роль</label>
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="user">Пользователь</option>
                <option value="admin">Администратор</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">{editing ? 'Сохранить' : 'Создать'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Отмена</button>
          </div>
        </form>
      )}

      {activeTab === 'users' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Логин</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ФИО</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Роль</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Статус</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Последний вход</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(user => (
                <tr key={user.id} className={`hover:bg-gray-50 ${user.id === currentUser?.id ? 'bg-blue-50/50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{user.username}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{user.full_name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                      {user.role === 'admin' ? '👑 Админ' : '👤 Пользователь'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.is_active ? (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">✅ Активен</span>
                    ) : (
                      <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">⛔ Заблокирован</span>
                    )}
                    {user.active_sessions > 0 && (
                      <span className="text-xs text-blue-600 ml-2">({user.active_sessions} сессий)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {user.last_login ? new Date(user.last_login).toLocaleString('ru') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(user)} className="px-2 py-1 text-amber-600 hover:bg-amber-50 rounded text-xs">✏️</button>
                      <button onClick={() => handleToggleActive(user.id, !!user.is_active)} className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-xs">
                        {user.is_active ? '🔒' : '🔓'}
                      </button>
                      {user.id !== currentUser?.id && (
                        <button onClick={() => handleDelete(user.id)} className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs">🗑️</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Время</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Пользователь</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Действие</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">IP</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Результат</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Нет записей</td></tr>
              ) : logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600 text-xs">{new Date(log.created_at).toLocaleString('ru')}</td>
                  <td className="px-4 py-3 text-gray-800">{log.username || log.user_username || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${log.action === 'login' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                      {log.action === 'login' ? '🔑 Вход' : '🚪 Выход'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs font-mono">{log.ip_address || '—'}</td>
                  <td className="px-4 py-3">
                    {log.success ? (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">✅ Успешно</span>
                    ) : (
                      <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">❌ Ошибка</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
