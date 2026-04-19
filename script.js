const BASE = "http://136.119.158.223:8000";

function addMessage(text, type) {
    const box = document.getElementById("chatBox");

    const div = document.createElement("div");
    div.className = "message " + type;

    // ✅ label set
    div.setAttribute("data-label", type === "user" ? "You" : "Bot");

    div.innerText = text;

    box.appendChild(div);
    box.scrollTop = box.scrollHeight;

}

// SEND MESSAGE
async function sendMessage() {
    const input = document.getElementById("userInput");
    const msg = input.value.trim();
    if (!msg) return;

    addMessage(msg, "user");
    input.value = "";

    try {
        const res = await fetch(BASE + "/send-message", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: msg })
        });


        const data = await res.json();

        addMessage("Survey generated ✅", "bot");

        if (data.parsed_json) {
            renderSurvey(data.parsed_json);
        }


    } catch (err) {
        addMessage("Server error ❌", "bot");
    }
}

// RENDER SURVEY
function renderSurvey(data) {
    const container = document.getElementById("survey");
    container.innerHTML = "";

    const title = document.createElement("h2");
    title.innerText = data.survey_title;
    container.appendChild(title);

    data.sections.forEach(sec => {
        const secDiv = document.createElement("div");
        secDiv.className = "section";


        const h3 = document.createElement("h3");
        h3.innerText = sec.section_name;
        secDiv.appendChild(h3);

        sec.questions.forEach(q => {
            const qDiv = document.createElement("div");
            qDiv.className = "question";

            const label = document.createElement("p");
            label.innerText = q.question_text;
            qDiv.appendChild(label);

            if (q.response_type === "single_choice") {
                q.options.forEach(opt => {
                    const radio = document.createElement("input");
                    radio.type = "radio";
                    radio.name = q.question_id;

                    qDiv.appendChild(radio);
                    qDiv.appendChild(document.createTextNode(opt));
                    qDiv.appendChild(document.createElement("br"));
                });
            }

            else if (q.response_type === "multi_choice") {
                q.options.forEach(opt => {
                    const check = document.createElement("input");
                    check.type = "checkbox";

                    qDiv.appendChild(check);
                    qDiv.appendChild(document.createTextNode(opt));
                    qDiv.appendChild(document.createElement("br"));
                });
            }

            else if (q.response_type === "open_text") {
                const input = document.createElement("input");
                input.type = "text";
                qDiv.appendChild(input);
            }

            secDiv.appendChild(qDiv);
        });

        container.appendChild(secDiv);


    });
}

// LOAD CHAT HISTORY
async function loadChat() {
    const res = await fetch(BASE + "/get-chat");
    const data = await res.json();

    data.messages.forEach(msg => {
        if (msg.role === "user") {
            addMessage(msg.content, "user");
        } else {
            addMessage("Previous survey loaded", "bot");
            if (msg.content.sections) {
                renderSurvey(msg.content);
            }
        }
    });
}

// CLEAR CHAT
async function clearChat() {
    await fetch(BASE + "/clear-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
    });

    document.getElementById("chatBox").innerHTML = "";
    document.getElementById("survey").innerHTML = "";
}

loadChat();
