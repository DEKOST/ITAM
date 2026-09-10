import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface Photo {
  id: string;
  equipment_id: string;
  filename: string;
  original_name: string;
  file_path: string;
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
              onClick={() => setSelectedPhoto(photo)}
            >
              <img
                src={photo.file_path}
                alt={photo.original_name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {photo.is_primary === 1 && (
              <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                Основная
              </div>
            )}

            <div className="absolute inset-0 backdrop-blur-0 group-hover:backdrop-blur-sm bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex gap-2">
                {photo.is_primary !== 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetPrimary(photo.id);
                    }}
                    className="p-2 bg-white rounded-full hover:bg-blue-50 transition-colors shadow-lg"
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
                  className="p-2 bg-white rounded-full hover:bg-red-50 transition-colors disabled:opacity-50 shadow-lg"
                  title="Удалить"
                >
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="mt-2 text-xs text-gray-500">
              <p className="truncate">{photo.original_name}</p>
              <p>{formatFileSize(photo.file_size)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Модальное окно для просмотра фото */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4 overflow-auto"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={selectedPhoto.file_path}
              alt={selectedPhoto.original_name}
              className="max-w-full max-h-full w-auto h-auto object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPhoto(null);
              }}
              className="fixed top-6 right-6 p-3 bg-white rounded-full hover:bg-gray-200 transition-colors shadow-xl z-[10000]"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="fixed bottom-6 left-6 right-6 bg-black/70 backdrop-blur-sm text-white p-4 rounded-lg shadow-xl z-[10000]" onClick={(e) => e.stopPropagation()}>
              <p className="font-medium text-lg">{selectedPhoto.original_name}</p>
              <p className="text-sm text-gray-300">{formatFileSize(selectedPhoto.file_size)}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
