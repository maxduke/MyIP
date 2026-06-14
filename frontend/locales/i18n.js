import { createI18n } from 'vue-i18n';

// 引入语言文件
// Node ESM 必须显式声明 JSON 导入属性；Vite 也支持这种写法，前后端一致
import en from './en.json' with { type: 'json' };
import zh from './zh.json' with { type: 'json' };
import fr from './fr.json' with { type: 'json' };
import tr from './tr.json' with { type: 'json' };

// NOTE: the security-checklist datasets (security-checklist/*.json, ~30 KB gzipped
// each, ~131 KB for all four) are intentionally NOT merged here. Baking them into
// the initial i18n bundle put them on the first-paint critical path even though
// only the SecurityChecklist advanced tool reads them. That tool now loads its
// own locale's dataset on demand — see SecurityChecklist.vue.

const messages = { en, zh, fr, tr };
const supportedLanguages = Object.keys(messages);

// 设置语言
function setLanguage() {
  let locale = 'en';
  // Keep in sync with PREFS_STORAGE_KEY in frontend/store.js — both must read
  // from the same versioned key so an old value doesn't mislead the i18n
  // initialization into a previously-chosen language after we bumped defaults.
  let storedPreferences = localStorage.getItem('userPreferences_v6');
  storedPreferences = storedPreferences ? JSON.parse(storedPreferences) : {};
  if (supportedLanguages.includes(storedPreferences.lang)) {
    locale = storedPreferences.lang;
    return locale;
  }
  const searchParams = new URLSearchParams(window.location.search);
  const browserLanguage = navigator.language || navigator.userLanguage;
  const hl = searchParams.get('hl');
  if (hl && supportedLanguages.includes(hl)) {
    locale = hl;
  } else if (!hl) {
      const bl = browserLanguage.substring(0, 2);
      if (supportedLanguages.includes(bl)) {
        locale = bl;
      } else {
        locale = 'en';
      }
  }
  return locale;
}

// 创建 i18n 实例
const i18n = createI18n({
  legacy: false,
  locale: setLanguage(),
  fallbackLocale: 'en',
  messages,
});

// 更新 meta 标签
function updateMeta() {
  document.title = i18n.global.t('page.title');

  const metaKeywords = document.querySelector('meta[name="keywords"]');
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaKeywords) {
      metaKeywords.setAttribute('content', i18n.global.t('page.keywords'));
  }
  if (metaDescription) {
      metaDescription.setAttribute('content', i18n.global.t('page.description'));
  }
}

updateMeta();
export default i18n;
