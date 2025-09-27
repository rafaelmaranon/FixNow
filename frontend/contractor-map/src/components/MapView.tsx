import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Job } from '../data/mockJobs';
import './MapView.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different job categories and urgencies with budget badges
const createCustomIcon = (category: string, urgency: string, price: number, status?: string) => {
  const getUrgencyColor = () => {
    switch (urgency) {
      case 'emergency': return '#ff4757';
      case 'high': return '#ff6b6b';
      case 'medium': return '#ffa502';
      case 'low': return '#2ed573';
      default: return '#3742fa';
    }
  };

  const getEmoji = () => {
    switch (category.toLowerCase()) {
      case 'plumbing': return '🔧';
      case 'electrical': return '⚡';
      case 'hvac': return '🌡️';
      case 'carpentry': return '🔨';
      default: return '🏠';
    }
  };

  const getBudgetBadge = () => {
    if (price < 200) return '$';
    if (price <= 500) return '$$';
    return '$$$';
  };

  const getBudgetColor = () => {
    if (price < 200) return '#2ed573';
    if (price <= 500) return '#ffa502';
    return '#ff6b6b';
  };

  const isHeld = status === 'held';
  const glowEffect = isHeld ? 'box-shadow: 0 0 20px #ffa502, 0 2px 10px rgba(0,0,0,0.3);' : 'box-shadow: 0 2px 10px rgba(0,0,0,0.3);';

  return L.divIcon({
    html: `
      <div style="position: relative;">
        <div style="
          background: ${getUrgencyColor()};
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          border: 3px solid white;
          ${glowEffect}
          ${isHeld ? 'animation: pulse 2s infinite;' : ''}
        ">
          ${getEmoji()}
        </div>
        <div style="
          position: absolute;
          top: -5px;
          right: -5px;
          background: ${getBudgetColor()};
          color: white;
          border-radius: 10px;
          padding: 2px 6px;
          font-size: 10px;
          font-weight: bold;
          border: 2px solid white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        ">
          ${getBudgetBadge()}
        </div>
        ${isHeld ? `
          <div style="
            position: absolute;
            bottom: -8px;
            left: 50%;
            transform: translateX(-50%);
            background: #ffa502;
            color: white;
            border-radius: 8px;
            padding: 1px 4px;
            font-size: 8px;
            font-weight: bold;
            white-space: nowrap;
          ">
            HELD
          </div>
        ` : ''}
      </div>
    `,
    className: 'custom-marker',
    iconSize: [50, 50],
    iconAnchor: [25, 25],
  });
};

interface Contractor {
  id: string;
  name: string;
  category: string;
  rating: number;
  eta: string;
  priceRange: string;
  distance: string;
  lat: number;
  lng: number;
}

interface MapViewProps {
  jobs: Job[];
  contractors?: Contractor[];
  viewMode?: 'jobs' | 'contractors';
}

