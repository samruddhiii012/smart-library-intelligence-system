const prisma = require('./src/db');

async function main() {
    console.log('Seeding initial books...');

    const books = [
        {
            title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
            author: 'Robert C. Martin',
            isbn: '978-0132350884',
            category: 'Computer Science',
            totalCopies: 5,
            availableCopies: 5,
            shelfLocation: 'Rack-A1'
        },
        {
            title: 'The Pragmatic Programmer',
            author: 'Andrew Hunt, David Thomas',
            isbn: '978-0201616224',
            category: 'Software Engineering',
            totalCopies: 3,
            availableCopies: 3,
            shelfLocation: 'Rack-A2'
        },
        {
            title: 'Designing Data-Intensive Applications',
            author: 'Martin Kleppmann',
            isbn: '978-1449373320',
            category: 'Distributed Systems',
            totalCopies: 4,
            availableCopies: 4,
            shelfLocation: 'Rack-B1'
        },
    ];

    for (const book of books) {
        await prisma.book.upsert({
            where: { isbn: book.isbn },
            update: {},
            create: book
        });
    }

    console.log('Database seeded successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
