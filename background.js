chrome.runtime.onMessage.addListener(async (message, sender) => {
    if (message.type === "summarize") {
        const apiURL = "https://api.gemini-nano.com/summarize"; // Example API URL

        try {
            const response = await fetch(apiURL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer YOUR_API_KEY"
                },
                body: JSON.stringify({ url: message.url })
            });

            if (response.ok) {
                const data = await response.json();
                chrome.tabs.sendMessage(sender.tab.id, { 
                    type: "summaryResult", 
                    summary: data, 
                    url: message.url 
                });
            } else {
                chrome.tabs.sendMessage(sender.tab.id, { 
                    type: "summaryResult", 
                    error: `Failed to fetch summary: ${response.statusText}`, 
                    url: message.url 
                });
            }
        } catch (error) {
            chrome.tabs.sendMessage(sender.tab.id, { 
                type: "summaryResult", 
                error: `An error occurred: ${error.message}`, 
                url: message.url 
            });
        }
    }
});
