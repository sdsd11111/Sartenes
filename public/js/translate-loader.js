/**
 * Google Translate Widget Loader
 * Handles loading and initializing the Google Translate widget
 */

// Configuration
const CONFIG = {
    defaultLang: 'es',
    supportedLangs: ['es', 'en'],
    cookieName: 'googtrans',
    cookieDomain: window.location.hostname,
    cookieExpiryDays: 30
};

/**
 * Get the current language from localStorage or cookie
 */
function getCurrentLang() {
    // Check localStorage first
    const storedLang = localStorage.getItem('userLanguage');
    if (storedLang && CONFIG.supportedLangs.includes(storedLang)) {
        return storedLang;
    }

    // Check cookie
    const cookieMatch = document.cookie.match(new RegExp(`${CONFIG.cookieName}=([^;]+)`));
    if (cookieMatch) {
        const langMatch = cookieMatch[1].match(/\/\w+\/(\w+)/);
        if (langMatch && CONFIG.supportedLangs.includes(langMatch[1])) {
            return langMatch[1];
        }
    }

    // Default to browser language or config default
    const browserLang = navigator.language.split('-')[0];
    return CONFIG.supportedLangs.includes(browserLang) ? browserLang : CONFIG.defaultLang;
}

/**
 * Set the language in both localStorage and cookie
 */
function setLanguage(lang) {
    if (!CONFIG.supportedLangs.includes(lang)) return;
    
    // Update localStorage
    localStorage.setItem('userLanguage', lang);
    
    // Update cookie
    const date = new Date();
    date.setTime(date.getTime() + (CONFIG.cookieExpiryDays * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${CONFIG.cookieName}=/es/${lang};${expires};path=/;domain=${CONFIG.cookieDomain};SameSite=Lax`;
    
    // Update UI
    updateLanguageUI(lang);
}

/**
 * Update the language UI elements
 */
function updateLanguageUI(lang) {
    // Update checkmarks
    document.querySelectorAll('.lang-check').forEach(el => {
        el.classList.toggle('hidden', el.parentElement.dataset.lang !== lang);
    });
    
    // Update any other UI elements that depend on language
    document.documentElement.lang = lang;
}

/**
 * Load the Google Translate widget
 */
function loadGoogleTranslate() {
    // Clean up any existing instances
    cleanupGoogleTranslate();
    
    // Create container if it doesn't exist
    if (!document.getElementById('google_translate_element')) {
        const container = document.createElement('div');
        container.id = 'google_translate_element';
        container.style.display = 'none';
        document.body.appendChild(container);
    }
    
    // Remove any existing script
    const oldScript = document.getElementById('google-translate-script');
    if (oldScript) {
        oldScript.remove();
    }
    
    // Create new script element
    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.src = `//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit&hl=${getCurrentLang()}&t=${Date.now()}`;
    script.async = true;
    
    // Define the initialization function
    window.googleTranslateElementInit = function() {
        try {
            if (!window.google || !window.google.translate) {
                throw new Error('Google Translate API not available');
            }
            
            new google.translate.TranslateElement({
                pageLanguage: CONFIG.defaultLang,
                includedLanguages: CONFIG.supportedLangs.join(','),
                layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                autoDisplay: false
            }, 'google_translate_element');
            
            // Hide Google's UI elements
            const style = document.createElement('style');
            style.textContent = `
                .goog-te-banner-frame, 
                .goog-te-gadget-icon, 
                .goog-te-menu-value span { 
                    display: none !important; 
                }
                .goog-te-gadget { 
                    color: transparent !important; 
                }
                .goog-te-gadget-simple { 
                    background-color: transparent !important; 
                    border: none !important; 
                }
            `;
            document.head.appendChild(style);
            
            console.log('Google Translate widget initialized');
            
        } catch (error) {
            console.error('Error initializing Google Translate:', error);
            // Retry after a delay
            setTimeout(loadGoogleTranslate, 2000);
        }
    };
    
    // Handle script load errors
    script.onerror = function() {
        console.error('Error loading Google Translate script');
        // Retry after a delay
        setTimeout(loadGoogleTranslate, 2000);
    };
    
    // Add the script to the document
    document.head.appendChild(script);
}

/**
 * Clean up any existing Google Translate elements
 */
function cleanupGoogleTranslate() {
    // Remove any iframes
    document.querySelectorAll('iframe[src*="translate.google"]').forEach(el => el.remove());
    
    // Remove any Google Translate styles
    document.querySelectorAll('style').forEach(style => {
        if (style.textContent.includes('goog-te-')) {
            style.remove();
        }
    });
    
    // Remove the Google Translate script
    const script = document.getElementById('google-translate-script');
    if (script) script.remove();
}

/**
 * Change the language and update the UI
 */
function changeLanguage(lang) {
    if (!CONFIG.supportedLangs.includes(lang) || lang === getCurrentLang()) {
        return;
    }
    
    console.log(`Changing language to: ${lang}`);
    
    // Update the language
    setLanguage(lang);
    
    // If Google Translate is loaded, update it
    if (window.google && window.google.translate) {
        try {
            const frame = document.querySelector('.goog-te-menu-frame');
            if (frame && frame.contentWindow) {
                frame.contentWindow.postMessage({
                    command: 'setCheckCookie',
                    value: `${CONFIG.cookieName}=/es/${lang}`
                }, '*');
                
                // Force a refresh of the page to apply the translation
                window.location.reload();
                return;
            }
        } catch (error) {
            console.error('Error updating Google Translate:', error);
        }
    }
    
    // If we get here, either Google Translate isn't loaded or there was an error
    // Just reload the page to apply the language change
    window.location.reload();
}

// Make the function available globally
window.changeLanguage = changeLanguage;

// Initialize when the page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        loadGoogleTranslate();
        updateLanguageUI(getCurrentLang());
    });
} else {
    loadGoogleTranslate();
    updateLanguageUI(getCurrentLang());
}

// Handle page reloads from cache
window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
        window.location.reload();
    }
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getCurrentLang,
        setLanguage,
        loadGoogleTranslate,
        cleanupGoogleTranslate,
        changeLanguage
    };
}
