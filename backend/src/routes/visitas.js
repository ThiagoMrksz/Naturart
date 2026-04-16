const express = require('express');
const router = express.Router();
const db = require('../config/db');

// POST /api/visitas - registrar nova visita
router.post('/', async (req, res) => {
    const hoje = new Date().toISOString().split('T')[0];
    
    try {
        // Verificar se já existe registro para hoje
        const [existing] = await db.execute(
            'SELECT * FROM visitas WHERE data_acesso = ?',
            [hoje]
        );
        
        if (existing.length > 0) {
            // Atualizar contador
            await db.execute(
                'UPDATE visitas SET quantidade = quantidade + 1 WHERE data_acesso = ?',
                [hoje]
            );
        } else {
            // Criar novo registro
            await db.execute(
                'INSERT INTO visitas (data_acesso, quantidade) VALUES (?, 1)',
                [hoje]
            );
        }
        
        res.status(200).json({ success: true });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao registrar visita' });
    }
});

// GET /api/visitas - obter estatísticas (proteger depois)
router.get('/stats', async (req, res) => {
    try {
        // Total de visitas
        const [total] = await db.execute(
            'SELECT SUM(quantidade) as total FROM visitas'
        );
        
        // Visitas nos últimos 7 dias
        const [ultimaSemana] = await db.execute(
            'SELECT data_acesso, quantidade FROM visitas ORDER BY data_acesso DESC LIMIT 7'
        );
        
        res.json({
            total: total[0].total || 0,
            ultimaSemana: ultimaSemana
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
});

module.exports = router;