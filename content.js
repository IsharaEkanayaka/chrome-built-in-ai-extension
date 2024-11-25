function debounce(func, delay) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
}

function markdownToHtml(markdown) {
  // Convert bold (e.g., **bold** or __bold__)
  let html = markdown.replace(/(\*\*|__)(.*?)\1/g, '<b>$2</b>');

  // Convert italic (e.g., *italic* or _italic_)
  html = html.replace(/(\*|_)(.*?)\1/g, '<i>$2</i>');

  // Convert headers (e.g., # Header 1, ## Header 2)
  html = html.replace(/^(#{1,6})\s*(.*)$/gm, (match, hashes, headerText) => {
      const level = hashes.length; // Count the number of '#' characters to determine the header level
      return `<h${level}>${headerText}</h${level}>`;
  });

  // Convert links (e.g., [text](http://url.com))
  html = html.replace(/\[([^\]]+)\]\((http[^\)]+)\)/g, '<a href="$2">$1</a>');

  // Convert unordered lists (e.g., * Item or - Item)
  html = html.replace(/^[\*\-]\s+(.*)$/gm, '<ul><li>$1</li></ul>');

  // Convert ordered lists (e.g., 1. Item)
  html = html.replace(/^(\d+)\.\s+(.*)$/gm, '<ol><li>$2</li></ol>');

  // Convert blockquotes (e.g., > Quote)
  html = html.replace(/^>\s+(.*)$/gm, '<blockquote>$1</blockquote>');

  // Convert line breaks (e.g., double newlines between paragraphs)
  html = html.replace(/\n\n/g, '</p><p>');

  // Wrap paragraphs (default block-level elements)
  html = html.replace(/^(?!<)(.*)$/gm, '<p>$1</p>');

  return html;
}



// Popup management functions
const PopupManager = {
  activePopup: null,
  fetchInProgress: false,
  hoverTimeout: null,

  async getSummarizer(content, event) {
    const canSummarize = await ai.summarizer.capabilities();
    let summarizer;

    if (canSummarize && canSummarize.available !== 'no') {
      if (canSummarize.available === 'readily') {
        summarizer = await ai.summarizer.create();
        console.log(content);
        const summarizedContent = await summarizer.summarize(content, { length: "short" });
        console.log("Summarized Content:", summarizedContent);

        // Update popup with summarized content
        this.updatePopupContent(summarizedContent);
        summarizer.destroy();
      } else {
        summarizer = await ai.summarizer.create();
        summarizer.addEventListener('downloadprogress', (e) => {
          console.log(e.loaded, e.total);
        });
        await summarizer.ready;
      }
    } else {
      this.updatePopupContent('Summarizer unavailable.');
    }
  },

  showPopup(initialContent, event, title = null, summaryText = "Waiting for summary...") {
    this.removePopup();
  
    const popup = document.createElement('div');
    popup.className = 'ai-popup';
  
    // Create content container
    const contentContainer = document.createElement('div');
    contentContainer.className = 'ai-popup-content';
  
    // Add title if provided
    if (title) {
      const titleContainer = document.createElement('div');
      titleContainer.className = 'ai-popup-title';
      titleContainer.textContent = title;
      contentContainer.appendChild(titleContainer);
    }
  
    // Add initial content (message)
    const messageContainer = document.createElement('div');
    messageContainer.className = 'ai-popup-message';
    messageContainer.textContent = initialContent;
    contentContainer.appendChild(messageContainer);
  
    popup.appendChild(contentContainer);

    // Create and add summary container
    const summaryContainer = document.createElement('div');
    summaryContainer.className = 'ai-popup-summary';
    summaryContainer.textContent = summaryText;
    contentContainer.appendChild(summaryContainer);

    // Add CSS styles (same as before)
    const style = document.createElement('style');
    style.textContent = `
      @keyframes gradientBG {
        0% { background-position: 0% 50% }
        50% { background-position: 100% 50% }
        100% { background-position: 0% 50% }
      }
  
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
  
      .ai-popup {
        position: absolute;
        z-index: 10000;
        padding: 2px;
        border-radius: 10px;
        background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
        background-size: 400% 400%;
        animation: gradientBG 15s ease infinite;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      }
  
      .ai-popup-content {
        background: rgba(15, 15, 20, 0.95);
        color: #fff;
        padding: 15px;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        max-width: 400px;
        max-height: 400px;
        overflow: hidden;
        animation: fadeIn 0.3s ease forwards;
      }
  
      .ai-popup-title {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 10px;
      }
  
      .ai-popup-message {
        font-size: 12px;
        color: #F3F8FF;  
        margin-bottom: 10px; /* Added margin for spacing */
        display: -webkit-box;         /* Enables multi-line truncation */
    -webkit-line-clamp: 2;       /* Number of lines before truncating */
    -webkit-box-orient: vertical; /* Ensure the box behaves like a block */
    overflow: hidden;            /* Hide the overflowing content */
    text-overflow: ellipsis;     /* Add the ellipsis (...) */
      }

      .ai-popup-summary {
        font-size: 14px;
        margin-top: 10px; 
        padding: 10px;
        color: white;  
        animation: gradientBG 15s ease infinite;
        display: -webkit-box;         /* Enables multi-line truncation */
    -webkit-line-clamp: 3;       /* Number of lines before truncating */
    -webkit-box-orient: vertical; /* Ensure the box behaves like a block */
    overflow: hidden;            /* Hide the overflowing content */
    text-overflow: ellipsis;     /* Add the ellipsis (...) */
      }

      /* Remove scrollbar */
      .ai-popup-content::-webkit-scrollbar {
        display: none;
      }
    `;
    document.head.appendChild(style);
  
    // Position popup near the mouse event
    popup.style.top = `${event.pageY + 10}px`;
    popup.style.left = `${event.pageX + 10}px`;
  
    document.body.appendChild(popup);
    this.activePopup = popup;
  
    // Add event listeners to the popup itself
    popup.addEventListener('mouseover', () => {
      this.isHoveringPopup = true;
    });
  
    popup.addEventListener('mouseout', () => {
      this.isHoveringPopup = false;
      this.tryToRemovePopup();
    });
},
  

  updatePopupContent(newSummaryText) {
    if (this.activePopup) {
        // Convert markdown to HTML (using a simple approach, consider using a library for full markdown support)
        const htmlContent = markdownToHtml(newSummaryText); 

        // Update the summary text and remove the animation
        const summaryContainer = this.activePopup.querySelector('.ai-popup-summary');
        summaryContainer.innerHTML = htmlContent;  // Use innerHTML to render HTML
        summaryContainer.style.animation = 'none';  // Remove animation
        summaryContainer.style.background = 'none';  // Optional: remove gradient background
    }
},

  removePopup() {
    if (this.activePopup) {
      this.activePopup.remove();
      this.activePopup = null;
    }
  },

tryToRemovePopup() {
  // Only remove the popup if not hovering over the link or popup
  if (!this.isHoveringLink && !this.isHoveringPopup) {
    this.removePopup();
  }
}
};

