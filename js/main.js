(function () {
  "use strict";
  var header = document.querySelector(".site-header");

  function updateHeaderState() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 40);
  }

  if (header) {
    updateHeaderState();
    window.addEventListener("scroll", updateHeaderState, { passive: true });
  }

  var navToggle = document.querySelector(".nav-toggle");
  var mainNav = document.querySelector(".main-nav");
  var scrim = document.querySelector(".nav-scrim");

  function closeNav() {
    if (!mainNav) return;
    mainNav.classList.remove("is-open");
    if (scrim) scrim.classList.remove("is-open");
    if (navToggle) {
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
    }
  }

  function openNav() {
    if (!mainNav) return;
    mainNav.classList.add("is-open");
    if (scrim) scrim.classList.add("is-open");
    if (navToggle) {
      navToggle.setAttribute("aria-expanded", "true");
      navToggle.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    }
  }

  if (navToggle && mainNav) {
    navToggle.addEventListener("click", function () {
      var isOpen = mainNav.classList.contains("is-open");
      if (isOpen) {
        closeNav();
      } else {
        openNav();
      }
    });

    if (scrim) {
      scrim.addEventListener("click", closeNav);
    }

    mainNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeNav);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 860) {
        closeNav();
      }
    });
  }

  var heroImages = document.querySelectorAll(".hero-carousel img");

  if (heroImages.length > 1) {
    var current = 0;
    setInterval(function () {
      heroImages[current].classList.remove("is-active");
      current = (current + 1) % heroImages.length;
      heroImages[current].classList.add("is-active");
    }, 5000);
  }
document.addEventListener("DOMContentLoaded", function () {
  var modalOverlay = document.getElementById("project-modal");
  var modalCloseBtn = document.getElementById("modal-close");

  function abrirModalMostra(projeto) {
    var arrayAlunos = [projeto.aluno1, projeto.aluno2, projeto.aluno3, projeto.aluno4];
    var alunosFormatados = arrayAlunos.filter(Boolean).join(", ");

    document.getElementById('modal-projeto').textContent = projeto.projeto;
    document.getElementById('modal-alunos').textContent = alunosFormatados;
    document.getElementById('modal-orientador').textContent = projeto.orientador;
    document.getElementById('modal-instituicao').textContent = projeto.instituicao;
    document.getElementById('modal-descricao').textContent = projeto.descricao;

    var numeroStand = projeto['nº stand'] || projeto.stand; 
    var textoStand = "STAND " + numeroStand;

    if (projeto.data && projeto.hora_inicio) {
        textoStand += " • " + projeto.data + " às " + projeto.hora_inicio;
        if (projeto.turno) {
            textoStand += " (" + projeto.turno + ")";
        }
    }
    document.getElementById('modal-stand').textContent = textoStand;

    modalOverlay.hidden = false;
    document.body.style.overflow = "hidden"; 
  }

  function fecharModalMostra() {
    if(modalOverlay) {
      modalOverlay.hidden = true;
      document.body.style.overflow = ""; 
    }
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener("click", fecharModalMostra);
  if (modalOverlay) {
    modalOverlay.addEventListener("click", function (e) {
      if (e.target === modalOverlay) fecharModalMostra();
    });
  }

  var todosOsProjetos = [];
  var filtroDiaAtual = null;
  var filtroTurnoAtual = null;

  function extrairValoresUnicos(array, chave) {
    var valores = array.map(function(item) { return item[chave]; })
                       .filter(function(valor) { return valor && valor.trim() !== ""; });
    return Array.from(new Set(valores)).sort();
  }

  function construirFiltrosMostra() {
    var divDias = document.getElementById("mostra-dia-filtros");
    var divTurnos = document.getElementById("mostra-turno-filtros");
    var containerFiltros = document.getElementById("mostra-filters");

    if (!divDias || !divTurnos) return;

    var dias = extrairValoresUnicos(todosOsProjetos, "data");
    var turnos = extrairValoresUnicos(todosOsProjetos, "turno");

    if (!filtroDiaAtual && dias.length > 0) filtroDiaAtual = dias[0];
    if (!filtroTurnoAtual && turnos.length > 0) filtroTurnoAtual = turnos[0];

    divDias.innerHTML = dias.map(function(dia) {
      var classe = (dia === filtroDiaAtual) ? "day-tab active" : "day-tab";
      return '<button type="button" class="' + classe + '" onclick="mudarFiltroMostra(\'dia\', \'' + dia + '\')">' + dia + '</button>';
    }).join("");

    divTurnos.innerHTML = turnos.map(function(turno) {
      var classe = (turno === filtroTurnoAtual) ? "filter-button active" : "filter-button";
      return '<button type="button" class="' + classe + '" onclick="mudarFiltroMostra(\'turno\', \'' + turno + '\')">' + turno + '</button>';
    }).join("");

    containerFiltros.hidden = false;
  }

  window.mudarFiltroMostra = function(tipo, valor) {
    if (tipo === "dia") filtroDiaAtual = valor;
    if (tipo === "turno") filtroTurnoAtual = valor;
    construirFiltrosMostra();
    renderizarProjetos();
  };

  function renderizarProjetos() {
    var container = document.getElementById("projects-container");
    var statusEl = document.getElementById("projects-status");
    
    if (statusEl) statusEl.hidden = true;
    container.innerHTML = ""; 

    var projetosFiltrados = todosOsProjetos.filter(function (p) {
      var bateDia = (p.data === filtroDiaAtual);
      var bateTurno = (p.turno === filtroTurnoAtual);
      return bateDia && bateTurno && p.projeto;
    });

    if (projetosFiltrados.length === 0) {
      container.innerHTML = '<div style="text-align:center; padding: 40px; color: var(--ink-500);"><i class="fa-solid fa-calendar-xmark" style="font-size: 2rem; margin-bottom: 12px; color: var(--aqua-400); display: block;"></i>Nenhum projeto encontrado para este dia e turno.</div>';
      return;
    }
    projetosFiltrados.forEach(function (projeto) {
      var cardProjeto = document.createElement("button");
      cardProjeto.className = "download-card"; 
      cardProjeto.style.width = "100%"; 
      cardProjeto.style.justifyContent = "space-between";
      cardProjeto.style.marginBottom = "12px";
      
      cardProjeto.innerHTML = `
        <div style="text-align: left;">
            <strong style="display: block; font-size: 1.1rem; ">${projeto.projeto}</strong>
        </div>
        <i class="fa-solid fa-arrow-right"></i>
      `;

      cardProjeto.addEventListener("click", function () {
        abrirModalMostra(projeto);
      });

      container.appendChild(cardProjeto);
    });
  }
  const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTyESg1CYzNQJaUVN7kwzGAygKDNBfp2mcBUYrwRsgnP5ruwkTXMR2oaBjB0tsHIYUh71ksAn771ekP/pub?gid=0&single=true&output=csv";
  
  if(document.getElementById("projects-container")) {
    Papa.parse(CSV_URL, {
      download: true,
      header: true,
      complete: function (results) {
        todosOsProjetos = results.data;
        construirFiltrosMostra();
        renderizarProjetos();
      },
      error: function () {
        document.getElementById("projects-status").innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Erro ao carregar os projetos. Verifique sua conexão.';
      }
    });
  }
});

})();
