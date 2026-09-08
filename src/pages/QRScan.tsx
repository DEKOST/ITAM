import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useData } from '../context/DataContext';
import { STATUS_LABELS, STATUS_COLORS, EquipmentStatus, Equipment } from '../types';
import { Link } from 'react-router-dom';
import * as api from '../api';

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

export default function QRScan() {
  const { equipment, equipmentTypes, users, rooms, refreshEquipment, changeEquipmentStatus, moveEquipment } = useData();
  const [scannedId, setScannedId] = useState<string | null>(null);
  const [scannedEq, setScannedEq] = useState<Equipment | null>(null);
  const [nextMaintenances, setNextMaintenances] = useState<NextMaintenance[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [newStatus, setNewStatus] = useState<EquipmentStatus>('in_use');
  const [newUserId, setNewUserId] = useState('');
  const [newRoomId, setNewRoomId] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [maintenanceTypes, setMaintenanceTypes] = useState<any[]>([]);
  const [maintenanceForm, setMaintenanceForm] = useState({
    maintenance_type_id: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    cost: 0,
    performed_by: '',
    notes: ''
  });
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Функция поиска оборудования по QR-коду через API
  const searchEquipmentByQR = async (qrCode: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getEquipmentByQR(qrCode);
      // Маппим данные из API в формат Equipment
      const equipment: Equipment = {
        id: data.id,
        name: data.name,
        serialNumber: data.serial_number || '',
        inventoryNumber: data.inventory_number || '',
        typeId: data.type_id,
        status: data.status,
        userId: data.user_id || null,
        roomId: data.room_id || null,
        purchaseDate: data.purchase_date || '',
        warrantyEnd: data.warranty_end || '',
        lastMaintenanceDate: data.last_maintenance_date || '',
        nextMaintenanceDate: data.next_maintenance_date || '',
        notes: data.notes || '',
        qrCode: data.qr_code,
        createdAt: data.created_at || '',
      };
      setScannedEq(equipment);
      
      // Загружаем информацию о следующем обслуживании
      const maintenances = await api.getNextMaintenance(data.id);
      setNextMaintenances(maintenances);
      
      // Загружаем типы обслуживания
      const types = await api.getMaintenanceTypes();
      setMaintenanceTypes(types);
    } catch (err: any) {
      setScannedEq(null);
      if (err.message.includes('не найдено')) {
        setError(`Оборудование с кодом "${qrCode}" не найдено`);
      } else {
        setError(err.message || 'Ошибка поиска');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    setError('');
    setIsScanning(true);
    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = html5QrCode;
      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          setScannedId(decodedText);
          searchEquipmentByQR(decodedText);
          stopScanner();
        },
        () => {}
      );
    } catch (err) {
      setError('Не удалось получить доступ к камере. Используйте ручной ввод.');
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    setIsScanning(false);
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
      } catch (e) {
        // ignore
      }
    }
  };

  const handleManualScan = () => {
    if (manualInput.trim()) {
      const code = manualInput.trim();
      setScannedId(code);
      searchEquipmentByQR(code);
      setManualInput('');
    }
  };

  const handleStatusChange = async () => {
    if (scannedEq) {
      await changeEquipmentStatus(scannedEq.id, newStatus);
      setShowStatusModal(false);
      // Обновляем данные оборудования
      await searchEquipmentByQR(scannedEq.qrCode);
    }
  };

  const handleMove = async () => {
    if (scannedEq) {
      await moveEquipment(scannedEq.id, { user_id: newUserId || undefined, room_id: newRoomId || undefined });
      setShowMoveModal(false);
      // Обновляем данные оборудования
      await searchEquipmentByQR(scannedEq.qrCode);
    }
  };

  const handleAddMaintenance = async () => {
    if (scannedEq && maintenanceForm.maintenance_type_id && maintenanceForm.date) {
      try {
        await api.addMaintenance(scannedEq.id, maintenanceForm);
        setShowMaintenanceModal(false);
        setMaintenanceForm({
          maintenance_type_id: '',
          date: new Date().toISOString().split('T')[0],
          description: '',
          cost: 0,
          performed_by: '',
          notes: ''
        });
        // Обновляем данные оборудования
        await searchEquipmentByQR(scannedEq.qrCode);
        alert('✅ Обслуживание добавлено');
      } catch (err: any) {
        alert('❌ Ошибка: ' + err.message);
      }
    }
  };

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

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Сканер QR кодов</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner */}
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Сканирование</h3>

            <div id="qr-reader" className="mb-4 rounded-lg overflow-hidden" style={{ display: isScanning ? 'block' : 'none' }}></div>

            {!isScanning && (
              <div className="space-y-4">
                <button onClick={startScanner} className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                  📷 Запустить камеру
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                  <div className="relative flex justify-center"><span className="bg-white px-3 text-sm text-gray-500">или введите код вручную</span></div>
                </div>

                <div className="flex gap-2">
                  <input
                    value={manualInput}
                    onChange={e => setManualInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleManualScan()}
                    placeholder="ID оборудования или UUID..."
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button onClick={handleManualScan} className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900">
                    Найти
                  </button>
                </div>
              </div>
            )}

            {isScanning && (
              <button onClick={stopScanner} className="w-full px-4 py-3 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                Остановить сканирование
              </button>
            )}

            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
          </div>
        </div>

        {/* Result */}
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Результат</h3>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Поиск оборудования...</p>
              </div>
            ) : !scannedEq ? (
              <div className="text-center py-12">
                {scannedId && !error ? (
                  <div>
                    <p className="text-4xl mb-3">❌</p>
                    <p className="text-gray-500">Оборудование с кодом "{scannedId}" не найдено</p>
                    <button onClick={() => { setScannedId(null); setError(''); }} className="mt-3 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
                      Сканировать снова
                    </button>
                  </div>
                ) : !scannedId ? (
                  <div>
                    <p className="text-4xl mb-3">📱</p>
                    <p className="text-gray-500">Отсканируйте QR код для просмотра информации</p>
                  </div>
                ) : null}
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-xl font-bold text-gray-800">{scannedEq.name}</h4>
                    <p className="text-sm text-gray-500 mt-1">{equipmentTypes.find(t => t.id === scannedEq.typeId)?.name || '—'}</p>
                  </div>
                  <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${STATUS_COLORS[scannedEq.status]}`}>
                    {STATUS_LABELS[scannedEq.status]}
                  </span>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Инв. номер</p>
                      <p className="text-sm font-medium text-gray-800">{scannedEq.inventoryNumber}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Серийный номер</p>
                      <p className="text-sm font-medium text-gray-800">{scannedEq.serialNumber || '—'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Сотрудник</p>
                      <p className="text-sm font-medium text-gray-800">
                        {scannedEq.userId ? (() => { const u = users.find(u => u.id === scannedEq.userId); return u ? `${u.lastName} ${u.firstName} ${u.middleName || ''}`.trim() : '—'; })() : 'Не назначен'}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Помещение</p>
                      <p className="text-sm font-medium text-gray-800">
                        {scannedEq.roomId ? rooms.find(r => r.id === scannedEq.roomId)?.name || '—' : 'Не указано'}
                      </p>
                    </div>
                  </div>

                  {/* Информация об обслуживании */}
                  {nextMaintenances.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-semibold text-gray-700 mb-2">🔧 Обслуживание</h5>
                      <div className="space-y-2">
                        {nextMaintenances.map((m, idx) => (
                          <div key={idx} className={`rounded-lg p-3 ${m.is_overdue ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                            <div className="flex items-start justify-between mb-1">
                              <p className="text-sm font-medium text-gray-800">{m.maintenance_type_name}</p>
                              {m.is_overdue && (
                                <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">Просрочено</span>
                              )}
                            </div>
                            {m.last_maintenance_date && (
                              <p className="text-xs text-gray-600">
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
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <button onClick={() => setShowMaintenanceModal(true)} className="w-full px-4 py-2.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors text-left">
                    🔧 Добавить обслуживание
                  </button>
                  <button onClick={() => { setNewStatus(scannedEq.status); setShowStatusModal(true); }} className="w-full px-4 py-2.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors text-left">
                    🔄 Сменить статус
                  </button>
                  <button onClick={() => { setNewUserId(scannedEq.userId || ''); setNewRoomId(scannedEq.roomId || ''); setShowMoveModal(true); }} className="w-full px-4 py-2.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors text-left">
                    📍 Переместить оборудование
                  </button>
                  <Link to={`/equipment/${scannedEq.id}`} className="block w-full px-4 py-2.5 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors text-left text-center">
                    📋 Полная информация
                  </Link>
                  <button onClick={() => { setScannedId(null); setScannedEq(null); setError(''); setNextMaintenances([]); }} className="w-full px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors text-left text-center">
                    🔄 Сканировать другой
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Modal */}
      {showStatusModal && scannedEq && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Смена статуса — {scannedEq.name}</h3>
            <div className="space-y-2 mb-6">
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <label key={k} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${newStatus === k ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input type="radio" name="scan-status" value={k} checked={newStatus === k} onChange={() => setNewStatus(k as EquipmentStatus)} className="text-blue-600" />
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
      {showMoveModal && scannedEq && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Перемещение — {scannedEq.name}</h3>
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

      {/* Maintenance Modal */}
      {showMaintenanceModal && scannedEq && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Добавить обслуживание — {scannedEq.name}</h3>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Стоимость (₽)</label>
                <input
                  type="number"
                  value={maintenanceForm.cost}
                  onChange={e => setMaintenanceForm({ ...maintenanceForm, cost: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Выполнено кем</label>
                <input
                  type="text"
                  value={maintenanceForm.performed_by}
                  onChange={e => setMaintenanceForm({ ...maintenanceForm, performed_by: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Имя исполнителя"
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
