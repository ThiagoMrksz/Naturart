const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Rota de login do admin
router.post('/login', async (req, res) => {
    const { email, senha } = req.body;
    
    console.log('🔍 Login request recebido:');
    console.log('  Email:', email);
    console.log('  Senha:', senha);
    
    try {
        // Buscar usuário no banco
        const [users] = await db.execute(
            'SELECT * FROM usuarios WHERE email = ?',
            [email]
        );
        
        console.log('👤 Usuários encontrados:', users.length);
        
        if (users.length === 0) {
            console.log('❌ Nenhum usuário encontrado com este email');
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }
        
        const user = users[0];
        
        console.log('🔐 Comparando senhas...');
        console.log('  Senha digitada:', senha);
        console.log('  Hash no banco:', user.senha_hash);
        
        // Verificar senha (compare com hash)
        const senhaValida = await bcrypt.compare(senha, user.senha_hash);
        
        console.log('✅ Resultado bcrypt:', senhaValida);
        
        if (!senhaValida) {
            console.log('❌ Senha inválida');
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }
        
        console.log('✅ Autenticação bem-sucedida!');
        
        // Gerar token JWT
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );
        
        res.json({ 
            success: true, 
            token,
            message: 'Login realizado com sucesso!' 
        });
        
    } catch (error) {
        console.error('❌ Erro no login:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Middleware para verificar token (opcional)
const verificarToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Acesso negado' });
    }
    
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        res.status(400).json({ error: 'Token inválido' });
    }
};

// ===== ROTAS DO CARROSSEL =====

// GET - Listar todas as imagens do carrossel
router.get('/carousel', async (req, res) => {
    try {
        const [images] = await db.execute(
            'SELECT * FROM carousel_images ORDER BY position ASC'
        );
        res.json(images);
    } catch (error) {
        console.error('❌ Erro ao listar carrossel:', error);
        res.status(500).json({ error: 'Erro ao listar imagens' });
    }
});

// POST - Adicionar nova imagem ao carrossel
router.post('/carousel', verificarToken, async (req, res) => {
    const { image_url, alt_text } = req.body;
    
    if (!image_url) {
        return res.status(400).json({ error: 'URL da imagem obrigatória' });
    }
    
    try {
        // Pegar a maior posição existente e adicionar 1
        const [maxPos] = await db.execute(
            'SELECT MAX(position) as maxPos FROM carousel_images'
        );
        const newPosition = (maxPos[0].maxPos || -1) + 1;
        
        const [result] = await db.execute(
            'INSERT INTO carousel_images (image_url, alt_text, position) VALUES (?, ?, ?)',
            [image_url, alt_text || null, newPosition]
        );
        
        res.json({ 
            success: true, 
            id: result.insertId,
            message: 'Imagem adicionada com sucesso' 
        });
    } catch (error) {
        console.error('❌ Erro ao adicionar imagem:', error);
        res.status(500).json({ error: 'Erro ao adicionar imagem' });
    }
});

// PUT - Editar imagem do carrossel
router.put('/carousel/:id', verificarToken, async (req, res) => {
    const { id } = req.params;
    const { image_url, alt_text } = req.body;
    
    if (!image_url) {
        return res.status(400).json({ error: 'URL da imagem obrigatória' });
    }
    
    try {
        await db.execute(
            'UPDATE carousel_images SET image_url = ?, alt_text = ? WHERE id = ?',
            [image_url, alt_text || null, id]
        );
        
        res.json({ 
            success: true, 
            message: 'Imagem atualizada com sucesso' 
        });
    } catch (error) {
        console.error('❌ Erro ao atualizar imagem:', error);
        res.status(500).json({ error: 'Erro ao atualizar imagem' });
    }
});

// DELETE - Remover imagem do carrossel
router.delete('/carousel/:id', verificarToken, async (req, res) => {
    const { id } = req.params;
    
    try {
        await db.execute(
            'DELETE FROM carousel_images WHERE id = ?',
            [id]
        );
        
        res.json({ 
            success: true, 
            message: 'Imagem removida com sucesso' 
        });
    } catch (error) {
        console.error('❌ Erro ao deletar imagem:', error);
        res.status(500).json({ error: 'Erro ao deletar imagem' });
    }
});

module.exports = router;