// Global functions for language management
window.changeLanguage = function(lang) {
  if (!lang) return;
  
  console.log(`=== changeLanguage called with lang: ${lang} ===`);
  
  // Save language preference
  localStorage.setItem('preferredLanguage', lang);
  document.documentElement.lang = lang;
  document.body.setAttribute('data-lang', lang);
  
  // Update URL without page reload
  const url = new URL(window.location.href);
  if (url.searchParams.get('hl') !== lang) {
    url.searchParams.set('hl', lang);
    window.history.replaceState({}, '', url);
  }
  
  // Try to use Google Translate if available
  const tryGoogleTranslate = () => {
    const combo = document.querySelector('.goog-te-combo');
    if (combo && combo.value !== lang) {
      try {
        combo.value = lang;
        combo.dispatchEvent(new Event('change'));
        console.log('Changed language via Google Translate combo');
        return true;
      } catch (e) {
        console.error('Error changing language via Google Translate:', e);
        return false;
      }
    }
    return !!combo;
  };

  // Try Google Translate first
  const googleSuccess = tryGoogleTranslate();
  
  // If Google Translate isn't ready, set up a retry mechanism
  if (!googleSuccess) {
    console.log('Google Translate not ready, setting up retry...');
    let retryCount = 0;
    const maxRetries = 5;
    
    const retryInterval = setInterval(() => {
      if (tryGoogleTranslate() || ++retryCount >= maxRetries) {
        clearInterval(retryInterval);
        if (retryCount >= maxRetries) {
          console.warn('Max retries reached for Google Translate language change');
        }
      }
    }, 500);
  }
  
  // Update UI immediately
  updateUI(lang);
  
  // Set cookie for page reloads
  document.cookie = `googtrans=/es/${lang}; path=/; max-age=31536000; SameSite=Lax`;
};

// Hide Google Translate UI elements
function hideGoogleElements() {
  const selectors = [
    '.goog-te-banner-frame',
    '.goog-te-menu-frame',
    '.goog-te-gadget',
    '.goog-te-combo',
    '.goog-te-ftab',
    '.skiptranslate',
    '.goog-te-banner',
    '.goog-te-ftab-frame',
    '.goog-te-menu',
    '.goog-te-menu2',
    '.goog-te-balloon-frame'
  ];
  
  selectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      if (el && el.style) {
        el.style.display = 'none';
        el.style.visibility = 'hidden';
        el.style.opacity = '0';
        el.style.position = 'absolute';
        el.style.width = '1px';
        el.style.height = '1px';
        el.style.overflow = 'hidden';
        el.style.clip = 'rect(0, 0, 0, 0)';
        el.style.whiteSpace = 'nowrap';
      }
    });
  });
}

// Get current language
function getCurrentLang() {
  // Check URL first
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get('hl');
  if (urlLang === 'es' || urlLang === 'en') return urlLang;
  
  // Then check localStorage
  const storedLang = localStorage.getItem('preferredLanguage');
  if (storedLang === 'es' || storedLang === 'en') return storedLang;
  
  // Default to Spanish
  return 'es';
}

// Update UI based on language
function updateUI(lang) {
  // Update language toggle button
  const toggleBtn = document.getElementById('language-toggle');
  if (toggleBtn) {
    const span = toggleBtn.querySelector('span:first-child');
    if (span) {
      span.textContent = lang === 'es' ? 'IDIOMA' : 'LANGUAGE';
    }
  }
  
  // Update active language indicator
  document.querySelectorAll('[data-lang]').forEach(btn => {
    const btnLang = btn.getAttribute('data-lang');
    const check = btn.querySelector('.lang-check');
    if (check) {
      check.classList.toggle('hidden', btnLang !== lang);
    }
  });
}

// Set up language switcher
function setupLanguageSwitcher() {
  // Set up language buttons
  document.querySelectorAll('[data-lang]').forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const lang = this.getAttribute('data-lang');
      if (lang) {
        changeLanguage(lang);
        // Close menu after selection
        const menu = document.getElementById('menuLang');
        if (menu) menu.classList.add('hidden');
      }
    });
  });
}

// Initialize when DOM is ready
function initialize() {
  // Set initial language from URL, then localStorage, then default to 'es'
  let currentLang = 'es';
  
  // Try to get language from URL first
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get('hl');
  if (urlLang && (urlLang === 'es' || urlLang === 'en')) {
    currentLang = urlLang;
  } 
  // Then try localStorage
  else {
    const storedLang = localStorage.getItem('preferredLanguage');
    if (storedLang && (storedLang === 'es' || storedLang === 'en')) {
      currentLang = storedLang;
    }
  }
  
  // Update UI with current language
  updateUI(currentLang);
  document.documentElement.lang = currentLang;
  document.body.setAttribute('data-lang', currentLang);
  
  // Set up language switcher
  setupLanguageSwitcher();
  
  // Set up menu toggle
  const toggleBtn = document.getElementById('language-toggle');
  const langMenu = document.getElementById('menuLang');
  
  if (toggleBtn && langMenu) {
    // Toggle menu on button click
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isHidden = langMenu.classList.toggle('hidden');
      // Focus the first language option when opening
      if (!isHidden) {
        const firstLangBtn = langMenu.querySelector('[data-lang]');
        if (firstLangBtn) firstLangBtn.focus();
      }
    });
    
    // Close menu when clicking outside or pressing Escape
    const closeMenu = () => langMenu.classList.add('hidden');
    
    document.addEventListener('click', (e) => {
      if (!langMenu.contains(e.target) && !toggleBtn.contains(e.target)) {
        closeMenu();
      }
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeMenu();
      }
    });
  }
  
  // Set up a more aggressive interval for hiding Google elements initially
  const hideInterval = setInterval(() => {
    hideGoogleElements();
    // Once Google Translate is initialized, we can be less aggressive
    if (window.google && window.google.translate) {
      clearInterval(hideInterval);
      // Continue with a less aggressive interval
      setInterval(hideGoogleElements, 2000);
    }
  }, 300);
  
  // Initial hide
  hideGoogleElements();
  
  // Add a small delay to ensure everything is loaded
  setTimeout(() => {
    // Final update of UI in case anything was missed
    updateUI(currentLang);
    hideGoogleElements();
  }, 1000);
  
  console.log('Language switcher initialized with language:', currentLang);
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  // If the document is already loaded, run initialize after a short delay
  // to ensure other scripts have had a chance to run
  setTimeout(initialize, 100);
}

// Export functions for debugging
if (window.DEBUG) {
  window.__translateDebug = {
    hideGoogleElements,
    updateUI,
    getCurrentLang,
    changeLanguage: window.changeLanguage
  };
}
