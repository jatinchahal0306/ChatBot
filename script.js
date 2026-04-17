const chatBox = document.getElementById("chatBox");
const BASE_URL = "http://136.119.158.223:8000";

async function sendMessage() {
    const input = document.getElementById("promptInput");
    const message = input.value.trim();
    if (!message) return;

    chatBox.innerHTML = "<p>Loading...</p>";

    try {
        const res = await fetch(`${BASE_URL}/send-message`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message })
        });

        const data = await res.json();

        if (data.success && data.parsed_json) {
            renderJSON(data.parsed_json);
        } else {
            chatBox.innerHTML = "<p>Error loading response</p>";
        }

    } catch {
        chatBox.innerHTML = "<p>Server error</p>";
    }

    input.value = "";
}

async function clearChat() {
    try {
        await fetch(`${BASE_URL}/clear-chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({})
        });
    } catch { }

    chatBox.innerHTML = "";
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

async function submitAnswers() {
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

    downloadTXT(txtOutput);

    try {
        await fetch(`${BASE_URL}/send-message`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: txtOutput
            })
        });

        alert("Responses sent to chatbot");

    } catch {
        alert("Error sending responses");
    }
}

function downloadTXT(content) {
    const blob = new Blob([content], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "response.txt";
    a.click();
}