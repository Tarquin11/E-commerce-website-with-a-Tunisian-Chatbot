import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';
import { searchProducts } from '../api/api';
import { Product } from '../types';
import { formatPrice } from '../utils/currency';

interface NavbarProps {
  isLoggedIn: boolean;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isLoggedIn, onLogout }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      setActiveIndex(null);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchProducts(query);
        setSearchResults(results);
        setActiveIndex(results.length > 0 ? 0 : null);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
        setActiveIndex(null);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, [setSearchQuery]);
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!searchResults || searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev === null ? 0 : Math.min(prev + 1, searchResults.length - 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev === null ? searchResults.length - 1 : Math.max(prev - 1, 0)));
    } else if (e.key === 'Enter') {
      if (activeIndex !== null && searchResults[activeIndex]) {
        handleProductClick(searchResults[activeIndex].id);
      }
    } else if (e.key === 'Escape') {
      setSearchResults([]);
      setActiveIndex(null);
    }
  };
  useEffect(() => {
    if (activeIndex === null) return;
    const container = searchContainerRef.current;
    if (!container) return;
    const items = container.querySelectorAll('.search-result-item');
    const el = items[activeIndex] as HTMLElement | undefined;
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const handleProductClick = (productId: number) => {
    setSearchQuery('');
    setSearchResults([]);
    navigate(`/products/${productId}`);
  };

  useEffect(() => {
    let hideTimer: any = null;
    const onMove = (e: MouseEvent) => {
      const y = e.clientY;
  
      if (y <= 48) {
        if (!visible) setVisible(true);
        if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
        return;
      }
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      if (el) {
        const inNavbar = !!el.closest('.site-navbar') || !!el.closest('.search-results-dropdown') || !!el.closest('.site-menu-wrapper') || !!el.closest('.nav-container') || !!el.closest('.search-bar-container');
        if (inNavbar) {
          if (!visible) setVisible(true);
          if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
          return;
        }
      }

      if (visible && !hideTimer) {
        hideTimer = setTimeout(() => setVisible(false), 800);
      }
    };

    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [visible]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* Invisible top sensor: hovering it will reveal the navbar */}
      <div
        className="nav-sensor"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        aria-hidden
      />
      <header className={`site-navbar ${visible ? 'visible' : 'hidden'}`} onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
      <div className="nav-container site-wrap">
        
        {/* LEFT SECTION: Logo/Store Name */}
        <div className="site-logo">
          <Link to="/" className="logo">
            <img src="/images/goat-logo.png" alt="GOAT Shop" className="site-logo-image" style={{height: '40px', objectFit: 'contain'}} />
          </Link>
        </div>

        {/* CENTER SECTION: Integrated Search Bar */}
        <div className="search-bar-container" style={{maxWidth: '420px', position: 'relative'}}>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('nav.searchPlaceholder', 'Search products, players, collections...') || ''}
            className="search-input" 
            aria-autocomplete="list"
            aria-expanded={searchResults.length > 0}
            aria-controls="navbar-search-results"
          />
          
          <i className="material-symbols-outlined search-icon" style={{fontSize: '1.5rem'}}>
            {isSearching ? 'sync' : 'search'}
          </i>
          
          {/* Search Results Dropdown (show 'Result not found' when empty) */}
          {( (searchResults.length > 0) || (!isSearching && searchQuery) ) && (
            <div id="navbar-search-results" className="search-results-dropdown" ref={searchContainerRef} role="listbox">
              {searchResults.length > 0 ? (
                searchResults.map((product, idx) => (
                  <div 
                    key={product.id}
                    className={`search-result-item ${activeIndex === idx ? 'active' : ''}`}
                    onClick={() => handleProductClick(product.id)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    role="option"
                    aria-selected={activeIndex === idx}
                  >
                    <div className="search-result-image">
                      {product.image_url && <img src={product.image_url} alt={product.name} />}
                    </div>
                    <div className="search-result-info">
                      <div className="search-result-name">{product.name}</div>
                      <div className="search-result-club">{product.club}</div>
                      <div className="search-result-price">{formatPrice(product.price)}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="search-result-item no-results" role="option" aria-selected={false}>
                  <div className="search-result-info">
                    <div className="search-result-name">Result not found</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT SECTION: Menu and Icons */}
        <nav className="site-menu-wrapper">
          <ul className="site-menu">
            {/* Nav Links */}
            <li><Link to="/">{t('nav.home', 'Home')}</Link></li>
            <li><Link to="/products">{t('nav.products', 'Products')}</Link></li>
            
            {/* User Profile/Auth */}
            {isLoggedIn ? (
              <>
                <li><Link to="/profile" className="nav-icon-link" title={t('nav.profile', 'Profile') || 'Profile'}>👤</Link></li>
                <li><button onClick={onLogout} className="btn btn-secondary small">{t('nav.logout', 'Logout') || 'Logout'}</button></li>
              </>
            ) : (
              <>
                <li><Link to="/login">{t('nav.login', 'Login')}</Link></li>
                <li><Link to="/register">{t('nav.register', 'Register')}</Link></li>
              </>
            )}
            
         <li>
              <Link to="/cart" className="nav-icon-link" title={t('nav.cart', 'Cart') || 'Cart'}>
                <i className="material-symbols-outlined">shopping_cart</i>
              </Link>
            </li>

            {/* Language selector */}
            <li style={{ display: 'flex', alignItems: 'center' }}>
              <LanguageSelector />
            </li>
          </ul>
        </nav>
      </div>
      </header>
      </>
  );
};

export default Navbar;