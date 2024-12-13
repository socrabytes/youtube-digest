export interface Video {
  id: string;
  url: string;
  title?: string;
  description?: string;
  duration?: number;
  publishedAt?: string;
  channelTitle?: string;
  viewCount?: number;
  digest?: VideoDigest;
}

export interface VideoDigest {
  id: string;
  videoId: string;
  summary: string;
  keyPoints: string[];
  topics: string[];
  timestamps: VideoTimestamp[];
  createdAt: string;
}

export interface VideoTimestamp {
  time: number;
  description: string;
}

export interface VideoFilterOptions {
  sortBy: 'date' | 'relevance' | 'views';
  timeRange: 'day' | 'week' | 'month' | 'year' | 'all';
  hasDigest: boolean;
}
