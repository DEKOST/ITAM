import React, { useState, useEffect } from 'react';
import { getEquipmentAccessories, addEquipmentAccessory, removeEquipmentAccessory, getAccessoryTypes } from '../api';

interface Accessory {
  id: string;
  quantity: number;
  notes: string;
  accessory_type_id: string;
  accessory_name: string;
  accessory_icon: string;
}

interface AccessoryType {
  id: string;
  name: string;
  icon: string;
}

interface EquipmentAccessoriesProps {
  equipmentId: string;
}

export default function EquipmentAccessories({ equipmentId }: EquipmentAccessoriesProps) {
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [accessoryTypes, setAccessoryTypes] = useState<AccessoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAccessoryType, setSelectedAccessoryType] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadAccessories();
    loadAccessoryTypes();
  }, [equipmentId]);

  const loadAccessories = async () => {
    try {
      const data = await getEquipmentAccessories(equipmentId);
      setAccessories(data);
    } catch (error) {
      console.error('Ошибка загрузки аксессуаров:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAccessoryTypes = async () => {
    try {
      const types = await getAccessoryTypes();
      setAccessoryTypes(types);
    } catch (error) {
      console.error('Ошибка загрузки типов аксессуаров:', error);
    }
  };

  const handleAddAccessory = async () => {
    if (!selectedAccessoryType) {
      alert('Выберите тип аксессуара');
      return;
    }

    try {
      await addEquipmentAccessory(equipmentId, selectedAccessoryType, quantity, notes);
      await loadAccessories();
      setShowAddModal(false);
      setSelectedAccessoryType('');
      setQuantity(1);
      setNotes('');
    } catch (error: any) {
      alert('Ошибка добавления аксессуара: ' + error.message);
    }
  };

  const handleRemoveAccessory = async (accessoryId: string) => {
    if (!confirm('Удалить этот аксессуар?')) return;

    try {
      await removeEquipmentAccessory(equipmentId, accessoryId);
      await loadAccessories();
    } catch (error: any) {
      alert('Ошибка удаления аксессуара: ' + error.message);
    }
  };

  if (loading) {
    return <div className="text-center py-4 text-gray-500">Загрузка аксессуаров...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700">🔌 Аксессуары и периферия</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Добавить аксессуар
        </button>
      </div>

      {accessories.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-4xl mb-3">🔌</p>
          <p>Нет аксессуаров</p>
          <p className="text-sm mt-2">Добавьте мышь, клавиатуру, веб-камеру и другие аксессуары</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {accessories.map(accessory => (
            <div key={accessory.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{accessory.accessory_icon}</span>
                <div>
                  <div className="font-medium text-gray-800">{accessory.accessory_name}</div>
                  {accessory.quantity > 1 && (
                    <div className="text-xs text-gray-500">Количество: {accessory.quantity}</div>
                  )}
                  {accessory.notes && (
                    <div className="text-xs text-gray-400">{accessory.notes}</div>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleRemoveAccessory(accessory.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                title="Удалить аксессуар"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Модальное окно добавления аксессуара */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Добавить аксессуар</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Тип аксессуара *</label>
                <div className="grid grid-cols-2 gap-2">
                  {accessoryTypes.map(type => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedAccessoryType(type.id)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedAccessoryType === type.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{type.icon}</div>
                      <div className="text-sm font-medium">{type.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Количество</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Заметки</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Дополнительная информация..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddAccessory}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Добавить
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedAccessoryType('');
                  setQuantity(1);
                  setNotes('');
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
