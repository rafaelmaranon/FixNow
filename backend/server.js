const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for jobs, drafts, offers, events, and bookings
let drafts = [];
let offers = [];
let events = [];
let bookings = [];
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
    
    // 3. Contractor Agents respond with offers
    const jobOffers = generateContractorOffers(newJob);
    addEvent('Contractor Agent', 'generated offers', jobId, { 
      count: jobOffers.length,
      contractorId: 'contractor-fast'
    }, 'contractor');
    
    // 4. Dispatcher Agent collects offers
    setTimeout(() => {
      addEvent('Dispatcher Agent', 'collected offers', jobId, { 
        offers: jobOffers.map(o => ({ contractor: o.contractorName, price: o.price, eta: o.eta }))
      }, 'both');
    }, 1000);
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
app.post('/api/analyze-image', (req, res) => {
  const { draftId, imageUrl, context } = req.body;
  
  console.log(`🔍 Analyzing image for draft ${draftId}: ${context}`);
  
  // Mock vision analysis based on context
  let analysis = {};
  
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
      local_price_band: 'Typical SF: $180–$350'
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
    
    // Contractor confirmation
    setTimeout(() => {
      addEvent('Contractor Agent', 'confirmed booking', offer.jobId, {
        contractorName: offer.contractorName,
        contractorId: offer.contractorId,
        arrivalBy: arrivalTime
      }, 'both', `💬 "${offer.contractorName}: Confirmed! I'll head out now. 👍"`);
    }, 800);
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
  setTimeout(() => {
    addEvent('Dispatcher Agent', 'sent RFO', jobId, { contractors: 3 }, 'both', 
      `💬 "Got it! I'll reach out to available ${newJob.category.toLowerCase()} contractors nearby."`);
    
    // 3. Generate offers with natural conversation
    const jobOffers = generateContractorOffers(newJob);
    
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
