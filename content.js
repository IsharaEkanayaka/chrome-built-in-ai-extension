document.querySelectorAll('.g a').forEach((link) => {
    let popup;
    let timeoutId;

    // Add hover listener
    link.addEventListener('mouseover', (event) => {
        timeoutId = setTimeout(() => {
            const url = link.href;

            // Create a temporary popup while fetching data
            popup = document.createElement('div');
            popup.style.cssText = `
              position: absolute;
              top: ${event.clientY + window.scrollY + 10}px;
              left: ${event.clientX + 10}px;
              background: white;
              border: 1px solid #ccc;
              border-radius: 8px;
              padding: 10px;
              max-width: 300px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              z-index: 1000;
              font-family: Arial, sans-serif;
              font-size: 14px;
              line-height: 1.4;
              color: #333;
            `;
            popup.innerText = "Loading summary...";
            document.body.appendChild(popup);

            // Request summary from the background script
            chrome.runtime.sendMessage({ type: "summarize", url });

            // Listen for summary result or error
            chrome.runtime.onMessage.addListener(function handleMessage(message) {
                if (message.type === "summaryResult" && message.url === url) {
                    // Populate the popup with the fetched summary
                    if (message.error) {
                        // Display error message
                        popup.innerHTML = `<p style="color: red;">Error: ${message.error}</p>`;
                    } else {
                        // Display summary content
                        popup.innerHTML = `
                          <h4 style="margin: 0; font-size: 16px;">Summary</h4>
                          <img src="${message.summary.image}" alt="Website Image" style="width: 100%; margin: 10px 0; border-radius: 5px;">
                          <p>${message.summary.text}</p>
                        `;
                    }
                }

                // Remove listener after handling the message
                chrome.runtime.onMessage.removeListener(handleMessage);
            });
        }, 500); // Delay of 500ms
    });

    // Remove the popup and clear timeout on mouseout
    link.addEventListener('mouseout', () => {
        clearTimeout(timeoutId);
        if (popup) {
            popup.remove();
        }
    });
});
