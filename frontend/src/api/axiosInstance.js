import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ============================================================
// Axios Instance — Numeo Logistics API uchun
// ============================================================
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // httpOnly cookie'larni avtomatik yuborish uchun MAJBURIY
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 sekund
});

// ============================================================
// REQUEST INTERCEPTOR — Har so'rovga Access Token qo'shish
// Token localStorage'da saqlanadi (Access Token)
// ============================================================
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================
// RESPONSE INTERCEPTOR — 401 bo'lganda avtomatik Token Rotation
// ============================================================
let isRefreshing = false; // Bir vaqtda bir marta refresh qilish uchun flag
let failedQueue = []; // Refresh kutayotgan so'rovlar navbati

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  // Muvaffaqiyatli javoblar o'zgarishsiz o'tadi
  (response) => response,

  // Xato javoblar
  async (error) => {
    const originalRequest = error.config;

    // 401 Unauthorized — Token muddati o'tgan
    // _retry flag: cheksiz loop'dan saqlash uchun
    if (error.response?.status === 401 && !originalRequest._retry) {
      // /auth/refresh va /auth/login so'rovlarida qayta urinmaymiz
      if (
        originalRequest.url?.includes('/auth/refresh') ||
        originalRequest.url?.includes('/auth/login')
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Allaqachon refresh qilinayapti — navbatga qo'shamiz
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      // Refresh jarayonini boshlaymiz
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // /auth/refresh — cookie bilan (withCredentials: true)
        const response = await api.post('/auth/refresh');
        const newAccessToken = response.data.accessToken;

        // Yangi tokenni saqlashtiramiz
        localStorage.setItem('accessToken', newAccessToken);

        // Kutayotgan so'rovlarni yangi token bilan davom ettiramiz
        processQueue(null, newAccessToken);

        // Original so'rovni yangi token bilan qayta yuboramiz
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh ham muvaffaqiyatsiz — foydalanuvchini logout qilamiz
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');

        // Login sahifasiga yo'naltiramiz
        window.location.href = '/';

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

