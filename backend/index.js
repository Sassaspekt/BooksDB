const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'YourVerySecretKey123!@#';

app.use(cors({
    origin: 'https://bachynski-crud.novanautilus.net',
    credentials: true
}));
app.use(bodyParser.json());

const pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DB_HOST || '192.168.0.207',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'rootroot',
    database: process.env.DB_NAME || 'zad1'
});

// Middleware для JWT
const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized. Please login.' });
    }
    const token = authHeader.substring(7);
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        req.username = decoded.username;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

const validateBook = (book) => {
    if (!book.title  typeof book.title !== 'string'  book.title.length > 255) return 'Title is required (max 255 chars)';
    if (!book.publication_date || isNaN(Date.parse(book.publication_date))) return 'Valid date required';
    if (!book.pages  !Number.isInteger(book.pages)  book.pages <= 0) return 'Pages must be positive integer';
    if (!book.author  typeof book.author !== 'string'  book.author.length > 100) return 'Author is required (max 100 chars)';
    if (!book.rate  !Number.isInteger(book.rate)  book.rate < 1 || book.rate > 5) return 'Rate must be 1-5';
    return null;
};

// --- API КУРСА ВАЛЮТ (Задание Б) ---
app.get('/currency', async (req, res) => {
    try {
        // Запрос к Нацбанку Польши
        const response = await fetch('http://api.nbp.pl/api/exchangerates/tables/A/?format=json');
        
        if (!response.ok) {
            throw new Error('NBP API response not ok');
        }

        const data = await response.json();
        const rates = data[0].rates;

        const eur = rates.find(r => r.code === 'EUR');
        const usd = rates.find(r => r.code === 'USD');

        res.status(200).json({
            date: data[0].effectiveDate,
            eur: eur ? eur.mid : 'N/A',
            usd: usd ? usd.mid : 'N/A'
        });

    } catch (error) {
        console.error('Currency API Error:', error);
        res.status(500).json({ error: 'Failed to fetch currency rates' });
    }
});
// ------------------------------------

app.post('/register', async (req, res) => {
    const { username, password, confirmPassword } = req.body;
    if (!username  !password  !confirmPassword) return res.status(400).json({ error: 'All fields required' });
    if (password !== confirmPassword) return res.status(400).json({ error: 'Passwords do not match' });
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        pool.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (error) => {
            if (error) {
                if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Username exists' });
                return res.status(500).json({ error: 'Server error' });
            }
            res.status(201).json({ message: 'User registered' });
        });
    } catch (error) { res.status(500).json({ error: 'Server error' }); }
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Required fields missing' });
pool.query('SELECT * FROM users WHERE username = ?', [username], async (error, results) => {
        if (error || results.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
        
        const user = results[0];
        try {
            const match = await bcrypt.compare(password, user.password);
            if (!match) return res.status(401).json({ error: 'Invalid credentials' });

            const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
            res.status(200).json({ message: 'Login successful', username: user.username, token: token });
        } catch (e) { res.status(500).json({ error: 'Server error' }); }
    });
});

app.post('/logout', (req, res) => res.status(200).json({ message: 'Logout successful' }));

app.get('/check-auth', requireAuth, (req, res) => res.status(200).json({ authenticated: true, username: req.username }));

app.get('/books', requireAuth, (req, res) => {
    pool.query('SELECT * FROM books', (error, results) => {
        if (error) return res.status(500).json({ error: 'Server error' });
        res.status(200).json(results);
    });
});

app.get('/books/:id', requireAuth, (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
    pool.query('SELECT * FROM books WHERE id = ?', [id], (error, results) => {
        if (error) return res.status(500).json({ error: 'Server error' });
        if (results.length === 0) return res.status(404).json({ error: 'Not found' });
        res.status(200).json(results[0]);
    });
});

app.post('/books', requireAuth, (req, res) => {
    const book = req.body;
    const error = validateBook(book);
    if (error) return res.status(400).json({ error });
    pool.query('INSERT INTO books (title, publication_date, pages, author, rate) VALUES (?, ?, ?, ?, ?)',
        [book.title, book.publication_date, book.pages, book.author, book.rate],
        (err, result) => {
            if (err) return res.status(500).json({ error: 'Server error' });
            res.status(201).json({ id: result.insertId, ...book });
        }
    );
});

app.put('/books/:id', requireAuth, (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
    const book = req.body;
    const error = validateBook(book);
    if (error) return res.status(400).json({ error });
    
    pool.query('UPDATE books SET title = ?, publication_date = ?, pages = ?, author = ?, rate = ? WHERE id = ?',
        [book.title, book.publication_date, book.pages, book.author, book.rate, id],
        (err, result) => {
            if (err) return res.status(500).json({ error: 'Server error' });
            if (result.affectedRows === 0) return res.status(404).json({ error: 'Book not found' });
            res.status(200).json({ id, ...book });
        }
    );
});

app.delete('/books/:id', requireAuth, (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
    pool.query('DELETE FROM books WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Book not found' });
        res.status(204).send();
    });
});

app.listen(3000, () => console.log('Server running on port 3000'));