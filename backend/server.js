const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Runtime Strategy Configuration
const AGENT_MODE = process.env.AGENT_MODE || 'mock'; // 'raindrop' | 'inkeep' | 'mock'
const RAINDROP_API_URL = process.env.RAINDROP_API_URL || 'https://api.raindrop.ai';
const INKEEP_MANAGE_API_URL = process.env.INKEEP_MANAGE_API_URL || 'http://localhost:3002';
const INKEEP_RUN_API_URL = process.env.INKEEP_RUN_API_URL || 'http://localhost:3003';
const AGENT_TIMEOUT = parseInt(process.env.AGENT_TIMEOUT) || 5000; // 5 second timeout

console.log(`🤖 Agent Mode: ${AGENT_MODE.toUpperCase()}`);
console.log(`📡 Raindrop API: ${RAINDROP_API_URL}`);
console.log(`🔧 Inkeep APIs: ${INKEEP_MANAGE_API_URL} | ${INKEEP_RUN_API_URL}`);

// Middleware
app.use(cors());
app.use(express.json());

// Unified Agent I/O Schema
const createDispatcherInput = (job) => ({
  jobId: job.id,
  category: job.category,
  location: {
    address: job.address,
    lat: job.lat,
    lng: job.lng,
    neighborhood: job.address.split(',')[1]?.trim() || 'San Francisco'
  },
  budget: job.price,
  urgency: job.urgency,
  description: job.description,
  analysis: job.analysis || {},
  timestamp: new Date().toISOString()
});

const normalizeDispatcherOutput = (response, source) => ({
  offers: response.offers || [],
  events: response.events || [],
  source: source, // 'raindrop' | 'inkeep' | 'mock'
  success: true
});

// Agent API Helpers
const callAgentWithTimeout = async (apiCall, timeoutMs = AGENT_TIMEOUT) => {
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Agent timeout')), timeoutMs)
  );
  
  try {
    return await Promise.race([apiCall, timeoutPromise]);
  } catch (error) {
    console.error('Agent call failed:', error.message);
    return null;
  }
};

// Triage Agent Integration
const callTriageAgent = async (input) => {
  if (AGENT_MODE === 'raindrop') {
    return await callAgentWithTimeout(callRaindropTriage(input));
  } else if (AGENT_MODE === 'inkeep') {
    return await callAgentWithTimeout(callInkeepTriage(input));
  }
  return null;
};

const callRaindropTriage = async (input) => {
  const response = await fetch(`${RAINDROP_API_URL}/triage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      context: input.context,
      photoUrl: input.photoUrl,
      category: input.category
    })
  });
  
  if (!response.ok) throw new Error(`Raindrop API error: ${response.status}`);
  return await response.json();
};

const callInkeepTriage = async (input) => {
  console.log(`🔧 Calling Inkeep Triage API: ${INKEEP_RUN_API_URL}/api/chat`);
  
  const requestBody = {
    messages: [
      {
        role: 'system',
        content: 'You are a professional contractor triage agent. Analyze home repair issues and provide specific insights, clarifying questions, and diagnosis. Always respond with valid JSON only.'
      },
      {
        role: 'user',
        content: `Analyze this ${input.category} repair issue: "${input.context}"
        
        Respond with ONLY this JSON structure (no other text):
        {
          "photo_insights": ["insight 1", "insight 2", "insight 3"],
          "clarifying_questions": [
            {"question": "question text", "options": ["option1", "option2", "option3"]}
          ],
          "suspected_issue": "brief diagnosis",
          "confidence": 0.8
        }`
      }
    ]
  };
  
  console.log(`📤 Sending request:`, JSON.stringify(requestBody, null, 2));
  
  const response = await fetch(`${INKEEP_RUN_API_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });
  
  console.log(`📥 Inkeep response status: ${response.status}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Inkeep API error response:`, errorText);
    throw new Error(`Inkeep API ${response.status}: ${errorText}`);
  }
  
  const result = await response.json();
  console.log(`📊 Raw Inkeep response:`, JSON.stringify(result, null, 2));
  
  // Extract content from various possible response formats
  const content = result.content || result.message || result.choices?.[0]?.message?.content || '';
  console.log(`📝 Extracted content:`, content);
  
  // Try to parse JSON from the response content
  let parsedContent;
  try {
    // Clean the content - remove markdown code blocks if present
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    parsedContent = JSON.parse(cleanContent);
    console.log(`✅ Successfully parsed JSON:`, parsedContent);
  } catch (e) {
    console.log(`⚠️ Failed to parse JSON, creating structured response from text:`, e.message);
    // Create structured response from the AI text
    parsedContent = {
      photo_insights: [
        `🤖 AI Analysis: ${content.substring(0, 100)}...`,
        `📋 Category: ${input.category}`,
        `🔍 Context: ${input.context.substring(0, 50)}...`
      ],
      clarifying_questions: [
        { 
          question: 'What is the urgency level?', 
          options: ['Emergency', 'High Priority', 'Can Wait'] 
        }
      ],
      suspected_issue: `${input.category} issue requiring attention`,
      confidence: 0.7
    };
  }
  
  return {
    ...parsedContent,
    source: 'inkeep'
  };
};

