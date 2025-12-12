// Contador regressivo de 24h (reinicia todo dia)
function startTimer() {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const timer = setInterval(() => {
    const now = new Date();
    const distance = end - now;

    const hours = Math.floor(distance / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById("counter").innerHTML = 
      `${hours.toString().padStart(2,'0')}h ${minutes.toString().padStart(2,'0')}min ${seconds.toString().padStart(2,'0')}s`;

    if (distance < 0) {
      clearInterval(timer);
      document.getElementById("counter").innerHTML = "OFERTA ENCERRADA!";
    }
  }, 1000);
}
startTimer();

// Botão WhatsApp
function buyNow() {
  const mensagem = `
*Olha só o que acabei de reservar na Natur'art!* 🌿

Bolsa de Crochê Artesanal
Preço promocional: R$ 179,90 (6x sem juros)

Quero garantir a minha antes que acabe! 🚨
  `.trim();

  const whatsappURL = `https://wa.me/5518997617391?text=${encodeURIComponent(mensagem)}`; // Troque pelo seu número aqui!
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