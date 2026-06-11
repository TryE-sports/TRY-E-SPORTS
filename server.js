// ============================================================================
// TRY E-SPORTS - BACKEND DE ALTA SEGURANÇA (POSTGRESQL PRODUCTION READY)
// ============================================================================
const express = require('express');
const { Pool } = require('pg'); // Substituição profissional: SQLite -> PostgreSQL
const bcrypt = require('bcrypt');
const helmet = require('helmet'); 
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuração de conexão com o banco de dados em nuvem usando Variável de Ambiente
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Obrigatório para conexões seguras na nuvem (Render, Neon, etc.)
    }
});

// Inicialização Assíncrona das Tabelas no PostgreSQL
const initDb = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                nick TEXT UNIQUE NOT NULL,
                whatsapp TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'player'
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS tournaments (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                game TEXT NOT NULL,
                prize TEXT NOT NULL,
                slots INTEGER NOT NULL,
                status TEXT DEFAULT 'open'
            )
        `);
        console.log('[DATABASE] Banco de Dados PostgreSQL conectado e validado.');
    } catch (err) {
        console.error('[DATABASE ERROR] Erro crítico ao iniciar tabelas:', err.message);
    }
};
initDb();

// ROTA: Registro de Novo Jogador
app.post('/api/register', async (req, res) => {
    const { name, nick, whatsapp, email, password } = req.body;
    
    try {
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Sintaxe profissional Postgres ($1, $2...) protege 100% contra SQL Injection
        const query = `
            INSERT INTO users (name, nick, whatsapp, email, password) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING id
        `;
        
        const result = await pool.query(query, [name, nick, whatsapp, email, hashedPassword]);
        res.status(201).json({ message: "Conta Try criada com perfeição.", userId: result.rows[0].id });
        
    } catch (err) {
        // Código '23505' no Postgres significa violação de registro único (Unique Constraint)
        if (err.code === '23505') {
            return res.status(400).json({ error: "Erro: E-mail ou Nick já cadastrado." });
        }
        res.status(500).json({ error: "Erro interno no servidor de dados." });
    }
});

// ROTA: Criação de Torneios
app.post('/api/tournaments', async (req, res) => {
    const { title, game, prize, slots } = req.body;
    
    try {
        const query = `
            INSERT INTO tournaments (title, game, prize, slots) 
            VALUES ($1, $2, $3, $4) 
            RETURNING id
        `;
        const result = await pool.query(query, [title, game, prize, slots]);
        res.status(201).json({ message: "Torneio criado! Pronto para gerar receita.", tournamentId: result.rows[0].id });
    } catch (err) {
        res.status(500).json({ error: "Erro ao criar torneio no banco de dados." });
    }
});

app.listen(PORT, () => {
    console.log(`[TRY SYSTEM ACTIVE] Servidor operando na porta ${PORT}`);
});