// In-memory storage for jobs, drafts, offers, events, and bookings
let drafts = [];
let offers = [];
let events = [];
let bookings = [];
let contractorAvailability = []; // New: contractor availability records
let jobs = [
  {
    id: '1',
    category: 'Plumbing',
    address: '123 Market St, San Francisco, CA',
    lat: 37.7749,
    lng: -122.4194,
    price: 250,
    urgency: 'high',
    description: 'Kitchen sink leak needs immediate attention',
    customerName: 'John Smith',
    phone: '(415) 555-0101',
    createdAt: '2024-01-15T09:00:00Z',
    status: 'open'
  },
  {
    id: '2',
    category: 'Electrical',
    address: '456 Mission St, San Francisco, CA',
    lat: 37.7849,
    lng: -122.4094,
    price: 180,
    urgency: 'medium',
    description: 'Outlet not working in home office',
    customerName: 'Sarah Johnson',
    phone: '(415) 555-0102',
    createdAt: '2024-01-15T10:30:00Z',
    status: 'open'
  },
  {
    id: '3',
    category: 'HVAC',
    address: '789 Folsom St, San Francisco, CA',
    lat: 37.7749,
    lng: -122.3994,
    price: 350,
    urgency: 'emergency',
    description: 'Heating system completely down',
    customerName: 'Mike Davis',
    phone: '(415) 555-0103',
    createdAt: '2024-01-15T08:15:00Z',
    status: 'open'
  },
  {
    id: '4',
    category: 'Plumbing',
    address: '321 Castro St, San Francisco, CA',
    lat: 37.7609,
    lng: -122.4350,
    price: 120,
    urgency: 'low',
    description: 'Slow draining bathroom sink',
    customerName: 'Lisa Chen',
    phone: '(415) 555-0104',
    createdAt: '2024-01-15T11:45:00Z',
    status: 'open'
  },
  {
    id: '5',
    category: 'Electrical',
    address: '654 Valencia St, San Francisco, CA',
    lat: 37.7599,
    lng: -122.4210,
    price: 200,
    urgency: 'medium',
    description: 'Install new ceiling fan',
    customerName: 'Robert Wilson',
    phone: '(415) 555-0105',
    createdAt: '2024-01-15T13:20:00Z',
    status: 'open'
  },
  {
    id: '6',
    category: 'Carpentry',
    address: '987 Haight St, San Francisco, CA',
    lat: 37.7699,
    lng: -122.4460,
    price: 400,
    urgency: 'low',
    description: 'Build custom bookshelf',
    customerName: 'Emma Thompson',
    phone: '(415) 555-0106',
    createdAt: '2024-01-15T14:00:00Z',
    status: 'open'
  },
  {
    id: '7',
    category: 'Plumbing',
    address: '147 Lombard St, San Francisco, CA',
    lat: 37.8019,
    lng: -122.4194,
    price: 300,
    urgency: 'high',
    description: 'Toilet overflow emergency',
    customerName: 'David Brown',
    phone: '(415) 555-0107',
    createdAt: '2024-01-15T15:30:00Z',
    status: 'open'
  },
  {
    id: '8',
    category: 'HVAC',
    address: '258 Geary St, San Francisco, CA',
    lat: 37.7879,
    lng: -122.4094,
    price: 280,
    urgency: 'medium',
    description: 'Air conditioning maintenance',
    customerName: 'Jennifer Garcia',
    phone: '(415) 555-0108',
    createdAt: '2024-01-15T16:15:00Z',
    status: 'open'
  },
  {
    id: '9',
    category: 'Electrical',
    address: '369 Powell St, San Francisco, CA',
    lat: 37.7889,
    lng: -122.4084,
    price: 150,
    urgency: 'low',
    description: 'Replace light switches',
    customerName: 'Kevin Martinez',
    phone: '(415) 555-0109',
    createdAt: '2024-01-15T17:00:00Z',
    status: 'open'
  },
  {
    id: '10',
    category: 'Carpentry',
    address: '741 Union St, San Francisco, CA',
    lat: 37.7989,
    lng: -122.4194,
    price: 500,
    urgency: 'medium',
    description: 'Kitchen cabinet repair',
    customerName: 'Amanda Lee',
    phone: '(415) 555-0110',
    createdAt: '2024-01-15T18:30:00Z',
    status: 'open'
  },
  {
    id: '11',
    category: 'Plumbing',
    address: '852 Irving St, San Francisco, CA',
    lat: 37.7639,
    lng: -122.4664,
    price: 220,
    urgency: 'medium',
    description: 'Water heater inspection',
    customerName: 'Chris Taylor',
    phone: '(415) 555-0111',
    createdAt: '2024-01-15T19:15:00Z',
    status: 'open'
  },
  {
    id: '12',
    category: 'HVAC',
    address: '963 Fillmore St, San Francisco, CA',
    lat: 37.7749,
    lng: -122.4324,
    price: 320,
    urgency: 'high',
    description: 'Furnace making strange noises',
    customerName: 'Nicole Anderson',
    phone: '(415) 555-0112',
    createdAt: '2024-01-15T20:00:00Z',
    status: 'open'
  },
  {
    id: '13',
    category: 'Electrical',
    address: '159 Divisadero St, San Francisco, CA',
    lat: 37.7749,
    lng: -122.4394,
    price: 175,
    urgency: 'low',
    description: 'Install outdoor lighting',
    customerName: 'Ryan Thomas',
    phone: '(415) 555-0113',
    createdAt: '2024-01-15T21:30:00Z',
    status: 'open'
  },
  {
    id: '14',
    category: 'Carpentry',
    address: '753 Noe St, San Francisco, CA',
    lat: 37.7579,
    lng: -122.4324,
    price: 450,
    urgency: 'medium',
    description: 'Deck repair and staining',
    customerName: 'Michelle White',
    phone: '(415) 555-0114',
    createdAt: '2024-01-16T08:00:00Z',
    status: 'open'
  },
  {
    id: '15',
    category: 'Plumbing',
    address: '864 24th St, San Francisco, CA',
    lat: 37.7519,
    lng: -122.4324,
    price: 190,
    urgency: 'medium',
    description: 'Garbage disposal replacement',
    customerName: 'Steven Harris',
    phone: '(415) 555-0115',
    createdAt: '2024-01-16T09:30:00Z',
    status: 'open'
  },
  {
    id: '16',
    category: 'HVAC',
    address: '975 Church St, San Francisco, CA',
    lat: 37.7489,
    lng: -122.4274,
    price: 380,
    urgency: 'high',
    description: 'Central air installation',
    customerName: 'Rachel Clark',
    phone: '(415) 555-0116',
    createdAt: '2024-01-16T10:45:00Z',
    status: 'open'
  },
  {
    id: '17',
    category: 'Electrical',
    address: '186 Potrero Ave, San Francisco, CA',
    lat: 37.7659,
    lng: -122.4074,
    price: 160,
    urgency: 'low',
    description: 'Circuit breaker replacement',
    customerName: 'Daniel Rodriguez',
    phone: '(415) 555-0117',
    createdAt: '2024-01-16T12:00:00Z',
    status: 'open'
  },
  {
    id: '18',
    category: 'Carpentry',
    address: '297 Guerrero St, San Francisco, CA',
    lat: 37.7659,
    lng: -122.4244,
    price: 350,
    urgency: 'low',
    description: 'Custom closet installation',
    customerName: 'Laura Lewis',
    phone: '(415) 555-0118',
    createdAt: '2024-01-16T13:15:00Z',
    status: 'open'
  },
  {
    id: '19',
    category: 'Plumbing',
    address: '408 Bryant St, San Francisco, CA',
    lat: 37.7819,
    lng: -122.3944,
    price: 275,
    urgency: 'emergency',
    description: 'Burst pipe in basement',
    customerName: 'Mark Walker',
    phone: '(415) 555-0119',
    createdAt: '2024-01-16T14:30:00Z',
    status: 'open'
  },
  {
    id: '20',
    category: 'HVAC',
    address: '519 Brannan St, San Francisco, CA',
    lat: 37.7779,
    lng: -122.3974,
    price: 420,
    urgency: 'medium',
    description: 'Ductwork cleaning and repair',
    customerName: 'Jessica Hall',
    phone: '(415) 555-0120',
    createdAt: '2024-01-16T15:45:00Z',
    status: 'open'
  }
];

