'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import LibraryLayout from '@/components/layout/LibraryLayout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import type { Video } from '@/types/video';
import { api } from '@/services/api';

export default function Home() {
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Create or update the video and get the response
      const digestResponse = await api.createDigest(url);
      setUrl('');
      
      // Check if we have a video_id in the response
      if (digestResponse && digestResponse.video_id) {
        // Redirect to the digests page with the video ID
        router.push(`/digests?video=${digestResponse.video_id}`);
      } else {
        // Fallback: Reload or redirect to generic digests page if ID is missing
        console.warn('Digest created, but video_id missing in response. Redirecting to /digests');
        router.push('/digests');
      }
    } catch (err: any) {
      console.error('Error creating digest:', err);
      setError(err.message || 'Failed to process video');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVideoSelect = (video: Video) => {
    console.log('[HomePage] handleVideoSelect called for video:', video.id);
    // Navigate to the digest page for this video
    router.push(`/digests?video=${video.id}`);
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 bg-white p-6 rounded-lg shadow-sm">
          <h1 className="text-2xl font-bold mb-4">YouTube Digest</h1>
          <p className="mb-6 text-gray-600">
            Enter a YouTube URL to create a digest of the video content.
          </p>
          
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors duration-200 disabled:bg-blue-400"
              disabled={!url || isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <LoadingSpinner size="small" />
                  <span className="ml-2">Processing...</span>
                </div>
              ) : (
                'Create Digest'
              )}
            </button>
          </form>
          
          {error && <div className="mt-4 text-red-500">{error}</div>}
        </div>

        <LibraryLayout onVideoSelect={handleVideoSelect} />
      </div>
    </MainLayout>
  );
}
