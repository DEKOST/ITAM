import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import * as api from '../api';

interface HistoryEntry {
  id: string;
  date: string;
  type: 'status_change' | 'move' | 'maintenance' | 'created' | 'updated';
  description: string;
  details?: any;
}

export default function EquipmentHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { equipment, users, rooms } = useData();
  const eq = equipment.find(e => e.id === id);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadHistory();
    }
  }, [id]);

  const loadHistory = async () => {
    try {
      const data = await api.getEquipmentHistory(id!);
      setHistory(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (userId: string | null) => {
    if (!userId) return 'Не назначен';
    const user = users.find(u => u.id === userId);
    return user ? `${user.lastName} ${user.firstName} ${user.middleName || ''}`.trim() : 'Неизвестный';
  };

  const getRoomName = (roomId: string | null) => {
    if (!roomId) return 'Не указано';
    const room = rooms.find(r => r.id === roomId);
    return room ? room.name : 'Неизвестно';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'in_use': 'В эксплуатации',
      'in_reserve': 'В резерве',
      'written_off': 'Списан',
      'in_repair': 'В ремонте'
    };
    return labels[status] || status;
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'status_change': return '🔄';
      case 'move': return '📍';
      case 'maintenance': return '🔧';
      case 'created': return '✨';
      case 'updated': return '✏️';
      default: return '📝';
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'status_change': return 'bg-blue-50 border-blue-200';
      case 'move': return 'bg-green-50 border-green-200';
      case 'maintenance': return 'bg-purple-50 border-purple-200';
      case 'created': return 'bg-emerald-50 border-emerald-200';
      case 'updated': return 'bg-gray-50 border-gray-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  if (!eq) {
    return <div className="text-center py-12"><p className="text-gray-500">Оборудование не найдено</p></div>;
  }

  if (loading) {
    return <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div></div>;
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">История изменений</h2>
          <p className="text-sm text-gray-500 mt-1">{eq.name} • {eq.inventoryNumber}</p>
        </div>
        <button onClick={() => navigate(`/equipment/${id}`)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
          ← Назад
        </button>
      </div>

      {history.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-500">История изменений пуста</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((entry) => (
            <div key={entry.id} className={`rounded-xl border-2 p-4 ${getColor(entry.type)}`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">{getIcon(entry.type)}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-800">{entry.description}</h4>
                    <span className="text-xs text-gray-500">
                      {new Date(entry.date).toLocaleString('ru-RU')}
                    </span>
                  </div>
                  
                  {entry.details && (
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      {entry.type === 'status_change' && (
                        <>
                          <p>Статус: <span className="font-medium">{getStatusLabel(entry.details.from_status)}</span> → <span className="font-medium">{getStatusLabel(entry.details.to_status)}</span></p>
                          {entry.details.comment && <p className="text-gray-500">Комментарий: {entry.details.comment}</p>}
                        </>
                      )}
                      
                      {entry.type === 'move' && (
                        <>
                          <p>Сотрудник: <span className="font-medium">{getUserName(entry.details.from_user_id)}</span> → <span className="font-medium">{getUserName(entry.details.to_user_id)}</span></p>
                          <p>Помещение: <span className="font-medium">{getRoomName(entry.details.from_room_id)}</span> → <span className="font-medium">{getRoomName(entry.details.to_room_id)}</span></p>
                          {entry.details.comment && <p className="text-gray-500">Комментарий: {entry.details.comment}</p>}
                        </>
                      )}
                      
                      {entry.type === 'maintenance' && (
                        <>
                          <p>Тип: <span className="font-medium">{entry.details.type}</span></p>
                          {entry.details.description && <p>Описание: {entry.details.description}</p>}
                          {entry.details.cost > 0 && <p>Стоимость: {entry.details.cost} ₽</p>}
                          {entry.details.performed_by && <p>Выполнено: {entry.details.performed_by}</p>}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
