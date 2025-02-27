'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import type { Video } from '@/types/video';
import VideoGrid from '@/components/video/VideoGrid';
import VideoList from '@/components/video/VideoList';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import { useKeyboardShortcut } from '@/utils/useKeyboardShortcut';
import KeyboardShortcutsHelp from '@/components/common/KeyboardShortcutsHelp';
import {
  FilterIcon,
  ViewGridIcon,
  ViewListIcon,
  SearchIcon,
  XIcon,
  ChevronDownIcon,
  ClockIcon,
  CollectionIcon,
  AdjustmentsIcon,
  InformationCircleIcon
} from '@heroicons/react/outline';
import MainLayout from '@/components/layout/MainLayout';

export default function LibraryPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const searchParams = useSearchParams();
  const router = useRouter();

  // Default filter values
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [durationFilter, setDurationFilter] = useState<'all' | 'short' | 'medium' | 'long'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'views'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const categories = React.useMemo(() => {
    const allCategories = new Set<string>();
    videos.forEach(video => {
      if (video.categories && Array.isArray(video.categories)) {
        video.categories.forEach(cat => allCategories.add(cat));
      }
    });
    return Array.from(allCategories).sort();
  }, [videos]);

  const durations = [
    { label: 'Any Duration', value: 'all' },
    { label: 'Short (< 5 min)', value: 'short' },
    { label: 'Medium (5-20 min)', value: 'medium' },
    { label: 'Long (> 20 min)', value: 'long' }
  ];

  const sortOptions = [
    { label: 'Date (newest)', value: 'date_desc' },
    { label: 'Date (oldest)', value: 'date_asc' },
    { label: 'Title (A-Z)', value: 'title_asc' },
    { label: 'Title (Z-A)', value: 'title_desc' },
    { label: 'Views (highest)', value: 'views_desc' },
    { label: 'Views (lowest)', value: 'views_asc' }
  ];

  const [currentPage, setCurrentPage] = useState(1);
  const [videosPerPage] = useState(12);

  // Calculate total pages
  const totalPages = Math.ceil(filteredVideos.length / videosPerPage);
  
  // Get current videos for pagination
  const indexOfLastVideo = currentPage * videosPerPage;
  const indexOfFirstVideo = indexOfLastVideo - videosPerPage;
  const currentVideos = filteredVideos.slice(indexOfFirstVideo, indexOfLastVideo);

  // Get videos with digests
  const hasDigestVideos = filteredVideos.filter(video => video.has_digest);

  // Change page
  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    // Set initial view based on URL params if present
    const viewParam = searchParams.get('view');
    if (viewParam === 'grid' || viewParam === 'list') {
      setView(viewParam);
    }

    // Fetch videos and channels data
    const fetchData = async () => {
      setLoading(true);
      try {
        const [videosData, channelsData] = await Promise.all([
          api.fetchVideos({}),
          api.getChannels()
        ]);
        
        // Check videos for digests
        const videosWithDigests = await Promise.all(
          videosData.map(async (video) => {
            try {
              const digest = await api.getVideoDigest(video.id);
              return { ...video, has_digest: !!digest };
            } catch (err) {
              console.error(`Error checking digest for video ${video.id}:`, err);
              return { ...video, has_digest: false };
            }
          })
        );
        
        setVideos(videosWithDigests);
        setFilteredVideos(videosWithDigests);
        setChannels(channelsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load library data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchParams]);

  // Filter and sort videos based on user selections
  useEffect(() => {
    let result = [...videos];
    
    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(video => 
        video.title?.toLowerCase().includes(term) || 
        video.channel_title?.toLowerCase().includes(term)
      );
    }
    
    // Filter by categories
    if (selectedCategories.length > 0) {
      result = result.filter(video => {
        if (!video.categories) return false;
        return selectedCategories.some(category => 
          video.categories.includes(category)
        );
      });
    }
    
    // Filter by duration
    if (durationFilter !== 'all' && durationFilter) {
      result = result.filter(video => {
        const duration = video.duration || 0;
        if (durationFilter === 'short') return duration < 300; // < 5 min
        if (durationFilter === 'medium') return duration >= 300 && duration <= 1200; // 5-20 min
        if (durationFilter === 'long') return duration > 1200; // > 20 min
        return true;
      });
    }
    
    // Sort videos
    result.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = a.upload_date ? new Date(a.upload_date) : new Date(0);
        const dateB = b.upload_date ? new Date(b.upload_date) : new Date(0);
        return sortOrder === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
      }
      
      if (sortBy === 'title') {
        const titleA = a.title || '';
        const titleB = b.title || '';
        return sortOrder === 'asc' ? titleA.localeCompare(titleB) : titleB.localeCompare(titleA);
      }
      
      if (sortBy === 'views') {
        const viewsA = a.view_count || 0;
        const viewsB = b.view_count || 0;
        return sortOrder === 'asc' ? viewsA - viewsB : viewsB - viewsA;
      }
      
      return 0;
    });
    
    setFilteredVideos(result);
  }, [videos, searchTerm, selectedCategories, durationFilter, sortBy, sortOrder]);

  // Toggle view between grid and list
  const toggleView = (newView: 'grid' | 'list') => {
    setView(newView);
    
    // Update URL with the new view parameter
    const url = new URL(window.location.href);
    url.searchParams.set('view', newView);
    window.history.pushState({}, '', url.toString());
  };

  // Handle sort change
  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    const [newSortBy, newSortOrder] = value.split('_') as [typeof sortBy, typeof sortOrder];
    
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  // Toggle category selection
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Handle video selection
  const handleVideoSelect = (video: Video) => {
    // Navigate to the digest page with the video ID as part of the URL fragment
    // This will allow the digests page to select the specific video
    if (video.has_digest) {
      router.push(`/digests?video=${video.id}`);
    } else {
      // If there's no digest, use a simple confirm dialog
      if (confirm("This video doesn't have a digest yet. Would you like to create one?")) {
        router.push(`/digests?url=${encodeURIComponent(video.url || video.webpage_url || '')}`);
      }
    }
  };

  // Keyboard shortcuts
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  useKeyboardShortcut('g', () => {
    setView('grid');
  });
  
  useKeyboardShortcut('l', () => {
    setView('list');
  });
  
  useKeyboardShortcut('f', () => {
    setIsFilterMenuOpen(!isFilterMenuOpen);
  });

  useKeyboardShortcut('s', () => {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.focus();
    }
  });

  // Hot keys for pagination
  useKeyboardShortcut('ArrowRight', () => {
    if (currentPage < totalPages) {
      paginate(currentPage + 1);
    }
  });

  useKeyboardShortcut('ArrowLeft', () => {
    if (currentPage > 1) {
      paginate(currentPage - 1);
    }
  });

  const handleShowPopularVideos = () => {
    // Sort by view count and set filter
    setSortBy('views');
    setSortOrder('desc');
    // Reset other filters
    setSearchTerm('');
    setSelectedCategories([]);
    setDurationFilter('all');
    setCurrentPage(1);
  };

  const handleShowRecentVideos = () => {
    // Sort by date and set filter
    setSortBy('date');
    setSortOrder('desc');
    // Reset other filters
    setSearchTerm('');
    setSelectedCategories([]);
    setDurationFilter('all');
    setCurrentPage(1);
  };

  const handleShowShortVideos = () => {
    // Set duration filter to short
    setDurationFilter('short');
    // Reset other filters
    setSearchTerm('');
    setSelectedCategories([]);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="large" text="Loading video library..." />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <ErrorDisplay
              title="Failed to load video library"
              message={error}
              onRetry={() => window.location.reload()}
            />
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="bg-white py-6 px-4 mb-6 rounded-lg border border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">Video Library</h1>
              <p className="mt-2 text-lg text-gray-600 max-w-3xl">
                Browse your personal collection of videos, create digests from new content, or review your existing digests.
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="flex items-center space-x-2">
                <div className="bg-white rounded-md shadow-sm p-2 inline-flex items-center border border-gray-200">
                  <span className="text-gray-500 text-sm mr-2 hidden sm:inline">View as:</span>
                  <button
                    onClick={() => toggleView('grid')}
                    className={`p-1.5 rounded ${view === 'grid' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
                    aria-label="Grid view"
                  >
                    <ViewGridIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => toggleView('list')}
                    className={`p-1.5 rounded ${view === 'list' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
                    aria-label="List view"
                  >
                    <ViewListIcon className="h-5 w-5" />
                  </button>
                </div>
                <button 
                  onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {isFilterMenuOpen ? 'Hide Filters' : 'Show Filters'}
                  <FilterIcon className="ml-2 -mr-0.5 h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-gray-600">
            <div>
              {filteredVideos.length} {filteredVideos.length === 1 ? 'video' : 'videos'} found
            </div>
            {hasDigestVideos.length > 0 && (
              <div className="ml-3">
                Including {hasDigestVideos.length} with digests
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex">
        {/* Left sidebar - matching Digests page style */}
        <div className={`${isFilterMenuOpen ? 'block' : 'hidden'} md:block w-full md:w-64 lg:w-72 flex-shrink-0 bg-white rounded-lg border border-gray-200`}>
          <div className="p-3 border-b border-gray-100">
            <h2 className="text-lg font-bold px-2 mb-2 flex items-center">
              <FilterIcon className="h-5 w-5 mr-2 text-gray-600" />
              Filters
            </h2>
            
            {/* Search box - styled like Digests page */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search videos..."
                className="w-full pl-3 pr-10 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                id="search-input"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <SearchIcon className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="p-4">
            {/* Sort Options */}
            <div className="mb-4 border-b border-gray-100 pb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort by:</label>
              <select
                onChange={handleSortChange}
                value={`${sortBy}_${sortOrder}`}
                className="w-full border border-gray-200 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* Duration Filter */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <ClockIcon className="h-4 w-4 mr-1 text-gray-500" />
                Duration
              </h3>
              <div className="space-y-2">
                {durations.map(duration => (
                  <div key={duration.value} className="flex items-center">
                    <input
                      id={`duration-${duration.value}`}
                      name="duration"
                      type="radio"
                      checked={durationFilter === duration.value}
                      onChange={() => setDurationFilter(duration.value as any)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    />
                    <label htmlFor={`duration-${duration.value}`} className="ml-2 text-sm text-gray-700 capitalize">
                      {duration.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Categories Filter */}
            {categories.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <CollectionIcon className="h-4 w-4 mr-1 text-gray-500" />
                  Categories
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {categories.map(category => (
                    <div key={category} className="flex items-center">
                      <input
                        id={`category-${category}`}
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={() => toggleCategory(category)}
                        className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                      />
                      <label htmlFor={`category-${category}`} className="ml-2 text-sm text-gray-700">
                        {category}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filter Reset */}
            {(selectedCategories.length > 0 || durationFilter !== 'all' || searchTerm) && (
              <button
                onClick={() => {
                  setSelectedCategories([]);
                  setDurationFilter('all');
                  setSearchTerm('');
                }}
                className="mt-6 w-full py-2 px-3 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 text-gray-700 transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 ml-0 md:ml-6">
          {/* Videos Display */}
          <div>
            {currentVideos.length === 0 ? (
              <EmptyState
                title="No videos found"
                description="Try adjusting your search or filters to find what you're looking for."
                icon={<InformationCircleIcon className="h-12 w-12" />}
                action={{
                  label: "Reset Filters",
                  onClick: () => {
                    setSearchTerm('');
                    setSelectedCategories([]);
                    setDurationFilter('all');
                    setSortBy('date_desc');
                  }
                }}
              />
            ) : (
              <>
                {/* Quick browse chips */}
                {currentPage === 1 && (
                  <div className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-800 mb-3">Quick Browse</h2>
                    <div className="flex overflow-x-auto pb-2 gap-3 no-scrollbar" style={{ margin: '-4px' }}>
                      <button 
                        onClick={handleShowPopularVideos}
                        className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-sm font-medium text-gray-800 hover:bg-gray-200 whitespace-nowrap flex-shrink-0 m-1"
                      >
                        <span>Popular Videos</span>
                      </button>
                      <button 
                        onClick={handleShowRecentVideos}
                        className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-sm font-medium text-gray-800 hover:bg-gray-200 whitespace-nowrap flex-shrink-0 m-1"
                      >
                        <span>Recently Added</span>
                      </button>
                      <button 
                        onClick={handleShowShortVideos}
                        className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-sm font-medium text-gray-800 hover:bg-gray-200 whitespace-nowrap flex-shrink-0 m-1"
                      >
                        <span>Short Videos</span>
                      </button>
                      {categories.slice(0, 5).map(category => (
                        <button 
                          key={category}
                          onClick={() => {
                            setSelectedCategories([category]);
                            setCurrentPage(1);
                          }}
                          className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-sm font-medium text-gray-800 hover:bg-gray-200 whitespace-nowrap flex-shrink-0 m-1"
                        >
                          <span>{category}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {/* Section for videos with digests */}
                {hasDigestVideos.length > 0 && (
                  <div className="mb-10">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                      <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-sm text-sm font-medium mr-3">
                        Digested
                      </span>
                      Videos with Digests
                    </h2>
                    
                    {view === 'grid' ? (
                      <VideoGrid 
                        videos={currentPage === 1 ? hasDigestVideos.slice(0, videosPerPage) : []} 
                        onVideoSelect={handleVideoSelect} 
                        channels={channels}
                      />
                    ) : (
                      <VideoList 
                        videos={currentPage === 1 ? hasDigestVideos.slice(0, videosPerPage) : []} 
                        onVideoSelect={handleVideoSelect} 
                        channels={channels}
                      />
                    )}
                  </div>
                )}

                {/* Section for all videos or paginated results */}
                <div>
                  {hasDigestVideos.length > 0 && currentPage === 1 && (
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">All Videos</h2>
                  )}
                  
                  {view === 'grid' ? (
                    <VideoGrid 
                      videos={currentVideos} 
                      onVideoSelect={handleVideoSelect} 
                      channels={channels}
                    />
                  ) : (
                    <VideoList 
                      videos={currentVideos} 
                      onVideoSelect={handleVideoSelect} 
                      channels={channels}
                    />
                  )}
                </div>
              </>
            )}
          </div>

          {/* Pagination */}
          <div className="flex justify-center mt-6">
            <div className="flex space-x-2">
              <button
                onClick={() => paginate(1)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50"
              >
                First
              </button>
              <button
                onClick={() => paginate(currentPage - 1)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50"
              >
                Prev
              </button>
              <span className="px-3 py-2 text-sm border border-gray-200 rounded-md bg-gray-100">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => paginate(currentPage + 1)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50"
              >
                Next
              </button>
              <button
                onClick={() => paginate(totalPages)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50"
              >
                Last
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp
        shortcuts={[
          { key: '?', description: 'Show keyboard shortcuts', category: 'General' },
          { key: 'g', description: 'Switch to grid view', category: 'Navigation' },
          { key: 'l', description: 'Switch to list view', category: 'Navigation' },
          { key: 's', description: 'Focus search box', category: 'Search & Filter' },
          { key: 'f', description: 'Toggle filter menu', category: 'Search & Filter' },
          { key: '←', description: 'Previous page', category: 'Pagination' },
          { key: '→', description: 'Next page', category: 'Pagination' },
        ]}
      />
    </MainLayout>
  );
}
