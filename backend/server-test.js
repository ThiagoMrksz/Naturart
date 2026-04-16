const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const uploadsDir = path.join(__dirname, '../frontend/public/imgs');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({ 
    dest: uploadsDir,
    fileFilter: (req, file, cb) => {
        if (['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo inválido'));
        }
    }
});

console.log('✅ Multer configurado');

// ROTA DE TESTE
app.get('/test', (req, res) => {
    res.json({ test: 'ok' });
});

// ROTA DE UPLOAD
app.post('/upload', upload.single('file'), (req, res) => {
    console.log('📤 Upload recebido!');
    console.log('Arquivo:', req.file);
    
    if (!req.file) {
        return res.status(400).json({ error: 'Sem arquivo' });
    }
    
    res.json({ 
        success: true, 
        filename: req.file.filename,
        url: `/imgs/${req.file.filename}`
    });
});

// ROTA 404
app.use((req, res) => {
    console.log('❌ 404:', req.method, req.path);
    res.status(404).json({ error: 'Rota não encontrada' });
});

// Erro
app.use((err, req, res, next) => {
    console.error('❌ Erro:', err.message);
    res.status(500).json({ error: err.message });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor minimalista rodando na porta ${PORT}`);
});
