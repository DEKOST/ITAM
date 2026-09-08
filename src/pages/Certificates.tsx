import React, { useState, useEffect } from 'react';
import * as api from '../api';

interface Certificate {
  id: string;
  name: string;
  domain: string;
  issuer: string;
  valid_from: string;
  valid_to: string;
  is_active: number;
  status: string;
  certInfo: any;
  created_at: string;
}

export default function Certificates() {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genForm, setGenForm] = useState({ domain: '', name: '', days: 365 });
  const [uploadForm, setUploadForm] = useState({ name: '', domain: '' });
  const [certFile, setCertFile] = useState<File | null>(null);
  const [keyFile, setKeyFile] = useState<File | null>(null);
  const [caFile, setCaFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  useEffect(() => { loadCerts(); }, []);

  const loadCerts = async () => {
    try {
      const data = await api.getCertificates();
      setCerts(data);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleActivate = async (id: string) => {
    try {
      await api.activateCertificate(id);
      alert('Сертификат активирован! Перезапустите сервер для применения.');
      loadCerts();
    } catch (e: any) { alert(e.message); }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await api.deactivateCertificate(id);
      alert('Сертификат деактивирован! Перезапустите сервер для применения.');
      loadCerts();
    } catch (e: any) { alert(e.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить сертификат?')) return;
    try {
      await api.deleteCertificate(id);
      loadCerts();
    } catch (e: any) { alert(e.message); }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      await api.generateSelfSigned(genForm);
      setShowGenerateForm(false);
      setGenForm({ domain: '', name: '', days: 365 });
      loadCerts();
    } catch (e: any) { alert(e.message); }
    finally { setGenerating(false); }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certFile || !keyFile) {
      alert('Загрузите сертификат и ключ');
      return;
    }

    const formData = new FormData();
    formData.append('name', uploadForm.name);
    formData.append('domain', uploadForm.domain);
    formData.append('cert', certFile);
    formData.append('key', keyFile);
    if (caFile) formData.append('ca', caFile);

    try {
      await api.uploadCertificate(formData);
      setShowUploadForm(false);
      setUploadForm({ name: '', domain: '' });
      setCertFile(null);
      setKeyFile(null);
      setCaFile(null);
      loadCerts();
    } catch (e: any) { alert(e.message); }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      valid: 'bg-green-100 text-green-700',
      expiring_soon: 'bg-yellow-100 text-yellow-700',
      expired: 'bg-red-100 text-red-700',
      file_missing: 'bg-gray-100 text-gray-700',
      error: 'bg-red-100 text-red-700',
      unknown: 'bg-gray-100 text-gray-500',
    };
    const labels: Record<string, string> = {
      valid: '✅ Действителен',
      expiring_soon: '⚠️ Истекает скоро',
      expired: '❌ Истёк',
      file_missing: '⚠️ Файл отсутствует',
      error: '❌ Ошибка',
      unknown: '⚪ Неизвестно',
    };
    return <span className={`text-xs px-2 py-1 rounded-full font-medium ${styles[status] || styles.unknown}`}>{labels[status] || status}</span>;
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Загрузка...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">SSL/TLS Сертификаты</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowGenerateForm(!showGenerateForm)} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
            ⚡ Создать самоподписанный
          </button>
          <button onClick={() => setShowUploadForm(!showUploadForm)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            📤 Загрузить сертификат
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4"><p className="text-sm text-red-600">{error}</p></div>}

      {/* Generate self-signed form */}
      {showGenerateForm && (
        <form onSubmit={handleGenerate} className="bg-purple-50 border border-purple-200 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-purple-800 mb-4">⚡ Генерация самоподписанного сертификата</h3>
          <p className="text-sm text-purple-600 mb-4">
            Создаёт самоподписанный сертификат с помощью OpenSSL. Подходит для тестирования и внутренних сетей.
            Браузер будет показывать предупреждение о безопасности.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Домен *</label>
              <input required value={genForm.domain} onChange={e => setGenForm({...genForm, domain: e.target.value})} placeholder="itam.domain.ru" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
              <input value={genForm.name} onChange={e => setGenForm({...genForm, name: e.target.value})} placeholder="ITAM SSL" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Срок (дни)</label>
              <input type="number" value={genForm.days} onChange={e => setGenForm({...genForm, days: parseInt(e.target.value) || 365})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={generating} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
              {generating ? 'Генерация...' : 'Сгенерировать'}
            </button>
            <button type="button" onClick={() => setShowGenerateForm(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Отмена</button>
          </div>
        </form>
      )}

      {/* Upload form */}
      {showUploadForm && (
        <form onSubmit={handleUpload} className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">📤 Загрузка SSL сертификата</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
              <input required value={uploadForm.name} onChange={e => setUploadForm({...uploadForm, name: e.target.value})} placeholder="My Certificate" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Домен *</label>
              <input required value={uploadForm.domain} onChange={e => setUploadForm({...uploadForm, domain: e.target.value})} placeholder="itam.domain.ru" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Сертификат (.crt/.pem) *</label>
              <input type="file" accept=".pem,.crt,.cer,.cert" onChange={e => setCertFile(e.target.files?.[0] || null)} className="w-full text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ключ (.key) *</label>
              <input type="file" accept=".key,.pem" onChange={e => setKeyFile(e.target.files?.[0] || null)} className="w-full text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CA (опционально)</label>
              <input type="file" accept=".pem,.crt,.cer,.cert" onChange={e => setCaFile(e.target.files?.[0] || null)} className="w-full text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Загрузить</button>
            <button type="button" onClick={() => setShowUploadForm(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Отмена</button>
          </div>
        </form>
      )}

      {/* Certificates list */}
      {certs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-4xl mb-3">🔒</p>
          <p className="text-gray-500">Нет сертификатов</p>
          <p className="text-sm text-gray-400 mt-1">Загрузите или создайте самоподписанный сертификат</p>
        </div>
      ) : (
        <div className="space-y-4">
          {certs.map(cert => (
            <div key={cert.id} className={`bg-white rounded-xl shadow-sm border p-5 ${cert.is_active ? 'border-green-300 bg-green-50/30' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-semibold text-gray-800">{cert.name}</h4>
                    {cert.is_active ? (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">🔒 Активен</span>
                    ) : (
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">Неактивен</span>
                    )}
                    {getStatusBadge(cert.status)}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Домен</p>
                      <p className="font-medium text-gray-800">{cert.domain}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Издатель</p>
                      <p className="font-medium text-gray-800">{cert.issuer || '—'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Действителен с</p>
                      <p className="font-medium text-gray-800">{cert.valid_from ? new Date(cert.valid_from).toLocaleDateString('ru') : '—'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Действителен до</p>
                      <p className="font-medium text-gray-800">{cert.valid_to ? new Date(cert.valid_to).toLocaleDateString('ru') : '—'}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 ml-4">
                  {!cert.is_active ? (
                    <button onClick={() => handleActivate(cert.id)} className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200">
                      ✅ Активировать
                    </button>
                  ) : (
                    <button onClick={() => handleDeactivate(cert.id)} className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-medium hover:bg-yellow-200">
                      ⏸️ Деактивировать
                    </button>
                  )}
                  <button onClick={() => handleDelete(cert.id)} disabled={!!cert.is_active} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed">
                    🗑️ Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h4 className="font-medium text-blue-800 mb-2">ℹ️ Информация</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• После активации сертификата необходимо <strong>перезапустить сервер</strong></li>
          <li>• HTTPS сервер запускается на порту <strong>3443</strong></li>
          <li>• Для домена itam.domain.ru настройте DNS-запись на IP вашего сервера</li>
          <li>• Для продакшн используйте сертификаты от Let's Encrypt или других CA</li>
        </ul>
      </div>
    </div>
  );
}
