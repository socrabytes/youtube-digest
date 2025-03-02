'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import KeyboardShortcutsHelp from '@/components/common/KeyboardShortcutsHelp';
import { api } from '@/services/api';
import type { Video, Channel } from '@/types/video';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { marked } from 'marked';

const formatTimeToYouTubeTimestamp = (videoId: string, seconds: number): string => {
  return `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(seconds)}s`;
};

const formatSummaryToStructure = (summary: string): {
  oneLineSummary: string,
  keyTakeaways: string[],
  whyWatch: string[],
  summaryText: string,
  chapterSummaries: { [chapterTitle: string]: string[] }
} => {
  const chapterSummaries: { [key: string]: string[] } = {};
  
  // Try to first use the extractMarkdownSections function to get structured data
  const extracted = extractMarkdownSections(summary);
  
  // If we have a structured markdown with sections, use that
  if (extracted.oneLineSummary || extracted.keyTakeaways.length > 0 || extracted.whyWatch.length > 0) {
    // Convert extracted chapters to the chapterSummaries format
    extracted.chapters.forEach(chapter => {
      const key = `${chapter.timestamp}: ${chapter.title}`;
      chapterSummaries[key] = chapter.description ? [chapter.description] : [];
    });
    
    return {
      oneLineSummary: extracted.oneLineSummary,
      keyTakeaways: extracted.keyTakeaways,
      whyWatch: extracted.whyWatch,
      summaryText: extracted.fullNarrativeSummary || summary,
      chapterSummaries
    };
  }
  
  // Fall back to the original extraction methods if the markdown isn't structured as expected
  
  // Extract one-line summary (often at the beginning)
  let oneLineSummary = '';
  
  // First try to find the ultra-concise summary with a label
  const ultraConciseMatch = summary.match(/Ultra-concise summary:\s*([^\n]+)/i);
  if (ultraConciseMatch) {
    oneLineSummary = ultraConciseMatch[1].trim();
  } else {
    // Otherwise use the first paragraph if it's short
    const firstParagraph = summary.split('\n\n')[0].trim();
    if (firstParagraph.length < 200 && 
        !firstParagraph.includes('\n') && 
        !firstParagraph.startsWith('-') &&
        !firstParagraph.match(/^Key Takeaway/i)) {
      oneLineSummary = firstParagraph;
    }
  }
  
  // Extract key takeaways
  let keyTakeaways: string[] = [];
  // Try the formatted version first
  const formattedTakeawaysMatch = summary.match(/Key Takeaways:\s*([\s\S]*?)(?:\n\n|$)/i);
  if (formattedTakeawaysMatch) {
    keyTakeaways = formattedTakeawaysMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim().replace(/^-\s*/, ''));
  }
  
  // If that didn't work, try other possible formats
  if (keyTakeaways.length === 0) {
    const keyTakeawaysMatch = summary.match(/(?:Key Takeaways?|Key Points?|Main Points?):\s*([\s\S]*?)(?:\n\n|$)/i);
    if (keyTakeawaysMatch) {
      keyTakeaways = extractBulletPoints(keyTakeawaysMatch[1]);
    }
  }
  
  // Extract "why watch" points
  let whyWatch: string[] = [];
  // Try the formatted version first
  const formattedWhyWatchMatch = summary.match(/Why Watch:\s*([\s\S]*?)(?:\n\n|$)/i);
  if (formattedWhyWatchMatch) {
    whyWatch = formattedWhyWatchMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim().replace(/^-\s*/, ''));
  }
  
  // If that didn't work, try other possible formats
  if (whyWatch.length === 0) {
    const whyWatchMatch = summary.match(/(?:Why Watch|Why You Should Watch|Value Proposition):\s*([\s\S]*?)(?:\n\n|$)/i);
    if (whyWatchMatch) {
      whyWatch = extractBulletPoints(whyWatchMatch[1]);
    }
  }
  
  // Helper function to extract bullet points
  function extractBulletPoints(text: string): string[] {
    const bulletPointsPattern = /^\s*[•\-*]\s*(.+)$/gm;
    const points: string[] = [];
    let match;
    
    while ((match = bulletPointsPattern.exec(text)) !== null) {
      points.push(match[1].trim());
    }
    
    // If no bullet points were found, try to extract sentences
    if (points.length === 0) {
      const sentences = text.split(/\.\s+/);
      for (const sentence of sentences) {
        const trimmed = sentence.trim();
        if (trimmed && trimmed.length > 10) {
          points.push(trimmed + (trimmed.endsWith('.') ? '' : '.'));
        }
      }
    }
    
    return points;
  }
  
  // Try to detect timestamps in the "Section Breakdown" format
  const sectionBreakdownMatch = summary.match(/Section Breakdown:\s*([\s\S]*?)(?:\n\n|$)/i);
  if (sectionBreakdownMatch) {
    const sectionContent = sectionBreakdownMatch[1];
    const sectionRegex = /(\d+:\d+)(?:-(\d+:\d+))?:\s*([^-]+)(?:\s*-\s*(.+?))?(?:\n|$)/g;
    let sectionMatch;
    
    while ((sectionMatch = sectionRegex.exec(sectionContent)) !== null) {
      const startTime = sectionMatch[1];
      const title = sectionMatch[3].trim();
      const description = sectionMatch[4] ? sectionMatch[4].trim() : '';
      
      const key = `${startTime}: ${title}`;
      chapterSummaries[key] = description ? [description] : [];
    }
  }
  
  // If no section breakdown was found, try other formats for timestamps and sections
  if (Object.keys(chapterSummaries).length === 0) {
    // Try to detect timestamps and section titles in the text (like "0:00-3:00: Overview...")
    const timelineRegex = /(\d+:\d+(?:\s*[-–—]\s*\d+:\d+)?)\s*:?\s*(.+?)(?=\n|$)/gm;
    let timelineMatch;
    
    while ((timelineMatch = timelineRegex.exec(summary)) !== null) {
      const timeRange = timelineMatch[1].trim();
      const sectionTitle = timelineMatch[2].trim();
      
      if (timeRange && sectionTitle) {
        chapterSummaries[`${timeRange}: ${sectionTitle}`] = [];
      }
    }
    
    // Also try to detect chapter titles and their summaries in the text
    const chapterRegex = /^(Chapter \d+|[\d:]+)\s*[-:]\s*(.+?)(?=\n)/gm;
    let chapterMatch;
    let lastChapterTitle = '';
    
    while ((chapterMatch = chapterRegex.exec(summary)) !== null) {
      const chapterTitle = chapterMatch[2].trim();
      lastChapterTitle = chapterTitle;
      chapterSummaries[chapterTitle] = [];
    }
    
    // Check for paragraph content after chapter headings
    if (lastChapterTitle) {
      const contentAfterLastChapter = summary.slice(chapterRegex.lastIndex);
      const paragraphs = contentAfterLastChapter
        .split('\n\n')
        .map(p => p.trim())
        .filter(p => p && !p.match(/^(Chapter \d+|[\d:]+)\s*[-:]/));
      
      if (paragraphs.length > 0) {
        chapterSummaries[lastChapterTitle] = extractBulletPoints(paragraphs[0]);
      }
    }
  }
  
  // Try to extract full narrative summary
  let summaryText = summary;
  const fullSummaryMatch = summary.match(/## (?:Full Narrative Summary|📝 Full Narrative Summary)\s*(?:\r?\n|\r)([\s\S]*?)(?:(?:\r?\n|\r)##|$)/i);
  
  if (fullSummaryMatch && fullSummaryMatch[1]) {
    summaryText = fullSummaryMatch[1].trim();
  } else {
    // Clean up the summary text by removing the structured parts we've already extracted
    const formattedUltraConciseMatch = summary.match(/Ultra-concise summary:.*?\n\n/i);
    if (formattedUltraConciseMatch) {
      summaryText = summaryText.replace(formattedUltraConciseMatch[0], '');
    }
    
    if (formattedTakeawaysMatch) {
      summaryText = summaryText.replace(formattedTakeawaysMatch[0], '');
    }
    
    if (formattedWhyWatchMatch) {
      summaryText = summaryText.replace(formattedWhyWatchMatch[0], '');
    }
    
    if (sectionBreakdownMatch) {
      summaryText = summaryText.replace(sectionBreakdownMatch[0], '');
    }
    
    // Remove any remaining section headers
    summaryText = summaryText.replace(/^## .*$/gm, '');
  }
  
  // Clean up the summary text
  summaryText = summaryText.trim();
  
  return {
    oneLineSummary,
    keyTakeaways,
    whyWatch,
    summaryText,
    chapterSummaries
  };
};

const renderMarkdown = (text: string, videoId?: string): { __html: string } => {
  try {
    // Use the videoId parameter or default to empty string
    const youtubeId = videoId || '';
    
    // Use marked library for robust markdown parsing
    // Configure marked to handle common GitHub-flavored markdown features
    marked.setOptions({
      breaks: true,           // Convert line breaks to <br>
      gfm: true,              // Use GitHub Flavored Markdown
      headerIds: true,        // Generate ID attributes for headings
      mangle: false,          // Don't escape autolinked email addresses
      sanitize: false,        // Don't sanitize HTML - we trust our content
      smartLists: true,       // Use smarter list behavior
    });
    
    // Process the markdown text
    let html = marked(text);
    
    // Process YouTube timestamp links with multiple formats
    // Pattern 1: [MM:SS](t=seconds) - Our custom format
    html = html.replace(/\[(\d+:\d+)\]\(t=(\d+)\)/g, (match, time, seconds) => {
      return `<a href="https://www.youtube.com/watch?v=${youtubeId}&t=${seconds}" target="_blank" rel="noopener noreferrer" class="inline-block py-1 px-2 bg-purple-100 text-purple-700 rounded font-mono hover:bg-purple-200 transition-colors">${time}</a>`;
    });
    
    // Pattern 2: MM:SS - Convert plain timestamps to links
    html = html.replace(/(\D|^)((\d{1,2}):(\d{2}))(\D|$)/g, (match, prefix, timeText, minutes, seconds, suffix) => {
      const totalSeconds = parseInt(minutes) * 60 + parseInt(seconds);
      if (isNaN(totalSeconds)) return match;
      
      return `${prefix}<a href="https://www.youtube.com/watch?v=${youtubeId}&t=${totalSeconds}" target="_blank" rel="noopener noreferrer" class="inline-block py-1 px-2 bg-purple-100 text-purple-700 rounded font-mono hover:bg-purple-200 transition-colors">${timeText}</a>${suffix}`;
    });
    
    return { __html: html };
  } catch (error) {
    console.error('Error rendering markdown:', error);
    return { __html: `<p>${text}</p>` };
  }
};

const extractMarkdownSections = (markdownText: string): {
  oneLineSummary: string;
  keyTakeaways: string[];
  whyWatch: string[];
  chapters: { timestamp: string, title: string, description: string }[];
  fullNarrativeSummary: string;
} => {
  // Initialize return values
  let oneLineSummary = '';
  const keyTakeaways: string[] = [];
  const whyWatch: string[] = [];
  const chapters: { timestamp: string, title: string, description: string }[] = [];
  let fullNarrativeSummary = '';
  
  // Extract one-line summary
  // First try with ## Ultra-Concise Summary heading format
  const ultraConciseRegex = /## (?:💡 )?Ultra-Concise Summary\s*(?:\r?\n|\r)([^\r\n]*(?:\r?\n|\r)(?:[^\r\n]*(?:\r?\n|\r))*?)/i;
  const ultraConciseMatch = markdownText.match(ultraConciseRegex);
  
  // Try simpler format without the heading
  const simpleConciseMatch = markdownText.match(/Ultra-concise summary:\s*([^\n]+)/i);
  
  if (ultraConciseMatch && ultraConciseMatch[1]) {
    const summaryText = ultraConciseMatch[1].trim();
    // Check if it has the "Ultra-concise summary:" prefix and extract the actual summary
    const prefixMatch = summaryText.match(/Ultra-concise summary:\s*(.*)/i);
    if (prefixMatch && prefixMatch[1]) {
      oneLineSummary = prefixMatch[1].trim();
    } else {
      oneLineSummary = summaryText;
    }
  } else if (simpleConciseMatch && simpleConciseMatch[1]) {
    oneLineSummary = simpleConciseMatch[1].trim();
  }
  
  // Extract key takeaways
  // First try with ## Key Takeaways heading format
  const keyPointsRegex = /## (?:🔑 )?Key Takeaways\s*(?:\r?\n|\r)([\s\S]*?)(?:(?:\r?\n|\r)##|$)/i;
  const keyPointsMatch = markdownText.match(keyPointsRegex);
  
  // Try simpler format without the heading
  const simpleKeyTakeawaysMatch = markdownText.match(/Key Takeaways:\s*([\s\S]*?)(?:\n\n|$)/i);
  
  if (keyPointsMatch && keyPointsMatch[1]) {
    const keyPointsSection = keyPointsMatch[1].trim();
    // Check if there's a "Key Takeaways:" prefix to skip
    const withoutPrefix = keyPointsSection.replace(/^Key Takeaways:\s*(?:\r?\n|\r)/i, '');
    
    // Process each line that starts with a bullet point
    const bulletPointLines = withoutPrefix.split(/\r?\n|\r/).filter(line => line.trim().startsWith('-'));
    if (bulletPointLines.length > 0) {
      keyTakeaways.push(...bulletPointLines.map(line => line.trim().replace(/^-\s*/, '')));
    } else {
      // If no bullet points found, try to extract them differently
      const bulletPoints = withoutPrefix.split(/(?:\r?\n|\r)\s*-\s*/).filter(Boolean);
      keyTakeaways.push(...bulletPoints.map(point => point.trim()));
    }
  } else if (simpleKeyTakeawaysMatch && simpleKeyTakeawaysMatch[1]) {
    const lines = simpleKeyTakeawaysMatch[1]
      .split(/\r?\n|\r/)
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim().replace(/^-\s*/, ''));
    
    if (lines.length > 0) {
      keyTakeaways.push(...lines);
    }
  }
  
  // Extract why watch
  // First try with ## Why Watch heading format
  const whyWatchRegex = /## (?:📺 )?Why Watch\s*(?:\r?\n|\r)([\s\S]*?)(?:(?:\r?\n|\r)##|$)/i;
  const whyWatchMatch = markdownText.match(whyWatchRegex);
  
  // Try simpler format without the heading
  const simpleWhyWatchMatch = markdownText.match(/Why Watch:\s*([\s\S]*?)(?:\n\n|$)/i);
  
  if (whyWatchMatch && whyWatchMatch[1]) {
    const whyWatchSection = whyWatchMatch[1].trim();
    // Check if there's a "Why Watch:" prefix to skip
    const withoutPrefix = whyWatchSection.replace(/^Why Watch:\s*(?:\r?\n|\r)/i, '');
    
    // Process each line that starts with a bullet point
    const bulletPointLines = withoutPrefix.split(/\r?\n|\r/).filter(line => line.trim().startsWith('-'));
    if (bulletPointLines.length > 0) {
      whyWatch.push(...bulletPointLines.map(line => line.trim().replace(/^-\s*/, '')));
    } else {
      // If no bullet points found, try to extract them differently
      const bulletPoints = withoutPrefix.split(/(?:\r?\n|\r)\s*-\s*/).filter(Boolean);
      whyWatch.push(...bulletPoints.map(point => point.trim()));
    }
  } else if (simpleWhyWatchMatch && simpleWhyWatchMatch[1]) {
    const lines = simpleWhyWatchMatch[1]
      .split(/\r?\n|\r/)
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim().replace(/^-\s*/, ''));
    
    if (lines.length > 0) {
      whyWatch.push(...lines);
    }
  }
  
  // Extract section/chapter breakdown
  // First try with ## Section Breakdown heading format
  const sectionRegex = /## (?:📚 )?(?:Chapter|Section) Breakdown\s*(?:\r?\n|\r)([\s\S]*?)(?:(?:\r?\n|\r)##|$)/i;
  const sectionMatch = markdownText.match(sectionRegex);
  
  // Try simpler format without the heading
  const simpleSectionMatch = markdownText.match(/Section Breakdown:\s*([\s\S]*?)(?:\n\n|$)/i);
  
  if (sectionMatch && sectionMatch[1]) {
    const sectionContent = sectionMatch[1].trim();
    // Check if there's a "Section Breakdown:" prefix to skip
    const withoutPrefix = sectionContent.replace(/^Section Breakdown:\s*(?:\r?\n|\r)/i, '');
    
    // Try different chapter formats
    
    // Format 1: MM:SS: Title - Description
    const simpleTimestampRegex = /(\d+:\d+):\s*([^-\n]+)(?:\s*-\s*(.*?))?(?:\r?\n|\r|$)/g;
    let simpleMatch;
    
    while ((simpleMatch = simpleTimestampRegex.exec(withoutPrefix)) !== null) {
      chapters.push({
        timestamp: simpleMatch[1],
        title: simpleMatch[2].trim(),
        description: simpleMatch[3] ? simpleMatch[3].trim() : ''
      });
    }
    
    // If no matches, try format with markdown links: [MM:SS](t=XX): Title - Description
    if (chapters.length === 0) {
      const linkedTimestampRegex = /\[(\d+:\d+)\](?:\(t=\d+\))?\s*:\s*([^-\n]+)(?:\s*-\s*(.*?))?(?:\r?\n|\r|$)/g;
      let linkedMatch;
      
      while ((linkedMatch = linkedTimestampRegex.exec(withoutPrefix)) !== null) {
        chapters.push({
          timestamp: linkedMatch[1],
          title: linkedMatch[2].trim(),
          description: linkedMatch[3] ? linkedMatch[3].trim() : ''
        });
      }
    }
    
    // Format 2: [MM:SS]-[MM:SS]: Title - Description
    if (chapters.length === 0) {
      const timeRangeRegex = /\[?(\d+:\d+)\]?(?:\(t=\d+\))?\s*-\s*\[?(\d+:\d+)\]?(?:\(t=\d+\))?:\s*([^-\n]+)(?:\s*-\s*(.*?))?(?:\r?\n|\r|$)/g;
      let timeRangeMatch;
      
      while ((timeRangeMatch = timeRangeRegex.exec(withoutPrefix)) !== null) {
        chapters.push({
          timestamp: timeRangeMatch[1],
          title: timeRangeMatch[3].trim(),
          description: timeRangeMatch[4] ? timeRangeMatch[4].trim() : ''
        });
      }
    }
    
    // Format 3: [MM:SS](t=XX) - Title: Description
    if (chapters.length === 0) {
      const timestampRegex = /\[(\d+:\d+)\](?:\(t=\d+\))?\s*-\s*(?:\*\*)?(.*?)(?:\*\*)?(?::\s*(.*?))?(?:\r?\n|\r|$)/g;
      let timestampMatch;
      
      while ((timestampMatch = timestampRegex.exec(withoutPrefix)) !== null) {
        chapters.push({
          timestamp: timestampMatch[1],
          title: timestampMatch[2].trim(),
          description: timestampMatch[3] ? timestampMatch[3].trim() : ''
        });
      }
    }
    
    // Format 4: - [MM:SS](t=XX) Title
    if (chapters.length === 0) {
      const bulletRegex = /-\s*\[(\d+:\d+)\](?:\(t=\d+\))?\s*(?:\*\*)?(.*?)(?:\*\*)?(?::\s*(.*?))?(?:\r?\n|\r|$)/g;
      let bulletMatch;
      
      while ((bulletMatch = bulletRegex.exec(withoutPrefix)) !== null) {
        chapters.push({
          timestamp: bulletMatch[1],
          title: bulletMatch[2].trim(),
          description: bulletMatch[3] ? bulletMatch[3].trim() : ''
        });
      }
    }
  } else if (simpleSectionMatch && simpleSectionMatch[1]) {
    const sectionContent = simpleSectionMatch[1].trim();
    const timestampRegex = /(\d+:\d+)(?:-\d+:\d+)?:\s*([^-\n]+)(?:\s*-\s*(.*?))?(?:\r?\n|\r|$)/g;
    let timestampMatch;
    
    while ((timestampMatch = timestampRegex.exec(sectionContent)) !== null) {
      chapters.push({
        timestamp: timestampMatch[1],
        title: timestampMatch[2].trim(),
        description: timestampMatch[3] ? timestampMatch[3].trim() : ''
      });
    }
  }
  
  // Extract full narrative summary
  const fullSummaryRegex = /## (?:📝 )?Full Narrative Summary\s*(?:\r?\n|\r)([\s\S]*?)(?:(?:\r?\n|\r)##|$)/i;
  const fullSummaryMatch = markdownText.match(fullSummaryRegex);
  
  if (fullSummaryMatch && fullSummaryMatch[1]) {
    fullNarrativeSummary = fullSummaryMatch[1].trim();
  } else {
    // Try to extract what remains after removing the other sections
    let remainingText = markdownText;
    
    // Remove ultra-concise section if found
    if (ultraConciseMatch) {
      remainingText = remainingText.replace(ultraConciseMatch[0], '');
    } else if (simpleConciseMatch) {
      remainingText = remainingText.replace(simpleConciseMatch[0], '');
    }
    
    // Remove key takeaways section if found
    if (keyPointsMatch) {
      remainingText = remainingText.replace(keyPointsMatch[0], '');
    } else if (simpleKeyTakeawaysMatch) {
      remainingText = remainingText.replace(simpleKeyTakeawaysMatch[0], '');
    }
    
    // Remove why watch section if found
    if (whyWatchMatch) {
      remainingText = remainingText.replace(whyWatchMatch[0], '');
    } else if (simpleWhyWatchMatch) {
      remainingText = remainingText.replace(simpleWhyWatchMatch[0], '');
    }
    
    // Remove section breakdown if found
    if (sectionMatch) {
      remainingText = remainingText.replace(sectionMatch[0], '');
    } else if (simpleSectionMatch) {
      remainingText = remainingText.replace(simpleSectionMatch[0], '');
    }
    
    // Clean up the remaining text
    fullNarrativeSummary = remainingText.replace(/^#+\s*.*$/gm, '').trim();
  }
  
  return {
    oneLineSummary,
    keyTakeaways,
    whyWatch,
    chapters,
    fullNarrativeSummary
  };
};

