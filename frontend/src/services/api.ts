import type { Video, VideoFilterOptions } from '@/types/video';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_VERSION = '/api/v1';

export const api = {
  async fetchVideos(filters: VideoFilterOptions): Promise<Video[]> {
    const queryParams = new URLSearchParams();
    
    if (filters.sortBy) {
      queryParams.append('sort_by', filters.sortBy);
    }
    
    if (filters.timeRange && filters.timeRange !== 'all') {
      queryParams.append('time_range', filters.timeRange);
    }
    
    if (filters.hasDigest) {
      queryParams.append('has_digest', 'true');
    }
    
    if (filters.category) {
      queryParams.append('category', filters.category);
    }

    const response = await fetch(`${API_BASE_URL}${API_VERSION}/videos/?${queryParams}`);
    if (!response.ok) {
      throw new Error('Failed to fetch videos');
    }
    return response.json();
  },

  async getVideo(videoId: number): Promise<Video> {
    const response = await fetch(`${API_BASE_URL}${API_VERSION}/videos/${videoId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch video');
    }
    return response.json();
  },

  async getVideoDigest(videoId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}${API_VERSION}/digests/?video_id=${videoId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch video digest');
    }
    const digests = await response.json();
    return digests.length > 0 ? digests[0] : null;
  },

  async createDigest(videoUrl: string, digestType: string = 'highlights', summaryFormat: string = 'enhanced'): Promise<any> {
    // First, create or get the video
    const videoResponse = await fetch(`${API_BASE_URL}${API_VERSION}/videos/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: videoUrl }),
    });
    
    if (!videoResponse.ok) {
      const errorData = await videoResponse.json();
      throw new Error(errorData.detail || 'Failed to create video');
    }
    
    const video = await videoResponse.json();
    
    // Validate digest type against the backend's enum values
    const validDigestTypes = ['highlights', 'chapters', 'detailed', 'summary'];
    const normalizedDigestType = digestType.toLowerCase();
    
    if (!validDigestTypes.includes(normalizedDigestType)) {
      throw new Error(`Invalid digest type: ${digestType}. Must be one of: ${validDigestTypes.join(', ')}`);
    }
    
    // Then, create a digest for the video
    const digestResponse = await fetch(`${API_BASE_URL}${API_VERSION}/digests/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        video_id: video.id,
        digest_type: normalizedDigestType,
        summary_format: summaryFormat
      }),
    });
    
    if (!digestResponse.ok) {
      const errorData = await digestResponse.json();
      throw new Error(errorData.detail || 'Failed to create digest');
    }
    
    const digest = await digestResponse.json();
    return { ...digest, video_id: video.id };
  },

  async getCategories(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}${API_VERSION}/categories/`);
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
    return response.json();
  },

  async getChannels(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}${API_VERSION}/channels/`);
    if (!response.ok) {
      throw new Error('Failed to fetch channels');
    }
    return response.json();
  }
};

// Export standalone functions for easier imports
export async function getVideos(): Promise<Video[]> {
  const response = await fetch(`${API_BASE_URL}${API_VERSION}/videos/`);
  if (!response.ok) {
    throw new Error('Failed to fetch videos');
  }
  return response.json();
}

export async function getChannels(): Promise<any[]> {
  const response = await fetch(`${API_BASE_URL}${API_VERSION}/channels/`);
  if (!response.ok) {
    throw new Error('Failed to fetch channels');
  }
  return response.json();
}

export async function getVideo(id: number): Promise<Video> {
  const response = await fetch(`${API_BASE_URL}${API_VERSION}/videos/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch video');
  }
  return response.json();
}

export async function createDigest(url: string, digestType: string = 'highlights', summaryFormat: string = 'enhanced'): Promise<any> {
  return api.createDigest(url, digestType, summaryFormat);
}
