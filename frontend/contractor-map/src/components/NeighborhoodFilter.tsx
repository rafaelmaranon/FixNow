import React, { useState, useEffect } from 'react';
import './NeighborhoodFilter.css';

interface NeighborhoodFilterProps {
  selectedNeighborhood: string;
  selectedMode: 'strict' | 'loose';
  onNeighborhoodChange: (neighborhood: string) => void;
  onModeChange: (mode: 'strict' | 'loose') => void;
}

interface Neighborhood {
  key: string;
  name: string;
  aliases: string[];
}

const NeighborhoodFilter: React.FC<NeighborhoodFilterProps> = ({
  selectedNeighborhood,
  selectedMode,
  onNeighborhoodChange,
  onModeChange
}) => {
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Fetch available neighborhoods
    fetch('http://localhost:3004/neighborhoods')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setNeighborhoods(data.neighborhoods);
        }
      })
      .catch(err => console.error('Failed to fetch neighborhoods:', err));
  }, []);

  const getCurrentNeighborhoodName = () => {
    if (selectedNeighborhood === 'all') return 'All SF';
    const hood = neighborhoods.find(n => n.key === selectedNeighborhood);
    return hood?.name || selectedNeighborhood;
  };

  return (
    <div className="neighborhood-filter">
      <div className="filter-pills">
        <div className="location-pill">
          <span className="pill-label">📍 Location:</span>
          <button 
            className="pill-value"
            onClick={() => setIsOpen(!isOpen)}
          >
            {getCurrentNeighborhoodName()}
            <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
          </button>
        </div>

        <div className="mode-pill">
          <span className="pill-label">Mode:</span>
          <div className="mode-toggle">
            <button
              className={`mode-btn ${selectedMode === 'strict' ? 'active' : ''}`}
              onClick={() => onModeChange('strict')}
            >
              Strict
            </button>
            <button
              className={`mode-btn ${selectedMode === 'loose' ? 'active' : ''}`}
              onClick={() => onModeChange('loose')}
            >
              Loose
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="neighborhood-dropdown">
          <div className="dropdown-header">
            <h4>Select Neighborhood</h4>
            <button onClick={() => setIsOpen(false)}>✕</button>
          </div>
          
          <div className="neighborhood-list">
            <button
              className={`neighborhood-item ${selectedNeighborhood === 'all' ? 'active' : ''}`}
              onClick={() => {
                onNeighborhoodChange('all');
                setIsOpen(false);
              }}
            >
              <div className="neighborhood-name">All San Francisco</div>
              <div className="neighborhood-desc">Show contractors citywide</div>
            </button>

            {neighborhoods.map(hood => (
              <button
                key={hood.key}
                className={`neighborhood-item ${selectedNeighborhood === hood.key ? 'active' : ''}`}
                onClick={() => {
                  onNeighborhoodChange(hood.key);
                  setIsOpen(false);
                }}
              >
                <div className="neighborhood-name">{hood.name}</div>
                <div className="neighborhood-desc">
                  Includes: {hood.aliases.join(', ')}...
                </div>
              </button>
            ))}
          </div>

          <div className="mode-explanation">
            <div className="mode-info">
              <strong>Strict:</strong> Only shows contractors mentioning this specific neighborhood
            </div>
            <div className="mode-info">
              <strong>Loose:</strong> Includes nearby neighborhoods for more results
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NeighborhoodFilter;
