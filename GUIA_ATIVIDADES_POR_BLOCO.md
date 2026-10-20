# Guia de Implementação: Atividades por Bloco na Planta do Campus

> **Documento Técnico para a Comissão Organizadora e Desenvolvedores da JACITEC**  
> Este guia detalha a arquitetura, pré-requisitos de dados e o passo a passo para reativar no futuro a funcionalidade de **consulta de atividades da programação por bloco/espaço** na planta interativa interligada ao `agenda.json`.

---

## 1. Contexto e Motivação

A planta interativa em SVG permite aos participantes se orientarem no campus do Ifes Cachoeiro. O objetivo da funcionalidade de **"Atividades por Bloco"** é enriquecer essa experiência: ao clicar em qualquer bloco (0 a 10), na Quadra, no Lab Maker ou no Pátio Central, o sistema abre uma gaveta com a programação em tempo real (palestras, minicursos, oficinas e apresentações) alocada naquele espaço.

### Por que a função foi pausada temporariamente?
No arquivo `agenda.json` atual, grande parte das atividades ainda possui campos de localização genéricos (como *"Auditório"*, *"Salas de Aula"*, *"Laboratório"*) sem vincular explicitamente a numeração oficial dos blocos (ex.: *"Bloco 3 - Sala 12"*, *"Bloco 8 - Lab Maker"*, *"Bloco 2 - Auditório"*). Se ativada antes da homologação final das salas pela comissão de ensalamento, blocos inteiros exibiriam o aviso de *"Nenhuma atividade específica listada"*, gerando ruído e sensação de incompletude para o usuário.

Assim que a comissão fechar o ensalamento definitivo da programação, basta seguir o roteiro abaixo.

---

## 2. Padronização dos Dados em `agenda.json`

Para que o filtro funcione automaticamente, o campo `local.nome` dentro de cada objeto da `agenda.json` deve conter o nome padronizado do bloco ou de suas salas.

### Estrutura recomendada de um item em `agenda.json`:
```json
{
  "id": 142,
  "titulo": "Minicurso: Robótica Educacional com Arduino",
  "tipo": "Minicurso",
  "data_inicio": "2026-10-21T14:00:00",
  "hora_inicio": "14:00",
  "hora_fim": "17:00",
  "local": {
    "nome": "Bloco 4 - Sala 201",
    "bloco": "bloco-4"
  },
  "ministrantes": ["Profª. Dra. Ana Souza"]
}
```

> **Dica:** O campo opcional `local.bloco` com o ID exato (ex.: `"bloco-4"`, `"lab-maker"`, `"quadra"`, `"patio-central"`, `"incubadora"`) elimina qualquer ambiguidade de texto.

---

## 3. Dicionário de Ambientes (`js/campus-map-data.js`)

