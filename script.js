const chatBox = document.getElementById("chatBox");

async function sendMessage() {
    const input = document.getElementById("promptInput");
    const message = input.value.trim();
    if (!message) return;

    addMessage(message, "user");
    input.value = "";

    try {
        const res = await fetch("http://136.119.158.223:8000/send-message", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message })
        });

        const data = await res.json();

        if (data.parsed_json) {
            const json = typeof data.parsed_json === "string"
                ? JSON.parse(data.parsed_json)
                : data.parsed_json;

            renderJSON(json);
        } else {
            addMessage(data.assistant_text, "bot");
        }

    } catch (err) {
        addMessage("Server error", "bot");
    }
}

function addMessage(text, sender) {
    const div = document.createElement("div");
    div.className = `message ${sender}`;
    div.innerText = text;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function renderJSON(data) {
    const container = document.createElement("div");
    container.className = "message bot";

    let html = `<h3>${data.survey_title}</h3>`;

    data.sections.forEach(section => {
        html += `<div class="section"><h4>${section.section_name}</h4>`;

        section.questions.forEach(q => {
            html += renderQuestion(q);
        });

        html += `</div>`;
    });

    html += `<button onclick="submitAnswers()">Submit</button>`;

    container.innerHTML = html;
    chatBox.appendChild(container);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function renderQuestion(q) {
    let html = `<div class="question" data-id="${q.question_id}">
        <p><b>${q.question_id}:</b> ${q.question_text}</p>
    `;

    if (q.response_type === "multi_choice") {
        q.options.forEach(opt => {
            html += `<label><input type="checkbox" value="${opt}">${opt}</label>`;
        });
    } else if (q.response_type === "single_choice") {
        q.options.forEach(opt => {
            html += `<label><input type="radio" name="${q.question_id}" value="${opt}">${opt}</label>`;
        });
    } else {
        html += `<input type="text" placeholder="Your answer..." />`;
    }

    html += `</div>`;
    return html;
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