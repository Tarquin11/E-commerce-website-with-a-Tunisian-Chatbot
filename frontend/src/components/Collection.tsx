import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Product } from '../types';
import { getProducts } from '../api/api';
import { formatPrice } from '../utils/currency';

const titleCase = (s: string) =>
  s.split(/[-_\s]+/)
    .map((w) => (w ? (w.length > 1 ? w.charAt(0).toUpperCase() + w.slice(1) : w.toUpperCase()) : ''))
    .join(' ').replace(/\bJr\b/i, 'Jr.');
const detectCategory = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('boot') || lower.includes('cleat') || lower.includes('mercurial') || lower.includes('predator')) return 'Boots';
  if (lower.includes('training') || lower.includes('warm') || lower.includes('jacket')) return 'Training';
  if (lower.includes('world cup') || lower.includes('euro') || lower.includes('confed cup') || lower.includes('afcon')) return 'Country';
  if (lower.includes('real madrid') || lower.includes('barcelona') || lower.includes('man utd') || lower.includes('psg') || lower.includes('santos') || lower.includes('napoli') || lower.includes('boca juniors') || lower.includes('sevilla') || lower.includes('lyon') || lower.includes('bayern munich') || lower.includes('arsenal') || lower.includes('tottenham') || lower.includes('ac milan') || lower.includes('liverpool') || lower.includes('chelsea') || lower.includes('marseille') || lower.includes('juventus')) return 'Club';
  return 'Jerseys';
};
const tryImageUrls = (slug: string, displayName: string) => {
  const candidates = [
    `${slug}.png`, `${slug}.jpg`,
    `${displayName.replace(/\s+/g, '')}.png`,
  ];
  return candidates.map((c) => `/images/${c}`);
};
const PLAYER_FULL_NAMES: Record<string, string> = {
  'ronaldo': 'Cristiano Ronaldo',
  'cristiano-ronaldo': 'Cristiano Ronaldo',
  'messi': 'Lionel Messi',
  'lionel-messi': 'Lionel Messi',
  'zidane': 'Zinedine Zidane',
  'zinedine-zidane': 'Zinedine Zidane',
  'neymar': 'Neymar Jr.',
  'neymar-jr': 'Neymar Jr.',
  'pele': 'Pelé',
  'maradona': 'Diego Maradona',
  'diego-maradona': 'Diego Maradona',
  'sergio-ramos': 'Sergio Ramos',
  'marcelo': 'Marcelo Vieira',
  'karim-benzema': 'Karim Benzema',
  'benzema': 'Karim Benzema',
  'toni-kroos': 'Toni Kroos',
  'thierry-henry': 'Thierry Henry',
  'luka-modric': 'Luka Modrić',
  'paolo-maldini': 'Paolo Maldini',
  'kylian-mbappe': 'Kylian Mbappé',
  'mbappe': 'Kylian Mbappé',
  'jude-bellingham': 'Jude Bellingham',
  'bellingham': 'Jude Bellingham',
  'harry-kane': 'Harry Kane',
  'vinicius-junior': 'Vinícius Júnior',
  'vini-jr': 'Vinícius Júnior',
  'mesut-ozil': 'Mesut Özil',
  'steven-gerrard': 'Steven Gerrard',
  'frank-lampard': 'Frank Lampard',
  'didier-drogba': 'Didier Drogba',
  'raul-gonzalez': 'Raúl González',
  'raul': 'Raúl González',
  'andrea-pirlo': 'Andrea Pirlo'
};
const Collection: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const normalizedSlug = slug ? slug.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '';
  const fullName = slug ? (PLAYER_FULL_NAMES[slug.toLowerCase()] || PLAYER_FULL_NAMES[normalizedSlug] || titleCase(slug)) : 'Collection';
  const [heroName, setHeroName] = useState<string>(fullName);
  const imageUrls = tryImageUrls(slug || 'player', fullName);
  const heroImage = imageUrls[0];
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All items');
  const isPlayerCollection = Boolean(slug);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const resp = await getProducts({ player: normalizedSlug || undefined });
        const all: Product[] = Array.isArray(resp) ? resp : [];
        const filtered = all.filter((p: Product) => {
          const name = (p.name || '').toLowerCase();
          return slug ? name.includes(slug.toLowerCase()) || name.includes(fullName.toLowerCase()) : true;
        });

        setAllProducts(filtered);
        setHeroName(fullName);
      } catch (e) {
        console.error('Failed loading collection:', e);
        setAllProducts([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug, fullName, normalizedSlug]);

  const filteredProducts = useMemo(() => {
    return allProducts.filter(p => {
      if (selectedCategory !== 'All items') {
        if (detectCategory(p.name) !== selectedCategory) return false;
      }
      return true;
    });
  }, [allProducts, selectedCategory]);

  return (
    <section className="site-section" style={{ paddingTop: 0 }}>
      {/* Hero Banner Section */}
      <div className="hero-banner" style={{
        position: 'relative',
        width: '100%',
        minHeight: '380px',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'flex-start',
        overflow: 'hidden',
        background: '#0f1724',
        marginBottom: '2rem'
      }}>
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.4,
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover', backgroundPosition: 'center top',
          filter: 'blur(20px) brightness(0.7)', transform: 'scale(1.1)'
        }} />
        <div style={{
          position: 'relative', zIndex: 2, width: '100%', maxWidth: 1200, margin: '0 auto',
          padding: '2rem', display: 'flex', alignItems: 'center', gap: '2rem'
        }}>
          <div style={{
            width: 180, height: 180, borderRadius: '50%', overflow: 'hidden',
            border: '4px solid white', boxShadow: '0 6px 28px rgba(0,0,0,0.6)',
            flexShrink: 0
          }}>
            <img src={heroImage} alt={heroName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ color: 'white' }}>
            <h1 style={{ fontSize: '3rem', margin: 0, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-1px' }}>
              {heroName}
            </h1>
            <p style={{ margin: '0.5rem 0 0', fontSize: '1.1rem', opacity: 0.8, maxWidth: '600px' }}>
              Official authentic kits for {heroName}.
            </p>
          </div>
        </div>
      </div>

      <div className="site-wrap" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 10 }}>
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>
            Shop Collection <span style={{fontSize: '0.9rem', color: '#888', fontWeight: 400}}>({filteredProducts.length} items)</span>
          </h2>
          <div style={{ display: 'flex', gap: 10 }}>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ padding: '0.6rem 1rem', borderRadius: 8, border: '1px solid var(--border-color)', background: '#1a1d2d', color: 'white' }}
            >
              <option>All items</option>   
              <option>Club</option>
              <option>Country</option>
            </select>
          </div>
        </div>

        <main style={{ minHeight: 400 }}>
          {loading ? (
            <div style={{textAlign: 'center', padding: '4rem'}}>Loading {heroName}'s gear...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="no-products" style={{ textAlign: 'center', padding: '4rem', background: '#131427', borderRadius: 12 }}>
              <h3>No products found matching filters.</h3>
              <button onClick={() => setSelectedCategory('All items')} style={{ marginTop: 10, cursor: 'pointer', background: 'transparent', color: '#aaa', border: '1px solid #aaa', padding: '5px 15px', borderRadius: 4 }}>
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="products-grid">
                {filteredProducts.map((p) => (
                  <ProductCard key={p.id} product={p} isPlayerCollection={isPlayerCollection} playerSlug={normalizedSlug} />
                ))}
            </div>
          )}
        </main>
      </div>
    </section>
  );
};

