import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Admin() {
  const [carouselItems, setCarouselItems] = useState([]);
  const [availableImages, setAvailableImages] = useState([]);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [logado, setLogado] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState('');
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const authHeaders = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setLogado(true);
      carregarCarousel();
      carregarImagensDisponiveis();
    }
  }, []);

  const fazerLogin = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/admin/login', { email, senha });
      localStorage.setItem('token', res.data.token);
      setLogado(true);
      setMessage('Login realizado com sucesso!');
      carregarCarousel();
      carregarImagensDisponiveis();
    } catch (error) {
      alert('Email ou senha incorretos');
    }
  };

  const carregarCarousel = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/carousel');
      setCarouselItems(res.data);
    } catch (error) {
      console.error(error);
      setMessage('Falha ao carregar itens do carrossel.');
    }
  };

  const carregarImagensDisponiveis = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/available-images');
      setAvailableImages(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleFileSelect = async (file) => {
    if (!file) return;

    console.log('📁 Arquivo selecionado:', file.name, 'Tamanho:', file.size, 'bytes', 'Tipo:', file.type);

    // Validar tipo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setMessage(`❌ Tipo de arquivo não permitido. Use JPG, PNG, GIF ou WebP. (Seu arquivo é: ${file.type})`);
      console.error('Tipo não permitido:', file.type);
      return;
    }

    // Validar tamanho (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setMessage('❌ Arquivo muito grande. Máximo 10MB.');
      console.error('Arquivo muito grande:', file.size);
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadPreview({
        dataUrl: e.target.result,
        file: file,
        name: file.name
      });
      setMessage('✅ Arquivo selecionado! Clique em "Fazer Upload" para enviar.');
    };
    reader.readAsDataURL(file);
  };

  const fazerUpload = async () => {
    if (!uploadPreview) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', uploadPreview.file);

    try {
      console.log('📤 Iniciando upload...');
      console.log('Arquivo:', uploadPreview.file.name, uploadPreview.file.size, 'bytes');
      
      const res = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('✅ Upload concluído:', res.data);
      setImageUrl(res.data.url);
      setUploadPreview(null);
      setMessage(`✅ Imagem enviada com sucesso! URL: ${res.data.url}`);
      
      // Recarregar imagens disponíveis
      setTimeout(carregarImagensDisponiveis, 500);
    } catch (error) {
      console.error('❌ Erro no upload:', error.response?.data || error.message);
      setMessage(`❌ Erro: ${error.response?.data?.error || error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const cancelarUpload = () => {
    setUploadPreview(null);
    setMessage('');
  };

  const selecionarImagem = (imageUrl) => {
    setImageUrl(imageUrl);
    setShowImageSelector(false);
    setMessage(`✅ Imagem selecionada: ${imageUrl}`);
  };

  const salvarItem = async () => {
    if (!imageUrl.trim()) {
      setMessage('Selecione ou envie uma imagem.');
      return;
    }

    try {
      if (editId) {
        await axios.put(
          `http://localhost:5000/api/admin/carousel/${editId}`,
          { image_url: imageUrl, alt_text: altText },
          authHeaders()
        );
        setMessage('✅ Imagem atualizada com sucesso.');
      } else {
        await axios.post(
          'http://localhost:5000/api/admin/carousel',
          { image_url: imageUrl, alt_text: altText },
          authHeaders()
        );
        setMessage('✅ Imagem adicionada com sucesso.');
      }

      setImageUrl('');
      setAltText('');
      setEditId(null);
      carregarCarousel();
    } catch (error) {
      console.error(error);
      setMessage('❌ Erro ao salvar a imagem.');
    }
  };

  const editarItem = (item) => {
    setEditId(item.id);
    setImageUrl(item.image_url);
    setAltText(item.alt_text || '');
    setMessage('✏️ Editando item existente.');
    setShowImageSelector(false);
    setUploadPreview(null);
  };

  const cancelarEdicao = () => {
    setEditId(null);
    setImageUrl('');
    setAltText('');
    setShowImageSelector(false);
    setUploadPreview(null);
  };

  const excluirItem = async (id) => {
    if (!window.confirm('Deseja realmente excluir esta imagem do carrossel?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/admin/carousel/${id}`, authHeaders());
      setMessage('✅ Imagem excluída com sucesso.');
      carregarCarousel();
    } catch (error) {
      console.error(error);
      setMessage('❌ Erro ao excluir a imagem.');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setLogado(false);
    setCarouselItems([]);
    setAvailableImages([]);
    setImageUrl('');
    setAltText('');
    setEditId(null);
    setMessage('Você saiu com sucesso.');
  };

  if (!logado) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <h2>Área Restrita</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: '10px', margin: '10px', width: '250px' }}
        />
        <br />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          style={{ padding: '10px', margin: '10px', width: '250px' }}
        />
        <br />
        <button onClick={fazerLogin} style={{ padding: '10px 20px', cursor: 'pointer' }}>
          Entrar
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '50px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1>Gerenciar carrossel</h1>
          <p>Adicione, edite ou exclua as imagens que aparecem no carrossel da home.</p>
        </div>
        <button onClick={logout} style={{ padding: '10px 20px', cursor: 'pointer', background: '#c06a42', color: 'white', border: 'none', borderRadius: '5px' }}>
          Sair
        </button>
      </div>

      {message && <div style={{ marginBottom: '20px', padding: '12px', background: '#e8f5e9', color: '#2e7d32', borderRadius: '5px' }}>{message}</div>}

      <div style={{ display: 'grid', gap: '15px', marginBottom: '40px', padding: '20px', background: '#f5f5f5', borderRadius: '10px' }}>
        
        {/* UPLOAD DE ARQUIVO */}
        <div>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>📤 Envie sua própria imagem:</label>
          <div
            onDragEnter={() => setDragActive(true)}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              console.log('Drop event received');
              setDragActive(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                console.log('Arquivo do drop:', e.dataTransfer.files[0].name);
                handleFileSelect(e.dataTransfer.files[0]);
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              console.log('DragOver');
            }}
            style={{
              border: dragActive ? '3px solid #c06a42' : '2px dashed #c06a42',
              borderRadius: '8px',
              padding: '30px',
              textAlign: 'center',
              background: dragActive ? '#fff5f0' : '#fff',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          >
            <input
              type="file"
              id="fileInput"
              accept="image/*"
              onChange={(e) => handleFileSelect(e.target.files[0])}
              style={{ display: 'none' }}
            />
            <label htmlFor="fileInput" style={{ cursor: 'pointer', display: 'block' }}>
              <p style={{ margin: '0 0 10px', fontSize: '1.5rem' }}>📁 Clique ou arraste uma imagem aqui</p>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>Formatos: JPG, PNG, GIF, WebP (máx 10MB)</p>
            </label>
          </div>
        </div>

        {/* PREVIEW DO UPLOAD */}
        {uploadPreview && (
          <div style={{ padding: '15px', background: '#fff', borderRadius: '5px', border: '2px solid #c06a42' }}>
            <p style={{ margin: '0 0 10px', fontWeight: 'bold' }}>📸 Pré-visualização:</p>
            <img src={uploadPreview.dataUrl} alt="Preview" style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '5px', marginBottom: '10px' }} />
            <p style={{ margin: '10px 0 0', fontSize: '0.9rem', color: '#666' }}>Arquivo: {uploadPreview.name}</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button 
                onClick={fazerUpload} 
                disabled={uploading}
                style={{ flex: 1, padding: '10px', background: '#4a3325', color: 'white', border: 'none', borderRadius: '5px', cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1 }}>
                {uploading ? '⏳ Enviando...' : '✅ Fazer Upload'}
              </button>
              <button 
                onClick={cancelarUpload}
                style={{ padding: '10px 20px', background: '#999', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                ✕ Cancelar
              </button>
            </div>
          </div>
        )}

        {/* SELEÇÃO DE IMAGENS DA GALERIA */}
        <div>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>🖼️ Ou escolha da galeria:</label>
          <button 
            onClick={() => setShowImageSelector(!showImageSelector)} 
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: '5px', 
              border: '2px solid #4a3325', 
              background: 'white',
              color: '#4a3325',
              cursor: 'pointer', 
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            {showImageSelector ? '🔼 Esconder galeria' : '🖼️ Mostrar galeria de imagens'}
          </button>

          {showImageSelector && (
            <div style={{ 
              marginTop: '15px', 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
              gap: '10px',
              padding: '15px',
              background: '#fff',
              borderRadius: '5px',
              border: '1px solid #ddd'
            }}>
              {availableImages.map((img, idx) => (
                <div 
                  key={idx}
                  onClick={() => selecionarImagem(img.url)}
                  style={{
                    cursor: 'pointer',
                    border: imageUrl === img.url ? '3px solid #c06a42' : '2px solid #ddd',
                    borderRadius: '5px',
                    overflow: 'hidden',
                    transition: 'all 0.3s',
                    opacity: imageUrl === img.url ? 1 : 0.7,
                    transform: imageUrl === img.url ? 'scale(1.05)' : 'scale(1)'
                  }}
                >
                  <img 
                    src={img.url} 
                    alt={img.name} 
                    style={{ 
                      width: '100%', 
                      height: '100px', 
                      objectFit: 'cover',
                      display: 'block'
                    }} 
                  />
                  <p style={{ 
                    margin: '5px', 
                    fontSize: '0.75rem', 
                    textAlign: 'center',
                    wordBreak: 'break-word'
                  }}>
                    {img.name}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* URL MANUALMENTE */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>🔗 Ou informe a URL manualmente:</label>
          <input
            type="text"
            placeholder="https://..."
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }}
          />
        </div>

        {/* DESCRIÇÃO */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>📝 Descrição (texto alt):</label>
          <input
            type="text"
            placeholder="Ex: Bolsa Marrom Artesanal"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }}
          />
        </div>

        {/* PRÉ-VISUALIZAÇÃO FINAL */}
        {imageUrl && (
          <div style={{ padding: '10px', background: '#fff', borderRadius: '5px', border: '2px solid #c06a42' }}>
            <p style={{ margin: '0 0 10px', fontWeight: 'bold' }}>✨ Pré-visualização final:</p>
            <img src={imageUrl} alt="Preview" style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '5px' }} />
          </div>
        )}

        {/* BOTÕES DE AÇÃO */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={salvarItem} style={{ flex: 1, padding: '12px', background: '#4a3325', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}>
            {editId ? '✏️ Atualizar imagem' : '➕ Adicionar imagem'}
          </button>
          {editId && <button onClick={cancelarEdicao} style={{ padding: '12px 20px', background: '#999', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            ✕ Cancelar
          </button>}
        </div>
      </div>

      {/* LISTA DE IMAGENS DO CARROSSEL */}
      <div>
        <h2 style={{ marginBottom: '20px' }}>Imagens do carrossel ({carouselItems.length})</h2>
        {carouselItems.length === 0 ? (
          <p>Nenhuma imagem cadastrada ainda. Adicione uma para começar!</p>
        ) : (
          <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {carouselItems.map((item) => (
              <div key={item.id} style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px', background: '#fafafa', overflow: 'hidden' }}>
                <img src={item.image_url} alt={item.alt_text || 'Carrossel'} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '5px', marginBottom: '10px' }} />
                <p style={{ margin: '0 0 5px', fontWeight: '700', color: '#4a3325' }}>{item.alt_text || 'Sem descrição'}</p>
                <p style={{ margin: '0 0 15px', fontSize: '0.85rem', color: '#666', wordBreak: 'break-all' }}>{item.image_url}</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => editarItem(item)} style={{ flex: 1, padding: '10px', background: '#c06a42', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '0.9rem' }}>
                    Editar
                  </button>
                  <button onClick={() => excluirItem(item.id)} style={{ flex: 1, padding: '10px', background: '#d32f2f', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '0.9rem' }}>
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;