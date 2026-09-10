import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { STATUS_LABELS, STATUS_COLORS, EquipmentStatus } from '../types';
import { Link } from 'react-router-dom';
import { exportToCSV, exportToExcel, printReport } from '../utils/export';

export default function Equipment() {
  const { equipment, equipmentTypes, categories, users, rooms, deleteEquipment, updateEquipment } = useData();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
  const [showBulkMoveModal, setShowBulkMoveModal] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<EquipmentStatus>('in_use');
  const [bulkUserId, setBulkUserId] = useState('');
  const [bulkRoomId, setBulkRoomId] = useState('');
  const [primaryPhotos, setPrimaryPhotos] = useState<Record<string, string>>({});

  // Загрузка основных фотографий для оборудования
  useEffect(() => {
    const loadPrimaryPhotos = async () => {
      const photos: Record<string, string> = {};
      
      for (const eq of equipment) {
        try {
          const response = await fetch(`/api/equipment/${eq.id}/photos`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('itam_token')}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            const primaryPhoto = data.find((p: any) => p.is_primary === 1);
            if (primaryPhoto) {
              photos[eq.id] = primaryPhoto.file_path;
            }
          }
        } catch (error) {
          // Игнорируем ошибки
        }
      }
      
      setPrimaryPhotos(photos);
    };

    loadPrimaryPhotos();
  }, [equipment]);

  const filtered = equipment.filter(eq => {
    const matchSearch = eq.name.toLowerCase().includes(search.toLowerCase()) ||
      eq.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
      eq.inventoryNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || eq.status === filterStatus;
    const matchType = !filterType || eq.typeId === filterType;
    return matchSearch && matchStatus && matchType;
  });

  // Функции для работы с выбором
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(eq => eq.id));
    }
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  // Массовые операции
  const handleBulkStatusChange = async () => {
    try {
      await Promise.all(
        selectedIds.map(id => updateEquipment(id, { status: bulkStatus }))
      );
      setShowBulkStatusModal(false);
      clearSelection();
      alert(`Статус изменён для ${selectedIds.length} единиц оборудования`);
    } catch (error) {
      alert('Ошибка при изменении статуса');
    }
  };

  const handleBulkMove = async () => {
    try {
      await Promise.all(
        selectedIds.map(id => {
          const updates: any = {};
          
          // Обработка сотрудника
          if (bulkUserId === 'none') {
            updates.userId = null;
          } else if (bulkUserId) {
            updates.userId = bulkUserId;
          }
          
          // Обработка помещения
          if (bulkRoomId === 'none') {
            updates.roomId = null;
          } else if (bulkRoomId) {
            updates.roomId = bulkRoomId;
          }
          
          return updateEquipment(id, updates);
        })
      );
      setShowBulkMoveModal(false);
      clearSelection();
      alert(`Оборудование перемещено для ${selectedIds.length} единиц`);
    } catch (error) {
      alert('Ошибка при перемещении оборудования');
    }
  };

  const getTypeName = (typeId: string) => equipmentTypes.find(t => t.id === typeId)?.name || '—';
  const getCategoryName = (typeId: string) => {
    const type = equipmentTypes.find(t => t.id === typeId);
    if (!type) return '—';
    return categories.find(c => c.id === type.categoryId)?.name || '—';
  };
  const getUserName = (userId: string | null) => {
    if (!userId) return '—';
    const user = users.find(u => u.id === userId);
    return user ? `${user.lastName} ${user.firstName}` : '—';
  };
  const getRoomName = (roomId: string | null) => {
    if (!roomId) return '—';
    const room = rooms.find(r => r.id === roomId);
    if (!room) return '—';
    
    // Формируем более информативную строку
    const parts = [room.name];
    if (room.building) parts.push(room.building);
    if (room.floor !== undefined && room.floor !== null) parts.push(`эт. ${room.floor}`);
    
    return parts.join(', ');
  };

  // Функция для подготовки данных к экспорту
  const prepareExportData = () => {
    return filtered.map(eq => ({
      name: eq.name,
      inventoryNumber: eq.inventoryNumber,
      serialNumber: eq.serialNumber,
      typeName: getTypeName(eq.typeId),
      categoryName: getCategoryName(eq.typeId),
      status: STATUS_LABELS[eq.status],
      userName: getUserName(eq.userId),
      roomName: getRoomName(eq.roomId),
      purchaseDate: eq.purchaseDate || '—',
      warrantyEnd: eq.warrantyEnd || '—',
      notes: eq.notes || ''
    }));
  };

  // Заголовки для экспорта
  const exportHeaders = {
    name: 'Название',
    inventoryNumber: 'Инв. номер',
    serialNumber: 'Серийный номер',
    typeName: 'Тип',
    categoryName: 'Категория',
    status: 'Статус',
    userName: 'Сотрудник',
    roomName: 'Помещение',
    purchaseDate: 'Дата покупки',
    warrantyEnd: 'Гарантия до',
    notes: 'Заметки'
  };

  // Экспорт в CSV
  const handleExportCSV = () => {
    const data = prepareExportData();
    exportToCSV(data, `equipment_${new Date().toISOString().split('T')[0]}`, exportHeaders);
  };

  // Экспорт в Excel
  const handleExportExcel = () => {
    const data = prepareExportData();
    exportToExcel(data, `equipment_${new Date().toISOString().split('T')[0]}`, exportHeaders);
  };

  // Печать отчёта
  const handlePrintReport = () => {
    const data = prepareExportData();
    
    let tableHTML = '<table><thead><tr>';
    Object.values(exportHeaders).forEach(header => {
      tableHTML += `<th>${header}</th>`;
    });
    tableHTML += '</tr></thead><tbody>';
    
    data.forEach(row => {
      tableHTML += '<tr>';
      Object.keys(exportHeaders).forEach(key => {
        tableHTML += `<td>${row[key as keyof typeof row]}</td>`;
      });
      tableHTML += '</tr>';
    });
    
    tableHTML += '</tbody></table>';
    
    const reportContent = `
      <p><strong>Всего записей:</strong> ${data.length}</p>
      ${tableHTML}
    `;
    
    printReport('Отчёт по оборудованию', reportContent);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Оборудование</h2>
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
          <Link to="/equipment/new" className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors text-center">
            + Добавить
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Поиск..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Все статусы</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Все типы</option>
            {equipmentTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>

      {/* Bulk Actions Panel */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-blue-900">
                Выбрано: {selectedIds.length} {selectedIds.length === 1 ? 'единица' : selectedIds.length < 5 ? 'единицы' : 'единиц'}
              </span>
              <button onClick={clearSelection} className="text-sm text-blue-600 hover:text-blue-800 underline">
                Снять выделение
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setShowBulkStatusModal(true)}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                🔄 Сменить статус
              </button>
              <button 
                onClick={() => setShowBulkMoveModal(true)}
                className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                📍 Переместить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Cards View */}
      <div className="sm:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
            Оборудование не найдено
          </div>
        ) : filtered.map(eq => (
          <div key={eq.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selectedIds.includes(eq.id)}
                onChange={() => toggleSelect(eq.id)}
                onClick={e => e.stopPropagation()}
                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Link to={`/equipment/${eq.id}`} className="flex-1 min-w-0">
                <div className="flex items-start gap-3">
                  {primaryPhotos[eq.id] && (
                    <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                      <img 
                        src={primaryPhotos[eq.id]} 
                        alt={eq.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 truncate">{eq.name}</h3>
                        <p className="text-xs text-gray-500 truncate">{getTypeName(eq.typeId)} • {getCategoryName(eq.typeId)}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ml-2 flex-shrink-0 ${STATUS_COLORS[eq.status]}`}>
                        {STATUS_LABELS[eq.status]}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-3 pt-3 border-t border-gray-100">
                  <div>
                    <span className="text-gray-400">Сотрудник:</span>
                    <p className="font-medium truncate">{getUserName(eq.userId)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Помещение:</span>
                    <p className="font-medium truncate">{getRoomName(eq.roomId)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-end mt-3 pt-3 border-t border-gray-100">
                  <span className="text-blue-600 text-xs">Подробнее →</span>
                </div>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 w-12">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedIds.length === filtered.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="text-left px-4 py-3 w-16 font-medium text-gray-600">Фото</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Название</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Тип</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Статус</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Сотрудник</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Помещение</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Оборудование не найдено</td></tr>
              ) : filtered.map(eq => (
                <tr key={eq.id} className={`hover:bg-gray-50 ${selectedIds.includes(eq.id) ? 'bg-blue-50' : ''}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(eq.id)}
                      onChange={() => toggleSelect(eq.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    {primaryPhotos[eq.id] ? (
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                        <img 
                          src={primaryPhotos[eq.id]} 
                          alt={eq.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </td>
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

      {/* Bulk Status Change Modal */}
      {showBulkStatusModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Массовая смена статуса</h3>
            <p className="text-sm text-gray-600 mb-4">
              Будет изменён статус для {selectedIds.length} {selectedIds.length === 1 ? 'единицы' : selectedIds.length < 5 ? 'единиц' : 'единиц'} оборудования
            </p>
            <div className="space-y-2 mb-6">
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <label key={key} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${bulkStatus === key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input
                    type="radio"
                    name="bulkStatus"
                    value={key}
                    checked={bulkStatus === key}
                    onChange={() => setBulkStatus(key as EquipmentStatus)}
                    className="text-blue-600"
                  />
                  <span className="text-sm font-medium">{label}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={handleBulkStatusChange} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                Изменить статус
              </button>
              <button onClick={() => setShowBulkStatusModal(false)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Move Modal */}
      {showBulkMoveModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Массовое перемещение</h3>
            <p className="text-sm text-gray-600 mb-4">
              Будет перемещено {selectedIds.length} {selectedIds.length === 1 ? 'единица' : selectedIds.length < 5 ? 'единицы' : 'единиц'} оборудования
            </p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Сотрудник</label>
                <select
                  value={bulkUserId}
                  onChange={e => setBulkUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Не изменять</option>
                  <option value="none">Снять привязку</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.lastName} {u.firstName} {u.middleName || ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Помещение</label>
                <select
                  value={bulkRoomId}
                  onChange={e => setBulkRoomId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Не изменять</option>
                  <option value="none">Снять привязку</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.building})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleBulkMove} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                Переместить
              </button>
              <button onClick={() => setShowBulkMoveModal(false)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
