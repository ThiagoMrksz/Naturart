import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { InstagramEmbed } from 'react-social-media-embed';
import './Home.css';

function Home() {
  const [carouselImages, setCarouselImages] = useState([
    { image_url: '/imgs/bmarrom.jpeg', alt_text: 'Bolsa 1' },
    { image_url: '/imgs/bmarrom1.jpeg', alt_text: 'Bolsa 2' },
    { image_url: '/imgs/bmarrom2.jpeg', alt_text: 'Bolsa 3' },
    { image_url: '/imgs/bmarrom3.jpeg', alt_text: 'Bolsa 4' }
  ]);
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    // Carregar imagens do carrossel do backend
    const carregarCarousel = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/admin/carousel');
        if (response.data && response.data.length > 0) {
          setCarouselImages(response.data);
        }
      } catch (error) {
        console.log('ℹ️ Usando imagens padrão (backend indisponível)');
        // Mantém as imagens padrão
      }
    };

    carregarCarousel();
  }, []);

  useEffect(() => {
    // Função do botão WhatsApp
    window.buyNow = () => {
      const mensagem = `Olha só o que encontrei na Natur'art!

Acessórios de crochê artesanal

Quero garantir a minha antes que acabe!`;
      
      const whatsappURL = `https://wa.me/5518997617391?text=${encodeURIComponent(mensagem)}`;
      window.open(whatsappURL, '_blank');
    };

    // Função para mover slide
    window.moveSlide = (n) => {
      setSlideIndex(prevIndex => {
        let newIndex = prevIndex + n;
        if (newIndex >= carouselImages.length) newIndex = 0;
        if (newIndex < 0) newIndex = carouselImages.length - 1;
        return newIndex;
      });
    };

    // Troca automática a cada 5 segundos
    const interval = setInterval(() => {
      setSlideIndex(prevIndex => {
        let newIndex = prevIndex + 1;
        if (newIndex >= carouselImages.length) newIndex = 0;
        return newIndex;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [carouselImages.length]);

  return (
    <div className="home">
      <div className="logo-top">
        <img src="/imgs/logo.png" alt="Logo Natur'art" className="logo" />
        <h1 className="brand-name">Natur'Art</h1>
      </div>

      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1>Acessórios de crochê</h1>
            <p className="subtitle">Feitos à mão para pessoas autênticas.</p>
            
            <div className="cta-box">
              <p className="cta-title">Peças únicas e exclusivas 🐆</p>
              <p className="cta-subtitle">Entre em contato e peça o seu orçamento personalizado</p>
            </div>

            <button className="whatsapp-btn" onClick={() => window.buyNow()}>
              <i className="fab fa-whatsapp"></i> QUERO A MINHA AGORA!
            </button>

            <p className="secure">✅ Pagamento via Pix e Cartão • Envio para todo Brasil</p>
          </div>

          <div className="gallery">
            <div 
              className="slides"
              style={{
                display: 'flex',
                transition: 'transform 0.5s ease-in-out',
                transform: `translateX(${-slideIndex * 100}%)`
              }}
            >
              {carouselImages.map((img, index) => (
                <img 
                  key={index}
                  src={img.image_url} 
                  alt={img.alt_text || 'Imagem do carrossel'} 
                  style={{ minWidth: '100%' }}
                />
              ))}
            </div>
            <button className="prev" onClick={() => window.moveSlide(-1)}>❮</button>
            <button className="next" onClick={() => window.moveSlide(1)}>❯</button>
          </div>
        </div>
      </section>

      <section className="instagram-section">
        <div className="container">
          <div className="section-header">
            <h2>Siga nossa inspiração no Instagram</h2>
            <p>Veja peças reais, novidades e ideias de looks com crochê artesanal.</p>
          </div>
          <div className="instagram-grid">
            <InstagramEmbed url="https://www.instagram.com/p/DTx9dGTjuLV/" width={328} />
            <InstagramEmbed url="https://www.instagram.com/naturartoriginal/p/DUtjvJrgSl4/" width={328} />
          </div>
        </div>
      </section>

      <section className="testimonials">
        <div className="container">
          <h2>O que nossas clientes estão dizendo</h2>
          <div className="test-grid">
            <div className="test-card">
              <p>"A bolsa mais linda que já tive! Acabamento perfeito e super espaçosa."</p>
              <strong>– Mariana, SP</strong>
            </div>
            <div className="test-card">
              <p>"Recebi em 4 dias e já uso todo dia. O tom de marrom é exatamente como na foto!"</p>
              <strong>– Julia, RJ</strong>
            </div>
            <div className="test-card">
              <p>"Presenteei minha mãe e ela amou! Qualidade incrível."</p>
              <strong>– Camila, MG</strong>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <p>&copy; 2026 Natur'Art. Todos os direitos reservados. 🐆</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;