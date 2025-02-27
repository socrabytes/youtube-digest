/**
 * Format seconds into a human-readable duration string
 * @param seconds - Duration in seconds
 * @returns Formatted duration string (e.g., "1:30" or "1:30:45")
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Format a number of views with K, M suffixes
 * @param views - Number of views
 * @returns Formatted view count (e.g., "1.5K views" or "2.3M views")
 */
export function formatViews(views?: number): string {
  if (!views) return '0 views';
  
  if (views < 1000) return `${views} views`;
  if (views < 1000000) return `${(views / 1000).toFixed(1)}K views`;
  
  return `${(views / 1000000).toFixed(1)}M views`;
}

/**
 * Format a date string to a readable format
 * @param dateString - ISO date string or YYYYMMDD format
 * @returns Formatted date (e.g., "Jan 1, 2023")
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return '';
  
  // Handle YYYYMMDD format
  if (/^\d{8}$/.test(dateString)) {
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    return new Date(`${year}-${month}-${day}`).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  // Handle ISO format or other date strings
  try {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
}
