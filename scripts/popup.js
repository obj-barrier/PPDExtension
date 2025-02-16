document.addEventListener("DOMContentLoaded", function () {
    const user_id = 3;
    const url = "http://127.0.0.1:5000/";
    // const url = "https://objbarrier.pythonanywhere.com/";
    fetch(url + "api/users/" + user_id, {
        method: "GET",
    })
        .then(response => {
            document.getElementById("status").textContent = `${statusCode}${response.status}`;
            return response.json();
        })
        .then(data => {
            document.getElementById("response").textContent = `${response}${data}`;
            document.getElementById("welcome-name").textContent = "Welcome, " + data.name + "!";
        })
        .catch(error => {
            document.getElementById("status").textContent = `${statusCode}Error`;
            document.getElementById("response").textContent = `${response}${error.message}`;
        });
    

    let page_text = null;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "getPageText" }, (response) => {
            if (chrome.runtime.lastError || !response) {
                return;
            } else {
                page_text = response.text;
            }
        });
    });

    const tabs = document.querySelectorAll(".tab");
    const contents = document.querySelectorAll(".tab-content");
    let activeTab = localStorage.getItem("activeTab") || "1";
    showTab(activeTab);

    function showTab(tabId) {
        tabs.forEach(tab => tab.classList.remove("active"));
        contents.forEach(content => content.classList.remove("active"));

        document.querySelector(`.tab[data-tab="${tabId}"]`).classList.add("active");
        document.getElementById(`tab-${tabId}`).classList.add("active");

        localStorage.setItem("activeTab", tabId);
    }

    tabs.forEach(tab => {
        tab.addEventListener("click", function () {
            showTab(this.dataset.tab);
        });
    });

    const statusCode = "Status Code: "
    const response = "Response: "

    let session_id = null;
    document.getElementById("create-session").addEventListener("click", function () {
        const api = url + "api/users/" + user_id + "/shopping_sessions";
        const data = {
            intent: document.getElementById("intent").value.trim(),
        };
        fetch(api, {
            method: "POST",
            headers: { "Content-Type": "application/json", },
            body: JSON.stringify(data),
        })
            .then(response => {
                document.getElementById("status").textContent = `${statusCode}${response.status}`;
                return response.json();
            })
            .then(data => {
                session_id = data.session_id;
                // console.log("session_id: " + session_id);
                showTab("1");
                document.getElementById("welcome").style.display = "none";
                document.getElementById("main").style.display = "block";
                document.getElementById("response").textContent = `${response}${data}`;
            })
            .catch(error => {
                document.getElementById("status").textContent = `${statusCode}Error`;
                document.getElementById("response").textContent = `${response}${error.message}`;
            });
    });

    document.getElementById("send-btn").addEventListener("click", sendMessage);
    document.getElementById("user-input").addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            sendMessage();
        }
    });

    function sendMessage() {
        document.getElementById("send-btn").textContent = "Sending...";
        const inputField = document.getElementById("user-input");
        const messageText = inputField.value.trim();
        if (messageText === "") return;

        const chatBox = document.getElementById("chat-box");
        const userMessage = document.createElement("div");
        userMessage.classList.add("message", "user");
        userMessage.textContent = messageText;
        chatBox.appendChild(userMessage);

        inputField.value = "";

        const api = url + "api/shopping_sessions/" + session_id + "/messages";
        const data = {
            message: messageText,
        };
        fetch(api, {
            method: "POST",
            headers: { "Content-Type": "application/json", },
            body: JSON.stringify(data),
        })
            .then(response => {
                document.getElementById("send-btn").textContent = "Send";
                document.getElementById("status").textContent = `${statusCode}${response.status}`;
                return response.json();
            })
            .then(data => {
                document.getElementById("response").textContent = `${response}${data}`;
                const botMessage = document.createElement("div");
                botMessage.classList.add("message", "bot");
                botMessage.innerHTML = marked.parse(data[0].content);

                chatBox.appendChild(botMessage);
                chatBox.scrollTop = chatBox.scrollHeight;
            })
            .catch(error => {
                document.getElementById("status").textContent = `${statusCode}Error`;
                document.getElementById("response").textContent = `${response}${error.message}`;
            });
    }

    document.getElementById("gen-btn").addEventListener("click", function () {
        document.getElementById("gen-btn").textContent = "Generating...";
        const api = url + "api/shopping_sessions/" + session_id + "/product_description";
        const data = {
            product_page: page_text,
        };
        fetch(api, {
            method: "POST",
            headers: { "Content-Type": "application/json", },
            body: JSON.stringify(data),
        })
            .then(response => {
                document.getElementById("status").textContent = `${statusCode}${response.status}`;
                // document.getElementById("gen-btn").textContent = "Start Generating";
                return response.json();
            })
            .then(data => {
                document.getElementById("response").textContent = `${response}${data}`;
                document.getElementById("description").innerHTML = marked.parse(data[0].content);
                showTab("2");
            })
            .catch(error => {
                document.getElementById("status").textContent = `${statusCode}Error`;
                document.getElementById("response").textContent = `${response}${error.message}`;
            });
    });
});
