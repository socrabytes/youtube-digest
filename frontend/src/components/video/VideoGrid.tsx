import React from 'react';
import type { Video } from '@/types/video';
import Image from 'next/image';

interface VideoGridProps {
  videos: Video[];
  onVideoSelect: (video: Video) => void;
  channels?: any[];
}

const VideoGrid: React.FC<VideoGridProps> = ({ 
  videos, 
  onVideoSelect,
  channels = []
}) => {
  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <p className="text-xl mb-4">No videos found</p>
        <p className="text-sm">Try adjusting your filters</p>
      </div>
    );
  }

  const getChannelName = (video: Video): string => {
    if (video.channel_title) return video.channel_title;
    
    if (video.channel_id && channels.length > 0) {
      const channel = channels.find(c => c.id === video.channel_id);
      if (channel) return channel.name;
    }
    
    return 'Unknown channel';
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    
    // Handle YYYYMMDD format
    if (/^\d{8}$/.test(dateStr)) {
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      return new Date(`${year}-${month}-${day}`).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
    
    // Handle ISO format or other date strings
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return '';
    }
  };
  
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {videos.map((video) => (
        <div 
          key={video.id} 
          onClick={() => onVideoSelect(video)}
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-64 flex flex-col"
        >
          {/* Thumbnail with duration */}
          <div className="relative h-40 bg-gray-200 flex-shrink-0">
            {video.thumbnail_url ? (
              <img 
                src={video.thumbnail_url} 
                alt={video.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-sm text-gray-400">No thumbnail</span>
              </div>
            )}
            {/* Duration badge */}
            {video.duration > 0 && (
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-1.5 py-0.5 rounded">
                {formatDuration(video.duration)}
              </div>
            )}
            {/* Digest badge if available */}
            {video.summary && (
              <div className="absolute top-2 right-2 bg-indigo-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                Digest
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="p-3 flex-grow flex flex-col justify-between">
            <div>
              <h3 className="font-medium text-gray-900 line-clamp-2">{video.title}</h3>
              <p className="text-xs text-gray-500 mt-1 truncate">{getChannelName(video)}</p>
            </div>
            
            <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
              {video.upload_date && (
                <span>{formatDate(video.upload_date)}</span>
              )}
              {video.view_count && (
                <span>{video.view_count >= 1000 
                  ? `${Math.floor(video.view_count/1000)}K views` 
                  : `${video.view_count} views`}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default VideoGrid;
