const express = require('express');
const session = require('express-session');
const Redis = require('ioredis');
const RedisStore = require('connect-redis').default;
const cors = require('cors');
// const https = require('https');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const myAssetPlanerRoutes = require('./src/routes/myAssetPlanerRoutes');
const registerRoutes = require('./src/routes/RegisterRoutes');
const myPagePasswordRoutes = require('./src/routes/myPagePasswordRoutes');
const myPageRoutes = require('./src/routes/myPageRoutes');
const path = require('path');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const pool = require('./src/config/database');
const authRoutes = require('./src/routes/authRoutes');
const stockChart = require("./src/routes/stockChartRoutes");
const HouseHold = require('./src/routes/HouseHoldRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const chatbot = require('./src/routes/chatbotRoutes');
const newscheck = require('./src/routes/newsCheckRoutes');
const stockPredictRoutes = require('./src/routes/stockPredictRoutes')

dotenv.config();

const app = express();

// Redis 클라이언트 설정
const redisClient = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});

// Redis 연결 확인
redisClient.on('connect', () => {
  console.log('Redis 클라이언트가 연결되었습니다.');
});

redisClient.on('error', (err) => {
  console.error('Redis 클라이언트 연결 오류:', err);
});

// CORS 설정
app.use(cors({
  origin: 'http://43.201.52.123:3000',  // 클라이언트의 도메인으로 설정
  credentials: true,  // 쿠키를 클라이언트로 전달할 수 있도록 설정
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 세션 저장소 설정
app.use(session({
  store: new RedisStore({ client: redisClient }), // Redis를 세션 저장소로 사용
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: parseInt(process.env.SESSION_TIMEOUT, 10) || 3600000, // 기본값: 1시간
    httpOnly: true,
    // secure: process.env.NODE_ENV === 'production', // https 에서만 쿠키 전송 설정
    secure: false,  // HTTP에서만 쿠키를 전송하도록 설정, 개발 환경에서는 false
    sameSite: 'Lax'
  },
}));

// 세션 생성 시 로깅 (디버깅 용도로만 사용)
app.use((req, res, next) => {
  if (req.session && req.session.id) {  // 세션이 존재하는 경우에만 로그 출력
    console.log(`세션 체크: ${req.session.id}`);
    console.log(`세션 내용: ${JSON.stringify(req.session)}`);
  } else {
    console.log('세션 없음');
  }
  next();
});

// 라우트 설정
app.use('/api/my-asset-planer', myAssetPlanerRoutes);
app.use('/api/register', registerRoutes);
app.use('/api/myPagePassword', myPagePasswordRoutes);
app.use('/api/mypage', myPageRoutes);
app.use('/api/stock-chart', stockChart);
app.use('/api/auth', authRoutes);
app.use('/api/household', HouseHold);
app.use('/api/admin', adminRoutes);
app.use('/api/chat-bot', chatbot);
app.use('/api/news-check', newscheck);
app.use('/api/stock-predict', stockPredictRoutes);

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: '서버 오류가 발생했습니다.' });
});

// 서버 포트 설정 
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});