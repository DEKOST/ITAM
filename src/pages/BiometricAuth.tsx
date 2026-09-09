import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../api';

interface WebAuthnDevice {
  id: string;
  device_type: string;
  device_name: string;
  created_at: string;
  last_used: string | null;
}

export default function BiometricAuth() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<WebAuthnDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [deviceName, setDeviceName] = useState('');

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const data = await api.getWebAuthnDevices();
      setDevices(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const registerDevice = async () => {
    if (!deviceName.trim()) {
      alert('Введите название устройства');
      return;
    }

    setRegistering(true);
    try {
      // Начало регистрации
      const options = await api.webAuthnRegisterBegin();
      
      // Вызов WebAuthn API браузера
      const credential = await navigator.credentials.create({
        publicKey: {
          ...options,
          challenge: base64ToBuffer(options.challenge),
          user: {
            ...options.user,
            id: base64ToBuffer(options.user.id)
          },
          excludeCredentials: options.excludeCredentials?.map((cred: any) => ({
            ...cred,
            id: base64ToBuffer(cred.id)
          }))
        }
      } as any);

      if (!credential) {
        throw new Error('Регистрация отменена');
      }

      // Завершение регистрации
      const cred = credential as PublicKeyCredential;
      const attestationResponse = {
        id: cred.id,
        rawId: bufferToBase64(cred.rawId),
        type: cred.type,
        response: {
          clientDataJSON: bufferToBase64((cred.response as AuthenticatorAttestationResponse).clientDataJSON),
          attestationObject: bufferToBase64((cred.response as AuthenticatorAttestationResponse).attestationObject)
        },
        deviceName
      };

      await api.webAuthnRegisterComplete(attestationResponse);
      alert('✅ Устройство зарегистрировано');
      setDeviceName('');
      await loadDevices();
    } catch (err: any) {
      alert('❌ Ошибка: ' + err.message);
    } finally {
      setRegistering(false);
    }
  };

  const deleteDevice = async (id: string) => {
    if (!confirm('Удалить это устройство?')) return;
    try {
      await api.deleteWebAuthnDevice(id);
      await loadDevices();
    } catch (err: any) {
      alert('❌ Ошибка: ' + err.message);
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'singleDevice': return '📱';
      case 'multiDevice': return '💻';
      default: return '🔑';
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Загрузка...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Биометрическая авторизация</h2>
        <p className="text-sm text-gray-500 mt-1">Вход по отпечатку пальца, лицу или другому биометрическому методу</p>
      </div>

      {/* Регистрация нового устройства */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Регистрация нового устройства</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название устройства</label>
            <input
              type="text"
              value={deviceName}
              onChange={e => setDeviceName(e.target.value)}
              placeholder="Например: iPhone 13, MacBook Pro"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={registerDevice}
            disabled={registering}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {registering ? 'Регистрация...' : '+ Зарегистрировать устройство'}
          </button>
        </div>
      </div>

      {/* Список устройств */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700">Зарегистрированные устройства</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {devices.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <p className="text-4xl mb-3">🔐</p>
              <p>Нет зарегистрированных устройств</p>
              <p className="text-sm mt-2">Зарегистрируйте устройство для входа по биометрии</p>
            </div>
          ) : devices.map(device => (
            <div key={device.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center gap-4">
                <span className="text-3xl">{getDeviceIcon(device.device_type)}</span>
                <div>
                  <p className="font-medium text-gray-800">{device.device_name}</p>
                  <p className="text-xs text-gray-500">
                    Тип: {device.device_type} • Добавлено: {new Date(device.created_at).toLocaleDateString('ru-RU')}
                  </p>
                  {device.last_used && (
                    <p className="text-xs text-gray-400">
                      Последнее использование: {new Date(device.last_used).toLocaleString('ru-RU')}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => deleteDevice(device.id)}
                className="px-3 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
              >
                🗑️ Удалить
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Информация */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">ℹ️ Как это работает</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Зарегистрируйте устройство (смартфон, ноутбук) для входа по биометрии</li>
          <li>• После регистрации вы сможете входить по отпечатку пальца, лицу или PIN-коду</li>
          <li>• Биометрические данные хранятся только на вашем устройстве</li>
          <li>• Для входа на странице логина нажмите "Войти по биометрии"</li>
        </ul>
      </div>
    </div>
  );
}

// Утилиты для конвертации base64/base64url
function base64ToBuffer(base64: string): ArrayBuffer {
  // Конвертируем base64url в стандартный base64
  let base64Standard = base64.replace(/-/g, '+').replace(/_/g, '/');
  // Добавляем padding если нужно
  const padLength = (4 - (base64Standard.length % 4)) % 4;
  base64Standard += '='.repeat(padLength);
  
  const binaryString = atob(base64Standard);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  // Конвертируем в base64url формат
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
