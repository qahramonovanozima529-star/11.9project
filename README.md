# 🚛 Numeo Logistics Platform

**Numeo** uslubidagi zamonaviy logistika platformasi — Node.js/Express/MongoDB backend va React.js/Tailwind CSS frontend.

---

## 📁 Loyiha Tuzilishi

```
11.9project/
├── backend/                    # Node.js + Express + MongoDB
│   ├── .env                    # Muhit o'zgaruvchilari
│   ├── package.json
│   └── src/
│       ├── config/db.js        # MongoDB ulanishi
│       ├── models/
│       │   ├── User.js         # Foydalanuvchi modeli
│       │   ├── RefreshSession.js # Multi-device sessiyalar
│       │   └── Shipment.js     # Logistika yuklari
│       ├── utils/tokenUtils.js # JWT + SHA-256 hash + Cookie
│       ├── middlewares/
│       │   ├── authMiddleware.js  # Bearer Token tekshiruvi
│       │   └── roleMiddleware.js  # RBAC (Role-Based Access)
│       ├── controllers/
│       │   ├── authController.js  # Auth CRUD
│       │   └── shipmentController.js
│       ├── routes/
│       │   ├── authRoutes.js
│       │   └── shipmentRoutes.js
│       └── server.js
│
└── frontend/                   # React.js + Vite + Tailwind
    ├── .env
    ├── tailwind.config.js
    └── src/
        ├── api/axiosInstance.js   # Axios + 401 Interceptor
        ├── context/AuthContext.jsx
        ├── pages/
        │   ├── AuthPage.jsx       # Login & Register
        │   └── Dashboard.jsx      # Logistics Dashboard
        └── App.jsx
```

---

## 🚀 Ishga Tushurish

### Talablar
- Node.js v18+
- MongoDB (lokal yoki Atlas)
- npm

### 1. Backend

```bash
cd backend
npm install
npm run dev
# Server: http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# App: http://localhost:5173
```

---

## 🔐 Xavfsizlik Arxitekturasi

### Token Flow
```
1. Register/Login
   → Access Token (15m) — JSON javobda
   → Refresh Token (7d) — httpOnly Cookie
   → RefreshSession — MongoDB (SHA-256 hash bilan)

2. API So'rovlar
   → Authorization: Bearer <accessToken>

3. Token Yangilash (Rotation)
   → Cookie'dan refresh token o'qiladi
   → SHA-256 bilan hash qilinadi
   → Bazadan mos sessiya qidiriladi
   → Eski sessiya revokedAt = now() bilan yopiladi
   → Yangi refresh token + yangi sessiya yaratiladi
   → Yangi access token JSON'da qaytariladi

4. Auto-Refresh (Frontend)
   → 401 kelganda interceptor avtomatik /auth/refresh qiladi
   → Muvaffaqiyatli bo'lsa original so'rov qayta yuboriladi
   → Muvaffaqiyatsiz bo'lsa logout + login sahifasiga
```

### Xavfsizlik Qatlamlari
| Himoya | Texnologiya |
|--------|-------------|
| Parol | bcrypt (salt: 12) |
| Access Token | JWT (HS256, 15m) |
| Refresh Token | Crypto random (64 bayt) |
| Token Saqlash | SHA-256 hash (bazada plain yo'q!) |
| Cookie | httpOnly, sameSite=lax |
| Multi-device | Har qurilmaga alohida sessiya |
| CORS | credentials:true, origin whitelist |
| Authorization | Role-based (RBAC) |

---

## 📡 API Endpointlar

### Auth Routes (`/auth`)

| Method | URL | Himoya | Tavsif |
|--------|-----|--------|--------|
| POST | `/auth/register` | Yo'q | Ro'yxatdan o'tish + Avto-Login |
| POST | `/auth/login` | Yo'q | Tizimga kirish |
| POST | `/auth/refresh` | Cookie | Token Rotation |
| POST | `/auth/logout` | Cookie | Chiqish |
| GET | `/auth/me` | Bearer | Joriy user profili |
| GET | `/auth/sessions` | Bearer | Barcha sessiyalar |
| DELETE | `/auth/sessions/:id` | Bearer | Qurilmani chiqarib yuborish |

### Shipment Routes (`/shipments`)

| Method | URL | Himoya | Tavsif |
|--------|-----|--------|--------|
| GET | `/shipments` | Bearer (all) | Yuklar ro'yxati |
| GET | `/shipments/:id` | Bearer (all) | Bitta yuk |
| POST | `/shipments` | Bearer (dispatcher/admin) | Yangi yuk |
| PATCH | `/shipments/:id/status` | Bearer (dispatcher/admin) | Status o'zgartirish |

---

## 👤 Foydalanuvchi Rollari

| Rol | Yuklar ko'rish | Yuk qo'shish | Admin |
|-----|---------------|--------------|-------|
| `carrier` | ✅ | ❌ | ❌ |
| `dispatcher` | ✅ | ✅ | ❌ |
| `admin` | ✅ | ✅ | ✅ |

---

## 🎨 Dizayn (Numeo Style)

- **Fon**: `#07090E` (chuqur qora)
- **Kartochkalar**: `#0F131C` (to'q kulrang)
- **Accent**: `#2563EB` / `#3B82F6` (ko'k)
- **Matn**: `#FFFFFF` (oq)
- **Shrift**: Roboto Italic

---

## 🧪 Test Foydalanuvchilari (Registrdan o'ting)

```json
// Admin
{ "name": "Super Admin", "email": "admin@numeo.uz", "password": "admin123", "role": "admin", "deviceName": "Chrome-PC" }

// Dispatcher  
{ "name": "Ali Dispatcher", "email": "dispatcher@numeo.uz", "password": "pass123", "role": "dispatcher", "deviceName": "Firefox-PC" }

// Carrier (faqat ko'rish)
{ "name": "Bekzod Carrier", "email": "carrier@numeo.uz", "password": "pass123", "role": "carrier", "deviceName": "Mobile-Chrome" }
```

