import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import { Product } from "../types";
import { getClubProducts, getClubs } from "../api/api";
import { formatPrice } from "../utils/currency";
import ClubGrid, { Club } from "./ClubGrid";
import "../styles/products-list.css";

interface ProductListProps {
  onAddToCart: (product: Product, quantity?: number) => void;
  isLoggedIn?: boolean;
}
const SEASONS = [
  "All Seasons",
  ...Array.from({ length: 15 }, (_, i) => {
    const year = 25 - i;  // start at 25 -> "25/26", then 24 -> "24/25" ... down to 11
    return `${year.toString().padStart(2, '0')}/${(year + 1).toString().padStart(2, '0')}`;
  })
];

const ProductList: React.FC<ProductListProps> = ({ onAddToCart, isLoggedIn = false }) => {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null);
  const [selectedSeason, setSelectedSeason] = useState("All Seasons");
  const location = useLocation();

  // Clubs to exclude from products tab
  const EXCLUDED_CLUBS = [
    'monaco',
    'france',
    'brazil',
    'dortmund',
    'england',
    'tottenham'
  ];

  useEffect(() => {
    const loadClubs = async () => {
      try {
        setLoading(true);
        const clubsData = await getClubs();
        // Filter out excluded clubs (case-insensitive)
        const filteredClubs = clubsData.filter(club => 
          !EXCLUDED_CLUBS.some(excluded => 
            club.name.toLowerCase().includes(excluded.toLowerCase())
          )
        );
        setClubs(filteredClubs);
        setError(null);
      } catch (err) {
        setError("Error loading clubs. Please try again.");
        console.error("Error loading clubs:", err);
      } finally {
        setLoading(false);
      }
    };
    loadClubs();
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      if (!selectedClubId) return;
      
      try {
        setLoading(true);
        const data = await getClubProducts(selectedClubId);
        
        // Get the selected club name for filtering
        const selectedClub = clubs.find(c => c.id === selectedClubId);
        const clubName = (selectedClub?.name || '').toLowerCase();
        
        // Helper function to check if club name matches (handles variations)
        const isRealMadrid = clubName.includes('real') && clubName.includes('madrid');
        const isPSG = clubName.includes('psg') || 
                     (clubName.includes('paris') && (clubName.includes('saint') || clubName.includes('germain')));
        
        // Filter products
        const filtered = data.filter(p => {
          // Filter by season
          if (selectedSeason !== "All Seasons" && p.season !== selectedSeason) {
            return false;
          }
          
          const productName = (p.name || '').toLowerCase();
          const playerSlug = (p.player_slug || '').toLowerCase();
          
          // Remove Vini Jr jerseys from Real Madrid ONLY
          if (isRealMadrid) {
            // Check for Vini Jr variations (Vini, Vinicius, Vini Jr, etc.)
            if (productName.includes('vini') || 
                productName.includes('vinicius') ||
                playerSlug.includes('vini') ||
                playerSlug.includes('vinicius')) {
              return false;
            }
          }
          
          // Remove Mbappe jerseys from Real Madrid and PSG
          if (isRealMadrid || isPSG) {
            // Check for Mbappe variations (Mbappe, Mbappé, Kylian, etc.)
            if (productName.includes('mbappe') || 
                productName.includes('mbappé') ||
                productName.includes('kylian') ||
                playerSlug.includes('mbappe') ||
                playerSlug.includes('mbappé') ||
                playerSlug.includes('kylian')) {
              return false;
            }
          }
          
          return true;
        });
        
        // Sort seasons newest to oldest by parsing the starting year (e.g. "25/26" -> 25)
        filtered.sort((a, b) => {
          const aYear = parseInt((a.season || '').split('/')[0] || '0', 10);
          const bYear = parseInt((b.season || '').split('/')[0] || '0', 10);
          return bYear - aYear;
        });
        setProducts(filtered);
        setError(null);
      } catch (err) {
        setError("Error loading products. Please try again.");
        console.error("Error loading products:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, [selectedClubId, selectedSeason, clubs]);

  // Client-side position filtering: read ?position= from URL and attempt a heuristic
  const params = new URLSearchParams(location.search);
  const positionQuery = params.get('position') || undefined;

  const POSITION_TOKENS: Record<string, string[]> = {
    GK: ['goalkeeper', 'gk'],
    RB: ['right back', 'rb', 'right-back', 'rightback'],
    LB: ['left back', 'lb', 'left-back', 'leftback'],
    CB: ['center back', 'centre back', 'cb', 'center-back', 'centre-back'],
    CDM: ['cdm', 'defensive mid', 'defensive midfielder'],
    CM: ['central mid', 'cm', 'central midfielder', 'midfielder'],
    CAM: ['attacking mid', 'cam', 'attacking midfielder'],
    LW: ['left wing', 'lw', 'left winger'],
    RW: ['right wing', 'rw', 'right winger'],
    ST: ['striker', 'st', 'forward', 'centre forward'],
  };

  const filteredProducts = (positionQuery
    ? products.filter((p) => {
        const hay = `${p.name} ${p.category || ''}`.toLowerCase();
        const code = positionQuery.toUpperCase();
        // Support CB1/CB2 -> CB
        const baseCode = code.replace(/\d+$/, '') as keyof typeof POSITION_TOKENS;
        const tokens = POSITION_TOKENS[baseCode] || [baseCode.toLowerCase()];
        return tokens.some((tok) => hay.includes(tok));
      })
    : products);

  if (loading && !clubs.length) return <div>Loading clubs...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <section className="site-section product-list-section">
      <div className="product-page-container">
        {!selectedClubId ? (
          // Show clubs grid when no club is selected
            <div className="clubs-section">
              <div className="section-header">
                <h1 className="site-section-heading text-center">Football Clubs</h1>
              </div>
              <ClubGrid clubs={clubs} onClubSelect={setSelectedClubId} />
            </div>
        ) : (
          // Show products when a club is selected
          <div className="club-products">
            <div className="club-header">
              <button className="back-button" onClick={() => setSelectedClubId(null)}>
                ← Back to Clubs
              </button>
              <div className="club-info">
                <img 
                  src={clubs.find(c => c.id === selectedClubId)?.logo_url} 
                  alt={clubs.find(c => c.id === selectedClubId)?.name}
                  className="club-logo"
                />
                <h1>{clubs.find(c => c.id === selectedClubId)?.name}</h1>
              </div>
            </div>

            {/* Filters */}
            <div className="filters">
              <div className="filter-group">
                <label>Shop by Season</label>
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value)}
                >
                  {SEASONS.map((season) => (
                    <option key={season} value={season}>
                      {season}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div>Loading products...</div>
            ) : (
              <div className="products-grid">
                {filteredProducts.length === 0 ? (
                  <p className="no-products">No products found for your selection.</p>
                ) : (
                  filteredProducts.map((product) => (
                    <article key={product.id} className="card product-card">
                      <div className="card-media">
                        <img
                          src={product.image_url || "/images/jersey-placeholder.png"}
                          alt={`${product.name} product`}
                          className="product-image"
                          onClick={() => window.open(`/product/${product.id}`, '_blank')}
                          style={{ cursor: 'pointer' }}
                        />
                      </div>
                      <div className="card-body">
                        <h3 className="product-title">{product.name}</h3>
                        <p className="description">{product.description}</p>
                        <div className="product-meta">
                          <span className="price">{formatPrice(product.price)}</span>
                          <span className="stock">
                            {product.stock > 0 ? "available" : "Sold out"}
                          </span>
                        </div>
                        <div className="card-actions">
                          <button
                            className="btn btn-primary"
                            onClick={() => {
                              const hasToken = !!localStorage.getItem('token');
                              if (!hasToken && !isLoggedIn) {
                                navigate('/login');
                                alert('Please login to add items to cart');
                                return;
                              }
                              onAddToCart(product, 1);
                            }}
                            disabled={product.stock === 0}
                          >
                            {product.stock > 0 ? "Add to Cart" : "Sold Out"}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductList;
