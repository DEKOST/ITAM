import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { STATUS_LABELS, STATUS_COLORS, EquipmentStatus } from '../types';
import { QRCodeSVG } from 'qrcode.react';

export default function EquipmentView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { equipment, equipmentTypes, categories, users, rooms, updateEquipment, changeEquipmentStatus, moveEquipment } = useData();
  const eq = equipment.find(e => e.id === id);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [newStatus, setNewStatus] = useState<EquipmentStatus>('in_use');
  const [newUserId, setNewUserId] = useState('');
  const [newRoomId, setNewRoomId] = useState('');

  if (!eq) return <div className="text-center py-12"><p className="text-gray-500">Оборудование не найдено</p></div>;

  const type = equipmentTypes.find(t => t.id === eq.typeId);
  const category = type ? categories.find(c => c.id === type.categoryId) : null;
  const user = eq.userId ? users.find(u => u.id === eq.userId) : null;
  const room = eq.roomId ? rooms.find(r => r.id === eq.roomId) : null;

  const handleStatusChange = async () => {
    await changeEquipmentStatus(eq.id, newStatus);
    setShowStatusModal(false);
  };

  const handleMove = async () => {
    await moveEquipment(eq.id, { user_id: newUserId || undefined, room_id: newRoomId || undefined });
    setShowMoveModal(false);
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{eq.name}</h2>
        <div className="flex gap-2">
          <Link to={`/equipment/${eq.id}/edit`} className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-200 transition-colors">✏️ Редактировать</Link>
          <button onClick={() => navigate('/equipment')} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">← Назад</button>
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
              <InfoRow label="Сотрудник" value={user ? `${user.lastName} ${user.firstName} (${user.department})` : 'Не назначен'} />
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Перемещение оборудования</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Сотрудник</label>
                <select value={newUserId} onChange={e => setNewUserId(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Не назначен</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.lastName} {u.firstName}</option>)}
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
