import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import * as XLSX from 'xlsx';

export default function ExportReports() {
  const { equipment, equipmentTypes, categories, users, rooms, subdivisions } = useData();
  const [exportType, setExportType] = useState<'equipment' | 'by-user' | 'act'>('equipment');
  const [selectedUser, setSelectedUser] = useState('');
  const [loading, setLoading] = useState(false);

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
  const getSubdivisionName = (userId: string | null) => {
    if (!userId) return '—';
    const user = users.find(u => u.id === userId);
    if (!user || !user.subdivisionId) return '—';
    return subdivisions.find(s => s.id === user.subdivisionId)?.name || '—';
  };

  const exportToExcel = (data: any[][], filename: string, sheetName: string = 'Данные') => {
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    
    // Устанавливаем ширину колонок
    const colWidths = data[0].map(() => ({ wch: 20 }));
    ws['!cols'] = colWidths;
    
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  const handleExportEquipment = () => {
    setLoading(true);
    try {
      const headers = [
        'Название',
        'Тип',
        'Категория',
        'Серийный номер',
        'Инвентарный номер',
        'Статус',
        'Сотрудник',
        'Подразделение',
        'Помещение',
        'Дата покупки',
        'Гарантия до',
        'Процессор',
        'ОЗУ (ГБ)',
        'Тип хранилища',
        'Объём хранилища (ГБ)',
        'Заметки'
      ];

      const rows = equipment.map(eq => [
        eq.name,
        getTypeName(eq.typeId),
        getCategoryName(eq.typeId),
        eq.serialNumber || '',
        eq.inventoryNumber || '',
        eq.status === 'in_use' ? 'В эксплуатации' :
        eq.status === 'in_reserve' ? 'В резерве' :
        eq.status === 'written_off' ? 'Списан' : 'В ремонте',
        getUserName(eq.userId),
        getSubdivisionName(eq.userId),
        getRoomName(eq.roomId),
        eq.purchaseDate || '',
        eq.warrantyEnd || '',
        eq.cpu || '',
        eq.ram || '',
        eq.storageType || '',
        eq.storageSize || '',
        eq.notes || ''
      ]);

      exportToExcel([headers, ...rows], `Оборудование_${new Date().toISOString().split('T')[0]}`, 'Оборудование');
    } catch (error) {
      alert('Ошибка экспорта: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportByUser = () => {
    if (!selectedUser) {
      alert('Выберите сотрудника');
      return;
    }

    setLoading(true);
    try {
      const user = users.find(u => u.id === selectedUser);
      if (!user) {
        alert('Сотрудник не найден');
        return;
      }

      const userEquipment = equipment.filter(eq => eq.userId === selectedUser);

      const headers = [
        'Название',
        'Тип',
        'Серийный номер',
        'Инвентарный номер',
        'Статус',
        'Помещение',
        'Дата покупки',
        'Гарантия до'
      ];

      const rows = userEquipment.map(eq => [
        eq.name,
        getTypeName(eq.typeId),
        eq.serialNumber || '',
        eq.inventoryNumber || '',
        eq.status === 'in_use' ? 'В эксплуатации' :
        eq.status === 'in_reserve' ? 'В резерве' :
        eq.status === 'written_off' ? 'Списан' : 'В ремонте',
        getRoomName(eq.roomId),
        eq.purchaseDate || '',
        eq.warrantyEnd || ''
      ]);

      const userName = `${user.lastName} ${user.firstName} ${user.middleName || ''}`.trim();
      exportToExcel([headers, ...rows], `Оборудование_${userName}_${new Date().toISOString().split('T')[0]}`, 'Оборудование сотрудника');
    } catch (error) {
      alert('Ошибка экспорта: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportAct = () => {
    if (!selectedUser) {
      alert('Выберите сотрудника');
      return;
    }

    setLoading(true);
    try {
      const user = users.find(u => u.id === selectedUser);
      if (!user) {
        alert('Сотрудник не найден');
        return;
      }

      const userEquipment = equipment.filter(eq => eq.userId === selectedUser);
      const userName = `${user.lastName} ${user.firstName} ${user.middleName || ''}`.trim();
      const currentDate = new Date().toLocaleDateString('ru-RU');

      // Создаём акт приёма-передачи
      const actData = [
        ['АКТ ПРИЁМА-ПЕРЕДАЧИ ОБОРУДОВАНИЯ'],
        [''],
        [`Дата: ${currentDate}`],
        [''],
        ['Передающая сторона: IT отдел'],
        [`Принимающая сторона: ${userName}`],
        [''],
        ['Передаётся следующее оборудование:'],
        [''],
        ['№', 'Наименование', 'Серийный номер', 'Инвентарный номер', 'Состояние'],
        ...userEquipment.map((eq, idx) => [
          idx + 1,
          eq.name,
          eq.serialNumber || '—',
          eq.inventoryNumber || '—',
          eq.status === 'in_use' ? 'Исправное' :
          eq.status === 'in_reserve' ? 'В резерве' :
          eq.status === 'written_off' ? 'Списано' : 'Требует ремонта'
        ]),
        [''],
        [''],
        [''],
        ['Передал: ____________________ / ____________________ /'],
        [''],
        ['Принял: ____________________ / ____________________ /'],
        [''],
        ['М.П.']
      ];

      exportToExcel(actData, `Акт_приёма-передачи_${userName}_${new Date().toISOString().split('T')[0]}`, 'Акт');
    } catch (error) {
      alert('Ошибка экспорта: ' + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">📄 Экспорт отчётов в Excel</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Выберите тип отчёта</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => setExportType('equipment')}
            className={`p-4 rounded-lg border-2 transition-all ${
              exportType === 'equipment'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-3xl mb-2">💻</div>
            <div className="font-semibold text-gray-800">Всё оборудование</div>
            <div className="text-sm text-gray-600 mt-1">Полный список оборудования</div>
          </button>

          <button
            onClick={() => setExportType('by-user')}
            className={`p-4 rounded-lg border-2 transition-all ${
              exportType === 'by-user'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-3xl mb-2">👤</div>
            <div className="font-semibold text-gray-800">По сотруднику</div>
            <div className="text-sm text-gray-600 mt-1">Оборудование конкретного сотрудника</div>
          </button>

          <button
            onClick={() => setExportType('act')}
            className={`p-4 rounded-lg border-2 transition-all ${
              exportType === 'act'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-3xl mb-2">📋</div>
            <div className="font-semibold text-gray-800">Акт приёма-передачи</div>
            <div className="text-sm text-gray-600 mt-1">Документ для подписи</div>
          </button>
        </div>

        {(exportType === 'by-user' || exportType === 'act') && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Выберите сотрудника</label>
            <select
              value={selectedUser}
              onChange={e => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Выберите сотрудника</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.lastName} {user.firstName} {user.middleName || ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={() => {
            if (exportType === 'equipment') handleExportEquipment();
            else if (exportType === 'by-user') handleExportByUser();
            else if (exportType === 'act') handleExportAct();
          }}
          disabled={loading}
          className="w-full px-6 py-3 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '⏳ Экспорт...' : '📥 Экспортировать в Excel'}
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">💡 Информация</h3>
        <ul className="text-sm text-blue-700 space-y-2">
          <li>• <strong>Всё оборудование</strong> - полный список всего оборудования с полной информацией</li>
          <li>• <strong>По сотруднику</strong> - список оборудования, закреплённого за конкретным сотрудником</li>
          <li>• <strong>Акт приёма-передачи</strong> - готовый документ для печати и подписи</li>
          <li>• Все отчёты экспортируются в формате Excel (.xlsx)</li>
          <li>• Файлы сохраняются в папку "Загрузки" вашего браузера</li>
        </ul>
      </div>
    </div>
  );
}
