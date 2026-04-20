const BASE = "api";

function addMessage(text, type) {
    const box = document.getElementById("chatBox");
    const div = document.createElement("div");
    div.className = "message " + type;
    div.setAttribute("data-label", type === "user" ? "You" : "Bot");
    div.innerText = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

async function sendMessage() {
    const input = document.getElementById("userInput");
    const msg = input.value.trim();
    if (!msg) return;


    setLoading(true);
    addMessage(msg, "user");
    input.value = "";
    showTyping();

    try {
        const res = await fetch(BASE + "/send-message", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: msg })
        });

        const data = await res.json();
        removeTyping();

        if (data.parsed_json) {
            addMessage("Survey generated", "bot");
            renderSurvey(data.parsed_json);
        } else if (data.assistant_text) {
            addMessage(data.assistant_text, "bot");
        } else {
            addMessage("No valid response", "bot");
        }

    } catch {
        removeTyping();
        addMessage("Server error", "bot");
    }

    setLoading(false);


}

function renderSurvey(data) {
    const box = document.getElementById("chatBox");


    const div = document.createElement("div");
    div.className = "message bot";
    div.setAttribute("data-label", "Bot");

    let html = `<b>📋 ${data.survey_title || "Survey"}</b><br><br>`;

    if (!data.sections || data.sections.length === 0) {
        html += "No questions available";
    } else {
        data.sections.forEach((sec, secIndex) => {

            html += `<div class="section"><b>${sec.section_name}</b><br><br>`;

            sec.questions?.forEach((q, index) => {

                html += `<div class="question">`;
                html += `<b>Q${index + 1}. ${q.question_text}</b><br>`;

                if (q.response_type === "single_choice") {
                    html += `<small style="color:gray;">(Select one option)</small><br>`;

                    q.options?.forEach(opt => {
                        html += `
                        <label>
                            <input type="radio" name="sec${secIndex}_q${index}">
                            ${opt}
                        </label><br>
                    `;
                    });
                }

                else if (q.response_type === "multi_choice") {
                    html += `<small style="color:gray;">(Select one or more options)</small><br>`;

                    q.options?.forEach(opt => {
                        html += `
                        <label>
                            <input type="checkbox">
                            ${opt}
                        </label><br>
                    `;
                    });
                }

                else {
                    html += `<small style="color:gray;">(Type your answer)</small><br>`;
                    html += `<input type="text" placeholder="Enter your answer"><br>`;
                }

                html += `</div><br>`;
            });

            html += `</div>`;
        });
    }

    div.innerHTML = html;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;


}

function loadChat() {
    const chatBox = document.getElementById("chatBox");
    chatBox.innerHTML = "";


    fetch(BASE + "/get-chat")
        .then(res => res.json())
        .then(data => {
            data.messages.forEach(msg => {
                if (msg.role === "user") {
                    addMessage(msg.content, "user");
                } else {
                    if (typeof msg.content === "string") {
                        addMessage(msg.content, "bot");
                    } else if (msg.content && msg.content.sections) {
                        renderSurvey(msg.content);
                    }
                }
            });

            setTimeout(() => {
                chatBox.scrollTop = chatBox.scrollHeight;
            }, 100);

        })
        .catch(() => {
            addMessage("Failed to load chat", "bot");
        });


}

async function clearChat() {
    await fetch(BASE + "/clear-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
    });
    document.getElementById("chatBox").innerHTML = "";
}

function showTyping() {
    const box = document.getElementById("chatBox");


    const div = document.createElement("div");
    div.className = "message bot typing-indicator";
    div.setAttribute("data-label", "Bot");

    div.innerHTML = `
    <div class="typing">
        <span></span>
        <span></span>
        <span></span>
    </div>
`;

    box.appendChild(div);
    box.scrollTop = box.scrollHeight;


}

function removeTyping() {
    document.querySelectorAll(".typing-indicator").forEach(el => el.remove());
}

function setLoading(isLoading) {
    const input = document.getElementById("userInput");
    const buttons = document.querySelectorAll(".input-area button");


    input.disabled = isLoading;

    buttons.forEach(btn => {
        btn.disabled = isLoading;
        btn.style.opacity = isLoading ? "0.6" : "1";
        btn.style.cursor = isLoading ? "not-allowed" : "pointer";
    });


}

document.getElementById("userInput").addEventListener("keypress", function (e) {
    if (e.key === "Enter") sendMessage();
});

window.addEventListener("DOMContentLoaded", () => {
    loadChat();
});
