import React from 'react';
import type { Video } from '@/types/video';
import LoadingSpinner from '../common/LoadingSpinner'; // Added import

type VideoGridProps = {
  videos: Video[];
  onVideoSelect: (video: Video) => void;
  channels?: any[];
  showChannel?: boolean;
  isLoading?: boolean;
  onRefresh?: () => void; // Added onRefresh prop
};

const VideoGrid: React.FC<VideoGridProps> = ({ videos, onVideoSelect, channels = [], showChannel = true, isLoading = false, onRefresh }) => {
  const getChannelImage = (channelId?: number) => {
    if (!channelId || !channels.length) return null;
    const channel = channels.find(c => c.id === channelId);
    return channel?.avatar || null;
  };

  // Format view count to 1.2K, 4.5M, etc.
  const formatViews = (views: number): string => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    } else {
      return views.toString();
    }
  };

  // Format date
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  };

  // Format duration from seconds to MM:SS
  const formatDuration = (seconds: number): string => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}:${remainingMinutes < 10 ? '0' : ''}${remainingMinutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    }
    
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Get channel name with fallback
  const getChannelName = (video: Video): string => {
    // Check if video.channel is a string
    if (typeof video.channel === 'string') return video.channel;
    
    // If video.channel is an object, try to extract name
    if (video.channel && typeof video.channel === 'object' && 'name' in video.channel) {
      return video.channel.name as string;
    }
    
    // Try to find channel in channels array
    if (channels && channels.length && video.channel_id) {
      const channel = channels.find(c => c.id === video.channel_id);
      if (channel?.name) return channel.name;
    }
    
    return 'Unknown';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner text="Loading videos..." />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {videos.map((video) => (
        <div 
          key={video.id} 
          className="bg-white overflow-hidden cursor-pointer flex flex-col shadow-sm hover:shadow-md transition-shadow"
          onClick={() => typeof onVideoSelect === 'function' && onVideoSelect(video)}
          aria-label={`Select video: ${video.title}`}
        >
          {/* Thumbnail with Duration */}
          <div className="relative aspect-video w-full bg-gray-100">
            <img 
              src={video.thumbnail_url || '/placeholder-thumbnail.jpg'} 
              alt={video.title} 
              className="w-full h-full object-cover"
              loading="lazy"
            />
            
            {/* Duration overlay */}
            <div className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1 rounded">
              {formatDuration(video.duration)}
            </div>
            
            {/* Digest badge if present */}
            {video.has_digest && (
              <div className="absolute top-1 right-1 bg-indigo-600 text-white text-xs px-2 py-0.5 rounded">
                Digest
              </div>
            )}
          </div>
          
          {/* Video Info */}
          <div className="p-2">
            {/* Video Title - limit to 2 lines with ellipsis */}
            <h3 
              className="text-sm font-medium text-gray-900 line-clamp-2 h-10 mb-1" 
              title={video.title}
            >
              {video.title}
            </h3>
            
            {/* Channel with fallback */}
            <div className="flex items-center mt-1 mb-1">
              {getChannelImage(video.channel_id) ? (
                <img 
                  src={getChannelImage(video.channel_id)} 
                  alt={`${getChannelName(video)} avatar`}
                  className="w-6 h-6 rounded-full mr-2"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-200 mr-2 flex items-center justify-center text-gray-500 text-xs">
                  {typeof getChannelName(video) === 'string' ? getChannelName(video).charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <span className="text-xs text-gray-500 truncate">
                {typeof getChannelName(video) === 'string' ? getChannelName(video) : 'Unknown channel'}
              </span>
            </div>
            
            {/* Video stats */}
            <div className="flex items-center text-xs text-gray-500">
              <span>{video.view_count ? `${formatViews(video.view_count)} views` : ''}</span>
              {video.upload_date && (
                <>
                  <span className="mx-1">•</span>
                  <span>{formatDate(video.upload_date)}</span>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default VideoGrid;
