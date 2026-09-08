import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import * as api from '../api';

export default function Login() {
  const { login, setAuth } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Ошибка авторизации');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    if (!username) {
      setError('Сначала введите логин');
      return;
    }
    setError('');
    setBiometricLoading(true);

    try {
      // Запрашиваем опции аутентификации
      const { options, userId } = await api.webAuthnAuthBegin(username);

      // Вызов WebAuthn API браузера
      const credential = await navigator.credentials.get({
        publicKey: {
          ...options,
          challenge: base64ToBuffer(options.challenge),
          allowCredentials: options.allowCredentials?.map((cred: any) => ({
            ...cred,
            id: base64ToBuffer(cred.id)
          }))
        }
      } as any);

      if (!credential) {
        throw new Error('Аутентификация отменена');
      }

      const cred = credential as PublicKeyCredential;
      const authResponse = cred.response as AuthenticatorAssertionResponse;

      // Отправляем ответ на сервер
      const result = await api.webAuthnAuthComplete({
        id: cred.id,
        rawId: bufferToBase64(cred.rawId),
        type: cred.type,
        response: {
          clientDataJSON: bufferToBase64(authResponse.clientDataJSON),
          authenticatorData: bufferToBase64(authResponse.authenticatorData),
          signature: bufferToBase64(authResponse.signature),
          userHandle: authResponse.userHandle ? bufferToBase64(authResponse.userHandle) : null
        },
        userId
      });

      // Сохраняем токен и перенаправляем
      setAuth(result.token, result.user);
      navigate('/');
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('Аутентификация отменена пользователем');
      } else {
        setError(err.message || 'Ошибка биометрической аутентификации');
      }
    } finally {
      setBiometricLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <span className="text-3xl">🖥️</span>
          </div>
          <h1 className="text-3xl font-bold text-white">ITAM Service</h1>
          <p className="text-blue-200 mt-2">Система учёта IT оборудования</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Вход в систему</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Логин</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Введите логин"
                required
                autoFocus
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Введите пароль"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>

          {/* Биометрический вход */}
          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
              <div className="relative flex justify-center"><span className="bg-white px-3 text-sm text-gray-500">или</span></div>
            </div>
            <button
              onClick={handleBiometricLogin}
              disabled={biometricLoading || !username}
              className="mt-4 w-full px-4 py-3 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm font-medium hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {biometricLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-700"></div>
                  Ожидание биометрии...
                </>
              ) : (
                <>🔑 Войти по биометрии</>
              )}
            </button>
            {!username && (
              <p className="text-xs text-gray-400 text-center mt-2">Сначала введите логин</p>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              По умолчанию: <code className="bg-gray-100 px-1.5 py-0.5 rounded">admin</code> / <code className="bg-gray-100 px-1.5 py-0.5 rounded">admin123</code>
            </p>
            <p className="text-xs text-amber-600 text-center mt-2">
              ⚠️ Для обеспечения безопасности создайте нового пользователя с правами администратора и заблокируйте автоматически созданного администратора
            </p>
          </div>
        </div>

        <p className="text-center text-blue-200 text-sm mt-6">
          © {new Date().getFullYear()} ITAM Service. Все права защищены.
        </p>
      </div>
    </div>
  );
}

// Утилиты для конвертации base64
function base64ToBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
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
  return btoa(binary);
}
