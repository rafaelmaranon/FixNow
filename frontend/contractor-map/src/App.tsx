import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import MapView from './components/MapView';
import VoiceAgent from './components/VoiceAgent';
import ContractorAgentPanel from './components/ContractorAgentPanel';
import NeighborhoodFilter from './components/NeighborhoodFilter';
import AgentTicker from './components/AgentTicker';
import { Job } from './data/mockJobs';
import { jobsApi } from './services/api';
import { createApiUrl } from './config/api';
import { mockJobs, mockContractors } from './services/mockData';

type UserRole = 'homeowner' | 'contractor';

// Bulletproof demo mode detection
const IS_PAGES = window.location.hostname.endsWith('github.io');
const IS_DEMO = IS_PAGES || process.env.REACT_APP_DEMO === '1';

function App() {
  const [userRole, setUserRole] = useState<UserRole>('homeowner');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [contractors, setContractors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newJobNotification, setNewJobNotification] = useState<string | null>(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('all');
  const [contractorId] = useState<string>('contractor-fast'); // Fixed contractor ID for demo
  const [filterMode, setFilterMode] = useState<'strict' | 'loose'>('strict'); // Filter mode for contractors

  // One-shot initialization
  const didInit = useRef(false);

  // Fetch jobs from API
  const fetchJobs = async () => {
    try {
      setError(null);
      
      // Use demo mode in production
      if (IS_DEMO) {
        console.log('🎭 Demo mode detected: Using mock jobs data');
        setJobs(mockJobs);
        setFilteredJobs(mockJobs);
        return;
      }
      
      const fetchedJobs = await jobsApi.getJobs();
      setJobs(fetchedJobs);
      setFilteredJobs(fetchedJobs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
      console.error('Failed to fetch jobs:', err);
    }
  };

  // Fetch contractors from backend API
  const fetchContractors = async (neighborhood = 'all', mode = 'strict') => {
    try {
      // Use demo mode in production
      if (IS_DEMO) {
        console.log('🎭 Demo mode: Using mock contractors data');
        let contractorsData = mockContractors;
        
        // Filter by neighborhood if specified
        if (neighborhood !== 'all') {
          contractorsData = contractorsData.filter((contractor: any) => 
            contractor.address.toLowerCase().includes(neighborhood.toLowerCase())
          );
        }
        
        setContractors(contractorsData);
        console.log(`✅ Loaded ${contractorsData.length} contractors from demo data (${neighborhood}, ${mode})`);
        return;
      }
      
      const response = await fetch(createApiUrl('/contractors'));
      if (response.ok) {
        const result = await response.json();
        let contractorsData = result.data || [];
        
        // Filter by neighborhood if specified
        if (neighborhood !== 'all') {
          contractorsData = contractorsData.filter((contractor: any) => 
            contractor.address.toLowerCase().includes(neighborhood.toLowerCase())
          );
        }
        
        setContractors(contractorsData);
        console.log(`✅ Loaded ${contractorsData.length} contractors from backend API (${neighborhood}, ${mode})`);
      }
    } catch (err) {
      console.error('Failed to fetch contractors:', err);
      // Fallback to demo data on error
      setContractors(mockContractors);
    }
  };

  // One-shot initialization
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    console.log('🧪 Demo mode:', IS_DEMO, 'host:', window.location.hostname);

    if (IS_DEMO) {
      setJobs(mockJobs);
      setContractors(mockContractors);
      setFilteredJobs(mockJobs);
      setIsLoading(false);
      return; // Skip API entirely
    }

    (async () => {
      try {
        setIsLoading(true);
        const [jobsResp, contractorsResp] = await Promise.all([
          jobsApi.getJobs(),
          fetchContractors(selectedNeighborhood, filterMode)
        ]);
        setJobs(jobsResp);
        setFilteredJobs(jobsResp);
      } catch (e) {
        console.error('API failed, falling back to mock:', e);
        setJobs(mockJobs);
        setContractors(mockContractors);
        setFilteredJobs(mockJobs);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Fetch contractors when switching to homeowner view or filters change
  useEffect(() => {
    if (userRole === 'homeowner') {
      fetchContractors(selectedNeighborhood, filterMode);
    }
  }, [userRole, selectedNeighborhood, filterMode]);

  // Real-time polling for contractor view
  useEffect(() => {
    if (userRole === 'contractor') {
      const interval = setInterval(() => {
        fetchJobs();
      }, 3000); // Poll every 3 seconds when in contractor view

      return () => clearInterval(interval);
    }
  }, [userRole]);

  const handleRoleSwitch = (role: UserRole) => {
    setUserRole(role);
  };

  const handleVoiceCommand = (command: string) => {
    console.log(`Voice command: ${command}`);
    
    // Handle filtering commands
    if (command.includes('filter:plumbing')) {
      setFilteredJobs(jobs.filter(job => job.category.toLowerCase() === 'plumbing'));
    } else if (command.includes('filter:emergency')) {
      setFilteredJobs(jobs.filter(job => job.urgency === 'emergency'));
    } else if (command.includes('filter:nearby')) {
      // Sort by distance (mock implementation)
      const sortedJobs = [...jobs].sort((a, b) => a.price - b.price);
      setFilteredJobs(sortedJobs.slice(0, 12));
    }
  };

  const handlePhotoUpload = (file: File) => {
    console.log('Photo uploaded:', file.name);
    // Handle photo upload logic here
  };

  const handleJobPublished = () => {
    // Immediately refresh jobs when a new job is published
    fetchJobs();
    
    // Show notification for contractor view
    if (userRole === 'contractor') {
      setNewJobNotification('🆕 New job posted!');
      setTimeout(() => setNewJobNotification(null), 3000);
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-left">
          <h1>FixNow ⚡</h1>
          <p className="tagline">Urgent repairs, booked in minutes.</p>
          <div className="inkeep-badge">
            <span className="badge-text">Powered by</span>
            <span className="inkeep-logo">🤖 Inkeep+RainDrop+CodeRabbit</span>
          </div>
        </div>
        
        <div className="role-switcher">
          <div className="switch-container">
            <button 
              className={`role-btn ${userRole === 'homeowner' ? 'active' : ''}`}
              onClick={() => handleRoleSwitch('homeowner')}
            >
              🏠 Homeowner
            </button>
            <button 
              className={`role-btn ${userRole === 'contractor' ? 'active' : ''}`}
              onClick={() => handleRoleSwitch('contractor')}
            >
              👷 Contractor
            </button>
          </div>
        </div>

        <div className="header-stats">
          {userRole === 'homeowner' ? (
            <>
              <span className="stat">
                👷 {contractors.length} Contractors
              </span>
              <span className="stat ai-stat">
                🤖 Homeowner Agent Ready
              </span>
            </>
          ) : (
            <>
              <span className="stat">
                📋 {filteredJobs.length} Jobs Available
              </span>
              <span className="stat">
                🚨 {filteredJobs.filter(j => j.urgency === 'emergency').length} Emergency
              </span>
              <span className="stat ai-stat">
                🤖 Contractor Agent Active
              </span>
            </>
          )}
        </div>
      </header>

      <main className="app-main">
        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner">🔄</div>
            <p>Loading data...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <div className="error-message">❌ {error}</div>
            <button 
              className="retry-button"
              onClick={() => window.location.reload()}
            >
              🔄 Retry
            </button>
          </div>
        ) : (
          <div className="main-layout">
            {/* New Job Notification */}
            {newJobNotification && (
              <div className="job-notification">
                {newJobNotification}
              </div>
            )}
            
            {/* Left Panel - Different for each role */}
            <div className="left-panel">
              {userRole === 'homeowner' ? (
                <>
                  <VoiceAgent 
                    userRole={userRole}
                    onVoiceCommand={handleVoiceCommand}
                    onPhotoUpload={handlePhotoUpload}
                    onJobPublished={handleJobPublished}
                  />
                </>
              ) : (
                <ContractorAgentPanel contractorId={contractorId} />
              )}
              
              {userRole === 'homeowner' ? (
                <div className="contractor-list">
                  <h2>Available Contractors</h2>
                  <NeighborhoodFilter
                    selectedNeighborhood={selectedNeighborhood}
                    selectedMode={filterMode}
                    onNeighborhoodChange={setSelectedNeighborhood}
                    onModeChange={setFilterMode}
                  />
                  {contractors.map((contractor: any) => (
                    <div key={contractor.id} className="contractor-card">
                      <div className="contractor-info">
                        <div className="contractor-header">
                          <h3>{contractor.name}</h3>
                          {contractor.source === 'craigslist' && (
                            <span className="source-badge">📋 Live CL</span>
                          )}
                        </div>
                        <p className="category">{contractor.category}</p>
                        <p className="summary">{contractor.summary}</p>
                        <div className="contractor-details">
                          <span className="rating">⭐ {contractor.rating}</span>
                          <span className="eta">🕐 {contractor.eta}</span>
                          <span className="price">{contractor.priceRange}</span>
                          <span className="distance">📍 {contractor.distance}</span>
                        </div>
                        {contractor.external_url && (
                          <div className="contractor-actions">
                            <button 
                              className="craigslist-btn"
                              onClick={() => window.open(contractor.external_url, '_blank')}
                            >
                              📋 View on Craigslist
                            </button>
                            <button className="contact-btn">
                              📞 Contact
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="job-list">
                  <h2>Available Jobs ({filteredJobs.length})</h2>
                  {filteredJobs
                    .sort((a, b) => {
                      // Sort by urgency first, then by creation time (newest first)
                      const urgencyOrder = { emergency: 4, high: 3, medium: 2, low: 1 };
                      const urgencyDiff = (urgencyOrder[b.urgency as keyof typeof urgencyOrder] || 0) - 
                                         (urgencyOrder[a.urgency as keyof typeof urgencyOrder] || 0);
                      if (urgencyDiff !== 0) return urgencyDiff;
                      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                    })
                    .slice(0, 10)
                    .map(job => (
                    <div key={job.id} className="job-card">
                      <div className="job-info">
                        <h3>{job.category}</h3>
                        <p className="description">{job.description}</p>
                        <div className="job-details">
                          <span className={`urgency ${job.urgency}`}>
                            {job.urgency === 'emergency' ? '🚨' : 
                             job.urgency === 'high' ? '🔴' : 
                             job.urgency === 'medium' ? '🟡' : '🟢'} 
                            {job.urgency}
                          </span>
                          <span className="price">${job.price}</span>
                          <span className="address">📍 {job.address}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Panel - Map */}
            <div className="right-panel">
              <div className="map-container">
                {userRole === 'homeowner' ? (
                  <MapView 
                    jobs={filteredJobs} 
                    contractors={contractors}
                    viewMode="jobs"
                  />
                ) : (
                  <MapView 
                    jobs={filteredJobs} 
                    contractors={contractors}
                    viewMode="jobs"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Multi-Agent Activity Ticker */}
      <AgentTicker 
        userRole={userRole}
        contractorId={userRole === 'contractor' ? contractorId : undefined}
      />
    </div>
  );
}

export default App;
