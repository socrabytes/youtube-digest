'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { api } from '@/services/api';
import type { Video, Channel } from '@/types/video';

export default function DigestsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [videos, setVideos] = useState<Video[]>([]);
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    // Fetch videos with digests
    const fetchVideosWithDigests = async () => {
      setIsLoading(true);
      try {
        const data = await api.fetchVideos({ sortBy: 'date', timeRange: 'all', hasDigest: true });
        setVideos(data);
        setAllVideos(data);
        
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
      setAllVideos(data);
      
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

  const handleChannelSelect = (channelId: number, channelName: string) => {
    if (selectedChannel === channelId) {
      // If clicking the already selected channel, clear the filter
      setSelectedChannel(null);
      setSelectedCategory(null);
      setVideos(allVideos);
    } else {
      // Filter videos by the selected channel
      setSelectedChannel(channelId);
      setSelectedCategory(null);
      const filteredVideos = allVideos.filter(video => 
        video.channel_id && video.channel_id.toString() === channelId.toString()
      );
      setVideos(filteredVideos);
    }
  };

  const handleCategorySelect = (category: string) => {
    if (selectedCategory === category) {
      // If clicking the already selected category, clear the filter
      setSelectedCategory(null);
      setSelectedChannel(null);
      setVideos(allVideos);
    } else {
      // Filter videos by the selected category
      setSelectedCategory(category);
      setSelectedChannel(null);
      const filteredVideos = allVideos.filter(video => 
        video.categories && video.categories.includes(category)
      );
      setVideos(filteredVideos);
    }
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
          {(selectedChannel || selectedCategory) && (
            <div className="mb-4 p-2 bg-blue-50 rounded border border-blue-100">
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-800">
                  {videos.length} video{videos.length !== 1 ? 's' : ''} found
                </span>
                <button 
                  onClick={() => {
                    setSelectedChannel(null);
                    setSelectedCategory(null);
                    setVideos(allVideos);
                  }}
                  className="text-xs text-blue-700 hover:text-blue-900"
                >
                  Clear filters
                </button>
              </div>
              {selectedChannel && (
                <div className="text-xs text-blue-700 mt-1">
                  Channel: {channels.find(c => c.id === selectedChannel)?.name}
                </div>
              )}
              {selectedCategory && (
                <div className="text-xs text-blue-700 mt-1">
                  Category: {selectedCategory}
                </div>
              )}
            </div>
          )}
          
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
                  className={`cursor-pointer p-2 rounded ${selectedChannel === channel.id ? 'bg-blue-100' : 'hover:bg-gray-200'}`}
                  onClick={() => handleChannelSelect(channel.id, channel.name)}
                >
                  <div className="text-sm font-medium truncate">{channel.name}</div>
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
                  className={`cursor-pointer p-2 rounded ${selectedCategory === category ? 'bg-blue-100' : 'hover:bg-gray-200'}`}
                  onClick={() => handleCategorySelect(category)}
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
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Thumbnail - smaller and to the side on larger screens */}
                  <div className="md:w-1/3">
                    <div className="aspect-video bg-gray-200 rounded overflow-hidden">
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
                  </div>
                  
                  {/* Video info - takes more space */}
                  <div className="md:w-2/3">
                    <h2 className="text-xl font-bold mb-2">{selectedVideo.title}</h2>
                    <div className="flex flex-wrap items-center text-gray-600 mb-3">
                      {selectedVideo.channel_title ? (
                        <span className="mr-4">{selectedVideo.channel_title}</span>
                      ) : null}
                      {selectedVideo.view_count ? (
                        <span className="mr-4">{selectedVideo.view_count.toLocaleString()} views</span>
                      ) : null}
                      {selectedVideo.upload_date && selectedVideo.upload_date !== "null" ? (
                        <span>Uploaded: {new Date(selectedVideo.upload_date).toLocaleDateString()}</span>
                      ) : null}
                    </div>
                    
                    {/* Quick metadata highlights */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {selectedVideo.duration && (
                        <div className="flex items-center">
                          <span className="text-gray-500 mr-1">Duration:</span>
                          <span>{Math.floor(selectedVideo.duration / 60)}:{(selectedVideo.duration % 60).toString().padStart(2, '0')}</span>
                        </div>
                      )}
                      {selectedVideo.like_count !== undefined && (
                        <div className="flex items-center">
                          <span className="text-gray-500 mr-1">Likes:</span>
                          <span>{selectedVideo.like_count.toLocaleString()}</span>
                        </div>
                      )}
                      {selectedVideo.categories && selectedVideo.categories.length > 0 && (
                        <div className="col-span-2 flex items-center">
                          <span className="text-gray-500 mr-1">Categories:</span>
                          <span>{selectedVideo.categories.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Digest Content - Now more prominent */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="font-semibold text-xl mb-4 text-blue-800">Digest</h3>
                {selectedVideo.summary ? (
                  <div className="prose max-w-none">
                    {selectedVideo.summary.includes('**') || selectedVideo.summary.includes('#') ? (
                      // If the summary contains markdown formatting, render it as is
                      <p className="whitespace-pre-line">{selectedVideo.summary}</p>
                    ) : (
                      // Otherwise, try to structure it with paragraphs for better readability
                      selectedVideo.summary.split('\n\n').map((paragraph, index) => (
                        <p key={index} className="mb-4">{paragraph}</p>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded border border-gray-200 text-gray-500">
                    <p>No digest available for this video.</p>
                    <p className="text-sm mt-2">This could be because the video is still being processed or doesn't have a transcript available.</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-sm text-center">
              <h2 className="text-2xl font-bold mb-4">Welcome to Your Digests</h2>
              
              {videos.length > 0 ? (
                <div>
                  <p className="text-gray-600 mb-6">
                    Select a video from the sidebar to view its digest.
                  </p>
                  <div className="flex justify-center mt-8">
                    <div className="max-w-md p-6 bg-blue-50 rounded-lg border border-blue-100">
                      <h3 className="text-lg font-medium text-blue-800 mb-2">How to use Digests</h3>
                      <ul className="text-sm text-blue-700 list-disc pl-5 space-y-2">
                        <li>Browse your digests in the sidebar</li>
                        <li>Click on any digest to view its summary</li>
                        <li>Add new digests using the YouTube URL field above</li>
                        <li>Filter by channels or categories using the sidebar</li>
                      </ul>
                    </div>
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
