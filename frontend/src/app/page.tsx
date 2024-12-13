'use client';

import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import VideoCard from '@/components/video/VideoCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import type { Video } from '@/types/video';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/videos/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit video');
      }

      const newVideo = await response.json();
      setVideos(prev => [newVideo, ...prev]);
      setUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
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
            <p className="mt-2 text-red-600 text-sm">{error}</p>
          )}
        </form>

        {/* Video Grid */}
        <div className="grid grid-cols-1 gap-6">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onClick={(video) => console.log('Video clicked:', video.id)}
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
