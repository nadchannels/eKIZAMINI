// Google Translate hidden integration
// Injects the Google Translate script and changes language without showing the banner

export const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧', gtCode: null },
  { code: 'fr', label: 'Français', flag: '🇫🇷', gtCode: 'fr' },
  { code: 'rw', label: 'Kinyarwanda', flag: '🇷🇼', gtCode: 'rw' },
];

let translateInitialized = false;

/**
 * Injects Google Translate script and hides its UI elements.
 * Must be called once on app start.
 */
export function initGoogleTranslate() {
  if (translateInitialized) return;
  translateInitialized = true;

  // Inject the hidden translate element
  const div = document.createElement('div');
  div.id = 'google_translate_element';
  div.style.display = 'none';
  document.body.appendChild(div);

  // Define callback
  window.googleTranslateElementInit = function () {
    new window.google.translate.TranslateElement(
      {
        pageLanguage: 'en',
        includedLanguages: 'en,fr,rw',
        autoDisplay: false,
      },
      'google_translate_element'
    );
  };

  // Inject script
  const script = document.createElement('script');
  script.src =
    '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  script.async = true;
  document.head.appendChild(script);

  // Hide Google Translate banner & toolbar via CSS
  const style = document.createElement('style');
  style.textContent = `
    .goog-te-banner-frame, .goog-te-gadget, #goog-gt-tt,
    .goog-tooltip, .goog-tooltip:hover,
    .goog-text-highlight { display: none !important; }
    body { top: 0 !important; }
    .skiptranslate { display: none !important; }
    iframe.goog-te-banner-frame { display: none !important; }
  `;
  document.head.appendChild(style);
}

/**
 * Switches the page language using the hidden Google Translate widget.
 * @param {string} langCode - e.g. 'fr', 'rw', or null for English (restore)
 */
export function switchLanguage(langCode) {
  const hasCookie = document.cookie.includes('googtrans');

  if (!langCode) {
    if (!hasCookie) return; // Already on English, no action needed

    // Restore English — clear cookie
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + location.hostname;

    try {
      const frame = document.querySelector('iframe.goog-te-banner-frame');
      if (frame) {
        const innerDoc = frame.contentDocument || frame.contentWindow.document;
        const restore = innerDoc.querySelector('.goog-te-button button');
        if (restore) {
           restore.click();
           return;
        }
      }
    } catch(e) {}

    // Fallback: reload
    location.reload();
    return;
  }

  // Set the language via cookie
  document.cookie = `googtrans=/en/${langCode}; path=/`;
  document.cookie = `googtrans=/en/${langCode}; path=/; domain=${location.hostname}`;

  const select = document.querySelector('.goog-te-combo');
  if (select) {
    select.value = langCode;
    select.dispatchEvent(new Event('change'));
  } else {
    // Widget not ready yet — try again in 500ms
    setTimeout(() => switchLanguage(langCode), 500);
  }
}
