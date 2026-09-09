import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Link } from 'react-router-dom';
import { STATUS_LABELS, STATUS_COLORS } from '../types';

export default function ReplacementRecommendations() {
  const { equipment, equipmentTypes, users, rooms } = useData();

  // Фильтруем только ПК и ноутбуки
  const computers = useMemo(() => {
    return equipment.filter(eq => {
      const type = equipmentTypes.find(t => t.id === eq.typeId);
      return type && (type.name.toLowerCase().includes('пк') || 
                     type.name.toLowerCase().includes('компьютер') || 
                     type.name.toLowerCase().includes('ноутбук'));
    });
  }, [equipment, equipmentTypes]);

  // Функция для расчёта "возраста" оборудования в баллах
  const calculateAgeScore = (eq: any): number => {
    let score = 0;
    
    // Возраст по дате покупки
    if (eq.purchaseDate) {
      const purchaseDate = new Date(eq.purchaseDate);
      const now = new Date();
      const yearsDiff = (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
      
      if (yearsDiff > 5) score += 50;
      else if (yearsDiff > 4) score += 40;
      else if (yearsDiff > 3) score += 30;
      else if (yearsDiff > 2) score += 15;
      else if (yearsDiff > 1) score += 5;
    } else {
      score += 20; // Если дата не указана, считаем что старое
    }

    // Оперативная память
    if (eq.ram) {
      if (eq.ram < 4) score += 40;
      else if (eq.ram < 8) score += 25;
      else if (eq.ram < 16) score += 10;
    } else {
      score += 15; // Если не указано, вероятно старое
    }

    // Тип хранилища
    if (eq.storageType) {
      if (eq.storageType === 'HDD') score += 20;
      else if (eq.storageType === 'SSD') score += 5;
      // M2 не добавляем баллов - это современное
    } else {
      score += 10; // Если не указано
    }

    // Объём хранилища
    if (eq.storageSize) {
      if (eq.storageSize < 256) score += 15;
      else if (eq.storageSize < 512) score += 5;
    }

    return score;
  };

  // Сортируем оборудование по "устареванию" (от самого старого к новому)
  const sortedComputers = useMemo(() => {
    return computers
      .map(eq => ({
        ...eq,
        ageScore: calculateAgeScore(eq)
      }))
      .sort((a, b) => b.ageScore - a.ageScore);
  }, [computers]);

  const getTypeName = (typeId: string) => equipmentTypes.find(t => t.id === typeId)?.name || '—';
  const getUserName = (userId: string | null) => {
    if (!userId) return 'Не назначен';
    const user = users.find(u => u.id === userId);
    return user ? `${user.lastName} ${user.firstName}` : 'Неизвестный';
  };
  const getRoomName = (roomId: string | null) => {
    if (!roomId) return '—';
    return rooms.find(r => r.id === roomId)?.name || '—';
  };

  const getRecommendationLevel = (score: number): { label: string; color: string; bgColor: string } => {
    if (score >= 60) return { label: 'Критическая замена', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200' };
    if (score >= 40) return { label: 'Рекомендуется замена', color: 'text-orange-700', bgColor: 'bg-orange-50 border-orange-200' };
    if (score >= 20) return { label: 'Планировать замену', color: 'text-yellow-700', bgColor: 'bg-yellow-50 border-yellow-200' };
    return { label: 'В хорошем состоянии', color: 'text-green-700', bgColor: 'bg-green-50 border-green-200' };
  };

  const criticalCount = sortedComputers.filter(eq => eq.ageScore >= 60).length;
  const recommendedCount = sortedComputers.filter(eq => eq.ageScore >= 40 && eq.ageScore < 60).length;
  const planCount = sortedComputers.filter(eq => eq.ageScore >= 20 && eq.ageScore < 40).length;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Рекомендации по замене оборудования</h2>
        <p className="text-sm text-gray-500 mt-1">Анализ устаревания ПК и ноутбуков на основе технических характеристик и возраста</p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Критическая замена</p>
              <p className="text-3xl font-bold text-red-700 mt-1">{criticalCount}</p>
            </div>
            <span className="text-4xl">🔴</span>
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">Рекомендуется замена</p>
              <p className="text-3xl font-bold text-orange-700 mt-1">{recommendedCount}</p>
            </div>
            <span className="text-4xl">🟠</span>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">Планировать замену</p>
              <p className="text-3xl font-bold text-yellow-700 mt-1">{planCount}</p>
            </div>
            <span className="text-4xl">🟡</span>
          </div>
        </div>
      </div>

      {/* Список оборудования */}
      {sortedComputers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-4xl mb-3">💻</p>
          <p className="text-gray-500">Нет ПК или ноутбуков в базе данных</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedComputers.map(eq => {
            const level = getRecommendationLevel(eq.ageScore);
            return (
              <Link
                key={eq.id}
                to={`/equipment/${eq.id}`}
                className={`block rounded-xl border-2 p-4 hover:shadow-md transition-shadow ${level.bgColor}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">{eq.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${level.color} ${level.bgColor}`}>
                        {level.label}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Тип:</span>
                        <p className="font-medium text-gray-800">{getTypeName(eq.typeId)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Сотрудник:</span>
                        <p className="font-medium text-gray-800">{getUserName(eq.userId)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Помещение:</span>
                        <p className="font-medium text-gray-800">{getRoomName(eq.roomId)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Статус:</span>
                        <p className="font-medium">
                          <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[eq.status]}`}>
                            {STATUS_LABELS[eq.status]}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Технические характеристики */}
                    <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">ЦП:</span>
                        <p className="font-medium text-gray-700">{eq.cpu || '—'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">ОЗУ:</span>
                        <p className="font-medium text-gray-700">{eq.ram ? `${eq.ram} ГБ` : '—'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Хранилище:</span>
                        <p className="font-medium text-gray-700">
                          {eq.storageType ? `${eq.storageType}${eq.storageSize ? ` ${eq.storageSize} ГБ` : ''}` : '—'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Дата покупки:</span>
                        <p className="font-medium text-gray-700">{eq.purchaseDate || '—'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-400">{eq.ageScore}</div>
                    <div className="text-xs text-gray-500">баллов</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Информация о методике расчёта */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">ℹ️ Методика расчёта</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Возраст:</strong> &gt;5 лет = 50 баллов, 4 года = 40, 3 года = 30, 2 года = 15, 1 год = 5</li>
          <li>• <strong>ОЗУ:</strong> &lt;4 ГБ = 40 баллов, &lt;8 ГБ = 25, &lt;16 ГБ = 10</li>
          <li>• <strong>Хранилище:</strong> HDD = 20 баллов, SSD = 5, объём &lt;256 ГБ = 15</li>
          <li>• <strong>Уровни:</strong> 🔴 &gt;60 = критическая замена, 🟠 40-60 = рекомендуется, 🟡 20-40 = планировать</li>
        </ul>
      </div>
    </div>
  );
}
