import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { STATUS_LABELS, STATUS_COLORS } from '../types';
import { Link } from 'react-router-dom';
import * as api from '../api';
import { matchesWithLayout } from '../utils/layoutConverter';

export default function Dashboard() {
  const { equipment, categories, equipmentTypes, users, rooms, subdivisions } = useData();
  const [stats, setStats] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    api.getEquipmentStats().then(setStats).catch(() => {});
  }, [equipment.length]);

  // Статистика по обслуживанию
  const maintenanceStats = {
    overdue: equipment.filter(eq => {
      if (!eq.nextMaintenanceDate) return false;
      const nextDate = new Date(eq.nextMaintenanceDate);
      return nextDate < new Date();
    }).length,
    upcoming: equipment.filter(eq => {
      if (!eq.nextMaintenanceDate) return false;
      const nextDate = new Date(eq.nextMaintenanceDate);
      const today = new Date();
      const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      return nextDate >= today && nextDate <= in30Days;
    }).length,
  };

  // Статистика по устаревшему оборудованию
  const outdatedEquipment = equipment.filter(eq => {
    if (!eq.cpu) return false;
    const cpu = eq.cpu.toLowerCase();
    // Примеры устаревших процессоров
    const outdatedPatterns = ['i3-2', 'i3-3', 'i5-2', 'i5-3', 'i7-2', 'i7-3', 'pentium', 'celeron'];
    return outdatedPatterns.some(pattern => cpu.includes(pattern));
  }).length;

  // Поиск по оборудованию и сотрудникам (с поддержкой конвертации раскладки)
  const searchResults = searchQuery.trim().length > 0 ? {
    equipment: equipment.filter(eq => 
      matchesWithLayout(eq.name, searchQuery) ||
      matchesWithLayout(eq.serialNumber, searchQuery) ||
      matchesWithLayout(eq.inventoryNumber, searchQuery)
    ).slice(0, 5),
    users: users.filter(user => {
      const fullName = `${user.lastName} ${user.firstName} ${user.middleName || ''}`;
      return matchesWithLayout(fullName, searchQuery) ||
             matchesWithLayout(user.email, searchQuery) ||
             matchesWithLayout(user.position, searchQuery);
    }).slice(0, 5)
  } : null;

  const statusCounts = Object.entries(STATUS_LABELS).map(([key, label]) => ({
    key,
    label,
    count: equipment.filter(e => e.status === key).length,
    color: STATUS_COLORS[key as keyof typeof STATUS_COLORS],
  }));

  const recentEquipment = [...equipment].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  }).slice(0, 5);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Дашборд</h2>

      {/* Global Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Поиск по оборудованию и сотрудникам..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Search Results */}
        {searchResults && (searchResults.equipment.length > 0 || searchResults.users.length > 0) && (
          <div className="mt-4 space-y-4">
            {/* Equipment Results */}
            {searchResults.equipment.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <span>💻</span> Оборудование ({searchResults.equipment.length})
                </h4>
                <div className="space-y-2">
                  {searchResults.equipment.map(eq => (
                    <Link
                      key={eq.id}
                      to={`/equipment/${eq.id}`}
                      className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{eq.name}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {equipmentTypes.find(t => t.id === eq.typeId)?.name || '—'} • {eq.inventoryNumber || eq.serialNumber || '—'}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ml-2 ${STATUS_COLORS[eq.status]}`}>
                          {STATUS_LABELS[eq.status]}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Users Results */}
            {searchResults.users.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <span>👥</span> Сотрудники ({searchResults.users.length})
                </h4>
                <div className="space-y-2">
                  {searchResults.users.map(user => (
                    <Link
                      key={user.id}
                      to={`/users`}
                      className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {user.lastName} {user.firstName} {user.middleName || ''}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {user.position || '—'} {user.email && `• ${user.email}`}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* No Results */}
        {searchResults && searchResults.equipment.length === 0 && searchResults.users.length === 0 && (
          <div className="mt-4 text-center py-4">
            <p className="text-sm text-gray-500">Ничего не найдено</p>
          </div>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard icon="💻" label="Оборудование" value={equipment.length} color="blue" />
        <StatCard icon="👥" label="Сотрудники" value={users.length} color="green" />
        <StatCard icon="🏛️" label="Подразделения" value={subdivisions.length} color="indigo" />
        <StatCard icon="🏢" label="Помещения" value={rooms.length} color="purple" />
        <StatCard icon="🏷️" label="Категории" value={categories.length} color="amber" />
      </div>

      {/* Alerts */}
      {(maintenanceStats.overdue > 0 || maintenanceStats.upcoming > 0 || outdatedEquipment > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {maintenanceStats.overdue > 0 && (
            <Link to="/equipment" className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="text-3xl">⚠️</div>
                <div>
                  <p className="text-sm text-red-700 dark:text-red-300 font-medium">Просроченное ТО</p>
                  <p className="text-2xl font-bold text-red-800 dark:text-red-200">{maintenanceStats.overdue}</p>
                  <p className="text-xs text-red-600 dark:text-red-400">требует внимания</p>
                </div>
              </div>
            </Link>
          )}
          {maintenanceStats.upcoming > 0 && (
            <Link to="/equipment" className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="text-3xl">📅</div>
                <div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">Предстоящее ТО</p>
                  <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">{maintenanceStats.upcoming}</p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">в ближайшие 30 дней</p>
                </div>
              </div>
            </Link>
          )}
          {outdatedEquipment > 0 && (
            <Link to="/replacement-recommendations" className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="text-3xl">🔄</div>
                <div>
                  <p className="text-sm text-orange-700 dark:text-orange-300 font-medium">Устаревшее оборудование</p>
                  <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">{outdatedEquipment}</p>
                  <p className="text-xs text-orange-600 dark:text-orange-400">рекомендуется замена</p>
                </div>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Status distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Статусы оборудования</h3>
          <div className="space-y-3">
            {statusCounts.map(s => (
              <div key={s.key} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.color}`}>{s.label}</span>
                </div>
                <div className="flex items-center gap-3 flex-1 ml-4">
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${equipment.length ? (s.count / equipment.length) * 100 : 0}%` }}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700 w-8 text-right">{s.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Быстрые действия</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link to="/equipment/new" className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <span className="text-2xl">➕</span>
              <div>
                <p className="text-sm font-medium text-blue-700">Добавить оборудование</p>
                <p className="text-xs text-blue-500">Новая единица техники</p>
              </div>
            </Link>
            <Link to="/equipment-templates" className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
              <span className="text-2xl">📋</span>
              <div>
                <p className="text-sm font-medium text-indigo-700">Шаблоны</p>
                <p className="text-xs text-indigo-500">Быстрое создание</p>
              </div>
            </Link>
            <Link to="/qr-generator" className="flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
              <span className="text-2xl">📱</span>
              <div>
                <p className="text-sm font-medium text-green-700">Генерация QR</p>
                <p className="text-xs text-green-500">Создать QR-код</p>
              </div>
            </Link>
            <Link to="/qr-scan" className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
              <span className="text-2xl">📷</span>
              <div>
                <p className="text-sm font-medium text-purple-700">Сканировать QR</p>
                <p className="text-xs text-purple-500">Найти по коду</p>
              </div>
            </Link>
            <Link to="/replacement-recommendations" className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
              <span className="text-2xl">🔄</span>
              <div>
                <p className="text-sm font-medium text-orange-700">Рекомендации</p>
                <p className="text-xs text-orange-500">Замена оборудования</p>
              </div>
            </Link>
            <Link to="/maintenance-types" className="flex items-center gap-3 p-3 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors">
              <span className="text-2xl">🔧</span>
              <div>
                <p className="text-sm font-medium text-teal-700">Обслуживание</p>
                <p className="text-xs text-teal-500">Типы и периодичность</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent equipment */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-700">Последнее добавленное оборудование</h3>
          <Link to="/equipment" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Все →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="text-left pb-3 font-medium text-gray-600">Название</th>
                <th className="text-left pb-3 font-medium text-gray-600">Тип</th>
                <th className="text-left pb-3 font-medium text-gray-600">Статус</th>
                <th className="text-left pb-3 font-medium text-gray-600">Сотрудник</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentEquipment.length === 0 ? (
                <tr><td colSpan={4} className="py-6 text-center text-gray-500">Нет оборудования</td></tr>
              ) : recentEquipment.map(eq => (
                <tr key={eq.id} className="hover:bg-gray-50">
                  <td className="py-3">
                    <Link to={`/equipment/${eq.id}`} className="font-medium text-gray-800 hover:text-blue-600">{eq.name}</Link>
                  </td>
                  <td className="py-3 text-gray-600">{equipmentTypes.find(t => t.id === eq.typeId)?.name || '—'}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[eq.status]}`}>
                      {STATUS_LABELS[eq.status]}
                    </span>
                  </td>
                  <td className="py-3 text-gray-600">
                    {eq.userId ? (() => { const u = users.find(u => u.id === eq.userId); return u ? `${u.lastName} ${u.firstName} ${u.middleName || ''}`.trim() : '—'; })() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Distribution by subdivisions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Оборудование по подразделениям</h3>
            <Link to="/subdivisions" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Все →</Link>
          </div>
          <div className="space-y-3">
            {subdivisions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Нет подразделений</p>
            ) : subdivisions.slice(0, 5).map(sub => {
              const count = equipment.filter(eq => {
                const user = users.find(u => u.id === eq.userId);
                return user?.subdivisionId === sub.id;
              }).length;
              return (
                <div key={sub.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏛️</span>
                    <span className="text-sm text-gray-700">{sub.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full transition-all" 
                        style={{ width: `${equipment.length ? (count / equipment.length) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-8 text-right">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Оборудование по типам</h3>
            <Link to="/categories" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Все →</Link>
          </div>
          <div className="space-y-3">
            {equipmentTypes.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Нет типов оборудования</p>
            ) : equipmentTypes.slice(0, 5).map(type => {
              const count = equipment.filter(eq => eq.typeId === type.id).length;
              return (
                <div key={type.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏷️</span>
                    <span className="text-sm text-gray-700">{type.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 rounded-full transition-all" 
                        style={{ width: `${equipment.length ? (count / equipment.length) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-8 text-right">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-100',
    green: 'bg-green-50 border-green-100',
    purple: 'bg-purple-50 border-purple-100',
    amber: 'bg-amber-50 border-amber-100',
    indigo: 'bg-indigo-50 border-indigo-100',
  };
  return (
    <div className={`rounded-xl border p-3 sm:p-4 ${colors[color] || colors.blue}`}>
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="text-2xl sm:text-3xl">{icon}</span>
        <div>
          <p className="text-xl sm:text-2xl font-bold text-gray-800">{value}</p>
          <p className="text-xs sm:text-sm text-gray-600">{label}</p>
        </div>
      </div>
    </div>
  );
}
