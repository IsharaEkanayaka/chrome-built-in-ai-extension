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
      return true; // Required for async response
    }
  });