export function createI18n({ locales, defaultLanguage = "fr", initialLanguage = "fr", onChange = () => {} }) {
  let currentLanguage = locales[initialLanguage] ? initialLanguage : defaultLanguage;

  function t(key, vars = {}) {
    const dictionary = locales[currentLanguage] || locales[defaultLanguage];
    const fallback = locales[defaultLanguage];
    const template = dictionary[key] ?? fallback[key] ?? key;
    return template.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? `{${name}}`);
  }

  function validateLocales() {
    const fallbackKeys = Object.keys(locales[defaultLanguage]);
    Object.entries(locales).forEach(([language, dictionary]) => {
      fallbackKeys.forEach((key) => {
        if (!(key in dictionary)) {
          console.warn(`Missing localization key "${key}" in "${language}".`);
        }
      });
    });
  }

  function setLanguage(language) {
    if (!locales[language]) return false;
    currentLanguage = language;
    onChange(language);
    return true;
  }

  function getLanguage() {
    return currentLanguage;
  }

  return { t, validateLocales, setLanguage, getLanguage, defaultLanguage, locales };
}
