import React from 'react';
import Toggle from '../ui/Toggle';

interface VideoSorterProps {
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  totalVideos: number;
}

const VideoSorter: React.FC<VideoSorterProps> = ({
  viewMode,
  onViewModeChange,
  totalVideos,
}) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="text-gray-600">
        {totalVideos} {totalVideos === 1 ? 'video' : 'videos'} found
      </div>
      
      <Toggle
        label="View:"
        options={[
          {
            value: 'grid',
            label: 'Grid',
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            ),
          },
          {
            value: 'list',
            label: 'List',
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            ),
          },
        ]}
        value={viewMode}
        onChange={(value) => onViewModeChange(value as 'grid' | 'list')}
      />
    </div>
  );
};

export default VideoSorter;
