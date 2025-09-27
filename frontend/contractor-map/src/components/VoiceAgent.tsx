import React, { useState, useRef } from 'react';
import './VoiceAgent.css';
import BookingBanner from './BookingBanner';
import BookingDetails from './BookingDetails';

interface VoiceAgentProps {
  userRole: 'homeowner' | 'contractor';
  onVoiceCommand: (command: string) => void;
  onPhotoUpload?: (file: File) => void;
  onJobPublished?: () => void;
}

const VoiceAgent: React.FC<VoiceAgentProps> = ({ userRole, onVoiceCommand, onPhotoUpload, onJobPublished }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [agentResponse, setAgentResponse] = useState('');
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [showPublishButton, setShowPublishButton] = useState(false);
  const [currentDraft, setCurrentDraft] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [quickQuestions, setQuickQuestions] = useState<string[]>([]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [showOffers, setShowOffers] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAgentName = () => {
    return userRole === 'homeowner' ? 'Homeowner Assistant' : 'Contractor Agent';
  };

  const getAgentPrompt = () => {
    if (userRole === 'homeowner') {
      return "Tell me about your repair issue. I'll help you find the right contractor and get a fair price.";
    } else {
      return "What type of jobs are you looking for? I can show you the best matches nearby.";
    }
  };

  const createDraft = async (userInput: string) => {
    const IS_DEMO = window.location.hostname.endsWith('github.io') || process.env.REACT_APP_DEMO === '1';
    
    console.log('📝 Creating draft, demo mode:', IS_DEMO);
    
    if (IS_DEMO) {
      // Mock draft for demo mode
      const mockDraft = {
        id: Date.now().toString(),
        userInput,
        category: userInput.toLowerCase().includes('leak') || userInput.toLowerCase().includes('sink') ? 'Plumbing' : 
                 userInput.toLowerCase().includes('electrical') ? 'Electrical' : 'General',
        createdAt: new Date().toISOString()
      };
      console.log('✅ Mock draft created:', mockDraft);
      setCurrentDraft(mockDraft);
      return mockDraft;
    }
    
    try {
      const response = await fetch('http://localhost:3001/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userInput,
          category: userInput.toLowerCase().includes('leak') ? 'Plumbing' : 
                   userInput.toLowerCase().includes('electrical') ? 'Electrical' : 'General'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setCurrentDraft(result.draft);
        return result.draft;
      }
    } catch (error) {
      console.error('Failed to create draft:', error);
    }
    return null;
  };

  const simulateAgentResponse = async (userInput: string) => {
    console.log('🎭 Agent responding to:', userInput);
    setIsAgentSpeaking(true);
    
    // Simulate thinking delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    let response = '';
    const lowerInput = userInput.toLowerCase();
    
    if (userRole === 'homeowner') {
      console.log('🏠 Homeowner mode, current draft:', currentDraft);
      
      // Create or update draft if this is the first input or a follow-up
      if (!currentDraft) {
        console.log('📝 Creating draft for:', userInput);
        await createDraft(userInput);
      }
      
      if (lowerInput.includes('leak') || lowerInput.includes('pipe') || lowerInput.includes('water') || lowerInput.includes('sink')) {
        response = "I see you have a plumbing issue. Let me analyze this for you.\n\nFor water leaks, typical costs in SF range from $150-$400. Can you upload a photo so I can give you a more specific diagnosis and price estimate?";
        setQuickQuestions(['Upload photo first', 'Skip photo, continue', 'What affects the price?']);
        setShowPublishButton(true); // Enable publish after problem description
        console.log('✅ Publish button enabled for plumbing');
      } else if (lowerInput.includes('electrical') || lowerInput.includes('outlet') || lowerInput.includes('power')) {
        response = "Electrical work requires a licensed professional. Based on similar jobs, expect $120-$300 for outlet repairs.\n\nCan you upload a photo of the outlet or describe what's not working?";
        setQuickQuestions(['Upload photo', 'No power at all', 'Outlet sparking', 'GFCI tripped']);
        setShowPublishButton(true); // Enable publish after problem description
        console.log('✅ Publish button enabled for electrical');
      } else if (lowerInput.includes('skip') || lowerInput.includes('continue')) {
        response = "Perfect! I have enough information to help you find contractors. Your plumbing issue should cost around $150-$400 in SF. Ready to publish your job and get offers?";
        setQuickQuestions(['Yes, publish job', 'Tell me more about pricing', 'What happens next?']);
        setShowPublishButton(true);
        console.log('✅ Publish button enabled for skip/continue');
      } else if (lowerInput.includes('price') || lowerInput.includes('cost') || lowerInput.includes('fair')) {
        if (analysis) {
          response = `Based on your ${analysis.suspected_issue}, here's what's typical in SF:\n\n${analysis.common_fixes.map((fix: any) => `• ${fix.name}: $${fix.est[0]}-${fix.est[1]} (${fix.time_min}min)`).join('\n')}\n\n${analysis.local_price_band}`;
        } else {
          response = "I need more details about your specific issue to give accurate pricing. Can you describe the problem or upload a photo?";
        }
        setQuickQuestions(['Sounds fair', 'Too expensive', 'What about DIY?']);
      } else if (lowerInput.includes('constant') || lowerInput.includes('only when') || lowerInput.includes('yes') || lowerInput.includes('no')) {
        // Handle follow-up answers
        if (analysis) {
          response = `Got it! Based on that detail, I'm more confident this is a ${analysis.suspected_issue}.\n\n${analysis.common_fixes[0].name} would likely cost $${analysis.common_fixes[0].est[0]}-${analysis.common_fixes[0].est[1]}.\n\nReady to find contractors?`;
          setShowPublishButton(true);
        } else {
          response = "Thanks for that detail! Based on what you've described, I can help you find the right contractor. Ready to publish your job?";
          setShowPublishButton(true);
        }
        console.log('✅ Publish button enabled for follow-up');
      } else {
        response = "I understand you need repair help. Can you describe the specific problem? For example: 'My kitchen sink is leaking' or 'The bathroom outlet stopped working'. This helps me find the right specialist and estimate fair pricing.";
        setQuickQuestions(['Kitchen sink leak', 'Bathroom outlet issue', 'Something else']);
      }
    } else {
      // Contractor responses (unchanged)
      if (lowerInput.includes('plumbing') || lowerInput.includes('pipe') || lowerInput.includes('leak')) {
        response = "Showing plumbing jobs in your area. I found 8 plumbing jobs nearby: 3 emergency leaks ($250-$350), 2 drain clogs ($120-$180), and 3 fixture installations ($200-$400). The emergency jobs have priority and higher pay rates.";
        onVoiceCommand('filter:plumbing');
      } else if (lowerInput.includes('emergency') || lowerInput.includes('urgent')) {
        response = "Filtering for emergency jobs only. I see 4 urgent jobs: burst pipe on Bryant St ($320), heating system down on Folsom St ($380), toilet overflow on Lombard St ($280), and electrical outage on Mission St ($250). All are within 2 miles of your location.";
        onVoiceCommand('filter:emergency');
      } else if (lowerInput.includes('nearby') || lowerInput.includes('close')) {
        response = "Showing jobs within 1 mile of your location. I found 12 jobs nearby with an average value of $240. The closest is a kitchen sink repair just 0.3 miles away, paying $220 with a 4.8-star customer rating.";
        onVoiceCommand('filter:nearby');
      } else {
        response = "I can help you find the best jobs. Try saying: 'Show me plumbing jobs nearby' or 'Find emergency work under $500' or 'What's the highest paying job today?'. I'll update your job list and map automatically.";
      }
    }
    
    console.log('🤖 Agent response:', response);
    console.log('🔘 Show publish button:', showPublishButton);
    setAgentResponse(response);
    setIsAgentSpeaking(false);
  };

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
        setAgentResponse('');
      };
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setTranscript(transcript);
        setIsListening(false);
        simulateAgentResponse(transcript);
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
        simulateAgentResponse(mockInput);
      }
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create a mock image URL (in real app, upload to server)
      const imageUrl = URL.createObjectURL(file);
      setUploadedImage(imageUrl);
      
      if (onPhotoUpload) {
        onPhotoUpload(file);
      }
      
      // Demo mode: simulate photo analysis without API calls
      const IS_DEMO = window.location.hostname.endsWith('github.io') || process.env.REACT_APP_DEMO === '1';
      
      setIsAgentSpeaking(true);
      setAgentResponse("Analyzing your photo...");
      
      // Simulate analysis delay
      setTimeout(() => {
        if (IS_DEMO) {
          // Mock analysis for demo mode
          const mockAnalysis = {
            suspected_issue: "loose pipe connection",
            confidence: 0.85,
            possible_causes: ["worn gasket", "loose fitting", "mineral buildup"],
            common_fixes: [
              { name: "Tighten connection", est: [120, 180], time_min: 30 },
              { name: "Replace gasket", est: [150, 220], time_min: 45 }
            ],
            local_price_band: "SF typical range: $150-$250",
            risk_notes: "Minor issue, no safety concerns",
            questions: ["Is it dripping constantly?", "When did it start?", "Any water damage?"]
          };
          
          setAnalysis(mockAnalysis);
          
          const analysisResponse = `Great! I can see this is likely a ${mockAnalysis.suspected_issue} (${Math.round(mockAnalysis.confidence * 100)}% confidence).

**What I see:** ${mockAnalysis.possible_causes.join(', ')}

**Common fixes:**
${mockAnalysis.common_fixes.map((fix: any) => `• ${fix.name}: $${fix.est[0]}-${fix.est[1]} (~${fix.time_min}min)`).join('\n')}

**${mockAnalysis.local_price_band}**

${mockAnalysis.risk_notes}`;
          
          setAgentResponse(analysisResponse);
          setQuickQuestions(mockAnalysis.questions.slice(0, 3));
          setShowPublishButton(true);
          setIsAgentSpeaking(false);
        } else {
          // Real API mode
          fetch('http://localhost:3001/api/analyze-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              draftId: currentDraft?.id,
              imageUrl: imageUrl,
              context: `${currentDraft?.category || 'General'} ${transcript} home repair plumbing leak under sink SF`
            })
          })
          .then(response => response.ok ? response.json() : Promise.reject())
          .then(result => {
            setAnalysis(result.analysis);
            const analysisResponse = `Great! I can see this is likely a ${result.analysis.suspected_issue} (${Math.round(result.analysis.confidence * 100)}% confidence).

**What I see:** ${result.analysis.possible_causes.join(', ')}

**Common fixes:**
${result.analysis.common_fixes.map((fix: any) => `• ${fix.name}: $${fix.est[0]}-${fix.est[1]} (~${fix.time_min}min)`).join('\n')}

**${result.analysis.local_price_band}**

${result.analysis.risk_notes}`;
            
            setAgentResponse(analysisResponse);
            setQuickQuestions(result.analysis.questions.slice(0, 3));
            setShowPublishButton(true);
          })
          .catch(error => {
            console.error('Image analysis failed:', error);
            setAgentResponse("I can see your photo! Based on what you described, this looks like a plumbing issue that typically costs $180-$350 in SF. Ready to find contractors?");
            setShowPublishButton(true);
          })
          .finally(() => {
            setIsAgentSpeaking(false);
          });
        }
      }, 2000); // 2 second delay for realistic analysis
    }
  };

  const handlePublish = async () => {
    if (!currentDraft) {
      setAgentResponse("Please start by describing your repair issue first.");
      return;
    }

    const IS_DEMO = window.location.hostname.endsWith('github.io') || process.env.REACT_APP_DEMO === '1';

    if (IS_DEMO) {
      // Demo mode: simulate job publishing
      setAgentResponse("✅ Job published! Watch the agent activity - Dispatcher is now sending requests to contractors...");
      setShowPublishButton(false);
      
      // Simulate multi-agent collaboration with mock offers
      setTimeout(() => {
        const mockOffers = [
          {
            id: 'offer-1',
            contractorName: 'Bay Area Plumbing Pro',
            rating: 4.8,
            price: 180,
            eta: '30-45 min',
            type: 'fast',
            message: 'I can fix this quickly! Have all parts in my truck.'
          },
          {
            id: 'offer-2', 
            contractorName: 'SF Budget Repairs',
            rating: 4.5,
            price: 150,
            eta: '2-3 hours',
            type: 'budget',
            message: 'Great price, quality work. Available this afternoon.'
          }
        ];
        
        setOffers(mockOffers);
        setShowOffers(true);
        setAgentResponse(`Great! I received ${mockOffers.length} offers from contractors. Here are your options:`);
      }, 3000);
      
      setCurrentDraft(null);
      setAnalysis(null);
      setQuickQuestions([]);
      
      // Notify parent component to refresh jobs
      if (onJobPublished) {
        onJobPublished();
      }
      return;
    }

    // Real API mode
    try {
      // Update draft with final details if we have analysis
      if (analysis) {
        await fetch(`http://localhost:3001/api/drafts/${currentDraft.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            budget_hint: analysis.common_fixes[0]?.est[1] || 250,
            urgency: analysis.risk_notes?.includes('Safety') ? 'emergency' : 'high'
          })
        });
      }

      // Publish the draft as a job
      const response = await fetch(`http://localhost:3001/api/drafts/${currentDraft.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const result = await response.json();
        setAgentResponse("✅ Job published! Watch the agent activity - Dispatcher is now sending requests to contractors...");
        setShowPublishButton(false);
        
        // Wait for offers to be generated (multi-agent collaboration)
        setTimeout(async () => {
          try {
            const offersResponse = await fetch(`http://localhost:3001/api/jobs/${result.job.id}/offers`);
            if (offersResponse.ok) {
              const offersData = await offersResponse.json();
              if (offersData.offers && offersData.offers.length > 0) {
                setOffers(offersData.offers);
                setShowOffers(true);
                setAgentResponse(`Great! I received ${offersData.offers.length} offers from contractors. Here are your options:`);
              }
            }
          } catch (error) {
            console.error('Failed to fetch offers:', error);
          }
        }, 3000); // Wait for agent collaboration to complete
        
        setCurrentDraft(null);
        setAnalysis(null);
        setQuickQuestions([]);
        
        // Notify parent component to refresh jobs
        if (onJobPublished) {
          onJobPublished();
        }
      } else {
        setAgentResponse("Sorry, there was an issue publishing your job. Please try again.");
      }
    } catch (error) {
      console.error('Failed to publish job:', error);
      setAgentResponse("Sorry, there was an issue publishing your job. Please try again.");
    }
  };

  const handleQuickAnswer = (answer: string) => {
    setTranscript(answer);
    simulateAgentResponse(answer);
  };

  const handleAcceptOffer = async (offer: any) => {
    const IS_DEMO = window.location.hostname.endsWith('github.io') || process.env.REACT_APP_DEMO === '1';
    
    console.log('🎯 Accepting offer:', offer.contractorName, 'Demo mode:', IS_DEMO);
    
    if (IS_DEMO) {
      try {
        // Demo mode: simulate booking confirmation
        const mockBooking = {
          id: Date.now().toString(),
          contractorName: offer.contractorName,
          phone: '(415) 555-0123',
          price: offer.price,
          eta: offer.eta,
          status: 'confirmed',
          arrivalTime: new Date(Date.now() + 30 * 60000).toISOString(), // 30 minutes from now
          jobAddress: '123 Marina Blvd, San Francisco, CA',
          createdAt: new Date().toISOString()
        };
        
        console.log('📋 Setting booking:', mockBooking);
        setBooking(mockBooking);
        
        console.log('💬 Setting response message');
        setAgentResponse(`🎉 Booking confirmed! ${offer.contractorName} is on the way. They'll arrive in ${offer.eta}. You can track their progress and contact them if needed.`);
        
        console.log('🚫 Hiding offers');
        setShowOffers(false);
        setOffers([]);
        
        // Refresh jobs to show updated status
        if (onJobPublished) {
          console.log('🔄 Calling onJobPublished');
          onJobPublished();
        }
        
        console.log('✅ Demo booking created successfully');
        return;
      } catch (error) {
        console.error('❌ Error in demo booking:', error);
        setAgentResponse("Sorry, there was an issue confirming your booking. Please try again.");
        return;
      }
    }

    // Real API mode
    try {
      const response = await fetch(`http://localhost:3001/api/offers/${offer.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.booking) {
          setBooking(result.booking);
          setAgentResponse(`🎉 Booking confirmed! ${offer.contractorName} is on the way. Check the booking banner above for arrival details and countdown.`);
        } else {
          setAgentResponse(`Perfect! I've selected ${offer.contractorName} for $${offer.price} (${offer.eta}). The Dispatcher is now awarding the job.`);
        }
        
        setShowOffers(false);
        setOffers([]);
        
        // Refresh jobs to show updated status
        if (onJobPublished) {
          onJobPublished();
        }
      }
    } catch (error) {
      console.error('Failed to accept offer:', error);
      setAgentResponse("Sorry, there was an issue accepting the offer. Please try again.");
    }
  };

  const handleContact = () => {
    if (booking?.phone) {
      window.open(`tel:${booking.phone}`);
    }
  };

  return (
    <div className="voice-agent">
      {/* Booking Banner - only show for homeowner with confirmed booking */}
      {userRole === 'homeowner' && booking && (
        <BookingBanner
          booking={booking}
          onViewDetails={() => setShowBookingDetails(true)}
          onContact={handleContact}
        />
      )}
      
      <div className="agent-header">
        <div className="agent-info">
          <div className="agent-avatar">
            {userRole === 'homeowner' ? '🏠' : '👷'}
          </div>
          <div>
            <h3>{getAgentName()}</h3>
            <p className="agent-status">
              {isListening ? 'Listening...' : isAgentSpeaking ? 'Thinking...' : 'Ready to help'}
            </p>
          </div>
        </div>
        <div className="inkeep-indicator">
          <span className="inkeep-dot"></span>
          Inkeep AI
        </div>
      </div>

      <div className="voice-interface">
        <button 
          className={`voice-button ${isListening ? 'listening' : ''}`}
          onClick={startListening}
          disabled={isAgentSpeaking}
        >
          {isListening ? '🎙️' : '🎤'}
        </button>
        
        <div className="voice-content">
          {!transcript && !agentResponse && (
            <p className="prompt">{getAgentPrompt()}</p>
          )}
          
          {transcript && (
            <div className="user-input">
              <strong>You said:</strong> "{transcript}"
            </div>
          )}
          
          {isAgentSpeaking && (
            <div className="agent-thinking">
              <div className="thinking-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span>Analyzing your request...</span>
            </div>
          )}
          
          {agentResponse && (
            <div className="agent-response">
              <strong>{getAgentName()}:</strong> 
              <div className="response-text">{agentResponse}</div>
              
              {uploadedImage && (
                <div className="uploaded-image">
                  <img src={uploadedImage} alt="Uploaded issue" />
                </div>
              )}
            </div>
          )}

          {quickQuestions.length > 0 && (
            <div className="quick-questions">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  className="quick-answer-chip"
                  onClick={() => handleQuickAnswer(question)}
                >
                  {question}
                </button>
              ))}
            </div>
          )}

          {showOffers && offers.length > 0 && (
            <div className="contractor-offers">
              <h4>🎯 Contractor Offers</h4>
              {offers.map((offer, index) => (
                <div key={offer.id} className="offer-card">
                  <div className="offer-header">
                    <div className="offer-contractor">
                      <span className="contractor-name">{offer.contractorName}</span>
                      <span className="contractor-rating">⭐ {offer.rating}</span>
                    </div>
                    <div className="offer-type">
                      {offer.type === 'fast' ? '⚡ Fast' : '💰 Budget'}
                    </div>
                  </div>
                  
                  <div className="offer-details">
                    <div className="offer-price">${offer.price}</div>
                    <div className="offer-eta">🕐 {offer.eta}</div>
                  </div>
                  
                  <div className="offer-message">{offer.message}</div>
                  
                  <button 
                    className="accept-offer-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('🖱️ Button clicked for:', offer.contractorName);
                      alert(`Clicked: ${offer.contractorName}`);
                      handleAcceptOffer(offer);
                    }}
                    type="button"
                    style={{
                      pointerEvents: 'auto',
                      zIndex: 1000,
                      position: 'relative'
                    }}
                  >
                    ✅ Select This Contractor
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {(transcript || agentResponse) && (
        <div className="action-buttons">
          <button 
            className="photo-button"
            onClick={() => fileInputRef.current?.click()}
          >
            📷 Add Photo
          </button>
          
          {userRole === 'homeowner' && showPublishButton && (
            <button 
              className="publish-button"
              onClick={handlePublish}
            >
              ✅ Publish Job
            </button>
          )}
          
          <button 
            className="clear-button"
            onClick={() => {
              setTranscript('');
              setAgentResponse('');
              setShowPublishButton(false);
            }}
          >
            🔄 Start Over
          </button>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />
      
      {/* Booking Details Drawer */}
      {booking && (
        <BookingDetails
          booking={booking}
          isOpen={showBookingDetails}
          onClose={() => setShowBookingDetails(false)}
        />
      )}
    </div>
  );
};

export default VoiceAgent;