O arquivo [js/campus-map-data.js](file:///c:/Users/marcos/XIV-JACITEC/js/campus-map-data.js) já está pronto e mapeia cada elemento do SVG com seus apelidos (`agendaLocais`):

| ID do SVG | Nome Exibido | Exemplo de `agendaLocais` (termos que ativam o bloco) |
|---|---|---|
| `patio-central` | Pátio Central | `["Pátio Central", "Pátio", "Área de Convivência", "Tenda"]` |
| `lab-maker` | Lab Maker | `["Lab Maker", "Laboratório Maker", "Inovação"]` |
| `quadra` | Quadra | `["Quadra", "Quadra Poliesportiva", "Ginásio"]` |
| `incubadora` | Incubadora | `["Incubadora", "Incubadora de Empresas", "Núcleo de Inovação"]` |
| `bloco-0` | Bloco 0 | `["Bloco 0", "Salas do Bloco 0"]` |
| `bloco-1` | Bloco 1 | `["Bloco 1", "Sala 101", "Sala 102"]` |
| `bloco-2` | Bloco 2 | `["Bloco 2", "Auditório", "Auditório Principal"]` |
| `bloco-3` até `10` | Bloco 3 a 10 | `["Bloco X", "Lab X", "Sala X"]` |

Caso uma sala específica pertença a um bloco (por exemplo, "Laboratório de Redes" no Bloco 6), basta adicionar `"Laboratório de Redes"` no array `agendaLocais` do `bloco-6` em `js/campus-map-data.js`.

---

## 4. Código HTML da Gaveta de Detalhes (`index.html`)

Dentro de `<aside class="campus-panel">` na seção `#local` do `index.html`, insira a estrutura do modal/drawer:

```html
<!-- Gaveta Modal de Detalhes de Atividades -->
<div class="campus-detail" id="campus-detail" role="dialog" aria-labelledby="campus-detail-title" hidden>
  <span class="campus-detail__handle" aria-hidden="true"></span>
  <div class="campus-detail__top">
    <span class="campus-panel__badge" id="campus-detail-type">Ambiente</span>
    <button type="button" class="campus-detail__close" id="campus-detail-close" aria-label="Fechar detalhes">
      <i class="fa-solid fa-xmark"></i>
    </button>
  </div>
  <h3 id="campus-detail-title">Nome do Bloco</h3>
  <p class="campus-detail__desc" id="campus-detail-desc"></p>

  <p class="campus-legend__label">Atividades neste local</p>
  <div class="campus-detail__list" id="campus-detail-list">
    <!-- Itens inseridos dinamicamente via JS -->
  </div>

  <a class="btn btn-primary btn-sm" href="agenda.html">
    <i class="fa-regular fa-calendar"></i> Ver programação completa
  </a>
</div>

<!-- Fundo escuro para fechar ao tocar fora no mobile -->
<div class="campus-backdrop" id="campus-backdrop" hidden></div>
```

---

## 5. Lógica JavaScript para Integração (`js/campus-map.js`)

Adicione o carregamento da agenda e a renderização no arquivo [js/campus-map.js](file:///c:/Users/marcos/XIV-JACITEC/js/campus-map.js):

### 5.1. Cache e Carregamento Assíncrono
```javascript
var agendaCache = null;

function carregarAgenda(callback) {
  if (agendaCache) {
    callback(agendaCache);
    return;
  }
  fetch("agenda.json")
    .then(function (res) {
      if (!res.ok) throw new Error("Status " + res.status);
      return res.json();
    })
    .then(function (json) {
      agendaCache = (json && json.data) || json || [];
      callback(agendaCache);
    })
    .catch(function () {
      agendaCache = [];
      callback([]);
    });
}
```

### 5.2. Filtragem e Renderização das Atividades
```javascript
function renderizarAtividades(localItem, todasAtividades) {
  var listEl = document.getElementById("campus-detail-list");
  if (!listEl) return;

  var nomesLocais = (localItem.agendaLocais || []).map(function (n) {
    return n.toLowerCase().trim();
  });

  // Filtra atividades pelo nome do local ou bloco
  var encontradas = todasAtividades.filter(function (ativ) {
    if (ativ.local && ativ.local.bloco && ativ.local.bloco === localItem.id) {
      return true;
    }
    if (!ativ.local || !ativ.local.nome) return false;
    var nomeAtiv = ativ.local.nome.toLowerCase().trim();
    return nomesLocais.some(function (alias) {
      return nomeAtiv.indexOf(alias) !== -1 || alias.indexOf(nomeAtiv) !== -1;
    });
  });

  if (encontradas.length === 0) {
    listEl.innerHTML =
      '<div class="campus-detail__empty">' +
      '<i class="fa-regular fa-calendar-check"></i>' +
      '<p>Nenhuma atividade específica listada para este local no momento. Consulte a programação geral.</p>' +
      '</div>';
    return;
  }

  // Ordena por horário de início
  encontradas.sort(function (a, b) {
    return (a.hora_inicio || "").localeCompare(b.hora_inicio || "");
  });

  listEl.innerHTML = encontradas.map(function (ativ) {
    var horaInicio = (ativ.hora_inicio || "").slice(0, 5);
    var horaFim = (ativ.hora_fim || "").slice(0, 5);
    var dataStr = ativ.data_inicio ? ativ.data_inicio.split("T")[0] : "";
    var tipoStr = ativ.tipo || "Atividade";
    var tituloStr = ativ.titulo || ativ.nome || "Atividade da Jornada";

    return (
      '<article class="campus-activity">' +
      '  <div class="campus-activity__time">' +
      '    ' + (horaInicio || "--:--") +
      '    ' + (horaFim ? '<small>às ' + horaFim + '</small>' : '') +
      '  </div>' +
      '  <div class="campus-activity__body">' +
      '    <strong>' + tituloStr + '</strong>' +
      '    <span>' + tipoStr + (dataStr ? ' • ' + dataStr : '') + '</span>' +
      '  </div>' +
      '</article>'
    );
  }).join("");
}
```

### 5.3. Chamada ao Selecionar o Local
Dentro de `selecionarLocal(id, focarNoMapa)`:
```javascript
var detailEl = document.getElementById("campus-detail");
var backdropEl = document.getElementById("campus-backdrop");
var titleEl = document.getElementById("campus-detail-title");
var typeEl = document.getElementById("campus-detail-type");
var descEl = document.getElementById("campus-detail-desc");
var listEl = document.getElementById("campus-detail-list");

if (detailEl) {
  titleEl.textContent = item.nome;
  typeEl.textContent = item.tipo || "Ambiente do Campus";
  descEl.textContent = item.descricao || "";
  listEl.innerHTML = '<div style="text-align:center; padding: 14px;"><i class="fa-solid fa-spinner fa-spin"></i> Carregando atividades...</div>';

  detailEl.hidden = false;
  if (backdropEl) backdropEl.hidden = false;

  carregarAgenda(function (todasAtividades) {
    renderizarAtividades(item, todasAtividades);
  });
}
```

---

## 6. Estilos CSS Já Configurados (`css/campus-map.css`)

O arquivo [css/campus-map.css](file:///c:/Users/marcos/XIV-JACITEC/css/campus-map.css) já possui todas as regras estilizadas, responsivas e testadas:
- No **Desktop**: O painel `.campus-detail` surge suavemente dentro da coluna lateral do mapa, sem tampar o SVG.
- No **Mobile**: Transforma-se em um **Bottom Sheet Modal** nativo com puxador (`.campus-detail__handle`), cantos arredondados, backdrop escuro translúcido com `backdrop-filter: blur(4px)` e botão de fechar (`#campus-detail-close`).
- Scroll interno com `max-height: 52vh` para listas longas.

---

## 7. Checklist de Homologação para a Reativação

- [ ] 1. **Homologação das Salas**: Validar com a comissão os nomes das salas no `agenda.json`.
- [ ] 2. **Alias no Dicionário**: Revisar o arquivo `js/campus-map-data.js` para conferir se todos os apelidos de salas constam em `agendaLocais`.
- [ ] 3. **Inserção do HTML**: Inserir `#campus-detail` e `#campus-backdrop` no `index.html`.
- [ ] 4. **Ativação no JS**: Adicionar `carregarAgenda` e `renderizarAtividades` em `js/campus-map.js`.
- [ ] 5. **Subtítulo da Seção**: Voltar o texto do subtítulo para: *"Toque em um prédio da planta para ver quais atividades da XV JACITEC acontecem lá."*.
- [ ] 6. **Teste no Navegador**: Testar clique em múltiplos blocos, tanto no computador quanto no celular (resolução 390x844).