// Mock contractors data for map population
let contractors = [
  {
    id: 'contractor-1',
    name: 'Bay Area Plumbing Pro',
    category: 'Plumbing',
    address: '1234 Mission St, San Francisco, CA',
    lat: 37.7749,
    lng: -122.4194,
    rating: 4.8,
    phone: '(415) 555-1001',
    specialties: ['Emergency Repairs', 'Water Heaters', 'Pipe Installation'],
    priceRange: '$80-150/hr',
    availability: 'Available Now',
    distance: '0.5 miles',
    eta: '15-30 min',
    reviews: 127,
    verified: true
  },
  {
    id: 'contractor-2', 
    name: 'SF Electric Solutions',
    category: 'Electrical',
    address: '567 Valencia St, San Francisco, CA',
    lat: 37.7599,
    lng: -122.4210,
    rating: 4.6,
    phone: '(415) 555-1002',
    specialties: ['Panel Upgrades', 'Lighting', 'Smart Home'],
    priceRange: '$90-180/hr',
    availability: 'Available in 1hr',
    distance: '1.2 miles',
    eta: '45-60 min',
    reviews: 89,
    verified: true
  },
  {
    id: 'contractor-3',
    name: 'Golden Gate HVAC',
    category: 'HVAC',
    address: '890 Geary Blvd, San Francisco, CA',
    lat: 37.7879,
    lng: -122.4094,
    rating: 4.9,
    phone: '(415) 555-1003',
    specialties: ['AC Repair', 'Heating Systems', 'Ductwork'],
    priceRange: '$100-200/hr',
    availability: 'Available Now',
    distance: '0.8 miles',
    eta: '20-35 min',
    reviews: 156,
    verified: true
  },
  {
    id: 'contractor-4',
    name: 'Presidio Carpentry',
    category: 'Carpentry',
    address: '321 Fillmore St, San Francisco, CA',
    lat: 37.7749,
    lng: -122.4324,
    rating: 4.7,
    phone: '(415) 555-1004',
    specialties: ['Custom Cabinets', 'Deck Building', 'Repairs'],
    priceRange: '$70-140/hr',
    availability: 'Available Tomorrow',
    distance: '2.1 miles',
    eta: '60-90 min',
    reviews: 73,
    verified: true
  },
  {
    id: 'contractor-5',
    name: 'Castro Plumbing & Drain',
    category: 'Plumbing',
    address: '654 Castro St, San Francisco, CA',
    lat: 37.7609,
    lng: -122.4350,
    rating: 4.5,
    phone: '(415) 555-1005',
    specialties: ['Drain Cleaning', 'Leak Detection', 'Bathroom Remodel'],
    priceRange: '$85-160/hr',
    availability: 'Available in 2hrs',
    distance: '1.5 miles',
    eta: '30-45 min',
    reviews: 94,
    verified: true
  },
  {
    id: 'contractor-6',
    name: 'Richmond Electric Co',
    category: 'Electrical',
    address: '987 Clement St, San Francisco, CA',
    lat: 37.7819,
    lng: -122.4644,
    rating: 4.4,
    phone: '(415) 555-1006',
    specialties: ['Rewiring', 'Outlets & Switches', 'Code Updates'],
    priceRange: '$95-175/hr',
    availability: 'Available Now',
    distance: '3.2 miles',
    eta: '45-75 min',
    reviews: 61,
    verified: true
  },
  {
    id: 'contractor-7',
    name: 'Mission Bay Heating',
    category: 'HVAC',
    address: '147 Third St, San Francisco, CA',
    lat: 37.7749,
    lng: -122.3894,
    rating: 4.8,
    phone: '(415) 555-1007',
    specialties: ['Furnace Repair', 'Air Quality', 'Energy Efficiency'],
    priceRange: '$110-220/hr',
    availability: 'Available in 3hrs',
    distance: '2.8 miles',
    eta: '60-90 min',
    reviews: 112,
    verified: true
  },
  {
    id: 'contractor-8',
    name: 'Sunset Handyman Services',
    category: 'General',
    address: '258 Irving St, San Francisco, CA',
    lat: 37.7639,
    lng: -122.4664,
    rating: 4.3,
    phone: '(415) 555-1008',
    specialties: ['Home Repairs', 'Maintenance', 'Small Projects'],
    priceRange: '$60-120/hr',
    availability: 'Available Now',
    distance: '4.1 miles',
    eta: '75-105 min',
    reviews: 45,
    verified: true
  },
  {
    id: 'contractor-9',
    name: 'SOMA Emergency Plumbing',
    category: 'Plumbing',
    address: '369 Brannan St, San Francisco, CA',
    lat: 37.7779,
    lng: -122.3974,
    rating: 4.9,
    phone: '(415) 555-1009',
    specialties: ['24/7 Emergency', 'Pipe Bursts', 'Water Damage'],
    priceRange: '$120-250/hr',
    availability: 'Available 24/7',
    distance: '1.8 miles',
    eta: '15-25 min',
    reviews: 203,
    verified: true
  },
  {
    id: 'contractor-10',
    name: 'Pacific Heights Electric',
    category: 'Electrical',
    address: '741 Divisadero St, San Francisco, CA',
    lat: 37.7749,
    lng: -122.4394,
    rating: 4.6,
    phone: '(415) 555-1010',
    specialties: ['High-End Residential', 'Smart Systems', 'Luxury Installs'],
    priceRange: '$150-300/hr',
    availability: 'By Appointment',
    distance: '2.5 miles',
    eta: '90-120 min',
    reviews: 87,
    verified: true
  }
];

