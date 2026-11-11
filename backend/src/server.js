require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

// Route'larni import qilamiz
const authRoutes = require('./routes/authRoutes');
const shipmentRoutes = require('./routes/shipmentRoutes');

// ============================================================
// Express ilovasini yaratamiz
// ============================================================
const app = express();

// ============================================================
// CORS sozlamalari
// credentials: true — Cookie'larni cross-origin yuborish uchun MAJBURIY
// origin — faqat frontend URL'dan kelgan so'rovlarga ruxsat
// ============================================================
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true, // withCredentials: true bilan ishlash uchun SHART
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ============================================================
// Middleware'lar
// ============================================================
app.use(express.json()); // JSON body parsing
app.use(express.urlencoded({ extended: true })); // URL-encoded body
app.use(cookieParser()); // Cookie parsing (httpOnly cookie'larni o'qish uchun)

// ============================================================
// API Route'lari
// ============================================================
app.use('/auth', authRoutes);
app.use('/shipments', shipmentRoutes);

// ============================================================
// Health Check — Server ishlayotganini tekshirish uchun
// ============================================================
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '✅ Numeo Logistics API ishlayapti!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ============================================================
// 404 — Topilmagan route'lar uchun
// ============================================================
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route topilmadi: ${req.method} ${req.originalUrl}`,
  });
});

// ============================================================
// Global Error Handler
// ============================================================
app.use((err, req, res, next) => {
  console.error('Global xato:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Ichki server xatosi.',
  });
});

// ============================================================
// MongoDB ga ulaning va serverni ishga tushiring
// ============================================================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log('');
    console.log('🚀 ======================================= 🚀');
    console.log(`   NUMEO LOGISTICS API — Port: ${PORT}`);
    console.log(`   Muhit: ${process.env.NODE_ENV}`);
    console.log(`   MongoDB: ${process.env.MONGO_URI}`);
    console.log(`   Client: ${process.env.CLIENT_URL}`);
    console.log('🚀 ======================================= 🚀');
    console.log('');
  });
};

startServer();

module.exports = app;