const MapView: React.FC<MapViewProps> = ({ jobs, contractors = [], viewMode = 'jobs' }) => {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);
  const [showLegend, setShowLegend] = useState(false);

  // San Francisco center coordinates
  const center: [number, number] = [37.7749, -122.4194];

  const handleHoldJob = async (jobId: string) => {
    try {
      const response = await fetch('http://localhost:3001/api/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, minutes: 10 })
      });
      
      if (response.ok) {
        console.log(`🔒 Job ${jobId} held for 10 minutes`);
        // Refresh jobs to show updated status
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to hold job:', error);
    }
  };

  const handleDispatchJob = async (job: Job) => {
    try {
      const response = await fetch('http://localhost:3001/api/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategy: 'topNearby',
          limit: 5,
          filters: {
            categories: [job.category],
            urgency: [job.urgency.toUpperCase()],
            radiusMiles: 5
          }
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('📞 Dispatch result:', result);
        alert(`Contacted ${result.contacted} contractors! ${result.summary.accepted} accepted, ${result.summary.countered} countered.`);
      }
    } catch (error) {
      console.error('Failed to dispatch job:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getUrgencyBadge = (urgency: string) => {
    const colors = {
      emergency: '#ff4757',
      high: '#ff6b6b',
      medium: '#ffa502',
      low: '#2ed573'
    };
    
    return (
      <span 
        className="urgency-badge"
        style={{ backgroundColor: colors[urgency as keyof typeof colors] }}
      >
        {urgency.toUpperCase()}
      </span>
    );
  };

  // Create contractor icon
  const createContractorIcon = (category: string, priceRange: string) => {
    const getEmoji = () => {
      switch (category.toLowerCase()) {
        case 'plumbing': return '🔧';
        case 'electrical': return '⚡';
        case 'hvac': return '🌡️';
        case 'carpentry': return '🔨';
        default: return '👷';
      }
    };

    const getPriceColor = () => {
      switch (priceRange) {
        case '$': return '#2ed573';
        case '$$': return '#ffa502';
        case '$$$': return '#ff6b6b';
        default: return '#667eea';
      }
    };

    return L.divIcon({
      html: `
        <div style="position: relative;">
          <div style="
            background: ${getPriceColor()};
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            border: 3px solid white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
          ">
            ${getEmoji()}
          </div>
          <div style="
            position: absolute;
            bottom: -8px;
            left: 50%;
            transform: translateX(-50%);
            background: ${getPriceColor()};
            color: white;
            border-radius: 8px;
            padding: 1px 4px;
            font-size: 8px;
            font-weight: bold;
            white-space: nowrap;
          ">
            ${priceRange}
          </div>
        </div>
      `,
      className: 'custom-marker',
      iconSize: [50, 50],
      iconAnchor: [25, 25],
    });
  };

  return (
    <div className="map-container">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {jobs.map((job) => (
          <Marker
            key={job.id}
            position={[job.lat, job.lng]}
            icon={createCustomIcon(job.category, job.urgency, job.price, job.status)}
            eventHandlers={{
              click: () => setSelectedJob(job),
            }}
          >
            <Popup>
              <div className="job-popup">
                <div className="popup-header">
                  <h3>{job.category}</h3>
                  {getUrgencyBadge(job.urgency)}
                </div>
                
                <p className="job-description">{job.description}</p>
                
                <div className="job-details">
                  <div className="detail-row">
                    <span className="label">💰 Budget:</span>
                    <span className="value">{formatPrice(job.price)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">📍 Location:</span>
                    <span>{job.address}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">👤 Customer:</span>
                    <span>{job.customerName}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">📞 Phone:</span>
                    <span>{job.phone}</span>
                  </div>
                </div>
                
                <div className="popup-actions">
                  <button 
                    className="hold-btn"
                    onClick={() => handleHoldJob(job.id)}
                  >
                    🔒 Hold 10m
                  </button>
                  <button 
                    className="dispatch-btn"
                    onClick={() => handleDispatchJob(job)}
                  >
                    📞 Reach Out
                  </button>
                  <button className="details-btn">View Details</button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {contractors.map((contractor) => (
          <Marker
            key={contractor.id}
            position={[contractor.lat, contractor.lng]}
            icon={createContractorIcon(contractor.category, contractor.priceRange)}
            eventHandlers={{
              click: () => setSelectedContractor(contractor),
            }}
          >
            <Popup>
              <div className="contractor-popup">
                <div className="popup-header">
                  <h3>{contractor.name}</h3>
                  <span className="contractor-category">{contractor.category}</span>
                </div>
                
                <div className="contractor-details">
                  <div className="detail-row">
                    <span className="label">⭐ Rating:</span>
                    <span className="value">{contractor.rating}/5</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">🕐 ETA:</span>
                    <span>{contractor.eta}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">💰 Price Range:</span>
                    <span>{contractor.priceRange}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">📍 Distance:</span>
                    <span>{contractor.distance}</span>
                  </div>
                </div>
                
                <div className="popup-actions">
                  <button className="contact-btn">📞 Contact</button>
                  <button className="book-btn">📅 Book Now</button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Legend */}
      <button 
        className="legend-toggle"
        onClick={() => setShowLegend(!showLegend)}
        title="Show map legend"
      >
        ?
      </button>

      {showLegend && (
        <div className="map-legend">
          <div className="legend-header">
            <h3>Map Legend</h3>
            <button onClick={() => setShowLegend(false)}>✕</button>
          </div>
          
          <div className="legend-section">
            <h4>Urgency Levels</h4>
            <div className="legend-items">
              <div className="legend-item">
                <div className="legend-color" style={{background: '#ff4757'}}></div>
                <span>🔥 Emergency</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{background: '#ff6b6b'}}></div>
                <span>🟧 High Priority</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{background: '#ffa502'}}></div>
                <span>🟨 Medium Priority</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{background: '#2ed573'}}></div>
                <span>🟩 Low Priority</span>
              </div>
            </div>
          </div>

          <div className="legend-section">
            <h4>Budget Bands</h4>
            <div className="legend-items">
              <div className="legend-item">
                <div className="legend-badge" style={{background: '#2ed573'}}>$</div>
                <span>Under $200</span>
              </div>
              <div className="legend-item">
                <div className="legend-badge" style={{background: '#ffa502'}}>$$</div>
                <span>$200 - $500</span>
              </div>
              <div className="legend-item">
                <div className="legend-badge" style={{background: '#ff6b6b'}}>$$$</div>
                <span>Over $500</span>
              </div>
            </div>
          </div>

          <div className="legend-section">
            <h4>Job Categories</h4>
            <div className="legend-items">
              <div className="legend-item">
                <span>🔧 Plumbing</span>
              </div>
              <div className="legend-item">
                <span>⚡ Electrical</span>
              </div>
              <div className="legend-item">
                <span>🌡️ HVAC</span>
              </div>
              <div className="legend-item">
                <span>🔨 Carpentry</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {selectedJob && (
        <div className="job-sidebar">
          <div className="sidebar-header">
            <h2>Job Details</h2>
            <button 
              className="close-btn"
              onClick={() => setSelectedJob(null)}
            >
              ✕
            </button>
          </div>
          
          <div className="sidebar-content">
            <div className="job-header">
              <h3>{selectedJob.category}</h3>
              {getUrgencyBadge(selectedJob.urgency)}
            </div>
            
            <p className="job-description">{selectedJob.description}</p>
            
            <div className="job-info">
              <div className="info-item">
                <span className="label">📍 Address</span>
                <span>{selectedJob.address}</span>
              </div>
              <div className="info-item">
                <span className="label">💰 Price</span>
                <span className="price">{formatPrice(selectedJob.price)}</span>
              </div>
              <div className="info-item">
                <span className="label">👤 Customer</span>
                <span>{selectedJob.customerName}</span>
              </div>
              <div className="info-item">
                <span className="label">📞 Phone</span>
                <span>{selectedJob.phone}</span>
              </div>
              <div className="info-item">
                <span className="label">📅 Created</span>
                <span>{new Date(selectedJob.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="sidebar-actions">
              <button className="primary-btn">Assign Contractor</button>
              <button className="secondary-btn">Contact Customer</button>
              <button className="secondary-btn">Edit Job</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;
