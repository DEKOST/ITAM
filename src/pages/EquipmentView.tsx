import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { STATUS_LABELS, STATUS_COLORS, EquipmentStatus } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import * as api from '../api';
import { evaluateCPU, getCPUBadgeColor, getCPUBadgeText } from '../utils/cpuDatabase';

interface NextMaintenance {
  maintenance_type_id: string;
  maintenance_type_name: string;
  maintenance_type_description: string;
  interval_days: number;
  interval_months: number;
  interval_years: number;
  last_maintenance_date: string | null;
  last_maintenance_description: string | null;
  next_maintenance_date: string | null;
  days_until: number | null;
  is_overdue: boolean;
}

export default function EquipmentView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { equipment, equipmentTypes, categories, users, rooms, updateEquipment, changeEquipmentStatus, moveEquipment, changeEquipmentName } = useData();
  const eq = equipment.find(e => e.id === id);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [newStatus, setNewStatus] = useState<EquipmentStatus>('in_use');
  const [newUserId, setNewUserId] = useState('');
  const [newRoomId, setNewRoomId] = useState('');
  const [newName, setNewName] = useState('');
  const [nameComment, setNameComment] = useState('');
  const [nextMaintenances, setNextMaintenances] = useState<NextMaintenance[]>([]);
  const [maintenanceTypes, setMaintenanceTypes] = useState<any[]>([]);
  const [maintenanceForm, setMaintenanceForm] = useState({
    maintenance_type_id: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    notes: ''
  });

  useEffect(() => {
    if (id) {
      api.getNextMaintenance(id).then(setNextMaintenances).catch(console.error);
      api.getMaintenanceTypes().then(setMaintenanceTypes).catch(console.error);
    }
  }, [id]);

  if (!eq) return <div className="text-center py-12"><p className="text-gray-500">Оборудование не найдено</p></div>;

  const { subdivisions } = useData();
  const type = equipmentTypes.find(t => t.id === eq.typeId);
  const category = type ? categories.find(c => c.id === type.categoryId) : null;
  const user = eq.userId ? users.find(u => u.id === eq.userId) : null;
  const room = eq.roomId ? rooms.find(r => r.id === eq.roomId) : null;
  const subdivision = user?.subdivisionId ? subdivisions.find(s => s.id === user.subdivisionId) : null;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ru-RU');
  };

  const getDaysUntilText = (days: number | null) => {
    if (days === null) return 'Не указано';
    if (days < 0) return `Просрочено на ${Math.abs(days)} дн.`;
    if (days === 0) return 'Сегодня';
    if (days === 1) return 'Завтра';
    return `Через ${days} дн.`;
  };

  const handleStatusChange = async () => {
    await changeEquipmentStatus(eq.id, newStatus);
    setShowStatusModal(false);
  };

  const handleMove = async () => {
    await moveEquipment(eq.id, { user_id: newUserId || undefined, room_id: newRoomId || undefined });
    setShowMoveModal(false);
  };

  const handleNameChange = async () => {
    if (!newName.trim()) {
      alert('Название не может быть пустым');
      return;
    }
    await changeEquipmentName(eq.id, newName.trim(), nameComment.trim() || undefined);
    setShowNameModal(false);
    setNewName('');
    setNameComment('');
  };

  const handleAddMaintenance = async () => {
    if (maintenanceForm.maintenance_type_id && maintenanceForm.date) {
      try {
        await api.addMaintenance(eq.id, maintenanceForm);
        setShowMaintenanceModal(false);
        setMaintenanceForm({
          maintenance_type_id: '',
          date: new Date().toISOString().split('T')[0],
          description: '',
          notes: ''
        });
        // Обновляем информацию об обслуживании
        api.getNextMaintenance(eq.id).then(setNextMaintenances).catch(console.error);
        alert('✅ Обслуживание добавлено');
      } catch (err: any) {
        alert('❌ Ошибка: ' + err.message);
      }
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{eq.name}</h2>
        <div className="flex flex-wrap gap-2">
          <Link to={`/equipment/${eq.id}/history`} className="flex-1 sm:flex-none px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors text-center">📜 История</Link>
          <Link to={`/equipment/${eq.id}/edit`} className="flex-1 sm:flex-none px-3 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-200 transition-colors text-center">✏️ Изменить</Link>
          <button onClick={() => navigate('/equipment')} className="flex-1 sm:flex-none px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">← Назад</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Основная информация</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow label="Инвентарный номер" value={eq.inventoryNumber} />
              <InfoRow label="Серийный номер" value={eq.serialNumber} />
              <InfoRow label="Тип" value={type?.name || '—'} />
              <InfoRow label="Категория" value={category?.name || '—'} />
              <div>
                <p className="text-sm text-gray-500">Статус</p>
                <span className={`text-sm px-2 py-1 rounded-full font-medium ${STATUS_COLORS[eq.status]}`}>
                  {STATUS_LABELS[eq.status]}
                </span>
              </div>
              <InfoRow label="Дата добавления" value={eq.createdAt} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Привязка</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow label="Сотрудник" value={user ? `${user.lastName} ${user.firstName} ${user.middleName || ''}`.trim() + `${subdivision ? ` (${subdivision.name})` : ''}` : 'Не назначен'} />
              <InfoRow label="Помещение" value={room ? `${room.name} — ${room.building}, этаж ${room.floor}` : 'Не указано'} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Даты и обслуживание</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow label="Дата покупки" value={eq.purchaseDate || '—'} />
              <InfoRow label="Гарантия до" value={eq.warrantyEnd || '—'} />
              <InfoRow label="Последнее ТО" value={eq.lastMaintenanceDate || '—'} />
              <InfoRow label="Следующее ТО" value={eq.nextMaintenanceDate || '—'} />
            </div>
          </div>

          {/* Технические характеристики */}
          {(eq.cpu || (eq.ram && eq.ram > 0) || eq.storageType || (eq.storageSize && eq.storageSize > 0)) && (() => {
            const cpuInfo = eq.cpu ? evaluateCPU(eq.cpu) : null;
            return (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">💻 Технические характеристики</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {eq.cpu && (
                    <div>
                      <p className="text-sm text-gray-500">Процессор (ЦП)</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-800">{eq.cpu}</p>
                        {cpuInfo && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getCPUBadgeColor(cpuInfo.tier)}`}>
                            {getCPUBadgeText(cpuInfo.tier)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {eq.ram && eq.ram > 0 ? <InfoRow label="Оперативная память (ОЗУ)" value={`${eq.ram} ГБ`} /> : null}
                  {eq.storageType && (
                    <InfoRow 
                      label="Хранилище" 
                      value={`${eq.storageType}${eq.storageSize && eq.storageSize > 0 ? ` ${eq.storageSize} ГБ` : ''}`} 
                    />
                  )}
                </div>
              </div>
            );
          })()}

          {/* Информация об обслуживании */}
          {nextMaintenances.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">🔧 Обслуживание</h3>
              <div className="space-y-3">
                {nextMaintenances.map((m, idx) => (
                  <div key={idx} className={`rounded-lg p-4 ${m.is_overdue ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-800">{m.maintenance_type_name}</p>
                      {m.is_overdue && (
                        <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">Просрочено</span>
                      )}
                    </div>
                    {m.last_maintenance_date && (
                      <p className="text-xs text-gray-600 mb-1">
                        Последнее: {formatDate(m.last_maintenance_date)}
                        {m.last_maintenance_description && ` — ${m.last_maintenance_description}`}
                      </p>
                    )}
                    {m.next_maintenance_date && (
                      <p className={`text-xs ${m.is_overdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                        Следующее: {formatDate(m.next_maintenance_date)} ({getDaysUntilText(m.days_until)})
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {eq.notes && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Заметки</h3>
              <p className="text-gray-600 text-sm">{eq.notes}</p>
            </div>
          )}
        </div>

        {/* QR Code */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">QR код</h3>
            <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-xl">
              <QRCodeSVG value={eq.qrCode} size={180} level="M" />
            </div>
            <p className="text-xs text-gray-500 mt-3 font-mono">{eq.qrCode}</p>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Действия</h3>
            <div className="space-y-2">
              <button onClick={() => setShowMaintenanceModal(true)} className="w-full px-4 py-2.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors text-left">
                🔧 Добавить обслуживание
              </button>
              <button onClick={() => { setNewName(eq.name); setShowNameModal(true); }} className="w-full px-4 py-2.5 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-100 transition-colors text-left">
                📝 Изменить название
              </button>
              <button onClick={() => { setNewStatus(eq.status); setShowStatusModal(true); }} className="w-full px-4 py-2.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors text-left">
                🔄 Сменить статус
              </button>
              <button onClick={() => { setNewUserId(eq.userId || ''); setNewRoomId(eq.roomId || ''); setShowMoveModal(true); }} className="w-full px-4 py-2.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors text-left">
                📍 Переместить оборудование
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-xl sm:rounded-xl p-4 sm:p-6 w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Смена статуса</h3>
            <div className="space-y-2 mb-6">
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <label key={k} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${newStatus === k ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input type="radio" name="status" value={k} checked={newStatus === k} onChange={() => setNewStatus(k as EquipmentStatus)} className="text-blue-600" />
                  <span className="text-sm font-medium">{v}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={handleStatusChange} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Применить</button>
              <button onClick={() => setShowStatusModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Отмена</button>
            </div>
          </div>
        </div>
      )}

      {/* Move Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-xl sm:rounded-xl p-4 sm:p-6 w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Перемещение оборудования</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Сотрудник</label>
                <select value={newUserId} onChange={e => setNewUserId(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Не назначен</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.lastName} {u.firstName} {u.middleName || ''}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Помещение</label>
                <select value={newRoomId} onChange={e => setNewRoomId(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Не указано</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.name} ({r.building})</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleMove} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">Переместить</button>
              <button onClick={() => setShowMoveModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Отмена</button>
            </div>
          </div>
        </div>
      )}

      {/* Name Change Modal */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-xl sm:rounded-xl p-4 sm:p-6 w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Изменение названия</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Новое название *</label>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)} 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Введите новое название"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Комментарий (необязательно)</label>
                <textarea 
                  value={nameComment} 
                  onChange={e => setNameComment(e.target.value)} 
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Причина изменения названия..."
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleNameChange} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">Изменить</button>
              <button onClick={() => { setShowNameModal(false); setNewName(''); setNameComment(''); }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Отмена</button>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Modal */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-xl sm:rounded-xl p-4 sm:p-6 w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Добавить обслуживание — {eq.name}</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Тип обслуживания *</label>
                <select
                  value={maintenanceForm.maintenance_type_id}
                  onChange={e => setMaintenanceForm({ ...maintenanceForm, maintenance_type_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">Выберите тип</option>
                  {maintenanceTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Дата обслуживания *</label>
                <input
                  type="date"
                  value={maintenanceForm.date}
                  onChange={e => setMaintenanceForm({ ...maintenanceForm, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Описание работ</label>
                <textarea
                  value={maintenanceForm.description}
                  onChange={e => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Что было сделано..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Заметки</label>
                <textarea
                  value={maintenanceForm.notes}
                  onChange={e => setMaintenanceForm({ ...maintenanceForm, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Дополнительная информация..."
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleAddMaintenance} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">Добавить</button>
              <button onClick={() => setShowMaintenanceModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value}</p>
    </div>
  );
}
