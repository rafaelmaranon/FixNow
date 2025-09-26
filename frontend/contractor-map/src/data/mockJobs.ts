export interface Job {
  id: string;
  category: string;
  address: string;
  lat: number;
  lng: number;
  price: number;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  description: string;
  customerName: string;
  phone: string;
  createdAt: string;
  status: 'open' | 'assigned' | 'in_progress' | 'completed';
}

// Mock jobs data for San Francisco area
export const mockJobs: Job[] = [
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
