export type ProcessingStatus = 'pending' | 'processing' | 'summarizing' | 'completed' | 'failed';

export interface Video {
  id: number;
  youtube_id: string;
  url: string;
  title: string;
  thumbnail_url?: string;
  duration: number;
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
  transcript_source?: 'manual' | 'auto';
  summary?: string;
  processing_status: ProcessingStatus;
  openai_usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  created_at: string;
  updated_at: string;
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
  category?: string;
}
