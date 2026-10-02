(function () {
  "use strict";

  var statusEl = document.getElementById("agenda-status");
  var toolbarEl = document.getElementById("agenda-toolbar");
  var dayTabsEl = document.getElementById("day-tabs");
  var btnViewBoard = document.getElementById("btn-view-board");
  var btnViewList = document.getElementById("btn-view-list");
  var filtersEl = document.getElementById("agenda-filters");
  var tableWrapEl = document.getElementById("schedule-wrap");
  var boardEl = document.getElementById("schedule-board");
  var listEl = document.getElementById("schedule-list");
  var emptyEl = document.getElementById("agenda-empty");
  var btnResetFilters = document.getElementById("btn-reset-filters");
  var modalOverlay = document.getElementById("activity-modal");
  var modalClose = document.getElementById("modal-close");

  if (!statusEl) return;

  var days = {};
  var activeDay = null;
  var activeSection = "Todas";
  var currentView = window.innerWidth <= 768 ? "lista" : "grade";
  var scheduleDates = [];
  var predefinedSections = ["JACITEC", "SINF", "SEMIN", "SEMEC", "HUM", "SEMAT"];
  var allSections = [];
  var sectionColors = {};
  var paletteVariables = [
    "--ocean-950",
    "--ocean-900",
    "--ocean-800",
    "--ocean-700",
    "--ocean-600",
    "--ocean-500",
    "--aqua-400",
    "--aqua-300",
    "--coral-500",
    "--coral-600"
  ];

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
    document.body.style.overflow = "";
  }

  // Eventos de Fechar o Modal
  if (modalClose) {
    modalClose.addEventListener("click", closeModal);
  }
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
    if (!time) return 0;
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
        renderCurrentView();
      });
      filtersEl.appendChild(button);
    });
  }

  // Extrai datas dinamicamente das atividades + garante o período oficial da JACITEC (20 a 24 de outubro)
  function extractDates(activities) {
    var baseDates = ["2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23", "2026-10-24"];
    var set = {};
    baseDates.forEach(function (d) { set[d] = true; });

    (activities || []).forEach(function (activity) {
      if (activity.data_inicio) set[activity.data_inicio] = true;
      if (activity.data_fim) set[activity.data_fim] = true;
    });

    return Object.keys(set).sort();
  }

  function buildDayIndex(palestras) {
    scheduleDates = extractDates(palestras);
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
        if (days[currentKey]) {
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

  function renderDayTabs() {
    dayTabsEl.innerHTML = "";

    if (!scheduleDates.length) {
      if (toolbarEl) toolbarEl.hidden = true;
      return;
    }

    if (toolbarEl) toolbarEl.hidden = false;

    scheduleDates.forEach(function (date, index) {
      var tab = document.createElement("button");
      tab.type = "button";
      tab.className = "day-tab" + (date === activeDay ? " active" : "");
      tab.textContent = formatDate(date).toLocaleUpperCase("pt-BR");
      tab.setAttribute("aria-pressed", date === activeDay ? "true" : "false");
      tab.addEventListener("click", function () {
        activeDay = date;
        renderDayTabs();
        renderCurrentView();
      });
      dayTabsEl.appendChild(tab);

      if (!activeDay && index === 0) {
        activeDay = date;
        tab.classList.add("active");
        tab.setAttribute("aria-pressed", "true");
      }
    });
  }

  // Calcula limites dinâmicos de horário para o modo grade do dia ativo
  function getDayTimeBounds(activities) {
    if (!activities || !activities.length) {
      return { startMin: 9 * 60, endMin: 20 * 60, startHour: 9, endHour: 20, totalHours: 11 };
    }
    var minMin = 24 * 60;
    var maxMin = 0;
    activities.forEach(function (a) {
      var s = minutesFromTime(a.hora_inicio);
      var e = minutesFromTime(a.hora_fim);
      if (!isNaN(s) && s < minMin) minMin = s;
      if (!isNaN(e) && e > maxMin) maxMin = e;
    });

    var startHour = Math.min(9, Math.floor(minMin / 60));
    var endHour = Math.max(18, Math.ceil(maxMin / 60));

    startHour = Math.max(7, Math.min(startHour, 9));
    endHour = Math.min(23, Math.max(endHour, 19));

    return {
      startMin: startHour * 60,
      endMin: endHour * 60,
      startHour: startHour,
      endHour: endHour,
      totalHours: Math.max(1, endHour - startHour)
    };
  }

  function renderBoard(activities) {
    boardEl.innerHTML = "";
    var bounds = getDayTimeBounds(activities);
    var sectionNames = activeSection === "Todas" ? allSections : [activeSection];

    boardEl.style.gridTemplateColumns = "76px repeat(" + sectionNames.length + ", minmax(170px, 1fr))";
    boardEl.style.gridTemplateRows = "48px calc(var(--hour-height, 72px) * " + bounds.totalHours + ")";

    var corner = document.createElement("div");
    corner.className = "agenda-board-corner";
    corner.textContent = "Horário";
    boardEl.appendChild(corner);

    sectionNames.forEach(function (section) {
      var heading = document.createElement("div");
      heading.className = "agenda-lane-heading";
      heading.textContent = section;
      heading.style.setProperty("--lane-color", getSectionColor(section));
      boardEl.appendChild(heading);
    });

    var timeAxis = document.createElement("div");
    timeAxis.className = "agenda-time-axis";
    timeAxis.style.height = "calc(var(--hour-height, 72px) * " + bounds.totalHours + ")";

    for (var hour = bounds.startHour; hour <= bounds.endHour; hour += 1) {
      var tick = document.createElement("div");
      tick.className = "agenda-hour";
      if (hour === bounds.startHour) tick.classList.add("first");
      if (hour === bounds.endHour) tick.classList.add("last");
      tick.textContent = String(hour).padStart(2, "0") + ":00";
      tick.style.top = (((hour - bounds.startHour) / bounds.totalHours) * 100) + "%";
      timeAxis.appendChild(tick);
    }
    boardEl.appendChild(timeAxis);

    sectionNames.forEach(function (section) {
      var lane = document.createElement("div");
      lane.className = "agenda-lane";
      lane.style.height = "calc(var(--hour-height, 72px) * " + bounds.totalHours + ")";

      activities.forEach(function (activity) {
        if (getActivitySections(activity).indexOf(section) === -1) return;

        var start = minutesFromTime(activity.hora_inicio);
        var end = minutesFromTime(activity.hora_fim);
        var visibleStart = Math.max(start, bounds.startMin);
        var visibleEnd = Math.min(end, bounds.endMin);
        if (visibleEnd <= visibleStart) return;

        var event = document.createElement("button");
        event.type = "button";
        event.className = "agenda-event";
        event.style.top = (((visibleStart - bounds.startMin) / (bounds.endMin - bounds.startMin)) * 100) + "%";
        event.style.height = Math.max(22, (((visibleEnd - visibleStart) / (bounds.endMin - bounds.startMin)) * 100)) + "%";
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

  function renderList(activities) {
    listEl.innerHTML = "";

    activities.forEach(function (activity) {
      var card = document.createElement("article");
      card.className = "agenda-card";
      var sections = getActivitySections(activity);
      var mainSection = sections[0] || "GERAL";
      card.style.setProperty("--lane-color", getSectionColor(mainSection));
      card.setAttribute("tabindex", "0");
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", activity.nome + ", " + formatTime(activity.hora_inicio) + " às " + formatTime(activity.hora_fim));

      // Header: Badges (Área e Tipo) + Horário
      var header = document.createElement("div");
      header.className = "agenda-card-header";

      var tags = document.createElement("div");
      tags.className = "agenda-card-tags";

      sections.forEach(function (sec) {
        var badgeSec = document.createElement("span");
        badgeSec.className = "agenda-badge agenda-badge-lane";
        badgeSec.style.setProperty("--lane-color", getSectionColor(sec));
        badgeSec.textContent = sec;
        tags.appendChild(badgeSec);
      });

      if (activity.tipo) {
        var badgeType = document.createElement("span");
        badgeType.className = "agenda-badge agenda-badge-type";
        badgeType.textContent = activity.tipo;
        tags.appendChild(badgeType);
      }

      var time = document.createElement("span");
      time.className = "agenda-card-time";
      time.innerHTML = '<i class="fa-regular fa-clock"></i> ' + formatTime(activity.hora_inicio) + ' – ' + formatTime(activity.hora_fim);

      header.appendChild(tags);
      header.appendChild(time);
      card.appendChild(header);

      // Título
      var title = document.createElement("h3");
      title.className = "agenda-card-title";
      title.textContent = activity.nome;
      card.appendChild(title);

      // Meta (Palestrante e Local)
      var meta = document.createElement("div");
      meta.className = "agenda-card-meta";

      if (activity.palestrante_nome) {
        var speaker = document.createElement("span");
        speaker.className = "agenda-card-meta-item";
        speaker.innerHTML = '<i class="fa-solid fa-user-tie"></i> ' + activity.palestrante_nome;
        meta.appendChild(speaker);
      }

      if (activity.place) {
        var place = document.createElement("span");
        place.className = "agenda-card-meta-item";
        place.innerHTML = '<i class="fa-solid fa-location-dot"></i> ' + activity.place;
        meta.appendChild(place);
      }

      card.appendChild(meta);

      // CTA
      var cta = document.createElement("span");
      cta.className = "agenda-card-cta";
      cta.innerHTML = 'Ver detalhes <i class="fa-solid fa-arrow-right"></i>';
      card.appendChild(cta);

      // Eventos de clique e acessibilidade por teclado
      card.addEventListener("click", function () {
        openModal(activity);
      });
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openModal(activity);
        }
      });

      listEl.appendChild(card);
    });
  }

  function updateViewSwitchButtons() {
    if (btnViewBoard) {
      btnViewBoard.classList.toggle("active", currentView === "grade");
      btnViewBoard.setAttribute("aria-pressed", currentView === "grade" ? "true" : "false");
    }
    if (btnViewList) {
      btnViewList.classList.toggle("active", currentView === "lista");
      btnViewList.setAttribute("aria-pressed", currentView === "lista" ? "true" : "false");
    }
  }

  function renderCurrentView() {
    if (!activeDay || !days[activeDay]) {
      tableWrapEl.hidden = true;
      if (listEl) listEl.hidden = true;
      return;
    }

    var activities = days[activeDay].filter(function (activity) {
      return activeSection === "Todas" || getActivitySections(activity).indexOf(activeSection) !== -1;
    });

    hideStatus();

    // Verificação de Estado Vazio
    if (activities.length === 0) {
      tableWrapEl.hidden = true;
      if (listEl) listEl.hidden = true;
      if (emptyEl) {
        emptyEl.hidden = false;
        var emptyMsg = document.getElementById("agenda-empty-msg");
        if (emptyMsg) {
          emptyMsg.textContent = activeSection === "Todas"
            ? "Ainda não há atividades programadas para esta data."
            : "Não há atividades de " + activeSection + " programadas para esta data.";
        }
      }
      return;
    }

    if (emptyEl) emptyEl.hidden = true;

    if (currentView === "grade") {
      if (listEl) listEl.hidden = true;
      tableWrapEl.hidden = false;
      renderBoard(activities);
    } else {
      tableWrapEl.hidden = true;
      if (listEl) {
        listEl.hidden = false;
        renderList(activities);
      }
    }
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
    renderDayTabs();
    updateViewSwitchButtons();
    renderCurrentView();
  }

  // Eventos dos botões de alternância de visão
  if (btnViewBoard) {
    btnViewBoard.addEventListener("click", function () {
      currentView = "grade";
      updateViewSwitchButtons();
      renderCurrentView();
    });
  }
  if (btnViewList) {
    btnViewList.addEventListener("click", function () {
      currentView = "lista";
      updateViewSwitchButtons();
      renderCurrentView();
    });
  }

  // Botão de resetar filtros no estado vazio
  if (btnResetFilters) {
    btnResetFilters.addEventListener("click", function () {
      activeSection = "Todas";
      renderFilters(allSections);
      renderCurrentView();
    });
  }

  // Carregamento de dados com anti-cache
  setStatus('<i class="fa-solid fa-circle-notch fa-spin"></i>Carregando agenda…');
  fetch("agenda.json?v=" + Date.now())
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