// Helper function to generate coordinates for new addresses within SF bounds
const generateCoordinates = (address) => {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    const char = address.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  // San Francisco bounds: roughly 37.70 to 37.81 lat, -122.35 to -122.51 lng
  const latRange = 0.11; // 37.81 - 37.70
  const lngRange = 0.16; // -122.35 - (-122.51)
  
  const lat = 37.70 + Math.abs(hash % 1000) / 1000 * latRange;
  const lng = -122.51 + Math.abs((hash >> 10) % 1000) / 1000 * lngRange;
  
  return { lat, lng };
};

// Agent collaboration helpers with natural conversation support
function addEvent(agent, action, jobId, details = {}, audience = 'both', conversationMessage = null) {
  const event = {
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    agent,
    action,
    jobId,
    details,
    audience, // 'homeowner' | 'contractor' | 'both'
    contractorId: details.contractorId || null,
    message: conversationMessage || `${agent} ${action}${jobId ? ` for Job #${jobId}` : ''}`,
    conversationStyle: !!conversationMessage // Flag for natural vs system message
  };
  
  events.unshift(event); // Add to beginning
  events = events.slice(0, 50); // Keep last 50 events
  
  console.log(`📢 Event: ${event.message} (audience: ${audience})`);
  return event;
}

// Real Dispatcher Agent Integration
const callDispatcherAgent = async (job) => {
  const input = createDispatcherInput(job);
  
  if (AGENT_MODE === 'raindrop') {
    return await callAgentWithTimeout(callRaindropDispatcher(input));
  } else if (AGENT_MODE === 'inkeep') {
    return await callAgentWithTimeout(callInkeepDispatcher(input));
  }
  return null;
};

