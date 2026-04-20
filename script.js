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
        }
        else if (data.assistant_text) {
            addMessage(data.assistant_text, "bot");
        }
        else {
            addMessage("No valid response", "bot");
        }

    } catch {
        removeTyping();
        addMessage("Server error", "bot");
    }


}

function renderSurvey(data) {
    const wrapper = document.getElementById("surveyWrapper");
    const container = document.getElementById("survey");


    wrapper.classList.remove("hidden");
    container.innerHTML = "";

    const title = document.createElement("h3");
    title.innerText = data.survey_title || "Survey";
    container.appendChild(title);

    data.sections?.forEach(sec => {
        const secDiv = document.createElement("div");
        secDiv.className = "section";

        const h4 = document.createElement("h4");
        h4.innerText = sec.section_name || "Section";
        secDiv.appendChild(h4);

        sec.questions?.forEach(q => {
            if (!q.question_text) return;

            const qDiv = document.createElement("div");
            qDiv.className = "question";

            const label = document.createElement("p");
            label.innerText = q.question_text;
            qDiv.appendChild(label);

            if (q.response_type === "single_choice") {
                q.options?.forEach(opt => {
                    const radio = document.createElement("input");
                    radio.type = "radio";
                    radio.name = q.question_id;
                    radio.value = opt;

                    qDiv.appendChild(radio);
                    qDiv.appendChild(document.createTextNode(opt));
                    qDiv.appendChild(document.createElement("br"));
                });
            }
            else if (q.response_type === "multi_choice") {
                q.options?.forEach(opt => {
                    const check = document.createElement("input");
                    check.type = "checkbox";
                    check.value = opt;

                    qDiv.appendChild(check);
                    qDiv.appendChild(document.createTextNode(opt));
                    qDiv.appendChild(document.createElement("br"));
                });
            }
            else {
                const input = document.createElement("input");
                input.type = "text";
                qDiv.appendChild(input);
            }

            secDiv.appendChild(qDiv);
        });

        container.appendChild(secDiv);
    });

    wrapper.scrollTop = 0;


}

async function loadChat() {
    try {
        const res = await fetch(BASE + "/get-chat");
        const data = await res.json();


        document.getElementById("chatBox").innerHTML = "";

        data.messages.forEach(msg => {
            if (msg.role === "user") {
                addMessage(msg.content, "user");
            } else {
                addMessage("Loaded response", "bot");
                if (msg.content.sections) {
                    renderSurvey(msg.content);
                }
            }
        });
    } catch {
        addMessage("Failed to load chat", "bot");
    }


}

async function clearChat() {
    await fetch(BASE + "/clear-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
    });

    document.getElementById("chatBox").innerHTML = "";
    document.getElementById("survey").innerHTML = "";
    document.getElementById("surveyWrapper").classList.add("hidden");

}

function submitSurvey() {
    document.getElementById("surveyWrapper").classList.add("hidden");
    addMessage("Survey submitted", "bot");
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