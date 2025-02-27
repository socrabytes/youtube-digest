import React from 'react';
import VideoCard from './VideoCard';
import type { Video } from '@/types/video';

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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {videos.map((video) => (
        <div key={video.id} className="bg-white rounded-lg shadow overflow-hidden transition-all hover:shadow-md">
          <VideoCard 
            video={video} 
            onClick={() => onVideoSelect(video)}
          />
        </div>
      ))}
    </div>
  );
};

export default VideoGrid;
