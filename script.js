const BASE = "/api";
const MOCK_MODE = false;
const THREAD_ID = "default_session";

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
    if (MOCK_MODE) {

        setTimeout(() => {

            removeTyping();

            let data;

            if (msg.toLowerCase().includes("survey")) {

                data = {
                    type: "questionnaire",
                    response: {
                        survey_title: "Coffee Habits Survey",
                        sections: [
                            {
                                section_name: "General",
                                questions: [
                                    {
                                        question_id: "Q1",
                                        question_type: "single_select",
                                        question_text: "How often do you drink coffee?",
                                        response_type: "single_choice",
                                        options: [
                                            "Daily",
                                            "Weekly",
                                            "Rarely"
                                        ],
                                        logic: null
                                    },
                                    {
                                        question_id: "Q2",
                                        question_type: "open_end",
                                        question_text: "Why do you like coffee?",
                                        response_type: "open_text",
                                        options: null,
                                        logic: null
                                    }
                                ]
                            }
                        ]
                    },
                    followup: "You can refine the questionnaire further."
                };

            } else {

                data = {
                    type: "supervisor",
                    response: "Please ask something related to questionnaire generation.",
                    validity: "invalid",
                    reason: "User query is not related to questionnaire generation/editing"
                };
            }

            if (data.type === "questionnaire") {

                addMessage("Survey generated", "bot");
                renderSurvey(data.response);

                if (data.followup) {
                    addMessage("💡 " + data.followup, "bot");
                }

            } else {

                addMessage(data.response, "bot");

                if (data.validity === "invalid" && data.reason) {
                    addMessage("⚠️ " + data.reason, "bot");
                }
            }

            setLoading(false);

        }, 1000);

        return;
    }
    try {
        const res = await fetch(BASE + "/send_message", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: msg,
                thread_id: THREAD_ID
            })
        });

        const data = await res.json();
        removeTyping();

        if (data.type === "questionnaire") {
            addMessage("Survey generated", "bot");
            renderSurvey(data.response);

            if (data.followup) {
                addMessage(data.followup, "bot");
            }

        } else if (data.type === "supervisor") {
            if (data.validity === "invalid" && data.reason) {
                addMessage(data.reason, "bot");
            }
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

                html += `<b>${q.question_id || ""}. ${q.question_text}</b><br>`;

                if (q.question_type) {
                    html += `<small style="color:gray;">(${q.question_type})</small><br>`;
                }

                if (q.response_type === "single_choice") {
                    q.options?.forEach(opt => {
                        html += `
                    <label>
                        <input type="radio" name="${q.question_id}">
                        ${opt}
                    </label><br>
                `;
                    });
                }

                else if (q.response_type === "multi_choice") {
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
                    html += `<input type="text" placeholder="Enter your answer"><br>`;
                }

                if (q.logic) {
                    html += `
                <div style="
                    margin-top:6px;
                    padding:6px;
                    background:#fff3cd;
                    border-left:4px solid #ffc107;
                    font-size:12px;
                    color:#856404;
                    border-radius:4px;
                ">
                    ⚠️ Logic: ${q.logic}
                </div>
            `;
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
    if (MOCK_MODE) return;
    const chatBox = document.getElementById("chatBox");
    chatBox.innerHTML = "";

    fetch(BASE + "/get_chat")
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
    if (MOCK_MODE) {
        document.getElementById("chatBox").innerHTML = "";
        return;
    }
    await fetch(BASE + "/clear_chat", {
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