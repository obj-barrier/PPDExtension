document.addEventListener("DOMContentLoaded", function () {
    const tabs = document.querySelectorAll(".tab");
    const contents = document.querySelectorAll(".tab-content");

    // 读取上次选中的标签页，默认显示 Tab 1
    let activeTab = localStorage.getItem("activeTab") || "1";
    showTab(activeTab);

    function showTab(tabId) {
        tabs.forEach(tab => tab.classList.remove("active"));
        contents.forEach(content => content.classList.remove("active"));

        document.querySelector(`.tab[data-tab="${tabId}"]`).classList.add("active");
        document.getElementById(`tab-${tabId}`).classList.add("active");

        // 记录当前标签页，刷新时仍然选中
        localStorage.setItem("activeTab", tabId);
    }

    tabs.forEach(tab => {
        tab.addEventListener("click", function () {
            showTab(this.dataset.tab);
        });
    });

    // 发送 HTTP 请求
    document.getElementById("send-request").addEventListener("click", function () {
        const url = document.getElementById("server-url").value.trim();
        const statusCode = "Status Code: "
        const response = "Response: "
        if (!url) {
            document.getElementById("status").textContent = `${statusCode}Invalid URL`;
            return;
        }

        fetch(url)
            .then(response => {
                document.getElementById("status").textContent = `${statusCode}${response.status}`;
                return response.text();
            })
            .then(data => {
                document.getElementById("response").textContent = `${response}${data}`;
            })
            .catch(error => {
                document.getElementById("status").textContent = `${statusCode}Error`;
                document.getElementById("response").textContent = `${response}${error.message}`;
            });
    });
});
