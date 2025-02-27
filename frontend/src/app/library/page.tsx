'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import type { Video } from '@/types/video';
import VideoGrid from '@/components/video/VideoGrid';
import VideoList from '@/components/video/VideoList';
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
          api.getVideos(),
          api.getChannels()
        ]);
        
        setVideos(videosData);
        setFilteredVideos(videosData);
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
        router.push(`/digests?url=${encodeURIComponent(video.url || '')}`);
      }
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
            <p className="mt-4 text-gray-600">Loading video library...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex">
        {/* Left sidebar - matching Digests page style */}
        <div className="w-full md:w-64 lg:w-72 flex-shrink-0 bg-white rounded-lg shadow-sm">
          <div className="p-3 border-b border-gray-100">
            <h2 className="text-lg font-bold px-2 mb-2 flex items-center">
              <FilterIcon className="h-5 w-5 mr-2 text-indigo-600" />
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
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <SearchIcon className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="p-4">
            {/* View Toggles */}
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-4">
              <span className="text-sm font-medium text-gray-700">View:</span>
              <div className="flex items-center space-x-2 border border-gray-200 rounded-md p-1">
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
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Video Library</h1>
            <p className="mt-1 text-gray-600">Browse your video collection and discover content for digests</p>
            <div className="mt-2 text-sm text-indigo-600">
              {filteredVideos.length} {filteredVideos.length === 1 ? 'video' : 'videos'} found
            </div>
          </div>

          {/* Videos Display */}
          <div>
            {filteredVideos.length === 0 ? (
              <div className="bg-white shadow rounded-lg p-8 text-center">
                <InformationCircleIcon className="mx-auto h-12 w-12 text-indigo-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No videos found</h3>
                <p className="mt-2 text-gray-500">
                  Try adjusting your search or filters to find what you're looking for.
                </p>
              </div>
            ) : (
              <>
                {view === 'grid' ? (
                  <VideoGrid 
                    videos={filteredVideos} 
                    onVideoSelect={handleVideoSelect} 
                    channels={channels}
                  />
                ) : (
                  <VideoList 
                    videos={filteredVideos} 
                    onVideoSelect={handleVideoSelect} 
                    channels={channels}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
