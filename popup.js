document.addEventListener('DOMContentLoaded', () => {
  const summarizeButton = document.getElementById('summarizeButton');
  const downloadButton = document.getElementById('downloadButton');
  const summaryTextarea = document.getElementById('summary');

  // Enhanced content extraction from text inputs
  function extractContentFromTextInputs() {
      const textInputs = document.querySelectorAll('input[type="text"], textarea');
      
      const inputTexts = Array.from(textInputs)
          .map(input => input.value.trim())
          .filter(text => text.length > 0);
      
      return inputTexts.join('\n\n');
  }

  // Main function to handle web page summarization
  async function summarizeWebPage() {
      try {
          // Visual loading state
          summarizeButton.classList.add('loading');
          summarizeButton.disabled = true;
          summaryTextarea.value = 'Extracting and summarizing content...';

          // Extract page content
          const pageContent = await extractMainContent();

          // Check content validity
          if (!pageContent || pageContent.trim().length < 50) {
              throw new Error('Insufficient content for summarization');
          }

          // Generate summary
          const summary = await summarizeContent(pageContent);

          // Display summary
          summaryTextarea.value = summary;

          // Show download button
          downloadButton.style.display = 'block';
      } catch (error) {
          // More informative error message
          console.error('Summarization Process Error:', error);
          summaryTextarea.value = `Error: ${error.message || 'Unable to generate summary'}. 
          
Possible reasons:
- No text content found
- Page may have restrictions
- Content too complex`;
      } finally {
          // Reset button state
          summarizeButton.classList.remove('loading');
          summarizeButton.disabled = false;
      }
  }
  // Function to scrape text from a website
async function scrapeText(url) {
  console.log("Starting scraping");
  try {
    // Fetch the content of the website
    const response = await fetch(url);
    const html = await response.text();

    // Parse the HTML response
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extract the text from a specific element or all text on the page
    const textContent = doc.body.innerText;

    console.log(textContent); // This will print the scraped text to the console
  } catch (error) {
    console.error('Error scraping the website:', error);
  }
}

  // Function to extract main content from the current web page
  async function extractMainContent() {
      return new Promise((resolve, reject) => {
          // Check if running in a browser environment
          if (typeof chrome !== 'undefined' && chrome.tabs) {
              // Chrome extension context
              chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                  chrome.tabs.sendMessage(tabs[0].id, { action: 'extract_content' }, (response) => {
                      if (chrome.runtime.lastError) {
                          reject(chrome.runtime.lastError);
                      } else {
                          resolve(response.content);
                      }
                  });
              });
          } else {
              // Fallback for direct browser usage
              const content = extractMainContentText();
              resolve(content);
          }
      });
  }

  // Comprehensive text extraction method
  function extractMainContentText() {
      try {
          // Prioritize specific extraction methods
          const methods = [
              () => {
                  // Method 1: Try to extract from text inputs first
                  const inputText = extractContentFromTextInputs();
                  if (inputText) return inputText;
                  return null;
              },
              () => {
                  // Method 2: Extract from main content areas
                  const contentSelectors = [
                      'article',
                      'main',
                      '.content',
                      '#content',
                      '.main-content',
                      'div[role="main"]'
                  ];

                  for (const selector of contentSelectors) {
                      const element = document.querySelector(selector);
                      if (element && element.innerText.trim().length > 50) {
                          return element.innerText;
                      }
                  }
                  return null;
              },
              () => {
                  // Method 3: Extract from paragraphs
                  const paragraphs = Array.from(document.getElementsByTagName('p'))
                      .filter(p => p.textContent.trim().length > 50);

                  paragraphs.sort((a, b) => b.textContent.length - a.textContent.length);
                  return paragraphs.slice(0, 5).map(p => p.textContent).join('\n\n');
              },
              () => {
                  // Fallback: Entire body text
                  return document.body.innerText;
              }
          ];

          // Try methods in order
          for (const method of methods) {
              const content = method();
              if (content && content.trim().length > 50) {
                  return content;
              }
          }

          throw new Error('No suitable content found');
      } catch (error) {
          console.error('Content extraction error:', error);
          return 'Unable to extract page content.';
      }
  }

  // Function to summarize text using AI (placeholder implementation)
  async function summarizeContent(text) {
      try {
          // Simulate AI summarization (replace with actual API)
          const summary = await aiSummarize(text);
          return summary;
      } catch (error) {
          console.error('Summarization error:', error);
          return 'Unable to generate summary. Please try again.';
      }
  }

  // Placeholder AI summarization function
  async function aiSummarize(text) {
      // Implement your preferred summarization method
      // This is a simple extractive summarization approach
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      
      // Simple scoring based on sentence length
      const scoredSentences = sentences.map(sentence => ({
          text: sentence,
          score: sentence.split(' ').length
      }));

      // Sort sentences by score and take top 3-5
      const topSentences = scoredSentences
          .sort((a, b) => b.score - a.score)
          .slice(0, 5)
          .map(s => s.text.trim())
          .join('. ');

      return topSentences + '.';
  }

  // Function to download summary as PDF
  function downloadSummaryAsPDF() {
      const { jsPDF } = window;
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(16);
      doc.text('Web Page Summary', 10, 10);
      
      // Add summary text
      doc.setFontSize(12);
      const summaryText = summaryTextarea.value;
      const splitText = doc.splitTextToSize(summaryText, 180);
      doc.text(splitText, 10, 20);
      
      // Save PDF
      doc.save('web_page_summary.pdf');
  }

  // Event listener for summarize button
  summarizeButton.addEventListener('click', scrapeText);

  // Event listener for download button
  downloadButton.addEventListener('click', downloadSummaryAsPDF);
});

// Logging for debugging
console.log('Briefly summarization script loaded successfully');