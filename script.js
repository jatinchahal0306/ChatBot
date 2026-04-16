const chatBox = document.getElementById("chatBox");

function loadFile() {
    const file = document.getElementById("fileInput").files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {
        let content = e.target.result;

        try {
            const json = JSON.parse(content);
            parseResponse(json);
        } catch {
            parseResponse(content);
        }
    };

    reader.readAsText(file);
}

function parseResponse(data) {
    if (typeof data === "string") {
        renderTXT(data);
    } else {
        renderJSON(data);
    }
}

function renderJSON(data) {
    const container = document.createElement("div");
    container.className = "message";

    let html = `<h3>${data.survey_title || ""}</h3>`;

    (data.sections || []).forEach(section => {
        html += `<div class="section"><h4>${section.section_name}</h4>`;

        (section.questions || []).forEach(q => {
            html += renderQuestion(q);
        });

        html += `</div>`;
    });

    html += `<button onclick="submitAnswers()">Submit</button>`;

    container.innerHTML = html;
    chatBox.innerHTML = "";
    chatBox.appendChild(container);
}

function renderQuestion(q) {
    let html = `<div class="question" data-id="${q.question_id}">
    <p><b>${q.question_id}:</b> ${q.question_text}</p>
  `;

    if (q.response_type === "multi_choice") {
        (q.options || []).forEach(opt => {
            html += `<label><input type="checkbox" value="${opt}">${opt}</label>`;
        });
    }
    else if (q.response_type === "single_choice") {
        (q.options || []).forEach(opt => {
            html += `<label><input type="radio" name="${q.question_id}" value="${opt}">${opt}</label>`;
        });
    }
    else {
        html += `<input type="text" placeholder="Your answer..." />`;
    }

    html += `</div>`;
    return html;
}

function renderTXT(text) {
    const container = document.createElement("div");
    container.className = "message";

    const lines = text.split("\n");

    let html = "";
    let currentQ = null;
    let isOpenText = false;

    lines.forEach(line => {
        line = line.trim();

        if (line.startsWith("Survey Title")) {
            html += `<h3>${line.split(":")[1]}</h3>`;
        }
        else if (line.startsWith("Section")) {
            html += `<div class="section"><h4>${line.split(":")[1]}</h4>`;
        }
        else if (line.startsWith("Question ID")) {
            currentQ = line.split(":")[1].trim();
            html += `<div class="question" data-id="${currentQ}"><b>${currentQ}</b>`;
            isOpenText = false;
        }
        else if (line.startsWith("Question Text")) {
            html += `<p>${line.split(":")[1]}</p>`;
        }
        else if (line.startsWith("Response Type")) {
            if (line.includes("open_text")) {
                isOpenText = true;
            }
        }
        else if (line.startsWith("Options")) {
            const opts = line.split(":")[1].split(",");
            opts.forEach(opt => {
                html += `<label><input type="radio" name="${currentQ}" value="${opt}">${opt}</label>`;
            });
            html += `</div>`;
        }
        else if (isOpenText && line === "") {
            html += `<input type="text" />`;
            html += `</div>`;
        }
    });

    html += `<button onclick="submitAnswers()">Submit</button>`;

    container.innerHTML = html;
    chatBox.innerHTML = "";
    chatBox.appendChild(container);
}

function submitAnswers() {
    let txtOutput = "";

    const surveyTitle = document.querySelector("h3")?.innerText || "";
    txtOutput += `Survey Title: ${surveyTitle}\n\n`;

    document.querySelectorAll(".section").forEach(section => {
        const sectionName = section.querySelector("h4")?.innerText || "";
        txtOutput += `Section: ${sectionName}\n\n`;

        section.querySelectorAll(".question").forEach(q => {
            const id = q.getAttribute("data-id");

            const radio = q.querySelector("input[type=radio]:checked");
            const checks = q.querySelectorAll("input[type=checkbox]:checked");
            const text = q.querySelector("input[type=text]");

            let ans = "";

            if (radio) ans = radio.value;
            else if (checks.length) ans = Array.from(checks).map(c => c.value).join(", ");
            else if (text) ans = text.value;

            txtOutput += `Question ID: ${id}\n`;
            txtOutput += `Answer: ${ans || "No response"}\n\n`;
        });
    });

    const blob = new Blob([txtOutput], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "response.txt";
    a.click();
}