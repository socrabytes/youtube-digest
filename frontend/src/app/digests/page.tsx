'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { api } from '@/services/api';
import type { Video } from '@/types/video';

export default function DigestsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [channels, setChannels] = useState<any[]>([]);

  useEffect(() => {
    // Fetch videos with digests
    const fetchVideosWithDigests = async () => {
      setIsLoading(true);
      try {
        const data = await api.fetchVideos({ sortBy: 'date', timeRange: 'all', hasDigest: true });
        setVideos(data);
        
        // Don't automatically select a video on initial load
        // This addresses feedback #3
      } catch (err) {
        console.error('Error fetching videos:', err);
        setError('Failed to load videos with digests');
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch categories
    const fetchCategories = async () => {
      try {
        const data = await api.getCategories();
        setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    // Fetch channels
    const fetchChannels = async () => {
      try {
        const data = await api.getChannels();
        setChannels(data);
      } catch (err) {
        console.error('Error fetching channels:', err);
      }
    };

    fetchVideosWithDigests();
    fetchCategories();
    fetchChannels();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Create or update the video
      const digestResponse = await api.createDigest(url);
      setUrl('');
      
      // Refresh the videos list
      const data = await api.fetchVideos({ sortBy: 'date', timeRange: 'all', hasDigest: true });
      setVideos(data);
      
      // Find the newly created digest's video and select it
      const newVideo = data.find(v => v.id === digestResponse.video_id);
      if (newVideo) {
        setSelectedVideo(newVideo);
      } else if (data.length > 0) {
        // Fallback to the first video if we can't find the new one
        setSelectedVideo(data[0]);
      }
    } catch (err: any) {
      console.error('Error creating digest:', err);
      setError(err.message || 'Failed to process video');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVideoSelect = (video: Video) => {
    setSelectedVideo(video);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="large" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-gray-100 min-h-screen p-4 border-r border-gray-200">
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-2">Digests</h3>
            <ul className="space-y-2">
              {videos.map((video) => (
                <li 
                  key={video.id} 
                  className={`cursor-pointer p-2 rounded ${selectedVideo?.id === video.id ? 'bg-blue-100' : 'hover:bg-gray-200'}`}
                  onClick={() => handleVideoSelect(video)}
                >
                  <div className="text-sm font-medium truncate">{video.title}</div>
                </li>
              ))}
              {videos.length === 0 && (
                <li className="text-gray-500 text-sm">No digests available</li>
              )}
            </ul>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-2">Channels</h3>
            <ul className="space-y-2">
              {channels.map((channel) => (
                <li 
                  key={channel.id} 
                  className="cursor-pointer p-2 rounded hover:bg-gray-200"
                >
                  <div className="text-sm font-medium truncate">{channel.title}</div>
                </li>
              ))}
              {channels.length === 0 && (
                <li className="text-gray-500 text-sm">No channels available</li>
              )}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Categories</h3>
            <ul className="space-y-2">
              {categories.map((category, index) => (
                <li 
                  key={index} 
                  className="cursor-pointer p-2 rounded hover:bg-gray-200"
                >
                  <div className="text-sm font-medium truncate">{category}</div>
                </li>
              ))}
              {categories.length === 0 && (
                <li className="text-gray-500 text-sm">No categories available</li>
              )}
            </ul>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* URL Input */}
          <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors duration-200 disabled:bg-blue-400"
                disabled={!url || isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="small" />
                    <span className="ml-2">Processing...</span>
                  </div>
                ) : (
                  'Generate Digest'
                )}
              </button>
            </form>
            {error && <div className="mt-4 text-red-500">{error}</div>}
          </div>

          {selectedVideo ? (
            <>
              {/* Video Display */}
              <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
                <div className="aspect-video bg-gray-200 mb-4 rounded overflow-hidden">
                  {selectedVideo.thumbnail_url ? (
                    <img 
                      src={selectedVideo.thumbnail_url} 
                      alt={selectedVideo.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-gray-500">No thumbnail available</span>
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-bold mb-2">{selectedVideo.title}</h2>
                <div className="flex items-center text-gray-600 mb-2">
                  <span className="mr-4">{selectedVideo.channel_title || 'Unknown channel'}</span>
                  {selectedVideo.view_count && (
                    <span className="mr-4">{selectedVideo.view_count.toLocaleString()} views</span>
                  )}
                  {selectedVideo.upload_date && (
                    <span>Uploaded: {new Date(selectedVideo.upload_date).toLocaleDateString()}</span>
                  )}
                </div>
              </div>

              {/* Metadata */}
              <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-semibold text-lg mb-2">Video Metadata</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p>{Math.floor(selectedVideo.duration / 60)}:{(selectedVideo.duration % 60).toString().padStart(2, '0')}</p>
                  </div>
                  {selectedVideo.like_count !== undefined && (
                    <div>
                      <p className="text-sm text-gray-500">Likes</p>
                      <p>{selectedVideo.like_count.toLocaleString()}</p>
                    </div>
                  )}
                  {selectedVideo.subscriber_count !== undefined && (
                    <div>
                      <p className="text-sm text-gray-500">Channel Subscribers</p>
                      <p>{selectedVideo.subscriber_count.toLocaleString()}</p>
                    </div>
                  )}
                  {selectedVideo.categories && selectedVideo.categories.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500">Categories</p>
                      <p>{selectedVideo.categories.join(', ')}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Digest Content */}
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-semibold text-lg mb-4">Digest</h3>
                {selectedVideo.summary ? (
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-line">{selectedVideo.summary}</p>
                  </div>
                ) : (
                  <p className="text-gray-500">No digest available for this video.</p>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-sm text-center">
              <h2 className="text-2xl font-bold mb-4">Welcome to Your Digests</h2>
              
              {videos.length > 0 ? (
                <div>
                  <p className="text-gray-600 mb-6">
                    You have {videos.length} video digest{videos.length !== 1 ? 's' : ''} available. 
                    Select a video from the sidebar to view its digest.
                  </p>
                  <div className="flex flex-wrap justify-center gap-4 mt-6">
                    {videos.slice(0, 3).map(video => (
                      <div 
                        key={video.id}
                        className="w-64 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => handleVideoSelect(video)}
                      >
                        <div className="aspect-video bg-gray-200 mb-2 rounded overflow-hidden">
                          {video.thumbnail_url ? (
                            <img 
                              src={video.thumbnail_url} 
                              alt={video.title} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-gray-500">No thumbnail</span>
                            </div>
                          )}
                        </div>
                        <h3 className="font-medium text-sm truncate">{video.title}</h3>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 mb-6">
                    You don't have any video digests yet. Enter a YouTube URL above to create your first digest.
                  </p>
                  <div className="p-8 bg-gray-100 rounded-lg max-w-md mx-auto">
                    <p className="text-gray-500 text-sm">
                      YouTube Digest uses AI to create concise summaries of YouTube videos, 
                      helping you quickly understand the content without watching the entire video.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
