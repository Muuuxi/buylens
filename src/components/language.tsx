'use client';

import { cloneElement, createContext, isValidElement, useCallback, useContext, useEffect, useMemo, useState, type ReactElement, type ReactNode } from 'react';
import { translateUI, type Language } from '@/lib/i18n';

const LanguageContext = createContext({ language: 'en' as Language, toggle: () => {} });
const STORAGE = 'buylens-language';
const DEFAULT_LANGUAGE: Language = process.env.NEXT_PUBLIC_DEFAULT_LOCALE === 'zh' ? 'zh' : 'en';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE);
  useEffect(() => { try { const saved = localStorage.getItem(STORAGE); if (saved === 'en' || saved === 'zh') setLanguage(saved); } catch {} }, []);
  useEffect(() => { document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en'; }, [language]);
  const toggle = useCallback(() => {
    setLanguage(current => {
      const next = current === 'en' ? 'zh' : 'en';
      try { localStorage.setItem(STORAGE, next); } catch {}
      return next;
    });
  }, []);
  const value = useMemo(() => ({ language, toggle }), [language, toggle]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);

export function LanguageSwitch() {
  const { language, toggle } = useLanguage();
  return <button type="button" className="language-switch" onClick={toggle} aria-label={language === 'en' ? '切换到中文' : 'Switch to English'} lang={language === 'en' ? 'zh-CN' : 'en'}>{language === 'en' ? '中文' : 'EN'}</button>;
}

function translatedTree(children: ReactNode): ReactNode {
  if (Array.isArray(children)) return children.map(translatedTree);
  const child = children;
    if (typeof child === 'string') return translateUI(child);
    if (!isValidElement(child)) return child;
    const element = child as ReactElement<Record<string, unknown>>;
    const props = element.props;
    const patch: Record<string, unknown> = {};
    // These are source/user content, not UI prose. Quotes stay byte-for-byte intact.
    const sourceText = element.type === 'blockquote' || element.type === 'pre' || (element.type === 'textarea' && props.id !== 'need');
    if (!sourceText && props.children !== undefined) patch.children = translatedTree(props.children as ReactNode);
    if (typeof element.type === 'string') {
      for (const name of ['aria-label', 'title', 'placeholder', 'alt']) if (typeof props[name] === 'string') patch[name] = translateUI(props[name] as string);
      // Preserve enum values when translating a native option's visible label.
      if (element.type === 'option' && props.value === undefined && typeof props.children === 'string') patch.value = props.children;
      // Only known preset needs/contexts translate; arbitrary user text is unchanged.
      if (typeof props.value === 'string' && (props.id === 'need' || String(props.id).startsWith('criterion-'))) patch.value = translateUI(props.value);
    }
    // Preserve React's static-child semantics; passing a static JSX child array
    // as one dynamic array otherwise produces spurious missing-key warnings.
    return Array.isArray(patch.children) ? cloneElement(element, patch, ...patch.children) : cloneElement(element, patch);
}

export function Localized({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  return <>{language === 'zh' ? translatedTree(children) : children}</>;
}
