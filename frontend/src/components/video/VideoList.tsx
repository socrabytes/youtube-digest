import React from 'react';
import type { Video } from '@/types/video';
import { formatDuration, formatViews, formatDate } from '@/utils/format';
import { DocumentTextIcon } from '@heroicons/react/outline';

type VideoListProps = {
  videos: Video[];
  onVideoSelect: (video: Video) => void;
  channels?: any[];
};

const VideoList: React.FC<VideoListProps> = ({ videos, onVideoSelect, channels = [] }) => {
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
    <div className="space-y-4">
      {videos.map((video) => (
        <button
          key={video.id}
          onClick={() => onVideoSelect(video)}
          className="w-full text-left bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow flex space-x-4 items-start"
        >
          {/* Thumbnail with duration */}
          <div className="flex-shrink-0 relative w-40 h-24 bg-gray-200 rounded overflow-hidden">
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
            
            {/* Duration badge */}
            {video.duration && (
              <div className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1.5 py-0.5 rounded">
                {formatDuration(video.duration)}
              </div>
            )}
            
            {/* Digest badge */}
            {video.has_digest && (
              <div className="absolute top-1 right-1 bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-md flex items-center">
                <DocumentTextIcon className="h-3 w-3 mr-1" />
                Digest
              </div>
            )}
          </div>
          
          {/* Video info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 line-clamp-2 mb-1">{video.title}</h3>
            
            <div className="flex items-center mt-2">
              {getChannelImage(video.channel_id) ? (
                <img 
                  src={getChannelImage(video.channel_id)} 
                  alt={getChannelName(video)} 
                  className="w-5 h-5 rounded-full mr-2"
                />
              ) : (
                <div className="w-5 h-5 bg-gray-200 rounded-full mr-2"></div>
              )}
              <span className="text-sm text-gray-700 truncate">
                {getChannelName(video)}
              </span>
            </div>
            
            <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
              <span>{formatViews(video.view_count)}</span>
              <span>{formatDate(video.upload_date)}</span>
              
              {/* Additional metadata can be added here if needed */}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default VideoList;
