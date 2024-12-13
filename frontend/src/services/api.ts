import type { Video, VideoFilterOptions } from '@/types/video';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = {
  async fetchVideos(filters: VideoFilterOptions): Promise<Video[]> {
    const queryParams = new URLSearchParams({
      sort_by: filters.sortBy,
      time_range: filters.timeRange,
      has_digest: filters.hasDigest.toString(),
    });

    const response = await fetch(`${API_BASE_URL}/api/videos?${queryParams}`);
    if (!response.ok) {
      throw new Error('Failed to fetch videos');
    }
    return response.json();
  },

  async getVideoDigest(videoId: string): Promise<Video> {
    const response = await fetch(`${API_BASE_URL}/api/videos/${videoId}/digest`);
    if (!response.ok) {
      throw new Error('Failed to fetch video digest');
    }
    return response.json();
  },

  async createDigest(videoUrl: string): Promise<{ taskId: string }> {
    const response = await fetch(`${API_BASE_URL}/api/digests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ video_url: videoUrl }),
    });
    if (!response.ok) {
      throw new Error('Failed to create digest');
    }
    return response.json();
  },

  async getDigestStatus(taskId: string): Promise<{ status: string; digest?: Video }> {
    const response = await fetch(`${API_BASE_URL}/api/digests/${taskId}/status`);
    if (!response.ok) {
      throw new Error('Failed to get digest status');
    }
    return response.json();
  },
};
