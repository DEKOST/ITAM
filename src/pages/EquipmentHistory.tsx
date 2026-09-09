import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import * as api from '../api';
import { exportToCSV, exportToExcel, printReport } from '../utils/export';

interface HistoryEntry {
  id: string;
  date: string;
  type: 'status_change' | 'move' | 'maintenance' | 'created' | 'updated' | 'name_change' | 'edit';
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
      case 'name_change': return '📝';
      case 'edit': return '✏️';
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
      case 'name_change': return 'bg-orange-50 border-orange-200';
      case 'edit': return 'bg-indigo-50 border-indigo-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      'name': 'Название',
      'serial_number': 'Серийный номер',
      'inventory_number': 'Инвентарный номер',
      'type_id': 'Тип оборудования',
      'status': 'Статус',
      'user_id': 'Сотрудник',
      'room_id': 'Помещение',
      'purchase_date': 'Дата покупки',
      'warranty_end': 'Гарантия до',
      'last_maintenance_date': 'Последнее ТО',
      'next_maintenance_date': 'Следующее ТО',
      'notes': 'Заметки'
    };
    return labels[field] || field;
  };

  // Функция для форматирования записи истории в читаемый вид
  const formatHistoryEntry = (entry: HistoryEntry) => {
    let details = '';
    
    if (entry.type === 'status_change' && entry.details) {
      details = `Статус: ${getStatusLabel(entry.details.from_status)} → ${getStatusLabel(entry.details.to_status)}`;
      if (entry.details.changed_by_name || entry.details.changed_by) {
        details += ` (${entry.details.changed_by_name || entry.details.changed_by})`;
      }
    } else if (entry.type === 'move' && entry.details) {
      details = `Сотрудник: ${getUserName(entry.details.from_user_id)} → ${getUserName(entry.details.to_user_id)}`;
      details += `, Помещение: ${getRoomName(entry.details.from_room_id)} → ${getRoomName(entry.details.to_room_id)}`;
      if (entry.details.changed_by_name || entry.details.changed_by) {
        details += ` (${entry.details.changed_by_name || entry.details.changed_by})`;
      }
    } else if (entry.type === 'maintenance' && entry.details) {
      details = `Тип: ${entry.details.type || 'Не указан'}`;
      if (entry.details.description) {
        details += `, Описание: ${entry.details.description}`;
      }
    } else if (entry.type === 'name_change' && entry.details) {
      details = `Название: ${entry.details.from_name} → ${entry.details.to_name}`;
      if (entry.details.changed_by_name || entry.details.changed_by) {
        details += ` (${entry.details.changed_by_name || entry.details.changed_by})`;
      }
    } else if (entry.type === 'edit' && entry.details) {
      details = `Пользователь: ${entry.details.changed_by_name || entry.details.changed_by || 'Неизвестно'}`;
      if (entry.details.changes) {
        const changes = entry.details.changes.map((c: any) => 
          `${getFieldLabel(c.field)}: ${c.old_value || '—'} → ${c.new_value || '—'}`
        ).join('; ');
        details += `, Изменения: ${changes}`;
      }
    } else if (entry.type === 'created') {
      details = 'Оборудование добавлено в систему';
    }
    
    return {
      date: new Date(entry.date).toLocaleString('ru-RU'),
      type: entry.description,
      details: details
    };
  };

  // Экспорт в CSV
  const handleExportCSV = () => {
    const data = history.map(formatHistoryEntry);
    exportToCSV(data, `history_${eq?.name}_${new Date().toISOString().split('T')[0]}`, {
      date: 'Дата и время',
      type: 'Тип изменения',
      details: 'Детали'
    });
  };

  // Экспорт в Excel
  const handleExportExcel = () => {
    const data = history.map(formatHistoryEntry);
    exportToExcel(data, `history_${eq?.name}_${new Date().toISOString().split('T')[0]}`, {
      date: 'Дата и время',
      type: 'Тип изменения',
      details: 'Детали'
    });
  };

  // Печать отчёта
  const handlePrintReport = () => {
    const data = history.map(formatHistoryEntry);
    
    let tableHTML = '<table><thead><tr><th>Дата и время</th><th>Тип изменения</th><th>Детали</th></tr></thead><tbody>';
    
    data.forEach(row => {
      tableHTML += `<tr><td>${row.date}</td><td>${row.type}</td><td>${row.details}</td></tr>`;
    });
    
    tableHTML += '</tbody></table>';
    
    const reportContent = `
      <p><strong>Оборудование:</strong> ${eq?.name || '—'}</p>
      <p><strong>Инвентарный номер:</strong> ${eq?.inventoryNumber || '—'}</p>
      <p><strong>Всего записей:</strong> ${data.length}</p>
      ${tableHTML}
    `;
    
    printReport(`История изменений: ${eq?.name}`, reportContent);
  };

  if (!eq) {
    return <div className="text-center py-12"><p className="text-gray-500">Оборудование не найдено</p></div>;
  }

  if (loading) {
    return <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div></div>;
  }

  return (
    <div className="max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">История изменений</h2>
          <p className="text-sm text-gray-500 mt-1">{eq.name} • {eq.inventoryNumber}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleExportCSV} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
            📄 CSV
          </button>
          <button onClick={handleExportExcel} className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
            📊 Excel
          </button>
          <button onClick={handlePrintReport} className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
            🖨️ Печать
          </button>
          <button onClick={() => navigate(`/equipment/${id}`)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
            ← Назад
          </button>
        </div>
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
                          <p className="text-gray-700">
                            Пользователь: <span className="font-medium">{entry.details.changed_by_name || entry.details.changed_by}</span>
                          </p>
                          <p>Статус: <span className="font-medium">{getStatusLabel(entry.details.from_status)}</span> → <span className="font-medium">{getStatusLabel(entry.details.to_status)}</span></p>
                          {entry.details.comment && <p className="text-gray-500">Комментарий: {entry.details.comment}</p>}
                        </>
                      )}
                      
                      {entry.type === 'move' && (
                        <>
                          <p className="text-gray-700">
                            Изменил: <span className="font-medium">{entry.details.changed_by_name || entry.details.changed_by}</span>
                          </p>
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
                      
                      {entry.type === 'name_change' && (
                        <>
                          <p className="text-gray-700">
                            Изменил: <span className="font-medium">{entry.details.changed_by_name || entry.details.changed_by}</span>
                          </p>
                          <p>Название: <span className="font-medium line-through text-gray-400">{entry.details.from_name}</span> → <span className="font-medium text-gray-800">{entry.details.to_name}</span></p>
                          {entry.details.comment && <p className="text-gray-500">Комментарий: {entry.details.comment}</p>}
                        </>
                      )}

                      {entry.type === 'edit' && (
                        <>
                          <p className="text-gray-700">
                            Пользователь: <span className="font-medium">{entry.details.changed_by_name || entry.details.changed_by}</span>
                          </p>
                          <div className="mt-2 space-y-1">
                            {entry.details.changes.map((change: any, idx: number) => (
                              <div key={idx} className="text-sm">
                                <span className="font-medium text-gray-700">{getFieldLabel(change.field)}:</span>{' '}
                                <span className="line-through text-gray-400">{change.old_value || '—'}</span>
                                {' → '}
                                <span className="text-gray-800">{change.new_value || '—'}</span>
                              </div>
                            ))}
                          </div>
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
