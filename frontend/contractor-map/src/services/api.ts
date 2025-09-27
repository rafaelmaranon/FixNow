import { Job } from '../data/mockJobs';
import { API_BASE_URL, isDemoMode } from '../config/api';
import { mockApiResponses, simulateApiDelay } from './mockData';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  count?: number;
}

export const jobsApi = {
  async getJobs(): Promise<Job[]> {
    // Bulletproof demo mode detection
    if (window.location.hostname.endsWith('github.io')) {
      return mockApiResponses.jobs.data;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/jobs`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result: ApiResponse<Job[]> = await response.json();
      return result.data;
    } catch (error) {
      console.error('Failed to fetch jobs, using mock data:', error);
      // Fallback to mock data if API fails
      return mockApiResponses.jobs.data;
    }
  },

  async createJob(jobData: Partial<Job>): Promise<Job> {
    // Bulletproof demo mode detection
    if (window.location.hostname.endsWith('github.io')) {
      const newJob: Job = {
        id: Date.now().toString(),
        category: jobData.category || 'General',
        address: jobData.address || '123 Demo St, San Francisco, CA',
        lat: 37.7749,
        lng: -122.4194,
        price: jobData.price || 200,
        urgency: jobData.urgency || 'medium',
        description: jobData.description || 'Demo job',
        customerName: jobData.customerName || 'Demo User',
        phone: jobData.phone || '(415) 555-DEMO',
        createdAt: new Date().toISOString(),
        status: 'open'
      };
      return newJob;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<Job> = await response.json();
      return result.data;
    } catch (error) {
      console.error('Failed to create job:', error);
      throw error;
    }
  },

  // Health check
  async healthCheck(): Promise<boolean> {
    if (window.location.hostname.endsWith('github.io')) {
      return true;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('❌ API health check failed:', error);
      return false;
    }
  }
};
