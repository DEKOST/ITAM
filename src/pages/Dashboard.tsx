import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { STATUS_LABELS, STATUS_COLORS } from '../types';
import { Link } from 'react-router-dom';
import * as api from '../api';

export default function Dashboard() {
  const { equipment, categories, equipmentTypes, users, rooms } = useData();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api.getEquipmentStats().then(setStats).catch(() => {});
  }, [equipment.length]);

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

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="💻" label="Оборудование" value={equipment.length} color="blue" />
        <StatCard icon="👥" label="Сотрудники" value={users.length} color="green" />
        <StatCard icon="🏢" label="Помещения" value={rooms.length} color="purple" />
        <StatCard icon="🏷️" label="Категории" value={categories.length} color="amber" />
      </div>

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
            <Link to="/users" className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors">
              <span className="text-2xl">👤</span>
              <div>
                <p className="text-sm font-medium text-amber-700">Сотрудники</p>
                <p className="text-xs text-amber-500">Управление</p>
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
                    {eq.userId ? (() => { const u = users.find(u => u.id === eq.userId); return u ? `${u.lastName} ${u.firstName}` : '—'; })() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color] || colors.blue}`}>
      <div className="flex items-center gap-3">
        <span className="text-3xl">{icon}</span>
        <div>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          <p className="text-sm text-gray-600">{label}</p>
        </div>
      </div>
    </div>
  );
}
