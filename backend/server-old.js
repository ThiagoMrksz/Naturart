const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./src/config/db');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

console.log('🔧 Iniciando server.js...');

dotenv.config();
const app = express();

console.log('✅ Express app criado');
console.log('📂 upload endpoint será registrado agora:');

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Configurar multer para upload de imagens
const uploadsDir = path.join(__dirname, '../frontend/public/imgs');

// Criar pasta se não existir
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
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

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de arquivo não permitido. Use JPG, PNG, GIF ou WebP.'));
        }
    }
});

console.log('✅ Multer configurado');

// Endpoint para upload de imagens
console.log('📍 Registrando rota POST /api/upload');
app.post('/api/upload', upload.single('file'), (req, res) => {
    console.log('📤 POST /api/upload recebido');
    console.log('Arquivo:', req.file);
    
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
console.log('✅ Rota POST /api/upload registrada');

// Inicializar banco de dados
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

        // Inserir imagens padrão se a tabela estiver vazia
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

// Endpoint para listar imagens disponíveis
app.get('/api/available-images', (req, res) => {
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
        
        res.json(images);
    } catch (error) {
        console.error('❌ Erro ao listar imagens:', error);
        res.json([]);
    }
});

// Rotas
app.use('/api/leads', require('./src/routes/leads'));
app.use('/api/admin', require('./src/routes/admin'));
app.use('/api/visitas', require('./src/routes/visitas'));

// Rota de teste
app.get('/api/teste', (req, res) => {
    res.json({ message: 'API funcionando! 🚀' });
});

// Tratamento de erro para rotas não encontradas
app.use((req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
});

// Tratamento de erro global (inclui multer)
app.use((err, req, res, next) => {
    console.error('❌ Erro:', err.message);
    
    // Erro de upload/multer
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Arquivo muito grande. Máximo 10MB.' });
        }
        if (err.code === 'FILE_TOO_LARGE') {
            return res.status(400).json({ error: 'Arquivo excede o tamanho máximo.' });
        }
        return res.status(400).json({ error: `Erro no upload: ${err.message}` });
    }
    
    // Erro customizado do fileFilter
    if (err.message && err.message.includes('Tipo de arquivo')) {
        return res.status(400).json({ error: err.message });
    }
    
    // Erro genérico
    console.error(err.stack);
    res.status(500).json({ error: 'Algo deu errado no servidor!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📝 Teste: http://localhost:${PORT}/api/teste`);
});