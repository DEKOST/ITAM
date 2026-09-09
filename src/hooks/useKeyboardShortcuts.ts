import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Игнорируем если фокус в input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Ctrl+N - Создать новое оборудование
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        navigate('/equipment/new');
      }

      // Ctrl+F - Фокус на поиск (если мы на странице оборудования)
      if (e.ctrlKey && e.key === 'f') {
        if (location.pathname === '/equipment') {
          e.preventDefault();
          const searchInput = document.querySelector('input[placeholder="Поиск..."]') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
          }
        }
      }

      // Ctrl+D - Дублировать (если мы на странице просмотра оборудования)
      if (e.ctrlKey && e.key === 'd') {
        if (location.pathname.startsWith('/equipment/') && !location.pathname.includes('/edit') && !location.pathname.includes('/history')) {
          e.preventDefault();
          const duplicateButton = document.querySelector('[data-action="duplicate"]') as HTMLButtonElement;
          if (duplicateButton) {
            duplicateButton.click();
          }
        }
      }

      // Escape - Закрыть модальные окна
      if (e.key === 'Escape') {
        const modals = document.querySelectorAll('[role="dialog"]');
        modals.forEach(modal => {
          const closeButton = modal.querySelector('button:last-child') as HTMLButtonElement;
          if (closeButton) {
            closeButton.click();
          }
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, location]);
}
