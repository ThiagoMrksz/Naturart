const express = require('express');
const router = express.Router();
const db = require('../config/db');

// POST /api/leads - salvar novo lead
router.post('/', async (req, res) => {
    const { nome, email, telefone, mensagem } = req.body;
    
    if (!nome || !email) {
        return res.status(400).json({ error: 'Nome e email são obrigatórios' });
    }
    
    try {
        const [result] = await db.execute(
            'INSERT INTO leads (nome, email, telefone, mensagem) VALUES (?, ?, ?, ?)',
            [nome, email, telefone || null, mensagem || null]
        );
        
        res.status(201).json({ 
            success: true, 
            id: result.insertId,
            message: 'Lead salvo com sucesso!' 
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ error: 'Este email já está cadastrado' });
        } else {
            res.status(500).json({ error: 'Erro ao salvar lead' });
        }
    }
});

// GET /api/leads - listar todos (proteção por token depois)
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT * FROM leads ORDER BY data_cadastro DESC'
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar leads' });
    }
});

module.exports = router;