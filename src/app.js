// src/app.js
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

const app = express();

// 1. Cấu hình Middleware
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

// 2. Health check
app.get('/health', (req, res) => res.status(200).json({ message: 'System OK' }));

export default app;