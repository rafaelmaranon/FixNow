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
  audience?: 'homeowner' | 'contractor' | 'both';
  contractorId?: string;
}

interface AgentTickerProps {
  userRole?: 'homeowner' | 'contractor';
  contractorId?: string;
}

const AgentTicker: React.FC<AgentTickerProps> = ({ userRole = 'homeowner', contractorId }) => {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Fetch events initially
    fetchEvents();
    
    // Poll for new events every 2 seconds
    const interval = setInterval(fetchEvents, 2000);
    
    return () => clearInterval(interval);
  }, [userRole, contractorId]);

  const fetchEvents = async () => {
    try {
      let url = 'http://localhost:3001/api/events?limit=10';
      
      // Use contractor-specific feed for contractors
      if (userRole === 'contractor' && contractorId) {
        url = `http://localhost:3001/api/contractor/${contractorId}/feed?limit=10`;
      } else if (userRole === 'homeowner') {
        url = 'http://localhost:3001/api/events?limit=10&audience=homeowner';
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
    }
  };

  const getAgentIcon = (agent: string) => {
    switch (agent) {
      case 'Homeowner Agent':
        return '🏠';
      case 'Dispatcher Agent':
        return '📋';
      case 'Contractor Agent':
        return '👷';
      default:
        return '🤖';
    }
  };

  const getAgentColor = (agent: string) => {
    switch (agent) {
      case 'Homeowner Agent':
        return '#4facfe'; // Blue
      case 'Dispatcher Agent':
        return '#764ba2'; // Purple
      case 'Contractor Agent':
        return '#ffa502'; // Orange
      default:
        return '#a4b0be'; // Gray
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
          events.map((agentEvent, index) => (
            <div key={agentEvent.id} className="event-item">
              <div 
                className="event-icon"
                style={{ backgroundColor: getAgentColor(agentEvent.agent) }}
              >
                {getAgentIcon(agentEvent.agent)}
              </div>
              <div className="event-content">
                <div className="event-header">
                  <span className="agent-name" style={{ color: getAgentColor(agentEvent.agent) }}>
                    {agentEvent.agent}
                  </span>
                  <span className="event-time">{formatTime(agentEvent.timestamp)}</span>
                </div>
                <div className="event-message">
                  {agentEvent.message}
                  {agentEvent.details && agentEvent.details.mode && (
                    <span className={`agent-mode-badge ${agentEvent.details.mode}`}>
                      {agentEvent.details.mode === 'raindrop' && '🌧️ Raindrop'}
                      {agentEvent.details.mode === 'inkeep' && '🤖 Inkeep'}
                      {agentEvent.details.mode === 'mock' && '🎭 Mock'}
                    </span>
                  )}
                </div>
                {agentEvent.details && agentEvent.details.price && (
                  <div className="event-price">
                    💰 ${agentEvent.details.price}
                    {agentEvent.details.eta && ` • ⏱️ ${agentEvent.details.eta}`}
                  </div>
                )}
                {agentEvent.action === 'dispatcher_mode' && (
                  <div className="agent-status-badge">
                    📡 Powered by {agentEvent.details.mode?.charAt(0).toUpperCase() + agentEvent.details.mode?.slice(1)} AI
                  </div>
                )}
                {agentEvent.action === 'dispatcher_fallback' && (
                  <div className="agent-fallback-badge">
                    ⚠️ Using fallback system
                  </div>
                )}
              </div>
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
