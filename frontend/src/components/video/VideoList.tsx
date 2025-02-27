import React from 'react';
import type { Video } from '@/types/video';
import LoadingSpinner from '../common/LoadingSpinner';
import Image from 'next/image';

interface VideoListProps {
  videos: Video[];
  isLoading: boolean;
  onVideoClick: (video: Video) => void;
  onRefresh?: () => void;
}

const VideoList: React.FC<VideoListProps> = ({ 
  videos, 
  isLoading, 
  onVideoClick,
  onRefresh 
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <p className="text-xl mb-4">No videos found</p>
        <p className="text-sm">Try adding a new video or adjusting your filters</p>
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

  return (
    <div className="flex flex-col divide-y divide-gray-200">
      {videos.map((video) => (
        <div 
          key={video.id} 
          className="flex p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
          onClick={() => onVideoClick(video)}
        >
          <div className="relative h-24 w-40 flex-shrink-0">
            {video.thumbnail_url ? (
              <Image
                src={video.thumbnail_url}
                alt={video.title}
                fill
                className="object-cover rounded"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                <span className="text-gray-400">No thumbnail</span>
              </div>
            )}
            {video.duration && (
              <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
                {formatDuration(video.duration)}
              </div>
            )}
          </div>
          
          <div className="ml-4 flex-grow">
            <h3 className="text-lg font-medium line-clamp-2">{video.title}</h3>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <span>{video.channel_title || 'Unknown channel'}</span>
              {video.view_count && (
                <>
                  <span className="mx-1">•</span>
                  <span>{video.view_count.toLocaleString()} views</span>
                </>
              )}
              {video.upload_date && (
                <>
                  <span className="mx-1">•</span>
                  <span>{new Date(video.upload_date).toLocaleDateString()}</span>
                </>
              )}
            </div>
            <div className="mt-2 flex items-center">
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                video.processing_status === 'completed' 
                  ? 'bg-green-100 text-green-800' 
                  : video.processing_status === 'failed'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {video.processing_status.charAt(0).toUpperCase() + video.processing_status.slice(1)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default VideoList;
