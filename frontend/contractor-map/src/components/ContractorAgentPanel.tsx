import React, { useState, useEffect } from 'react';
import './ContractorAgentPanel.css';

interface ContractorEvent {
  id: string;
  timestamp: string;
  agent: string;
  action: string;
  message: string;
  details: any;
  audience?: string;
  contractorId?: string;
}

interface ContractorAgentPanelProps {
  contractorId: string;
}

const ContractorAgentPanel: React.FC<ContractorAgentPanelProps> = ({ contractorId }) => {
  const [feed, setFeed] = useState<ContractorEvent[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    const fetchContractorFeed = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/contractor/${contractorId}/feed?limit=10`);
        if (response.ok) {
          const data = await response.json();
          setFeed(data.events || []);
        }
      } catch (error) {
        console.error('Failed to fetch contractor feed:', error);
      }
    };

    fetchContractorFeed();
    const interval = setInterval(fetchContractorFeed, 3000);
    return () => clearInterval(interval);
  }, [contractorId]);

  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };
      
      recognition.onresult = (event: any) => {
        const result = event.results[0][0].transcript;
        setTranscript(result);
        setIsListening(false);
        
        // Handle contractor voice commands
        console.log('Contractor said:', result);
      };
      
      recognition.onerror = () => {
        setIsListening(false);
      };
      
      recognition.start();
    } else {
      // Fallback for browsers without speech recognition
      const mockInput = prompt("Speech recognition not available. Type your message:");
      if (mockInput) {
        setTranscript(mockInput);
        console.log('Contractor typed:', mockInput);
      }
    }
  };

  const getEventIcon = (action: string) => {
    if (action.includes('RFO') || action.includes('Request')) return '📋';
    if (action.includes('offer') || action.includes('generated')) return '💵';
    if (action.includes('award') || action.includes('selected')) return '🎉';
    if (action.includes('route') || action.includes('arriving')) return '🚚';
    return '🔔';
  };

  const getEventColor = (action: string) => {
    if (action.includes('RFO')) return '#3742fa';
    if (action.includes('offer')) return '#ffa502';
    if (action.includes('award')) return '#2ed573';
    if (action.includes('route')) return '#ff6b6b';
    return '#a4b0be';
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="contractor-agent-panel">
      <div className="panel-header">
        <h3>🛠 Contractor Agent</h3>
        <span className="status-badge">Ready to bid</span>
      </div>
      
      <div className="agent-feed">
        <div className="feed-header">
          <h4>Agent Feed</h4>
          <span className="feed-count">{feed.length} events</span>
        </div>
        
        {feed.length === 0 ? (
          <div className="empty-feed">
            <div className="empty-icon">🔍</div>
            <p>Waiting for new job opportunities...</p>
            <small>You'll see RFOs, awards, and updates here</small>
          </div>
        ) : (
          <div className="feed-list">
            {feed.map(event => (
              <div key={event.id} className="feed-item">
                <div 
                  className="event-icon"
                  style={{ backgroundColor: getEventColor(event.action) }}
                >
                  {getEventIcon(event.action)}
                </div>
                <div className="event-content">
                  <div className="event-header">
                    <strong className="event-type">
                      {event.action.replace(/_/g, ' ').toUpperCase()}
                    </strong>
                    <span className="event-time">
                      {formatTime(event.timestamp)}
                    </span>
                  </div>
                  <p className="event-message">{event.message}</p>
                  {event.details && event.details.price && (
                    <div className="event-details">
                      <span className="price">${event.details.price}</span>
                      {event.details.eta && (
                        <span className="eta">ETA: {event.details.eta}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="contractor-actions">
        <button 
          className={`voice-btn ${isListening ? 'listening' : ''}`}
          onClick={startListening}
          disabled={isListening}
        >
          {isListening ? '🎙️ Listening...' : '🎤 Voice Reply'}
        </button>
        
        <button className="photo-btn">
          📷 Photo Update
        </button>
      </div>

      {transcript && (
        <div className="transcript-display">
          <p><strong>You said:</strong> "{transcript}"</p>
        </div>
      )}
    </div>
  );
};

export default ContractorAgentPanel;
