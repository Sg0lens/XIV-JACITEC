/**
 * XV JACITEC — Planta Interativa do Campus (SVG)
 * Interações: Zoom/Pan no SVG, Árvores procedurais, Destaque e Localização de Prédios e Ambientes
 */
(function () {
  "use strict";

  function initCampusMap() {
    var svg = document.getElementById("campus-svg");
    var stage = document.getElementById("campus-map-stage");
    if (!svg || !stage) return;

    var zoomInBtn = document.getElementById("campus-zoom-in");
    var zoomOutBtn = document.getElementById("campus-zoom-out");
    var zoomResetBtn = document.getElementById("campus-zoom-reset");
    var hintEl = document.getElementById("campus-map-hint");

    var featuredLegendEl = document.getElementById("campus-legend-featured");
    var blocksLegendEl = document.getElementById("campus-legend-blocks");

    var mapData = window.CAMPUS_MAP_DATA || {};
    var activeId = null;
    var hintTimeout = null;

    // ------------------------------------------------------------------------
    // 1. Geração das Árvores Decorativas (Leve e Fiel ao Visual do Campus)
    // ------------------------------------------------------------------------
    function gerarArvores() {
      var gTrees = document.getElementById("cm-trees");
      if (!gTrees) return;

      var NS = "http://www.w3.org/2000/svg";
      var XLINK = "http://www.w3.org/1999/xlink";

      // Clusters densos e sobrepostos nas bordas externas (esquerda, topo e direita) e jardins
      var treePoints = [
        // BORDA ESQUERDA - Cluster denso e contínuo
        [20, 40, 1], [45, 30, 2], [70, 50, 3], [30, 80, 1], [55, 70, 2], [80, 85, 3],
        [25, 120, 2], [50, 115, 1], [75, 130, 3], [20, 160, 1], [45, 155, 2], [70, 175, 3],
        [15, 200, 2], [40, 205, 1], [65, 220, 3], [25, 250, 1], [50, 245, 2], [75, 260, 3],
        [20, 290, 2], [45, 295, 1], [70, 310, 3], [25, 340, 1], [50, 335, 2], [75, 355, 3],
        [20, 385, 2], [45, 380, 1], [70, 400, 3], [25, 430, 1], [50, 425, 2], [75, 445, 3],
        [20, 475, 2], [45, 470, 1], [70, 490, 3], [25, 520, 1], [50, 515, 2], [75, 535, 3],
        [20, 565, 2], [45, 560, 1], [70, 580, 3], [25, 610, 1], [50, 605, 2], [75, 625, 3],
        [20, 655, 2], [45, 650, 1], [70, 670, 3], [25, 700, 1], [50, 695, 2], [75, 715, 3],
        [20, 745, 2], [45, 740, 1], [70, 760, 3], [25, 790, 1], [50, 785, 2], [75, 805, 3],
        [25, 835, 2], [55, 830, 1], [85, 845, 3], [35, 875, 1], [70, 870, 2], [105, 885, 3],
        [60, 915, 2], [95, 910, 1], [130, 925, 3], [100, 950, 1], [140, 945, 2], [180, 955, 3],
        [150, 980, 2], [195, 975, 1], [240, 985, 3],

        // ENTRE AS VIAS DA ESQUERDA E PRÉDIO SOLAR
        [125, 180, 2], [150, 165, 1], [135, 220, 3], [160, 240, 2],
        [130, 280, 1], [155, 300, 2], [125, 345, 3], [150, 365, 1],
        [120, 410, 2], [145, 430, 3], [125, 480, 1], [150, 500, 2],
        [135, 550, 3], [160, 570, 1], [140, 620, 2], [165, 640, 3],
        [205, 150, 1], [235, 130, 2], [265, 140, 3], [295, 120, 1],
        [220, 200, 2], [250, 220, 3], [215, 260, 1], [245, 280, 2],
        [205, 320, 3], [235, 340, 1], [195, 390, 2], [225, 410, 3],

        // TOPO PERÍMETRO - Extensão de ponta a ponta
        [340, 60, 2], [370, 40, 1], [405, 55, 3], [440, 35, 2], [475, 50, 1],
        [510, 30, 3], [545, 45, 2], [580, 25, 1], [615, 40, 3], [650, 25, 2],
        [685, 40, 1], [720, 30, 3], [755, 45, 2], [790, 35, 1], [825, 50, 3],
        [860, 45, 2], [895, 60, 1], [930, 55, 3], [965, 70, 2],

        // AO REDOR DA QUADRA (Norte, Leste e Fundo)
        [620, 75, 2], [655, 85, 1], [690, 75, 3], [725, 90, 2],
        [850, 110, 1], [885, 105, 2], [920, 120, 3], [955, 115, 1],
        [860, 155, 2], [895, 150, 3], [930, 165, 1], [965, 160, 2],
        [875, 205, 3], [910, 200, 1], [945, 215, 2], [975, 210, 3],
        [885, 255, 1], [920, 250, 2], [955, 265, 3], [980, 260, 1],
        [870, 305, 2], [905, 300, 3], [940, 315, 1], [970, 310, 2],

        // BORDA DIREITA (Ao longo da via leste até a base)
        [880, 360, 1], [915, 355, 2], [950, 370, 3], [980, 365, 1],
        [890, 410, 2], [925, 405, 3], [960, 420, 1],
        [885, 460, 3], [920, 455, 1], [955, 470, 2],
        [895, 510, 1], [930, 505, 2], [965, 520, 3],
        [890, 560, 2], [925, 555, 3], [960, 570, 1],
        [900, 610, 3], [935, 605, 1], [970, 620, 2],
        [885, 660, 1], [920, 655, 2], [955, 670, 3],
        [895, 710, 2], [930, 705, 3], [965, 720, 1],
        [880, 760, 3], [915, 755, 1], [950, 770, 2],
        [890, 810, 1], [925, 805, 2], [960, 820, 3],
        [875, 860, 2], [910, 855, 3], [945, 870, 1],
        [885, 910, 3], [920, 905, 1], [955, 920, 2],
        [870, 960, 1], [905, 955, 2], [940, 970, 3],

        // JARDINS INTERNOS E ESPAÇOS VERDES AO REDOR DOS BLOCOS E COMPLEXO
        [350, 350, 2], [375, 375, 1], [355, 415, 3],
        [415, 290, 1], [445, 315, 2], [425, 350, 3],
        [465, 215, 2], [495, 195, 1], [520, 220, 3],
        [660, 355, 2], [680, 385, 1], [705, 365, 3],
        [710, 435, 1], [735, 415, 2], [755, 450, 3],
        [705, 520, 2], [730, 545, 1], [750, 525, 3],
        [620, 615, 3], [645, 640, 2], [630, 680, 1],
        [610, 730, 2], [635, 755, 3], [620, 795, 1],
        [565, 805, 2], [590, 835, 3], [555, 865, 1],
        [535, 895, 2], [560, 920, 3], [525, 945, 1]
      ];

      var frag = document.createDocumentFragment();
      treePoints.forEach(function (pt) {
        var x = pt[0];
        var y = pt[1];
        var type = pt[2] || 1;
        var use = document.createElementNS(NS, "use");
        use.setAttributeNS(XLINK, "href", "#cm-tree-" + type);
        use.setAttribute("href", "#cm-tree-" + type);
        use.setAttribute("x", x);
        use.setAttribute("y", y);
        frag.appendChild(use);
      });
      gTrees.appendChild(frag);
    }

    // ------------------------------------------------------------------------
    // 2. Construção da Legenda Lateral
    // ------------------------------------------------------------------------
    function construirLegenda() {
      if (featuredLegendEl) {
        featuredLegendEl.innerHTML = "";
        var featuredKeys = ["patio-central", "quadra", "lab-maker", "incubadora"];
        featuredKeys.forEach(function (key) {
          var item = mapData[key];
          if (!item) return;
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "campus-chip";
          btn.setAttribute("data-id", key);
          btn.innerHTML =
            '<div class="campus-chip__icon"><i class="fa-solid ' + (item.icone || "fa-location-dot") + '"></i></div>' +
            '<div class="campus-chip__text">' +
            "<strong>" + item.nome + "</strong>" +
            "<span>" + item.tipo + "</span>" +
            "</div>";
          btn.addEventListener("click", function () {
            selecionarLocal(key, true);
          });
          btn.addEventListener("mouseenter", function () {
            realcarPredio(key, true);
          });
          btn.addEventListener("mouseleave", function () {
            realcarPredio(key, false);
          });
          featuredLegendEl.appendChild(btn);
        });
      }

      if (blocksLegendEl) {
        blocksLegendEl.innerHTML = "";
        for (var i = 0; i <= 10; i++) {
          (function (n) {
            var key = "bloco-" + n;
            var item = mapData[key] || { nome: "Bloco " + n };
            var btn = document.createElement("button");
            btn.type = "button";
            btn.className = "campus-chip";
            btn.setAttribute("data-id", key);
            btn.textContent = "Bloco " + n;
            btn.addEventListener("click", function () {
              selecionarLocal(key, true);
            });
            btn.addEventListener("mouseenter", function () {
              realcarPredio(key, true);
            });
            btn.addEventListener("mouseleave", function () {
              realcarPredio(key, false);
            });
            blocksLegendEl.appendChild(btn);
          })(i);
        }
      }
    }

    // ------------------------------------------------------------------------
    // 3. Realce e Foco no Prédio
    // ------------------------------------------------------------------------
    function realcarPredio(id, estado) {
      var g = svg.querySelector('.building-group[data-id="' + id + '"]');
      if (g && id !== activeId) {
        g.classList.toggle("is-hover", estado);
      }
      var chip = document.querySelector('.campus-chip[data-id="' + id + '"]');
      if (chip && id !== activeId) {
        chip.classList.toggle("is-hover", estado);
      }
    }

    function desselecionar() {
      activeId = null;
      svg.querySelectorAll(".building-group").forEach(function (el) {
        el.classList.remove("is-active");
      });
      document.querySelectorAll(".campus-chip").forEach(function (el) {
        el.classList.remove("is-active");
      });
      if (hintEl) hintEl.classList.remove("is-visible");
    }

    function selecionarLocal(id, focarNoMapa) {
      var item = mapData[id];
      if (!item) return;

      if (activeId === id) {
        desselecionar();
        return;
      }

      activeId = id;

      // Atualiza classes ativas
      svg.querySelectorAll(".building-group").forEach(function (el) {
        el.classList.toggle("is-active", el.getAttribute("data-id") === id);
      });
      document.querySelectorAll(".campus-chip").forEach(function (el) {
        el.classList.toggle("is-active", el.getAttribute("data-id") === id);
      });

      // Exibe hint flutuante informativo
      if (hintEl) {
        hintEl.textContent = item.nome + (item.tipo ? " • " + item.tipo : "");
        hintEl.classList.add("is-visible");
        clearTimeout(hintTimeout);
        hintTimeout = setTimeout(function () {
          hintEl.classList.remove("is-visible");
        }, 2400);
      }

      // Foca no prédio no SVG com animação suave de zoom se solicitado
      if (focarNoMapa) {
        var g = svg.querySelector('.building-group[data-id="' + id + '"]');
        if (g) {
          try {
            var bbox = g.getBBox();
            var targetX = bbox.x + bbox.width / 2;
            var targetY = bbox.y + bbox.height / 2;
            panTo(targetX, targetY, 1.8);
          } catch (e) {}
        }
      }
    }

    // ------------------------------------------------------------------------
    // 4. Pan & Zoom Suave do SVG (ViewBox)
    // ------------------------------------------------------------------------
    var VB_ORIGINAL = { x: 0, y: 0, w: 1000, h: 1050 };
    var currentVB = { x: 0, y: 0, w: 1000, h: 1050 };
    var currentScale = 1;
    var minScale = 1;
    var maxScale = 2.6;

    function applyViewBox() {
      svg.setAttribute(
        "viewBox",
        currentVB.x + " " + currentVB.y + " " + currentVB.w + " " + currentVB.h
      );

      var isZoomed = currentScale > 1.05;
      stage.classList.toggle("is-zoomed", isZoomed);
      if (zoomOutBtn) zoomOutBtn.disabled = !isZoomed;
      if (zoomResetBtn) zoomResetBtn.disabled = !isZoomed;
      if (zoomInBtn) zoomInBtn.disabled = currentScale >= maxScale - 0.05;
    }

    function setZoom(newScale, focalX, focalY) {
      newScale = Math.max(minScale, Math.min(maxScale, newScale));
      currentScale = newScale;

      if (focalX === undefined) focalX = currentVB.x + currentVB.w / 2;
      if (focalY === undefined) focalY = currentVB.y + currentVB.h / 2;

      var newW = VB_ORIGINAL.w / newScale;
      var newH = VB_ORIGINAL.h / newScale;

      var normX = (focalX - currentVB.x) / currentVB.w;
      var normY = (focalY - currentVB.y) / currentVB.h;

      var newX = focalX - normX * newW;
      var newY = focalY - normY * newH;

      // Limites de deslocamento
      newX = Math.max(-50, Math.min(VB_ORIGINAL.w - newW + 50, newX));
      newY = Math.max(-50, Math.min(VB_ORIGINAL.h - newH + 50, newY));

      currentVB.w = newW;
      currentVB.h = newH;
      currentVB.x = newX;
      currentVB.y = newY;

      applyViewBox();
    }

    function panTo(targetX, targetY, targetScale) {
      targetScale = targetScale || currentScale;
      targetScale = Math.max(minScale, Math.min(maxScale, targetScale));

      var startX = currentVB.x;
      var startY = currentVB.y;
      var startW = currentVB.w;
      var startH = currentVB.h;

      var endW = VB_ORIGINAL.w / targetScale;
      var endH = VB_ORIGINAL.h / targetScale;
      var endX = Math.max(-50, Math.min(VB_ORIGINAL.w - endW + 50, targetX - endW / 2));
      var endY = Math.max(-50, Math.min(VB_ORIGINAL.h - endH + 50, targetY - endH / 2));

      var startTime = performance.now();
      var duration = 380; // ms

      function ease(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      }

      function step(now) {
        var elapsed = now - startTime;
        var p = Math.min(1, elapsed / duration);
        var k = ease(p);

        currentVB.x = startX + (endX - startX) * k;
        currentVB.y = startY + (endY - startY) * k;
        currentVB.w = startW + (endW - startW) * k;
        currentVB.h = startH + (endH - startH) * k;
        currentScale = VB_ORIGINAL.w / currentVB.w;

        applyViewBox();

        if (p < 1) {
          requestAnimationFrame(step);
        }
      }
      requestAnimationFrame(step);
    }

    function resetZoom() {
      panTo(VB_ORIGINAL.w / 2, VB_ORIGINAL.h / 2, 1);
    }

    // Controles de zoom
    if (zoomInBtn) {
      zoomInBtn.addEventListener("click", function () {
        setZoom(currentScale + 0.4);
      });
    }

    if (zoomOutBtn) {
      zoomOutBtn.addEventListener("click", function () {
        if (currentScale - 0.4 <= 1.05) {
          resetZoom();
        } else {
          setZoom(currentScale - 0.4);
        }
      });
    }

    if (zoomResetBtn) {
      zoomResetBtn.addEventListener("click", resetZoom);
    }

    // Wheel zoom sobre o mapa
    stage.addEventListener("wheel", function (e) {
      e.preventDefault();
      var rect = svg.getBoundingClientRect();
      var svgX = currentVB.x + ((e.clientX - rect.left) / rect.width) * currentVB.w;
      var svgY = currentVB.y + ((e.clientY - rect.top) / rect.height) * currentVB.h;
      var delta = e.deltaY < 0 ? 0.25 : -0.25;
      setZoom(currentScale + delta, svgX, svgY);
    }, { passive: false });

    // Drag / Pan com Pointer
    var isPanning = false;
    var startPtr = { x: 0, y: 0 };
    var startVB = { x: 0, y: 0 };

    stage.addEventListener("pointerdown", function (e) {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      if (currentScale <= 1.05) return;
      isPanning = true;
      startPtr.x = e.clientX;
      startPtr.y = e.clientY;
      startVB.x = currentVB.x;
      startVB.y = currentVB.y;
      stage.classList.add("is-panning");
      stage.setPointerCapture(e.pointerId);
    });

    stage.addEventListener("pointermove", function (e) {
      if (!isPanning) return;
      var rect = svg.getBoundingClientRect();
      var dx = ((e.clientX - startPtr.x) / rect.width) * currentVB.w;
      var dy = ((e.clientY - startPtr.y) / rect.height) * currentVB.h;

      currentVB.x = startVB.x - dx;
      currentVB.y = startVB.y - dy;

      currentVB.x = Math.max(-50, Math.min(VB_ORIGINAL.w - currentVB.w + 50, currentVB.x));
      currentVB.y = Math.max(-50, Math.min(VB_ORIGINAL.h - currentVB.h + 50, currentVB.y));

      applyViewBox();
    });

    function endPan(e) {
      if (!isPanning) return;
      isPanning = false;
      stage.classList.remove("is-panning");
      try {
        stage.releasePointerCapture(e.pointerId);
      } catch (err) {}
    }

    stage.addEventListener("pointerup", endPan);
    stage.addEventListener("pointercancel", endPan);

    // Duplo clique alterna zoom
    stage.addEventListener("dblclick", function (e) {
      var rect = svg.getBoundingClientRect();
      var svgX = currentVB.x + ((e.clientX - rect.left) / rect.width) * currentVB.w;
      var svgY = currentVB.y + ((e.clientY - rect.top) / rect.height) * currentVB.h;
      if (currentScale > 1.2) {
        resetZoom();
      } else {
        setZoom(2.0, svgX, svgY);
      }
    });

    // Touch Pinch Zoom
    var touchDistStart = 0;
    var touchScaleStart = 1;
    stage.addEventListener("touchstart", function (e) {
      if (e.touches.length === 2) {
        var dx = e.touches[0].clientX - e.touches[1].clientX;
        var dy = e.touches[0].clientY - e.touches[1].clientY;
        touchDistStart = Math.hypot(dx, dy);
        touchScaleStart = currentScale;
      }
    }, { passive: true });

    stage.addEventListener("touchmove", function (e) {
      if (e.touches.length === 2 && touchDistStart > 0) {
        e.preventDefault();
        var dx = e.touches[0].clientX - e.touches[1].clientX;
        var dy = e.touches[0].clientY - e.touches[1].clientY;
        var dist = Math.hypot(dx, dy);
        var ratio = dist / touchDistStart;
        setZoom(touchScaleStart * ratio);
      }
    }, { passive: false });

    // ------------------------------------------------------------------------
    // 5. Cliques e Teclado nos Prédios do SVG
    // ------------------------------------------------------------------------
    svg.querySelectorAll(".building-group").forEach(function (group) {
      var id = group.getAttribute("data-id");
      group.addEventListener("click", function (e) {
        e.stopPropagation();
        selecionarLocal(id, false);
      });
      group.addEventListener("mouseenter", function () {
        realcarPredio(id, true);
      });
      group.addEventListener("mouseleave", function () {
        realcarPredio(id, false);
      });
      group.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selecionarLocal(id, false);
        }
      });
    });

    // Clique fora desmarca seleção
    stage.addEventListener("click", function (e) {
      if (!e.target.closest(".building-group") && !e.target.closest(".campus-map__ctrl")) {
        desselecionar();
      }
    });

    // Inicialização
    gerarArvores();
    construirLegenda();
    applyViewBox();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCampusMap);
  } else {
    initCampusMap();
  }
})();
