import React, { useState, useEffect } from 'react';
import './BookingBanner.css';

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

interface BookingBannerProps {
  booking: Booking;
  onViewDetails: () => void;
  onContact: () => void;
}

function useCountdown(toIso: string) {
  const [ms, setMs] = useState(() => new Date(toIso).getTime() - Date.now());
  
  useEffect(() => {
    const id = setInterval(() => {
      setMs(new Date(toIso).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [toIso]);
  
  const mm = Math.max(0, Math.floor(ms / 60000));
  const ss = Math.max(0, Math.floor((ms % 60000) / 1000)).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

const BookingBanner: React.FC<BookingBannerProps> = ({ booking, onViewDetails, onContact }) => {
  const countdown = useCountdown(booking.arrivalByIso);
  
  const dt = new Date(booking.arrivalByIso);
  const isValid = !Number.isNaN(dt.getTime());
  const arrivalTime = isValid
    ? dt.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    : "";

  return (
    <div className="booking-banner">
      <div className="booking-header">
        <div className="booking-status">
          <span className="status-icon">✅</span>
          <span className="status-text">Booked</span>
        </div>
        <div className="booking-contractor">
          {booking.contractorName}
        </div>
      </div>
      
      <div className="booking-details">
        <div className="arrival-info">
          <div className="countdown">
            <span className="countdown-label">Arriving in</span>
            <span className="countdown-time">{countdown}</span>
          </div>
          <div className="arrival-time">
            (by {arrivalTime})
          </div>
        </div>
        
        <div className="booking-meta">
          <span className="price">Price ${booking.price}</span>
          <span className="eta">ETA {booking.etaMin} min</span>
        </div>
      </div>
      
      <div className="booking-actions">
        <button className="contact-btn" onClick={onContact}>
          📞 Contact
        </button>
        <button className="details-btn" onClick={onViewDetails}>
          📋 View Details
        </button>
      </div>
    </div>
  );
};

export default BookingBanner;
