(function () {
  "use strict";

  var statusEl = document.getElementById("agenda-status");
  var dayTabsEl = document.getElementById("day-tabs");
  var filtersEl = document.getElementById("agenda-filters");
  var tableWrapEl = document.getElementById("schedule-wrap");
  var boardEl = document.getElementById("schedule-board");
  var modalOverlay = document.getElementById("activity-modal");
  var modalClose = document.getElementById("modal-close");

  if (!statusEl) return;

  var days = {};
  var activeDay = null;
  var activeSection = "Todas";
  var scheduleDates = ["2026-10-20", "2026-10-21", "2026-10-22", "2026-10-24"];
  var predefinedSections = ["JACITEC", "SINF", "SEMIN", "SEMEC", "HUM", "SEMAT"];
  var allSections = [];
  var sectionColors = {};
  var paletteVariables = ["--ocean-950", "--ocean-900", "--ocean-800", "--ocean-700", "--ocean-600", "--ocean-500", "--aqua-400", "--aqua-300", "--coral-500", "--coral-600"];
  var gridStart = 9 * 60;
  var gridEnd = 20 * 60;

  function openModal(activity) {
    // 1. Preenche os textos
    document.getElementById("modal-title").textContent = activity.nome || "Atividade";
    document.getElementById("modal-time").textContent = formatTime(activity.hora_inicio) + " – " + formatTime(activity.hora_fim);
    document.getElementById("modal-place").textContent = activity.place || "Local a confirmar";
    
    // Se não tiver descrição, põe um texto padrão
    document.getElementById("modal-desc").textContent = activity.descricao || activity.palestrante_nome || "Mais informações sobre esta atividade serão divulgadas em breve.";

    // 2. Controla os elementos opcionais (Foto, Tipo e Link)
    var tipoEl = document.getElementById("modal-tipo");
    if (activity.tipo) {
      tipoEl.textContent = activity.tipo;
      tipoEl.hidden = false;
    } else {
      tipoEl.hidden = true;
    }

    var imgEl = document.getElementById("modal-foto");
    var imagePath = activity.foto || activity.imagem || (activity.evento && (activity.evento.imagem_promocional_url || activity.evento.logo_url));
    imgEl.hidden = true;
    imgEl.onload = function () {
      imgEl.hidden = false;
    };
    imgEl.onerror = function () {
      imgEl.hidden = true;
      imgEl.onload = null;
      imgEl.onerror = null;
      imgEl.removeAttribute("src");
    };
    imgEl.alt = "Imagem de " + (activity.nome || "atividade");

    if (imagePath) {
      imgEl.src = /^(https?:)?\/\//i.test(imagePath)
        ? imagePath
        : new URL(imagePath.replace(/^\/+/, ""), "https://qrcheck.io/api/static/").href;
    } else {
      imgEl.onload = null;
      imgEl.onerror = null;
      imgEl.removeAttribute("src");
    }

    var actionWrapEl = document.getElementById("modal-action-wrap");
    actionWrapEl.hidden = true;

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
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modalOverlay.hidden) closeModal();
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
    return new Date(dateStr + "T12:00:00Z").toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  function minutesFromTime(time) {
    var parts = time.split(":");
    return Number(parts[0]) * 60 + Number(parts[1]);
  }

  function getPlace(local) {
    if (!local) return "Local a confirmar";
    return [local.bloco, local.sala, local.andar, local.outro].filter(Boolean).join(" · ") || "Local a confirmar";
  }

  function getActivitySections(activity) {
    var sections = (activity.secoes || []).map(function (section) {
      return section.sigla && section.sigla.trim();
    }).filter(Boolean);
    return sections.length ? sections : ["GERAL"];
  }

  function getSectionColor(section) {
    return sectionColors[section] || "var(--ocean-900)";
  }

  function buildSectionColors(activities) {
    var sections = predefinedSections.slice();
    var additionalSections = [];
    activities.forEach(function (activity) {
      getActivitySections(activity).forEach(function (section) {
        if (sections.indexOf(section) === -1 && additionalSections.indexOf(section) === -1) {
          additionalSections.push(section);
        }
      });
    });
    additionalSections.sort();
    sections = sections.concat(additionalSections);

    var rootStyles = getComputedStyle(document.documentElement);
    sections.forEach(function (section, index) {
      var variable = paletteVariables[index % paletteVariables.length];
      sectionColors[section] = rootStyles.getPropertyValue(variable).trim();
    });
    return sections;
  }

  function renderFilters(sections) {
    filtersEl.innerHTML = "";
    filtersEl.hidden = false;

    ["Todas"].concat(sections).forEach(function (section) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "agenda-filter" + (section === activeSection ? " active" : "");
      button.textContent = section;
      button.setAttribute("aria-pressed", section === activeSection ? "true" : "false");
      button.style.setProperty("--lane-color", section === "Todas" ? "var(--ocean-900)" : getSectionColor(section));
      button.addEventListener("click", function () {
        activeSection = section;
        renderFilters(sections);
        renderTable();
      });
      filtersEl.appendChild(button);
    });
  }

  function buildDayIndex(palestras) {
    days = {};
    scheduleDates.forEach(function (date) {
      days[date] = [];
    });

    palestras.forEach(function (activity) {
      if (!activity.data_inicio || !activity.hora_inicio || !activity.hora_fim || !activity.nome) return;

      activity.place = getPlace(activity.local);
      var date = activity.data_inicio;
      var lastDate = activity.data_fim || date;
      var currentDate = new Date(date + "T00:00:00Z");
      var endDate = new Date(lastDate + "T00:00:00Z");

      while (currentDate <= endDate) {
        var currentKey = currentDate.toISOString().slice(0, 10);
        if (scheduleDates.indexOf(currentKey) !== -1) {
          days[currentKey].push(activity);
        }
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
      }
    });
    Object.keys(days).forEach(function (date) {
      days[date].sort(function (a, b) {
        return a.hora_inicio.localeCompare(b.hora_inicio);
      });
    });
  }

  function sortedDates() {
    return scheduleDates;
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
      tab.textContent = formatDate(date).toLocaleUpperCase("pt-BR");
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
    boardEl.innerHTML = "";

    if (!activeDay || !days[activeDay]) {
      tableWrapEl.hidden = true;
      return;
    }

    var activities = days[activeDay].filter(function (activity) {
      return activeSection === "Todas" || getActivitySections(activity).indexOf(activeSection) !== -1;
    });
    var sectionNames = activeSection === "Todas" ? allSections : [activeSection];

    hideStatus();
    tableWrapEl.hidden = false;
    boardEl.style.gridTemplateColumns = "76px repeat(" + sectionNames.length + ", minmax(170px, 1fr))";

    var corner = document.createElement("div");
    corner.className = "agenda-board-corner";
    corner.textContent = "Horário";
    boardEl.appendChild(corner);

    sectionNames.forEach(function (section, index) {
      var heading = document.createElement("div");
      heading.className = "agenda-lane-heading";
      heading.textContent = section;
      heading.style.setProperty("--lane-color", getSectionColor(section));
      boardEl.appendChild(heading);
    });

    var timeAxis = document.createElement("div");
    timeAxis.className = "agenda-time-axis";
    for (var hour = 9; hour <= 20; hour += 1) {
      var tick = document.createElement("div");
      tick.className = "agenda-hour";
      if (hour === 9) tick.classList.add("first");
      if (hour === 20) tick.classList.add("last");
      tick.textContent = String(hour).padStart(2, "0") + ":00";
      tick.style.top = ((hour - 9) / 11 * 100) + "%";
      timeAxis.appendChild(tick);
    }
    boardEl.appendChild(timeAxis);

    sectionNames.forEach(function (section) {
      var lane = document.createElement("div");
      lane.className = "agenda-lane";

      activities.forEach(function (activity) {
        if (getActivitySections(activity).indexOf(section) === -1) return;

        var start = minutesFromTime(activity.hora_inicio);
        var end = minutesFromTime(activity.hora_fim);
        var visibleStart = Math.max(start, gridStart);
        var visibleEnd = Math.min(end, gridEnd);
        if (visibleEnd <= visibleStart) return;

        var event = document.createElement("button");
        event.type = "button";
        event.className = "agenda-event";
        event.style.top = ((visibleStart - gridStart) / (gridEnd - gridStart) * 100) + "%";
        event.style.height = ((visibleEnd - visibleStart) / (gridEnd - gridStart) * 100) + "%";
        event.style.setProperty("--lane-color", getSectionColor(section));
        event.title = activity.nome + " · " + formatTime(activity.hora_inicio) + "–" + formatTime(activity.hora_fim);
        event.setAttribute("aria-label", activity.nome + ", " + formatTime(activity.hora_inicio) + " às " + formatTime(activity.hora_fim));
        event.textContent = activity.nome;
        event.addEventListener("click", function () {
          openModal(activity);
        });
        lane.appendChild(event);
      });

      boardEl.appendChild(lane);
    });
  }

  function renderSchedule(palestras) {
    if (!Array.isArray(palestras)) {
      setStatus(
        '<i class="fa-solid fa-calendar-xmark"></i>Os dados da agenda não estão no formato esperado.'
      );
      return;
    }

    buildDayIndex(palestras);
    allSections = buildSectionColors(palestras);
    renderFilters(allSections);
    hideStatus();
    renderDayTabs();
    renderTable();
  }

  setStatus('<i class="fa-solid fa-circle-notch fa-spin"></i>Carregando agenda…');
  fetch("agenda.json")
    .then(function (response) {
      if (!response.ok) throw new Error("Falha ao carregar agenda.json");
      return response.json();
    })
    .then(function (payload) {
      renderSchedule(payload.data);
    })
    .catch(function () {
      setStatus(
        '<i class="fa-solid fa-triangle-exclamation"></i>Não foi possível carregar agenda.json. Tente novamente mais tarde.'
      );
    });
})();
