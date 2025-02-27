const prodID = window.location.href.match(/dp\/([^\/?]*)/);
if (prodID) {
    const prodIDKey = `desc_${prodID[1]}`;
    chrome.storage.local.get(['user_id', 'session_id', prodIDKey], async function (stored) {
        if (!stored.user_id || !stored.session_id) {
            return;
        }

        const genMessage = document.createElement('h3');
        genMessage.style.color = 'red';
        const regenBtn = document.createElement('button');
        regenBtn.textContent = 'Regenerate';
        regenBtn.addEventListener('click', generate);
        document.getElementById('nile-inline_feature_div').remove();
        const leftCol = document.getElementById('leftCol');
        leftCol.appendChild(genMessage);
        leftCol.appendChild(regenBtn);

        if (stored[prodIDKey]) {
            genMessage.textContent = 'Already has description!';
            return;
        }
        generate();

        function generate() {
            regenBtn.disabled = true;
            chrome.storage.local.remove(prodIDKey);
            genMessage.textContent = 'Generating product description...';

            // const api = 'http://127.0.0.1:5000/api/';
            const api = 'https://dk1414.pythonanywhere.com/api/';
            fetch(`${api}shopping_sessions/${stored.session_id}/product_description`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ product_page: document.body.innerText }),
            })
                .then(response => {
                    return response.json();
                })
                .then(data => {
                    chrome.storage.local.set({ [prodIDKey]: data[0].content });
                    genMessage.textContent = 'Generation complete!';
                    regenBtn.disabled = false;
                })
                .catch(error => {
                    console.error(error.message);
                });
        }
    });
}
