document.addEventListener("DOMContentLoaded", function () {
    let days = {};
    let content;
    let theme = "Nenhum"

    // Faz uma requisição para obter os dados da agenda de eventos
    fetch("https://qrcheck.distrito28.com.br/evento/agenda")
        .then((response) => response.json())
        .then((data) => renderSchedule(data));

    // Função que renderiza a agenda de eventos
    function renderSchedule(palestras) {
        // Ordena as palestras pelo horário de início
        palestras.sort((a, b) =>
            a.horario_inicio.localeCompare(b.horario_inicio)
        );

        // Organiza as palestras no objeto days por data e horário
        palestras.forEach((palestra) => {
            const date = palestra.data;
            if (!days[date]) {
                days[date] = [];
            }

            // Adiciona a palestra no dia correspondente
            days[date].push(palestra);
        });

        content = document.createElement("div");
        content.className = "tab-content table-responsive";

        const tabBar = document.createElement("div");
        tabBar.className = "nav nav-tabs";

        let firstTab = true;
        let firstTheme = true;
        const buttons = document.querySelectorAll(".filter-button");
        buttons.forEach(button => {
            if (firstTheme) {
                button.classList.add("active");
                firstTheme = false;
            }
            if (button.classList.contains("active")){
                theme = button.value;
            }
        });

        // Ordena os dias e percorre para criar uma aba para cada data
        const sortedDays = Object.keys(days).sort(
            (a, b) => new Date(a) - new Date(b)
        );

        sortedDays.forEach((date, index) => {
            const tabButton = document.createElement("button");
            tabButton.className = "nav-link";
            tabButton.innerText = formatDate(date);
            tabButton.id = `tab-${date}`;

            if (firstTab) {
                tabButton.classList.add("active");
                firstTab = false;

                const dayContent = document.createElement("div");
                dayContent.id = `content-${date}`;
                dayContent.className = "tab-pane fade show active";
                dayContent.appendChild(createTable(days[date]));
                content.appendChild(dayContent);
            }

            tabButton.addEventListener("click", () => openTab(date));
            tabBar.appendChild(tabButton);
        });

        filterByThemeAndDate(theme);

        const container = document.getElementById("tables-container");
        container.appendChild(tabBar);
        container.appendChild(content);
    }

    function openTab(dayId) {
        const allTabs = document.querySelectorAll(".nav-link");
        const allContents = document.querySelectorAll(".tab-pane");

        allTabs.forEach((tab) => {
            tab.classList.remove("active");
            if (tab.id === `tab-${dayId}`) {
                tab.classList.add("active");
            }
        });

        // if (button.id == `filter-${selectedTheme}`) {
        //     button.classList.add("active");
        // }

        allContents.forEach((content) => {
            content.classList.remove("show", "active");
            if (content.id === `content-${dayId}`) {
                content.classList.add("show", "active");
                updateTableContent(dayId);
            } else if (!document.getElementById(`content-${dayId}`)) {
                const newContent = document.createElement("div");
                newContent.id = `content-${dayId}`;
                newContent.className = "tab-pane fade show active";
                newContent.appendChild(createTable(days[dayId]));
                document.querySelector(".tab-content").appendChild(newContent);
            }
        });
    }

    // Função para criar a tabela de palestras para cada dia
    function createTable(schedule) {
        console.log(schedule)
        console.log(theme)
        const table = document.createElement("table");
        table.className = "table table-hover table-fixed table-bordered schedule-table";

        // Cria o cabeçalho da tabela
        const thead = document.createElement("thead");
        thead.className = "table-secondary";
        thead.innerHTML = `
            <tr>
                <th>Horário</th>
                <th>Atividade/Evento</th>
                <th>Local</th>
            </tr>`;
        table.appendChild(thead);

        // Cria o corpo da tabela
        const tbody = document.createElement("tbody");

        schedule.forEach((palestra) => {
            if (theme === "Nenhum" || palestra.tema === theme) {
                const row = document.createElement("tr");
                row.classList.add(palestra.tipo); // Adiciona a classe com o tipo do evento
                row.innerHTML = `
                    <td>${formatTime(palestra.horario_inicio)} - ${formatTime(palestra.horario_termino)}</td>
                    <td>${palestra.palestra}</td>
                    <td>${palestra.bloco + " " + palestra.sala}</td>`;
                tbody.appendChild(row);
            }
        });

        table.appendChild(tbody);

        return table;
    }

    function filterByThemeAndDate(selectedTheme) {
        theme = selectedTheme;
        const buttons = document.querySelectorAll(".filter-button");

        buttons.forEach(button => {
            button.classList.remove("active")
            if (button.id == `filter-${selectedTheme}`) {
                button.classList.add("active");
            }
        });

        const activeTab = document.querySelector(".nav-link.active");
        const dayId = activeTab ? activeTab.id.replace("tab-", "") : null;

        if (dayId) {
            updateTableContent(dayId);
        }
    }

    window.filterByThemeAndDate = filterByThemeAndDate;

    function updateTableContent(dayId) {
        const dayContent = document.getElementById(`content-${dayId}`);
        if (dayContent) {
            dayContent.innerHTML = "";
            dayContent.appendChild(createTable(days[dayId]));
        }
    }

    // Função que formata o horário no formato hh:mm
    function formatTime(time) {
        return time.split(":").slice(0, 2).join(":");
    }

    // Função que formata a data em um estilo longo (segunda-feira, 2 de outubro de 2024)
    function formatDate(dateStr) {
        const options = {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            timeZone: "UTC",
        };
        return new Date(dateStr).toLocaleDateString("pt-BR", options);
    }
});