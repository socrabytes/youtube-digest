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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {videos.map((video) => (
        <div 
          key={video.id} 
          className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer flex flex-col h-[320px]"
          onClick={() => typeof onVideoSelect === 'function' ? onVideoSelect(video) : console.error('onVideoSelect is not a function')}
          aria-label={`Select video: ${video.title}`}
        >
          <div className="relative">
            {/* Thumbnail with duration overlay */}
            <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
              {video.thumbnail_url ? (
                <img 
                  src={video.thumbnail_url} 
                  alt={`Thumbnail for ${video.title}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-gray-500">No thumbnail</span>
                </div>
              )}
              
              {/* Duration overlay */}
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-1 py-0.5 rounded">
                {formatDuration(video.duration)}
              </div>
              
              {/* Has digest badge */}
              {video.has_digest && (
                <div className="absolute top-2 right-2 bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-md">
                  Digest
                </div>
              )}
              
            </div>
            
          </div>
          
          {/* Video info */}
          <div className="p-3 flex-grow flex flex-col">
            <h3 className="font-medium text-gray-900 mb-1 line-clamp-2 h-12" title={video.title}>
              {video.title}
            </h3>
            
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
              <span className="text-sm text-gray-700 truncate">
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
