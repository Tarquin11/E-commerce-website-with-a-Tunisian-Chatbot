import React from 'react';
import '../styles/clubs-grid.css';

export interface Club {
  id: number;
  name: string;
  logo_url: string;
  description: string;
  country: string;
  product_count: number;
}

interface ClubGridProps {
  clubs: Club[];
  onClubSelect: (clubId: number) => void;
}

const ClubGrid: React.FC<ClubGridProps> = ({ clubs, onClubSelect }) => {
  return (
    <div className="clubs-grid">
      {clubs.map((club) => (
        <div 
          key={club.id} 
          className="club-card" 
          onClick={() => onClubSelect(club.id)}
          role="button"
          tabIndex={0}
        >
          <div className="club-logo">
            <img src={club.logo_url} alt={`${club.name} logo`} />
          </div>
          <div className="club-info">
            <h3>{club.name}</h3>
            <p className="club-description">{club.description}</p>
            <p className="product-count">{club.product_count} Products</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ClubGrid;