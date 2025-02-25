document.addEventListener("DOMContentLoaded", async function () {
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

    const statusHead = "Status Code: ";
    const responseHead = "Response: ";
    const welcomeMsg = "Hi! I'm your personal shopping assistant.\nPlease tell me about your usage of the product so I can better assist you.";
    const api = "http://127.0.0.1:5000/api/";
    // const api = "https://dk1414.pythonanywhere.com/api/";

    const loginPanel = document.getElementById("login");
    const welPanel = document.getElementById("welcome");
    const welLabel = document.getElementById("wel-label");
    const mainPanel = document.getElementById("main");
    const chatBox = document.getElementById("chat-box");
    const descBox = document.getElementById("description");
    const compBox = document.getElementById("comparison");
    const statusLabel = document.getElementById("status");
    const responseLabel = document.getElementById("response");

    // await chrome.storage.local.clear();
    // await chrome.storage.local.set({ "user_id": -1, "full_name": "Test", "session_id" : -1, "history": [{ role: "bot", message: welcomeMsg }] });
    const stored = await chrome.storage.local.get(["user_id", "full_name", "session_id", "history", ]);
    let user_id = stored.user_id;
    let full_name = stored.full_name;
    let session_id = null;
    let history = [{ role: "bot", message: welcomeMsg }];

    if (user_id) {
        loginPanel.style.display = "none";
        welLabel.textContent = `Welcome, ${full_name} !`;

        if (stored.session_id) {
            session_id = stored.session_id;
            showTab("1");
            mainPanel.style.display = "block";
            if (stored.history) {
                history = stored.history;
            } else {
                chrome.storage.local.set({ "history": history });
            }

            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                const prodID = tabs[0].url.match(/dp\/([^\/?]*)/)[1];
                chrome.storage.local.get(`desc_${prodID}`, function (stored_desc) {
                    if (stored_desc) {
                        descBox.innerHTML = marked.parse(stored_desc[`desc_${prodID}`]);
                        showTab("2");
                    }
                });
            });

            fetch(`${api}shopping_sessions/${session_id}/product_comparison`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            })
                .then(response => {
                    statusLabel.textContent = `${statusHead}${response.status}`;
                    return response.json();
                })
                .then(data => {
                    responseLabel.textContent = `${responseHead}${JSON.stringify(data)}`;
                    compBox.textContent = data[0].content;
                })
                .catch(error => {
                    statusLabel.textContent = `${statusHead}Error`;
                    responseLabel.textContent = `${responseHead}${error.message}`;
                });
        } else {
            welPanel.style.display = "block";
        }

        chatBox.innerHTML = history.map(msg => {
            const message = document.createElement("div");
            message.classList.add("message", msg.role);
            message.innerHTML = msg.message;
            return message.outerHTML;
        }).join("");
    }

    document.getElementById("login-btn").addEventListener("click", function () {
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        if (email === "" || password === "") {
            return;
        }

        fetch(`${api}login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: email,
                password: password
            }),
        })
            .then(response => {
                statusLabel.textContent = `${statusHead}${response.status}`;
                if (!response.ok) {
                    throw new Error(`${response.status} - Incorrect Email or Password`);
                }
                return response.json();
            })
            .then(data => {
                responseLabel.textContent = `${responseHead}${JSON.stringify(data)}`;
                user_id = data.user_id;
                full_name = data.name;
                history = [{ role: "bot", message: welcomeMsg }]
                chrome.storage.local.set({ "user_id": user_id, "full_name": full_name, history: history });
                loginPanel.style.display = "none";
                welPanel.style.display = "block";
                welLabel.textContent = `Welcome, ${full_name} !`;
            })
            .catch(error => {
                statusLabel.textContent = `${statusHead}Error`;
                responseLabel.textContent = `${responseHead}${error.message}`;
            });
    });

    const regBtn = document.getElementById("reg-btn");
    regBtn.addEventListener("click", function () {
        regBtn.style.display = "none";
        document.getElementById("register").style.display = "block";
    });

    document.getElementById("submit-btn").addEventListener("click", function () {
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        if (password !== document.getElementById("confirm-pwd").value) {
            return;
        }
        const inputName = document.getElementById("full-name").value.trim();
        const birthday = document.getElementById("birthday").value;
        const occupation = document.getElementById("occupation").value;
        const zipcode = document.getElementById("zipcode").value;
        if (email === "" || password === "" || inputName === "" || birthday === "" || occupation === "" || zipcode === "") {
            return;
        }

        fetch(`${api}users`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: inputName,
                email: email,
                password: password
            }),
        })
            .then(response => {
                statusLabel.textContent = `${statusHead}${response.status}`;
                return response.json();
            })
            .then(data => {
                responseLabel.textContent = `${responseHead}${JSON.stringify(data)}`;
                user_id = data.user_id;
                full_name = data.name;
                history = [{ role: "bot", message: welcomeMsg }]
                chrome.storage.local.set({ "user_id": user_id, "full_name": full_name, history: history });
                loginPanel.style.display = "none";
                welPanel.style.display = "block";
                welLabel.textContent = `Welcome, ${full_name} !`;

                return fetch(`${api}users/${user_id}/preferences`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        preferences: [
                            { key: "birthday", value: birthday },
                            { key: "occupation", value: occupation },
                            { key: "zipcode", value: zipcode }
                        ]
                    })
                });
            })
            .then(response => {
                statusLabel.textContent = `${statusLabel.textContent}, ${response.status}`;
                return response.json();
            })
            .then(data => {
                responseLabel.textContent = `${responseLabel.textContent}, ${JSON.stringify(data)}`;
            })
            .catch(error => {
                statusLabel.textContent = `${statusHead}Error`;
                responseLabel.textContent = `${responseHead}${error.message}`;
            });
        
        
    });

    document.getElementById("create-session").addEventListener("click", function () {
        history = [{ role: "bot", message: welcomeMsg }];
        chrome.storage.local.set({ "history": history });

        fetch(`${api}users/${user_id}/shopping_sessions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ intent: document.getElementById("intent").value.trim() }),
        })
            .then(response => {
                statusLabel.textContent = statusHead + response.status;
                return response.json();
            })
            .then(data => {
                session_id = data.session_id;
                chrome.storage.local.set({ "session_id": session_id });
                showTab("1");
                welPanel.style.display = "none";
                mainPanel.style.display = "block";
                responseLabel.textContent = responseHead + JSON.stringify(data);
            })
            .catch(error => {
                statusLabel.textContent = statusHead + "Error";
                responseLabel.textContent = responseHead + error.message;
            });
    });

    document.getElementById("logout-btn").addEventListener("click", function () {
        chrome.storage.local.clear();
        user_id = null;
        full_name = null;
        session_id = null;
        history = [{ role: "bot", message: welcomeMsg }];
        loginPanel.style.display = "block";
        welPanel.style.display = "none";
        mainPanel.style.display = "none";
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
        fetch(`${api}shopping_sessions/${session_id}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: messageText }),
        })
            .then(response => {
                document.getElementById("send-btn").textContent = "Send";
                statusLabel.textContent = statusHead + response.status;
                return response.json();
            })
            .then(data => {
                responseLabel.textContent = responseHead + Object.keys(data[0]) + " " + data[0].created_at;
                const botMessage = document.createElement("div");
                botMessage.classList.add("message", "bot");
                botMessage.innerHTML = marked.parse(data[0].content);
                history.push({ role: "bot", message: botMessage.innerHTML });
                chrome.storage.local.set({ "history": history });

                chatBox.appendChild(botMessage);
                chatBox.scrollTop = chatBox.scrollHeight;
            })
            .catch(error => {
                statusLabel.textContent = statusHead + "Error";
                responseLabel.textContent = responseHead + error.message;
            });
    }

    document.getElementById("reset-btn").addEventListener("click", function () {
        session_id = null;
        chrome.storage.local.remove("session_id");
        history = [{ role: "bot", message: welcomeMsg }];
        chrome.storage.local.set({ "history": history });
        document.getElementById("welcome").style.display = "block";
        mainPanel.style.display = "none";
    });
});
