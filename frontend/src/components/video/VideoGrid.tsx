import React from 'react';
import type { Video } from '@/types/video';
import { formatDuration, formatViews, formatDate } from '@/utils/format';
import { DocumentTextIcon } from '@heroicons/react/outline';

type VideoGridProps = {
  videos: Video[];
  onVideoSelect: (video: Video) => void;
  channels?: any[];
};

const VideoGrid: React.FC<VideoGridProps> = ({ videos, onVideoSelect, channels = [] }) => {
  const getChannelImage = (channelId?: number) => {
    if (!channelId || !channels.length) return null;
    const channel = channels.find(c => c.id === channelId);
    return channel?.thumbnail || null;
  };

  const getChannelName = (video: Video) => {
    // First try to use the channel_title from the video
    if (video.channel_title) return video.channel_title;
    
    // If not available, try to get it from the channels array
    if (video.channel_id && channels.length > 0) {
      const channel = channels.find(c => c.id === video.channel_id);
      if (channel) return channel.name;
    }
    
    return 'Unknown channel';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {videos.map((video) => (
        <div 
          key={video.id} 
          className="bg-white rounded-lg overflow-hidden hover:shadow-sm transition-all cursor-pointer flex flex-col"
          onClick={() => typeof onVideoSelect === 'function' ? onVideoSelect(video) : console.error('onVideoSelect is not a function')}
          aria-label={`Select video: ${video.title}`}
        >
          {/* Thumbnail with Duration */}
          <div className="relative aspect-video w-full bg-gray-100">
            <img 
              src={video.thumbnail_url || video.thumbnail || '/placeholder-thumbnail.jpg'} 
              alt={video.title} 
              className="w-full h-full object-cover"
            />
            
            {/* Duration overlay */}
            <div className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1 rounded">
              {formatDuration(video.duration)}
            </div>
            
            {/* Digest badge if present */}
            {video.has_digest && (
              <div className="absolute top-2 right-2 bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                Digest
              </div>
            )}
          </div>
          
          {/* Video Info */}
          <div className="p-3">
            {/* Video Title - limit to 2 lines with ellipsis */}
            <h3 
              className="text-sm font-medium text-gray-900 line-clamp-2 h-10 mb-1" 
              title={video.title}
            >
              {video.title}
            </h3>
            
            {/* Channel with fallback */}
            <div className="flex items-center mt-1 mb-2">
              {getChannelImage(video.channel_id) ? (
                <img 
                  src={getChannelImage(video.channel_id)} 
                  alt={`${getChannelName(video)} avatar`}
                  className="w-6 h-6 rounded-full mr-2"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-200 mr-2 flex items-center justify-center text-gray-500 text-xs">
                  {getChannelName(video).charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs text-gray-500 truncate">
                {getChannelName(video)}
              </span>
            </div>
            
            {/* Video stats */}
            <div className="mt-auto flex justify-between text-xs text-gray-500">
              <span>{formatViews(video.view_count || 0)} views</span>
              <span>{formatDate(video.upload_date || video.created_at)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default VideoGrid;
