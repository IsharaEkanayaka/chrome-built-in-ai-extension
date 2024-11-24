(() => {
    const processedLinks = new WeakMap();
    let hoveredLink = null;
    let isShiftPressed = false;
    let lastFetchedUrl = null;
  
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
        .replace(/\s+/g, ' ')           // Replace multiple spaces with single space
        .replace(/\n\s*\n/g, '\n')      // Replace multiple newlines with single newline
        .replace(/^\s+|\s+$/g, '')      // Trim start and end
        .split('\n')                    // Split into lines
        .filter(line => line.trim())    // Remove empty lines
        .join('\n');                    // Join back together
    }
  
    // Function to fetch and display content
    async function fetchAndDisplayContent(url) {
      if (lastFetchedUrl === url) return;
      lastFetchedUrl = url;
      
      try {
        console.log('Fetching content from:', url);
        
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
        
      } catch (error) {
        console.error('Error fetching content:', error.message);
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
            
            const mouseoverHandler = () => {
              hoveredLink = href;
            };
            
            const mouseoutHandler = () => {
              if (hoveredLink === href) {
                hoveredLink = null;
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
    
    // Handle shift key and content fetching
    function handleShiftKey(event) {
      if (event.key === 'Shift') {
        if (event.type === 'keydown' && !isShiftPressed) {
          isShiftPressed = true;
          if (hoveredLink) {
            fetchAndDisplayContent(hoveredLink);
          }
        } else if (event.type === 'keyup') {
          isShiftPressed = false;
        }
      }
    }
    
    document.addEventListener('keydown', handleShiftKey);
    document.addEventListener('keyup', handleShiftKey);
    
    // Debounce function
    function debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }
    
    const debouncedDetectLinks = debounce(detectLinks, 250);
    
    // Set up MutationObserver
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
    
    // Cleanup function
    function cleanup() {
      observer.disconnect();
      document.removeEventListener('keydown', handleShiftKey);
      document.removeEventListener('keyup', handleShiftKey);
      
      for (const link of processedLinks.keys()) {
        const cleanup = processedLinks.get(link);
        if (cleanup) cleanup();
      }
    }
    
    window.addEventListener('unload', cleanup);
    
    // Initial link detection
    detectLinks();
  })();