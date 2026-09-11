import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Room } from '../types';

export default function Rooms() {
  const { rooms, addRoom, updateRoom, deleteRoom } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', building: '', floor: 1, description: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await updateRoom(editing, form);
    } else {
      await addRoom(form);
    }
    setForm({ name: '', building: '', floor: 1, description: '' });
    setShowForm(false);
    setEditing(null);
  };

  const startEdit = (room: Room) => {
    setForm({ name: room.name, building: room.building, floor: room.floor, description: room.description });
    setEditing(room.id);
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Помещения</h2>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ name: '', building: '', floor: 1, description: '' }); }} className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          {showForm ? 'Скрыть форму' : '+ Добавить'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">{editing ? 'Редактировать помещение' : 'Новое помещение'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
              <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Здание *</label>
              <input required value={form.building} onChange={e => setForm({...form, building: e.target.value})} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Этаж</label>
              <input type="number" value={form.floor} onChange={e => setForm({...form, floor: parseInt(e.target.value) || 0})} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
              <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button type="submit" className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">{editing ? 'Сохранить' : 'Добавить'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Отмена</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">Нет помещений</div>
        ) : rooms.map(room => (
          <div key={room.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-gray-800">{room.name}</h4>
                <p className="text-sm text-gray-500 mt-1">{room.building} • Этаж {room.floor}</p>
                {room.description && <p className="text-xs text-gray-400 mt-1">{room.description}</p>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => startEdit(room)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg text-sm">✏️</button>
                <button onClick={async () => { if (confirm('Удалить помещение?')) await deleteRoom(room.id); }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg text-sm">🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
