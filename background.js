chrome.runtime.onInstalled.addListener(() => {
    console.log("Briefly extension installed and ready.");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'fetchContent') {
      fetch(request.url)
        .then(response => response.text())
        .then(text => {
          sendResponse({ success: true, content: text });
        })
        .catch(error => {
          sendResponse({ success: false, error: error.message });
        });
      return true; 
    }
  });
