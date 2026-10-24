const express = require('express');
const router = express.Router();
const prisma = require('./db');

// 1. Get all books
router.get('/', async (req, res) => {
  try {
    const books = await prisma.book.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, count: books.length, data: books });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Add a new book
router.post('/', async (req, res) => {
  try {
    const { title, author, isbn, category, totalCopies, shelfLocation } = req.body;

    // Basic validation
    if (!title || !author || !isbn || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title, author, isbn, and category are required'
      });
    }

    const newBook = await prisma.book.create({
      data: {
        title,
        author,
        isbn,
        category,
        totalCopies: totalCopies ? parseInt(totalCopies) : 1,
        availableCopies: totalCopies ? parseInt(totalCopies) : 1,
        shelfLocation
      }
    });

    res.status(201).json({ success: true, data: newBook });
  } catch (error) {
    // Unique ISBN check
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'A book with this ISBN already exists'
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;