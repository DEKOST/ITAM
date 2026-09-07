import React from 'react';
import { useData } from '../context/DataContext';
import { STATUS_LABELS, EquipmentStatus } from '../types';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { equipment, categories, equipmentTypes, users, rooms } = useData();

  const statusCounts = equipment.reduce((acc, eq) => {
    acc[eq.status] = (acc[eq.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const stats = [
    { label: 'Всего оборудования', value: equipment.length, icon: '💻', color: 'bg-blue-500', link: '/equipment' },
    { label: 'Категорий', value: categories.length, icon: '🏷️', color: 'bg-purple-500', link: '/categories' },
    { label: 'Сотрудников', value: users.length, icon: '👥', color: 'bg-green-500', link: '/users' },
    { label: 'Помещений', value: rooms.length, icon: '🏢', color: 'bg-orange-500', link: '/rooms' },
  ];

  const recentEquipment = [...equipment].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Дашборд</h2>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(stat => (
          <Link key={stat.label} to={stat.link} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center text-2xl`}>
                {stat.icon}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Status overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Статусы оборудования</h3>
          <div className="space-y-3">
            {Object.entries(STATUS_LABELS).map(([key, label]) => {
              const count = statusCounts[key] || 0;
              const percent = equipment.length > 0 ? (count / equipment.length) * 100 : 0;
              const colors: Record<string, string> = {
                in_use: 'bg-green-500',
                in_reserve: 'bg-blue-500',
                written_off: 'bg-gray-400',
                in_repair: 'bg-red-500',
              };
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-medium text-gray-800">{count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div className={`${colors[key]} h-2.5 rounded-full transition-all`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Последнее добавленное</h3>
          {recentEquipment.length === 0 ? (
            <p className="text-gray-500 text-sm">Нет оборудования</p>
          ) : (
            <div className="space-y-3">
              {recentEquipment.map(eq => {
                const type = equipmentTypes.find(t => t.id === eq.typeId);
                return (
                  <div key={eq.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{eq.name}</p>
                      <p className="text-xs text-gray-500">{type?.name || 'Без типа'} • {eq.inventoryNumber}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      eq.status === 'in_use' ? 'bg-green-100 text-green-700' :
                      eq.status === 'in_reserve' ? 'bg-blue-100 text-blue-700' :
                      eq.status === 'written_off' ? 'bg-gray-100 text-gray-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {STATUS_LABELS[eq.status]}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Быстрые действия</h3>
        <div className="flex flex-wrap gap-3">
          <Link to="/equipment/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            + Добавить оборудование
          </Link>
          <Link to="/qr-generator" className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
            📱 Генерация QR
          </Link>
          <Link to="/qr-scan" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
            📷 Сканировать QR
          </Link>
        </div>
      </div>
    </div>
  );
}
