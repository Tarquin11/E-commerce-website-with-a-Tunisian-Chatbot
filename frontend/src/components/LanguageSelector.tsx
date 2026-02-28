import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
const API_BASE = `${window.location.protocol}//${window.location.hostname}:5000/api`;
const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const change = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    try {
      setLoading(true);
      const resp = await fetch(`${API_BASE}/locales/generate/${newLang}`, { method: 'POST' });
      if (resp.ok) {
        window.localStorage.setItem('i18nextLng', newLang);
        setTimeout(() => window.location.reload(), 300);
        return;
      }
    } catch (err) {
      console.error('Locale generation failed, falling back to dynamic change:', err);
    } finally {
      setLoading(false);
    }
    i18n.changeLanguage(newLang);
  };

  useEffect(() => {
    const lang = i18n.language || window.localStorage['i18nextLng'] || 'en';
    document.documentElement.dir = lang.startsWith('ar') ? 'rtl' : 'ltr';
  }, [i18n.language]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <select value={i18n.language} onChange={change} aria-label="Select language" className="language-select" disabled={loading}>
        <option value="en">English</option>
        <option value="fr">Français</option>
        <option value="sv">Svenska</option>
        <option value="de">Deutsch</option>
        <option value="es">Español</option>
        <option value="it">Italiano</option>
        <option value="ar">العربية</option>
      </select>
      {loading && <span className="language-spinner" aria-hidden="true" />}
    </div>
  );
};

export default LanguageSelector;
