import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { STATUS_LABELS, STATUS_COLORS } from '../types';

export default function UserView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { users, equipment, equipmentTypes, rooms, subdivisions } = useData();
  
  const user = users.find(u => u.id === id);
  
  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-3">👤</p>
        <p className="text-gray-500">Сотрудник не найден</p>
        <button onClick={() => navigate('/users')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          ← Вернуться к списку
        </button>
      </div>
    );
  }

  // Находим всё оборудование, привязанное к этому сотруднику
  const userEquipment = equipment.filter(eq => eq.userId === user.id);
  
  const getTypeName = (typeId: string) => equipmentTypes.find(t => t.id === typeId)?.name || '—';
  const getRoomName = (roomId: string | null) => {
    if (!roomId) return '—';
    return rooms.find(r => r.id === roomId)?.name || '—';
  };
  const getSubdivisionName = (subdivisionId: string | null) => {
    if (!subdivisionId) return '—';
    return subdivisions.find(s => s.id === subdivisionId)?.name || '—';
  };

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
            {user.lastName} {user.firstName} {user.middleName}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {user.position || 'Должность не указана'} • {getSubdivisionName(user.subdivisionId)}
          </p>
        </div>
        <button onClick={() => navigate('/users')} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
          ← Назад
        </button>
      </div>

      {/* User Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">👤 Информация о сотруднике</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">ФИО</p>
            <p className="text-sm font-medium text-gray-800">{user.lastName} {user.firstName} {user.middleName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="text-sm font-medium text-gray-800">{user.email || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Подразделение</p>
            <p className="text-sm font-medium text-gray-800">{getSubdivisionName(user.subdivisionId)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Должность</p>
            <p className="text-sm font-medium text-gray-800">{user.position || '—'}</p>
          </div>
        </div>
      </div>

      {/* Equipment List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-700">💻 Оборудование ({userEquipment.length})</h3>
        </div>

        {userEquipment.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-gray-500">У сотрудника нет привязанного оборудования</p>
          </div>
        ) : (
          <div className="space-y-3">
            {userEquipment.map(eq => (
              <Link
                key={eq.id}
                to={`/equipment/${eq.id}`}
                className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-800 truncate">{eq.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {getTypeName(eq.typeId)} • Инв: {eq.inventoryNumber || '—'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      📍 {getRoomName(eq.roomId)}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ml-2 flex-shrink-0 ${STATUS_COLORS[eq.status]}`}>
                    {STATUS_LABELS[eq.status]}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
