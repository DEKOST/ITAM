import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { STATUS_LABELS, STATUS_COLORS } from '../types';
import { Link } from 'react-router-dom';
import * as api from '../api';

export default function Equipment() {
  const { equipment, equipmentTypes, categories, users, rooms, deleteEquipment, refreshEquipment } = useData();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  const filtered = equipment.filter(eq => {
    const matchSearch = eq.name.toLowerCase().includes(search.toLowerCase()) ||
      eq.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
      eq.inventoryNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || eq.status === filterStatus;
    const matchType = !filterType || eq.typeId === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const getTypeName = (typeId: string) => equipmentTypes.find(t => t.id === typeId)?.name || '—';
  const getCategoryName = (typeId: string) => {
    const type = equipmentTypes.find(t => t.id === typeId);
    if (!type) return '—';
    return categories.find(c => c.id === type.categoryId)?.name || '—';
  };
  const getUserName = (userId: string | null) => {
    if (!userId) return '—';
    const user = users.find(u => u.id === userId);
    return user ? `${user.lastName} ${user.firstName} ${user.middleName || ''}`.trim() : '—';
  };
  const getRoomName = (roomId: string | null) => {
    if (!roomId) return '—';
    return rooms.find(r => r.id === roomId)?.name || '—';
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Оборудование</h2>
        <Link to="/equipment/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          + Добавить
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Поиск по названию, серийному/инвентарному номеру..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Все статусы</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Все типы</option>
            {equipmentTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Название</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Тип</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Статус</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Сотрудник</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Помещение</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Инв. номер</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Оборудование не найдено</td></tr>
              ) : filtered.map(eq => (
                <tr key={eq.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{eq.name}</div>
                    <div className="text-xs text-gray-500">{eq.serialNumber}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-800">{getTypeName(eq.typeId)}</div>
                    <div className="text-xs text-gray-500">{getCategoryName(eq.typeId)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[eq.status]}`}>
                      {STATUS_LABELS[eq.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{getUserName(eq.userId)}</td>
                  <td className="px-4 py-3 text-gray-700">{getRoomName(eq.roomId)}</td>
                  <td className="px-4 py-3 text-gray-700 font-mono text-xs">{eq.inventoryNumber}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link to={`/equipment/${eq.id}`} className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-xs">👁️</Link>
                      <Link to={`/equipment/${eq.id}/edit`} className="px-2 py-1 text-amber-600 hover:bg-amber-50 rounded text-xs">✏️</Link>
                      <button onClick={async () => { if (confirm('Удалить оборудование?')) await deleteEquipment(eq.id); }} className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-sm text-gray-500 mt-3">Найдено: {filtered.length} из {equipment.length}</p>
    </div>
  );
}
