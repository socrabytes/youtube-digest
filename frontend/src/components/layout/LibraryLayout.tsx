import React, { useState, useEffect } from 'react';
import VideoGrid from '../video/VideoGrid';
import VideoList from '../video/VideoList';
import VideoFilters from '../video/VideoFilters';
import VideoSorter from '../video/VideoSorter';
import { api } from '@/services/api';
import type { Video, VideoFilterOptions } from '@/types/video';
import LoadingSpinner from '../common/LoadingSpinner';

interface LibraryLayoutProps {
  onVideoSelect: (video: Video) => void;
}

const LibraryLayout: React.FC<LibraryLayoutProps> = ({ onVideoSelect }) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<VideoFilterOptions>({
    sortBy: 'date',
    timeRange: 'all',
    hasDigest: false
  });
  const [categories, setCategories] = useState<string[]>([]);

  // Fetch videos when component mounts or filters change
  useEffect(() => {
    fetchVideos();
  }, [filters]);

  // Fetch categories when component mounts
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchVideos = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.fetchVideos(filters);
      setVideos(data);
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError('Failed to load videos. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleFilterChange = (newFilters: Partial<VideoFilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleRefresh = () => {
    fetchVideos();
  };

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={fetchVideos}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors duration-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Video Library</h1>
      
      <VideoFilters 
        filters={filters} 
        onFilterChange={handleFilterChange} 
      />
      
      <VideoSorter 
        viewMode={viewMode} 
        onViewModeChange={setViewMode} 
        totalVideos={videos.length} 
      />
      
      {viewMode === 'grid' ? (
        <VideoGrid 
          videos={videos} 
          isLoading={isLoading} 
          onVideoClick={onVideoSelect}
          onRefresh={handleRefresh}
        />
      ) : (
        <VideoList 
          videos={videos} 
          isLoading={isLoading} 
          onVideoClick={onVideoSelect}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  );
};

export default LibraryLayout;
