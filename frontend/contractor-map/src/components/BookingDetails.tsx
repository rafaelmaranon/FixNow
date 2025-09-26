import React from 'react';
import './BookingDetails.css';

interface Booking {
  id: string;
  jobId: string;
  contractorId: string;
  contractorName: string;
  price: number;
  etaMin: number;
  arrivalByIso: string;
  windowMin?: number;
  phone?: string;
  status: string;
}

interface BookingDetailsProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
}

const BookingDetails: React.FC<BookingDetailsProps> = ({ booking, isOpen, onClose }) => {
  if (!isOpen) return null;

  const arrivalTime = new Date(booking.arrivalByIso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const windowStart = new Date(booking.arrivalByIso);
  windowStart.setMinutes(windowStart.getMinutes() - (booking.windowMin || 15));
  const windowStartTime = windowStart.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const handleCall = () => {
    if (booking.phone) {
      window.open(`tel:${booking.phone}`);
    }
  };

  return (
    <div className="booking-details-overlay" onClick={onClose}>
      <div className="booking-details-drawer" onClick={e => e.stopPropagation()}>
        <div className="drawer-header">
          <h3>📋 Booking Details</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="drawer-content">
          <div className="detail-section">
            <h4>👷 Contractor</h4>
            <div className="contractor-info">
              <div className="contractor-name">{booking.contractorName}</div>
              <div className="contractor-meta">Professional repair service</div>
            </div>
          </div>
          
          <div className="detail-section">
            <h4>💰 Price</h4>
            <div className="price-info">
              <span className="price-amount">${booking.price}</span>
              <span className="price-note">Final price confirmed</span>
            </div>
          </div>
          
          <div className="detail-section">
            <h4>🕐 Arrival Window</h4>
            <div className="arrival-info">
              <div className="arrival-window">
                {windowStartTime} – {arrivalTime}
              </div>
              <div className="arrival-note">
                ETA ~{booking.etaMin} minutes
              </div>
            </div>
          </div>
          
          <div className="detail-section">
            <h4>📞 Contact</h4>
            <div className="contact-info">
              <div className="phone-number">{booking.phone}</div>
              <button className="call-btn" onClick={handleCall}>
                📞 Call Now
              </button>
            </div>
          </div>
          
          <div className="detail-section">
            <h4>📝 Notes</h4>
            <div className="booking-notes">
              "Bring P-trap replacement, Teflon tape. Will assess on arrival and confirm repair approach."
            </div>
          </div>
          
          <div className="detail-section">
            <h4>📍 Status</h4>
            <div className="status-info">
              <span className="status-badge confirmed">✅ Confirmed</span>
              <span className="status-text">Contractor has been notified and is en route</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;
