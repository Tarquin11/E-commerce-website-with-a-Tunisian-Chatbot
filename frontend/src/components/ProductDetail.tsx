import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct, addToCart } from '../api/api';
import { Product } from '../types';
import '../styles/product-page.css';

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const PATCH_COST = 10;
const CUSTOMIZATION_COST = 20;

interface RouteParams {
  id: string;
}

// Extracting styles to keep JSX clean
const styles = {
  viewBtnContainer: {
    display: 'flex',
    gap: '10px',
    marginTop: '15px',
    justifyContent: 'center'
  },
  viewBtn: (isActive: boolean) => ({
    padding: '10px 20px',
    backgroundColor: isActive ? '#7c3aed' : '#4b5563',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 600,
    transition: 'background-color 0.3s'
  }),
  profileSection: {
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '12px',
    border: '1px solid rgba(124, 58, 237, 0.3)',
    textAlign: 'center' as const
  },
  playerImg: {
    maxWidth: '200px',
    height: 'auto',
    borderRadius: '8px',
    boxShadow: '0 4px 15px rgba(124, 58, 237, 0.4)',
    objectFit: 'cover' as const
  },
  noPlayer: {
    marginBottom: '30px',
    padding: '15px',
    backgroundColor: 'rgba(255, 100, 100, 0.2)',
    borderRadius: '8px',
    border: '1px solid rgba(255, 100, 100, 0.5)',
    color: 'rgba(255, 150, 150, 0.8)',
    fontSize: '14px'
  }
};

