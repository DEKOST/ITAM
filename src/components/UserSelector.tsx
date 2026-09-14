import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';

interface UserSelectorProps {
  value: string;
  onChange: (userId: string) => void;
  label?: string;
}

export default function UserSelector({ value, onChange, label = 'Сотрудник' }: UserSelectorProps) {
  const { users, subdivisions } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Закрытие при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Фильтрация пользователей по поиску
  const filteredUsers = users.filter(user => {
    const searchText = search.toLowerCase();
    const fullName = `${user.lastName} ${user.firstName} ${user.middleName || ''}`.toLowerCase();
    return (
      fullName.includes(searchText) ||
      user.email.toLowerCase().includes(searchText) ||
      user.position.toLowerCase().includes(searchText)
    );
  });

  // Группировка по подразделениям
  const groupedUsers = filteredUsers.reduce((acc, user) => {
    const subdivision = user.subdivisionId 
      ? subdivisions.find(s => s.id === user.subdivisionId)?.name || 'Без подразделения'
      : 'Без подразделения';
    
    if (!acc[subdivision]) {
      acc[subdivision] = [];
    }
    acc[subdivision].push(user);
    return acc;
  }, {} as Record<string, typeof users>);

  const selectedUser = users.find(u => u.id === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      
      {/* Кнопка открытия */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hover:border-gray-300 transition-colors"
      >
        {selectedUser ? (
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-800">
                {selectedUser.lastName} {selectedUser.firstName} {selectedUser.middleName}
              </div>
              <div className="text-xs text-gray-500">{selectedUser.position}</div>
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        ) : (
          <div className="flex items-center justify-between text-gray-500">
            <span>Не выбран</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </button>

      {/* Выпадающий список */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-hidden">
          {/* Поиск */}
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              placeholder="Поиск по ФИО, email, должности..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {/* Список пользователей */}
          <div className="overflow-y-auto max-h-80">
            {/* Кнопка очистки */}
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 border-b border-gray-200"
              >
                ✕ Сбросить выбор
              </button>
            )}

            {Object.keys(groupedUsers).length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                Сотрудники не найдены
              </div>
            ) : (
              Object.entries(groupedUsers).map(([subdivision, subdivisionUsers]) => (
                <div key={subdivision}>
                  {/* Заголовок подразделения */}
                  <div className="px-3 py-2 bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wide border-b border-gray-200">
                    🏛️ {subdivision}
                  </div>
                  
                  {/* Сотрудники подразделения */}
                  {subdivisionUsers.map(user => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => {
                        onChange(user.id);
                        setIsOpen(false);
                        setSearch('');
                      }}
                      className={`w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 ${
                        value === user.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                      }`}
                    >
                      <div className="font-medium text-gray-800 text-sm">
                        {user.lastName} {user.firstName} {user.middleName}
                      </div>
                      <div className="text-xs text-gray-500">{user.position}</div>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
