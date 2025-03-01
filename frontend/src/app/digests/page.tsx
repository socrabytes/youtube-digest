'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import { useKeyboardShortcut } from '@/utils/useKeyboardShortcut';
import KeyboardShortcutsHelp from '@/components/common/KeyboardShortcutsHelp';
import { api } from '@/services/api';
import type { Video, Channel } from '@/types/video';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const formatTimeToYouTubeTimestamp = (videoId: string, seconds: number): string => {
  return `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(seconds)}s`;
};

const formatSummaryToStructure = (summary: string): { 
  keyTakeaways: string[],
  whyWatch: string[],
  summaryText: string 
} => {
  // Basic parsing for now - in a real implementation, we would use a more robust parsing approach
  // or have the backend return a structured format
  const keyTakeawaysMatch = summary.match(/Key Takeaways:([\s\S]*?)(?=\n\n|$)/i);
  const whyWatchMatch = summary.match(/Why Watch:([\s\S]*?)(?=\n\n|$)/i);
  
  const keyTakeaways = keyTakeawaysMatch 
    ? keyTakeawaysMatch[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
        .map(line => line.trim().replace(/^[-•]\s*/, ''))
    : [];
    
  const whyWatch = whyWatchMatch
    ? whyWatchMatch[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
        .map(line => line.trim().replace(/^[-•]\s*/, ''))
    : [];
    
  // Full summary text with the structured parts removed
  let summaryText = summary;
  if (keyTakeawaysMatch) {
    summaryText = summaryText.replace(keyTakeawaysMatch[0], '');
  }
  if (whyWatchMatch) {
    summaryText = summaryText.replace(whyWatchMatch[0], '');
  }
  
  return {
    keyTakeaways,
    whyWatch,
    summaryText: summaryText.trim()
  };
};

const renderMarkdown = (text: string): { __html: string } => {
  try {
    // Simple markdown conversion - you might want to use a library like marked
    let html = text
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    return { __html: `<p>${html}</p>` };
  } catch (error) {
    console.error('Error rendering markdown:', error);
    return { __html: `<p>${text}</p>` };
  }
};

export default function DigestsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const videoIdParam = searchParams.get('video');
  const urlParam = searchParams.get('url');
  
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
  const [searchTerm, setSearchTerm] = useState('');
  const [channelsOpen, setChannelsOpen] = useState(false);
  const [selectedChannels, setSelectedChannels] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const videosPerPage = 10;

  useEffect(() => {
    // Fetch videos with digests
    const fetchVideosWithDigests = async () => {
      setIsLoading(true);
      try {
        const data = await api.fetchVideos({ sortBy: 'date', timeRange: 'all', hasDigest: true });
        setVideos(data);
        setAllVideos(data);
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

  // This useEffect handles URL parameter changes
  useEffect(() => {
    if (videoIdParam && videos.length > 0) {
      const videoId = parseInt(videoIdParam);
      const selectedVid = videos.find(v => v.id === videoId);
      if (selectedVid) {
        setSelectedVideo(selectedVid);
      }
    }
  }, [videoIdParam, videos]);

  useEffect(() => {
    // If URL parameter exists, try to create a digest
    if (urlParam) {
      setUrl(urlParam);
      // Don't automatically submit to create a digest
      // Just populate the URL field for the user
    }
  }, [urlParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) return;
    
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
        // Update the URL to reflect the selected video
        router.push(`/digests?video=${newVideo.id}`, { scroll: false });
      } else if (data.length > 0) {
        // Fallback to the first video if we can't find the new one
        setSelectedVideo(data[0]);
        router.push(`/digests?video=${data[0].id}`, { scroll: false });
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

  const handleChannelSelect = (channelId: number) => {
    if (selectedChannels.includes(channelId)) {
      setSelectedChannels(selectedChannels.filter(id => id !== channelId));
    } else {
      setSelectedChannels([...selectedChannels, channelId]);
    }
  };

  const handleCategorySelect = (category: string) => {
    if (selectedCategory === category) {
      // If clicking the already selected category, clear the filter
      setSelectedCategory(null);
      setSelectedChannels([]);
      setVideos(allVideos);
    } else {
      // Filter videos by the selected category
      setSelectedCategory(category);
      setSelectedChannels([]);
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

  const filteredVideos = videos.filter(video => 
    video.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    video.channel_title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (video.categories && video.categories.some(category => category.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  // Get current videos for pagination
  const indexOfLastVideo = currentPage * videosPerPage;
  const indexOfFirstVideo = indexOfLastVideo - videosPerPage;
  const currentVideos = filteredVideos.slice(indexOfFirstVideo, indexOfLastVideo);
  const totalPages = Math.ceil(filteredVideos.length / videosPerPage);

  // Keyboard shortcuts
  useKeyboardShortcut('b', () => {
    router.push('/library');
  });

  useKeyboardShortcut('n', () => {
    // Focus on URL input
    const urlInput = document.getElementById('url-input');
    if (urlInput) {
      urlInput.focus();
    }
  });

  useKeyboardShortcut('ArrowUp', () => {
    // Navigate to previous video in the list
    if (!videos.length) return;
    
    const currentIndex = selectedVideo 
      ? videos.findIndex(v => v.id === selectedVideo.id) 
      : -1;
    
    if (currentIndex > 0) {
      setSelectedVideo(videos[currentIndex - 1]);
    }
  });

  useKeyboardShortcut('ArrowDown', () => {
    // Navigate to next video in the list
    if (!videos.length) return;
    
    const currentIndex = selectedVideo 
      ? videos.findIndex(v => v.id === selectedVideo.id) 
      : -1;
    
    if (currentIndex < videos.length - 1 && currentIndex !== -1) {
      setSelectedVideo(videos[currentIndex + 1]);
    }
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="large" text="Loading digests..." />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex">
        {/* Left sidebar - Improved styling */}
        <div className="w-full md:w-64 lg:w-72 flex-shrink-0 bg-white rounded-lg shadow-sm">
          <div className="p-3 border-b border-gray-100">
            <h2 className="text-lg font-bold px-2 mb-2">Digests</h2>
            
            {/* Search box */}
            <div className="relative mb-2">
              <input
                type="text"
                placeholder="Search digests..."
                className="w-full pl-3 pr-10 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        
          {/* Video list with improved styling */}
          <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100" style={{ maxHeight: 'calc(100vh - 250px)' }}>
            {isLoading ? (
              <div className="p-4 text-center">
                <LoadingSpinner size="small" text="Loading videos..." />
              </div>
            ) : currentVideos.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                No videos match your search.
              </div>
            ) : (
              <div>
                {currentVideos.map((video) => (
                  <button
                    key={video.id}
                    onClick={() => handleVideoSelect(video)}
                    className={`w-full text-left p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors
                      ${selectedVideo?.id === video.id ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : ''}`}
                  >
                    <div className="flex items-start space-x-2">
                      {/* Video thumbnail */}
                      <div className="flex-shrink-0 w-16 h-9 bg-gray-200 rounded overflow-hidden">
                        {video.thumbnail_url ? (
                          <img 
                            src={video.thumbnail_url} 
                            alt={video.title} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-xs text-gray-400">No image</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="overflow-hidden flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{video.title}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {video.channel_title || 
                            (channels.find(c => c.id === video.channel_id)?.name) || 
                            'Unknown channel'}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
                
                {/* Pagination Controls */}
                {filteredVideos.length > videosPerPage && (
                  <div className="p-3 flex justify-between items-center border-t border-gray-100">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`px-2 py-1 rounded text-sm ${
                        currentPage === 1 
                          ? 'text-gray-400 cursor-not-allowed' 
                          : 'text-indigo-600 hover:bg-indigo-50'
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      ←
                    </button>
                    
                    <span className="text-sm text-gray-500">
                      {currentPage} of {totalPages}
                    </span>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`px-2 py-1 rounded text-sm ${
                        currentPage === totalPages 
                          ? 'text-gray-400 cursor-not-allowed' 
                          : 'text-indigo-600 hover:bg-indigo-50'
                      }`}
                    >
                      <span className="sr-only">Next</span>
                      →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Channels section with collapsible UI */}
          <div className="mt-2 border-t border-gray-100">
            <button 
              className="flex items-center justify-between w-full p-3 text-left font-medium"
              onClick={() => setChannelsOpen(!channelsOpen)}
            >
              <h3 className="text-md font-bold">Channels</h3>
              <svg 
                className={`h-4 w-4 text-gray-500 transform transition-transform ${channelsOpen ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {channelsOpen && (
              <div className="px-3 pb-3 space-y-1">
                {channels.map((channel) => (
                  <div key={channel.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`channel-${channel.id}`}
                      className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                      checked={selectedChannels.includes(channel.id)}
                      onChange={() => handleChannelSelect(channel.id)}
                    />
                    <label
                      htmlFor={`channel-${channel.id}`}
                      className="ml-2 text-sm text-gray-600 block truncate"
                    >
                      {channel.name}
                    </label>
                  </div>
                ))}
              </div>
            )}
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
                className="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                id="url-input"
                disabled={isSubmitting}
              />
              <button 
                type="submit"
                disabled={isSubmitting || !url}
                className={`${
                  isSubmitting || !url ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                } text-white font-medium py-2 px-4 rounded-md transition-colors`}
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
            {error && <div className="mt-4"><ErrorDisplay title="Error" message={error} level="error" /></div>}
          </div>

          {!selectedVideo && !isSubmitting && (
            <div className="flex-1 p-8 flex items-center justify-center">
              <EmptyState
                title="No digest selected"
                description="Select a video from the list or enter a URL to generate a new digest."
                icon={<svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
              />
            </div>
          )}

          {selectedVideo && (
            <>
              {/* Video Display - Redesigned for better balance */}
              <div className="mb-6 bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Back button and video header with thumbnail background and overlay */}
                <div className="relative">
                  {/* Back to Library button */}
                  <button 
                    onClick={() => router.push('/library')}
                    className="absolute top-4 left-4 z-10 flex items-center justify-center bg-black/30 hover:bg-black/50 text-white px-3 py-2 rounded-md transition-colors"
                    aria-label="Back to library"
                  >
                    <ArrowLeftIcon className="h-4 w-4 mr-1" />
                    <span className="text-sm">Library</span>
                  </button>
                  
                  {/* Background thumbnail with overlay */}
                  <div className="relative h-48 md:h-64 overflow-hidden">
                    {selectedVideo.thumbnail_url ? (
                      <>
                        <img 
                          src={selectedVideo.thumbnail_url} 
                          alt={selectedVideo.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-indigo-900/90"></div>
                      </>
                    ) : (
                      <div className="w-full h-full bg-indigo-900"></div>
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

              {/* Digest Content - Now more structured with chapters */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="font-semibold text-xl mb-4 text-indigo-800">Digest</h3>
                {selectedVideo.summary ? (
                  <div className="space-y-6">
                    {/* Structured summary display */}
                    {(() => {
                      const { keyTakeaways, whyWatch, summaryText } = formatSummaryToStructure(selectedVideo.summary);
                      
                      return (
                        <>
                          {/* Key Takeaways Section */}
                          {keyTakeaways.length > 0 && (
                            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                              <h4 className="font-medium text-indigo-800 mb-2">Key Takeaways</h4>
                              <ul className="list-disc list-inside space-y-1">
                                {keyTakeaways.map((point, idx) => (
                                  <li key={idx} className="text-gray-700">{point}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {/* Why Watch Section */}
                          {whyWatch.length > 0 && (
                            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                              <h4 className="font-medium text-green-800 mb-2">Why Watch</h4>
                              <ul className="list-disc list-inside space-y-1">
                                {whyWatch.map((point, idx) => (
                                  <li key={idx} className="text-gray-700">{point}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {/* Chapters Section */}
                          {selectedVideo.chapters && selectedVideo.chapters.length > 0 && (
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                              <h4 className="font-medium text-blue-800 mb-2">Chapters</h4>
                              <div className="space-y-2">
                                {selectedVideo.chapters.map((chapter, idx) => (
                                  <div key={idx} className="flex items-start">
                                    <a 
                                      href={formatTimeToYouTubeTimestamp(selectedVideo.youtube_id, chapter.start_time)} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-block py-1 px-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                    >
                                      {chapter.timestamp}
                                    </a>
                                    <span className="ml-2 text-gray-700">{chapter.title}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Summary Text */}
                          {summaryText && (
                            <div className="prose max-w-none">
                              <div dangerouslySetInnerHTML={renderMarkdown(summaryText)} />
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded border border-gray-200 text-gray-500">
                    <p>No digest available for this video.</p>
                    <p className="text-sm mt-2">This could be because the video is still being processed or doesn't have a transcript available.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        
        {/* Keyboard Shortcuts Help */}
        <KeyboardShortcutsHelp
          shortcuts={[
            { key: '?', description: 'Show keyboard shortcuts', category: 'General' },
            { key: 'b', description: 'Back to library', category: 'Navigation' },
            { key: 'n', description: 'Focus URL input', category: 'Content' },
            { key: '↑', description: 'Previous video', category: 'Navigation' },
            { key: '↓', description: 'Next video', category: 'Navigation' },
          ]}
        />
      </div>
    </MainLayout>
  );
}