const callRaindropDispatcher = async (input) => {
  const response = await fetch(`${RAINDROP_API_URL}/dispatch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      job: input,
      availability: contractorAvailability,
      mode: 'generate_offers'
    })
  });
  
  if (!response.ok) throw new Error(`Raindrop API error: ${response.status}`);
  return await response.json();
};

const callInkeepDispatcher = async (input) => {
  const response = await fetch(`${INKEEP_RUN_API_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        {
          role: 'system',
          content: 'You are a professional contractor dispatcher. Generate realistic contractor offers for home repair jobs. Respond in JSON format with an array of offers.'
        },
        {
          role: 'user',
          content: `Generate 2-3 contractor offers for this job:
          - Category: ${input.category}
          - Location: ${input.location.neighborhood}
          - Budget: $${input.budget}
          - Urgency: ${input.urgency}
          - Description: ${input.description}
          
          Available contractors: ${JSON.stringify(contractorAvailability)}
          
          Please provide JSON with:
          {
            "offers": [
              {
                "id": "unique-id",
                "jobId": "${input.jobId}",
                "contractorId": "contractor-id",
                "contractorName": "Company Name",
                "price": 250,
                "eta": "1 hour",
                "etaMinutes": 60,
                "rating": 4.8,
                "note": "Brief description",
                "type": "fast|budget"
              }
            ]
          }`
        }
      ]
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Inkeep API error: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  
  // Try to parse JSON from the response content
  let parsedContent;
  try {
    parsedContent = JSON.parse(result.content || result.message || '{}');
  } catch (e) {
    // If response isn't JSON - generate structured offers
    parsedContent = {
      offers: [
        {
          id: `inkeep-offer-${Date.now()}-1`,
          jobId: input.jobId,
          contractorId: 'inkeep-contractor-1',
          contractorName: `AI ${input.category} Pro`,
          price: Math.round(input.budget * 1.1),
          eta: '1 hour',
          etaMinutes: 60,
          rating: 4.7,
          note: 'AI-generated offer',
          type: 'fast'
        }
      ]
    };
  }
  
  return normalizeDispatcherOutput(parsedContent, 'inkeep');
};

// Real agent integration - authentic demo
async function generateContractorOffersWithAgent(job) {
  console.log(`🤖 Attempting real agent dispatch via ${AGENT_MODE.toUpperCase()}...`);
  
  if (AGENT_MODE === 'mock') {
    console.log('📝 Mock mode - using scripted offers');
    return generateContractorOffers(job);
  }
  
  try {
    const agentResponse = await callDispatcherAgent(job);
    
    if (agentResponse && agentResponse.offers && agentResponse.offers.length > 0) {
      console.log(`✅ SUCCESS: Real dispatcher offers via ${AGENT_MODE.toUpperCase()}`);
      console.log(`📊 Generated ${agentResponse.offers.length} offers from AI agents`);
      
      // Add success badge to events
      addEvent('System', 'dispatcher_mode', job.id, { mode: AGENT_MODE }, 'both', 
        `📡 Dispatched via ${AGENT_MODE.charAt(0).toUpperCase() + AGENT_MODE.slice(1)} AI`);
      
      // Store offers
      offers.push(...agentResponse.offers);
      return agentResponse.offers;
    } else {
      console.log(`⚠️ Agent returned empty response, using demo offers for seamless flow`);
      
      // For demo: always show offers to ensure confirmation flow works
      addEvent('System', 'dispatcher_demo', job.id, { mode: AGENT_MODE }, 'both', 
        `🎭 Demo mode: Generating contractor offers for ${job.category}`);
      
      // Return demo offers to ensure confirmation flow
      return generateContractorOffers(job);
    }
  } catch (error) {
    console.error(`❌ AGENT INTEGRATION ERROR:`, error.message);
    console.error(`🔧 Check Inkeep API on port 3003, falling back to demo offers`);
    
    // For demo: show error but still provide offers
    addEvent('System', 'dispatcher_demo', job.id, { 
      mode: AGENT_MODE, 
      error: error.message 
    }, 'both', `🎭 Demo: ${AGENT_MODE.toUpperCase()} integration attempted, showing demo offers`);
    
    // Return demo offers to ensure confirmation flow works
    return generateContractorOffers(job);
  }
}

function generateContractorOffers(job) {
  const basePrice = job.price || 250;
  const category = job.category || 'Plumbing';
  
  // Generate 2 contrasting offers
  const jobOffers = [
    {
      id: `offer-${Date.now()}-1`,
      jobId: job.id,
      contractorId: 'contractor-fast',
      contractorName: `Quick ${category} Pro`,
      price: Math.round(basePrice * 1.2), // 20% higher
      eta: '1 hour',
      message: 'Can be there in 1 hour, premium service',
      rating: 4.8,
      type: 'fast',
      createdAt: new Date().toISOString()
    },
    {
      id: `offer-${Date.now()}-2`,
      jobId: job.id,
      contractorId: 'contractor-budget',
      contractorName: `Budget ${category} Solutions`,
      price: Math.round(basePrice * 0.9), // 10% lower
      eta: '2-3 hours',
      message: 'Best value option, quality work',
      rating: 4.6,
      type: 'budget',
      createdAt: new Date().toISOString()
    }
  ];
  
  // Add offers to global offers array
  offers.push(...jobOffers);
  
  return jobOffers;
}

// Get all jobs
app.get('/api/jobs', (req, res) => {
  console.log('📍 GET /api/jobs - Fetching all jobs');
  res.json({
    success: true,
    data: jobs,
    count: jobs.length
  });
});

// Get all contractors
app.get('/api/contractors', (req, res) => {
  console.log('👷 GET /api/contractors - Fetching all contractors');
  res.json({
    success: true,
    data: contractors,
    count: contractors.length
  });
});

app.post('/api/jobs', (req, res) => {
  console.log('📝 POST /api/jobs - Creating new job:', req.body);
  
  const { category, address, description, customerName, phone, urgency, price } = req.body;
  
  // Validation
  if (!address || !description || !customerName || !phone) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: address, description, customerName, phone'
    });
  }
  
  const coordinates = generateCoordinates(address);
  const jobId = (jobs.length + 1).toString();
  
  const newJob = {
    id: jobId,
    category: category || 'General',
    address,
    lat: coordinates.lat,
    lng: coordinates.lng,
    price: price || 0,
    urgency: urgency || 'medium',
    description,
    customerName,
    phone,
    createdAt: new Date().toISOString(),
    status: 'open'
  };
  
  jobs.push(newJob);
  
  // Multi-Agent Collaboration Flow
  // 1. Homeowner Agent publishes job
  addEvent('Homeowner Agent', 'published job', jobId, { category, price: newJob.price }, 'homeowner');
  
  // 2. Dispatcher Agent receives and broadcasts
  setTimeout(() => {
    addEvent('Dispatcher Agent', 'sent RFO (Request for Offers)', jobId, { contractors: 2 }, 'both');
    
    // 3. Contractor Agents respond with offers (using real agent integration)
    generateContractorOffersWithAgent(newJob).then(jobOffers => {
      addEvent('Contractor Agent', 'generated offers', jobId, { 
        count: jobOffers.length,
        contractorId: 'contractor-fast'
      }, 'contractor');
      
      // Store offers for later acceptance
      offers.push(...jobOffers);
      
      // 4. Dispatcher Agent collects offers
      setTimeout(() => {
        addEvent('Dispatcher Agent', 'collected offers', jobId, { 
          offers: jobOffers.map(o => ({ contractor: o.contractorName, price: o.price, eta: o.eta }))
        }, 'both');
      }, 1000);
    });
  }, 500);
  
  // Fix any existing jobs with bad coordinates
  jobs.forEach(job => {
    if (job.lat < 37.70 || job.lat > 37.81 || job.lng < -122.51 || job.lng > -122.35) {
      const fixedCoords = generateCoordinates(job.address);
      job.lat = fixedCoords.lat;
      job.lng = fixedCoords.lng;
      console.log(`🔧 Fixed coordinates for job ${job.id}: ${job.address}`);
    }
  });
  
  console.log('✅ New job created:', newJob);
  
  res.status(201).json({
    success: true,
    data: newJob,
    message: 'Job created successfully'
  });
});

// Hold job for specified minutes
app.post('/api/hold', (req, res) => {
  const { jobId, minutes } = req.body;
  
  if (!jobId || !minutes) {
    return res.status(400).json({
      success: false,
      error: 'Missing jobId or minutes'
    });
  }
  
  const job = jobs.find(j => j.id === jobId);
  if (!job) {
    return res.status(404).json({
      success: false,
      error: 'Job not found'
    });
  }
  
  const holdUntil = new Date(Date.now() + minutes * 60 * 1000).toISOString();
  job.holdUntil = holdUntil;
  job.status = 'held';
  
  console.log(`🔒 Job ${jobId} held for ${minutes} minutes until ${holdUntil}`);
  
  res.json({
    success: true,
    holdUntil,
    message: `Job held for ${minutes} minutes`
  });
});

