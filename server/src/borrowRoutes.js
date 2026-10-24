const express = require('express');
const router = express.Router();
const prisma = require('./db');

// 1. Borrow a Book (POST /api/borrow OR POST /api/borrow/)
router.post(['/', '/borrow'], async (req, res) => {
    try {
        const { userId, bookId, days = 14 } = req.body;

        if (!userId || !bookId) {
            return res.status(400).json({ success: false, message: 'User ID and Book ID are required' });
        }

        // Check if book exists and is available
        const book = await prisma.book.findUnique({
            where: { id: bookId }
        });

        if (!book) {
            return res.status(404).json({ success: false, message: 'Book not found' });
        }

        if (book.availableCopies <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Book is currently out of stock. You can place a reservation instead!'
            });
        }

       // Check if user exists 
        let user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    id: userId,
                    name: 'Demo Student',
                    email: `student_${userId}@library.local`,
                    password: 'demoPassword123',
                    role: 'STUDENT'
                }
            });
        }

        // Calculate due date (Fixed getDate typo)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + parseInt(days));

        // Transaction: Decrement copy count AND create borrow record
        const [updateBook, record] = await prisma.$transaction([
            prisma.book.update({
                where: { id: bookId },
                data: { availableCopies: { decrement: 1 } }
            }),
            prisma.borrowRecord.create({
                data: {
                    userId: user.id,
                    bookId,
                    dueDate,
                    status: 'BORROWED'
                },
                include: {
                    book: true,
                    user: {
                        select: { id: true, name: true, email: true }
                    }
                }
            })
        ]);

        res.status(201).json({
            success: true,
            message: 'Book borrowed successfully',
            data: record
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 2. Return a Book
router.post('/return', async (req, res) => {
    try {
        const borrowRecordId = req.body.borrowRecord || req.body.borrowId;

        if (!borrowRecordId) {
            return res.status(400).json({ success: false, message: 'Borrow record ID is required' });
        }

        const record = await prisma.borrowRecord.findUnique({
            where: { id: borrowRecordId }
        });

        if (!record) {
            return res.status(404).json({ success: false, message: 'Borrow record not found' });
        }

        if (record.status === 'RETURNED') {
            return res.status(400).json({ success: false, message: 'This book has already been returned' });
        }

        const [updateBook, updateRecord] = await prisma.$transaction([
            prisma.book.update({
                where: { id: record.bookId },
                data: { availableCopies: { increment: 1 } }
            }),
            prisma.borrowRecord.update({
                where: { id: borrowRecordId },
                data: {
                    status: 'RETURNED',
                    returnDate: new Date()
                }
            })
        ]);

        res.status(200).json({
            success: true,
            message: 'Book returned successfully',
            data: updateRecord
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 3. Get User Borrow History
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const records = await prisma.borrowRecord.findMany({
            where: { userId, status: 'BORROWED' },
            include: { book: true },
            orderBy: { borrowDate: 'desc' }
        });

        res.status(200).json({ success: true, count: records.length, data: records });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;