const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'zad1'
});

// Validation function
const validateBook = (book) => {
    if (!book.title || typeof book.title !== 'string' || book.title.length > 255) {
        return 'Title is required and must be a string (max 255 chars)';
    }
    if (!book.publication_date || isNaN(Date.parse(book.publication_date))) {
        return 'Valid publication date is required';
    }
    if (!book.pages || !Number.isInteger(book.pages) || book.pages <= 0) {
        return 'Pages must be a positive integer';
    }
    if (!book.author || typeof book.author !== 'string' || book.author.length > 100) {
        return 'Author is required and must be a string (max 100 chars)';
    }
    if (!book.rate || !Number.isInteger(book.rate) || book.rate < 1 || book.rate > 5) {
        return 'Rate must be an integer between 1 and 5';
    }
    return null;
};

// GET /books
app.get('/books', (req, res) => {
    pool.query('SELECT * FROM books', (error, results) => {
        if (error) {
            // Log the error for debugging, but return a generic message to the client
            console.error('Database error in GET /books:', error);
            return res.status(500).json({ error: 'Server error' });
        }
        res.status(200).json(results);
    });
});

// GET /books/:id
app.get('/books/:id', (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
    }
    pool.query('SELECT * FROM books WHERE id = ?', [id], (error, results) => {
        if (error) {
            console.error('Database error in GET /books/:id:', error);
            return res.status(500).json({ error: 'Server error' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Book not found' });
        }
        res.status(200).json(results[0]);
    });
});

// POST /books
app.post('/books', (req, res) => {
    const book = req.body;
    const error = validateBook(book);
    if (error) {
        return res.status(400).json({ error });
    }
    pool.query(
        'INSERT INTO books (title, publication_date, pages, author, rate) VALUES (?, ?, ?, ?, ?)',
        [book.title, book.publication_date, book.pages, book.author, book.rate],
        (error, result) => {
            if (error) {
                console.error('Database error in POST /books:', error);
                return res.status(500).json({ error: 'Server error' });
            }
            res.status(201).json({ id: result.insertId, ...book });
        }
    );
});

// PUT /books/:id
app.put('/books/:id', (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
    }
    const book = req.body;
    const error = validateBook(book);
    if (error) {
        return res.status(400).json({ error });
    }
    pool.query(
        'UPDATE books SET title = ?, publication_date = ?, pages = ?, author = ?, rate = ? WHERE id = ?',
        [book.title, book.publication_date, book.pages, book.author, book.rate, id],
        (error, result) => {
            if (error) {
                console.error('Database error in PUT /books/:id:', error);
                return res.status(500).json({ error: 'Server error' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Book not found' });
            }
            res.status(200).json({ id, ...book });
        }
    );
});

// DELETE /books/:id
app.delete('/books/:id', (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
    }
    pool.query('DELETE FROM books WHERE id = ?', [id], (error, result) => {
        if (error) {
            console.error('Database error in DELETE /books/:id:', error);
            return res.status(500).json({ error: 'Server error' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Book not found' });
        }
        res.status(204).send();
    });
});

app.listen(3000, () => console.log('Server running on port 3000'));