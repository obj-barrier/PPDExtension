const prodID = window.location.href.match(/(dp|d|product-reviews|offer-listing)\/([A-Z0-9]{10})/);
if (prodID) {
    let descBox = document.getElementById('feature-bullets');
    if (!descBox) {
        descBox = document.getElementById('centerCol');
    }
    if (descBox) {
        const origDesc = descBox.innerHTML;

        const prodIDKey = `desc_${prodID[2]}`;
        chrome.storage.local.get(['user_id', 'session_id', prodIDKey], async function (stored) {
            if (!stored.user_id || !stored.session_id) {
                return;
            }

            let customDesc;

            const genMessage = document.createElement('h3');
            genMessage.style.color = 'red';

            const regenBtn = document.createElement('button');
            regenBtn.textContent = 'Regenerate';
            regenBtn.addEventListener('click', generate);

            const descSwitch = document.createElement('input');
            descSwitch.type = 'checkbox';
            descSwitch.style.marginLeft = '10px';
            descSwitch.addEventListener('change', () => {
                switchDesc(descSwitch.checked);
            });

            const descLabel = document.createElement('div');
            descLabel.style.marginTop = '5px';
            descLabel.textContent = 'Toggle Custom Description';
            descLabel.appendChild(descSwitch);

            const controlBox = document.createElement('div');
            controlBox.style.textAlign = 'right';
            controlBox.style.marginRight = '10px';
            controlBox.appendChild(genMessage);
            controlBox.appendChild(regenBtn);
            controlBox.appendChild(descLabel);

            document.getElementById('nile-inline_feature_div').remove();
            document.getElementById('leftCol').appendChild(controlBox);

            if (stored[prodIDKey]) {
                genMessage.textContent = 'Loaded existing description';
                customDesc = marked.parse(stored[prodIDKey]);
                switchDesc(true);
                return;
            }
            generate();

            function generate() {
                regenBtn.disabled = true;
                chrome.storage.local.remove(prodIDKey);
                genMessage.textContent = 'Generating description...';

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
                        genMessage.textContent = 'Generating comparison...';
                        customDesc = marked.parse(data[0].content);
                        switchDesc(true);
                        return fetch(`${api}shopping_sessions/${stored.session_id}/product_comparison`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: '{}'
                        });
                    })
                    .then(response => response.json())
                    .then(data => {
                        chrome.storage.local.set({ 'comparison': JSON.parse(data[0].content) });
                        genMessage.textContent = 'Generation complete!';
                        regenBtn.disabled = false;
                    })
                    .catch(error => {
                        console.error(error.message);
                    });
            }

            function switchDesc(isCustom) {
                descSwitch.checked = isCustom;
                if (isCustom) {
                    descBox.classList.add('pepper-box');
                    descBox.innerHTML = customDesc;
                } else {
                    descBox.classList.remove('pepper-box');
                    descBox.innerHTML = origDesc;
                }
            }
        });
    }
}
