// 获取当前页面正文部分的纯文本（排除 HTML 标签）
const pageText = document.body.innerText;

// 将文本内容发送给扩展的背景页面或者 popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getPageText') {
        sendResponse({ text: pageText });
    }
});
