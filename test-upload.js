const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

async function testUpload() {
    try {
        // Criar um arquivo de teste simples
        const testImagePath = path.join(__dirname, 'test-image.jpg');
        
        // Se não existir um arquivo de teste, criar um arquivo PNG fake
        if (!fs.existsSync(testImagePath)) {
            console.log('🔄 Criando arquivo de teste...');
            const fakeImage = Buffer.from([
                0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
                0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
                0x00, 0x48, 0x00, 0x00, 0xFF, 0xD9
            ]);
            fs.writeFileSync(testImagePath, fakeImage);
        }

        // Ler o arquivo
        const fileStream = fs.createReadStream(testImagePath);
        
        const form = new FormData();
        form.append('file', fileStream, { filename: 'test-image.jpg', contentType: 'image/jpeg' });

        console.log('📤 Testando upload para http://localhost:5000/api/upload');
        
        const response = await axios.post('http://localhost:5000/api/upload', form, {
            headers: form.getHeaders()
        });

        console.log('✅ Upload bem-sucedido!');
        console.log('Resposta:', response.data);

    } catch (error) {
        console.error('❌ Erro no upload:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else if (error.request) {
            console.error('Sem resposta do servidor');
            console.error('Request:', error.request);
        } else {
            console.error('Erro:', error.message);
        }
    }
}

testUpload();
