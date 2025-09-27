// Mock data for demo mode when backend is unavailable
import { Job } from '../data/mockJobs';

// Mock jobs data
export const mockJobs: Job[] = [
  {
    id: '1',
    category: 'Plumbing',
    address: '123 Mission St, San Francisco, CA',
    lat: 37.7749,
    lng: -122.4194,
    price: 250,
    urgency: 'high',
    description: 'Kitchen sink leak needs immediate attention',
    customerName: 'Demo User',
    phone: '(415) 555-0123',
    createdAt: new Date().toISOString(),
    status: 'open'
  },
  {
    id: '2',
    category: 'Electrical',
    address: '456 Valencia St, San Francisco, CA',
    lat: 37.7599,
    lng: -122.4148,
    price: 180,
    urgency: 'medium',
    description: 'Outlet not working in bedroom',
    customerName: 'Jane Smith',
    phone: '(415) 555-0124',
    createdAt: new Date().toISOString(),
    status: 'open'
  },
  {
    id: '3',
    category: 'HVAC',
    address: '789 Castro St, San Francisco, CA',
    lat: 37.7609,
    lng: -122.4350,
    price: 320,
    urgency: 'emergency',
    description: 'Heater not working - very cold!',
    customerName: 'Bob Johnson',
    phone: '(415) 555-0125',
    createdAt: new Date().toISOString(),
    status: 'open'
  }
];

// Mock contractors data
export const mockContractors = [
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
    lng: -122.4148,
    rating: 4.6,
    phone: '(415) 555-1002',
    specialties: ['Smart Home', 'Panel Upgrades', 'Troubleshooting'],
    priceRange: '$90-180/hr',
    availability: 'Available Today',
    distance: '1.2 miles',
    eta: '45-60 min',
    reviews: 89,
    verified: true
  }
];

// Mock events for agent ticker
export const mockEvents = [
  {
    id: '1',
    agent: 'Homeowner Agent',
    action: 'published job',
    jobId: '1',
    timestamp: new Date().toISOString(),
    details: { category: 'Plumbing', price: 250 },
    audience: 'homeowner',
    message: '💬 "My plumbing needs fixing in San Francisco! Budget around $250."'
  },
  {
    id: '2',
    agent: 'Dispatcher Agent',
    action: 'sent RFO',
    jobId: '1',
    timestamp: new Date().toISOString(),
    details: { contractors: 3 },
    audience: 'both',
    message: '💬 "Got it! I\'ll reach out to available plumbing contractors nearby."'
  },
  {
    id: '3',
    agent: 'Contractor Agent',
    action: 'generated offers',
    jobId: '1',
    timestamp: new Date().toISOString(),
    details: { count: 2, contractorId: 'contractor-1' },
    audience: 'contractor',
    message: '💬 "Quick: I can take it for $280. ETA 30 min."'
  }
];

// Mock API responses
export const mockApiResponses = {
  jobs: {
    success: true,
    data: mockJobs,
    count: mockJobs.length
  },
  contractors: {
    success: true,
    data: mockContractors,
    count: mockContractors.length
  },
  events: {
    success: true,
    data: mockEvents,
    count: mockEvents.length
  },
  health: {
    success: true,
    message: 'Demo mode - using mock data',
    timestamp: new Date().toISOString(),
    jobsCount: mockJobs.length
  }
};

// Helper function to simulate API delay
export const simulateApiDelay = (ms: number = 500): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
