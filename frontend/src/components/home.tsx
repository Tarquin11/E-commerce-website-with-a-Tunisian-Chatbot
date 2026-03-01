import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { Product } from "../types";

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

const heroMedia: HeroMedia[] = [
  { type: "image", src: "../src/assets/RealTrio.png" },
  { type: "image", src: "../src/assets/CR7.jpg" },
  { type: "image", src: "../src/assets/Messi.png" },
  { type: "video", src: "../src/assets/SergioRamos.mp4" },
  { type: "video", src: "../src/assets/Barca.mp4" },
];

const imagePath = (name: string) => `../src/assets/${name}.jpg`;

const newGenPlayers: Player[] = [
  { slug: "mbappe", name: "Mbappe", number: "#10", img: imagePath("Mbappe"), description: "Wipe Them Tears" },
  { slug: "vini-jr", name: "Vini Jr.", number: "#7", img: imagePath("Vini"), description: "Baila Vini!" },
  { slug: "bellingham", name: "Bellingham", number: "#5", img: imagePath("Bellingham"), description: "Belligoal!" },
  { slug: "valverde", name: "Valverde", number: "#8", img: imagePath("Valverde"), description: "Midfield engine" },
  { slug: "ousmane", name: "Dembele", number: "#10", img: imagePath("Ousmane"), description: "Direct and fast" },
  { slug: "harry-kane", name: "Harry Kane", number: "#9", img: imagePath("HarryKane"), description: "Clinical finisher" },
  { slug: "virgil", name: "Virgil", number: "#4", img: imagePath("Virgil"), description: "Rock at the back" },
  { slug: "salah", name: "Mo Salah", number: "#11", img: imagePath("Salah"), description: "The Egyptian King" },
  { slug: "raphinha", name: "Raphinha", number: "#11", img: imagePath("Raphinha"), description: "Relentless dribbler" },
  { slug: "lamine", name: "Lamine Yamal", number: "#10", img: imagePath("Lamine"), description: "Young talent" },
  { slug: "musiala", name: "Musiala", number: "#10", img: imagePath("Musiala"), description: "Elegant creator" },
  { slug: "pedri", name: "Pedri", number: "#8", img: imagePath("Pedri"), description: "Pass master" },
  { slug: "haaland", name: "Haaland", number: "#9", img: imagePath("Haaland"), description: "Goal machine" },
  { slug: "palmer", name: "Cole Palmer", number: "#10", img: imagePath("Palmer"), description: "Ice cold" },
  { slug: "lautaro", name: "Lautaro", number: "#10", img: imagePath("Lautaro"), description: "Sharp striker" },
];

