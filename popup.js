document.getElementById("summarizeButton").addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        function: summarizeContent, // Inject summarizer function
      },
      (results) => {
        const summarizedContent = results[0]?.result;
  
        const summaryTextArea = document.getElementById("summary");
        const downloadButton = document.getElementById("downloadButton");
  
        if (summarizedContent) {
          summaryTextArea.value = summarizedContent;
          downloadButton.style.display = "block"; // Enable download button
        } else {
          summaryTextArea.value = "No summary could be generated.";
          downloadButton.style.display = "none";
        }
      }
    );
  });
  
  document.getElementById("downloadButton").addEventListener("click", () => {
    const summary = document.getElementById("summary").value;
  
    if (summary.trim()) {
      const pdf = new jsPDF();
      pdf.setFont("Helvetica");
      pdf.setFontSize(12);
  
      const margin = 10;
      const pageWidth = pdf.internal.pageSize.width;
  
      const textLines = pdf.splitTextToSize(summary, pageWidth - margin * 2);
      pdf.text(textLines, margin, margin + 10);
  
      pdf.save("summary.pdf");
    } else {
      alert("No summary available to download!");
    }
  });
  
  // Function to summarize content (executed in the webpage context)
  function summarizeContent() {
    return new Promise(async (resolve) => {
      const content = document.body.innerText;
      const event = {}; // Dummy event object for compatibility
  
      try {
        const canSummarize = await ai.summarizer.capabilities();
        let summarizer;
  
        if (canSummarize && canSummarize.available !== "no") {
          if (canSummarize.available === "readily") {
            summarizer = await ai.summarizer.create();
            const summarizedContent = await summarizer.summarize(content, { length: "short" });
            summarizer.destroy();
            resolve(summarizedContent);
          } else {
            summarizer = await ai.summarizer.create();
            summarizer.addEventListener("downloadprogress", (e) => {
              console.log(`Download progress: ${e.loaded}/${e.total}`);
            });
            await summarizer.ready;
            resolve("Summarizer is initializing. Please try again shortly.");
          }
        } else {
          resolve("Summarizer unavailable.");
        }
      } catch (error) {
        console.error("Error summarizing content:", error);
        resolve("An error occurred while summarizing the content.");
      }
    });
  }
  