// Adjust the link mouseout handler
function detectLinks() {
  try {
    const links = document.querySelectorAll('a[href]:not([href^="javascript:"]):not([href^="#"])');

    links.forEach(link => {
      if (!processedLinks.has(link)) {
        const href = link.href;

        const mouseoverHandler = (event) => {
          // Track that the mouse is over the link
          PopupManager.isHoveringLink = true;
        
          if (fetchTimeoutId) {
            clearTimeout(fetchTimeoutId);
          }
        
          fetchTimeoutId = setTimeout(() => {
            fetchAndDisplayContent(href, event);
          }, 200);
        };
        
        const mouseoutHandler = () => {
          // Track that the mouse has left the link
          PopupManager.isHoveringLink = false;
        
          // Attempt to remove the popup if not hovering over the popup itself
          PopupManager.tryToRemovePopup();
        };

        link.addEventListener('mouseover', mouseoverHandler);
        link.addEventListener('mouseout', mouseoutHandler);

        processedLinks.set(link, () => {
          link.removeEventListener('mouseover', mouseoverHandler);
          link.removeEventListener('mouseout', mouseoutHandler);
        });
      }
    });
  } catch (error) {
    console.error('Error in detectLinks:', error);
  }
}


(() => {
  const processedLinks = new WeakMap();
  let lastFetchedUrl = null;
  let fetchTimeoutId = null;

  function extractWebsiteMainSubject(html, options = {}) {
    const { maxLines = 10, includeHeaders = true, includeMeta = true } = options;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
  
    // Step 1: Extract Meta Description (if enabled)
    let metaContent = '';
    if (includeMeta) {
        const metaDescription = doc.querySelector('meta[name="description"]');
        const metaKeywords = doc.querySelector('meta[name="keywords"]');
        if (metaDescription) metaContent += `Meta Description: ${metaDescription.content.trim()}\n`;
        if (metaKeywords) metaContent += `Keywords: ${metaKeywords.content.trim()}\n`;
    }
  
    // Step 2: Extract Web Title
    const webTitle = doc.querySelector('title') ? doc.querySelector('title').textContent.trim() : 'No title found';
  
    // Step 3: Extract Key Headers
    const headers = [];
    if (includeHeaders) {
        doc.querySelectorAll('h1, h2').forEach(header => {
            headers.push(header.textContent.trim());
        });
    }
  
    // Step 4: Identify Main Content
    const contentContainers = ['main', 'article', '.content', '#content', 'section'];
    let mainContent = null;
    for (const selector of contentContainers) {
        mainContent = doc.querySelector(selector);
        if (mainContent) break;
    }
    if (!mainContent) mainContent = doc.body;
  
    const paragraphs = [];
    mainContent.querySelectorAll('p').forEach(paragraph => {
        const text = paragraph.textContent.trim();
        if (text.length > 25) paragraphs.push(text); // Prioritize meaningful paragraphs
    });
  
    // Step 5: Deduplicate and Prioritize Content
    const uniqueContent = [...new Set([...headers, ...paragraphs])]
        .map(line => line.replace(/\s+/g, ' ').trim())
        .filter(line => line.length > 0);
  
    // Step 6: Combine Extracted Parts (for combined return)
    const overview = [];
    if (metaContent) overview.push(metaContent.trim());
    if (headers.length > 0) overview.push(`Key Sections: ${headers.slice(0, 3).join(', ')}`);
    overview.push(...uniqueContent.slice(0, maxLines - overview.length));
  
    // Return the data separately as requested
    return {
        webtitle: webTitle,
        headers: headers,
        metadata: metaContent.trim(),
        paragraphs: paragraphs,
        combinedOverview: overview.join('\n')
    };
}

  // Function to fetch and display content
  async function fetchAndDisplayContent(url, event) {
    if (PopupManager.fetchInProgress || lastFetchedUrl === url) {
      return;
    }
  
    try {
      PopupManager.fetchInProgress = true;
      lastFetchedUrl = url;
  
      PopupManager.showPopup("Loading website title and sections...", event);
  
      const response = await chrome.runtime.sendMessage({
        type: 'fetchContent',
        url: url,
      });
  
      if (!response.success) {
        throw new Error(response.error);
      }
  
      const options = { maxLines: 20, includeHeaders: true, includeMeta: true };
      const extractedData = extractWebsiteMainSubject(response.content, options);
  
      // Show initial content (title and key sections)   
      PopupManager.showPopup(extractedData.headers.join(' | '), event,extractedData.webtitle);
  
      // Fetch summary and update the popup
      const toSummarizeText = `This website titled ${extractedData.webtitle}. And website contains these sections ${extractedData.headers} Here are its contains: ${extractedData.paragraphs[50]}.`
      PopupManager.getSummarizer(toSummarizeText, event);
    } catch (error) {
      PopupManager.showPopup(`Error loading content: ${error.message}`, event);
    } finally {
      PopupManager.fetchInProgress = false;
    }
  }
  
  function detectLinks() {
    try {
      const links = document.querySelectorAll('a[href]:not([href^="javascript:"]):not([href^="#"])');
      
      links.forEach(link => {
        if (!processedLinks.has(link)) {
          const href = link.href;
          
          // Validate URL
          try {
            new URL(href);
          } catch (e) {
            return;
          }
          
          const mouseoverHandler = (event) => {
            // Clear any existing fetch timeout
            if (fetchTimeoutId) {
              clearTimeout(fetchTimeoutId);
            }
            
            // Set a small delay before fetching to avoid unnecessary fetches
            fetchTimeoutId = setTimeout(() => {
              fetchAndDisplayContent(href, event);
            }, 200); // 200ms delay before fetching
          };
          
          const mouseoutHandler = () => {
            // Clear fetch timeout if mouse moves away before fetch starts
            if (fetchTimeoutId) {
              clearTimeout(fetchTimeoutId);
              fetchTimeoutId = null;
            }
            PopupManager.removePopup();
            // Only reset lastFetchedUrl if we're not in the middle of a fetch
            if (!PopupManager.fetchInProgress) {
              lastFetchedUrl = null;
            }
          };
          
          link.addEventListener('mouseover', mouseoverHandler);
          link.addEventListener('mouseout', mouseoutHandler);
          
          processedLinks.set(link, () => {
            link.removeEventListener('mouseover', mouseoverHandler);
            link.removeEventListener('mouseout', mouseoutHandler);
          });
        }
      });
    } catch (error) {
      console.error('Error in detectLinks:', error);
    }
  }
  
  // Rest of the code remains the same...
  const debouncedDetectLinks = debounce(detectLinks, 250);
  
  const observer = new MutationObserver((mutations) => {
    try {
      const hasNewNodes = mutations.some(mutation => 
        mutation.addedNodes.length > 0 || 
        mutation.type === 'attributes' && mutation.attributeName === 'href'
      );
      
      if (hasNewNodes) {
        debouncedDetectLinks();
      }
    } catch (error) {
      console.error('Error in MutationObserver:', error);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['href']
  });
  
  function cleanup() {
    observer.disconnect();
    PopupManager.removePopup();
    
    for (const link of processedLinks.keys()) {
      const cleanup = processedLinks.get(link);
      if (cleanup) cleanup();
    }
  }
  
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      cleanup();
    }
  });

  window.addEventListener('beforeunload', () => {
    cleanup();
  }, { capture: true });
  
  detectLinks();
})();


