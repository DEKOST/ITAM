import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { getEquipmentRelations, createEquipmentRelation, deleteEquipmentRelation, deleteEquipmentRelationBetween, getRelationTypes } from '../api';
import { Link } from 'react-router-dom';

interface EquipmentRelation {
  relation_id: string;
  relation_type: string;
  id: string;
  name: string;
  serial_number: string;
  inventory_number: string;
  type_name: string;
}

interface EquipmentRelationsProps {
  equipmentId: string;
}

export default function EquipmentRelations({ equipmentId }: EquipmentRelationsProps) {
  const { equipment } = useData();
  const [children, setChildren] = useState<EquipmentRelation[]>([]);
  const [parents, setParents] = useState<EquipmentRelation[]>([]);
  const [relationTypes, setRelationTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<'child' | 'parent'>('child');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [selectedRelationType, setSelectedRelationType] = useState('component');

  useEffect(() => {
    loadRelations();
    loadRelationTypes();
  }, [equipmentId]);

  const loadRelations = async () => {
    try {
      console.log(`Загрузка связей для оборудования: ${equipmentId}`);
      const data = await getEquipmentRelations(equipmentId);
      console.log('Получены связи:', data);
      setChildren(data.children || []);
      setParents(data.parents || []);
    } catch (error) {
      console.error('Ошибка загрузки связей:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRelationTypes = async () => {
    try {
      const types = await getRelationTypes();
      setRelationTypes(types);
    } catch (error) {
      console.error('Ошибка загрузки типов связей:', error);
    }
  };

  const handleAddRelation = async () => {
    if (!selectedEquipment) {
      alert('Выберите оборудование');
      return;
    }

    try {
      if (addMode === 'child') {
        await createEquipmentRelation(equipmentId, selectedEquipment, selectedRelationType);
      } else {
        await createEquipmentRelation(selectedEquipment, equipmentId, selectedRelationType);
      }
      
      // Перезагружаем связи
      await loadRelations();
      
      // Закрываем модальное окно и сбрасываем форму
      setShowAddModal(false);
      setSelectedEquipment('');
      setSelectedRelationType('component');
      
      // Показываем уведомление об успехе
      alert('Связь успешно добавлена');
    } catch (error: any) {
      alert('Ошибка создания связи: ' + error.message);
    }
  };

  const handleDeleteRelation = async (relationId: string, otherEquipmentId?: string) => {
    if (!confirm('Удалить эту связь?')) return;

    try {
      if (otherEquipmentId) {
        // Используем новый API для удаления связи между двумя устройствами
        await deleteEquipmentRelationBetween(equipmentId, otherEquipmentId);
      } else {
        // Используем старый API для удаления связи по ID
        await deleteEquipmentRelation(relationId);
      }
      await loadRelations();
    } catch (error: any) {
      alert('Ошибка удаления связи: ' + error.message);
    }
  };

  const getRelationTypeLabel = (type: string) => {
    const found = relationTypes.find(t => t.value === type);
    return found ? found.label : type;
  };

  // Фильтруем оборудование для выбора (исключаем текущее)
  const availableEquipment = equipment.filter(eq => eq.id !== equipmentId);

  if (loading) {
    return <div className="text-center py-4 text-gray-500">Загрузка связей...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700">🔗 Связи оборудования</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Добавить связь
        </button>
      </div>

      {/* Родительские элементы */}
      {parents.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-600 mb-3">
            Родительское оборудование ({parents.length})
          </h4>
          <div className="space-y-2">
            {parents.map(parent => (
              <div key={parent.relation_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <Link to={`/equipment/${parent.id}`} className="font-medium text-blue-600 hover:text-blue-800">
                    {parent.name}
                  </Link>
                  <div className="text-xs text-gray-500 mt-1">
                    {parent.type_name} • {parent.inventory_number}
                    {parent.serial_number && ` • S/N: ${parent.serial_number}`}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Тип связи: {getRelationTypeLabel(parent.relation_type)}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteRelation(parent.relation_id, parent.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  title="Удалить связь"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Дочерние элементы */}
      {children.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-600 mb-3">
            Дочернее оборудование ({children.length})
          </h4>
          <div className="space-y-2">
            {children.map(child => (
              <div key={child.relation_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <Link to={`/equipment/${child.id}`} className="font-medium text-blue-600 hover:text-blue-800">
                    {child.name}
                  </Link>
                  <div className="text-xs text-gray-500 mt-1">
                    {child.type_name} • {child.inventory_number}
                    {child.serial_number && ` • S/N: ${child.serial_number}`}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Тип связи: {getRelationTypeLabel(child.relation_type)}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteRelation(child.relation_id, child.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  title="Удалить связь"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {parents.length === 0 && children.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-4xl mb-3">🔗</p>
          <p>Нет связанных устройств</p>
          <p className="text-sm mt-2">Добавьте связи с другим оборудованием</p>
        </div>
      )}

      {/* Модальное окно добавления связи */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Добавить связь</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Тип связи</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAddMode('child')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium ${
                      addMode === 'child'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Добавить дочернее
                  </button>
                  <button
                    onClick={() => setAddMode('parent')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium ${
                      addMode === 'parent'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Добавить родительское
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {addMode === 'child'
                    ? 'Выберите оборудование, которое будет компонентом текущего'
                    : 'Выберите оборудование, к которому будет привязано текущее'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Тип связи</label>
                <select
                  value={selectedRelationType}
                  onChange={e => setSelectedRelationType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {relationTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label} - {type.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Оборудование *</label>
                <select
                  value={selectedEquipment}
                  onChange={e => setSelectedEquipment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Выберите оборудование</option>
                  {availableEquipment.map(eq => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name} ({eq.inventoryNumber})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddRelation}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Добавить
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedEquipment('');
                  setSelectedRelationType('component');
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
