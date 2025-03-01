function jsonToHtmlTable(json) {
    const table_headers = json.table_headers;
    const table_rows = json.table_rows;

    let html = '<table border="1">\n';
    html += '  <tr>\n';
    table_headers.forEach(header => {
        html += `    <th>${header}</th>\n`;
    });
    html += '  </tr>\n';
    table_rows.forEach(row => {
        html += '  <tr>\n';
        table_headers.forEach(header => {
            html += `    <td>${row[header] || 'value'}</td>\n`;
        });
        html += '  </tr>\n';
    });
    html += '</table>';

    return html;
}

document.addEventListener('DOMContentLoaded', async function () {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');
    function showTab(tabId) {
        tabs.forEach(tab => tab.classList.remove('active'));
        contents.forEach(content => content.classList.remove('active'));
        document.querySelector(`.tab[data-tab='${tabId}']`).classList.add('active');
        document.getElementById(`tab-${tabId}`).classList.add('active');
    }
    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            showTab(this.dataset.tab);
        });
    });

    const statusHead = 'Status Code: ';
    const responseHead = 'Response: ';
    const welcomeMsg = "Hi! I'm your personal shopping assistant.\nPlease tell me about your usage of the product so I can better assist you.";
    // const api = 'http://127.0.0.1:5000/api/';
    const api = 'https://dk1414.pythonanywhere.com/api/';

    const loginPanel = document.getElementById('login');
    const ErrorMsg = document.getElementById('error-msg');
    const welPanel = document.getElementById('welcome');
    const welLabel = document.getElementById('wel-label');
    const mainPanel = document.getElementById('main');
    const chatBox = document.getElementById('chat-box');
    const sendBtn = document.getElementById('send-btn');
    const descBox = document.getElementById('description');
    const summaryBox = document.getElementById('summary');
    const compBox = document.getElementById('comparison');
    const compBtn = document.getElementById('comp-btn');
    const statusLabel = document.getElementById('status');
    const responseLabel = document.getElementById('response');

    // await chrome.storage.local.clear();
    // await chrome.storage.local.set({ 'user_id': -1, 'full_name': 'Test', 'session_id' : -1, 'history': [{ role: 'bot', message: welcomeMsg }] });
    const stored = await chrome.storage.local.get(['user_id', 'full_name', 'session_id', 'history', 'comparison' ]);
    let user_id = stored.user_id;
    let full_name = stored.full_name;
    let session_id = null;
    let history = [{ role: 'bot', message: welcomeMsg }];

    function loadHistory() {
        chatBox.innerHTML = history.map(msg => {
            const message = document.createElement('div');
            message.classList.add('message', msg.role);
            message.innerHTML = msg.message;
            return message.outerHTML;
        }).join('');
        const hint = document.createElement('div');
        hint.textContent = 'Newly opened product pages will have personalized descriptions. You can chat more and regenerate anytime!'
        chatBox.appendChild(hint);
    }

    if (user_id) {
        loginPanel.style.display = 'none';
        welLabel.textContent = `Welcome, ${full_name}!`;

        if (stored.session_id) {
            session_id = stored.session_id;
            compBtn.disabled = false;
            showTab('1');
            mainPanel.style.display = 'block';
            if (stored.history) {
                history = stored.history;
            } else {
                chrome.storage.local.set({ 'history': history });
            }

            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                const prodID = tabs[0].url.match(/(dp|d|product-reviews|offer-listing)\/([A-Z0-9]{10})/);
                if (prodID) {
                    const prodIDKey = `desc_${prodID[2]}`;
                    chrome.storage.local.get(prodIDKey, function (stored_desc) {
                        if (stored_desc) {
                            descBox.innerHTML = marked.parse(stored_desc[prodIDKey]);
                            showTab('2');
                        }
                    });
                }
            });

            const comparison = stored.comparison;
            if (comparison) {
                console.log(comparison);
                summaryBox.textContent = comparison.commentary;
                compBox.innerHTML = jsonToHtmlTable(stored.comparison);
            }
        } else {
            compBtn.disabled = true;
            welPanel.style.display = 'block';
        }

        loadHistory();
    }

    document.getElementById('login-btn').addEventListener('click', function () {
        ErrorMsg.textContent = '';
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        if (email === '' || password === '') {
            ErrorMsg.textContent = 'Empty email / password!';
            return;
        }

        fetch(`${api}login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                password: password
            }),
        })
            .then(response => {
                statusLabel.textContent = `${statusHead}${response.status}`;
                if (!response.ok) {
                    ErrorMsg.textContent = 'Incorrect email / password!';
                    throw new Error(`${response.status} - Incorrect Email or Password`);
                }
                return response.json();
            })
            .then(data => {
                responseLabel.textContent = `${responseHead}${JSON.stringify(data)}`;
                user_id = data.user_id;
                full_name = data.name;
                chrome.storage.local.set({ 'user_id': user_id, 'full_name': full_name });
                loginPanel.style.display = 'none';
                welPanel.style.display = 'block';
                welLabel.textContent = `Welcome, ${full_name}!`;
            })
            .catch(error => {
                statusLabel.textContent = `${statusHead}Error`;
                responseLabel.textContent = `${responseHead}${error.message}`;
            });
    });

    const regBtn = document.getElementById('reg-btn');
    regBtn.addEventListener('click', function () {
        regBtn.style.display = 'none';
        document.getElementById('register').style.display = 'block';
    });

    document.getElementById('submit-btn').addEventListener('click', function () {
        ErrorMsg.textContent = '';
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        if (password !== document.getElementById('confirm-pwd').value) {
            ErrorMsg.textContent = 'Confirm password does not match!';
            return;
        }
        const inputName = document.getElementById('full-name').value.trim();
        const birthday = document.getElementById('birthday').value;
        const occupation = document.getElementById('occupation').value;
        const zipcode = document.getElementById('zipcode').value;
        if (email === '' || password === '' || inputName === '' || birthday === '' || occupation === '' || zipcode === '') {
            ErrorMsg.textContent = 'Please fill in every blank!';
            return;
        }

        fetch(`${api}users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
                chrome.storage.local.set({ 'user_id': user_id, 'full_name': full_name });
                loginPanel.style.display = 'none';
                welPanel.style.display = 'block';
                welLabel.textContent = `Welcome, ${full_name}!`;

                return fetch(`${api}users/${user_id}/preferences`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        preferences: [
                            { key: 'birthday', value: birthday },
                            { key: 'occupation', value: occupation },
                            { key: 'zipcode', value: zipcode }
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

    document.getElementById('create-session').addEventListener('click', function () {
        history = [{ role: 'bot', message: welcomeMsg }];
        chrome.storage.local.set({ 'history': history });
        loadHistory();

        fetch(`${api}users/${user_id}/shopping_sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ intent: document.getElementById('intent').value.trim() }),
        })
            .then(response => {
                statusLabel.textContent = `${statusHead}${response.status}`;
                return response.json();
            })
            .then(data => {
                responseLabel.textContent = `${responseHead}${JSON.stringify(data)}`;
                session_id = data.session_id;
                chrome.storage.local.set({ 'session_id': session_id });
                compBtn.disabled = false;
                showTab('1');
                welPanel.style.display = 'none';
                mainPanel.style.display = 'block';
            })
            .catch(error => {
                statusLabel.textContent = `${statusHead}Error`;
                responseLabel.textContent = `${responseHead}${error.message}`;
            });
    });

    document.getElementById('logout-btn').addEventListener('click', function () {
        chrome.storage.local.clear();
        user_id = null;
        full_name = null;
        session_id = null;
        history = [{ role: 'bot', message: welcomeMsg }];
        loginPanel.style.display = 'block';
        welPanel.style.display = 'none';
        mainPanel.style.display = 'none';
    });

    sendBtn.addEventListener('click', sendMessage);
    document.getElementById('user-input').addEventListener('keypress', function (event) {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });

    function sendMessage() {
        sendBtn.disabled = true;
        sendBtn.textContent = 'Sending...';
        const inputField = document.getElementById('user-input');
        const messageText = inputField.value.trim();
        if (messageText === '') return;
        inputField.value = '';
        
        const userMessage = document.createElement('div');
        userMessage.classList.add('message', 'user');
        userMessage.textContent = messageText;
        history.push({ role: 'user', message: messageText });
        chrome.storage.local.set({ 'history': history });
        chatBox.appendChild(userMessage);

        fetch(`${api}shopping_sessions/${session_id}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: messageText }),
        })
            .then(response => {
                statusLabel.textContent = `${statusHead}${response.status}`;
                return response.json();
            })
            .then(data => {
                responseLabel.textContent = `${responseHead}${Object.keys(data[0])} ${data[0].created_at}`;
                const botMessage = document.createElement('div');
                botMessage.classList.add('message', 'bot');
                botMessage.innerHTML = marked.parse(data[0].content);
                history.push({ role: 'bot', message: botMessage.innerHTML });
                chrome.storage.local.set({ 'history': history });

                chatBox.appendChild(botMessage);
                chatBox.scrollTop = chatBox.scrollHeight;
                sendBtn.textContent = 'Send';
                sendBtn.disabled = false;
            })
            .catch(error => {
                statusLabel.textContent = `${statusHead}Error`;
                responseLabel.textContent = `${responseHead}${error.message}`;
            });
    }

    document.getElementById('reset-btn').addEventListener('click', function () {
        session_id = null;
        chrome.storage.local.clear();
        history = [{ role: 'bot', message: welcomeMsg }];
        chrome.storage.local.set({ 'user_id': user_id, 'full_name': full_name, 'history': history });
        document.getElementById('welcome').style.display = 'block';
        mainPanel.style.display = 'none';
    });

    compBtn.addEventListener('click', function () {
        compBtn.disabled = true;
        compBtn.textContent = 'Generating...';
        fetch(`${api}shopping_sessions/${session_id}/product_comparison`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        })
            .then(response => {
                statusLabel.textContent = `${statusHead}${response.status}`;
                return response.json();
            })
            .then(data => {
                const comparison = JSON.parse(data[0].content);
                chrome.storage.local.set({ 'comparison': comparison });
                responseLabel.textContent = `${responseHead}${Object.keys(data[0])}`;
                summaryBox.textContent = comparison.commentary;
                compBox.innerHTML = jsonToHtmlTable(comparison);
                compBtn.textContent = 'Update Comparison';
                compBtn.disabled = false;
            })
            .catch(error => {
                statusLabel.textContent = `${statusHead}Error`;
                responseLabel.textContent = `${responseHead}${error.message}`;
            });
    });
});
