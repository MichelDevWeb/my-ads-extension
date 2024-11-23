// background.js
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({
    url: "index.html",
  });
});

// Listen for extension installation or update
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed/updated");
});
