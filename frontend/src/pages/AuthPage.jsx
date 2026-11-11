import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Truck,
  Mail,
  Lock,
  User,
  Monitor,
  ChevronRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';

// Qurilma nomlari ro'yxati
const DEVICE_NAMES = [
  'Chrome-PC',
  'Firefox-PC',
  'Edge-PC',
  'Safari-MacBook',
  'Chrome-Android',
  'Safari-iPhone',
  'Samsung-Browser',
  'Opera-PC',
  'Custom...',
];

const AuthPage = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  // Mode: 'login' yoki 'register'
  const [mode, setMode] = useState('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Forma ma'lumotlari
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'dispatcher',
    deviceName: 'Chrome-PC',
    customDevice: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const getDeviceName = () => {
    return form.deviceName === 'Custom...' ? form.customDevice : form.deviceName;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const deviceName = getDeviceName() || 'Unknown Device';

      if (mode === 'register') {
        if (!form.name.trim()) {
          setError('Ism majburiy.');
          setIsLoading(false);
          return;
        }
        if (form.password.length < 6) {
          setError('Parol kamida 6 ta belgi bo\'lishi kerak.');
          setIsLoading(false);
          return;
        }
        await register(form.name, form.email, form.password, form.role, deviceName);
        setSuccess('Ro\'yxatdan o\'tildi! Dashboard ga o\'tilmoqda...');
        setTimeout(() => navigate('/dashboard'), 800);
      } else {
        await login(form.email, form.password, deviceName);
        setSuccess('Tizimga kirildi! Dashboard ga o\'tilmoqda...');
        setTimeout(() => navigate('/dashboard'), 800);
      }
    } catch (err) {
      const message =
        err?.response?.data?.message || 'Xato yuz berdi. Qayta urinib ko\'ring.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-numeo-bg flex items-center justify-center p-4 font-roboto">
      {/* Background pattern */}
      <div
        className="fixed inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, #2563EB 0%, transparent 50%),
                           radial-gradient(circle at 80% 20%, #3B82F6 0%, transparent 40%)`,
        }}
      />

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        {/* Logo & Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-blue mb-4 shadow-numeo">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <h1 className="numeo-heading text-3xl text-white mb-1">
            NUMEO
          </h1>
          <p className="text-numeo-textMuted text-sm italic font-roboto">
            AI Freight Dispatch Platform
          </p>
        </div>

        {/* Auth Card */}
        <div className="numeo-card shadow-numeo">
          {/* Tabs */}
          <div className="flex rounded-lg bg-numeo-bg p-1 mb-8 border border-numeo-border">
            <button
              onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
              className={`flex-1 py-2.5 rounded-md text-sm numeo-btn transition-all duration-200 ${
                mode === 'login'
                  ? 'bg-gradient-blue text-white shadow-sm'
                  : 'text-numeo-textMuted hover:text-white'
              }`}
            >
              Kirish
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
              className={`flex-1 py-2.5 rounded-md text-sm numeo-btn transition-all duration-200 ${
                mode === 'register'
                  ? 'bg-gradient-blue text-white shadow-sm'
                  : 'text-numeo-textMuted hover:text-white'
              }`}
            >
              Ro'yxatdan o'tish
            </button>
          </div>

          {/* Error / Success */}
          {error && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-lg p-3.5 mb-5 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-red-400 text-sm font-roboto">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-lg p-3.5 mb-5 animate-fade-in">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              <p className="text-green-400 text-sm font-roboto italic">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name — faqat register uchun */}
            {mode === 'register' && (
              <div className="animate-fade-in">
                <label className="numeo-label block mb-2">To'liq ism</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-numeo-textDim" />
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Ali Valiyev"
                    className="numeo-input w-full pl-10 pr-4 py-3 text-sm"
                    required={mode === 'register'}
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="numeo-label block mb-2">Email manzil</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-numeo-textDim" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="ali@numeo.uz"
                  className="numeo-input w-full pl-10 pr-4 py-3 text-sm"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="numeo-label block mb-2">Parol</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-numeo-textDim" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="numeo-input w-full pl-10 pr-11 py-3 text-sm"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-numeo-textDim hover:text-numeo-blueLight transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Role — faqat register uchun */}
            {mode === 'register' && (
              <div className="animate-fade-in">
                <label className="numeo-label block mb-2">Rol</label>
                <div className="relative">
                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className="numeo-input w-full px-4 py-3 text-sm appearance-none cursor-pointer"
                  >
                    <option value="dispatcher">🚛 Dispatcher</option>
                    <option value="carrier">📦 Carrier</option>
                    <option value="admin">⚙️ Admin</option>
                  </select>
                  <ChevronRight className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-numeo-textDim rotate-90 pointer-events-none" />
                </div>
                <p className="text-numeo-textDim text-xs mt-1.5 font-roboto">
                  Dispatcher/Admin yangi yuk qo'sha oladi. Carrier faqat ko'ra oladi.
                </p>
              </div>
            )}

            {/* Device Name */}
            <div>
              <label className="numeo-label block mb-2">
                <Monitor className="inline w-3.5 h-3.5 mr-1" />
                Qurilma nomi
              </label>
              <div className="relative">
                <select
                  name="deviceName"
                  value={form.deviceName}
                  onChange={handleChange}
                  className="numeo-input w-full px-4 py-3 text-sm appearance-none cursor-pointer"
                >
                  {DEVICE_NAMES.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <ChevronRight className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-numeo-textDim rotate-90 pointer-events-none" />
              </div>

              {form.deviceName === 'Custom...' && (
                <input
                  type="text"
                  name="customDevice"
                  value={form.customDevice}
                  onChange={handleChange}
                  placeholder="Qurilma nomini kiriting (masalan: Work-Laptop)"
                  className="numeo-input w-full px-4 py-3 text-sm mt-2"
                />
              )}

              <p className="text-numeo-textDim text-xs mt-1.5 font-roboto italic">
                Multi-device sessiya boshqaruvi uchun kerak
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-blue text-white rounded-lg numeo-btn text-sm
                         hover:opacity-90 active:scale-[0.98] transition-all duration-200
                         shadow-numeo disabled:opacity-60 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{mode === 'login' ? 'Kirilmoqda...' : 'Ro\'yxatdan o\'tilmoqda...'}</span>
                </>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Tizimga Kirish' : 'Ro\'yxatdan O\'tish'}</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch mode */}
          <p className="text-center text-numeo-textMuted text-sm mt-6 font-roboto">
            {mode === 'login' ? (
              <>
                Hisob yo'qmi?{' '}
                <button
                  onClick={() => { setMode('register'); setError(''); }}
                  className="text-numeo-blueLight hover:text-white transition-colors italic font-medium"
                >
                  Ro'yxatdan o'ting
                </button>
              </>
            ) : (
              <>
                Allaqachon hisobingiz bormi?{' '}
                <button
                  onClick={() => { setMode('login'); setError(''); }}
                  className="text-numeo-blueLight hover:text-white transition-colors italic font-medium"
                >
                  Kirish
                </button>
              </>
            )}
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-numeo-textDim text-xs mt-6 italic font-roboto">
          © 2026 Numeo Logistics Platform. Barcha huquqlar himoyalangan.
        </p>
      </div>
    </div>
  );
};

export default AuthPage;

