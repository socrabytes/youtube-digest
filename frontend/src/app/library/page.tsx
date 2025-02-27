'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import * as api from '@/services/api';
import type { Video } from '@/types/video';
import VideoGrid from '@/components/video/VideoGrid';
import VideoList from '@/components/video/VideoList';

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
    if (viewParam === 'list' || viewParam === 'grid') {
      setView(viewParam);
    }

    // Fetch videos and channels data
    const fetchData = async () => {
      setLoading(true);
      try {
        const [videosData, channelsData] = await Promise.all([
          api.getVideos(),
          api.getChannels(),
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

  // Filter and sort videos when dependencies change
  useEffect(() => {
    let result = [...videos];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(video => 
        video.title.toLowerCase().includes(term) || 
        (video.channel_title && video.channel_title.toLowerCase().includes(term))
      );
    }

    // Apply category filter
    if (selectedCategories.length > 0) {
      result = result.filter(video => {
        if (!video.categories) return false;
        const videoCategories = Array.isArray(video.categories) ? video.categories : [];
        return selectedCategories.some(cat => videoCategories.includes(cat));
      });
    }

    // Apply duration filter
    if (durationFilter !== 'all' && videos.some(v => v.duration)) {
      result = result.filter(video => {
        const duration = video.duration || 0;
        switch (durationFilter) {
          case 'short': return duration < 300; // < 5 minutes
          case 'medium': return duration >= 300 && duration < 1200; // 5-20 minutes
          case 'long': return duration >= 1200; // > 20 minutes
          default: return true;
        }
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = a.upload_date ? new Date(a.upload_date) : new Date(0);
        const dateB = b.upload_date ? new Date(b.upload_date) : new Date(0);
        return sortOrder === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
      } else if (sortBy === 'title') {
        const titleA = a.title || '';
        const titleB = b.title || '';
        return sortOrder === 'asc' ? titleA.localeCompare(titleB) : titleB.localeCompare(titleA);
      } else if (sortBy === 'views') {
        const viewsA = a.view_count || 0;
        const viewsB = b.view_count || 0;
        return sortOrder === 'asc' ? viewsA - viewsB : viewsB - viewsA;
      }
      return 0;
    });

    setFilteredVideos(result);
  }, [videos, searchTerm, selectedCategories, durationFilter, sortBy, sortOrder]);

  // Toggle between grid and list views
  const toggleView = (newView: 'grid' | 'list') => {
    setView(newView);
    // Update URL without page reload for bookmarking capability
    const url = new URL(window.location.href);
    url.searchParams.set('view', newView);
    window.history.pushState({}, '', url.toString());
  };

  // Handle sort change
  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (value === 'date_asc' || value === 'date_desc') {
      setSortBy('date');
      setSortOrder(value.endsWith('asc') ? 'asc' : 'desc');
    } else if (value === 'title_asc' || value === 'title_desc') {
      setSortBy('title');
      setSortOrder(value.endsWith('asc') ? 'asc' : 'desc');
    } else if (value === 'views_asc' || value === 'views_desc') {
      setSortBy('views');
      setSortOrder(value.endsWith('asc') ? 'asc' : 'desc');
    }
  };

  // Toggle a category filter
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };

  // Handle video selection
  const handleVideoSelect = (video: Video) => {
    // Navigate to the digest page with the video ID
    router.push(`/digests?video=${video.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="mt-4 text-gray-600">Loading video library...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
          <h3 className="text-red-800 font-medium">Error Loading Library</h3>
          <p className="mt-2 text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Video Library</h1>
          <p className="mt-2 text-gray-600">Browse your video collection and discover content for digests</p>
        </div>

        {/* Controls Bar */}
        <div className="bg-white p-4 shadow rounded-lg mb-6 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          {/* Search */}
          <div className="relative w-full md:w-auto md:flex-grow md:max-w-md">
            <input
              type="text"
              placeholder="Search videos..."
              className="pl-3 pr-10 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <svg className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          
          {/* Right Controls */}
          <div className="flex items-center space-x-4 w-full md:w-auto">
            {/* Sort Options */}
            <div>
              <select
                onChange={handleSortChange}
                value={`${sortBy}_${sortOrder}`}
                className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            
            {/* View Toggles */}
            <div className="flex items-center space-x-2 border border-gray-200 rounded-md p-1">
              <button
                onClick={() => toggleView('grid')}
                className={`p-1.5 rounded ${view === 'grid' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
                aria-label="Grid view"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => toggleView('list')}
                className={`p-1.5 rounded ${view === 'list' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
                aria-label="List view"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="font-medium text-lg mb-4">Filters</h2>

              {/* Duration Filter */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Duration</h3>
                <div className="space-y-2">
                  {durations.map(duration => (
                    <div key={duration.value} className="flex items-center">
                      <input
                        id={`duration-${duration.value}`}
                        name="duration"
                        type="radio"
                        checked={durationFilter === duration.value}
                        onChange={() => setDurationFilter(duration.value)}
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
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Categories</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
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
                  className="mt-4 w-full py-2 px-3 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 text-gray-700"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:w-3/4">
            {filteredVideos.length === 0 ? (
              <div className="bg-white shadow rounded-lg p-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
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
    </div>
  );
}
