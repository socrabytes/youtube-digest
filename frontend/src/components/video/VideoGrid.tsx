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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {videos.map((video) => (
        <div 
          key={video.id} 
          className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer flex flex-col"
          onClick={() => onVideoSelect(video)}
          aria-label={`Select video: ${video.title}`}
        >
          {/* Thumbnail with duration overlay */}
          <div className="relative h-0 pb-[56.25%]">
            {video.thumbnail_url ? (
              <img 
                src={video.thumbnail_url} 
                alt={`Thumbnail for ${video.title}`}
                className="absolute top-0 left-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-200">
                <span className="text-gray-500">No thumbnail</span>
              </div>
            )}
            
            {/* Duration badge */}
            {video.duration && (
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-1.5 py-0.5 rounded">
                {formatDuration(video.duration)}
              </div>
            )}
            
            {/* Digest badge */}
            {video.has_digest && (
              <div className="absolute top-2 right-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded-md flex items-center">
                <DocumentTextIcon className="h-3 w-3 mr-1" />
                Digest
              </div>
            )}
          </div>
          
          {/* Video info */}
          <div className="p-3 flex flex-col flex-grow">
            <h3 className="font-medium text-gray-900 line-clamp-2 mb-1">{video.title}</h3>
            
            <div className="flex items-center mt-1 mb-2">
              {getChannelImage(video.channel_id) ? (
                <img 
                  src={getChannelImage(video.channel_id)} 
                  alt={video.channel_title || 'Channel'} 
                  className="w-5 h-5 rounded-full mr-2"
                />
              ) : (
                <div className="w-5 h-5 bg-gray-200 rounded-full mr-2"></div>
              )}
              <span className="text-sm text-gray-700 truncate">
                {video.channel_title || 'Unknown channel'}
              </span>
            </div>
            
            <div className="text-xs text-gray-500 mt-auto flex items-center justify-between">
              <span>{formatViews(video.view_count)}</span>
              <span>{formatDate(video.upload_date)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default VideoGrid;
