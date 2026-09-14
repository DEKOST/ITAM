import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { deleteAllRelations } from '../api';

export default function ServiceMenu() {
  const { refreshEquipment } = useData();
  const [deleteConfirmLevel, setDeleteConfirmLevel] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; deleted?: number } | null>(null);

  const handleDeleteAllRelations = async () => {
    if (deleteConfirmLevel === 0) {
      setDeleteConfirmLevel(1);
      return;
    }
    
    if (deleteConfirmLevel === 1) {
      setDeleteConfirmLevel(2);
      return;
    }
    
    if (deleteConfirmLevel === 2) {
      setDeleting(true);
      try {
        const result = await deleteAllRelations();
        setResult(result);
        setDeleteConfirmLevel(0);
        await refreshEquipment();
      } catch (error: any) {
        setResult({ success: false, message: error.message });
        setDeleteConfirmLevel(0);
      } finally {
        setDeleting(false);
      }
    }
  };

  const resetConfirmation = () => {
    setDeleteConfirmLevel(0);
    setResult(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">🛠️ Сервисное меню</h2>

      {/* Удаление всех связей */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-700">Удаление всех связей</h3>
            <p className="text-sm text-gray-500 mt-1">
              Удаляет все связи между оборудованием. Сами единицы оборудования не удаляются.
            </p>
          </div>
          <span className="text-3xl">🔗</span>
        </div>

        {result && (
          <div className={`mb-4 p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
              {result.message}
            </p>
            {result.deleted !== undefined && (
              <p className="text-sm text-green-700 mt-1">
                Удалено связей: {result.deleted}
              </p>
            )}
          </div>
        )}

        {deleteConfirmLevel === 0 && !result && (
          <button
            onClick={handleDeleteAllRelations}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            🗑️ Удалить все связи
          </button>
        )}

        {deleteConfirmLevel === 1 && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
            <p className="text-yellow-800 font-medium mb-3">
              ⚠️ Вы уверены, что хотите удалить ВСЕ связи между оборудованием?
            </p>
            <p className="text-sm text-yellow-700 mb-4">
              Это действие нельзя отменить. Все связи будут удалены безвозвратно.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDeleteAllRelations}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700"
              >
                Да, я уверен
              </button>
              <button
                onClick={resetConfirmation}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
              >
                Отмена
              </button>
            </div>
          </div>
        )}

        {deleteConfirmLevel === 2 && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-4">
            <p className="text-red-800 font-medium mb-3">
              🚨 ПОСЛЕДНЕЕ ПРЕДУПРЕЖДЕНИЕ! 🚨
            </p>
            <p className="text-sm text-red-700 mb-2">
              Вы собираетесь удалить ВСЕ связи между оборудованием.
            </p>
            <p className="text-sm text-red-700 mb-4 font-semibold">
              Это действие НЕЛЬЗЯ отменить! Все связи будут удалены безвозвратно!
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDeleteAllRelations}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Удаление...' : '🗑️ ДА, УДАЛИТЬ ВСЁ'}
              </button>
              <button
                onClick={resetConfirmation}
                disabled={deleting}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 disabled:opacity-50"
              >
                Отмена
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Информация */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">ℹ️ Информация</h3>
        <ul className="text-sm text-blue-700 space-y-2">
          <li>• <strong>Связи</strong> - это связи между единицами оборудования (например, монитор привязан к ПК)</li>
          <li>• <strong>Удаление связей</strong> удаляет только связи, сами единицы оборудования остаются</li>
          <li>• После удаления связей вы можете создать новые связи между оборудованием</li>
          <li>• <strong>Трёхуровневое подтверждение</strong> защищает от случайного удаления</li>
        </ul>
      </div>
    </div>
  );
}