const oldGenPlayers: Player[] = [
  { slug: "ronaldo", name: "Ronaldo", number: "#7", img: imagePath("Ronaldo"), description: "Siuuuu" },
  { slug: "messi", name: "Messi", number: "#10", img: imagePath("Messi"), description: "Magic left foot" },
  { slug: "zidane", name: "Zidane", number: "#10", img: imagePath("Zidane"), description: "Pure class" },
  { slug: "neymar", name: "Neymar", number: "#10", img: imagePath("Neymar"), description: "The magician" },
  { slug: "maradona", name: "Maradona", number: "#10", img: imagePath("Maradona"), description: "Hand of God" },
  { slug: "pele", name: "Pele", number: "#10", img: imagePath("Pele"), description: "Three-time world champion" },
  { slug: "sergio", name: "Sergio Ramos", number: "#4", img: imagePath("Sergio"), description: "Warrior" },
  { slug: "marcelo", name: "Marcelo", number: "#12", img: imagePath("Marcelo"), description: "Left-back icon" },
  { slug: "xavi", name: "Xavi", number: "#6", img: imagePath("Xavi"), description: "Tiki-taka brain" },
  { slug: "iniesta", name: "Iniesta", number: "#8", img: imagePath("Iniesta"), description: "The painter" },
  { slug: "benzema", name: "Benzema", number: "#9", img: imagePath("Benzema"), description: "Elite finisher" },
  { slug: "kroos", name: "Kroos", number: "#8", img: imagePath("Kroos"), description: "The engineer" },
  { slug: "henry", name: "Henry", number: "#14", img: imagePath("Henry"), description: "Arsenal king" },
  { slug: "modric", name: "Modric", number: "#10", img: imagePath("Modric"), description: "Ballon d'Or maestro" },
  { slug: "maldini", name: "Maldini", number: "#3", img: imagePath("Maldini"), description: "Defensive master" },
  { slug: "ozil", name: "Ozil", number: "#10", img: imagePath("Ozil"), description: "Assist king" },
  { slug: "gerrard", name: "Gerrard", number: "#8", img: imagePath("Gerrard"), description: "Captain fantastic" },
  { slug: "drogba", name: "Drogba", number: "#11", img: imagePath("Drogba"), description: "Big-game striker" },
  { slug: "lampard", name: "Lampard", number: "#8", img: imagePath("Lampard"), description: "Midfield general" },
  { slug: "raul", name: "Raul", number: "#7", img: imagePath("Raul"), description: "Madrid legend" },
  { slug: "pirlo", name: "Pirlo", number: "#21", img: imagePath("Pirlo"), description: "The metronome" },
];

type CarouselProps = {
  title: string;
  players: Player[];
  scrollRef: React.RefObject<HTMLDivElement | null>;
  scroll: (ref: React.RefObject<HTMLDivElement | null>, direction: "left" | "right") => void;
};

const PlayerCarousel: React.FC<CarouselProps> = ({ title, players, scrollRef, scroll }) => {
  const { t } = useTranslation();

  return (
    <section className="site-section featured-players">
      <h2 className="site-section-heading">{title}</h2>
      <div className="carousel-wrapper">
        <button className="carousel-arrow left" onClick={() => scroll(scrollRef, "left")} aria-label="Scroll Left">
          &lt;
        </button>
        <div className="product-carousel" ref={scrollRef}>
          {players.map((player) => {
            const category = oldGenPlayers.some((p) => p.slug === player.slug) ? "oldGen" : "newGen";
            return (
              <Link key={player.slug} to={`/collection/${player.slug}`} className="product-card featured-card">
                <div className="card-media">
                  <img
                    src={player.img}
                    alt={`${t(`players.${category}.${player.slug}.name`, player.name)} Collection`}
                    className="product-image"
                  />
                </div>
                <div className="card-body">
                  <h3 className="product-title">
                    {player.number} {t(`players.${category}.${player.slug}.name`, player.name)}
                  </h3>
                  <p className="description">{t(`players.${category}.${player.slug}.description`, player.description)}</p>
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
};

const FootballPitch: React.FC<{ onSelectPosition: (code: string) => void }> = ({ onSelectPosition }) => {
  const positions: { code: string; label: string; left: string; top: string }[] = [
    { code: "GK", label: "Goalkeeper", left: "50%", top: "90%" },
    { code: "RB", label: "Right Back", left: "82%", top: "74%" },
    { code: "CB1", label: "Center Back", left: "62%", top: "74%" },
    { code: "CB2", label: "Center Back", left: "38%", top: "74%" },
    { code: "LB", label: "Left Back", left: "18%", top: "74%" },
    { code: "CDM", label: "Defensive Mid", left: "50%", top: "60%" },
    { code: "CM", label: "Central Mid", left: "50%", top: "48%" },
    { code: "CAM", label: "Attacking Mid", left: "50%", top: "36%" },
    { code: "LW", label: "Left Wing", left: "18%", top: "16%" },
    { code: "RW", label: "Right Wing", left: "82%", top: "16%" },
    { code: "ST", label: "Striker", left: "50%", top: "8%" },
  ];

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "1rem 0" }}>
      <div
        role="region"
        aria-label="Football pitch - shop by position"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 720,
          aspectRatio: "2/3",
          borderRadius: 12,
          boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
          overflow: "hidden",
          background: "linear-gradient(#2aa84f, #1f7a3a)",
        }}
      >
        <svg viewBox="0 0 100 150" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%", display: "block" }} aria-hidden>
          <defs>
            <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#2aa84f" />
              <stop offset="100%" stopColor="#1f7a3a" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="100" height="150" rx="3" fill="url(#g)" />
          <rect x="4" y="4" width="92" height="142" rx="1" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="0.8" />
          <line x1="4" y1="75" x2="96" y2="75" stroke="rgba(255,255,255,0.9)" strokeWidth="0.5" />
          <circle cx="50" cy="75" r="12" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="0.6" />
        </svg>
        {positions.map((position) => (
          <button
            key={position.code}
            onClick={() => onSelectPosition(position.code)}
            title={`Shop by ${position.label}`}
            aria-label={`Shop by ${position.label}`}
            style={{
              position: "absolute",
              left: position.left,
              top: position.top,
              transform: "translate(-50%,-50%)",
              width: 46,
              height: 46,
              borderRadius: "50%",
              background: "#fff",
              color: "#111",
              border: "2px solid rgba(0,0,0,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontWeight: 700,
              boxShadow: "0 3px 8px rgba(0,0,0,0.18)",
            }}
          >
            {position.code.replace(/\d+$/, "")}
          </button>
        ))}
      </div>
    </div>
  );
};

