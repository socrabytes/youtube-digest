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
  
  let date: Date;
  
  // Handle YYYYMMDD format
  if (dateString.match(/^\d{8}$/)) {
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    date = new Date(`${year}-${month}-${day}`);
  } else {
    date = new Date(dateString);
  }
  
  // Check if date is valid
  if (isNaN(date.getTime())) return '';
  
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  // If less than 7 days ago, show relative time
  if (diffDays < 7) {
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  }
  
  // If less than 1 month ago, show weeks
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }
  
  // Show Month Day, Year for older dates
  return date.toLocaleDateString('en-US', { 
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}
