/**
 * XV JACITEC — Dados da Planta Interativa do Campus
 * ---------------------------------------------------------------------------
 * Edite este arquivo para alterar o que aparece ao clicar em cada local.
 *
 *  - A chave (ex.: "bloco-3") precisa ser igual ao data-id do <g> no SVG.
 *  - "agendaLocais": nomes de local EXATOS usados no agenda.json (QRCheck).
 *    As atividades desses locais são carregadas automaticamente.
 *  - "atividades": lista manual (usada junto com as da agenda). Formato:
 *      { dia: "21/10", inicio: "08:00", fim: "10:00",
 *        titulo: "Minicurso de Python", sala: "Sala 301", tipo: "Minicurso" }
 */
window.CAMPUS_MAP_DATA = {
  "patio-central": {
    nome: "Pátio Central",
    tipo: "Convivência e cultura",
    icone: "fa-people-roof",
    destaque: true,
    descricao: "Coração do campus: ponto de encontro, credenciamento e atividades abertas ao público.",
    agendaLocais: ["Pátio Central"],
    atividades: []
  },
  "lab-maker": {
    nome: "Lab Maker",
    tipo: "Laboratório de inovação",
    icone: "fa-microchip",
    destaque: true,
    descricao: "Espaço de prototipagem, fabricação digital e oficinas práticas.",
    agendaLocais: ["LAB. MAKER", "Lab Maker"],
    atividades: []
  },
  "quadra": {
    nome: "Quadra",
    tipo: "Quadra poliesportiva",
    icone: "fa-basketball",
    destaque: true,
    descricao: "Quadra poliesportiva coberta do campus.",
    agendaLocais: ["Quadra"],
    atividades: []
  },
  "incubadora": {
    nome: "Incubadora",
    tipo: "Empreendedorismo",
    icone: "fa-rocket",
    destaque: true,
    descricao: "Incubadora de empresas do campus, ao lado do Bloco 5.",
    agendaLocais: ["Incubadora"],
    atividades: []
  },
  "bloco-0": { nome: "Bloco 0", tipo: "Salas e laboratórios", descricao: "Bloco mais próximo do prédio principal.", agendaLocais: ["Bloco 0"], atividades: [] },
  "bloco-1": { nome: "Bloco 1", tipo: "Salas e laboratórios", descricao: "Salas de aula e laboratórios.", agendaLocais: ["Bloco 1"], atividades: [] },
  "bloco-2": { nome: "Bloco 2", tipo: "Salas e laboratórios", descricao: "Salas de aula e laboratórios.", agendaLocais: ["Bloco 2"], atividades: [] },
  "bloco-3": { nome: "Bloco 3", tipo: "Salas e laboratórios", descricao: "Salas de aula e laboratórios.", agendaLocais: ["Bloco 3"], atividades: [] },
  "bloco-4": { nome: "Bloco 4", tipo: "Salas e laboratórios", descricao: "Salas de aula e laboratórios.", agendaLocais: ["Bloco 4"], atividades: [] },
  "bloco-5": { nome: "Bloco 5", tipo: "Salas e laboratórios", descricao: "Salas de aula e laboratórios. A Incubadora fica ao lado.", agendaLocais: ["Bloco 5"], atividades: [] },
  "bloco-6": { nome: "Bloco 6", tipo: "Salas e laboratórios", descricao: "Salas de aula e laboratórios.", agendaLocais: ["Bloco 6"], atividades: [] },
  "bloco-7": { nome: "Bloco 7", tipo: "Salas e laboratórios", descricao: "Salas de aula e laboratórios.", agendaLocais: ["Bloco 7"], atividades: [] },
  "bloco-8": { nome: "Bloco 8", tipo: "Salas e laboratórios", descricao: "Salas de aula e laboratórios.", agendaLocais: ["Bloco 8"], atividades: [] },
  "bloco-9": { nome: "Bloco 9", tipo: "Salas e laboratórios", descricao: "Salas de aula e laboratórios.", agendaLocais: ["Bloco 9"], atividades: [] },
  "bloco-10": { nome: "Bloco 10", tipo: "Salas e laboratórios", descricao: "Bloco mais ao alto do corredor, próximo à Quadra.", agendaLocais: ["Bloco 10"], atividades: [] }
};
