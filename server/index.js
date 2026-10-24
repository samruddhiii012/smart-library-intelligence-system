const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
const bookRoutes = require('./src/bookRoutes');
const borrowRoutes = require('./src/borrowRoutes');
const aiRoutes = require('./src/aiRoutes');
const authRoutes = require('./src/authRoutes');

// Mount API Endpoints BEFORE listen
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/borrow', borrowRoutes);
app.use('/api/ai', aiRoutes);

// Test route
app.get('/', (req, res) => {
    res.send('Smart Library API Backend is Live!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});