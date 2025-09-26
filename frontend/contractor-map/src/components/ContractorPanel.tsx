import React, { useState } from 'react';
import './ContractorPanel.css';

interface ContractorPanelProps {
  onFilterJobs: (category: string) => void;
  selectedCategory: string;
}

const ContractorPanel: React.FC<ContractorPanelProps> = ({ 
  onFilterJobs, 
  selectedCategory 
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<any>(null);

  const categories = [
    { id: 'all', name: 'All Jobs', emoji: '🏠', color: '#667eea' },
    { id: 'plumbing', name: 'Plumbing', emoji: '🔧', color: '#3742fa' },
    { id: 'electrical', name: 'Electrical', emoji: '⚡', color: '#ffa502' },
    { id: 'hvac', name: 'HVAC', emoji: '🌡️', color: '#ff6b6b' },
    { id: 'carpentry', name: 'Carpentry', emoji: '🔨', color: '#2ed573' },
  ];

  const parseVoiceCommand = (text: string) => {
    const lowerText = text.toLowerCase();
    
    // Parse categories
    if (lowerText.includes('plumbing')) return 'plumbing';
    if (lowerText.includes('electrical')) return 'electrical';
    if (lowerText.includes('hvac') || lowerText.includes('heating') || lowerText.includes('cooling')) return 'hvac';
    if (lowerText.includes('carpentry') || lowerText.includes('wood') || lowerText.includes('cabinet')) return 'carpentry';
    
    // Parse urgency
    if (lowerText.includes('emergency') || lowerText.includes('urgent')) return 'urgent';
    
    return 'all';
  };

  const handleMicClick = () => {
    if (!isListening) {
      // Start voice recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onstart = () => {
          setIsListening(true);
          setIsFilterOpen(true);
          setTranscript('');
          console.log('🎤 Voice recognition started...');
        };
        
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setTranscript(transcript);
          console.log('🎤 Heard:', transcript);
          
          // Parse the command and apply filter
          const category = parseVoiceCommand(transcript);
          onFilterJobs(category);
          
          setTimeout(() => {
            setIsFilterOpen(false);
            setIsListening(false);
          }, 2000);
        };
        
        recognition.onerror = (event: any) => {
          console.error('🎤 Speech recognition error:', event.error);
          setIsListening(false);
          setIsFilterOpen(false);
        };
        
        recognition.onend = () => {
          setIsListening(false);
        };
        
        recognition.start();
        setRecognition(recognition);
      } else {
        // Fallback: just open the filter panel
        console.log('🎤 Speech recognition not supported, opening filter panel');
        setIsFilterOpen(true);
      }
    } else {
      // Stop voice recognition
      if (recognition) {
        recognition.stop();
      }
      setIsListening(false);
      setIsFilterOpen(false);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    onFilterJobs(categoryId);
    setIsFilterOpen(false);
    setIsListening(false);
  };

  return (
    <>
      {/* Floating Mic Button */}
      <button 
        className={`mic-button ${isListening ? 'listening' : ''}`}
        onClick={handleMicClick}
        title="Voice filter jobs"
      >
        {isListening ? '🎙️' : '🎤'}
      </button>

      {/* Filter Panel */}
      {isFilterOpen && (
        <div className="filter-panel">
          <div className="filter-header">
            <h3>
              {isListening ? '🎤 Listening...' : '🔍 Filter Jobs'}
            </h3>
            <button 
              className="close-filter"
              onClick={() => {
                setIsFilterOpen(false);
                setIsListening(false);
              }}
            >
              ✕
            </button>
          </div>
          
          {isListening ? (
            <div className="voice-feedback">
              <div className="voice-animation">
                <div className="wave"></div>
                <div className="wave"></div>
                <div className="wave"></div>
              </div>
              {transcript ? (
                <div className="transcript">
                  <p><strong>You said:</strong> "{transcript}"</p>
                  <p className="processing">Processing command...</p>
                </div>
              ) : (
                <p>Say something like "Show me plumbing jobs" or "Filter by electrical"</p>
              )}
            </div>
          ) : (
            <div className="filter-options">
              <p className="filter-instruction">Select a job category to filter:</p>
              <div className="category-grid">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                    onClick={() => handleCategorySelect(category.id)}
                    style={{ 
                      borderColor: selectedCategory === category.id ? category.color : '#ddd',
                      backgroundColor: selectedCategory === category.id ? `${category.color}20` : 'white'
                    }}
                  >
                    <span className="category-emoji">{category.emoji}</span>
                    <span className="category-name">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="filter-footer">
            <div className="quick-actions">
              <button 
                className="quick-btn urgent"
                onClick={() => {
                  console.log('🚨 Filtering urgent jobs...');
                  setIsFilterOpen(false);
                }}
              >
                🚨 Urgent Only
              </button>
              <button 
                className="quick-btn nearby"
                onClick={() => {
                  console.log('📍 Filtering nearby jobs...');
                  setIsFilterOpen(false);
                }}
              >
                📍 Nearby
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay */}
      {isFilterOpen && (
        <div 
          className="filter-overlay"
          onClick={() => {
            setIsFilterOpen(false);
            setIsListening(false);
          }}
        />
      )}
    </>
  );
};

export default ContractorPanel;
