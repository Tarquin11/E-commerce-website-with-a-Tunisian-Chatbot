import React, { useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface PositionCarouselProps {}

const positionPlayersMap: { [key: string]: { position: string; players: { name: string; slug: string }[] } } = {
  'GK': {
    position: 'Goalkeeper',
    players: [
      { name: 'Iker Casillas', slug: 'iker-casillas' },
      { name: 'Gianluigi Buffon', slug: 'buffon' },
      { name: 'Manuel Neuer', slug: 'neuer' }
    ]
  },
  'RB': {
    position: 'Right Back',
    players: [
      { name: 'Cafu', slug: 'cafu' },
      { name: 'Dani Alves', slug: 'dani-alves' },
      { name: 'Philipp Lahm', slug: 'lahm' }
    ]
  },
  'LB': {
    position: 'Left Back',
    players: [
      { name: 'Paolo Maldini', slug: 'maldini' },
      { name: 'Roberto Carlos', slug: 'roberto-carlos' },
      { name: 'Marcelo', slug: 'marcelo' }
    ]
  },
  'CB': {
    position: 'Centre Back',
    players: [
      { name: 'Franz Beckenbauer', slug: 'beckenbauer' },
      { name: 'Virgil van Dijk', slug: 'virgil' },
      { name: 'Sergio Ramos', slug: 'sergio' }
    ]
  },
  'CB1': {
    position: 'Centre Back',
    players: [
      { name: 'Franz Beckenbauer', slug: 'beckenbauer' },
      { name: 'Virgil van Dijk', slug: 'virgil' },
      { name: 'Sergio Ramos', slug: 'sergio' }
    ]
  },
  'CB2': {
    position: 'Centre Back',
    players: [
      { name: 'Franz Beckenbauer', slug: 'beckenbauer' },
      { name: 'Virgil van Dijk', slug: 'virgil' },
      { name: 'Sergio Ramos', slug: 'sergio' }
    ]
  },
  'CDM': {
    position: 'CDM (Defensive)',
    players: [
      { name: 'Claude Makelele', slug: 'makelele' },
      { name: 'Sergio Busquets', slug: 'busquets' },
      { name: 'Lothar Matthäus', slug: 'matthaus' }
    ]
  },
  'CM': {
    position: 'CM (Central)',
    players: [
      { name: 'Xavi', slug: 'xavi' },
      { name: 'Andrés Iniesta', slug: 'iniesta' },
      { name: 'Luka Modrić', slug: 'modric' }
    ]
  },
  'CAM': {
    position: 'CAM (Attacking)',
    players: [
      { name: 'Diego Maradona', slug: 'maradona' },
      { name: 'Zinedine Zidane', slug: 'zidane' },
      { name: 'Johan Cruyff', slug: 'cruyff' }
    ]
  },
  'RW': {
    position: 'Right Wing',
    players: [
      { name: 'Lionel Messi', slug: 'messi' },
      { name: 'Luis Figo', slug: 'figo' },
      { name: 'David Beckham', slug: 'beckham' }
    ]
  },
  'LW': {
    position: 'Left Wing',
    players: [
      { name: 'Cristiano Ronaldo', slug: 'ronaldo' },
      { name: 'Ronaldinho', slug: 'ronaldinho' },
      { name: 'Neymar', slug: 'neymar' }
    ]
  },
  'ST': {
    position: 'Striker (CF)',
    players: [
      { name: 'Pelé', slug: 'pele' },
      { name: 'Ronaldo Nazário', slug: 'ronaldo-nazario' },
      { name: 'Thierry Henry', slug: 'henry' }
    ]
  },
};

const imagePath = (slug: string) => `../src/assets/${slug}.jpg`;

const PositionCarousel: React.FC<PositionCarouselProps> = () => {
  const { position } = useParams<{ position: string }>();
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const decodedPosition = position ? decodeURIComponent(position) : '';
  const positionData = positionPlayersMap[decodedPosition];

  if (!positionData) {
    return (
      <div className="site-wrap" style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Position not found</h1>
        <Link to="/">Back to Home</Link>
      </div>
    );
  }

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const amount = 300;
      scrollRef.current.scrollLeft += direction === "left" ? -amount : amount;
    }
  };

  return (
    <div className="site-wrap">
      <section style={{ padding: '2rem 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <Link to="/" style={{ color: '#007bff', textDecoration: 'none', fontSize: '0.9rem' }}>
            ← Back to Home
          </Link>
        </div>
        <h1 className="site-section-heading" style={{ marginBottom: '2rem' }}>
          {positionData.position}
        </h1>

        <div className="carousel-wrapper">
          <button className="carousel-arrow left" onClick={() => scroll("left")} aria-label="Scroll Left">
            &lt;
          </button>
          <div className="product-carousel" ref={scrollRef} style={{ display: 'flex', gap: '1rem' }}>
            {positionData.players.map((player) => (
              <Link
                key={player.slug}
                to={`/collection/${player.slug}`}
                className="product-card featured-card"
                style={{
                  flex: '0 0 calc(33.333% - 0.67rem)',
                  minWidth: '200px',
                  textDecoration: 'none',
                }}
              >
                <div className="card-media">
                  <img
                    src={imagePath(player.slug)}
                    alt={player.name}
                    className="product-image"
                    style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '8px' }}
                  />
                </div>
                <div className="card-body">
                  <h3 className="product-title" style={{ margin: '0.5rem 0', color: '#111', textDecoration: 'none' }}>
                    {player.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
          <button className="carousel-arrow right" onClick={() => scroll("right")} aria-label="Scroll Right">
            &gt;
          </button>
        </div>
      </section>
    </div>
  );
};

export default PositionCarousel;
