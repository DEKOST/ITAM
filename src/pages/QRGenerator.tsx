import React, { useState, useRef } from 'react';
import { useData } from '../context/DataContext';
import { QRCodeSVG } from 'qrcode.react';
import { STATUS_LABELS } from '../types';

export default function QRGenerator() {
  const { equipment, equipmentTypes, rooms } = useData();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  const filtered = equipment.filter(eq =>
    eq.name.toLowerCase().includes(search.toLowerCase()) ||
    eq.inventoryNumber.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(e => e.id));
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>QR коды оборудования</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .qr-card { display: inline-block; border: 1px solid #ddd; border-radius: 8px; padding: 12px; margin: 8px; text-align: center; page-break-inside: avoid; width: 200px; }
            .qr-card h4 { margin: 8px 0 4px; font-size: 12px; }
            .qr-card p { margin: 2px 0; font-size: 10px; color: #666; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <h2 class="no-print">QR коды оборудования</h2>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Генерация QR кодов</h2>
        {selectedIds.length > 0 && (
          <button onClick={handlePrint} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
            🖨️ Печать ({selectedIds.length})
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equipment list */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <input
              type="text"
              placeholder="Поиск оборудования..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={selectAll} className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 mb-3">
              {selectedIds.length === filtered.length ? 'Снять выделение' : 'Выбрать все'}
            </button>
            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {filtered.map(eq => {
                const type = equipmentTypes.find(t => t.id === eq.typeId);
                return (
                  <div
                    key={eq.id}
                    onClick={() => toggleSelect(eq.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${selectedIds.includes(eq.id) ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'}`}
                  >
                    <input type="checkbox" checked={selectedIds.includes(eq.id)} readOnly className="rounded" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{eq.name}</p>
                      <p className="text-xs text-gray-500">{type?.name} • {eq.inventoryNumber}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* QR Preview */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              Предпросмотр ({selectedIds.length} шт.)
            </h3>
            {selectedIds.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-12">Выберите оборудование для генерации QR кодов</p>
            ) : (
              <div ref={printRef} className="flex flex-wrap gap-4">
                {selectedIds.map(id => {
                  const eq = equipment.find(e => e.id === id);
                  if (!eq) return null;
                  const type = equipmentTypes.find(t => t.id === eq.typeId);
                  const room = eq.roomId ? rooms.find(r => r.id === eq.roomId) : null;
                  return (
                    <div key={id} className="qr-card border-2 border-gray-200 rounded-xl p-4 text-center w-[220px]">
                      <QRCodeSVG value={eq.qrCode} size={150} level="M" />
                      <h4 className="font-semibold text-gray-800 text-sm mt-3">{eq.name}</h4>
                      <p className="text-xs text-gray-500">{type?.name || '—'}</p>
                      <p className="text-xs text-gray-500 font-mono">ИН: {eq.inventoryNumber}</p>
                      {room && <p className="text-xs text-gray-500">📍 {room.name}</p>}
                      <p className="text-xs text-gray-400 mt-1 font-mono">{eq.qrCode.substring(0, 8)}...</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
