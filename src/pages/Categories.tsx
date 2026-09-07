import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { v4 as uuidv4 } from 'uuid';

export default function Categories() {
  const { categories, equipmentTypes, addCategory, updateCategory, deleteCategory, addEquipmentType, updateEquipmentType, deleteEquipmentType } = useData();
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [typeName, setTypeName] = useState('');
  const [typeCatId, setTypeCatId] = useState('');
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<string | null>(null);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCat) {
      updateCategory({ id: editingCat, name: catName, description: catDesc });
      setEditingCat(null);
    } else {
      addCategory({ id: uuidv4(), name: catName, description: catDesc });
    }
    setCatName(''); setCatDesc('');
  };

  const handleAddType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeCatId) return;
    if (editingType) {
      updateEquipmentType({ id: editingType, name: typeName, categoryId: typeCatId });
      setEditingType(null);
    } else {
      addEquipmentType({ id: uuidv4(), name: typeName, categoryId: typeCatId });
    }
    setTypeName('');
  };

  const startEditCat = (id: string) => {
    const cat = categories.find(c => c.id === id);
    if (cat) { setCatName(cat.name); setCatDesc(cat.description); setEditingCat(id); }
  };

  const startEditType = (id: string) => {
    const type = equipmentTypes.find(t => t.id === id);
    if (type) { setTypeName(type.name); setTypeCatId(type.categoryId); setEditingType(id); }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Категории и типы оборудования</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories */}
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">{editingCat ? 'Редактировать категорию' : 'Новая категория'}</h3>
            <form onSubmit={handleAddCategory} className="space-y-3">
              <input required value={catName} onChange={e => setCatName(e.target.value)} placeholder="Название категории" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input value={catDesc} onChange={e => setCatDesc(e.target.value)} placeholder="Описание" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">{editingCat ? 'Сохранить' : 'Добавить'}</button>
                {editingCat && <button type="button" onClick={() => { setEditingCat(null); setCatName(''); setCatDesc(''); }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Отмена</button>}
              </div>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Категории ({categories.length})</h3>
            <div className="space-y-2">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{cat.name}</p>
                    <p className="text-xs text-gray-500">{cat.description}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => startEditCat(cat.id)} className="px-2 py-1 text-amber-600 hover:bg-amber-50 rounded text-xs">✏️</button>
                    <button onClick={() => { if (confirm('Удалить категорию?')) deleteCategory(cat.id); }} className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Equipment Types */}
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">{editingType ? 'Редактировать тип' : 'Новый тип оборудования'}</h3>
            <form onSubmit={handleAddType} className="space-y-3">
              <input required value={typeName} onChange={e => setTypeName(e.target.value)} placeholder="Название типа" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <select required value={typeCatId} onChange={e => setTypeCatId(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Выберите категорию</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">{editingType ? 'Сохранить' : 'Добавить'}</button>
                {editingType && <button type="button" onClick={() => { setEditingType(null); setTypeName(''); }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Отмена</button>}
              </div>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Типы оборудования ({equipmentTypes.length})</h3>
            <div className="space-y-2">
              {equipmentTypes.map(type => {
                const cat = categories.find(c => c.id === type.categoryId);
                return (
                  <div key={type.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">{type.name}</p>
                      <p className="text-xs text-gray-500">{cat?.name || 'Без категории'}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => startEditType(type.id)} className="px-2 py-1 text-amber-600 hover:bg-amber-50 rounded text-xs">✏️</button>
                      <button onClick={() => { if (confirm('Удалить тип?')) deleteEquipmentType(type.id); }} className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs">🗑️</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
