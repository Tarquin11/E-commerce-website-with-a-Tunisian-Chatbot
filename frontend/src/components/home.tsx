import React, { useRef, useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from "react-router-dom";
import { Product } from "../types";
import { formatPrice } from "../utils/currency";

interface HomeProps {
  onAddToCart: (product: Product, quantity?: number) => void;
}

type HeroMedia = { type: "image" | "video"; src: string };
type Player = {
  slug: string;
  name: string;
  number: string;
  img: string;
  description: string;
};

// --- HERO SECTION ---
const heroMedia: HeroMedia[] = [
  { type: "image", src: "../src/assets/RealTrio.png" },
  { type: "image", src: "../src/assets/CR7.jpg" },
  { type: "image", src: "../src/assets/Messi.png" },
  { type: "video", src: "../src/assets/SergioRamos.mp4" },
  { type: "video", src: "../src/assets/Barca.mp4" },
];
const imagePath = (name: string) => `../src/assets/${name}.jpg`;
const newGenPlayers: Player[] = [
  { slug: "mbappe", name: "Mbappé", number: "#10", img: imagePath("Mbappe"), description: "Wipe Them Tears" },
  { slug: "vini-jr", name: "Vini Jr.", number: "#7", img: imagePath("Vini"), description: "Baila Vini !" },
  { slug: "bellingham", name: "Bellingham", number: "#5", img: imagePath("Bellingham"), description: "Belligoal !" },
  { slug: "valverde", name: "Valverde", number: "#8", img: imagePath("Valverde"), description: "🚀🚀🚀" },
  { slug: "ousmane", name: "Dembélé", number: "#10", img: imagePath("Ousmane"), description: "Et Ousmane Ballon D'or !" },
  { slug: "harry-kane", name: "Harry Kane", number: "#9", img: imagePath("HarryKane"), description: "Won A Trophy :D !" },
  { slug: "virgil", name: "Virgil", number: "#4", img: imagePath("Virgil"), description: "Virgil Van Maguire !" },
  { slug: "salah", name: "Mo Salah", number: "#11", img: imagePath("Salah"), description: "The Egyptian King !" },
  { slug: "raphinha", name: "Raphinha", number: "#11", img: imagePath("Raphinha"), description: "✊👊" },
  { slug: "lamine", name: "Lamine Yamal", number: "#10", img: imagePath("Lamine"), description: "Y Que Fue !" },
  { slug: "musiala", name: "Musiala", number: "#10", img: imagePath("Musiala"), description: "Bambi !" },
  { slug: "pedri", name: "Pedri", number: "#8", img: imagePath("Pedri"), description: "🪄🪄🪄!" },
  { slug: "haaland", name: "Haaland", number: "#9", img: imagePath("Haaland"), description: "🤖🤖🤖" },
  { slug: "palmer", name: "Cole Palmer", number: "#10", img: imagePath("Palmer"), description: "🥶🥶🥶" },
  { slug: "lautaro", name: "Lautaro", number: "#10", img: imagePath("Lautaro"), description: "🐂🐂🐂" },
];

const oldGenPlayers: Player[] = [
  { slug: "ronaldo", name: "Ronaldo", number: "#7", img: imagePath("Ronaldo"), description: "SIUUUUUU 🐐🐐🐐" },
  { slug: "messi", name: "Messi", number: "#10", img: imagePath("Messi"), description: "Que Miras Bobo ? 🐐🐐🐐" },
  { slug: "zidane", name: "Zidane", number: "#10", img: imagePath("Zidane"), description: "Just Zizou" },
  { slug: "neymar", name: "Neymar", number: "#10", img: imagePath("Neymar"), description: "The Magician" },
  { slug: "maradona", name: "Maradona", number: "#10", img: imagePath("Maradona"), description: "Hand of God" },
  { slug: "pele", name: "Pele", number: "#10", img: imagePath("Pele"), description: "3 Time World Cup Champion" },
  { slug: "sergio", name: "Sergio Ramos", number: "#4", img: imagePath("Sergio"), description: "⚔️⚔️⚔️" },
  { slug: "marcelo", name: "Marcelo", number: "#12", img: imagePath("Marcelo"), description: "Best Left-Back In History" },
  { slug: "xavi", name: "Xavi", number: "#6", img: imagePath("Xavi"), description: "Just Tiki-Taka" },
  { slug: "iniesta", name: "Iniesta", number: "#8", img: imagePath("Iniesta"), description: "The Painter" },
  { slug: "benzema", name: "Benzema", number: "#9", img: imagePath("Benzema"), description: "El-Hokouma 15" },
  { slug: "kroos", name: "Kroos", number: "#8", img: imagePath("Kroos"), description: "The Engineer" },
  { slug: "henry", name: "Henry", number: "#14", img: imagePath("Henry"), description: "The King" },
  { slug: "modric", name: "Modric", number: "#10", img: imagePath("Modric"), description: "The Youngster" },
  { slug: "maldini", name: "Maldini", number: "#3", img: imagePath("Maldini"), description: "Minister Of Defence" },
  { slug: "ozil", name: "Özil", number: "#10", img: imagePath("Özil"), description: "The Assist King" },
  { slug: "gerrard", name: "Gerrard", number: "#8", img: imagePath("Gerrard"), description: "The Captain" },
  { slug: "drogba", name: "Drogba", number: "#11", img: imagePath("Drogba"), description: "The Ivorian Legend" },
  { slug: "lampard", name: "Lampard", number: "#8", img: imagePath("Lampard"), description: "The Midfield General" },
  { slug: "raul", name: "Raul", number: "#7", img: imagePath("Raul"), description: "El Ángel de Madrid" },
  { slug: "pirlo", name: "Pirlo", number: "#21", img: imagePath("Pirlo"), description: "The Metronome" },
];
const PlayerCarousel: React.FC<{ title: string; players: Player[]; scrollRef: React.RefObject<HTMLDivElement | null>; scroll: any }> = ({
  title,
  players,
  scrollRef,
  scroll,
}) => (
  <section className="site-section featured-players">
    <h2 className="site-section-heading">{title}</h2>
    <div className="carousel-wrapper">
      <button className="carousel-arrow left" onClick={() => scroll(scrollRef, "left")} aria-label="Scroll Left">
        &lt;
      </button>
      <div className="product-carousel" ref={scrollRef}>
        {players.map((p) => {
          const { t } = useTranslation();
          const category = p.number === "#1" ? "goalkeepers" : oldGenPlayers.find(op => op.slug === p.slug) ? "oldGen" : "newGen";
          return (
          <Link key={p.slug} to={`/collection/${p.slug}`} className="product-card featured-card">
            <div className="card-media">
              <img src={p.img} alt={`${t(`players.${category}.${p.slug}.name`, p.name)} Collection`} className="product-image" />
            </div>
            <div className="card-body">
              <h3 className="product-title">{p.number} {t(`players.${category}.${p.slug}.name`, p.name)}</h3>
              <p className="description">{t(`players.${category}.${p.slug}.description`, p.description)}</p>
            </div>
          </Link>
          );
        })}
      </div>
      <button className="carousel-arrow right" onClick={() => scroll(scrollRef, "right")} aria-label="Scroll Right">
        &gt;
      </button>
    </div>
  </section>
);

// Position to players mapping
const positionPlayersMap: { [key: string]: { position: string; players: string[] } } = {
  'GK': { position: 'Goalkeeper', players: ['Iker Casillas', 'Gianluigi Buffon', 'Manuel Neuer'] },
  'RB': { position: 'Right Back', players: ['Cafu', 'Dani Alves', 'Philipp Lahm'] },
  'LB': { position: 'Left Back', players: ['Paolo Maldini', 'Roberto Carlos', 'Marcelo'] },
  'CB': { position: 'Centre Back', players: ['Franz Beckenbauer', 'Virgil van Dijk', 'Sergio Ramos'] },
  'CDM': { position: 'CDM (Defensive)', players: ['Claude Makelele', 'Sergio Busquets', 'Lothar Matthäus'] },
  'CM': { position: 'CM (Central)', players: ['Xavi', 'Andrés Iniesta', 'Luka Modrić'] },
  'CAM': { position: 'CAM (Attacking)', players: ['Diego Maradona', 'Zinedine Zidane', 'Johan Cruyff'] },
  'RW': { position: 'Right Wing', players: ['Lionel Messi', 'Luis Figo', 'David Beckham'] },
  'LW': { position: 'Left Wing', players: ['Cristiano Ronaldo', 'Ronaldinho', 'Neymar'] },
  'ST': { position: 'Striker (CF)', players: ['Pelé', 'Ronaldo Nazário', 'Thierry Henry'] },
};

// Football pitch position
const FootballPitch: React.FC<{ onSelectPosition: (code: string) => void }> = ({ onSelectPosition }) => {
  const positions: { code: string; label: string; left: string; top: string }[] = [
    { code: 'GK', label: 'Goalkeeper', left: '50%', top: '90%' },
    { code: 'RB', label: 'Right Back', left: '82%', top: '74%' },
    { code: 'CB1', label: 'Center Back', left: '62%', top: '74%' },
    { code: 'CB2', label: 'Center Back', left: '38%', top: '74%' },
    { code: 'LB', label: 'Left Back', left: '18%', top: '74%' },
    { code: 'CDM', label: 'Defensive Mid', left: '50%', top: '60%' },
    { code: 'CM', label: 'Central Mid', left: '50%', top: '48%' },
    { code: 'CAM', label: 'Attacking Mid', left: '50%', top: '36%' },
    { code: 'LW', label: 'Left Wing', left: '18%', top: '16%' },
    { code: 'RW', label: 'Right Wing', left: '82%', top: '16%' },
    { code: 'ST', label: 'Striker', left: '50%', top: '8%' },
  ];

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem 0' }}>
      <div
        role="region"
        aria-label="Football pitch - shop by position"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 720,
          aspectRatio: '2/3',
          borderRadius: 12,
          boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          background: 'linear-gradient(#2aa84f, #1f7a3a)'
        }}
      >
        {/* SVG pitch - scales with container */}
        <svg viewBox="0 0 100 150" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: '100%', display: 'block' }} aria-hidden>
          {/* Grass background */}
          <defs>
            <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#2aa84f" />
              <stop offset="100%" stopColor="#1f7a3a" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="100" height="150" rx="3" fill="url(#g)" />

          {/* Outer border / touchlines */}
          <rect x="4" y="4" width="92" height="142" rx="1" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="0.8" />

          {/* Halfway line */}
          <line x1="4" y1="75" x2="96" y2="75" stroke="rgba(255,255,255,0.9)" strokeWidth="0.5" />

          {/* Center circle */}
          <circle cx="50" cy="75" r="12" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="0.6" />
          <circle cx="50" cy="75" r="1.2" fill="rgba(255,255,255,0.95)" />
          {/* Top penalty area */}
          <rect x="16" y="4" width="68" height="30" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="0.6" />
          {/* Top 18 meter box */}
          <rect x="34" y="4" width="32" height="10" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="0.6" />
          {/* Top penalty spot */}
          <circle cx="50" cy="23" r="0.8" fill="rgba(255,255,255,0.95)" />
          {/* Top penalty arc */}
          <path d="M34 34 A12 12 0 0 0 66 34" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="0.45" />

          {/* Bottom penalty area */}
          <rect x="16" y="116" width="68" height="30" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="0.6" />
          {/* Bottom 6-yard box */}
          <rect x="34" y="136" width="32" height="10" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="0.6" />
          {/* Bottom penalty spot */}
          <circle cx="50" cy="128" r="0.9" fill="rgba(255,255,255,0.95)" />
          {/* Bottom penalty arc */}
          <path d="M34 116 A12 12 0 0 1 66 116" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="0.45" />

          {/* Corner arcs */}
          <path d="M4 8 A4 4 0 0 1 8 4" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="0.45" />
          <path d="M96 8 A4 4 0 0 0 92 4" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="0.45" />
          <path d="M4 142 A4 4 0 0 0 8 146" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="0.45" />
          <path d="M96 142 A4 4 0 0 1 92 146" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="0.45" />

          {/* Goals (outside the field) */}
          <rect x="44" y="-2" width="12" height="4" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="0.5" />
          <rect x="44" y="148" width="12" height="4" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="0.5" />
        </svg>

        {/* clickable position buttons (kept as absolute HTML elements for accessibility and interactions) */}
        {positions.map((p) => (
          <button
            key={p.code}
            onClick={() => onSelectPosition(p.code)}
            title={`Shop by ${p.label}`}
            aria-label={`Shop by ${p.label}`}
            style={{
              position: 'absolute',
              left: p.left,
              top: p.top,
              transform: 'translate(-50%,-50%)',
              width: 46,
              height: 46,
              borderRadius: '50%',
              background: '#fff',
              color: '#111',
              border: '2px solid rgba(0,0,0,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontWeight: 700,
              boxShadow: '0 3px 8px rgba(0,0,0,0.18)',
            }}
          >
            {p.code.replace(/\d+$/, '')}
          </button>
        ))}
      </div>
    </div>
  );
};

