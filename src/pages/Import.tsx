import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

interface ImportResult {
  success: number;
  errors: Array<{
    row: number;
    error: string;
    data: any[];
  }>;
  duplicates: Array<{
    row: number;
    reason: string;
    existingId: string;
    existingName: string;
    data: any[];
  }>;
  createdSubdivisions?: string[];
  createdUsers?: string[];
  createdEquipment?: string[];
}

export default function Import() {
  const { token } = useAuth();
  const { refreshUsers, refreshEquipment, refreshSubdivisions } = useData();
  const [importType, setImportType] = useState<'users' | 'equipment'>('users');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError('');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch(`/api/import/template/${importType}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Ошибка скачивания шаблона');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template_${importType}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Выберите файл для импорта');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/import/${importType}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка импорта');
      }

      const data = await response.json();
      setResult(data.results);

      // Обновляем данные в контексте
      if (importType === 'users') {
        await refreshUsers();
        if (data.results.createdSubdivisions && data.results.createdSubdivisions.length > 0) {
          await refreshSubdivisions();
        }
      } else {
        await refreshEquipment();
      }

      // Очищаем файл
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Импорт данных из Excel</h2>

      {/* Выбор типа импорта */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">1. Выберите тип импорта</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => { setImportType('users'); setResult(null); setError(''); }}
            className={`p-4 rounded-lg border-2 transition-all ${
              importType === 'users'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-3xl mb-2">👥</div>
            <div className="font-semibold text-gray-800">Сотрудники</div>
            <div className="text-sm text-gray-600 mt-1">Импорт сотрудников с подразделениями</div>
          </button>
          <button
            onClick={() => { setImportType('equipment'); setResult(null); setError(''); }}
            className={`p-4 rounded-lg border-2 transition-all ${
              importType === 'equipment'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-3xl mb-2">💻</div>
            <div className="font-semibold text-gray-800">Оборудование</div>
            <div className="text-sm text-gray-600 mt-1">Импорт оборудования с характеристиками</div>
          </button>
        </div>
      </div>

      {/* Скачивание шаблона */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">2. Скачайте шаблон</h3>
        <p className="text-sm text-gray-600 mb-4">
          Скачайте шаблон Excel, заполните его данными и загрузите обратно для импорта.
        </p>
        <button
          onClick={handleDownloadTemplate}
          className="px-6 py-3 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          📥 Скачать шаблон для {importType === 'users' ? 'сотрудников' : 'оборудования'}
        </button>
      </div>

      {/* Загрузка файла */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">3. Загрузите заполненный файл</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Выберите файл Excel (.xls или .xlsx)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xls,.xlsx"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {file && (
            <div className="text-sm text-gray-600">
              Выбран файл: <span className="font-medium">{file.name}</span>
            </div>
          )}
          <button
            onClick={handleImport}
            disabled={!file || loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '⏳ Импорт...' : '📤 Импортировать'}
          </button>
        </div>
      </div>

      {/* Ошибки */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-red-800 mb-2">❌ Ошибка</h3>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Результаты импорта */}
      {result && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">📊 Результаты импорта</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-3xl font-bold text-green-800">{result.success}</div>
              <div className="text-sm text-green-700">Успешно импортировано</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-3xl font-bold text-yellow-800">{result.duplicates.length}</div>
              <div className="text-sm text-yellow-700">Пропущено дубликатов</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-3xl font-bold text-red-800">{result.errors.length}</div>
              <div className="text-sm text-red-700">Ошибок</div>
            </div>
          </div>

          {/* Дубликаты */}
          {result.duplicates && result.duplicates.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                ⚠️ Пропущенные дубликаты: {result.duplicates.length}
              </h4>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 max-h-60 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-yellow-200">
                      <th className="text-left py-2 px-2 text-yellow-800">Строка</th>
                      <th className="text-left py-2 px-2 text-yellow-800">Причина</th>
                      <th className="text-left py-2 px-2 text-yellow-800">Существующая запись</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.duplicates.map((dup, idx) => (
                      <tr key={idx} className="border-b border-yellow-100">
                        <td className="py-2 px-2 text-yellow-700">{dup.row}</td>
                        <td className="py-2 px-2 text-yellow-700">{dup.reason}</td>
                        <td className="py-2 px-2 text-yellow-700 font-medium">{dup.existingName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-yellow-700 mt-2">
                💡 Эти записи уже существуют в системе и были пропущены для предотвращения дублирования.
              </p>
            </div>
          )}

          {/* Созданные подразделения */}
          {result.createdSubdivisions && result.createdSubdivisions.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                🏛️ Создано подразделений: {result.createdSubdivisions.length}
              </h4>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex flex-wrap gap-2">
                  {result.createdSubdivisions.map((sub, idx) => (
                    <span key={idx} className="px-2 py-1 bg-white border border-blue-300 rounded text-xs text-blue-700">
                      {sub}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Созданные сотрудники */}
          {result.createdUsers && result.createdUsers.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                👥 Создано сотрудников: {result.createdUsers.length}
              </h4>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                <div className="flex flex-wrap gap-2">
                  {result.createdUsers.map((user, idx) => (
                    <span key={idx} className="px-2 py-1 bg-white border border-green-300 rounded text-xs text-green-700">
                      {user}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Созданное оборудование */}
          {result.createdEquipment && result.createdEquipment.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                💻 Создано оборудования: {result.createdEquipment.length}
              </h4>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                <div className="flex flex-wrap gap-2">
                  {result.createdEquipment.map((eq, idx) => (
                    <span key={idx} className="px-2 py-1 bg-white border border-green-300 rounded text-xs text-green-700">
                      {eq}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Ошибки */}
          {result.errors.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                ❌ Ошибки импорта: {result.errors.length}
              </h4>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-60 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-red-200">
                      <th className="text-left py-2 px-2 text-red-800">Строка</th>
                      <th className="text-left py-2 px-2 text-red-800">Ошибка</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errors.map((err, idx) => (
                      <tr key={idx} className="border-b border-red-100">
                        <td className="py-2 px-2 text-red-700">{err.row}</td>
                        <td className="py-2 px-2 text-red-700">{err.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Инструкция */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">💡 Инструкция</h3>
        <ul className="text-sm text-blue-700 space-y-2">
          <li>• Скачайте шаблон Excel для выбранного типа импорта</li>
          <li>• Заполните файл данными согласно инструкции в шаблоне</li>
          <li>• Сохраните файл в формате XLS или XLSX</li>
          <li>• Загрузите файл через форму выше</li>
          <li>• При импорте сотрудников подразделения создаются автоматически, если их нет</li>
          <li>• При импорте оборудования связи с сотрудниками и помещениями устанавливаются по ФИО и названию</li>
          <li>• Максимальный размер файла: 10 MB</li>
        </ul>
      </div>
    </div>
  );
}
