function extractMessages(inputStrings) {
  const messages = Array.isArray(inputStrings) ? inputStrings : [inputStrings];
  
  const cleanupPatterns = [
    /down-context\s*/gi,
    /tail-\w+\s*/gi,
    /status-\w+\s*/gi,
    /ptt\d*:?\d*\s*/gi,
    /\d{1,2}:\d{2}\s*(?:PM|AM)\s*/gi,
    /react✨\s*/gi
  ];
  
  return messages.map(str => {
    let cleanedStr = String(str).trim();
    cleanupPatterns.forEach(pattern => {
      cleanedStr = cleanedStr.replace(pattern, '');
    });
    return cleanedStr.trim().replace(/\s+/g, ' ');
  }).join(' ');
}


const ReplySuggestionModule = (() => {
  let activePopup = null;

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .reply-suggestion-icon {
        position: absolute;
        right: -40px;
        top: 100%;
        width: 35px;
        height: 35px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0;
        background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
        color: white;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
        transition: all 0.3s ease;
        transform: translateY(-50%) rotate(0deg);
      }

      .reply-suggestion-icon:hover {
        transform: translateY(-50%) rotate(360deg) scale(1.1);
        background: linear-gradient(135deg, #ff6a88 0%, #ff6a88 50%, #6a11cb 100%);
      }

      .reply-suggestion-popup {
        position: absolute;
        left: 100%;
        top: 0;
        width: 350px;
        margin-left: 15px;
        background: linear-gradient(145deg, #1a2980 0%, #26d0ce 100%);
        border-radius: 20px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        z-index: 1000;
        padding: 15px;
        overflow: hidden;
        border: 2px solid rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(10px);
        animation: fadeIn 0.3s ease-out;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateX(20px); }
        to { opacity: 1; transform: translateX(0); }
      }

      .reply-suggestion-loading {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 150px;
        color: white;
        font-weight: bold;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 15px;
        position: relative;
        overflow: hidden;
      }

      .reply-suggestion-loading::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: linear-gradient(
          45deg, 
          transparent, 
          rgba(255,255,255,0.1), 
          transparent
        );
        animation: loadingGradient 2s linear infinite;
        transform: rotate(0deg);
      }

      @keyframes loadingGradient {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .reply-suggestion-loading::after {
        content: 'Generating AI Suggestions...';
        z-index: 1;
        position: relative;
      }

      .reply-suggestion-item {
        padding: 15px;
        cursor: pointer;
        color: #f0f0f0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        transition: all 0.3s ease;
        background: linear-gradient(90deg, rgba(255,255,255,0.05), transparent);
        border-radius: 10px;
        margin-bottom: 5px;
      }

      .reply-suggestion-item:hover {
        background: linear-gradient(90deg, rgba(255,255,255,0.1), transparent);
        transform: translateX(10px);
        color: white;
      }

      .reply-suggestion-item:last-child {
        border-bottom: none;
      }
    `;
    document.head.appendChild(style);
  }

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

  async function ReplyFromGen(inputMessage) {
    console.log('input msg: ', inputMessage);
    try {
      const writer = await ai.writer.create({
        length: "short",
        sharedContext: "English",
        tone: "formal",
      });
  
      let response = await writer.write(inputMessage);
  
      const maxLength = 1000;
      if (response.length > maxLength) {
        response = response.substring(0, maxLength) + '...';
      }
  
      console.log(response);
      writer.destroy();
  
      return response;
    } catch (error) {
      console.error("Error generating response:", error);
      return null;
    }
  }
  
  function createSuggestionIcon() {
    const icon = document.createElement('div');
    icon.innerHTML = '✨';
    icon.classList.add('reply-suggestion-icon');
    return icon;
  }

  function addSuggestionToPopup(popup, suggestion) {
    const suggestionEl = document.createElement('div');
    suggestionEl.classList.add('reply-suggestion-item');
    suggestionEl.textContent = suggestion;

    suggestionEl.addEventListener('click', () => {
      navigator.clipboard.writeText(suggestion).then(() => {
        suggestionEl.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
        setTimeout(() => {
          suggestionEl.style.backgroundColor = '';
        }, 300);
      }).catch(err => {
        console.error('Failed to copy: ', err);
      });
    });

    popup.appendChild(suggestionEl);
  }

  function handleClickOutside(event, popup) {
    if (popup && !popup.contains(event.target)) {
      popup.remove();
      document.removeEventListener('click', clickOutsideHandler);
    }
  }

  let clickOutsideHandler;



  async function createSuggestionPopup(messageText) {
    if (activePopup) {
      activePopup.remove();
    }

    const popup = document.createElement('div');
    popup.classList.add('reply-suggestion-popup');

    const loadingMessage = document.createElement('div');
    loadingMessage.classList.add('reply-suggestion-loading');
    popup.appendChild(loadingMessage);

    document.body.appendChild(popup);

    try {
      const prompts = [
        `Respond briefly and engagingly to "${messageText}".`,
        `Create a thoughtful and concise reply to "${messageText}".`
      ];
  
      const generateReplies = async (prompts) => {
        const replies = [];
        for (const prompt of prompts) {
          const reply = await ReplyFromGen(prompt);
          if (reply) replies.push(reply);
        }
        return replies;
      };
  
      const replies = await generateReplies(prompts);
  
      if (loadingMessage.parentNode) {
        loadingMessage.remove();
      }
  
      if (replies.length === 0) {
        popup.textContent = 'Unable to generate suggestions.';
        return popup;
      }
  
      replies.forEach(suggestion => {
        addSuggestionToPopup(popup, suggestion);
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
    } catch (error) {
      console.error('Error generating suggestions:', error);
      popup.textContent = 'Unable to generate suggestions.';
    }
  
    return popup;
  }

  function detectPlatform() {
    if (window.location.hostname.includes('web.telegram.org')) return 'telegram';
    if (window.location.hostname.includes('web.whatsapp.com')) return 'whatsapp';
    return null;
  }


  function attachSuggestionFeature(messageElement) {
    if (messageElement.querySelector('.reply-suggestion-icon')) return;
  
    const suggestionContainer = document.createElement('div');
    suggestionContainer.style.position = 'relative';
    messageElement.appendChild(suggestionContainer);
  
    const icon = createSuggestionIcon();
    suggestionContainer.appendChild(icon);
  
    messageElement.addEventListener('mouseenter', () => {
      icon.style.opacity = '1';
    });
  
    messageElement.addEventListener('mouseleave', () => {
      icon.style.opacity = '0';
    });
  
    icon.addEventListener('click', async (event) => {
      event.stopPropagation();
  
      // Remove any existing popups
      const existingPopup = document.querySelector('.reply-suggestion-popup');
      if (existingPopup) existingPopup.remove();
  
      const messageText = extractMessages(messageElement.textContent || '');
  
      try {
        const popup = await createSuggestionPopup(messageText);
        suggestionContainer.appendChild(popup);
  
        // Add click outside listener
        function handleClickOutside(e) {
          if (!popup.contains(e.target) && !icon.contains(e.target)) {
            popup.remove();
            document.removeEventListener('click', handleClickOutside);
          }
        }
  
        // Slight delay to prevent immediate closure
        setTimeout(() => {
          document.addEventListener('click', handleClickOutside);
        }, 0);
      } catch (error) {
        console.error('Failed to generate suggestions:', error);
      }
    });
  }

  function init() {
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

  return { init };
})();

window.addEventListener('load', ReplySuggestionModule.init);