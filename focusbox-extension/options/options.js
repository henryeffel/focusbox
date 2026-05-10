document.querySelector("#openButton").addEventListener("click", async () => {
  await chrome.tabs.create({ url: chrome.runtime.getURL("pages/start.html") });
});