const ProductCard: React.FC<{ product: Product; isPlayerCollection: boolean; playerSlug?: string }> = ({ product, isPlayerCollection, playerSlug }) => {
  const [index, setIndex] = useState(0);

  // Build candidate lists for front/back images. The frontend serves files from public/,
  // so URLs should be root-relative like `/images/...`.
  const frontCandidates = [
    `/images/${product.id}-front.png`,
    // player-specific folder under old_gen_players, e.g. /images/old_gen_players/ronaldo/496-front.png
    playerSlug ? `/images/old_gen_players/${playerSlug}/${product.id}-front.png` : null,
    `/images/old_gen_players/${product.id}-front.png`,
    product.image_url ? `/images/${product.image_url}-front.png` : null,
  ].filter(Boolean) as string[];

  const backCandidates = [
    `/images/${product.id}-back.png`,
    playerSlug ? `/images/old_gen_players/${playerSlug}/${product.id}-back.png` : null,
    `/images/old_gen_players/${product.id}-back.png`,
    product.image_url ? `/images/${product.image_url}-back.png` : null,
  ].filter(Boolean) as string[];

  const [frontIdx, setFrontIdx] = useState(0);
  const [backIdx, setBackIdx] = useState(0);

  const frontSrc = frontCandidates[frontIdx] || '/images/jersey-placeholder.png';
  const backSrc = backCandidates[backIdx] || '/images/jersey-placeholder.png';

  const images = isPlayerCollection ? [frontSrc, backSrc] : [frontSrc];

  const showPrev = (e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); setIndex((i) => (i === 0 ? images.length - 1 : i - 1)); };
  const showNext = (e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); setIndex((i) => (i + 1) % images.length); };

  // When an image fails to load, try the next candidate in its list.
  const handleImgError = () => {
    if (index === 0) {
      if (frontIdx < frontCandidates.length - 1) setFrontIdx((i) => i + 1);
    } else {
      if (backIdx < backCandidates.length - 1) setBackIdx((i) => i + 1);
    }
  };

  return (
    <Link to={`/product/${product.id}`} className="card product-card" style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="card-media" style={{ position: 'relative', overflow: 'hidden', height: 300 }}>
        <img src={images[index]} onError={handleImgError} alt={product.name} className="product-image" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        {isPlayerCollection && (
          <>
            <button onClick={showPrev} aria-label="previous" style={arrowStyle('left')}>{'‹'}</button>
            <button onClick={showNext} aria-label="next" style={arrowStyle('right')}>{'›'}</button>
          </>
        )}
        {product.stock < 5 && product.stock > 0 && <span style={{position:'absolute', top:10, right:10, background:'red', color:'white', fontSize:'0.8rem', padding:'4px 8px', borderRadius:6}}>Low Stock</span>}
      </div>
      <div className="card-body">
        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#888', marginBottom: 6 }}>
          {detectCategory(product.name)}
        </div>
        <h3 className="product-title">{product.name}</h3>
        <div className="product-meta">
          <span className="price">{formatPrice(product.price)}</span>
          {product.stock <= 0 && <span className="stock" style={{color: 'red'}}>Sold out</span>}
        </div>
      </div>
    </Link>
  );
};

const arrowStyle = (pos: 'left' | 'right') => ({
  position: 'absolute' as const,
  top: '50%', transform: 'translateY(-50%)',
  [pos]: 8,
  width: 34, height: 34, borderRadius: 6,
  background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 20,
  display: 'flex', alignItems: 'center', justifyContent: 'center'
});

export default Collection;