// Dispatch simulation - reach out to contractors
app.post('/api/dispatch', (req, res) => {
  const { strategy = 'topNearby', limit = 5, filters = {} } = req.body;
  
  console.log(`📞 Dispatching ${strategy} strategy to ${limit} contractors with filters:`, filters);
  
  // Mock contractor responses
  const mockResponses = [
    { type: 'accept', etaMinutes: 30, price: 250, message: 'Can be there in 30 min.' },
    { type: 'counter', etaMinutes: 45, price: 300, message: 'Parts likely needed, higher estimate.' },
    { type: 'accept', etaMinutes: 25, price: 220, message: 'Available now, close by!' },
    { type: 'decline', message: 'Too far right now, sorry.' },
    { type: 'counter', etaMinutes: 60, price: 280, message: 'Can do it this afternoon.' }
  ];
  
  const contacted = Math.min(limit, 5);
  const replies = mockResponses.slice(0, contacted).map((response, index) => ({
    contractorId: `contractor-${index + 1}`,
    contractorName: [`Mike Johnson`, `Sarah Chen`, `David Rodriguez`, `Lisa Thompson`, `Alex Kim`][index],
    ...response
  }));
  
  // Simulate some delay
  setTimeout(() => {
    res.json({
      success: true,
      contacted,
      replies,
      summary: {
        accepted: replies.filter(r => r.type === 'accept').length,
        countered: replies.filter(r => r.type === 'counter').length,
        declined: replies.filter(r => r.type === 'decline').length
      }
    });
  }, 1000);
});

// Draft job endpoints
app.post('/api/drafts', (req, res) => {
  const { userInput, category } = req.body;
  
  const draftId = `draft-${Date.now()}`;
  const draft = {
    id: draftId,
    role: 'homeowner',
    status: 'draft',
    category: category || 'unknown',
    subcategory: null,
    urgency: 'medium',
    budget_hint: null,
    location: [37.7749, -122.4194], // Default SF location
    description: userInput || '',
    attachments: [],
    analysis: null,
    createdAt: new Date().toISOString()
  };
  
  drafts.push(draft);
  console.log(`📝 Created draft ${draftId}: ${userInput}`);
  
  res.json({ success: true, draft });
});

app.get('/api/drafts/:id', (req, res) => {
  const draft = drafts.find(d => d.id === req.params.id);
  if (!draft) {
    return res.status(404).json({ error: 'Draft not found' });
  }
  res.json(draft);
});

app.patch('/api/drafts/:id', (req, res) => {
  const draftIndex = drafts.findIndex(d => d.id === req.params.id);
  if (draftIndex === -1) {
    return res.status(404).json({ error: 'Draft not found' });
  }
  
  drafts[draftIndex] = { ...drafts[draftIndex], ...req.body };
  console.log(`📝 Updated draft ${req.params.id}`);
  
  res.json({ success: true, draft: drafts[draftIndex] });
});

// Image analysis endpoint
app.post('/api/analyze-image', async (req, res) => {
  const { draftId, imageUrl, context } = req.body;
  
  console.log(`🔍 Analyzing image for draft ${draftId}: ${context}`);
  
  // Real Triage Agent Integration
  let analysis = {};
  
  // Try real agent first - authentic demo
  if (AGENT_MODE !== 'mock') {
    try {
      const triageInput = {
        context: context,
        photoUrl: imageUrl || 'no-image-provided',
        category: context.toLowerCase().includes('plumbing') ? 'plumbing' : 
                 context.toLowerCase().includes('electrical') ? 'electrical' : 'general'
      };
      
      console.log(`🤖 Attempting real triage analysis via ${AGENT_MODE.toUpperCase()}...`);
      const agentResponse = await callTriageAgent(triageInput);
      
      if (agentResponse && agentResponse.photo_insights) {
        analysis = agentResponse;
        console.log(`✅ SUCCESS: Real triage analysis via ${AGENT_MODE.toUpperCase()}`);
        console.log(`📊 Generated ${agentResponse.photo_insights.length} insights from AI`);
      } else {
        console.log(`⚠️ Agent returned empty response:`, agentResponse);
        analysis = {
          photo_insights: [`⏳ Analyzing with ${AGENT_MODE.toUpperCase()} AI...`],
          clarifying_questions: [
            { question: 'Waiting for AI analysis...', options: ['Please wait'] }
          ],
          suspected_issue: 'Analysis in progress',
          confidence: 0.0,
          source: AGENT_MODE
        };
      }
    } catch (error) {
      console.error(`❌ TRIAGE AGENT ERROR:`, error.message);
      analysis = {
        photo_insights: [`❌ ${AGENT_MODE.toUpperCase()} API Error: ${error.message}`],
        clarifying_questions: [
          { question: 'AI service unavailable', options: ['Check API connection'] }
        ],
        suspected_issue: 'API Error',
        confidence: 0.0,
        source: 'error'
      };
    }
  }
  
  // Only use mock analysis if explicitly in mock mode
  if (AGENT_MODE === 'mock' && !analysis.photo_insights) {
    if (context.toLowerCase().includes('leak') || context.toLowerCase().includes('plumbing')) {
      analysis = {
        suspected_issue: 'P-trap leak',
        confidence: 0.78,
        photo_insights: [
          '💧 Likely P-trap compression leak',
          '🚰 No visible shutoff valve', 
          '💧 Pooling on cabinet floor',
          '⚠️ Potential cabinet damage risk'
        ],
        possible_causes: ['loose compression nut', 'cracked P-trap', 'worn gasket'],
        clarifying_questions: [
          {
            question: 'Is the drip constant or only when the sink runs?',
            options: ['Constant dripping', 'Only when water runs', 'Intermittent']
          },
          {
            question: 'Can you see moisture around the U-shaped pipe?',
            options: ['Yes, around the compression nut', 'Yes, at pipe joints', 'No visible moisture']
          },
          {
            question: 'Any water pooling on the cabinet floor?',
            options: ['Yes, significant pooling', 'Small puddle', 'Just dampness', 'No pooling']
          }
        ],
        common_fixes: [
          {
            name: 'Tighten compression nut with teflon tape',
            time_min: 20,
            parts: 'teflon tape ($2-5)',
            est: [120, 180]
          },
          {
            name: 'Replace P-trap (PVC)',
            time_min: 40,
            parts: 'P-trap assembly ($12-25)',
            est: [200, 320]
          }
        ],
        risk_notes: 'If ignored: cabinet damage, mold growth, higher repair costs',
        local_price_band: 'Typical SF: $180–$350',
        source: 'mock'
      };
    } else if (context.toLowerCase().includes('electrical')) {
      analysis = {
        suspected_issue: 'Outlet not working',
        confidence: 0.65,
        possible_causes: ['tripped GFCI', 'loose wiring', 'faulty outlet'],
        common_fixes: [
          {
            name: 'Reset GFCI outlet',
            time_min: 5,
            parts: 'none',
            est: [80, 120]
          },
          {
            name: 'Replace outlet',
            time_min: 30,
            parts: 'GFCI outlet ($15-35)',
            est: [150, 250]
          }
        ],
        risk_notes: 'Safety concern: electrical hazard if DIY attempted',
        local_price_band: 'Typical SF: $120–$280',
        questions: [
          'Did you try pressing the reset button?',
          'Are other outlets in the room working?',
          'When did it stop working?'
        ]
      };
    }
  }
  
  // Update the draft with analysis
  const draftIndex = drafts.findIndex(d => d.id === draftId);
  if (draftIndex !== -1) {
    drafts[draftIndex].analysis = analysis;
    drafts[draftIndex].category = analysis.suspected_issue.includes('leak') ? 'Plumbing' : 
                                  analysis.suspected_issue.includes('outlet') ? 'Electrical' : 'General';
    drafts[draftIndex].urgency = analysis.risk_notes.includes('Safety') ? 'emergency' : 'high';
  }
  
  res.json({
    success: true,
    analysis,
    suggested_updates: {
      category: analysis.suspected_issue.includes('leak') ? 'Plumbing' : 'Electrical',
      urgency: analysis.risk_notes.includes('Safety') ? 'emergency' : 'high',
      description_append: ` Visible ${analysis.suspected_issue.toLowerCase()}; recommend immediate attention.`
    }
  });
});

