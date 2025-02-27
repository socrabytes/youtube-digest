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

  // Format date string safely
  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr || dateStr === "null" || dateStr === "Invalid Date") return "Unknown";
    
    // Try different date formats
    try {
      // Check if it's a YYYYMMDD format
      if (/^\d{8}$/.test(dateStr)) {
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        return new Date(`${year}-${month}-${day}`).toLocaleDateString();
      }
      
      // Try standard date parsing
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString();
      }
      
      return "Unknown";
    } catch (e) {
      return "Unknown";
    }
  };

  // Simple markdown renderer using HTML
  const renderMarkdown = (text: string) => {
    // Replace headers
    let html = text
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-5 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>');
    
    // Replace bold and italic
    html = html
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>');
    
    // Replace lists
    html = html
      .replace(/^\s*\d+\.\s+(.*$)/gim, '<li class="ml-6 list-decimal">$1</li>')
      .replace(/^\s*[\-\*]\s+(.*$)/gim, '<li class="ml-6 list-disc">$1</li>');
    
    // Replace paragraphs (must be done last)
    html = html
      .replace(/\n\n/gim, '</p><p class="mb-4">')
      .replace(/\n/gim, '<br>');
    
    return { __html: `<p class="mb-4">${html}</p>` };
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
              {/* Video Display - Redesigned for better balance */}
              <div className="mb-6 bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Video header with thumbnail background and overlay */}
                <div className="relative">
                  {/* Background thumbnail with overlay */}
                  <div className="relative h-48 md:h-64 overflow-hidden">
                    {selectedVideo.thumbnail_url ? (
                      <>
                        <img 
                          src={selectedVideo.thumbnail_url} 
                          alt={selectedVideo.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/80"></div>
                      </>
                    ) : (
                      <div className="w-full h-full bg-gray-800"></div>
                    )}
                    
                    {/* Video title and channel overlaid on the thumbnail */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <h2 className="text-xl md:text-2xl font-bold mb-2 drop-shadow-md">{selectedVideo.title}</h2>
                      <p className="text-sm md:text-base">
                        {selectedVideo.channel_title || 
                          (channels.find(c => c.id === selectedVideo.channel_id)?.name) || 
                          'Unknown channel'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Video metadata in a clean grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-1 gap-y-2 p-4 bg-white text-center">
                  {/* Views */}
                  <div className="px-3 py-2">
                    <p className="text-gray-500 text-sm">Views</p>
                    <p className="font-medium">{selectedVideo.view_count?.toLocaleString() || 'Unknown'}</p>
                  </div>
                  
                  {/* Upload Date */}
                  <div className="px-3 py-2">
                    <p className="text-gray-500 text-sm">Uploaded</p>
                    <p className="font-medium">{formatDate(selectedVideo.upload_date)}</p>
                  </div>
                  
                  {/* Duration */}
                  <div className="px-3 py-2">
                    <p className="text-gray-500 text-sm">Duration</p>
                    <p className="font-medium">{selectedVideo.duration ? 
                      `${Math.floor(selectedVideo.duration / 60)}:${(selectedVideo.duration % 60).toString().padStart(2, '0')}` : 
                      'Unknown'}</p>
                  </div>
                  
                  {/* Likes */}
                  <div className="px-3 py-2">
                    <p className="text-gray-500 text-sm">Likes</p>
                    <p className="font-medium">{selectedVideo.like_count?.toLocaleString() || 'Unknown'}</p>
                  </div>
                </div>
                
                {/* Categories if available */}
                {selectedVideo.categories && selectedVideo.categories.length > 0 && (
                  <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                    <p className="text-sm text-gray-500 mb-1">Categories</p>
                    <p>{selectedVideo.categories.join(', ')}</p>
                  </div>
                )}
              </div>

              {/* Digest Content - Now more prominent */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="font-semibold text-xl mb-4 text-blue-800">Digest</h3>
                {selectedVideo.summary ? (
                  <div className="prose max-w-none" dangerouslySetInnerHTML={renderMarkdown(selectedVideo.summary)} />
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
