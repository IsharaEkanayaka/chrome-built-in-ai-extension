// Reply Suggestion Module
const ReplySuggestionModule = (() => {
    let activePopup = null;
    // Inject advanced AI-inspired styles
    function injectStyles() {
      const style = document.createElement('style');
      style.textContent = `
  .reply-suggestion-container {
      position: relative;
    }

.reply-suggestion-icon {
  position: absolute;
  right: -40px;
  top: 100%;
  transform: translateY(-50%);
  width: 35px;
  height: 35px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #3a3d98 0%, #1c2039 100%);
  box-shadow: 0 4px 15px rgba(58, 61, 152, 0.5);
  color: #f0f0f0;
  font-size: 18px;
  z-index: 10;
}

.reply-suggestion-icon:hover {
  transform: translateY(-50%) scale(1.1);
  box-shadow: 0 6px 20px rgba(58, 61, 152, 0.7);
}

.reply-suggestion-popup {
  position: absolute;
  left: 100%;
  top: 0;
  width: 300px;
  margin-left: 15px;
  background: linear-gradient(225deg, #343a40 0%, #1f1f2f 50%, #1c1c26 100%);
  background-size: 200% 200%;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
  overflow: hidden;
  animation: gradient-flow-night 5s ease infinite;
  z-index: 1000;
}

@keyframes gradient-flow-night {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.reply-suggestion-popup-inner {
  background: rgba(48, 48, 48, 0.9);
  margin: 3px;
  border-radius: 12px;
  padding: 10px;
}

.reply-suggestion-popup-title {
  font-weight: bold;
  color: #d1d1e0;
  text-align: center;
  margin-bottom: 10px;
  background: linear-gradient(to right, #6264d3, #5358a4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.reply-suggestion-item {
  padding: 10px;
  cursor: pointer;
  border-bottom: 1px solid #2f2f3f;
  transition: all 0.2s ease;
  background: transparent;
  color: #d1d1e0;
  position: relative;
  overflow: hidden;
}

.reply-suggestion-item:hover {
  background: linear-gradient(to right, #3a3d98, #1c2039);
  color: #ffffff;
}

.reply-suggestion-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: all 0.5s;
}

.reply-suggestion-item:hover::before {
  left: 100%;
}

      `;
      document.head.appendChild(style);
    }
  
    // Configuration for platforms
    const platforms = {
      telegram: {
        messageSelector: '.message',
        inputSelector: '.composer-rich-textarea',
      },
      whatsapp: {
        messageSelector: 'div.message-in, div.message-out',
        inputSelector: '[data-testid="compose-input-container"] div[contenteditable="true"]',
      }
    };
  
    // AI-powered reply suggestion function
    async function generateReplySuggestions(messageText) {
      // More contextual and AI-like suggestions
      const suggestions = [
        "Analyze this further",
        "Request more context",
        "Summarize key points",
        "Provide expert insight",
        "Explore alternative perspectives",
        "Generate detailed response"
      ];
      return suggestions;
    }
  
    // Create suggestion icon
    function createSuggestionIcon() {
      const icon = document.createElement('div');
      icon.innerHTML = '✨'; // Sparkle emoji for AI feel
      icon.classList.add('reply-suggestion-icon');
      return icon;
    }
  
    // Create suggestion popup
    function createSuggestionPopup(suggestions) {
      if (activePopup) {
        activePopup.remove();
    }
      const popup = document.createElement('div');
      popup.classList.add('reply-suggestion-popup');
  
      const inner = document.createElement('div');
      inner.classList.add('reply-suggestion-popup-inner');
      popup.appendChild(inner);
  
      const title = document.createElement('div');
      title.textContent = 'AI Suggestions';
      title.classList.add('reply-suggestion-popup-title');
      inner.appendChild(title);
  
      suggestions.forEach(suggestion => {
        const suggestionEl = document.createElement('div');
        suggestionEl.textContent = suggestion;
        suggestionEl.classList.add('reply-suggestion-item');
        
        suggestionEl.addEventListener('click', () => {
          insertReply(suggestion);
          popup.remove();
        });
        
        inner.appendChild(suggestionEl);
      });

      activePopup = popup;
      // Handle outside clicks
      const handleOutsideClick = (e) => {
          if (!popup.contains(e.target)) {
              popup.remove();
              activePopup = null;
              document.removeEventListener('click', handleOutsideClick);
          }
      };

      // Delay to avoid immediate trigger
      setTimeout(() => {
          document.addEventListener('click', handleOutsideClick);
      }, 0);
  
      return popup;
    }
  
    // Insert reply into input field
    // Insert reply into input field
    function insertReply(replyText) {
        console.log('Reply text:', replyText);
        const platform = detectPlatform();
        if (!platform) {
            console.error('Platform not detected');
            return;
        }
    
        const inputSelector = platforms[platform]?.inputSelector;
        const inputField = document.querySelector(inputSelector);
    
        if (!inputField) {
            console.error('Input field not found for selector:', inputSelector);
            return;
        }
    
        try {
            // Handle contenteditable fields
            if (inputField.getAttribute('contenteditable') === 'true') {
                inputField.focus();
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(inputField);
                range.collapse(false);
                selection.removeAllRanges();
                selection.addRange(range);
                document.execCommand('insertText', false, replyText);
            } else {
                // Standard input fields
                inputField.value = replyText;
                inputField.focus();
            }
    
            // Trigger events
            ['input', 'change', 'keydown', 'keyup'].forEach(eventType => {
                const event = new Event(eventType, { bubbles: true });
                inputField.dispatchEvent(event);
            });
    
            console.log('Message inserted successfully');
        } catch (error) {
            console.error('Error inserting message:', error);
        }
    }
    
  
    // Detect current platform
    function detectPlatform() {
      if (window.location.hostname.includes('web.telegram.org')) return 'telegram';
      if (window.location.hostname.includes('web.whatsapp.com')) return 'whatsapp';
      return null;
    }
  
    // Attach suggestion feature to a message
    function attachSuggestionFeature(messageElement) {
      // Prevent multiple icons
      if (messageElement.querySelector('.reply-suggestion-icon')) return;
  
      // Create container for icon
      const suggestionContainer = document.createElement('div');
      suggestionContainer.classList.add('reply-suggestion-container');
      messageElement.appendChild(suggestionContainer);
  
      // Create and attach suggestion icon
      const icon = createSuggestionIcon();
      suggestionContainer.appendChild(icon);
  
      // Show icon on hover
      messageElement.addEventListener('mouseenter', () => {
        icon.style.opacity = '1';
      });
  
      messageElement.addEventListener('mouseleave', () => {
        icon.style.opacity = '0';
      });
  
      // Add click event to show suggestions
      icon.addEventListener('click', async (event) => {
        event.stopPropagation();
  
        // Extract message text
        const messageText = messageElement.textContent || '';
  
        // Remove any existing popups
        const existingPopup = document.querySelector('.reply-suggestion-popup');
        if (existingPopup) existingPopup.remove();
  
        try {
          // Generate suggestions
          const suggestions = await generateReplySuggestions(messageText);
          
          // Create and attach popup
          const popup = createSuggestionPopup(suggestions);
          suggestionContainer.appendChild(popup);
        } catch (error) {
          console.error('Failed to generate suggestions:', error);
        }
      });
    }
  
    // Main initialization function
    function init() {
      // Inject global styles
      injectStyles();
  
      const platform = detectPlatform();
      if (!platform) return;
  
      const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const messages = node.querySelectorAll(platforms[platform].messageSelector);
                messages.forEach(attachSuggestionFeature);
              }
            });
          }
        });
      });
  
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
  
      const messages = document.querySelectorAll(platforms[platform].messageSelector);
      messages.forEach(attachSuggestionFeature);
    }
  
    // Public API
    return {
      init
    };
  })();
  
  // Initialize the module when the page loads
  window.addEventListener('load', ReplySuggestionModule.init);