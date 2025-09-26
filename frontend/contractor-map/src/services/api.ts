import { Job } from '../data/mockJobs';

const API_BASE_URL = 'http://localhost:3001/api';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  count?: number;
}

export const jobsApi = {
  // Get all jobs
  getJobs: async (): Promise<Job[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result: ApiResponse<Job[]> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch jobs');
      }
      
      console.log('✅ Fetched jobs from API:', result.data.length, 'jobs');
      return result.data;
    } catch (error) {
      console.error('❌ Error fetching jobs:', error);
      throw error;
    }
  },

  // Create a new job
  createJob: async (jobData: Omit<Job, 'id' | 'createdAt' | 'status' | 'lat' | 'lng'>): Promise<Job> => {
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
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create job');
      }

      console.log('✅ Created new job via API:', result.data);
      return result.data;
    } catch (error) {
      console.error('❌ Error creating job:', error);
      throw error;
    }
  },

  // Health check
  healthCheck: async (): Promise<boolean> => {
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