// Get events (for agent activity ticker)
app.get('/api/events', (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const audience = req.query.audience || 'both';
  
  let filteredEvents = events;
  if (audience !== 'both') {
    filteredEvents = events.filter(event => 
      event.audience === audience || event.audience === 'both'
    );
  }
  
  res.json({
    success: true,
    events: filteredEvents.slice(0, limit),
    count: filteredEvents.length
  });
});

// Get contractor-specific agent feed
app.get('/api/contractor/:contractorId/feed', (req, res) => {
  const { contractorId } = req.params;
  const limit = parseInt(req.query.limit) || 20;
  
  const contractorEvents = events.filter(event => 
    (event.audience === 'contractor' || event.audience === 'both') &&
    (event.contractorId === contractorId || !event.contractorId)
  );
  
  res.json({
    success: true,
    events: contractorEvents.slice(0, limit),
    count: contractorEvents.length
  });
});

// Contractor Availability System
app.post('/api/contractor/:contractorId/availability', (req, res) => {
  const { contractorId } = req.params;
  const { location, skills, budgetMax, durationHours, notes } = req.body;
  
  // Remove existing availability for this contractor
  contractorAvailability = contractorAvailability.filter(a => a.contractorId !== contractorId);
  
  // Add new availability
  const availability = {
    contractorId,
    location: {
      address: location.address,
      lat: location.lat,
      lng: location.lng,
      neighborhood: location.neighborhood || location.address.split(',')[1]?.trim()
    },
    skills: skills || ['plumbing'],
    budgetMax: budgetMax || 500,
    radiusMeters: 5000, // 5km radius
    untilIso: new Date(Date.now() + (durationHours || 4) * 60 * 60 * 1000).toISOString(),
    notes: notes || '',
    createdAt: new Date().toISOString()
  };
  
  contractorAvailability.push(availability);
  
  // Add event to activity feed
  addEvent('Contractor Agent', 'availability_updated', null, {
    contractorId,
    location: availability.location.neighborhood,
    duration: `${durationHours}h`,
    skills: skills.join(', '),
    budget: `<$${budgetMax}`
  }, 'both', `📍 Contractor availability updated: ${availability.location.neighborhood} · ${durationHours}h · ${skills.join(', ')} · <$${budgetMax}`);
  
  console.log(`📍 Contractor ${contractorId} availability set: ${availability.location.neighborhood}`);
  
  res.json({
    success: true,
    availability,
    message: 'Availability updated successfully'
  });
});

app.delete('/api/contractor/:contractorId/availability', (req, res) => {
  const { contractorId } = req.params;
  
  contractorAvailability = contractorAvailability.filter(a => a.contractorId !== contractorId);
  
  addEvent('Contractor Agent', 'availability_cleared', null, {
    contractorId
  }, 'both', `📍 Contractor availability cleared`);
  
  res.json({
    success: true,
    message: 'Availability cleared'
  });
});

app.get('/api/contractor/:contractorId/availability', (req, res) => {
  const { contractorId } = req.params;
  const availability = contractorAvailability.find(a => a.contractorId === contractorId);
  
  res.json({
    success: true,
    availability: availability || null
  });
});

// Get offers for a job
app.get('/api/jobs/:id/offers', (req, res) => {
  const jobId = req.params.id;
  const jobOffers = offers.filter(offer => offer.jobId === jobId);
  
  res.json({
    success: true,
    offers: jobOffers,
    count: jobOffers.length
  });
});

