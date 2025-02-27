import React from 'react';
import type { Video } from '@/types/video';
import Image from 'next/image';

interface VideoListProps {
  videos: Video[];
  onVideoSelect: (video: Video) => void;
  channels?: any[];
}

const VideoList: React.FC<VideoListProps> = ({ 
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

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return 'Unknown date';
    
    // Handle YYYYMMDD format
    if (/^\d{8}$/.test(dateStr)) {
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      return new Date(`${year}-${month}-${day}`).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    
    // Handle ISO format or other date strings
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const getChannelName = (video: Video): string => {
    if (video.channel_title) return video.channel_title;
    
    if (video.channel_id && channels.length > 0) {
      const channel = channels.find(c => c.id === video.channel_id);
      if (channel) return channel.name;
    }
    
    return 'Unknown channel';
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="divide-y divide-gray-200">
        {videos.map((video) => (
          <div 
            key={video.id}
            onClick={() => onVideoSelect(video)}
            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors flex items-start space-x-4"
          >
            {/* Thumbnail */}
            <div className="flex-shrink-0 w-40 h-24 bg-gray-200 rounded overflow-hidden relative">
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
              {video.duration > 0 && (
                <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 rounded">
                  {formatDuration(video.duration)}
                </div>
              )}
              {/* Digest badge if available */}
              {video.summary && (
                <div className="absolute top-1 right-1 bg-indigo-600 text-white text-xs px-1 rounded-full">
                  Digest
                </div>
              )}
            </div>
            
            {/* Video Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-medium text-gray-900 line-clamp-2">{video.title}</h3>
              <p className="text-sm text-gray-500 truncate">
                {getChannelName(video)}
              </p>
              <div className="mt-1 flex items-center text-xs text-gray-500 space-x-2">
                {video.upload_date && (
                  <span>{formatDate(video.upload_date)}</span>
                )}
                {video.view_count !== undefined && (
                  <span>• {video.view_count >= 1000 
                    ? `${Math.floor(video.view_count/1000)}K views` 
                    : `${video.view_count} views`}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoList;
