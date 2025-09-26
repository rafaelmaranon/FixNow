import React, { useState, useEffect } from 'react';
import './AgentTicker.css';

interface AgentEvent {
  id: string;
  timestamp: string;
  agent: string;
  action: string;
  jobId?: string;
  message: string;
  details: any;
}

const AgentTicker: React.FC = () => {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Fetch events initially
    fetchEvents();
    
    // Poll for new events every 2 seconds
    const interval = setInterval(fetchEvents, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/events?limit=10');
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  };

  const getAgentIcon = (agent: string) => {
    switch (agent) {
      case 'Homeowner Agent': return '🏠';
      case 'Dispatcher Agent': return '📋';
      case 'Contractor Agent': return '👷';
      default: return '🤖';
    }
  };

  const getAgentColor = (agent: string) => {
    switch (agent) {
      case 'Homeowner Agent': return '#667eea';
      case 'Dispatcher Agent': return '#f093fb';
      case 'Contractor Agent': return '#4facfe';
      default: return '#a8edea';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  if (!isVisible) {
    return (
      <button 
        className="ticker-toggle collapsed"
        onClick={() => setIsVisible(true)}
        title="Show Agent Activity"
      >
        🤖 Agent Activity
      </button>
    );
  }

  return (
    <div className="agent-ticker">
      <div className="ticker-header">
        <div className="ticker-title">
          <span className="ticker-icon">🤖</span>
          <span>Multi-Agent Activity</span>
          <span className="event-count">({events.length})</span>
        </div>
        <button 
          className="ticker-minimize"
          onClick={() => setIsVisible(false)}
          title="Minimize"
        >
          ▼
        </button>
      </div>
      
      <div className="ticker-events">
        {events.length === 0 ? (
          <div className="no-events">
            <span>🔄 Waiting for agent activity...</span>
          </div>
        ) : (
          events.map((event, index) => (
            <div 
              key={event.id} 
              className={`ticker-event ${index === 0 ? 'latest' : ''}`}
              style={{ '--agent-color': getAgentColor(event.agent) } as React.CSSProperties}
            >
              <div className="event-agent">
                <span className="agent-icon">{getAgentIcon(event.agent)}</span>
                <span className="agent-name">{event.agent}</span>
              </div>
              
              <div className="event-content">
                <div className="event-message">{event.message}</div>
                {event.details && Object.keys(event.details).length > 0 && (
                  <div className="event-details">
                    {event.details.price && (
                      <span className="detail-item">💰 ${event.details.price}</span>
                    )}
                    {event.details.contractor && (
                      <span className="detail-item">👷 {event.details.contractor}</span>
                    )}
                    {event.details.eta && (
                      <span className="detail-item">⏱️ {event.details.eta}</span>
                    )}
                    {event.details.count && (
                      <span className="detail-item">📊 {event.details.count} offers</span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="event-time">{formatTime(event.timestamp)}</div>
            </div>
          ))
        )}
      </div>
      
      <div className="ticker-footer">
        <div className="agent-legend">
          <span className="legend-item">
            <span className="legend-icon">🏠</span>
            <span>Homeowner</span>
          </span>
          <span className="legend-item">
            <span className="legend-icon">📋</span>
            <span>Dispatcher</span>
          </span>
          <span className="legend-item">
            <span className="legend-icon">👷</span>
            <span>Contractor</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default AgentTicker;
