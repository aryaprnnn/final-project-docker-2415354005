const express = require('express');
const mysql = require('mysql2');
require('dotenv').config(); 

const app = express();
app.use(express.json()); 

const dbConfig = {
    host: process.env.DB_HOST || 'mysql',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'praktikum_db',
    port: process.env.DB_PORT || 3306
};

let connection;

function handleDisconnect() {
    connection = mysql.createConnection(dbConfig);

    connection.connect((err) => {
        if (err) {
            console.error('Database belum ready, mencoba menyambung kembali dalam 3 detik...');
            
            connection.destroy(); 
            
            setTimeout(handleDisconnect, 3000); 
        } else {
            console.log('Database connected successfully!');
            createTable(); 
            
            connection.on('error', (dbErr) => {
                console.log('Database mengalami gangguan:', dbErr.message);
                if (dbErr.code === 'PROTOCOL_CONNECTION_LOST') {
                    handleDisconnect();
                }
            });
        }
    });
}

function createTable() {
    const query = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    connection.query(query, (err) => {
        if (err) console.error('Gagal membuat tabel users:', err.message);
    });
}

handleDisconnect();

app.get('/', (req, res) => { 
    res.send('Backend Final Project Docker Running!');
});

app.get('/users', (req, res) => {
    connection.query('SELECT * FROM users', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/users', (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Nama tidak boleh kosong!' });

    connection.query('INSERT INTO users (name) VALUES (?)', [name], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'User berhasil ditambahkan', id: result.insertId });
    });
});

app.put('/users/:id', (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Nama baru tidak boleh kosong!' });

    connection.query('UPDATE users SET name = ? WHERE id = ?', [name, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'User tidak ditemukan' });
        res.json({ message: 'User berhasil diupdate' });
    });
});

app.delete('/users/:id', (req, res) => {
    const { id } = req.params;

    connection.query('DELETE FROM users WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'User tidak ditemukan' });
        res.json({ message: 'User berhasil dihapus' });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});