const Home: React.FC<HomeProps> = ({ onAddToCart: _onAddToCart }) => {
  const { t } = useTranslation();
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const newRef = useRef<HTMLDivElement | null>(null);
  const oldRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMediaIndex((i) => (i + 1) % heroMedia.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const currentMedia = heroMedia[currentMediaIndex];
  if (!currentMedia) return null;

  const scroll = (ref: React.RefObject<HTMLDivElement | null>, direction: "left" | "right") => {
    if (!ref.current) return;
    const amount = 300;
    ref.current.scrollLeft += direction === "left" ? -amount : amount;
  };

  return (
    <div className="site-wrap">
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
          <video
            key={currentMedia.src}
            src={currentMedia.src}
            autoPlay
            loop
            muted
            playsInline
            style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", zIndex: -1 }}
          />
        )}
        <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.35)", zIndex: 0 }} />
        <div style={{ zIndex: 1 }}>
          <h1 className="site-section-heading" style={{ fontSize: "3rem", margin: 0, textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>
            {t("home.hero_title", "THE GOAT-SHOP COLLECTION")}
          </h1>
          <p style={{ fontSize: "1.4rem", fontWeight: 300, textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
            {t("home.hero_sub", "Shop the Official Gear of the Legends")}
          </p>
          <Link to="/products" className="hero-cta" style={{ marginTop: "150px" }}>
            {t("home.shop_now", "Shop Now")}
          </Link>
        </div>
      </section>

      <PlayerCarousel title={t("home.new_gen", "Shop by New Gen Players")} players={newGenPlayers} scrollRef={newRef} scroll={scroll} />
      <hr />
      <PlayerCarousel title={t("home.old_gen", "Shop by Old Gen Players")} players={oldGenPlayers} scrollRef={oldRef} scroll={scroll} />
      <hr />

      <section className="site-section shop-by-position">
        <h2 className="site-section-heading">{t("home.shop_by_position", "Shop by Position")}</h2>
        <FootballPitch onSelectPosition={(code: string) => navigate(`/position/${encodeURIComponent(code)}`)} />
      </section>

      <div style={{ textAlign: "center", margin: "2rem 0 3rem" }}>
        <Link to="/products" className="btn btn-secondary">
          {t("home.explore_all", "Explore All Collections")}
        </Link>
      </div>
    </div>
  );
};

export default Home;
