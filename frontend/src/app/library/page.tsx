'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState, Suspense } from 'react';
import { api } from '@/services/api';
import type { Video } from '@/types/video';
import VideoGrid from '@/components/video/VideoGrid';
import VideoList from '@/components/video/VideoList';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import KeyboardShortcutsHelp from '@/components/common/KeyboardShortcutsHelp';
import {
  AdjustmentsVerticalIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  RectangleStackIcon,
  FunnelIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  VideoCameraIcon,
  Squares2X2Icon,
  Bars4Icon,
  XCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import MainLayout from '@/components/layout/MainLayout';

// Create a wrapper component that uses useSearchParams
function LibraryPageContent() {
  // This component uses useSearchParams and will be wrapped in Suspense
  const searchParams = useSearchParams();
  
  // Rest of the component logic

  // Pass searchParams to the main component
  return <LibraryPageImpl searchParamsObj={searchParams} />;
}

// Main component implementation that doesn't directly use useSearchParams
function LibraryPageImpl({ searchParamsObj }: { searchParamsObj: URLSearchParams }) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  // Use the searchParams passed as props instead of directly calling useSearchParams()
  const searchParams = searchParamsObj;
  const router = useRouter();

  // Default filter values
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [durationFilter, setDurationFilter] = useState<'all' | 'short' | 'medium' | 'long'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'views'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showOnlyMyVideos, setShowOnlyMyVideos] = useState(false); // Default to showing all system videos
  const [activeFilter, setActiveFilter] = useState('all');

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

  // Get videos without digests
  const noDigestVideos = filteredVideos.filter(video => !video.has_digest);

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
          api.fetchVideos({
            sortBy: 'date',
            timeRange: 'all',
            hasDigest: false
          }),
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
        // Ensure categories exists and is an array before using includes
        if (!video.categories || !Array.isArray(video.categories)) return false;
        return selectedCategories.some(category => 
          video.categories!.includes(category)
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
    
    // Filter by user's videos
    if (showOnlyMyVideos) {
      // The Video type doesn't have user_id property, so we need to add a proper implementation
      // For now, we'll comment this out to fix the TypeScript error
      // TODO: Implement proper user filtering once user authentication is integrated
      // result = result.filter(video => video.user_id === 'current_user_id');
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
  }, [videos, searchTerm, selectedCategories, durationFilter, sortBy, sortOrder, showOnlyMyVideos]);

  // Define a function to determine if filters are active
  const showingFilteredResults = selectedCategories.length > 0 || durationFilter !== 'all' || searchTerm.trim() !== '';

  // Helper function to describe the active filter
  const getActiveFilterDescription = () => {
    let description = [];
    
    if (selectedCategories.length > 0) {
      description.push(`Category: ${selectedCategories.join(', ')}`);
    }
    
    if (durationFilter !== 'all') {
      const durationLabels: Record<string, string> = {
        'short': 'Short videos (< 5 min)',
        'medium': 'Medium videos (5-20 min)',
        'long': 'Long videos (> 20 min)'
      };
      description.push(durationLabels[durationFilter] || durationFilter);
    }
    
    if (searchTerm) {
      description.push(`Search: "${searchTerm}"`);
    }
    
    return description.join(' • ');
  };

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
  
  // Set up keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement ||
          e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }
      
      const key = e.key.toLowerCase();
      
      switch (key) {
        case 'g':
          setView('grid');
          break;
        case 'l':
          setView('list');
          break;
        case 'f':
          setIsFilterMenuOpen(!isFilterMenuOpen);
          break;
        case 's':
          const searchInput = document.getElementById('search-input');
          if (searchInput) {
            searchInput.focus();
          }
          break;
        case 'arrowright':
          if (currentPage < totalPages) {
            paginate(currentPage + 1);
          }
          break;
        case 'arrowleft':
          if (currentPage > 1) {
            paginate(currentPage - 1);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentPage, totalPages, isFilterMenuOpen]);

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

  const resetAllFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setDurationFilter('all');
    setShowOnlyMyVideos(false);
    setActiveFilter('all');
    setSortBy('date');
    setSortOrder('desc');
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
      <div className="py-5">
        {/* Hero Section - Random Digests Feature */}
        <div className="mb-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Discover New Content</h2>
          <div className="flex overflow-x-auto gap-4 pb-2">
            {videos.slice(0, 4).map((video) => (
              <div 
                key={video.id}
                className="flex-shrink-0 w-64 bg-white rounded-md shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleVideoSelect(video)}
              >
                <div className="relative">
                  <img 
                    src={video.thumbnail_url || '/placeholder-thumbnail.jpg'} 
                    alt={video.title} 
                    className="w-full h-36 object-cover"
                  />
                  {video.has_digest && (
                    <div className="absolute top-2 right-2 bg-indigo-600 text-white text-xs px-2 py-0.5 rounded">
                      Digest
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{video.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Video Library
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Browse your personal collection of videos, create digests from new content, or review your existing digests.
            </p>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <VideoCameraIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
              <span>
                {videos.length} {videos.length === 1 ? 'video' : 'videos'} found
              </span>
            </div>
          </div>

          <div className="mt-4 lg:mt-0 flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
            {/* Active filters badges with clear ability */}
            {(selectedCategories.length > 0 || durationFilter !== 'all' || searchTerm.trim() !== '' || activeFilter !== 'all' || !showOnlyMyVideos) && (
              <div className="mt-4 flex flex-wrap gap-2 items-center">
                <span className="text-sm font-medium text-gray-700 mr-2">Active filters:</span>
                
                {searchTerm.trim() !== '' && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                    Search: {searchTerm}
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="ml-1.5 flex-shrink-0 inline-flex text-indigo-500 focus:outline-none"
                    >
                      <XMarkIcon className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </span>
                )}
                
                {durationFilter !== 'all' && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                    Duration: {durationFilter === 'short' ? 'Short (<5 min)' : durationFilter === 'medium' ? 'Medium (5-20 min)' : 'Long (>20 min)'}
                    <button
                      type="button"
                      onClick={() => setDurationFilter('all')}
                      className="ml-1.5 flex-shrink-0 inline-flex text-indigo-500 focus:outline-none"
                    >
                      <XMarkIcon className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </span>
                )}
                
                {selectedCategories.map(category => (
                  <span key={category} className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                    {category}
                    <button
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className="ml-1.5 flex-shrink-0 inline-flex text-indigo-500 focus:outline-none"
                    >
                      <XMarkIcon className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </span>
                ))}
                
                {showOnlyMyVideos && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                    My Videos
                    <button
                      type="button"
                      onClick={() => setShowOnlyMyVideos(false)}
                      className="ml-1.5 flex-shrink-0 inline-flex text-indigo-500 focus:outline-none"
                    >
                      <XMarkIcon className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </span>
                )}
                
                <button
                  onClick={resetAllFilters}
                  className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-800 hover:bg-red-200"
                >
                  Reset All
                  <XCircleIcon className="ml-1.5 h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            )}
            
            <div className="flex space-x-3">
              <button
                onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isFilterMenuOpen ? 'Hide Filters' : 'Show Filters'}
                <FunnelIcon className="ml-2 -mr-0.5 h-4 w-4" />
              </button>
              
              <div className="inline-flex rounded-md shadow-sm">
                <button
                  onClick={() => setView('grid')}
                  className={`inline-flex items-center px-4 py-2 border border-r-0 border-gray-300 text-sm font-medium rounded-l-md ${
                    view === 'grid' ? 'bg-indigo-50 text-indigo-700' : 'bg-white text-gray-700 hover:bg-gray-50'
                  } focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500`}
                >
                  <Squares2X2Icon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md ${
                    view === 'list' ? 'bg-indigo-50 text-indigo-700' : 'bg-white text-gray-700 hover:bg-gray-50'
                  } focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500`}
                >
                  <Bars4Icon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Video Source Filter Chips */}
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Video Source</h3>
          <div className="flex space-x-2 overflow-x-auto pb-2">
            <button
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                !showOnlyMyVideos ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
              onClick={() => setShowOnlyMyVideos(false)}
            >
              All System Videos
            </button>
            <button
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                showOnlyMyVideos ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
              onClick={() => setShowOnlyMyVideos(true)}
            >
              My Videos
            </button>
          </div>
        </div>

        {/* Quick Navigation Filter Chips - Horizontal scrollable */}
        <div className="mt-4 overflow-x-auto pb-2 flex items-center space-x-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <button
            onClick={() => setActiveFilter('all')}
            className={`whitespace-nowrap px-4 py-2 text-sm rounded-full ${
              activeFilter === 'all' 
                ? 'bg-indigo-600 text-white font-medium' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Videos
          </button>
          <button
            onClick={() => setActiveFilter('popular')}
            className={`whitespace-nowrap px-4 py-2 text-sm rounded-full ${
              activeFilter === 'popular' 
                ? 'bg-indigo-600 text-white font-medium' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Popular Videos
          </button>
          <button
            onClick={() => setActiveFilter('recent')}
            className={`whitespace-nowrap px-4 py-2 text-sm rounded-full ${
              activeFilter === 'recent' 
                ? 'bg-indigo-600 text-white font-medium' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Recently Added
          </button>
        </div>

        {/* Main content grid with sidebar layout - modified for narrower sidebar */}
        <div className="mt-6 grid grid-cols-12 gap-6">
          {/* Sidebar filters - reduced width */}
          <div className="col-span-12 lg:col-span-2 bg-white rounded-lg shadow-sm p-4 h-fit">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Filters</h3>
                {(selectedCategories.length > 0 || durationFilter !== 'all' || searchTerm.trim() !== '' || activeFilter !== 'all' || !showOnlyMyVideos) && (
                  <button
                    onClick={resetAllFilters}
                    className="text-xs text-red-600 hover:text-red-800 flex items-center"
                  >
                    Reset
                    <XCircleIcon className="ml-1 h-4 w-4" />
                  </button>
                )}
              </div>
              
              {/* Search */}
              <div className="mb-6">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="text"
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    placeholder="Search videos"
                  />
                </div>
              </div>
              
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
          <div className="col-span-12 lg:col-span-10">
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
                      setSortBy('date');
                      setSortOrder('desc');
                    }
                  }}
                />
              ) : (
                <>
                  {/* Quick browse chips */}
                  {currentPage === 1 && (
                    <div className="mb-6">
                      <div className="flex overflow-x-auto pb-2 gap-3 no-scrollbar mt-2" style={{ margin: '-4px' }}>
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
                  
                  {/* Main content organization - Logic based on filtering */}
                  {showingFilteredResults ? (
                    /* When filter is active, show filtered results */
                    <div className="mb-10">
                      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                        Filtered Results <span className="text-sm text-gray-500 ml-2">({getActiveFilterDescription()})</span>
                      </h2>
                      {view === 'grid' ? (
                        <VideoGrid videos={currentVideos} onVideoSelect={handleVideoSelect} channels={channels} />
                      ) : (
                        <VideoList videos={currentVideos} onVideoSelect={handleVideoSelect} channels={channels} />
                      )}
                    </div>
                  ) : (
                    /* Regular view with better organization */
                    <>
                      {/* Videos with digests section */}
                      {hasDigestVideos.length > 0 && (
                        <div className="mb-10">
                          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                            <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-sm text-sm font-medium mr-3">
                              Digested
                            </span>
                            Ready to Read
                          </h2>
                          {view === 'grid' ? (
                            <VideoGrid videos={hasDigestVideos.slice(0, 10)} onVideoSelect={handleVideoSelect} channels={channels} />
                          ) : (
                            <VideoList videos={hasDigestVideos.slice(0, 10)} onVideoSelect={handleVideoSelect} channels={channels} />
                          )}
                          {hasDigestVideos.length > 10 && (
                            <div className="mt-4 text-right">
                              <button 
                                onClick={() => {
                                  setFilteredVideos(hasDigestVideos);
                                  setCurrentPage(1);
                                }}
                                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                              >
                                View all {hasDigestVideos.length} digested videos →
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Videos without digests section */}
                      {noDigestVideos.length > 0 && (
                        <div className="mb-10">
                          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-sm text-sm font-medium mr-3">
                              Pending
                            </span>
                            Waiting for Digest
                          </h2>
                          {view === 'grid' ? (
                            <VideoGrid videos={noDigestVideos.slice(0, 10)} onVideoSelect={handleVideoSelect} channels={channels} />
                          ) : (
                            <VideoList videos={noDigestVideos.slice(0, 10)} onVideoSelect={handleVideoSelect} channels={channels} />
                          )}
                          {noDigestVideos.length > 10 && (
                            <div className="mt-4 text-right">
                              <button 
                                onClick={() => {
                                  setFilteredVideos(noDigestVideos);
                                  setCurrentPage(1);
                                }}
                                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                              >
                                View all {noDigestVideos.length} pending videos →
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Pagination control */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex justify-center">
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm" aria-label="Pagination">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className={`relative inline-flex items-center px-3 py-2 rounded-l-md border ${
                            currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span className="sr-only">Previous</span>
                          <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                        
                        {/* Only show at most 5 page numbers, with ellipsis if needed */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          // Logic to show pages around current page
                          let pageToShow;
                          if (totalPages <= 5) {
                            // If 5 or fewer pages, show all pages
                            pageToShow = i + 1;
                          } else if (currentPage <= 3) {
                            // If near start, show first 5 pages
                            pageToShow = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            // If near end, show last 5 pages
                            pageToShow = totalPages - 4 + i;
                          } else {
                            // Show 2 before and 2 after current page
                            pageToShow = currentPage - 2 + i;
                          }
                          
                          return (
                            <button
                              key={pageToShow}
                              onClick={() => setCurrentPage(pageToShow)}
                              className={`relative inline-flex items-center px-4 py-2 border ${
                                pageToShow === currentPage ? 'bg-indigo-50 text-indigo-600 z-10' : 'bg-white text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {pageToShow}
                            </button>
                          );
                        })}
                        
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className={`relative inline-flex items-center px-3 py-2 rounded-r-md border ${
                            currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span className="sr-only">Next</span>
                          <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </nav>
                    </div>
                  )}
                </>
              )}
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
          </div>
        </div>

      </div>

    </MainLayout>
  );
}

// Export a component that wraps the content in Suspense
export default function LibraryPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">
      <LoadingSpinner size="large" />
    </div>}>
      <LibraryPageContent />
    </Suspense>
  );
}
