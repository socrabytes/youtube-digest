import React from 'react';
import type { Video } from '@/types/video';
import Image from 'next/image';

interface VideoCardProps {
  video: Video;
  onClick?: (video: Video) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onClick }) => {
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatViews = (views: number): string => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M views`;
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K views`;
    }
    return `${views} views`;
  };

  // Function to get video ID from YouTube URL
  const getYouTubeVideoId = (url: string): string => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '';
  };

  // Get thumbnail URL from video ID
  const getThumbnailUrl = (url: string): string => {
    const videoId = getYouTubeVideoId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '/placeholder-thumbnail.jpg';
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden cursor-pointer"
      onClick={() => onClick?.(video)}
    >
      <div className="relative aspect-video">
        <Image
          src={getThumbnailUrl(video.url)}
          alt={video.title || 'Video thumbnail'}
          fill
          className="object-cover"
        />
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded">
            {formatDuration(video.duration)}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold line-clamp-2 mb-2">
          {video.title || 'Processing video...'}
        </h3>
        <div className="flex items-center text-sm text-gray-600 mb-2">
          {video.channel_title && (
            <>
              <span>{video.channel_title}</span>
              <span className="mx-2">•</span>
            </>
          )}
          {video.view_count && <span>{formatViews(video.view_count)}</span>}
        </div>
        
        {video.summary ? (
          <div className="mt-3 text-sm text-gray-700">
            <h4 className="font-semibold text-indigo-600 mb-1">Summary</h4>
            <p>{video.summary}</p>
          </div>
        ) : video.processed === false ? (
          <div className="mt-3 text-sm text-gray-500 flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating summary...
          </div>
        ) : null}
        
        {video.error_message && (
          <div className="mt-3 text-sm text-red-600">
            Error: {video.error_message}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCard;
