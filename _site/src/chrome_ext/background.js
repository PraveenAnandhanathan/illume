// MV3 service worker — open illume in a new tab when the extension icon is clicked
chrome.action.onClicked.addListener(function () {
    chrome.tabs.create({ url: chrome.runtime.getURL("index.html") });
});
