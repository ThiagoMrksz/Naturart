const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function testUpload() {
    try {
        // Criar um PNG mínimo válido (1x1 pixel transparente)
        const minimalPNG = Buffer.from([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
            0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
            0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
            0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
            0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
        ]);
        
        const filePath = path.join(__dirname, 'test-image.png');
        fs.writeFileSync(filePath, minimalPNG);
        console.log('✅ Arquivo de teste criado:', filePath);

        // Preparar FormData
        const FormData = require('form-data');
        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));

        console.log('📤 POST para http://localhost:5000/api/upload');
        console.log('Headers:', form.getHeaders());

        const response = await axios.post('http://localhost:5000/api/upload', form, {
            headers: form.getHeaders(),
            maxRedirects: 0
        });

        console.log('✅ Sucesso!');
        console.log('Status:', response.status);
        console.log('Dados:', response.data);

        // Limpar
        fs.unlinkSync(filePath);

    } catch (error) {
        console.error('❌ Erro:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Headers:', error.response.headers);
            console.error('Dados:', error.response.data);
        } else if (error.request) {
            console.error('Request foi:', error.request);
        } else {
            console.error('Erro:', error.message);
        }
    }
}

testUpload();
