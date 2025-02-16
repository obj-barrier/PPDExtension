// 获取所有的链接
const links = document.querySelectorAll('a.a-link-normal._product-comparison-desktop_linkComponentStyle_visibleFocus__1lPQm');

// 提取前5个链接的 href
const firstFiveLinks = Array.from(links).slice(0, 5).map(link => link.href);

// 在控制台输出
console.log(firstFiveLinks);

const comparisonDiv = document.querySelector("div._product-comparison-desktop_desktopFaceoutStyle_comparison-card-wrapper__udgEs");
const textContent = comparisonDiv ? comparisonDiv.innerText : "";
console.log(textContent);

// 获取当前页面正文部分的纯文本（排除 HTML 标签）
const pageText = document.body.innerText;

// 将文本内容发送给扩展的背景页面或者 popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getPageText') {
        sendResponse({ text: pageText });
    }
});
