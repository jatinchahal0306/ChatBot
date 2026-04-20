const BASE = "http://136.119.158.223:8000";
// const USE_MOCK = true;

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

        /* ================= MOCK MODE =================
        setTimeout(() => {
            removeTyping();
    
            const mockData = {
                survey_title: "Demo Beverage Survey",
                sections: [
                    {
                        section_name: "Screener",
                        questions: [
                            {
                                question_text: "What is your age group?",
                                options: ["18-24", "25-30", "31-34"]
                            },
                            {
                                question_text: "Do you drink energy beverages?",
                                options: ["Yes", "No"]
                            }
                        ]
                    },
                    {
                        section_name: "Concept Evaluation",
                        questions: [
                            {
                                question_text: "How appealing is this product?",
                                options: ["Very appealing", "Neutral", "Not appealing"]
                            }
                        ]
                    }
                ]
            };
    
            addMessage("Survey generated (mock)", "bot");
            renderSurvey(mockData);
            setLoading(false);
    
        }, 1000);
        return;
        ================================================= */

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

    data.sections?.forEach(sec => {
        html += `<div class="section"><b>${sec.section_name}</b>`;

        sec.questions?.forEach(q => {
            html += `<div class="question"><b>• ${q.question_text}</b><br>`;
            if (q.options) {
                q.options.forEach(opt => {
                    html += `- ${opt}<br>`;
                });
            }
            html += `</div>`;
        });

        html += `</div>`;
    });

    div.innerHTML = html;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;


}

function loadChat() {
    const chatBox = document.getElementById("chatBox");
    chatBox.innerHTML = "";


    /* ================= MOCK HISTORY =================
    addMessage("Create a survey", "user");
    
    const mockSurvey = {
        survey_title: "Previous Survey",
        sections: [
            {
                section_name: "Usage",
                questions: [
                    {
                        question_text: "How often do you drink soda?",
                        options: ["Daily", "Weekly", "Rarely"]
                    }
                ]
            }
        ]
    };
    
    renderSurvey(mockSurvey);
    return;
    ================================================= */

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

window.addEventListener("DOMContentLoaded", () => {
    loadChat();
});