const Home: React.FC<HomeProps> = ({ onAddToCart }) => {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMediaIndex((i) => (i + 1) % heroMedia.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const currentMedia = heroMedia[currentMediaIndex];
  if (!currentMedia) return null;

  const newRef = useRef<HTMLDivElement | null>(null);
  const oldRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  const scroll = (ref: React.RefObject<HTMLDivElement | null>, direction: "left" | "right") => {
    if (ref.current) {
      const amount = 300;
      ref.current.scrollLeft += direction === "left" ? -amount : amount;
    }
  };

  const FEATURED_PRODUCTS: Product[] = [];

  return (
    <div className="site-wrap">
      {/* HERO */}
      <section
        className="hero-image-slideshow"
        style={{
          backgroundSize: "cover",
          backgroundPosition: "center 20%",
          height: "500px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          transition: "background-image 1s ease-in-out",
          backgroundImage: currentMedia.type === "image" ? `url(${currentMedia.src})` : "none",
        }}
      >
        {currentMedia.type === "video" && (
          <video key={currentMedia.src} src={currentMedia.src} autoPlay loop muted playsInline style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", zIndex: -1 }} />
        )}
        <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.35)", zIndex: 0 }} />
        <div style={{ zIndex: 1 }}>
          <h1 className="site-section-heading" style={{ fontSize: "3rem", margin: 0, textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>
            {/** translated hero */}
            {useTranslation().t('home.hero_title', 'THE GOAT-SHOP COLLECTION')}
          </h1>
          <p style={{ fontSize: "1.4rem", fontWeight: 300, textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
            {useTranslation().t('home.hero_sub', 'Shop the Official Gear of the Legends')}
          </p>
          <Link to="/products" className="hero-cta" style={{ marginTop: "150px" }}>
            {useTranslation().t('home.shop_now', 'Shop Now')}
          </Link>
        </div>
      </section>
  <PlayerCarousel title={useTranslation().t('home.new_gen', 'Shop by New Gen Players')} players={newGenPlayers} scrollRef={newRef} scroll={scroll} />
      <hr />
  <PlayerCarousel title={useTranslation().t('home.old_gen', 'Shop by Old Gen Players')} players={oldGenPlayers} scrollRef={oldRef} scroll={scroll} />
      <hr />
      <section className="site-section shop-by-position">
        <h2 className="site-section-heading">{useTranslation().t('home.shop_by_position', 'Shop by Position')}</h2>
        <FootballPitch onSelectPosition={(code: string) => navigate(`/position/${encodeURIComponent(code)}`)} />
      </section>
      <hr />
      <section className="site-section latest-products">
        <h2 className="site-section-heading">{useTranslation().t('home.featured_heading', 'Must-Haves & Trending Now')}</h2>
        <div className="products-grid">
          {FEATURED_PRODUCTS.map((product) => (
            <div key={product.id} className="card">
              <div className="card-media">
                <img src={product.image_url} alt={product.name} className="product-image" />
              </div>
              <div className="card-body">
                <h3 className="product-title">{product.name}</h3>
                <p className="description">{product.description}</p>
                <div className="product-meta">
                  <span className="price">{formatPrice(product.price)}</span>
                </div>
                <div className="card-actions">
                  <button className="btn btn-primary btn-sm" onClick={() => onAddToCart(product, 1)} disabled={product.stock === 0}>
                    {product.stock > 0 ? useTranslation().t('home.add_to_cart', 'Add to Cart') : useTranslation().t('home.sold_out', 'Sold Out')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: "3rem" }}>
          <Link to="/products" className="btn btn-secondary">
            {useTranslation().t('home.explore_all', 'Explore All Collections')}
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
