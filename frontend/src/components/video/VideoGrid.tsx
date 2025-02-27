import React from 'react';
import VideoCard from './VideoCard';
import type { Video } from '@/types/video';
import LoadingSpinner from '../common/LoadingSpinner';

interface VideoGridProps {
  videos: Video[];
  isLoading: boolean;
  onVideoClick: (video: Video) => void;
  onRefresh?: () => void;
}

const VideoGrid: React.FC<VideoGridProps> = ({ 
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4">
      {videos.map((video) => (
        <div key={video.id} className="transition-transform duration-200 hover:scale-105">
          <VideoCard 
            video={video} 
            onClick={() => onVideoClick(video)}
            onRefresh={onRefresh}
          />
        </div>
      ))}
    </div>
  );
};

export default VideoGrid;
