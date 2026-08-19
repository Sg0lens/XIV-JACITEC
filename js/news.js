document.addEventListener('DOMContentLoaded', () => {
  // 1. "Banco de dados" das notícias (Poderia vir de um fetch de arquivo noticias.json)
  const noticias = [
    
    {
      id: 3,
      titulo: "Diretoria de Pesquisa, Pós-Gradução e Extensão do Ifes anunciam data da XV Jornada Acadêmica de Ciência, Tecnologia e Cultura.",
      resumo: "A espera acaba! A XV JACITEC acontecerá dos dias 19 a 22 de Outubro de 2026, no Ifes - Campus Cachoeiro de Itapemirim.",
      data: "19 de Agosto de 2026",
      imagem: "img/logos-jacitec/imagem1.jpg",
      link: "noticia_save_the_date.html"
    },
    {
      id: 2,
      titulo: "JACITEC 2025 confirma palestrante internacional",
      resumo: "A abertura do evento contará com um especialista em Cultura Oceânica para debater as mudanças climáticas.",
      data: "05 de Agosto de 2025",
      imagem: "img/noticias/palestrante.jpg",
      link: "noticia-palestrante.html"
    },
    {
      id: 1,
      titulo: "Abertas as inscrições para minicursos",
      resumo: "As vagas são limitadas. Confira a programação e garanta sua vaga nos minicursos oferecidos pelas semanas de curso.",
      data: "28 de Julho de 2025",
      imagem: "img/noticias/minicursos.jpg",
      link: "noticia-minicursos.html"
    }
  ];

  const track = document.getElementById('news-track');

  // 2. Função para renderizar as notícias na tela
  function renderNews() {
    // Limpa o "Carregando..."
    track.innerHTML = '';

    noticias.forEach(noticia => {
      // Cria a estrutura do card da notícia usando as tags semânticas
      const article = document.createElement('article');
      article.className = 'news-card';
      
      article.innerHTML = `
        <a href="${noticia.link}" class="news-card-link">
          <figure class="news-media">
            <img src="${noticia.imagem}" alt="Capa da notícia: ${noticia.titulo}" loading="lazy" width="400" height="250">
          </figure>
          <div class="news-content">
            <time class="news-date"><i class="fa-regular fa-calendar"></i> ${noticia.data}</time>
            <h3 class="news-title">${noticia.titulo}</h3>
            <p class="news-summary">${noticia.resumo}</p>
            <span class="news-read-more">Ler notícia completa <i class="fa-solid fa-arrow-right"></i></span>
          </div>
        </a>
      `;
      track.appendChild(article);
    });
  }

  // 3. Lógica dos botões do Carrossel (Scroll)
  function initCarousel() {
    const btnPrev = document.getElementById('news-prev');
    const btnNext = document.getElementById('news-next');

    // Avança ou recua o scroll baseado no tamanho de um card
    btnNext.addEventListener('click', () => {
      const cardWidth = track.querySelector('.news-card').offsetWidth;
      track.scrollBy({ left: cardWidth + 24, behavior: 'smooth' }); // 24 é o gap (espaçamento)
    });

    btnPrev.addEventListener('click', () => {
      const cardWidth = track.querySelector('.news-card').offsetWidth;
      track.scrollBy({ left: -(cardWidth + 24), behavior: 'smooth' });
    });
  }

  // Executa as funções
  renderNews();
  initCarousel();
});