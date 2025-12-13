// Botão WhatsApp
function buyNow() {
  const mensagem = `
*Olha só o que encontrei na Natur'art!* 🌿

Acessórios de crochê artesanal
Preço promocional: R$ 69,90

Quero garantir a minha antes que acabe! 🚨
  `.trim();

  const whatsappURL = `https://wa.me/5518997617391?text=${encodeURIComponent(mensagem)}`;
  window.open(whatsappURL, '_blank');
}

// Carrossel de fotos
let slideIndex = 0;
const slides = document.querySelector('.slides');
const images = document.querySelectorAll('.slides img');

function moveSlide(n) {
  slideIndex += n;
  if (slideIndex >= images.length) slideIndex = 0;
  if (slideIndex < 0) slideIndex = images.length - 1;
  slides.style.transform = `translateX(${-slideIndex * 100}%)`;
}

// Troca automática a cada 5 segundos
setInterval(() => moveSlide(1), 5000);