const express = require('express');
const router = express.Router();
const prisma = require('./db');

// 1. AI Book Summary (3-Bullet Insights)
router.post('/summary', async (req, res) => {
    try {
        const { title, author, category } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        // Jar API key asel tar direct Gemini 2.5 Flash call karuya
        if (apiKey && apiKey.trim() !== '') {
            try {
                const { GoogleGenAI } = require('@google/genai');
                const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
                
                const prompt = `Give a high-impact, 3-bullet technical summary of the book "${title}" by ${author} (Category: ${category}). Each bullet must be 1 concise sentence explaining practical engineering value. Output only the 3 bullet points, without introductory text or numbered lists.`;

                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                });

                const text = response.text || '';
                const bullets = text
                    .split('\n')
                    .map(line => line.replace(/^[-*•\d.]\s*/, '').trim())
                    .filter(line => line.length > 0)
                    .slice(0, 3);

                if (bullets.length > 0) {
                    return res.status(200).json({ success: true, summary: bullets });
                }
            } catch (geminiError) {
                console.error('Gemini API Error, switching to intelligent fallback:', geminiError.message);
            }
        }

        // Intelligent Fallback (Zero breakdown guarantee)
        const fallback = [
            `Core foundational architecture and practical patterns governing ${category || 'software engineering'}.`,
            `Industry-tested heuristics and production tradeoffs formulated by ${author || 'leading engineers'}.`,
            `Essential reference manual for building reliable, maintainable modern software systems.`
        ];

        return res.status(200).json({ success: true, summary: fallback });
    } catch (error) {
        console.error('AI Route error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// 2. Semantic Natural Language Search
router.post('/semantic-search', async (req, res) => {
    try {
        const { query } = req.body;
        const allBooks = await prisma.book.findMany();

        if (!query || query.trim() === '') {
            return res.status(200).json({ success: true, books: allBooks });
        }

        const apiKey = process.env.GEMINI_API_KEY;

        if (apiKey && apiKey.trim() !== '') {
            try {
                const { GoogleGenAI } = require('@google/genai');
                const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

                const catalogMeta = allBooks.map(b => ({
                    id: b.id,
                    title: b.title,
                    category: b.category,
                    author: b.author
                }));

                const prompt = `User search query: "${query}".
Given book catalog:
${JSON.stringify(catalogMeta)}

Rank and return only a JSON array of matching book IDs that fit the intent. Output ONLY the JSON array (e.g. ["id1", "id2"]).`;

                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                });

                const raw = (response.text || '').replace(/```json|```/g, '').trim();
                const matchedIds = JSON.parse(raw);

                const matchedBooks = allBooks.filter(b => matchedIds.includes(b.id));
                if (matchedBooks.length > 0) {
                    return res.status(200).json({ success: true, books: matchedBooks });
                }
            } catch (e) {
                console.log('Semantic fallback triggered:', e.message);
            }
        }

        // Fallback filter
        const q = query.toLowerCase();
        const filtered = allBooks.filter(b =>
            b.title?.toLowerCase().includes(q) ||
            b.author?.toLowerCase().includes(q) ||
            b.category?.toLowerCase().includes(q)
        );

        return res.status(200).json({ success: true, books: filtered.length > 0 ? filtered : allBooks });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;