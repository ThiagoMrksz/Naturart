const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./src/config/db');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

console.log('🔧 Iniciando servidor...');

dotenv.config();
const app = express();

// ===== MIDDLEWARES =====
app.use(cors());
app.use(express.json());

// Logger de todas as requisições
app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.path}`);
    next();
});

app.use(express.static(path.join(__dirname, '../frontend/public')));
console.log('✅ Middlewares carregados');

// ===== CONFIGURAÇÃO MULTER =====
const uploadsDir = path.join(__dirname, '../frontend/public/imgs');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('📁 Pasta de uploads criada:', uploadsDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const originalName = file.originalname.replace(/\s+/g, '-');
        const filename = `${timestamp}-${originalName}`;
        cb(null, filename);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
        console.log('✅ Arquivo aceitado:', file.originalname);
        cb(null, true);
    } else {
        console.log('❌ Arquivo rejeitado (tipo inválido):', file.mimetype);
        cb(new Error('Tipo de arquivo não permitido. Use JPG, PNG, GIF ou WebP.'));
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter
});

console.log('✅ Multer configurado');

// ===== ROTAS DE UPLOAD (ANTES DE app.use) =====
app.post('/api/upload', (req, res, next) => {
    console.log('📨 POST /api/upload');
    next();
}, upload.single('file'), (req, res, next) => {
    console.log('📤 Arquivo recebido:', req.file ? req.file.originalname : 'NENHUM');
    if (!req.file) {
        console.log('❌ Sem arquivo no request');
        return res.status(400).json({ error: 'Nenhum arquivo foi enviado' });
    }
    
    const fileUrl = `/imgs/${req.file.filename}`;
    console.log('✅ Upload bem-sucedido:', fileUrl);
    res.json({
        success: true,
        filename: req.file.filename,
        url: fileUrl,
        message: 'Imagem enviada com sucesso!'
    });
});

// ===== ROTAS DE LISTA DE IMAGENS (ANTES DE app.use) =====
app.get('/api/available-images', (req, res) => {
    console.log('📌 GET /api/available-images');
    const imgsPath = path.join(__dirname, '../frontend/public/imgs');
    
    try {
        if (!fs.existsSync(imgsPath)) {
            return res.json([]);
        }
        
        const files = fs.readdirSync(imgsPath);
        const images = files
            .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
            .map(file => ({
                name: file,
                url: `/imgs/${file}`
            }));
        
        console.log('✅ Retornando', images.length, 'imagens');
        res.json(images);
    } catch (error) {
        console.error('❌ Erro ao listar imagens:', error);
        res.json([]);
    }
});

// ===== app.use() ROTAS DEVEM VIR DEPOIS =====

// ===== INICIALIZAR BANCO DE DADOS =====
const initializeDatabase = async () => {
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS carousel_images (
                id INT AUTO_INCREMENT PRIMARY KEY,
                image_url VARCHAR(500) NOT NULL,
                alt_text VARCHAR(255) DEFAULT NULL,
                position INT NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ carousel_images table ready');

        const [rows] = await db.execute('SELECT COUNT(*) as count FROM carousel_images');
        if (rows[0].count === 0) {
            const defaultImages = [
                { image_url: '/imgs/bmarrom.jpeg', alt_text: 'Bolsa Marrom 1', position: 0 },
                { image_url: '/imgs/bmarrom1.jpeg', alt_text: 'Bolsa Marrom 2', position: 1 },
                { image_url: '/imgs/bmarrom2.jpeg', alt_text: 'Bolsa Marrom 3', position: 2 },
                { image_url: '/imgs/bmarrom3.jpeg', alt_text: 'Bolsa Marrom 4', position: 3 }
            ];

            for (const img of defaultImages) {
                await db.execute(
                    'INSERT INTO carousel_images (image_url, alt_text, position) VALUES (?, ?, ?)',
                    [img.image_url, img.alt_text, img.position]
                );
            }
            console.log('✅ Imagens padrão do carrossel inseridas');
        }
    } catch (error) {
        console.error('❌ Erro ao criar tabela carousel_images:', error);
    }
};

initializeDatabase();

// ===== ROTAS DO ADMIN =====
app.use('/api/admin', require('./src/routes/admin'));

// ===== OUTRAS ROTAS =====
app.use('/api/leads', require('./src/routes/leads'));
app.use('/api/visitas', require('./src/routes/visitas'));

// ===== ROTA DE TESTE =====
app.get('/api/teste', (req, res) => {
    res.json({ message: 'API funcionando! 🚀' });
});

// ===== TRATAMENTO DE ERRO PARA ROTAS NÃO ENCONTRADAS =====
app.use((req, res) => {
    console.log('❌ Rota não encontrada:', req.method, req.path);
    res.status(404).json({ error: 'Rota não encontrada' });
});

// ===== TRATAMENTO DE ERRO GLOBAL =====
app.use((err, req, res, next) => {
    console.error('❌ Erro global:', err.message);
    
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Arquivo muito grande. Máximo 10MB.' });
        }
        return res.status(400).json({ error: `Erro no upload: ${err.message}` });
    }
    
    if (err.message && err.message.includes('Tipo de arquivo')) {
        return res.status(400).json({ error: err.message });
    }
    
    console.error(err.stack);
    res.status(500).json({ error: 'Algo deu errado no servidor!' });
});

// ===== INICIAR SERVIDOR =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📝 Teste: http://localhost:${PORT}/api/teste`);
    console.log(`📤 Upload: http://localhost:${PORT}/api/upload`);
    console.log(`🖼️  Imagens: http://localhost:${PORT}/api/available-images`);
});
