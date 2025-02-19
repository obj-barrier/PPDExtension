document.addEventListener("DOMContentLoaded", function () {
    const tabs = document.querySelectorAll(".tab");
    const contents = document.querySelectorAll(".tab-content");
    function showTab(tabId) {
        tabs.forEach(tab => tab.classList.remove("active"));
        contents.forEach(content => content.classList.remove("active"));
        document.querySelector(`.tab[data-tab="${tabId}"]`).classList.add("active");
        document.getElementById(`tab-${tabId}`).classList.add("active");
    }
    tabs.forEach(tab => {
        tab.addEventListener("click", function () {
            showTab(this.dataset.tab);
        });
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

    let user_id = null;
    document.getElementById("user1").addEventListener("click", function () {
        user_id = 1;
        login();
    });
    document.getElementById("user2").addEventListener("click", function () {
        user_id = 2;
        login();
    });
    document.getElementById("user3").addEventListener("click", function () {
        user_id = 3;
        login();
    });

    const statusHead = "Status Code: "
    const responseHead = "Response: "
    const welcomeMsg = "Hi! I'm your personal shopping assistant.\nPlease tell me about your usage of the product so I can better assist you."
    // const url = "http://127.0.0.1:5000/";
    const url = "https://objbarrier.pythonanywhere.com/";

    const chatBox = document.getElementById("chat-box");
    const status = document.getElementById("status");
    const response = document.getElementById("response");

    let session_id = null;
    let history = [{ role: "bot", message: welcomeMsg }];
    async function login() {
        const stored = await chrome.storage.local.get(["user_id", "user_name", "session_id", "history"]);
        let user_name = stored.user_name;
        session_id = stored.session_id;
        if (!stored.user_id || stored.user_id !== user_id) {
            chrome.storage.local.clear();
            chrome.storage.local.set({ "user_id": user_id, "history": history });
            session_id = null;

            await fetch(url + "api/users/" + user_id, {
                method: "GET",
            })
                .then(response => {
                    status.textContent = statusHead + response.status;
                    return response.json();
                })
                .then(data => {
                    response.textContent = responseHead + JSON.stringify(data);
                    user_name = data.name;
                    chrome.storage.local.set({ "user_name": data.name });
                })
                .catch(error => {
                    status.textContent = statusHead + "Error";
                    response.textContent = responseHead + error.message;
                });
        }
        document.getElementById("login").style.display = "none";

        if (session_id) {
            showTab("1");
            document.getElementById("main").style.display = "block";
            if (stored.history) {
                history = stored.history;
            } else {
                chrome.storage.local.set({ "history": history });
            }
        } else {
            document.getElementById("wel-label").textContent = "Welcome, " + user_name + "!";
            document.getElementById("welcome").style.display = "block";
        }

        chatBox.innerHTML = history.map(msg => {
            const message = document.createElement("div");
            message.classList.add("message", msg.role);
            message.innerHTML = msg.message;
            return message.outerHTML;
        }).join("");
    }

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
                status.textContent = statusHead + response.status;
                return response.json();
            })
            .then(data => {
                session_id = data.session_id;
                chrome.storage.local.set({ "session_id": session_id });
                showTab("1");
                document.getElementById("welcome").style.display = "none";
                document.getElementById("main").style.display = "block";
                response.textContent = responseHead + JSON.stringify(data);
            })
            .catch(error => {
                status.textContent = statusHead + "Error";
                response.textContent = responseHead + error.message;
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
        
        const userMessage = document.createElement("div");
        userMessage.classList.add("message", "user");
        userMessage.textContent = messageText;
        history.push({ role: "user", message: messageText });
        chrome.storage.local.set({ "history": history });
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
                status.textContent = statusHead + response.status;
                return response.json();
            })
            .then(data => {
                response.textContent = responseHead + Object.keys(data[0]) + " " + data[0].created_at;
                const botMessage = document.createElement("div");
                botMessage.classList.add("message", "bot");
                botMessage.innerHTML = marked.parse(data[0].content);
                history.push({ role: "bot", message: botMessage.innerHTML });
                chrome.storage.local.set({ "history": history });

                chatBox.appendChild(botMessage);
                chatBox.scrollTop = chatBox.scrollHeight;
            })
            .catch(error => {
                status.textContent = statusHead + "Error";
                response.textContent = responseHead + error.message;
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
                status.textContent = statusHead + response.status;
                document.getElementById("gen-btn").textContent = "Start Generating";
                return response.json();
            })
            .then(data => {
                response.textContent = responseHead + Object.keys(data[0]) + " " + data[0].created_at;
                document.getElementById("description").innerHTML = marked.parse(data[0].content);
                showTab("2");
            })
            .catch(error => {
                status.textContent = statusHead + "Error";
                response.textContent = responseHead + error.message;
            });
    });

    document.getElementById("reset-btn").addEventListener("click", function () {
        session_id = null;
        chrome.storage.local.remove("session_id");
        history = [{ role: "bot", message: welcomeMsg }];
        chrome.storage.local.set({ "history": history });
        document.getElementById("welcome").style.display = "block";
        document.getElementById("main").style.display = "none";
    });
});
