import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  roles: string[];
}

interface NavGroup {
  label: string;
  icon: string;
  roles: string[];
  items: NavItem[];
}

// Одиночные пункты меню
const singleItems: NavItem[] = [
  { path: '/', label: 'Дашборд', icon: '📊', roles: ['admin', 'user'] },
];

// Группы меню
const navGroups: NavGroup[] = [
  {
    label: 'Структура',
    icon: '📁',
    roles: ['admin', 'user'],
    items: [
      { path: '/equipment', label: 'Оборудование', icon: '💻', roles: ['admin', 'user'] },
      { path: '/equipment-templates', label: 'Шаблоны оборудования', icon: '📋', roles: ['admin', 'user'] },
      { path: '/replacement-recommendations', label: 'Рекомендации по замене', icon: '🔄', roles: ['admin', 'user'] },
      { path: '/categories', label: 'Категории и типы', icon: '🏷️', roles: ['admin', 'user'] },
      { path: '/maintenance-types', label: 'Типы обслуживания', icon: '🔧', roles: ['admin', 'user'] },
      { path: '/users', label: 'Сотрудники', icon: '👥', roles: ['admin', 'user'] },
      { path: '/subdivisions', label: 'Подразделения', icon: '🏛️', roles: ['admin', 'user'] },
      { path: '/rooms', label: 'Помещения', icon: '🏢', roles: ['admin', 'user'] },
    ]
  },
  {
    label: 'QR-коды',
    icon: '📱',
    roles: ['admin', 'user'],
    items: [
      { path: '/qr-generator', label: 'Генерация QR', icon: '🖨️', roles: ['admin', 'user'] },
      { path: '/qr-scan', label: 'Сканер QR', icon: '📷', roles: ['admin', 'user'] },
    ]
  },
  {
    label: 'Система',
    icon: '⚙️',
    roles: ['admin'],
    items: [
      { path: '/certificates', label: 'SSL Сертификаты', icon: '🔒', roles: ['admin'] },
      { path: '/auth-users', label: 'Пользователи системы', icon: '🛡️', roles: ['admin'] },
      { path: '/backups', label: 'Резервные копии', icon: '💾', roles: ['admin'] },
    ]
  },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  // Активируем горячие клавиши
  useKeyboardShortcuts();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    // Восстанавливаем состояние из localStorage
    try {
      const saved = localStorage.getItem('itam_menu_state');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => {
      const newState = { ...prev, [label]: !prev[label] };
      localStorage.setItem('itam_menu_state', JSON.stringify(newState));
      return newState;
    });
  };

  // Проверяем, активна ли группа (есть ли активный пункт в ней)
  const isGroupActive = (group: NavGroup) => {
    return group.items.some(item => location.pathname === item.path);
  };

  // Фильтруем элементы по роли пользователя
  const filteredSingleItems = singleItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  const filteredGroups = navGroups
    .filter(group => user && group.roles.includes(user.role))
    .map(group => ({
      ...group,
      items: group.items.filter(item => user && item.roles.includes(user.role))
    }))
    .filter(group => group.items.length > 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-4 border-b border-slate-700">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">🖥️</span> ITAM Service
          </h1>
          <p className="text-xs text-slate-400 mt-1">Учёт IT оборудования</p>
        </div>
        <nav className="p-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
          {/* Одиночные пункты */}
          {filteredSingleItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                location.pathname === item.path
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}

          {/* Разделитель */}
          {filteredSingleItems.length > 0 && filteredGroups.length > 0 && (
            <div className="border-t border-slate-700 my-2"></div>
          )}

          {/* Группы меню */}
          {filteredGroups.map(group => {
            const isExpanded = expandedGroups[group.label] ?? isGroupActive(group);
            
            return (
              <div key={group.label} className="mb-1">
                {/* Заголовок группы */}
                <button
                  onClick={() => toggleGroup(group.label)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                    isGroupActive(group)
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{group.icon}</span>
                    <span className="text-sm font-medium">{group.label}</span>
                  </div>
                  <svg 
                    className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Подпункты */}
                <div className={`overflow-hidden transition-all duration-200 ${isExpanded ? 'max-h-96' : 'max-h-0'}`}>
                  <div className="pl-4 py-1">
                    {group.items.map(item => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg mb-0.5 transition-colors text-sm ${
                          location.pathname === item.path
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <span className="text-base">{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white lg:hidden">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100 hidden lg:block">ITAM Service</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme toggle */}
            <ThemeToggle />

            {/* User menu */}
            <div className="relative">
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user?.fullName?.charAt(0) || user?.username?.charAt(0) || '?'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{user?.fullName || user?.username}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role === 'admin' ? 'Администратор' : 'Пользователь'}</p>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{user?.fullName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                  </div>
                  <button 
                    onClick={logout}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                  >
                    <span>🚪</span> Выйти
                  </button>
                </div>
              </>
            )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
