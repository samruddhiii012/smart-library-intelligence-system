const axios = require('axios');
const prisma = require('../src/db');

const subjects = [
  'computer_networks',
  'operating_systems',
  'artificial_intelligence',
  'data_structures',
  'database_design',
  'software_engineering',
  'cybersecurity'
];

async function autoIngestBooks() {
  console.log('Fetching books from Open Library API...');

  for (const subject of subjects) {
    try {
      const url = `https://openlibrary.org/subjects/${subject}.json?limit=3`;
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'SmartLibraryApp/1.0 (academic-project)' }
      });

      const works = response.data.works || [];

      for (const work of works) {
        const title = work.title || 'Untitled';
        const author = work.authors && work.authors.length > 0 
          ? work.authors.map(a => a.name).join(', ') 
          : 'Standard Technical Author';
        
        const category = subject.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const shelfLocation = `Rack-${String.fromCharCode(65 + Math.floor(Math.random() * 6))}${Math.floor(Math.random() * 5) + 1}`;
        const bookId = work.key ? work.key.replace('/works/', '') : `work-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Generate clean unique 13-digit dummy ISBN if not available
        const randomDigits = Math.floor(1000000000 + Math.random() * 9000000000);
        const isbn = `978-${randomDigits}`;

        await prisma.book.upsert({
          where: { id: bookId },
          update: {},
          create: {
            id: bookId,
            title,
            author,
            category,
            isbn,
            shelfLocation,
            totalCopies: 5,
            availableCopies: 5
          }
        });

        console.log(`Ingested: "${title}" by ${author} [${category}]`);
      }
    } catch (err) {
      console.error(`Failed to ingest subject "${subject}":`, err.message);
    }
  }

  console.log('\nAll books ingested successfully into database!');
  await prisma.$disconnect();
}

autoIngestBooks();