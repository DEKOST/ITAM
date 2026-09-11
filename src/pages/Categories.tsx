import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Category, EquipmentType } from '../types';

export default function Categories() {
  const { categories, equipmentTypes, addCategory, updateCategory, deleteCategory, addEquipmentType, updateEquipmentType, deleteEquipmentType } = useData();
  const [showCatForm, setShowCatForm] = useState(false);
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<string | null>(null);
  const [catForm, setCatForm] = useState({ name: '', description: '' });
  const [typeForm, setTypeForm] = useState({ name: '', categoryId: '', hasSpecs: false });

  const handleCatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCat) {
      await updateCategory(editingCat, catForm);
    } else {
      await addCategory(catForm);
    }
    setCatForm({ name: '', description: '' });
    setShowCatForm(false);
    setEditingCat(null);
  };

  const handleTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingType) {
      await updateEquipmentType(editingType, { name: typeForm.name, categoryId: typeForm.categoryId, hasSpecs: typeForm.hasSpecs });
    } else {
      await addEquipmentType({ name: typeForm.name, categoryId: typeForm.categoryId, hasSpecs: typeForm.hasSpecs });
    }
    setTypeForm({ name: '', categoryId: '', hasSpecs: false });
    setShowTypeForm(false);
    setEditingType(null);
  };

  const startEditCat = (cat: Category) => {
    setCatForm({ name: cat.name, description: cat.description });
    setEditingCat(cat.id);
    setShowCatForm(true);
  };

  const startEditType = (type: EquipmentType) => {
    setTypeForm({ name: type.name, categoryId: type.categoryId, hasSpecs: type.hasSpecs || false });
    setEditingType(type.id);
    setShowTypeForm(true);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Категории и типы оборудования</h2>

      {/* Категории */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-700">Категории</h3>
          <button onClick={() => { setShowCatForm(!showCatForm); setEditingCat(null); setCatForm({ name: '', description: '' }); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            {showCatForm ? 'Скрыть' : '+ Добавить категорию'}
          </button>
        </div>

        {showCatForm && (
          <form onSubmit={handleCatSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
            <h4 className="font-medium text-gray-700 mb-3">{editingCat ? 'Редактировать категорию' : 'Новая категория'}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
                <input required value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                <input value={catForm.description} onChange={e => setCatForm({...catForm, description: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">{editingCat ? 'Сохранить' : 'Добавить'}</button>
              <button type="button" onClick={() => { setShowCatForm(false); setEditingCat(null); }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Отмена</button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => (
            <div key={cat.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-gray-800">{cat.name}</h4>
                  {cat.description && <p className="text-sm text-gray-500 mt-1">{cat.description}</p>}
                  <p className="text-xs text-gray-400 mt-2">Типов: {equipmentTypes.filter(t => t.categoryId === cat.id).length}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEditCat(cat)} className="px-2 py-1 text-amber-600 hover:bg-amber-50 rounded text-xs">✏️</button>
                  <button onClick={async () => { if (confirm('Удалить категорию?')) { try { await deleteCategory(cat.id); } catch(e: any) { alert(e.message); } } }} className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs">🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Типы */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-700">Типы оборудования</h3>
          <button onClick={() => { setShowTypeForm(!showTypeForm); setEditingType(null); setTypeForm({ name: '', categoryId: '', hasSpecs: false }); }} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
            {showTypeForm ? 'Скрыть' : '+ Добавить тип'}
          </button>
        </div>

        {showTypeForm && (
          <form onSubmit={handleTypeSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
            <h4 className="font-medium text-gray-700 mb-3">{editingType ? 'Редактировать тип' : 'Новый тип'}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
                <input required value={typeForm.name} onChange={e => setTypeForm({...typeForm, name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Категория *</label>
                <select required value={typeForm.categoryId} onChange={e => setTypeForm({...typeForm, categoryId: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Выберите категорию</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={typeForm.hasSpecs} 
                  onChange={e => setTypeForm({...typeForm, hasSpecs: e.target.checked})} 
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Имеет технические характеристики (ЦП, ОЗУ, хранилище)</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">Отметьте для ПК, ноутбуков и другого оборудования с процессором и памятью</p>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">{editingType ? 'Сохранить' : 'Добавить'}</button>
              <button type="button" onClick={() => { setShowTypeForm(false); setEditingType(null); }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Отмена</button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Тип</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Категория</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Тех. характеристики</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {equipmentTypes.map(type => (
                <tr key={type.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{type.name}</td>
                  <td className="px-4 py-3 text-gray-600">{categories.find(c => c.id === type.categoryId)?.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {type.hasSpecs ? (
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">✓ Да</span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => startEditType(type)} className="px-2 py-1 text-amber-600 hover:bg-amber-50 rounded text-xs">✏️</button>
                      <button onClick={async () => { if (confirm('Удалить тип?')) { try { await deleteEquipmentType(type.id); } catch(e: any) { alert(e.message); } } }} className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
