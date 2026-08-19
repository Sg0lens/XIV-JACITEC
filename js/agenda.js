(function () {
  "use strict";

  var API_URL = "https://script.google.com/macros/s/AKfycbzp_tHST6If8YnTFxjwCtuBDykwqpIyiV3I5DTyI1CTGdn7WImktrcG9tXInCU_D-Kyow/exec";

  var statusEl = document.getElementById("agenda-status");
  var filtersEl = document.getElementById("agenda-filters");
  var dayTabsEl = document.getElementById("day-tabs");
  var tableWrapEl = document.getElementById("schedule-wrap");
  var tableBodyEl = document.getElementById("schedule-body");
  var modalOverlay = document.getElementById("activity-modal");
  var modalClose = document.getElementById("modal-close");

  if (!statusEl) return;

  var days = {};
  var activeTheme = "Nenhum";
  var activeDay = null;

  function openModal(palestra) {
    // 1. Preenche os textos
    document.getElementById("modal-title").textContent = palestra.palestra;
    document.getElementById("modal-time").textContent = formatTime(palestra.horario_inicio) + " – " + formatTime(palestra.horario_termino);
    document.getElementById("modal-place").textContent = [palestra.bloco, palestra.sala].filter(Boolean).join(" ");
    
    // Se não tiver descrição, põe um texto padrão
    document.getElementById("modal-desc").textContent = palestra.descricao || "Mais informações sobre esta atividade serão divulgadas em breve.";

    // 2. Controla os elementos opcionais (Foto, Tipo e Link)
    var tipoEl = document.getElementById("modal-tipo");
    if (palestra.tipo) {
      tipoEl.textContent = palestra.tipo;
      tipoEl.hidden = false;
    } else {
      tipoEl.hidden = true;
    }

    var imgEl = document.getElementById("modal-foto");
    if (palestra.foto) {
      imgEl.src = palestra.foto;
      imgEl.hidden = false;
    } else {
      imgEl.hidden = true;
    }

    var actionWrapEl = document.getElementById("modal-action-wrap");
    var linkEl = document.getElementById("modal-link");
    if (palestra.link_inscricao) {
      linkEl.href = palestra.link_inscricao;
      actionWrapEl.hidden = false;
    } else {
      actionWrapEl.hidden = true;
    }

    // 3. Exibe o Modal e impede a tela de fundo de rolar
    modalOverlay.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modalOverlay.hidden = true;
    document.body.style.overflow = ""; // Libera o scroll da tela
  }

  // Eventos de Fechar o Modal
  if (modalClose) {
    modalClose.addEventListener("click", closeModal);
  }
  // Fecha se clicar fora da caixa branca
  if (modalOverlay) {
    modalOverlay.addEventListener("click", function (e) {
      if (e.target === modalOverlay) closeModal();
    });
  }

  function setStatus(html) {
    statusEl.hidden = false;
    statusEl.innerHTML = html;
  }

  function hideStatus() {
    statusEl.hidden = true;
  }

  function formatTime(time) {
    if (!time) return "";
    return time.split(":").slice(0, 2).join(":");
  }

  function formatDate(dateStr) {
    var options = {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "UTC",
    };
    return new Date(dateStr).toLocaleDateString("pt-BR", options);
  }

  function buildDayIndex(palestras) {
    days = {};
    palestras.forEach(function (palestra) {
      var date = palestra.data;
      if (!days[date]) days[date] = [];
      days[date].push(palestra);
    });
    Object.keys(days).forEach(function (date) {
      days[date].sort(function (a, b) {
        return a.horario_inicio.localeCompare(b.horario_inicio);
      });
    });
  }

  function sortedDates() {
    return Object.keys(days).sort(function (a, b) {
      return new Date(a) - new Date(b);
    });
  }

  function renderDayTabs() {
    var dates = sortedDates();
    dayTabsEl.innerHTML = "";

    if (!dates.length) {
      dayTabsEl.hidden = true;
      return;
    }

    dayTabsEl.hidden = false;

    dates.forEach(function (date, index) {
      var tab = document.createElement("button");
      tab.type = "button";
      tab.className = "day-tab" + (date === activeDay ? " active" : "");
      tab.textContent = formatDate(date);
      tab.setAttribute("aria-pressed", date === activeDay ? "true" : "false");
      tab.addEventListener("click", function () {
        activeDay = date;
        renderDayTabs();
        renderTable();
      });
      dayTabsEl.appendChild(tab);

      if (!activeDay && index === 0) {
        activeDay = date;
        tab.classList.add("active");
        tab.setAttribute("aria-pressed", "true");
      }
    });
  }

  function renderTable() {
    tableBodyEl.innerHTML = "";

    if (!activeDay || !days[activeDay]) {
      tableWrapEl.hidden = true;
      return;
    }

    var rows = days[activeDay].filter(function (palestra) {
      return activeTheme === "Nenhum" || palestra.tema === activeTheme;
    });

    if (!rows.length) {
      tableWrapEl.hidden = true;
      setStatus(
        '<i class="fa-solid fa-calendar-xmark"></i>Nenhuma atividade encontrada para este filtro neste dia.'
      );
      return;
    }

    hideStatus();
    tableWrapEl.hidden = false;

    rows.forEach(function (palestra) {
      var tr = document.createElement("tr");

      var tdTime = document.createElement("td");
      tdTime.textContent =
        formatTime(palestra.horario_inicio) + " – " + formatTime(palestra.horario_termino);

      var tdActivity = document.createElement("td");
      tdActivity.textContent = palestra.palestra || "";

      var tdPlace = document.createElement("td");
      tdPlace.textContent = [palestra.bloco, palestra.sala].filter(Boolean).join(" ");

      // -- NOVA COLUNA COM BOTÃO --
      var tdAction = document.createElement("td");
      var btnAction = document.createElement("button");
      btnAction.className = "btn btn-outline btn-sm";
      btnAction.innerHTML = '<i class="fa-solid fa-plus"></i> Detalhes';
      
      // Ao clicar, chama a função de abrir o modal passando os dados da palestra
      btnAction.addEventListener("click", function() {
        openModal(palestra);
      });
      tdAction.appendChild(btnAction);

      tr.appendChild(tdTime);
      tr.appendChild(tdActivity);
      tr.appendChild(tdPlace);
      tr.appendChild(tdAction); // Injeta o botão na linha
      tableBodyEl.appendChild(tr);
    });
  }

  function setActiveFilterButton() {
    filtersEl.querySelectorAll(".filter-button").forEach(function (button) {
      var isActive = button.dataset.theme === activeTheme;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  function initFilters() {
    filtersEl.querySelectorAll(".filter-button").forEach(function (button) {
      button.addEventListener("click", function () {
        activeTheme = button.dataset.theme;
        setActiveFilterButton();
        renderTable();
      });
    });
    setActiveFilterButton();
  }

  function renderSchedule(palestras) {
    if (!Array.isArray(palestras) || !palestras.length) {
      setStatus(
        '<i class="fa-solid fa-calendar-xmark"></i>A agenda ainda não foi publicada. Volte em breve!'
      );
      return;
    }

    buildDayIndex(palestras);
    hideStatus();
    renderDayTabs();
    renderTable();
  }

  setStatus('<i class="fa-solid fa-circle-notch fa-spin"></i>Carregando agenda…');
  initFilters();

  fetch(API_URL)
    .then(function (response) {
      if (!response.ok) throw new Error("Falha na resposta da API");
      return response.json();
    })
    .then(renderSchedule)
    .catch(function () {
      setStatus(
        '<i class="fa-solid fa-triangle-exclamation"></i>Não foi possível carregar a agenda agora. Tente novamente mais tarde.'
      );
    });
})();
