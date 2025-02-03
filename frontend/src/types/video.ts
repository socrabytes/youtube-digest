export interface Video {
  id: string;
  youtube_id: string;
  url: string;
  title?: string;
  thumbnail_url?: string;
  duration?: number;
  view_count?: number;
  subscriber_count?: number;
  channel_id?: string;
  channel_title?: string;
  upload_date?: string;
  like_count?: number;
  description?: string;
  tags?: string[];
  categories?: string[];
  transcript?: string | null;
  summary?: string;
  processed?: boolean;
  error_message?: string;
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
