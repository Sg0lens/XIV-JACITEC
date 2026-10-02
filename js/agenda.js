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
  var savedViewPref = null;
  try {
    savedViewPref = localStorage.getItem("jacitec_agenda_view");
  } catch (e) {}
  var currentView = savedViewPref || (window.innerWidth <= 768 ? "lista" : "grade");
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

  function formatLabName(sala) {
    if (!sala) return "";
    var trimmed = sala.trim();
    // Ex: "LAB10" -> "Laboratório 10", "LAB7A" -> "Laboratório 7A", "Lab 10" -> "Laboratório 10"
    var labMatch = trimmed.match(/^LAB\s*([0-9]+[A-Za-z]?)$/i);
    if (labMatch) {
      return "Laboratório " + labMatch[1].toUpperCase();
    }
    return trimmed;
  }

  function getPlace(local, activity) {
    if (!local) return "Local a confirmar";

    var parts = [];

    // 1. Sala / Lugar
    var sala = local.sala ? local.sala.trim() : "";
    // Ignora termos de modalidade genéricos (o evento é 100% presencial, então "Presencial" não é local)
    if (/^(presencial|online|hibrid[oa]|remoto)$/i.test(sala)) {
      sala = "";
    } else if (sala) {
      sala = formatLabName(sala);
    }

    // 2. Bloco
    var bloco = local.bloco ? local.bloco.trim() : "";
    if (bloco && !/^bloco/i.test(bloco)) {
      bloco = "Bloco " + bloco;
    }

    // 3. Andar
    var andar = local.andar ? local.andar.trim() : "";
    if (andar && /^[0-9]+$/.test(andar)) {
      andar = andar + "º andar";
    }

    // 4. Outro
    var outro = local.outro ? local.outro.trim() : "";
    if (/^(presencial|online|hibrid[oa]|remoto)$/i.test(outro)) {
      outro = "";
    }

    if (sala) parts.push(sala);
    if (bloco) parts.push(bloco);
    if (andar) parts.push(andar);
    if (outro) parts.push(outro);

    if (parts.length > 0) {
      return parts.join(" · ");
    }

    // Fallback inteligente para eventos sem sala preenchida no cadastro
    if (activity && activity.nome) {
      var lower = activity.nome.toLowerCase();
      if (lower.indexOf("abertura") !== -1 || lower.indexOf("encerramento") !== -1) {
        return "Auditório";
      }
    }

    return "Local a confirmar";
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

    var currentDayActivities = (activeDay && days[activeDay]) ? days[activeDay] : [];

    ["Todas"].concat(sections).forEach(function (section) {
      var count = 0;
      if (section === "Todas") {
        count = currentDayActivities.length;
      } else {
        currentDayActivities.forEach(function (act) {
          if (getActivitySections(act).indexOf(section) !== -1) {
            count++;
          }
        });
      }

      var button = document.createElement("button");
      button.type = "button";
      button.className = "agenda-filter" + (section === activeSection ? " active" : "");
      if (count === 0 && currentDayActivities.length > 0) {
        button.classList.add("is-empty");
      }
      button.innerHTML = section + ' <span class="agenda-filter-count">' + count + '</span>';
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

  // Extrai datas dinamicamente das atividades + garante o período oficial da JACITEC (20 a 23 de outubro)
  function extractDates(activities) {
    var baseDates = ["2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23"];
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

      activity.place = getPlace(activity.local, activity);
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

  function findDefaultActiveDay() {
    var todayStr = new Date().toISOString().slice(0, 10);
    if (days[todayStr] && days[todayStr].length > 0) return todayStr;
    for (var i = 0; i < scheduleDates.length; i++) {
      var d = scheduleDates[i];
      if (days[d] && days[d].length > 0) {
        return d;
      }
    }
    return scheduleDates[0] || null;
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
        renderFilters(allSections);
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

  // Calcula limites dinâmicos de horário para o modo grade do dia ativo.
  // Adiciona 1h de margem antes e depois das atividades para evitar que
  // o primeiro e o último horário fiquem colados nas bordas da grade.
  function getDayTimeBounds(activities) {
    if (!activities || !activities.length) {
      return { startMin: 8 * 60, endMin: 19 * 60, startHour: 8, endHour: 19, totalHours: 11 };
    }
    var minMin = 24 * 60;
    var maxMin = 0;
    activities.forEach(function (a) {
      var s = minutesFromTime(a.hora_inicio);
      var e = minutesFromTime(a.hora_fim);
      if (!isNaN(s) && s < minMin) minMin = s;
      if (!isNaN(e) && e > maxMin) maxMin = e;
    });

    // 1h antes da primeira atividade, 1h depois da última
    var startHour = Math.floor(minMin / 60) - 1;
    var endHour = Math.ceil(maxMin / 60) + 1;

    // Clamp entre 7h e 23h
    startHour = Math.max(7, startHour);
    endHour = Math.min(23, endHour);

    // Garante mínimo de diferença razoável
    if (endHour - startHour < 4) endHour = startHour + 4;

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

    // Quando "Todas" estiver ativo, exibe apenas as trilhas que realmente possuem atividades no dia ativo.
    // Isso evita colunas vazias gigantes que espremem as atividades reais em corredores estreitos.
    var activeSectionsToday = [];
    activities.forEach(function (act) {
      getActivitySections(act).forEach(function (sec) {
        if (activeSectionsToday.indexOf(sec) === -1) {
          activeSectionsToday.push(sec);
        }
      });
    });
    activeSectionsToday.sort(function (a, b) {
      var ia = predefinedSections.indexOf(a);
      var ib = predefinedSections.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b);
    });

    var sectionNames = activeSection === "Todas"
      ? (activeSectionsToday.length ? activeSectionsToday : allSections)
      : [activeSection];

    boardEl.style.gridTemplateColumns = "76px repeat(" + sectionNames.length + ", minmax(280px, 1fr))";
    boardEl.style.gridTemplateRows = "48px calc(var(--hour-height, 110px) * " + bounds.totalHours + ")";

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
    timeAxis.style.height = "calc(var(--hour-height, 110px) * " + bounds.totalHours + ")";

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
      lane.style.height = "calc(var(--hour-height, 110px) * " + bounds.totalHours + ")";

      var totalMinutes = Math.max(60, bounds.endMin - bounds.startMin);

      // Filtra e ordena atividades da seção por horário
      var laneActivities = activities.filter(function (activity) {
        return getActivitySections(activity).indexOf(section) !== -1;
      }).sort(function (a, b) {
        return minutesFromTime(a.hora_inicio) - minutesFromTime(b.hora_inicio);
      });

      // Agrupa eventos simultâneos para que dividam a largura caso ocorram no mesmo horário
      var clusters = [];
      laneActivities.forEach(function (act) {
        var s = minutesFromTime(act.hora_inicio);
        var e = minutesFromTime(act.hora_fim);
        if (e <= s) e = s + 30;
        act._start = s;
        act._end = e;

        var placed = false;
        for (var i = 0; i < clusters.length; i++) {
          var c = clusters[i];
          if (s < c.end && e > c.start) {
            c.events.push(act);
            c.start = Math.min(c.start, s);
            c.end = Math.max(c.end, e);
            placed = true;
            break;
          }
        }
        if (!placed) {
          clusters.push({ start: s, end: e, events: [act] });
        }
      });

      clusters.forEach(function (cluster) {
        var count = cluster.events.length;
        cluster.events.forEach(function (activity, colIndex) {
          var visibleStart = Math.max(activity._start, bounds.startMin);
          var visibleEnd = Math.min(activity._end, bounds.endMin);
          if (visibleEnd <= visibleStart) return;

          var durationMin = visibleEnd - visibleStart;
          var topPercent = ((visibleStart - bounds.startMin) / totalMinutes) * 100;
          var heightPercent = (durationMin / totalMinutes) * 100;

          var colWidth = 100 / count;
          var leftOffset = colIndex * colWidth;

          var event = document.createElement("button");
          event.type = "button";
          event.className = "agenda-event";
          if (durationMin < 35) {
            event.classList.add("is-compact");
          }
          if (count > 1) {
            event.classList.add("is-parallel");
          }
          event.style.top = topPercent + "%";
          event.style.height = "calc(" + heightPercent + "% - 4px)";
          event.style.left = "calc(" + leftOffset + "% + 4px)";
          event.style.width = "calc(" + colWidth + "% - 8px)";
          event.style.setProperty("--lane-color", getSectionColor(section));
          event.setAttribute(
            "aria-label",
            activity.nome + ", " + formatTime(activity.hora_inicio) + " às " + formatTime(activity.hora_fim)
          );

          var timeSpan = document.createElement("span");
          timeSpan.className = "agenda-event-time";
          timeSpan.textContent = formatTime(activity.hora_inicio) + " – " + formatTime(activity.hora_fim);

          var titleSpan = document.createElement("span");
          titleSpan.className = "agenda-event-title";
          titleSpan.textContent = activity.nome;

          event.appendChild(timeSpan);
          event.appendChild(titleSpan);

          if (activity.place && activity.place !== "Local a confirmar") {
            var placeSpan = document.createElement("span");
            placeSpan.className = "agenda-event-place";
            placeSpan.innerHTML = '<i class="fa-solid fa-location-dot"></i> ' + activity.place;
            event.appendChild(placeSpan);
          }

          event.addEventListener("click", function () {
            openModal(activity);
          });
          lane.appendChild(event);
        });
      });

      boardEl.appendChild(lane);
    });
  }

  function getPeriodInfo(horaStr) {
    var min = minutesFromTime(horaStr);
    if (min < 12 * 60) return { key: "manha", label: "Manhã", icon: "fa-regular fa-sun" };
    if (min < 18 * 60) return { key: "tarde", label: "Tarde", icon: "fa-solid fa-cloud-sun" };
    return { key: "noite", label: "Noite", icon: "fa-regular fa-moon" };
  }

  function renderList(activities) {
    listEl.innerHTML = "";
    var lastPeriod = null;

    activities.forEach(function (activity) {
      var period = getPeriodInfo(activity.hora_inicio);
      if (period.key !== lastPeriod) {
        lastPeriod = period.key;
        var heading = document.createElement("div");
        heading.className = "agenda-period-heading";
        heading.innerHTML = '<i class="' + period.icon + '"></i> <span>' + period.label + '</span>';
        listEl.appendChild(heading);
      }

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
    activeDay = findDefaultActiveDay();
    renderFilters(allSections);
    renderDayTabs();
    updateViewSwitchButtons();
    renderCurrentView();
  }

  // Eventos dos botões de alternância de visão
  if (btnViewBoard) {
    btnViewBoard.addEventListener("click", function () {
      currentView = "grade";
      try { localStorage.setItem("jacitec_agenda_view", "grade"); } catch (e) {}
      updateViewSwitchButtons();
      renderCurrentView();
    });
  }
  if (btnViewList) {
    btnViewList.addEventListener("click", function () {
      currentView = "lista";
      try { localStorage.setItem("jacitec_agenda_view", "lista"); } catch (e) {}
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
