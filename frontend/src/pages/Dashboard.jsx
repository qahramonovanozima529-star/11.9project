import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosInstance';
import {
  Truck,
  Package,
  Plus,
  RefreshCw,
  LogOut,
  Monitor,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  MapPin,
  Weight,
  Shield,
  Loader2,
  ChevronDown,
  X,
  Activity,
  BarChart3,
  Globe,
  Zap,
} from 'lucide-react';

// ============================================================
// STATUS BADGE COMPONENT
// ============================================================
const StatusBadge = ({ status }) => {
  const configs = {
    'Pending':    { bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    'In Transit': { bg: 'bg-blue-500/15',   text: 'text-blue-400',   border: 'border-blue-500/30' },
    'Delivered':  { bg: 'bg-green-500/15',  text: 'text-green-400',  border: 'border-green-500/30' },
    'Cancelled':  { bg: 'bg-red-500/15',    text: 'text-red-400',    border: 'border-red-500/30' },
    'On Hold':    { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
  };
  const cfg = configs[status] || configs['Pending'];
  return (
    <span className={`status-badge border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {status}
    </span>
  );
};

// ============================================================
// PRIORITY BADGE
// ============================================================
const PriorityBadge = ({ priority }) => {
  const configs = {
    'Low':    { text: 'text-numeo-textMuted', dot: 'bg-gray-500' },
    'Normal': { text: 'text-blue-400',        dot: 'bg-blue-400' },
    'High':   { text: 'text-orange-400',      dot: 'bg-orange-400' },
    'Urgent': { text: 'text-red-400',         dot: 'bg-red-400' },
  };
  const cfg = configs[priority] || configs['Normal'];
  return (
    <span className={`flex items-center gap-1.5 text-xs font-roboto italic font-semibold ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {priority}
    </span>
  );
};

// ============================================================
// STAT CARD COMPONENT
// ============================================================
const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }) => (
  <div className="numeo-card hover:border-numeo-blue/50 transition-colors duration-200 group">
    <div className="flex items-start justify-between mb-4">
      <div className={`p-2.5 rounded-lg ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      {trend && (
        <span className="text-green-400 text-xs font-roboto italic font-semibold flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          {trend}
        </span>
      )}
    </div>
    <div>
      <p className="numeo-label mb-1">{title}</p>
      <p className="numeo-heading text-2xl text-white">{value}</p>
      {subtitle && <p className="text-numeo-textDim text-xs mt-1 font-roboto">{subtitle}</p>}
    </div>
  </div>
);

// ============================================================
// MAIN DASHBOARD COMPONENT
// ============================================================
const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout, rotateToken, isDispatcher } = useAuth();

  // State'lar
  const [shipments, setShipments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState([]);
  const [isLoadingShipments, setIsLoadingShipments] = useState(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [activeTab, setActiveTab] = useState('shipments'); // 'shipments' | 'sessions'
  const [showAddForm, setShowAddForm] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isRotating, setIsRotating] = useState(false);

  // Yangi yuk formasi
  const [shipmentForm, setShipmentForm] = useState({
    origin: '',
    destination: '',
    cargoType: 'General',
    weight: '',
    priority: 'Normal',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ============================================================
  // Notification helper
  // ============================================================
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // ============================================================
  // Yuklar ro'yxatini yuklash
  // ============================================================
  const fetchShipments = useCallback(async () => {
    setIsLoadingShipments(true);
    try {
      const res = await api.get('/shipments');
      setShipments(res.data.data || []);
      setStats(res.data.stats || []);
    } catch (err) {
      showNotification('Yuklar ro\'yxatini yuklashda xato.', 'error');
    } finally {
      setIsLoadingShipments(false);
    }
  }, []);

  // ============================================================
  // Sessiyalar ro'yxatini yuklash
  // ============================================================
  const fetchSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const res = await api.get('/auth/sessions');
      setSessions(res.data.sessions || []);
    } catch (err) {
      showNotification('Sessiyalarni yuklashda xato.', 'error');
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    fetchShipments();
    fetchSessions();
  }, [fetchShipments, fetchSessions]);

  // ============================================================
  // Yangi yuk qo'shish
  // ============================================================
  const handleAddShipment = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/shipments', shipmentForm);
      showNotification('Yuk muvaffaqiyatli qo\'shildi!', 'success');
      setShowAddForm(false);
      setShipmentForm({
        origin: '',
        destination: '',
        cargoType: 'General',
        weight: '',
        priority: 'Normal',
        notes: '',
      });
      fetchShipments();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Yuk qo\'shishda xato.';
      showNotification(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================
  // Qurilmani chiqarib yuborish (Revoke Session)
  // ============================================================
  const handleRevokeSession = async (sessionId, deviceName) => {
    if (!window.confirm(`"${deviceName}" qurilmasini chiqarib yuborishni tasdiqlaysizmi?`)) return;

    try {
      await api.delete(`/auth/sessions/${sessionId}`);
      showNotification(`"${deviceName}" qurilmasi chiqarib yuborildi.`, 'success');
      fetchSessions();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Xato yuz berdi.';
      showNotification(msg, 'error');
    }
  };

  // ============================================================
  // Token Rotation (manual test)
  // ============================================================
  const handleRotateToken = async () => {
    setIsRotating(true);
    try {
      await rotateToken();
      showNotification('Token muvaffaqiyatli yangilandi! (Rotation)', 'success');
      fetchSessions(); // Sessiyalar yangilanadi
    } catch (err) {
      showNotification('Token yangilashda xato.', 'error');
    } finally {
      setIsRotating(false);
    }
  };

  // ============================================================
  // Logout
  // ============================================================
  const handleLogout = async () => {
    if (!window.confirm('Tizimdan chiqishni tasdiqlaysizmi?')) return;
    await logout();
    navigate('/');
  };

  // ============================================================
  // Dashboard statistikasi
  // ============================================================
  const totalShipments = shipments.length;
  const activeShipments = shipments.filter((s) => s.status === 'In Transit').length;
  const deliveredShipments = shipments.filter((s) => s.status === 'Delivered').length;
  const pendingShipments = shipments.filter((s) => s.status === 'Pending').length;
  const activeSessions = sessions.filter((s) => !s.revokedAt).length;

  return (
    <div className="min-h-screen bg-numeo-bg font-roboto">
      {/* ========== NOTIFICATION ========== */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl
                      border shadow-lg animate-slide-up max-w-sm ${
            notification.type === 'success'
              ? 'bg-green-500/15 border-green-500/30 text-green-400'
              : 'bg-red-500/15 border-red-500/30 text-red-400'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <p className="text-sm font-roboto italic">{notification.message}</p>
          <button onClick={() => setNotification(null)} className="ml-2 opacity-70 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========== HEADER / NAVBAR ========== */}
      <header className="border-b border-numeo-border bg-numeo-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-blue flex items-center justify-center shadow-numeo">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="numeo-heading text-lg text-white leading-none">NUMEO</h1>
              <p className="text-numeo-textDim text-[10px] italic font-roboto">AI Freight Dispatch</p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-numeo-bg rounded-lg p-1 border border-numeo-border">
            <button
              onClick={() => setActiveTab('shipments')}
              className={`px-4 py-2 rounded-md text-sm numeo-btn transition-all ${
                activeTab === 'shipments'
                  ? 'bg-gradient-blue text-white shadow-sm'
                  : 'text-numeo-textMuted hover:text-white'
              }`}
            >
              <Package className="w-4 h-4 inline mr-1.5" />
              Yuklar
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-4 py-2 rounded-md text-sm numeo-btn transition-all ${
                activeTab === 'sessions'
                  ? 'bg-gradient-blue text-white shadow-sm'
                  : 'text-numeo-textMuted hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4 inline mr-1.5" />
              Sessiyalar
              {activeSessions > 0 && (
                <span className="ml-1.5 bg-numeo-blue text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {activeSessions}
                </span>
              )}
            </button>
          </nav>

          {/* User & Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-white text-sm font-roboto italic font-semibold">{user?.name}</p>
              <p className="text-numeo-textDim text-xs capitalize font-roboto">{user?.role}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gradient-blue flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-numeo-textMuted hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
              title="Chiqish"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden flex border-t border-numeo-border">
          <button
            onClick={() => setActiveTab('shipments')}
            className={`flex-1 py-2.5 text-sm numeo-btn flex items-center justify-center gap-1.5 ${
              activeTab === 'shipments' ? 'text-numeo-blueLight border-b-2 border-numeo-blue' : 'text-numeo-textMuted'
            }`}
          >
            <Package className="w-4 h-4" /> Yuklar
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`flex-1 py-2.5 text-sm numeo-btn flex items-center justify-center gap-1.5 ${
              activeTab === 'sessions' ? 'text-numeo-blueLight border-b-2 border-numeo-blue' : 'text-numeo-textMuted'
            }`}
          >
            <Shield className="w-4 h-4" /> Sessiyalar
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* ========== STATS CARDS ========== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Jami Yuklar"
            value={totalShipments}
            subtitle="Barcha yetkazishlar"
            icon={Package}
            color="bg-numeo-blue"
            trend="+12%"
          />
          <StatCard
            title="Yo'lda"
            value={activeShipments}
            subtitle="Aktiv tranzit"
            icon={Truck}
            color="bg-blue-600"
          />
          <StatCard
            title="Yetkazildi"
            value={deliveredShipments}
            subtitle="Muvaffaqiyatli"
            icon={CheckCircle}
            color="bg-emerald-600"
            trend="+8%"
          />
          <StatCard
            title="Aktiv Sessiyalar"
            value={activeSessions}
            subtitle="Ulangan qurilmalar"
            icon={Monitor}
            color="bg-violet-600"
          />
        </div>

        {/* ========== AI DISPATCH BANNER ========== */}
        <div className="numeo-card mb-6 relative overflow-hidden border-numeo-blue/40"
             style={{ background: 'linear-gradient(135deg, #0F131C 0%, #0A1628 50%, #0F131C 100%)' }}>
          <div className="absolute inset-0 opacity-10"
               style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #2563EB 0%, transparent 60%)' }} />
          <div className="relative flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-numeo-blueLight" />
                <span className="numeo-label text-numeo-blueLight">AI ENGINE ACTIVE</span>
              </div>
              <h2 className="numeo-heading text-xl text-white mb-1">
                AI Freight Dispatch System
              </h2>
              <p className="text-numeo-textMuted text-sm font-roboto">
                Avtomatik marshrut optimizatsiyasi va yuk taqsimlash tizimi ishlayapti
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="numeo-heading text-2xl text-numeo-blueLight">98.7%</p>
                <p className="numeo-label">Aniqlik</p>
              </div>
              <div className="text-center">
                <p className="numeo-heading text-2xl text-green-400">-23%</p>
                <p className="numeo-label">Xarajat</p>
              </div>
              <div className="text-center">
                <p className="numeo-heading text-2xl text-white">{pendingShipments}</p>
                <p className="numeo-label">Navbatda</p>
              </div>
            </div>
          </div>
        </div>

        {/* ========== SHIPMENTS TAB ========== */}
        {activeTab === 'shipments' && (
          <div className="animate-fade-in">
            {/* Table Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="numeo-heading text-xl text-white">Logistics Yuklar Jadvali</h2>
                <p className="text-numeo-textMuted text-sm font-roboto mt-0.5">
                  Jami {totalShipments} ta yuk ro'yxatda
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchShipments}
                  className="p-2.5 text-numeo-textMuted hover:text-numeo-blueLight transition-colors
                             rounded-lg border border-numeo-border hover:border-numeo-blue/50"
                  title="Yangilash"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingShipments ? 'animate-spin' : ''}`} />
                </button>
                {isDispatcher && (
                  <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-blue text-white
                               rounded-lg numeo-btn text-sm hover:opacity-90 transition-opacity shadow-numeo"
                  >
                    <Plus className="w-4 h-4" />
                    Yangi Yuk
                  </button>
                )}
              </div>
            </div>

            {/* Add Shipment Form */}
            {showAddForm && isDispatcher && (
              <div className="numeo-card mb-5 border-numeo-blue/40 animate-slide-up">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="numeo-heading text-lg text-white">Yangi Yuk Qo'shish</h3>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="text-numeo-textMuted hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleAddShipment}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="numeo-label block mb-2">
                        <MapPin className="inline w-3.5 h-3.5 mr-1" />
                        Yuklash joyi *
                      </label>
                      <input
                        type="text"
                        value={shipmentForm.origin}
                        onChange={(e) => setShipmentForm({ ...shipmentForm, origin: e.target.value })}
                        placeholder="Toshkent, O'zbekiston"
                        className="numeo-input w-full px-4 py-3 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="numeo-label block mb-2">
                        <MapPin className="inline w-3.5 h-3.5 mr-1" />
                        Yetkazish joyi *
                      </label>
                      <input
                        type="text"
                        value={shipmentForm.destination}
                        onChange={(e) => setShipmentForm({ ...shipmentForm, destination: e.target.value })}
                        placeholder="Moskva, Rossiya"
                        className="numeo-input w-full px-4 py-3 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="numeo-label block mb-2">Yuk Turi</label>
                      <select
                        value={shipmentForm.cargoType}
                        onChange={(e) => setShipmentForm({ ...shipmentForm, cargoType: e.target.value })}
                        className="numeo-input w-full px-4 py-3 text-sm"
                      >
                        {['General', 'Refrigerated', 'Hazardous', 'Oversized', 'Liquid', 'Electronics'].map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="numeo-label block mb-2">
                        <Weight className="inline w-3.5 h-3.5 mr-1" />
                        Og'irlik (kg) *
                      </label>
                      <input
                        type="number"
                        value={shipmentForm.weight}
                        onChange={(e) => setShipmentForm({ ...shipmentForm, weight: e.target.value })}
                        placeholder="1500"
                        min="0.1"
                        step="0.1"
                        className="numeo-input w-full px-4 py-3 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="numeo-label block mb-2">Ustuvorlik</label>
                      <select
                        value={shipmentForm.priority}
                        onChange={(e) => setShipmentForm({ ...shipmentForm, priority: e.target.value })}
                        className="numeo-input w-full px-4 py-3 text-sm"
                      >
                        {['Low', 'Normal', 'High', 'Urgent'].map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="numeo-label block mb-2">Izoh</label>
                      <input
                        type="text"
                        value={shipmentForm.notes}
                        onChange={(e) => setShipmentForm({ ...shipmentForm, notes: e.target.value })}
                        placeholder="Qo'shimcha ma'lumot..."
                        className="numeo-input w-full px-4 py-3 text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-5 py-2.5 text-numeo-textMuted border border-numeo-border rounded-lg
                                 text-sm numeo-btn hover:text-white hover:border-numeo-blue/50 transition-all"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 bg-gradient-blue text-white rounded-lg numeo-btn text-sm
                                 hover:opacity-90 transition-opacity shadow-numeo disabled:opacity-60
                                 flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Qo'shilmoqda...</>
                      ) : (
                        <><Plus className="w-4 h-4" /> Yuk Qo'shish</>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Shipments Table */}
            <div className="numeo-card overflow-hidden p-0">
              {isLoadingShipments ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-numeo-blue animate-spin" />
                </div>
              ) : shipments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-numeo-textMuted">
                  <Package className="w-12 h-12 mb-4 opacity-30" />
                  <p className="numeo-heading text-lg">Yuklar topilmadi</p>
                  <p className="text-sm mt-1 font-roboto">Birinchi yukni qo'shing</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-numeo-border">
                        <th className="px-5 py-4 text-left numeo-label">Tracking</th>
                        <th className="px-5 py-4 text-left numeo-label">Marshut</th>
                        <th className="px-5 py-4 text-left numeo-label">Yuk Turi</th>
                        <th className="px-5 py-4 text-left numeo-label">Og'irlik</th>
                        <th className="px-5 py-4 text-left numeo-label">Ustuvorlik</th>
                        <th className="px-5 py-4 text-left numeo-label">Status</th>
                        <th className="px-5 py-4 text-left numeo-label">Dispatcher</th>
                        <th className="px-5 py-4 text-left numeo-label">Sana</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-numeo-border">
                      {shipments.map((shipment) => (
                        <tr key={shipment._id} className="table-row-hover">
                          <td className="px-5 py-4">
                            <span className="text-numeo-blueLight text-xs font-roboto italic font-semibold font-mono">
                              {shipment.trackingNumber}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <div>
                                <p className="text-white text-sm font-roboto font-medium">{shipment.origin}</p>
                                <div className="flex items-center gap-1 text-numeo-textDim text-xs">
                                  <span>→</span>
                                  <span className="font-roboto">{shipment.destination}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-numeo-textMuted text-sm font-roboto">
                              {shipment.cargoType}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-white text-sm font-roboto italic font-semibold">
                              {shipment.weight?.toLocaleString()} kg
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <PriorityBadge priority={shipment.priority} />
                          </td>
                          <td className="px-5 py-4">
                            <StatusBadge status={shipment.status} />
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-numeo-textMuted text-xs font-roboto">
                              {shipment.createdBy?.name || '—'}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-numeo-textDim text-xs font-roboto">
                              {new Date(shipment.createdAt).toLocaleDateString('uz-UZ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========== SESSIONS TAB ========== */}
        {activeTab === 'sessions' && (
          <div className="animate-fade-in">
            {/* Sessions Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="numeo-heading text-xl text-white">Aktiv Qurilmalar va Sessiyalar</h2>
                <p className="text-numeo-textMuted text-sm font-roboto mt-0.5">
                  {activeSessions} ta aktiv qurilma ulangan
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Token Rotation Test Button */}
                <button
                  onClick={handleRotateToken}
                  disabled={isRotating}
                  className="flex items-center gap-2 px-4 py-2.5 bg-numeo-cardLight text-numeo-blueLight
                             border border-numeo-blue/40 rounded-lg numeo-btn text-sm
                             hover:bg-numeo-blue/20 transition-all disabled:opacity-60"
                  title="Refresh Token'ni yangilash (Token Rotation)"
                >
                  <RefreshCw className={`w-4 h-4 ${isRotating ? 'animate-spin' : ''}`} />
                  Rotate Token
                </button>
                <button
                  onClick={fetchSessions}
                  className="p-2.5 text-numeo-textMuted hover:text-numeo-blueLight transition-colors
                             rounded-lg border border-numeo-border hover:border-numeo-blue/50"
                  title="Yangilash"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingSessions ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Token Info Banner */}
            <div className="numeo-card mb-5 border-violet-500/30"
                 style={{ background: 'linear-gradient(135deg, #0F131C 0%, #12102A 100%)' }}>
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-violet-600/20 rounded-lg mt-0.5">
                  <Shield className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h3 className="numeo-heading text-base text-white mb-1">Multi-Device Session Security</h3>
                  <p className="text-numeo-textMuted text-sm font-roboto">
                    Har bir qurilma uchun alohida Refresh Token yaratiladi. Token Rotation — har
                    yangilanishda eski token avtomatik bekor qilinib, yangi token yaratiladi.
                    Refresh Token SHA-256 bilan hash qilinib saqlanadi.
                  </p>
                  <div className="flex items-center gap-4 mt-3 flex-wrap">
                    <span className="text-xs font-roboto italic text-green-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      Access Token: 15 daqiqa
                    </span>
                    <span className="text-xs font-roboto italic text-blue-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      Refresh Token: 7 kun (httpOnly Cookie)
                    </span>
                    <span className="text-xs font-roboto italic text-violet-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-violet-400" />
                      Hash: SHA-256 (xavfsiz saqlash)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sessions List */}
            {isLoadingSessions ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-numeo-blue animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="numeo-card flex flex-col items-center justify-center py-20 text-numeo-textMuted">
                <Monitor className="w-12 h-12 mb-4 opacity-30" />
                <p className="numeo-heading text-lg">Sessiya topilmadi</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => {
                  const isActive = !session.revokedAt;
                  const isExpired = new Date(session.expiresAt) < new Date();
                  const statusLabel = session.revokedAt
                    ? 'Revoked'
                    : isExpired
                    ? 'Expired'
                    : 'Active';

                  return (
                    <div
                      key={session._id}
                      className={`numeo-card transition-all duration-200 ${
                        isActive && !isExpired
                          ? 'border-numeo-blue/30 hover:border-numeo-blue/60'
                          : 'opacity-60 border-numeo-border'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Device Info */}
                        <div className="flex items-start gap-4">
                          <div
                            className={`p-3 rounded-xl mt-0.5 ${
                              isActive && !isExpired
                                ? 'bg-numeo-blue/20'
                                : 'bg-numeo-border/50'
                            }`}
                          >
                            <Monitor
                              className={`w-5 h-5 ${
                                isActive && !isExpired ? 'text-numeo-blueLight' : 'text-numeo-textDim'
                              }`}
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2.5 flex-wrap mb-1">
                              <span className="numeo-heading text-base text-white">
                                {session.deviceName}
                              </span>
                              {/* Status badge */}
                              <span
                                className={`status-badge border ${
                                  statusLabel === 'Active'
                                    ? 'bg-green-500/15 text-green-400 border-green-500/30'
                                    : statusLabel === 'Expired'
                                    ? 'bg-orange-500/15 text-orange-400 border-orange-500/30'
                                    : 'bg-red-500/15 text-red-400 border-red-500/30'
                                }`}
                              >
                                {statusLabel === 'Active' && (
                                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 mr-1 animate-pulse" />
                                )}
                                {statusLabel}
                              </span>
                            </div>

                            <div className="flex items-center gap-4 flex-wrap text-xs text-numeo-textDim font-roboto">
                              <span className="flex items-center gap-1.5">
                                <Globe className="w-3 h-3" />
                                IP: {session.ip || 'Noma\'lum'}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3 h-3" />
                                Yaratildi: {new Date(session.createdAt).toLocaleString('uz-UZ')}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Activity className="w-3 h-3" />
                                Tugaydi: {new Date(session.expiresAt).toLocaleString('uz-UZ')}
                              </span>
                              {session.revokedAt && (
                                <span className="flex items-center gap-1.5 text-red-400">
                                  <XCircle className="w-3 h-3" />
                                  Bekor qilindi: {new Date(session.revokedAt).toLocaleString('uz-UZ')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Revoke Button */}
                        {isActive && !isExpired && (
                          <button
                            onClick={() => handleRevokeSession(session._id, session.deviceName)}
                            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs
                                       text-red-400 border border-red-500/30 rounded-lg numeo-btn
                                       hover:bg-red-500/15 hover:border-red-500/60 transition-all"
                            title="Bu qurilmani chiqarib yuborish"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Revoke
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Total Count */}
            <div className="mt-4 flex items-center gap-6 text-sm font-roboto text-numeo-textMuted">
              <span>
                Jami sessiyalar: <strong className="text-white">{sessions.length}</strong>
              </span>
              <span>
                Aktiv:{' '}
                <strong className="text-green-400">
                  {sessions.filter((s) => !s.revokedAt && new Date(s.expiresAt) > new Date()).length}
                </strong>
              </span>
              <span>
                Bekor qilingan:{' '}
                <strong className="text-red-400">{sessions.filter((s) => s.revokedAt).length}</strong>
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;

