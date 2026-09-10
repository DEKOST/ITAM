import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface Photo {
  id: string;
  equipment_id: string;
  filename: string;
  original_name: string;
  file_path: string;
  thumbnail_path?: string;
  file_size: number;
  mime_type: string;
  is_primary: number;
  uploaded_by: string;
  created_at: string;
}

interface PhotoGalleryProps {
  equipmentId: string;
  photos: Photo[];
  onPhotosChange: () => void;
}

export default function PhotoGallery({ equipmentId, photos, onPhotosChange }: PhotoGalleryProps) {
  const { token } = useAuth();
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Функции навигации между фотографиями
  const goToPrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setSelectedPhoto(photos[newIndex]);
    }
  };

  const goToNext = () => {
    if (currentIndex < photos.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setSelectedPhoto(photos[newIndex]);
    }
  };

  // Обновляем индекс при открытии фото
  const openPhoto = (photo: Photo) => {
    const index = photos.findIndex(p => p.id === photo.id);
    setCurrentIndex(index);
    setSelectedPhoto(photo);
  };

  // Обработка клавиш для навигации между фотографиями
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedPhoto) return;
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedPhoto(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhoto, currentIndex]);

  const handleSetPrimary = async (photoId: string) => {
    try {
      const response = await fetch(`/api/equipment/${equipmentId}/photos/${photoId}/primary`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка');
      }

      onPhotosChange();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!confirm('Удалить эту фотографию?')) return;

    setDeleting(photoId);
    try {
      const response = await fetch(`/api/equipment/${equipmentId}/photos/${photoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка');
      }

      onPhotosChange();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (photos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg className="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p>Нет фотографий</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map(photo => (
          <div key={photo.id} className="relative group">
            <div 
              className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
              onClick={() => openPhoto(photo)}
            >
              <img
                src={photo.thumbnail_path || photo.file_path}
                alt={photo.original_name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            
            {photo.is_primary === 1 && (
              <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                Основная
              </div>
            )}

            {/* Кнопки управления под фотографией */}
            <div className="mt-2 flex gap-2 justify-center">
              {photo.is_primary !== 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSetPrimary(photo.id);
                  }}
                  className="p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
                  title="Сделать основной"
                >
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(photo.id);
                }}
                disabled={deleting === photo.id}
                className="p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors disabled:opacity-50"
                title="Удалить"
              >
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openPhoto(photo);
                }}
                className="p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
                title="Просмотр"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Модальное окно для просмотра фото */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black/95 z-[9999] flex flex-col"
          onClick={() => setSelectedPhoto(null)}
        >
          {/* Кнопка закрытия в правом верхнем углу */}
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPhoto(null);
              }}
              className="p-3 bg-white rounded-full hover:bg-gray-200 transition-colors shadow-xl"
              aria-label="Закрыть"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Область с изображением */}
          <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
            <img
              src={selectedPhoto.file_path}
              alt={selectedPhoto.original_name}
              className="max-w-full max-h-full w-auto h-auto object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          {/* Нижняя панель с информацией, навигацией и кнопкой закрытия */}
          <div className="p-4 bg-black/50">
            {/* Информация о файле */}
            <div className="text-center text-white mb-3">
              <p className="font-medium text-sm sm:text-base">{selectedPhoto.original_name}</p>
              <p className="text-xs text-gray-300">
                {formatFileSize(selectedPhoto.file_size)}
                {photos.length > 1 && ` • ${currentIndex + 1} из ${photos.length}`}
              </p>
            </div>
            
            {/* Навигация */}
            <div className="flex items-center justify-center gap-4">
              {/* Кнопка "Предыдущее фото" */}
              {photos.length > 1 && currentIndex > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrevious();
                  }}
                  className="p-3 bg-white/90 rounded-full shadow-xl hover:bg-white transition-colors"
                  aria-label="Предыдущее фото"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              
              {/* Кнопка "Следующее фото" */}
              {photos.length > 1 && currentIndex < photos.length - 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNext();
                  }}
                  className="p-3 bg-white/90 rounded-full shadow-xl hover:bg-white transition-colors"
                  aria-label="Следующее фото"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
              
              {/* Кнопка закрытия для мобильных */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPhoto(null);
                }}
                className="sm:hidden px-6 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
