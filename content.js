 
    

function debounce(func, delay) {
    let timeout;
    return function (...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), delay);
    };
  }
  
// Popup management functions
const PopupManager = {
    activePopup: null,
    fetchInProgress: false,

    async getSummarizer(content, event) {
        const canSummarize = await ai.summarizer.capabilities();
        let summarizer;
        if (canSummarize && canSummarize.available !== 'no') {
            if (canSummarize.available === 'readily') {
                // The summarizer can immediately be used.
                summarizer = await ai.summarizer.create();
                const summrizedContent = await summarizer.summarize(content,{ length: "short" });
                console.log(summrizedContent);
                PopupManager.showPopup(summrizedContent, event); // Corrected this line
                summarizer.destroy();
    
            } else {
                // The summarizer can be used after the model download.
                summarizer = await ai.summarizer.create();
                summarizer.addEventListener('downloadprogress', (e) => {
                    console.log(e.loaded, e.total);
                });
                await summarizer.ready;
            }
        } else {
            // The summarizer can't be used at all.
        }
    },
    
    showPopup(summrizedContent, event) {
      // Remove any existing popup
      this.removePopup();
      
      // Create new popup
      const popup = document.createElement('div');
      
      // Add class for styling
      popup.className = 'ai-popup';
      
      // Create and append content container
      const contentContainer = document.createElement('div');
      contentContainer.className = 'ai-popup-content';
      contentContainer.textContent = summrizedContent || 'Loading...';
      popup.appendChild(contentContainer);
  
      // Add CSS styles
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
          max-height: 300px;
          overflow: auto;
          animation: fadeIn 0.3s ease forwards;
        }
  
        .ai-popup-content::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
  
        .ai-popup-content::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
  
        .ai-popup-content::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
        }
  
        .ai-popup-content::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `;
      document.head.appendChild(style);
      
      // Position popup
      popup.style.top = `${event.pageY + 10}px`;
      popup.style.left = `${event.pageX + 10}px`;
      
      document.body.appendChild(popup);
      this.activePopup = popup;
    },
  
    removePopup() {
      if (this.activePopup) {
        this.activePopup.remove();
        this.activePopup = null;
      }
    }
  };


  

  
  (() => {
    const processedLinks = new WeakMap();
    let lastFetchedUrl = null;
    let fetchTimeoutId = null;
  
    // Function to extract plain text from HTML content
    function extractPlainText(html) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Remove unwanted elements
      const elementsToRemove = [
        'script', 'style', 'iframe', 'img', 'video', 
        'audio', 'noscript', 'canvas', 'svg', 'header', 
        'footer', 'nav', 'aside'
      ];
      
      elementsToRemove.forEach(tag => {
        doc.querySelectorAll(tag).forEach(el => el.remove());
      });
      
      // Try to get main content
      const mainContent = 
        doc.querySelector('main') ||
        doc.querySelector('article') ||
        doc.querySelector('.content') ||
        doc.querySelector('#content') ||
        doc.body;
  
      if (!mainContent) {
        return 'No content found';
      }
  
      // Get text content and clean it up
      let text = mainContent.textContent || '';
      return text
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .replace(/^\s+|\s+$/g, '')
        .split('\n')
        .filter(line => line.trim())
        .join('\n');
    }
  
    // Function to fetch and display content
    async function fetchAndDisplayContent(url, event) {
      // If already fetching or same URL, don't fetch again
      if (PopupManager.fetchInProgress || lastFetchedUrl === url) {
        return;
      }
      
      try {
        PopupManager.fetchInProgress = true;
        lastFetchedUrl = url;
        console.log('Fetching content from:', url);
        
        // Show loading state
        PopupManager.showPopup('Loading...', event);
        
        // Send message to background script to fetch content
        const response = await chrome.runtime.sendMessage({
          type: 'fetchContent',
          url: url
        });
        
        if (!response.success) {
          throw new Error(response.error);
        }
  
        // Extract and display plain text
        const plainText = extractPlainText(response.content);
        console.log('Content:', plainText);
        PopupManager.getSummarizer(plainText,event);
        
      } catch (error) {
        console.error('Error fetching content:', error.message);
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


  