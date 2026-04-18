import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  STRINGS,
  PREFECTURE_EN,
  REGION_EN,
  SAKE_TYPE_EN,
  prefName,
  regionName,
  sakeTypeName,
  getByPath,
  interpolate,
} from './translations';

const LANG_STORAGE_KEY = 'sake-lang';
const DEFAULT_LANG = 'ja';

const I18nContext = createContext(null);

function detectInitialLang() {
  if (typeof window === 'undefined') return DEFAULT_LANG;
  const stored = localStorage.getItem(LANG_STORAGE_KEY);
  if (stored === 'ja' || stored === 'en') return stored;
  // ブラウザ言語から推定
  const browserLang = navigator.language || navigator.userLanguage || '';
  if (browserLang.toLowerCase().startsWith('ja')) return 'ja';
  if (browserLang.toLowerCase().startsWith('en')) return 'en';
  return DEFAULT_LANG;
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(detectInitialLang);

  const setLang = (next) => {
    setLangState(next);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    // <html lang=""> を更新（SEO/アクセシビリティ）
    if (typeof document !== 'undefined') {
      document.documentElement.lang = next;
    }
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const value = useMemo(() => {
    const bundle = STRINGS[lang] || STRINGS[DEFAULT_LANG];

    /**
     * t('key.path', { name: '東京' }) で翻訳を取得
     */
    const t = (path, params) => {
      const raw = getByPath(bundle, path);
      if (raw === undefined) {
        // フォールバック: 日本語
        const jaRaw = getByPath(STRINGS.ja, path);
        return interpolate(jaRaw !== undefined ? jaRaw : path, params);
      }
      return interpolate(raw, params);
    };

    return {
      lang,
      setLang,
      t,
      pref: (p) => prefName(p, lang),
      region: (r) => regionName(r, lang),
      sakeType: (s) => sakeTypeName(s, lang),
    };
  }, [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used inside <I18nProvider>');
  }
  return ctx;
}

// 直接エクスポート（コンポーネントから直接インポートしたい場合）
export { PREFECTURE_EN, REGION_EN, SAKE_TYPE_EN, prefName, regionName, sakeTypeName };
