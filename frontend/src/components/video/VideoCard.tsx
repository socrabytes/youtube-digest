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

  const formatDate = (dateStr: string): string => {
    // Convert YYYYMMDD to readable format
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return new Date(`${year}-${month}-${day}`).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatLikes = (likes: number): string => {
    if (likes >= 1000000) {
      return `${(likes / 1000000).toFixed(1)}M`;
    }
    if (likes >= 1000) {
      return `${(likes / 1000).toFixed(1)}K`;
    }
    return likes.toString();
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
        
        {/* Channel info and primary stats */}
        <div className="flex items-center text-sm text-gray-600 mb-2">
          {video.channel_title && (
            <div className="flex items-center">
              <span className="font-medium">{video.channel_title}</span>
              {video.subscriber_count != null && (
                <span className="text-xs text-gray-500 ml-1">
                  {video.subscriber_count >= 1000000
                    ? `${(video.subscriber_count / 1000000).toFixed(1)}M`
                    : video.subscriber_count >= 1000
                    ? `${(video.subscriber_count / 1000).toFixed(1)}K`
                    : video.subscriber_count} subscribers
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Video stats */}
        <div className="flex items-center text-sm text-gray-600 mb-3">
          {video.view_count && (
            <span className="font-medium">{formatViews(video.view_count)}</span>
          )}
          {video.upload_date && (
            <span className="mx-2">• {formatDate(video.upload_date)}</span>
          )}
          {video.like_count != null && (
            <span className="flex items-center">
              • <svg className="w-4 h-4 mx-1 fill-current" viewBox="0 0 24 24">
                  <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
              </svg>
              {formatLikes(video.like_count)}
            </span>
          )}
          {video.duration && (
            <span className="mx-2">• {formatDuration(video.duration)}</span>
          )}
        </div>
        
        {/* Categories and Tags */}
        <div className="flex flex-wrap gap-2 text-xs mb-3">
          {video.categories && video.categories.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {video.categories.map((category, index) => (
                <span key={index} className="bg-purple-50 text-purple-700 px-2 py-1 rounded-full font-medium">
                  {category}
                </span>
              ))}
            </div>
          )}
          {video.tags && video.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {video.tags.slice(0, 5).map((tag, index) => (
                <span key={index} className="bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                  #{tag.trim()}
                </span>
              ))}
              {video.tags.length > 5 && (
                <span className="text-gray-500 px-2 py-1">
                  +{video.tags.length - 5} more
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-2">
          {video.transcript && (
            <a
              href={video.transcript}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full hover:bg-indigo-200 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              View Transcript
            </a>
          )}
        </div>
        
        {video.description && (
          <div className="mt-2 text-sm text-gray-700 line-clamp-2">
            {video.description}
          </div>
        )}
        
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