// Accept an offer (Homeowner Agent action)
app.post('/api/offers/:id/accept', (req, res) => {
  const offerId = req.params.id;
  const offer = offers.find(o => o.id === offerId);
  
  if (!offer) {
    return res.status(404).json({
      success: false,
      error: 'Offer not found'
    });
  }
  
  // Extract ETA minutes from eta string (e.g., "1 hour" -> 60, "2-3 hours" -> 150)
  const etaMin = offer.eta.includes('hour') ? 
    (offer.eta.includes('2-3') ? 150 : 60) : 
    parseInt(offer.eta) || 60;
  
  // Create booking
  const arrival = new Date(Date.now() + etaMin * 60000);
  const booking = {
    id: `booking-${Date.now()}`,
    jobId: offer.jobId,
    contractorId: offer.contractorId,
    contractorName: offer.contractorName,
    price: offer.price,
    etaMin: etaMin,
    arrivalByIso: arrival.toISOString(),
    windowMin: etaMin > 60 ? 30 : 15, // Longer jobs get wider windows
    phone: '(415) 555-0113',
    status: 'confirmed',
    createdAt: new Date().toISOString()
  };
  
  bookings.push(booking);
  
  // Update job status
  const job = jobs.find(j => j.id === offer.jobId);
  if (job) {
    job.status = 'assigned';
    job.assignedContractor = offer.contractorName;
    job.finalPrice = offer.price;
    job.assignedAt = new Date().toISOString();
    job.bookingId = booking.id;
  }
  
  // Add events for the acceptance flow - Natural Conversation
  addEvent('Homeowner Agent', 'selected offer', offer.jobId, { 
    contractor: offer.contractorName, 
    price: offer.price, 
    eta: offer.eta 
  }, 'homeowner', `💬 "Perfect! Let's go with ${offer.contractorName} for $${offer.price}."`);
  
  setTimeout(() => {
    const arrivalTime = arrival.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    
    addEvent('Dispatcher Agent', 'awarded job', offer.jobId, { 
      contractor: offer.contractorName,
      eta: `~${etaMin} min`,
      arrivalBy: arrivalTime,
      contractorId: offer.contractorId
    }, 'both', `💬 "Done! Awarded to ${offer.contractorName}. ETA ${etaMin} minutes. 🕑"`);
    
    // Contractor confirmation - 5 second delay
    setTimeout(() => {
      addEvent('Contractor Agent', 'confirmed booking', offer.jobId, {
        contractorName: offer.contractorName,
        contractorId: offer.contractorId,
        arrivalBy: arrivalTime
      }, 'both', `💬 "${offer.contractorName}: Confirmed! I'll head out now. 👍"`);
    }, 5000); // 5 second delay
  }, 1200);
  
  res.json({
    success: true,
    message: 'Offer accepted and booking confirmed',
    job: job,
    offer: offer,
    booking: booking
  });
});

// Get booking details
app.get('/api/bookings/:id', (req, res) => {
  const booking = bookings.find(b => b.id === req.params.id);
  if (!booking) {
    return res.status(404).json({
      success: false,
      error: 'Booking not found'
    });
  }
  
  res.json({
    success: true,
    booking: booking
  });
});

// Get bookings for a job
app.get('/api/jobs/:id/booking', (req, res) => {
  const jobId = req.params.id;
  const booking = bookings.find(b => b.jobId === jobId);
  
  if (!booking) {
    return res.status(404).json({
      success: false,
      error: 'No booking found for this job'
    });
  }
  
  res.json({
    success: true,
    booking: booking
  });
});

// Publish draft as job
app.post('/api/drafts/:id/publish', (req, res) => {
  const draft = drafts.find(d => d.id === req.params.id);
  if (!draft) {
    return res.status(404).json({ error: 'Draft not found' });
  }
  
  const jobId = (jobs.length + 1).toString();
  const address = '123 Demo Street, San Francisco, CA';
  const coordinates = generateCoordinates(address);
  
  const newJob = {
    id: jobId,
    category: draft.category,
    description: draft.description + (draft.analysis?.suspected_issue ? ` (${draft.analysis.suspected_issue})` : ''),
    urgency: draft.urgency,
    price: draft.budget_hint || Math.floor(Math.random() * 300) + 150,
    address: address,
    lat: coordinates.lat,
    lng: coordinates.lng,
    customerName: 'Demo Customer',
    phone: '(555) 123-4567',
    createdAt: new Date().toISOString(),
    status: 'open',
    media: draft.attachments.map(a => a.url),
    analysis: draft.analysis
  };
  
  jobs.push(newJob);
  
  // Multi-Agent Collaboration Flow - Natural Conversation Style
  // 1. Homeowner Agent publishes job
  addEvent('Homeowner Agent', 'published job', jobId, { 
    category: newJob.category, 
    price: newJob.price 
  }, 'homeowner', `💬 "My ${newJob.category.toLowerCase()} needs fixing in ${newJob.address.split(',')[1].trim()}! Budget around $${newJob.price}."`);
  
  // 2. Dispatcher Agent receives and broadcasts
  setTimeout(async () => {
    addEvent('Dispatcher Agent', 'sent RFO', jobId, { contractors: 3 }, 'both', 
      `💬 "Got it! I'll reach out to available ${newJob.category.toLowerCase()} contractors nearby."`);
    
    // 3. Generate offers with natural conversation (using real agents when available)
    const jobOffers = await generateContractorOffersWithAgent(newJob);
    
    // Individual contractor responses
    setTimeout(() => {
      jobOffers.forEach((offer, index) => {
        setTimeout(() => {
          const contractorPersonality = offer.type === 'fast' ? 'Quick' : 'Budget';
          addEvent('Contractor Agent', 'submitted offer', jobId, {
            contractorName: offer.contractorName,
            price: offer.price,
            eta: offer.eta,
            contractorId: offer.contractorId
          }, 'both', `💬 "${contractorPersonality}: I can take it for $${offer.price}. ETA ${offer.eta}."`);
        }, index * 800); // Stagger responses
      });
      
      // 4. Dispatcher Agent presents options
      setTimeout(() => {
        const optionsText = jobOffers.map((o, i) => `${i+1}️⃣ $${o.price} / ${o.eta}`).join('\n');
        addEvent('Dispatcher Agent', 'presented options', jobId, { 
          offers: jobOffers.map(o => ({ contractor: o.contractorName, price: o.price, eta: o.eta }))
        }, 'homeowner', `💬 "Here are your options:\n${optionsText}\nWhich works best for you?"`);
      }, jobOffers.length * 800 + 500);
    }, 1000);
  }, 1000);
  
  // Remove draft after publishing
  const draftIndex = drafts.findIndex(d => d.id === req.params.id);
  if (draftIndex !== -1) {
    drafts.splice(draftIndex, 1);
  }
  
  console.log(`📋 Published job ${jobId} from draft ${req.params.id}`);
  
  res.json({ success: true, job: newJob });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Contractor Dispatcher API is running',
    timestamp: new Date().toISOString(),
    jobsCount: jobs.length
  });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Contractor Dispatcher API running on http://localhost:${PORT}`);
  console.log(`📍 Jobs endpoint: http://localhost:${PORT}/api/jobs`);
  console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📊 Currently managing ${jobs.length} jobs`);
});