export default function DigestsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const videoIdParam = searchParams.get('video');
  const urlParam = searchParams.get('url');
  
  const [isLoading, setIsLoading] = useState(true);
  const [videos, setVideos] = useState<Video[]>([]);
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [channelsOpen, setChannelsOpen] = useState(false);
  const [selectedChannels, setSelectedChannels] = useState<number[]>([]);
  const [selectedDigestType, setSelectedDigestType] = useState<string>('highlights');
  const videosPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    // Fetch videos with digests
    const fetchVideosWithDigests = async () => {
      setIsLoading(true);
      try {
        const data = await api.fetchVideos({ sortBy: 'date', timeRange: 'all', hasDigest: true });
        setVideos(data);
        setAllVideos(data);
      } catch (err) {
        console.error('Error fetching videos:', err);
        setError('Failed to load videos with digests');
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch categories
    const fetchCategories = async () => {
      try {
        const data = await api.getCategories();
        setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    // Fetch channels
    const fetchChannels = async () => {
      try {
        const data = await api.getChannels();
        setChannels(data);
      } catch (err) {
        console.error('Error fetching channels:', err);
      }
    };

    fetchVideosWithDigests();
    fetchCategories();
    fetchChannels();
  }, []);

  useEffect(() => {
    const keyboardShortcuts: Record<string, () => void> = {
      'b': () => router.push('/library'),
      'n': () => {
        const urlInput = document.getElementById('url-input');
        if (urlInput) {
          urlInput.focus();
        }
      },
      'ArrowUp': () => {
        if (videos.length > 0 && selectedVideo) {
          const currentIndex = videos.findIndex(v => v.id === selectedVideo.id);
          if (currentIndex > 0) {
            setSelectedVideo(videos[currentIndex - 1]);
          }
        }
      },
      'ArrowDown': () => {
        if (videos.length > 0 && selectedVideo) {
          const currentIndex = videos.findIndex(v => v.id === selectedVideo.id);
          if (currentIndex < videos.length - 1) {
            setSelectedVideo(videos[currentIndex + 1]);
          }
        }
      },
      'f': () => {
        const fetchVideosWithDigests = async () => {
          setIsLoading(true);
          try {
            const data = await api.fetchVideos({ sortBy: 'date', timeRange: 'all', hasDigest: true });
            setVideos(data);
            setAllVideos(data);
          } catch (err) {
            console.error('Error fetching videos:', err);
            setError('Failed to load videos with digests');
          } finally {
            setIsLoading(false);
          }
        };
        fetchVideosWithDigests();
      },
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      const key = event.key.toLowerCase();
      if (key in keyboardShortcuts) {
        event.preventDefault();
        keyboardShortcuts[key]();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [videos, selectedVideo]);

  // This useEffect handles URL parameter changes
  useEffect(() => {
    if (videoIdParam && videos.length > 0) {
      console.log('Video ID param detected:', videoIdParam);
      const videoId = parseInt(videoIdParam);
      const selectedVid = videos.find(v => v.id === videoId);
      
      if (selectedVid) {
        console.log('Found matching video, setting selected video:', selectedVid);
        setSelectedVideo(selectedVid);
      } else {
        console.log('Video not found in current list, fetching from API...');
        // If the video isn't in our current list, try to fetch it directly
        const fetchVideo = async () => {
          try {
            const video = await api.getVideo(videoId);
            if (video) {
              console.log('Successfully fetched video by ID:', video);
              setSelectedVideo(video);
              // Add this video to our list if it's not already there
              if (!videos.some(v => v.id === video.id)) {
                setVideos(prev => [...prev, video]);
                setAllVideos(prev => [...prev, video]);
              }
            }
          } catch (error) {
            console.error('Error fetching video by ID:', error);
          }
        };
        fetchVideo();
      }
    }
  }, [videoIdParam, videos]);

  useEffect(() => {
    // If URL parameter exists, try to create a digest
    if (urlParam) {
      setUrl(urlParam);
      // Don't automatically submit to create a digest
      // Just populate the URL field for the user
    }
  }, [urlParam]);

  useEffect(() => {
    // This useEffect ensures we load the latest digest for the selected video
    if (selectedVideo?.id) {
      console.log('Selected video changed, checking for latest digest...');
      
      const loadLatestDigest = async () => {
        try {
          // Fetch the latest video data to ensure we have the most recent digest
          const freshVideo = await api.getVideo(selectedVideo.id);
          if (freshVideo) {
            console.log('Refreshed video data:', freshVideo);
            // Update only the current selectedVideo, not the entire list
            setSelectedVideo(freshVideo);
          }
        } catch (error) {
          console.error('Failed to refresh video data:', error);
        }
      };
      
      loadLatestDigest();
    }
  }, [selectedVideo?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log('Creating digest with URL:', url, 'Type:', selectedDigestType);
      // Call the API to create a digest with the selected digest type
      const digestResponse = await api.createDigest(url, selectedDigestType);
      console.log('Digest creation response:', digestResponse);
      
      if (digestResponse.id) {
        console.log('Digest created successfully, video_id:', digestResponse.video_id);
        
        // First refresh the videos list to include the new video
        try {
          const updatedVideos = await api.fetchVideos({ sortBy: 'date', hasDigest: true });
          setVideos(updatedVideos);
          setAllVideos(updatedVideos);
          console.log('Videos refreshed, found video:', updatedVideos.find(v => v.id === digestResponse.video_id));
          
          // Get the specific video with digest
          const newVideo = await api.getVideo(digestResponse.video_id);
          console.log('Fetched new video with digest:', newVideo);
          
          // Set the selected video directly instead of relying on navigation
          setSelectedVideo(newVideo);
          
          // Update the URL without triggering a page reload
          window.history.pushState(
            {}, 
            '', 
            `/digests?video=${digestResponse.video_id}`
          );
        } catch (refreshError) {
          console.error('Error refreshing videos:', refreshError);
        }
      } else {
        console.error('Missing digest ID in response', digestResponse);
        setError('Failed to create digest');
      }
    } catch (error) {
      console.error('Error creating digest:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
      // Reset URL field after submission
      setUrl('');
    }
  };

  const handleVideoSelect = (video: Video) => {
    setSelectedVideo(video);
  };

  const handleChannelSelect = (channelId: number) => {
    if (selectedChannels.includes(channelId)) {
      setSelectedChannels(selectedChannels.filter(id => id !== channelId));
    } else {
      setSelectedChannels([...selectedChannels, channelId]);
    }
  };

  const handleCategorySelect = (category: string) => {
    if (selectedCategory === category) {
      // If clicking the already selected category, clear the filter
      setSelectedCategory(null);
      setSelectedChannels([]);
      setVideos(allVideos);
    } else {
      // Filter videos by the selected category
      setSelectedCategory(category);
      setSelectedChannels([]);
      const filteredVideos = allVideos.filter(video => 
        video.categories && video.categories.includes(category)
      );
      setVideos(filteredVideos);
    }
  };

  // Format date string safely
  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr || dateStr === "null" || dateStr === "Invalid Date") return "Unknown";
    
    // Try different date formats
    try {
      // Check if it's a YYYYMMDD format
      if (/^\d{8}$/.test(dateStr)) {
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        return new Date(`${year}-${month}-${day}`).toLocaleDateString();
      }
      
      // Try standard date parsing
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString();
      }
      
      return "Unknown";
    } catch (e) {
      return "Unknown";
    }
  };

  const filteredVideos = videos.filter(video => 
    video.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    video.channel_title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (video.categories && video.categories.some(category => category.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  // Get current videos for pagination
  const indexOfLastVideo = currentPage * videosPerPage;
  const indexOfFirstVideo = indexOfLastVideo - videosPerPage;
  const currentVideos = filteredVideos.slice(indexOfFirstVideo, indexOfLastVideo);
  const totalPages = Math.ceil(filteredVideos.length / videosPerPage);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="large" text="Loading digests..." />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex">
        {/* Left sidebar - Improved styling */}
        <div className="w-full md:w-64 lg:w-72 flex-shrink-0 bg-white rounded-lg shadow-sm">
          <div className="p-3 border-b border-gray-100">
            <h2 className="text-lg font-bold px-2 mb-2">Digests</h2>
            
            {/* Search box */}
            <div className="relative mb-2">
              <input
                type="text"
                placeholder="Search digests..."
                className="w-full pl-3 pr-10 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        
          {/* Video list with improved styling */}
          <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100" style={{ maxHeight: 'calc(100vh - 250px)' }}>
            {isLoading ? (
              <div className="p-4 text-center">
                <LoadingSpinner size="small" text="Loading videos..." />
              </div>
            ) : currentVideos.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                No videos match your search.
              </div>
            ) : (
              <div>
                {currentVideos.map((video) => (
                  <button
                    key={video.id}
                    onClick={() => handleVideoSelect(video)}
                    className={`w-full text-left p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors
                      ${selectedVideo?.id === video.id ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : ''}`}
                  >
                    <div className="flex items-start space-x-2">
                      {/* Video thumbnail */}
                      <div className="flex-shrink-0 w-16 h-9 bg-gray-200 rounded overflow-hidden">
                        {video.thumbnail_url ? (
                          <img 
                            src={video.thumbnail_url} 
                            alt={video.title} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-xs text-gray-400">No image</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="overflow-hidden flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{video.title}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {video.channel_title || 
                            (channels.find(c => c.id === video.channel_id)?.name) || 
                            'Unknown channel'}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
                
                {/* Pagination Controls */}
                {filteredVideos.length > videosPerPage && (
                  <div className="p-3 flex justify-between items-center border-t border-gray-100">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`${
                        currentPage === 1 
                          ? 'text-gray-400 cursor-not-allowed' 
                          : 'text-indigo-600 hover:bg-indigo-50'
                      } text-sm px-2 py-1 rounded`}
                    >
                      <span className="sr-only">Previous</span>
                      ←
                    </button>
                    
                    <span className="text-sm text-gray-500">
                      {currentPage} of {totalPages}
                    </span>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`${
                        currentPage === totalPages 
                          ? 'text-gray-400 cursor-not-allowed' 
                          : 'text-indigo-600 hover:bg-indigo-50'
                      } text-sm px-2 py-1 rounded`}
                    >
                      <span className="sr-only">Next</span>
                      →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Channels section with collapsible UI */}
          <div className="mt-2 border-t border-gray-100">
            <button 
              className="flex items-center justify-between w-full p-3 text-left font-medium"
              onClick={() => setChannelsOpen(!channelsOpen)}
            >
              <h3 className="text-md font-bold">Channels</h3>
              <svg 
                className={`h-4 w-4 text-gray-500 transform transition-transform ${channelsOpen ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {channelsOpen && (
              <div className="px-3 pb-3 space-y-1">
                {channels.map((channel) => (
                  <div key={channel.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`channel-${channel.id}`}
                      className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                      checked={selectedChannels.includes(channel.id)}
                      onChange={() => handleChannelSelect(channel.id)}
                    />
                    <label
                      htmlFor={`channel-${channel.id}`}
                      className="ml-2 text-sm text-gray-600 block truncate"
                    >
                      {channel.name}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* URL Input */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700">Generate Digest</h3>
            <form onSubmit={handleSubmit} className="mt-4">
              <div className="mb-4">
                <label htmlFor="url-input" className="block text-sm font-medium text-gray-700 mb-1">YouTube URL</label>
                <input
                  id="url-input"
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter YouTube URL"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="digest-type" className="block text-sm font-medium text-gray-700 mb-1">Digest Type</label>
                <select
                  id="digest-type"
                  value={selectedDigestType}
                  onChange={(e) => setSelectedDigestType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="highlights">Enhanced (Highlights)</option>
                  <option value="summary">Standard (Summary)</option>
                  <option value="detailed">Detailed (In-depth Analysis)</option>
                  <option value="chapters">Chapters (Segmented View)</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  {selectedDigestType === 'highlights' && 'A comprehensive summary with sections, bullet points, and timestamps.'}
                  {selectedDigestType === 'summary' && 'A basic summary of the video content.'}
                  {selectedDigestType === 'detailed' && 'An in-depth analysis of the video with extensive details.'}
                  {selectedDigestType === 'chapters' && 'A breakdown of the video by chapters and sections.'}
                </p>
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting || !url}
                className={`w-full ${
                  isSubmitting || !url ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                } text-white font-medium py-2 px-4 rounded-md transition-colors`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="small" />
                    <span className="ml-2">Processing...</span>
                  </div>
                ) : (
                  'Generate Digest'
                )}
              </button>
            </form>
            {error && <div className="mt-4"><ErrorDisplay title="Error" message={error} level="error" /></div>}
          </div>

          {/* Video Display - Redesigned for better balance */}
          {selectedVideo && (
            <div className="mb-6 bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Back button and video header with thumbnail background and overlay */}
              <div className="relative">
                {/* Back to Library button */}
                <button 
                  onClick={() => router.push('/library')}
                  className="absolute top-4 left-4 z-10 flex items-center justify-center bg-black/30 hover:bg-black/50 text-white px-3 py-2 rounded-md transition-colors"
                  aria-label="Back to library"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-1" />
                  <span className="text-sm">Library</span>
                </button>
                
                {/* Background thumbnail with overlay */}
                <div className="relative h-48 md:h-64 overflow-hidden">
                  {selectedVideo.thumbnail_url ? (
                    <>
                      <img 
                        src={selectedVideo.thumbnail_url} 
                        alt={selectedVideo.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-indigo-900/90"></div>
                    </>
                  ) : (
                    <div className="w-full h-full bg-indigo-900"></div>
                  )}
                  
                  {/* Video title and channel overlaid on the thumbnail */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h2 className="text-xl md:text-2xl font-bold mb-2 drop-shadow-md">{selectedVideo.title}</h2>
                    <p className="text-sm md:text-base">
                      {selectedVideo.channel_title || 
                        (channels.find(c => c.id === selectedVideo.channel_id)?.name) || 
                        'Unknown channel'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Video metadata in a clean grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-1 gap-y-2 p-4 bg-white text-center">
                {/* Views */}
                <div className="px-3 py-2">
                  <p className="text-gray-500 text-sm">Views</p>
                  <p className="font-medium">{selectedVideo.view_count?.toLocaleString() || 'Unknown'}</p>
                </div>
                
                {/* Upload Date */}
                <div className="px-3 py-2">
                  <p className="text-gray-500 text-sm">Uploaded</p>
                  <p className="font-medium">{formatDate(selectedVideo.upload_date)}</p>
                </div>
                
                {/* Duration */}
                <div className="px-3 py-2">
                  <p className="text-gray-500 text-sm">Duration</p>
                  <p className="font-medium">{selectedVideo.duration ? 
                    `${Math.floor(selectedVideo.duration / 60)}:${(selectedVideo.duration % 60).toString().padStart(2, '0')}` : 
                    'Unknown'}</p>
                </div>
                
                {/* Likes */}
                <div className="px-3 py-2">
                  <p className="text-gray-500 text-sm">Likes</p>
                  <p className="font-medium">{selectedVideo.like_count?.toLocaleString() || 'Unknown'}</p>
                </div>
              </div>
              
              {/* Categories if available */}
              {selectedVideo.categories && selectedVideo.categories.length > 0 && (
                <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                  <p className="text-sm text-gray-500 mb-1">Categories</p>
                  <p>{selectedVideo.categories.join(', ')}</p>
                </div>
              )}
            </div>
          )}

          {/* Display message when no digest is available */}
          {selectedVideo && !selectedVideo.summary && (
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-xl mb-4 text-indigo-800 flex items-center">
                <DocumentTextIcon className="w-5 h-5 mr-2" />
                <span>Digest</span>
              </h3>
              
              <div className="bg-gray-50 p-4 rounded border border-gray-200 text-gray-500">
                <p>No digest available for this video.</p>
                <p className="text-sm mt-2">This could be because the video is still being processed or doesn't have a transcript available.</p>
              </div>
            </div>
          )}

          {/* Digest Content - Enhanced with structured format */}
          {selectedVideo && selectedVideo.summary && (
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-xl mb-4 text-indigo-800 flex items-center">
                <DocumentTextIcon className="w-5 h-5 mr-2" />
                <span>Digest</span>
              </h3>
              
              <div className="space-y-6">
                {/* Structured summary display */}
                {(() => {
                  const { oneLineSummary, keyTakeaways, whyWatch, summaryText, chapterSummaries } = formatSummaryToStructure(selectedVideo.summary);
                  
                  return (
                    <>
                      {/* One-liner summary */}
                      {oneLineSummary && (
                        <div className="bg-purple-50 p-5 rounded-lg border border-purple-100">
                          <h4 className="font-medium text-purple-800 mb-3 flex items-center">
                            <span className="mr-2 text-lg">💡</span>
                            <span>Ultra-Concise Summary</span>
                          </h4>
                          <p className="text-gray-700 font-medium">{oneLineSummary}</p>
                        </div>
                      )}
                      
                      {/* Key Takeaways Section */}
                      {keyTakeaways.length > 0 && (
                        <div className="bg-indigo-50 p-5 rounded-lg border border-indigo-100">
                          <h4 className="font-medium text-indigo-800 mb-3 flex items-center">
                            <span className="mr-2 text-lg">🔑</span>
                            <span>Key Takeaways</span>
                          </h4>
                          <ul className="list-disc list-outside ml-5 space-y-2">
                            {keyTakeaways.map((point, idx) => (
                              <li key={idx} className="text-gray-700">{point}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Why Watch Section */}
                      {whyWatch.length > 0 && (
                        <div className="bg-green-50 p-5 rounded-lg border border-green-100">
                          <h4 className="font-medium text-green-800 mb-3 flex items-center">
                            <span className="mr-2 text-lg">👁️</span>
                            <span>Why Watch</span>
                          </h4>
                          <ul className="list-disc list-outside ml-5 space-y-2">
                            {whyWatch.map((point, idx) => (
                              <li key={idx} className="text-gray-700">{point}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Chapters Section */}
                      {selectedVideo.chapters && selectedVideo.chapters.length > 0 && (
                        <div className="bg-purple-50 p-5 rounded-lg border border-purple-100">
                          <h4 className="font-medium text-purple-800 mb-3 flex items-center">
                            <span className="mr-2 text-lg">📹</span>
                            <span>Video Chapters</span>
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {selectedVideo.chapters.map((chapter, idx) => (
                              <div key={idx} className="flex items-start group">
                                <a 
                                  href={formatTimeToYouTubeTimestamp(selectedVideo.youtube_id, chapter.start_time)} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-block py-1 px-2 bg-purple-100 text-purple-700 rounded font-mono hover:bg-purple-200 transition-colors"
                                >
                                  {chapter.timestamp}
                                </a>
                                <span className="ml-2 text-gray-700 group-hover:text-purple-700 transition-colors">
                                  {chapter.title}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Section Breakdown from Summary */}
                          {Object.keys(chapterSummaries).length > 0 && (
                            <div className="mt-4 border-t border-purple-200 pt-4">
                              <h5 className="font-medium text-purple-700 mb-2">Section Breakdown</h5>
                              <div className="grid grid-cols-1 gap-3 mt-2">
                                {Object.entries(chapterSummaries).map(([title, points], idx) => (
                                  <div key={idx} className="mb-2">
                                    <p className="font-medium text-purple-800">{title}</p>
                                    {points.length > 0 && (
                                      <ul className="list-disc list-outside ml-5 mt-1">
                                        {points.map((point, pidx) => (
                                          <li key={pidx} className="text-gray-700 text-sm">{point}</li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Full Narrative Summary */}
                      {summaryText && (
                        <div className="mt-6">
                          <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                            <span className="mr-2 text-lg">📝</span>
                            <span>Full Narrative Summary</span>
                          </h4>
                          <div className="prose prose-indigo max-w-none bg-gray-50 p-5 rounded-lg border border-gray-200">
                            <div dangerouslySetInnerHTML={renderMarkdown(summaryText, selectedVideo.youtube_id)} />
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
        
        {/* Keyboard Shortcuts Help */}
        <KeyboardShortcutsHelp
          shortcuts={[
            { key: '?', description: 'Show keyboard shortcuts', category: 'General' },
            { key: 'b', description: 'Back to library', category: 'Navigation' },
            { key: 'n', description: 'Focus URL input', category: 'Content' },
            { key: '↑', description: 'Previous video', category: 'Navigation' },
            { key: '↓', description: 'Next video', category: 'Navigation' },
            { key: 'f', description: 'Fetch videos', category: 'Navigation' },
          ]}
        />
      </div>
    </MainLayout>
  );
}