const ProductDetail: React.FC<{ onAddToCart?: (p: Product, q?: number, meta?: any) => void }> = ({ onAddToCart }) => {
  const { id } = useParams() as unknown as RouteParams; // Cast to ensure type safety
  const navigate = useNavigate();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [quantity, setQuantity] = useState<number>(1);
  const [nameText, setNameText] = useState('');
  const [numberText, setNumberText] = useState('');
  const [selectedPatches, setSelectedPatches] = useState<string[]>([]);
  const [jerseyView, setJerseyView] = useState<'front' | 'back'>('front');

  // Refs for Zoom
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Load Product
  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const p = await getProduct(Number(id));
        setProduct(p);
      } catch (e) {
        console.error('Failed to load product', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // Derived State (Memoized for performance)
  const clubLeague = product?.club?.league || '';

  const calculateTotalPrice = useMemo(() => {
    if (!product) return 0;
    let total = product.price;
    total += selectedPatches.length * PATCH_COST;
    if (nameText || numberText) {
      total += CUSTOMIZATION_COST;
    }
    return total;
  }, [product, selectedPatches.length, nameText, numberText]);

  // Image Normalization Logic (Memoized)
  const mainImageUrl = useMemo(() => {
    if (!product?.image_url) return '/images/old_gen_players/placeholder.png';
    
    let url = product.image_url;

    // 1. Fix slashes and relative paths
    let cleaned = url.replace(/\\\\/g, '/').replace(/^(?:\.\.\/)+src\/assets\//, '/images/');
    
    // 2. Ensure leading slash if relative
    if (!cleaned.startsWith('http') && !cleaned.startsWith('/')) {
        cleaned = '/' + cleaned;
    }

    // 3. Add view suffix (-front/-back) if missing for specific categories
    const isGenPlayer = cleaned.includes('/old_gen_players/') || cleaned.includes('/new_gen_players/');
    const hasSuffix = cleaned.includes('-front') || cleaned.includes('-back');
    const isPng = cleaned.endsWith('.png');

    if (isGenPlayer && !hasSuffix && !isPng) {
      return `${cleaned}-${jerseyView}.png`;
    }

    // Replace view in existing URL if it has one (e.g. switching -front to -back)
    if (hasSuffix) {
        return cleaned.replace(/-front|-back/, `-${jerseyView}`);
    }

    return cleaned;
  }, [product, jerseyView]);

  // Player Profile Image Logic (Memoized)
  const playerProfileUrl = useMemo(() => {
    if (!product?.player_slug) return null;

    if (product.is_legendary && product.image_url) {
      let url = product.image_url;
      if (!url.includes('-front') && !url.includes('-back')) {
        url = url + '-front.png';
      }
      return url;
    }

    if (!product.is_legendary && product.image_url) {
        const match = product.image_url?.match(/\/images\/new_gen_players\/([^/]+)\/(\d+)/);
        if (match) {
            const [_, playerFolder, imageNum] = match;
            return `/images/new_gen_players/${playerFolder}/${imageNum}-front.png`;
        }
        return `/images/new_gen_players/${product.player_slug}/1-front.png`;
    }

    return null;
  }, [product]);

  // Handlers
  const togglePatch = (patch: string) => {
    const isSelecting = !selectedPatches.includes(patch);

    if (isSelecting) {
      const hasLeague = selectedPatches.includes('league');
      const isLeague = patch === 'league';
      const isExclusive = patch === 'ucl' || patch === 'respect';
      const hasExclusive = selectedPatches.some(p => ['ucl', 'respect'].includes(p));

      if (isLeague && hasExclusive) {
        alert("League patch can't be combined with UCL or Respect patches.");
        return;
      }
      if (isExclusive && hasLeague) {
        alert("You can't combine this patch with the League patch.");
        return;
      }
    }

    setSelectedPatches(prev => 
      prev.includes(patch) ? prev.filter(p => p !== patch) : [...prev, patch]
    );
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const img = imgRef.current;
    const container = containerRef.current;
    if (!img || !container) return;
    
    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    img.style.transformOrigin = `${x}% ${y}%`;
  };

  const handleMouseLeave = () => {
    if (imgRef.current) imgRef.current.style.transformOrigin = `50% 50%`;
  };

  const handleAdd = async () => {
    if (!product) return;
    const meta = { 
      size: selectedSize, 
      name: nameText || null, 
      number: numberText || null,
      patches: selectedPatches.length > 0 ? selectedPatches : null,
      totalPrice: calculateTotalPrice
    };

    try {
      if (onAddToCart) {
        await onAddToCart(product, quantity, meta);
      } else {
        await addToCart(product.id, quantity, meta);
      }
      alert('Added to cart');
      navigate('/cart');
    } catch (err) {
      console.error('Add to cart failed', err);
      alert('Failed to add to cart');
    }
  };

  if (loading) return <div>Loading product...</div>;
  if (!product) return <div>Product not found</div>;

  return (
    <div className="product-page">
      <div className="product-gallery">
        <div style={{ position: 'relative' }}>
          <div
            className="zoom-container"
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <img
              ref={imgRef}
              src={mainImageUrl}
              alt={product.name}
              className="zoom-image"
              onError={(e) => { 
                  const target = e.currentTarget as HTMLImageElement;
                  if (!target.src.includes('placeholder.png')) {
                      target.src = '/images/old_gen_players/placeholder.png';
                  }
              }}
            />
          </div>
          
          <div style={styles.viewBtnContainer}>
            <button
              onClick={() => setJerseyView('front')}
              style={styles.viewBtn(jerseyView === 'front')}
            >
              Front View
            </button>
            <button
              onClick={() => setJerseyView('back')}
              style={styles.viewBtn(jerseyView === 'back')}
            >
              Back View
            </button>
          </div>
        </div>
      </div>

      <div className="product-info">
        {/* Player Profile Section */}
        {product.player_slug ? (
          <div className="player-profile-section" style={styles.profileSection}>
            <div style={{ marginBottom: '15px' }}>
              <img
                src={playerProfileUrl || '/images/placeholder.png'}
                alt={product.name}
                style={styles.playerImg}
                onError={(e) => { 
                  (e.currentTarget as HTMLImageElement).style.opacity = '0.3';
                  (e.currentTarget as HTMLImageElement).alt = 'Image not found';
                }}
              />
            </div>
            <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.8)', margin: '0' }}>
              Player Profile: <strong>{product.player_slug.replace(/-/g, ' ').toUpperCase()}</strong>
            </p>
            <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', margin: '8px 0 0 0' }}>
              {product.is_legendary ? 'Legendary' : 'New Generation'} Player
            </p>
          </div>
        ) : null}

        <h1>{product.name}</h1>
        <p className="muted">{product.description}</p>
        
        <div className="price-section">
          <div className="base-price">
            <span className="label">Base Price:</span>
            <span className="price">€{product.price.toFixed(2)}</span>
          </div>
          <div className="total-price">
            <span className="label">Total Price:</span>
            <span className="price highlight">€{calculateTotalPrice.toFixed(2)}</span>
          </div>
        </div>

        <div className="sizes">
          <label>Sizes</label>
          <div className="size-list">
            {SIZES.map(s => (
              <button 
                key={s} 
                className={`size-btn ${s === selectedSize ? 'active' : ''}`} 
                onClick={() => setSelectedSize(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="quantity">
          <label>Quantity</label>
          <input 
            type="number" 
            value={quantity} 
            min={1} 
            max={product.stock} 
            onChange={e => setQuantity(Math.max(1, Number(e.target.value) || 1))} 
          />
        </div>

        {!product.is_legendary && (
          <div className="customize">
            <h3>Customize Jersey</h3>
            <label>Name on back</label>
            <input 
                type="text" 
                placeholder="Your name" 
                value={nameText} 
                onChange={e => setNameText(e.target.value.toUpperCase())} 
                maxLength={20} 
            />
            <label>Number</label>
            <input 
                type="text" 
                placeholder="00" 
                value={numberText} 
                onChange={e => setNumberText(e.target.value)} 
                maxLength={3} 
            />
            {(nameText || numberText) && (
                <p className="customization-note">
                    +€{CUSTOMIZATION_COST.toFixed(2)} for name/number customization
                </p>
            )}
            <small className="muted">Preview appears on the jersey image above.</small>
          </div>
        )}

        {!product.is_legendary && (
          <div className="patches-section">
            <h3>Add Patches</h3>
            <p className="patch-description">Each patch adds €{PATCH_COST.toFixed(2)} to your order</p>
            <div className="patches-grid">
              {clubLeague && (
                <button 
                  className={`patch-btn ${selectedPatches.includes('league') ? 'active' : ''}`}
                  onClick={() => togglePatch('league')}
                >
                  <span className="patch-icon">🏆</span>
                  <span className="patch-name">{clubLeague} Patch</span>
                </button>
              )}
              <button 
                className={`patch-btn ${selectedPatches.includes('ucl') ? 'active' : ''}`}
                onClick={() => togglePatch('ucl')}
              >
                <span className="patch-icon">⭐</span>
                <span className="patch-name">UCL Patch</span>
              </button>
              <button 
                className={`patch-btn ${selectedPatches.includes('respect') ? 'active' : ''}`}
                onClick={() => togglePatch('respect')}
              >
                <span className="patch-icon">🤝</span>
                <span className="patch-name">Respect Patch</span>
              </button>
            </div>
            <div style={{ marginTop: 8, color: 'rgba(255,255,255,0.72)', fontSize: 13 }}>
              Note: League patch cannot be combined with UCL or Respect patches.
            </div>
          </div>
        )}

        <div className="actions">
          <button 
            className="btn primary" 
            onClick={handleAdd} 
            disabled={product.stock <= 0}
          >
            Add to Cart
          </button>
          <a 
            href={`/product/${product.id}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn" 
            style={{ textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}
          >
            Open in new window
          </a>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;