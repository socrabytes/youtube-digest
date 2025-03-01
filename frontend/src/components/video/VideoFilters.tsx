import React from 'react';
import { VideoFilterOptions } from '@/types/video';

interface VideoFiltersProps {
  filters: VideoFilterOptions;
  onFilterChange: (filters: Partial<VideoFilterOptions>) => void;
}

const VideoFilters: React.FC<VideoFiltersProps> = ({ filters, onFilterChange }) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 bg-white rounded-lg shadow-sm mb-6">
      <div className="flex flex-col">
        <label htmlFor="sortBy" className="text-sm font-medium text-gray-700 mb-1">
          Sort by
        </label>
        <select
          id="sortBy"
          className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={filters.sortBy}
          onChange={(e) => onFilterChange({ sortBy: e.target.value as 'date' | 'relevance' | 'views' })}
        >
          <option value="date">Date added</option>
          <option value="views">View count</option>
          <option value="relevance">Relevance</option>
        </select>
      </div>

      <div className="flex flex-col">
        <label htmlFor="timeRange" className="text-sm font-medium text-gray-700 mb-1">
          Time range
        </label>
        <select
          id="timeRange"
          className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={filters.timeRange}
          onChange={(e) => onFilterChange({ timeRange: e.target.value as 'day' | 'week' | 'month' | 'year' | 'all' })}
        >
          <option value="all">All time</option>
          <option value="day">Today</option>
          <option value="week">This week</option>
          <option value="month">This month</option>
          <option value="year">This year</option>
        </select>
      </div>

      <div className="flex items-center mt-6 md:mt-0">
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={filters.hasDigest}
            onChange={(e) => onFilterChange({ hasDigest: e.target.checked })}
          />
          <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          <span className="ms-3 text-sm font-medium text-gray-700">Has digest</span>
        </label>
      </div>

      <div className="flex-grow"></div>

      <button
        className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors duration-200"
        onClick={() => onFilterChange({
          sortBy: 'date',
          timeRange: 'all',
          hasDigest: false,
          category: undefined
        })}
      >
        Reset filters
      </button>
    </div>
  );
};

export default VideoFilters;
