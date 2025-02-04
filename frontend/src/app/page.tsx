'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import VideoCard from '@/components/video/VideoCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import type { Video } from '@/types/video';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [error, setError] = useState('');

  // Fetch videos when component mounts
  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/videos/`);
      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }
      const data = await response.json();
      setVideos(data);
    } catch (err) {
      console.error('Error fetching videos:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Create or update the video
      const createResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/videos/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.detail || 'Failed to create video');
      }

      const newVideo = await createResponse.json();

      // Update videos list
      setVideos(prevVideos => {
        const existingIndex = prevVideos.findIndex(v => v.id === newVideo.id);
        if (existingIndex >= 0) {
          // Replace existing video
          const updatedVideos = [...prevVideos];
          updatedVideos[existingIndex] = newVideo;
          return updatedVideos;
        } else {
          // Add new video at the beginning
          return [newVideo, ...prevVideos];
        }
      });

      // Clear input after successful submission
      setUrl('');
      
      // Process the video to generate summary
      const processResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/videos/${newVideo.id}/process`, {
        method: 'POST',
      });

      if (!processResponse.ok) {
        const errorData = await processResponse.json();
        throw new Error(errorData.detail || 'Failed to process video');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Handler for refreshing a single video
  const handleVideoRefresh = async (videoId: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/videos/${videoId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch video');
      }
      const updatedVideo = await response.json();
      
      setVideos(prevVideos => 
        prevVideos.map(v => v.id === videoId ? updatedVideo : v)
      );
    } catch (err) {
      console.error('Error refreshing video:', err);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">YouTube Video Digest</h1>
        
        {/* Video Submission Form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter YouTube URL"
              required
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? <LoadingSpinner size="sm" /> : 'Create Digest'}
            </button>
          </div>
          {error && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}
        </form>

        {/* Video Grid */}
        <div className="grid grid-cols-1 gap-6">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onRefresh={() => handleVideoRefresh(video.id)}
            />
          ))}
          {videos.length === 0 && (
            <p className="text-center text-gray-500">
              No videos yet. Add a YouTube URL to create a digest!
            </p>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
