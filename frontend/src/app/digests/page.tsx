'use client';

import React, { useState, useEffect, useRef, Suspense, Fragment, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import KeyboardShortcutsHelp from '@/components/common/KeyboardShortcutsHelp';
import { api } from '@/services/api';
import type { Video, Channel } from '@/types/video';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { marked } from 'marked';

// ... (rest of the code remains the same)

// Define the structure for the extracted digest sections
interface DigestStructure {
  oneLineSummary: string;
  keyTakeaways: string[];
  whyWatch: string[];
  detailedContent: string;
}

// Regex patterns
const conciseSummaryRegex = /## (?:✨ )?Concise Summary\s*(?:\r?\n|\r)([\s\S]*?)(?:(?:\r?\n|\r)##|$)/i;
const keyTakeawaysRegex = /## (?:🔑 )?Key Takeaways\s*(?:\r?\n|\r)((?:- \[ \].*|\*.*|-.*|\d+\..*)(?:\s*(?:\r?\n|\r)(?:- \[ \].*|\*.*|-.*|\d+\..*))*)/i;
// Direct regex to find 'Reasons to Watch:' list anywhere in the text
const reasonsToWatchRegex = /\*\*Reasons to Watch:\*\*\s*(?:\r?\n|\r|)((?:- \[ \].*|\*.*|-.*|\d+\..*)(?:\s*(?:\r?\n|\r)(?:- \[ \].*|\*.*|-.*|\d+\..*))*)/i;
// Direct match for the exact Target Audience & Value text as seen in the console
const targetAudienceHeadingRegex = /Target\s+Audience\s+&\s+Value\s+(?=\*\*Audience)/i;

// Function to extract sections from markdown
const extractMarkdownSections = (markdownText: string): DigestStructure => {
  // Use let for remainingText as it will be modified
  let oneLineSummary = '';
  let keyTakeaways: string[] = [];
  let whyWatch: string[] = [];
  let detailedContent = '';
  let remainingText = markdownText; // Start with the full text

  // 1. Extract Concise Summary
  const conciseMatch = remainingText.match(conciseSummaryRegex);
  if (conciseMatch && conciseMatch[1]) {
    oneLineSummary = conciseMatch[1].trim();
    // Remove the concise summary part from the main text to avoid duplication
    remainingText = remainingText.replace(conciseSummaryRegex, '').trim();
  } else {
    // Fallback: Use the first non-empty line if no ## Concise Summary heading
    const lines = remainingText.split(/\r?\n|\r/);
    oneLineSummary = lines.find(line => line.trim().length > 0) || 'No summary available.';
    // Remove the extracted first line
    const firstLineIndex = remainingText.indexOf(oneLineSummary);
    if (firstLineIndex !== -1) {
      remainingText = remainingText.substring(firstLineIndex + oneLineSummary.length).trim();
    }
  }

  // 2. Extract Key Takeaways
  const keyTakeawaysMatch = remainingText.match(keyTakeawaysRegex);
  if (keyTakeawaysMatch && keyTakeawaysMatch[1]) {
    const keyTakeawaysText = keyTakeawaysMatch[1].trim();
    // Split key takeaways into individual points
    keyTakeaways = keyTakeawaysText.split(/\r?\n|\r/)
      .map(line => line.replace(/^\s*[-*\d.]+\s*/, '').trim())
      .filter(line => line.length > 0);
    // Remove the key takeaways part from the main text to avoid duplication
    remainingText = remainingText.replace(keyTakeawaysRegex, '').trim();
  }

  // 3. Find 'Reasons to Watch:' list directly anywhere in the content
  const reasonsMatch = remainingText.match(reasonsToWatchRegex);
  if (reasonsMatch?.[1]) {
    // Split into list items, remove markdown list markers (*, -, digits.) and trim
    whyWatch = reasonsMatch[1].split(/\r?\n|\r/)
      .map(line => line.replace(/^\s*[-*\d.]+\s*/, '').trim())
      .filter(line => line.length > 0);
    
    // Remove the matched 'Reasons to Watch:' section to avoid duplication
    remainingText = remainingText.replace(reasonsToWatchRegex, '').trim();
  }
  
  // 4. Remove only the 'Target Audience & Value' text before the Audience information
  // Very precise removal based on exactly what we saw in the console
  remainingText = remainingText.replace(targetAudienceHeadingRegex, '').trim();

  // 4. Assign the *rest* of the text to detailedContent
  // Any remaining text after extracting the concise summary, key takeaways, and why watch is considered detailed content.
  detailedContent = remainingText.trim();

  // Return the simplified structure
  const result = {
    oneLineSummary,
    keyTakeaways,
    whyWatch,
    detailedContent,
  };
  return result;
};

// ... (rest of the code remains the same)

// Create a wrapper component that uses useSearchParams
function DigestsPageContent() {
  // This component uses useSearchParams and will be wrapped in Suspense
  const searchParams = useSearchParams();

  // Pass searchParams to the main component
  return <DigestsPageImpl searchParamsObj={searchParams} />;
}

// Main component implementation that doesn't directly use useSearchParams
function DigestsPageImpl({ searchParamsObj }: { searchParamsObj: URLSearchParams }) {
  console.log('[DigestsPageImpl] Component Rendering - Timestamp:', Date.now());

  const router = useRouter();
  const searchParams = searchParamsObj;
  const videoIdParam = searchParams.get('video');
  const urlParam = searchParams.get('url');

  const [isLoading, setIsLoading] = useState(true);
  const [videos, setVideos] = useState<Video[]>([]);
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [channelsOpen, setChannelsOpen] = useState(false);
  const [selectedChannels, setSelectedChannels] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const videosPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Use a ref to track the last fetched video ID to prevent infinite loops
  const lastFetchedVideoIdRef = useRef<number | null>(null);
  const lastLoadedDigestVideoIdRef = useRef<number | null>(null); // Ref for loadLatestDigest effect

  // Memoize the extracted digest sections to avoid re-calculating on every render
  const digestSections = useMemo(() => {
    if (selectedVideo?.summary) {
      return extractMarkdownSections(selectedVideo.summary);
    }
    // Return default structure if no summary
    return { oneLineSummary: '', keyTakeaways: [], whyWatch: [], detailedContent: '' };
  }, [selectedVideo?.summary]); // Re-run only when the summary changes

  // Helper to format time (MM:SS or HH:MM:SS) into seconds
  const timeToSeconds = (timeStr: string): number => {
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 3) { // HH:MM:SS
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) { // MM:SS
      return parts[0] * 60 + parts[1];
    }
    return 0;
  };

  // Helper function to render markdown with clickable timestamps
  const renderMarkdown = (text: string, videoId?: string): { __html: string } => {
    if (!text) return { __html: '' };

    let html = marked.parse(text) as string;

    // Replace explicit [MM:SS](t=seconds) format
    html = html.replace(/\[(\d{1,2}:\d{2}(?::\d{2})?)\]\(t=(\d+)\)/g, (match, time, seconds) => {
      if (videoId) {
        return `<a href="https://www.youtube.com/watch?v=${videoId}&t=${seconds}s" target="_blank" rel="noopener noreferrer" class="inline-block py-0.5 px-1.5 mr-1 bg-purple-100 text-purple-700 rounded font-mono hover:bg-purple-200 transition-colors text-xs">${time}</a>`;
      }
      return time; // Don't link if no videoId
    });

    // Replace regular timestamps (MM:SS or HH:MM:SS)
    html = html.replace(/(?<!href=")(?<!\d)(\d{1,2}:\d{2}(?::\d{2})?)(?!\d)/g, (match, time) => {
      const seconds = timeToSeconds(time);
      if (videoId && seconds > 0) {
        return `<a href="https://www.youtube.com/watch?v=${videoId}&t=${seconds}s" target="_blank" rel="noopener noreferrer" class="inline-block py-0.5 px-1.5 mr-1 bg-purple-100 text-purple-700 rounded font-mono hover:bg-purple-200 transition-colors text-xs">${time}</a>`;
      }
      return time; // Don't link if no videoId or invalid time
    });

    // Basic sanitization (marked does some, but extra checks can be added if needed)
    // For now, assuming marked's default sanitization is sufficient.
    
    return { __html: html };
  };

  useEffect(() => {
    console.log('[DigestsPageImpl] useEffect - fetchVideos executing');
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

  useEffect(() => {
    console.log('[DigestsPageImpl] useEffect - URL Param change handler executing. videoIdParam:', videoIdParam, 'videos length:', videos.length);
    // This useEffect handles URL parameter changes
    if (videoIdParam && videos.length > 0) {
      console.log('  Video ID param detected:', videoIdParam);
      const videoId = parseInt(videoIdParam);
      
      // Skip if we've already fetched this video in this session
      if (lastFetchedVideoIdRef.current === videoId) {
        console.log('  Skipping fetch - already fetched video ID:', videoId);
        return;
      }
      
      console.log('  Fetching fresh video data from API for videoId:', videoId);
      const fetchVideo = async () => {
        try {
          // Set ref before the fetch to prevent concurrent requests
          lastFetchedVideoIdRef.current = videoId;
          
          const video = await api.getVideo(videoId);
          if (video) {
            console.log('  Successfully fetched fresh video by ID:', video);
            
            // Just update the selected video without modifying lists directly
            setSelectedVideo(video);
          }
        } catch (error) {
          console.error('  Error fetching video by ID:', error);
          
          // Fallback to local cache only if API call fails
          const selectedVid = videos.find(v => v.id === videoId);
          if (selectedVid) {
            console.log('  Falling back to cached video data:', selectedVid);
            setSelectedVideo(selectedVid);
          }
        }
      };
      fetchVideo();
    }
  }, [videoIdParam, videos]);

  useEffect(() => {
    console.log('[DigestsPageImpl] useEffect - Filtering videos executing. Dependencies:', { selectedCategory, selectedChannels });
    // This useEffect handles filtering based on channel/category
    const filterVideos = () => {
      if (selectedCategory) {
        const filteredVideos = allVideos.filter(video => 
          video.categories && video.categories.includes(selectedCategory)
        );
        setVideos(filteredVideos);
      } else if (selectedChannels.length > 0) {
        const filteredVideos = allVideos.filter(video => 
          selectedChannels.includes(video.channel_id)
        );
        setVideos(filteredVideos);
      } else {
        setVideos(allVideos);
      }
    };
    filterVideos();
  }, [selectedCategory, selectedChannels, allVideos]); // Re-run when filter criteria or allVideos change

  useEffect(() => {
    console.log('[DigestsPageImpl] useEffect - Keyboard shortcuts handler executing');
    // Keyboard shortcuts
    const keyboardShortcuts: Record<string, () => void> = {
      'b': () => router.push('/library'),
      'n': () => {
        const urlInput = document.getElementById('url-input');
        if (urlInput) {
          urlInput.focus();
        }
      },
      'ArrowUp': () => {
        if (videos.length > 0 && selectedVideo) {
          const currentIndex = videos.findIndex(v => v.id === selectedVideo.id);
          if (currentIndex > 0) {
            setSelectedVideo(videos[currentIndex - 1]);
          }
        }
      },
      'ArrowDown': () => {
        if (videos.length > 0 && selectedVideo) {
          const currentIndex = videos.findIndex(v => v.id === selectedVideo.id);
          if (currentIndex < videos.length - 1) {
            setSelectedVideo(videos[currentIndex + 1]);
          }
        }
      },
      'f': () => {
        const fetchVideosWithDigests = async () => {
          setIsLoading(true);
          try {
            const data = await api.fetchVideos({ 
              sortBy: 'date', 
              hasDigest: true, 
              timeRange: 'all' // Add required timeRange property
            });
            setVideos(data);
            setAllVideos(data);
          } catch (err) {
            console.error('Error fetching videos:', err);
            setError('Failed to load videos with digests');
          } finally {
            setIsLoading(false);
          }
        };
        fetchVideosWithDigests();
      },
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      const key = event.key.toLowerCase();
      if (key in keyboardShortcuts) {
        event.preventDefault();
        keyboardShortcuts[key]();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [videos, selectedVideo]);

  // This useEffect ensures we load the latest digest for the selected video
  useEffect(() => {
    console.log('[DigestsPageImpl] useEffect - loadLatestDigest executing. selectedVideo ID:', selectedVideo?.id);
    if (selectedVideo?.id) {
      // Prevent re-fetching if this effect already ran for the current ID
      if (lastLoadedDigestVideoIdRef.current === selectedVideo.id) {
        console.log('  Skipping loadLatestDigest - already processed ID:', selectedVideo.id);
        return;
      }
      console.log('  Selected video changed, checking for latest digest...');
      
      const loadLatestDigest = async () => {
        try {
          // Set ref before fetch
          lastLoadedDigestVideoIdRef.current = selectedVideo.id;
          // Fetch the latest video data to ensure we have the most recent digest
          const freshVideo = await api.getVideo(selectedVideo.id);
          if (freshVideo) {
            console.log('  Refreshed video data:', freshVideo);
            // Update only the current selectedVideo, not the entire list
            setSelectedVideo(freshVideo);
          }
        } catch (error) {
          console.error('  Failed to refresh video data:', error);
        }
      };
      
      loadLatestDigest();
    }
  }, [selectedVideo?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('[DigestsPageImpl] handleSubmit executing');
    e.preventDefault();
    if (!url.trim()) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log('  Creating digest with URL:', url);
      // Call the API to create a digest
      const digestResponse = await api.createDigest(url);
      console.log('  Digest creation response:', digestResponse);
      
      if (digestResponse.id) {
        console.log('  Digest created successfully, video_id:', digestResponse.video_id);
        
        // First refresh the videos list to include the new video
        try {
          const updatedVideos = await api.fetchVideos({ 
            sortBy: 'date', 
            hasDigest: true, 
            timeRange: 'all' // Add required timeRange property
          });
          setVideos(updatedVideos);
          setAllVideos(updatedVideos);
          console.log('  Videos refreshed, found video:', updatedVideos.find(v => v.id === digestResponse.video_id));
          
          // Get the specific video with digest
          const newVideo = await api.getVideo(digestResponse.video_id);
          console.log('  Fetched new video with digest:', newVideo);
          
          // Set the selected video directly instead of relying on navigation
          setSelectedVideo(newVideo);
          
          // Update the URL without triggering a page reload
          window.history.pushState(
            {}, 
            '', 
            `/digests?video=${digestResponse.video_id}`
          );
        } catch (refreshError) {
          console.error('  Error refreshing videos:', refreshError);
        }
      } else {
        console.error('  Missing digest ID in response', digestResponse);
        setError('Failed to create digest');
      }
    } catch (error) {
      console.error('  Error creating digest:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
      // Reset URL field after submission
      setUrl('');
    }
  };

  const handleVideoSelect = (video: Video) => {
    console.log('[DigestsPageImpl] handleVideoSelect called with video:', video.id, 'Title:', video.title);
    
    // Use Next.js router for navigation (as confirmed in library page)
    // Let the URL change trigger the useEffect to load the video
    try {
      console.log('[DigestsPageImpl] Attempting router.push...');
      router.push(`/digests?video=${video.id}`);
      console.log('[DigestsPageImpl] router.push executed.');
    } catch (e: unknown) {
      console.error('[DigestsPageImpl] router.push failed:', e);
    }
  };

  const handleChannelSelect = (channelId: number) => {
    console.log('[DigestsPageImpl] handleChannelSelect:', channelId);
    if (selectedChannels.includes(channelId)) {
      setSelectedChannels(selectedChannels.filter(id => id !== channelId));
    } else {
      setSelectedChannels([...selectedChannels, channelId]);
    }
  };

  const handleCategorySelect = (category: string) => {
    console.log('[DigestsPageImpl] handleCategorySelect:', category);
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
    (video.channel_title && video.channel_title.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (video.categories && video.categories.some(category => category.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  // Get current videos for pagination
  const indexOfLastVideo = currentPage * videosPerPage;
  const indexOfFirstVideo = indexOfLastVideo - videosPerPage;
  const currentVideos = filteredVideos.slice(indexOfFirstVideo, indexOfLastVideo);
  const totalPages = Math.ceil(filteredVideos.length / videosPerPage);

  console.log('[DigestsPageImpl] Returning JSX. isLoading:', isLoading, 'error:', error, 'selectedVideo:', selectedVideo?.id);

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
        {/* Left sidebar */}
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
        
          {/* Video list */}
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
                    onClick={() => {
                      console.log(`[DigestsPage] onClick handler entered for video: ${video.id}`);
                      console.log(`[DigestsPage] Button clicked for video: ${video.id}`)
                      handleVideoSelect(video)
                    }}
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
                          <div className="w-full h-full bg-indigo-900"></div>
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
                      className={`${
                        currentPage === 1 
                          ? 'text-gray-400 cursor-not-allowed' 
                          : 'text-indigo-600 hover:bg-indigo-50'
                      } text-sm px-2 py-1 rounded`}
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
                      className={`${
                        currentPage === totalPages 
                          ? 'text-gray-400 cursor-not-allowed' 
                          : 'text-indigo-600 hover:bg-indigo-50'
                      } text-sm px-2 py-1 rounded`}
                    >
                      <span className="sr-only">Next</span>
                      →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Channels section */}
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
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700">Generate Digest</h3>
            <form onSubmit={handleSubmit} className="mt-4">
              <div className="mb-4">
                <label htmlFor="url-input" className="block text-sm font-medium text-gray-700 mb-1">YouTube URL</label>
                <input
                  id="url-input"
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter YouTube URL"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting || !url}
                className={`w-full ${
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

          {/* Video Display */}
          {selectedVideo && (
            <div key={`video-${selectedVideo.id}`} className="mb-6 bg-white rounded-lg shadow-sm overflow-hidden">
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
                    <h2 className="text-xl md:text-2xl font-bold mb-2 drop-shadow-md" data-video-id={selectedVideo.id}>{selectedVideo.title}</h2>
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
          )}

          {/* Display message when no digest is available */}
          {selectedVideo && !selectedVideo.summary && (
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-xl mb-4 text-indigo-800 flex items-center">
                <DocumentTextIcon className="w-5 h-5 mr-2" />
                <span>Digest</span>
              </h3>
              
              <div className="bg-gray-50 p-4 rounded border border-gray-200 text-gray-500">
                <p>No digest available for this video.</p>
                <p className="text-sm mt-2">This could be because the video is still being processed or doesn't have a transcript available.</p>
              </div>
            </div>
          )}

          {/* Digest Content */}
          {selectedVideo && selectedVideo.summary && (
            <div key={`digest-${selectedVideo.id}`} className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-xl mb-4 text-indigo-800 flex items-center">
                <DocumentTextIcon className="w-5 h-5 mr-2" />
                <span>Digest</span>
              </h3>
              
              {/* Tab navigation */}
              <div>
                <div className="flex space-x-1 rounded-xl bg-indigo-900/20 p-1 mb-4">
                      <button
                        onClick={() => setActiveTab(0)}
                        className={`
                          w-full rounded-lg py-2.5 text-sm font-medium leading-5
                          ring-white/60 ring-offset-2 ring-offset-indigo-400 focus:outline-none focus:ring-2
                          ${activeTab === 0
                            ? 'bg-white text-indigo-700 shadow'
                            : 'text-indigo-100 hover:bg-white/[0.12] hover:text-white'
                          }
                        `}
                      >
                        Overview
                      </button>
                      <button
                        onClick={() => setActiveTab(1)}
                        className={`
                          w-full rounded-lg py-2.5 text-sm font-medium leading-5
                          ring-white/60 ring-offset-2 ring-offset-indigo-400 focus:outline-none focus:ring-2
                          ${activeTab === 1
                            ? 'bg-white text-indigo-700 shadow'
                            : 'text-indigo-100 hover:bg-white/[0.12] hover:text-white'
                          }
                        `}
                      >
                        Content Breakdown
                      </button>
                    </div>
                    <div className="mt-2">
                  {/* Overview Panel */}
                  <div className={`space-y-6 rounded-xl bg-white p-3 ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 ${activeTab === 0 ? 'block' : 'hidden'}`}>
                    {/* One-liner summary & Key Takeaways & Why Watch */}
                    {digestSections.oneLineSummary && (
                      <div className="bg-purple-50 p-5 rounded-lg border border-purple-100">
                        <h4 className="font-medium text-purple-800 mb-3 flex items-center">
                          <span className="mr-2 text-lg">💡</span>
                          <span>Quick Overview</span>
                        </h4>
                        <p className="text-gray-700 font-medium">{digestSections.oneLineSummary}</p>
                      </div>
                    )}
                    {digestSections.keyTakeaways.length > 0 && (
                      <div className="bg-indigo-50 p-5 rounded-lg border border-indigo-100">
                        <h4 className="font-medium text-indigo-800 mb-3 flex items-center">
                          <span className="mr-2 text-lg">🔑</span>
                          <span>Key Takeaways</span>
                        </h4>
                        <ul className="list-disc list-outside ml-5 space-y-2">
                          {digestSections.keyTakeaways.map((point, idx) => {
                            const renderedPoint = renderMarkdown(point, selectedVideo?.youtube_id);
                            return (
                              <li key={idx} className="text-gray-700">
                                <div dangerouslySetInnerHTML={renderedPoint} />
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                    {digestSections.whyWatch.length > 0 && (
                      <div className="bg-green-50 p-5 rounded-lg border border-green-100">
                        <h4 className="font-medium text-green-800 mb-3 flex items-center">
                          <span className="mr-2 text-lg">👁️</span>
                          <span>Why Watch</span>
                        </h4>
                        <ul className="list-disc list-outside ml-5 space-y-2">
                          {digestSections.whyWatch.map((point, idx) => {
                            const renderedPoint = renderMarkdown(point, selectedVideo?.youtube_id);
                            return (
                              <li key={idx} className="text-gray-700">
                                <div dangerouslySetInnerHTML={renderedPoint} />
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  {/* Content Breakdown Panel */}
                  <div className={`space-y-4 rounded-xl bg-white p-3 ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 ${activeTab === 1 ? 'block' : 'hidden'}`}>
                    {/* YouTube Chapters (if any) */}
                    {selectedVideo?.chapters && selectedVideo.chapters.length > 0 && (
                      <div className="bg-purple-50 p-5 rounded-lg border border-purple-100 mb-4">
                        <h4 className="font-medium text-purple-800 mb-3 flex items-center">
                          <span className="mr-2 text-lg">🎬</span>
                          <span>Video Chapters</span>
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {selectedVideo.chapters.map((chapter, idx) => (
                            <a 
                              key={idx}
                              href={`https://www.youtube.com/watch?v=${selectedVideo.youtube_id}&t=${chapter.start_time}s`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex items-center p-2 bg-white hover:bg-purple-100 border border-purple-100 rounded-md transition-colors"
                            >
                              <span className="font-mono text-purple-700 bg-purple-50 group-hover:bg-purple-200 px-2 py-1 rounded mr-3 transition-colors text-xs inline-block min-w-[75px] text-center">
                                {new Date(chapter.start_time * 1000).toISOString().substr(11, 8).replace(/^00:/, '')}
                              </span>
                              <span className="text-gray-700 group-hover:text-purple-700 transition-colors text-sm">
                                {chapter.title}
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Detailed Content */}
                    {digestSections.detailedContent && (
                      <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
                        <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                          <span className="mr-2 text-lg">📝</span>
                          <span>Detailed Summary</span>
                        </h4>
                        {/* Render the entire detailed content as markdown */}
                        <div className="prose prose-sm max-w-none text-gray-700">
                          <div dangerouslySetInnerHTML={renderMarkdown(digestSections.detailedContent, selectedVideo?.youtube_id)} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* TEMPORARY DEBUG SECTION */}
          {selectedVideo && selectedVideo.summary && (
            <details className="mb-4 bg-gray-100 p-2 rounded border">
              <summary className="cursor-pointer font-medium text-sm text-gray-600">
                Show Raw Summary (Debug)
              </summary>
              <pre className="mt-2 text-xs whitespace-pre-wrap bg-white p-2 border rounded">
                {selectedVideo.summary}
              </pre>
            </details>
          )}
          {/* END TEMPORARY DEBUG SECTION */}
        </div>
        
        {/* Keyboard Shortcuts Help */}
        <KeyboardShortcutsHelp
          shortcuts={[
            { key: '?', description: 'Show keyboard shortcuts', category: 'General' },
            { key: 'b', description: 'Back to library', category: 'Navigation' },
            { key: 'n', description: 'Focus URL input', category: 'Content' },
            { key: '↑', description: 'Previous video', category: 'Navigation' },
            { key: '↓', description: 'Next video', category: 'Navigation' },
            { key: 'f', description: 'Fetch videos', category: 'Navigation' },
          ]}
        />
      </div>
    </MainLayout>
  );
}

// Export a component that wraps the content in Suspense
export default function DigestsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">
      <LoadingSpinner size="large" />
    </div>}>
      <DigestsPageContent />
    </Suspense>
  );
}
