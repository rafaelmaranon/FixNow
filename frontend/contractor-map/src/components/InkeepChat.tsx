import React, { useState } from 'react';
import './InkeepChat.css';

interface ChatMessage {
  id: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
  agentName?: string;
}

const InkeepChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'agent',
      content: 'Hi! I\'m your AI Contractor Dispatcher. I can help you find the best contractors, optimize schedules, and manage job assignments. What can I help you with?',
      timestamp: new Date(),
      agentName: 'Dispatcher Agent'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const simulateAgentResponse = async (userMessage: string) => {
    setIsTyping(true);
    
    // Simulate API call to Inkeep agents
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    let response = '';
    let agentName = 'Dispatcher Agent';
    
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('schedule') || lowerMessage.includes('optimize') || lowerMessage.includes('route')) {
      agentName = 'Scheduler Agent';
      response = `I've analyzed the current job distribution and can optimize routes for maximum efficiency. Based on the 20+ jobs in SF, I recommend prioritizing emergency jobs first, then grouping nearby jobs by contractor location. Would you like me to create an optimized schedule?`;
    } else if (lowerMessage.includes('contractor') || lowerMessage.includes('assign') || lowerMessage.includes('available')) {
      agentName = 'Contractor Manager Agent';
      response = `I'm tracking 15+ contractors across SF with different specializations. For the current jobs, I have 3 plumbers, 4 electricians, 2 HVAC specialists, and 6 carpenters available. I can match contractors based on skills, location, and availability. Which job would you like me to assign?`;
    } else if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent') || lowerMessage.includes('priority')) {
      response = `I see 3 emergency jobs requiring immediate attention: a burst pipe on Bryant St, heating system down on Folsom St, and a toilet overflow on Lombard St. I've already contacted our nearest available contractors. The Bryant St job has 2 contractors en route with 15-minute ETA.`;
    } else if (lowerMessage.includes('revenue') || lowerMessage.includes('profit') || lowerMessage.includes('cost')) {
      response = `Current job portfolio shows $5,240 in pending work. Emergency jobs ($975 total) have 40% higher margins. I recommend prioritizing high-value jobs while maintaining response times. The HVAC installations ($380-420 range) offer the best profit margins.`;
    } else {
      response = `I understand you're asking about "${userMessage}". As your AI dispatcher, I can help with job assignments, contractor scheduling, route optimization, and performance analytics. I'm connected to our 3-agent system: Dispatcher (coordination), Scheduler (optimization), and Contractor Manager (resource allocation). What specific task would you like me to handle?`;
    }
    
    setIsTyping(false);
    
    const agentMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'agent',
      content: response,
      timestamp: new Date(),
      agentName
    };
    
    setMessages(prev => [...prev, agentMessage]);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    
    await simulateAgentResponse(inputValue);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button 
        className={`inkeep-chat-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Chat with AI Dispatcher"
      >
        {isOpen ? '✕' : '🤖'}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="inkeep-chat-window">
          <div className="chat-header">
            <div className="header-info">
              <h3>🤖 AI Contractor Dispatcher</h3>
              <span className="powered-by">Powered by Inkeep+RainDrop</span>
            </div>
            <div className="agent-status">
              <div className="agent-indicator active">
                <span className="dot"></span>
                3 Agents Online
              </div>
            </div>
          </div>
          
          <div className="chat-messages">
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.type}`}>
                {message.type === 'agent' && (
                  <div className="agent-info">
                    <div className="agent-avatar">🤖</div>
                    <span className="agent-name">{message.agentName}</span>
                  </div>
                )}
                <div className="message-content">
                  {message.content}
                </div>
                <div className="message-time">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="message agent typing">
                <div className="agent-info">
                  <div className="agent-avatar">🤖</div>
                  <span className="agent-name">AI Agent</span>
                </div>
                <div className="typing-indicator">
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="chat-input-area">
            <div className="quick-suggestions">
              <button onClick={() => setInputValue('Show me emergency jobs')}>
                🚨 Emergency Jobs
              </button>
              <button onClick={() => setInputValue('Optimize contractor routes')}>
                🗺️ Optimize Routes
              </button>
              <button onClick={() => setInputValue('Which contractors are available?')}>
                👷 Available Contractors
              </button>
            </div>
            
            <div className="chat-input">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about jobs, contractors, or scheduling..."
                rows={2}
              />
              <button 
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="send-button"
              >
                📤
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InkeepChat;
