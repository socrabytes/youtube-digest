from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from enum import Enum
from datetime import datetime

class SummaryFormat(str, Enum):
    """Types of summary formats that can be generated."""
    STANDARD = "standard"  # Basic summary with no specific structure
    ENHANCED = "enhanced"  # Includes one-liner, bullet points, section breakdown, and narrative
    CONCISE = "concise"    # Very short summary focusing only on key points
    DETAILED = "detailed"  # In-depth summary with extensive details

class SummarizerInterface(ABC):
    """Base interface for all summarizer implementations."""
    
    @abstractmethod
    def generate(self, transcript: str, format_type: SummaryFormat = SummaryFormat.STANDARD) -> Dict[str, Any]:
        """
        Generate a summary from a transcript.
        
        Args:
            transcript: The video transcript text
            format_type: The desired format for the summary
            
        Returns:
            Dictionary containing:
            - summary: The generated summary text
            - usage: Metadata about token usage, cost, etc.
        """
        pass
    
    @abstractmethod
    def calculate_cost(self, prompt_tokens: int, completion_tokens: int) -> float:
        """
        Calculate the cost of the API call.
        
        Args:
            prompt_tokens: Number of tokens in the prompt
            completion_tokens: Number of tokens in the completion
            
        Returns:
            Estimated cost in USD
        """
        pass
    
    def get_prompt_for_format(self, format_type: SummaryFormat) -> str:
        """
        Get the appropriate prompt for the requested summary format.
        
        Args:
            format_type: The desired format for the summary
            
        Returns:
            String prompt to use with the LLM
        """
        if format_type == SummaryFormat.ENHANCED:
            return self.ENHANCED_FORMAT_PROMPT
        elif format_type == SummaryFormat.CONCISE:
            return self.CONCISE_FORMAT_PROMPT
        elif format_type == SummaryFormat.DETAILED:
            return self.DETAILED_FORMAT_PROMPT
        else:
            return self.STANDARD_FORMAT_PROMPT
    
    # Provider-agnostic prompts that should work with any LLM
    STANDARD_FORMAT_PROMPT = """You are an expert YouTube video summarizer. 
Generate a well-formatted, structured summary using Markdown that:

## Guidelines
- Use clear section headings with markdown (## for main sections, ### for subsections)
- Use bullet points (•) for lists to improve scannability
- Make timestamps clickable by formatting them as [00:00](t=0)
- Use bold text for **key terms** and emphasis
- Incorporate emojis sparingly to highlight key points (🔑 for important insights, 📋 for summaries, 🎯 for objectives)
- Keep the total length under 400 words

## Output Structure
1. "## 📋 Summary" - A concise overview (50-75 words)
2. "## 🔑 Key Points" - 3-5 bullet points highlighting the most important insights
3. "## 📚 Content Overview" - Brief explanation of what the video covers
4. "## 📝 Detailed Notes" - More in-depth coverage of important concepts

Make your summary informative, scannable, and focused on the most valuable information."""

    ENHANCED_FORMAT_PROMPT = """You are an expert YouTube video summarizer.
Generate a richly formatted, structured summary using Markdown with these specific components:

## Output Structure

1. "## Ultra-Concise Summary"
   A single sentence (20-30 words) that captures the essence of the video.
   Format as: `Ultra-concise summary: [your one-line summary here]`

2. "## Key Takeaways"
   3-5 bullet points highlighting the most important points from the video.
   Format as:
   ```
   Key Takeaways:
   - [First key point]
   - [Second key point]
   - [Third key point]
   - [Fourth key point]
   - [Fifth key point]
   ```

3. "## Why Watch"
   2-4 reasons why someone should invest time in watching this video.
   Format as:
   ```
   Why Watch:
   - [First reason to watch]
   - [Second reason to watch]
   - [Third reason to watch]
   ```

4. "## Section Breakdown"
   A timeline or breakdown of major sections in the video.
   Format each section as time ranges with descriptions:
   ```
   Section Breakdown:
   [MM:SS]-[MM:SS]: [Section Title] - [Brief description]
   [MM:SS]-[MM:SS]: [Section Title] - [Brief description]
   ```
   Ensure all timestamps are in [MM:SS](t=seconds) format for clickability.

5. "## Full Narrative Summary"
   A more detailed summary of the video content (150-250 words) that complements 
   the rest of the breakdown without overwhelming the reader.
   
   - Use proper paragraph breaks (2-3 sentences per paragraph)
   - Bold **key terms** and concepts
   - Include contextual information that wasn't covered in the above sections
   - Focus on the "why" and "how" rather than just repeating facts

## Formatting Requirements
- Follow the EXACT section titles as specified above
- Ensure ALL timestamps are in clickable format: [MM:SS](t=seconds)
- Use proper Markdown formatting including headings, bold text, and bullet points
- Keep the summary concise yet comprehensive (600-800 words total)
- Focus on providing valuable insights rather than just restating video content
- Format code blocks with triple backticks and language specification where relevant
"""

    CONCISE_FORMAT_PROMPT = """You are an expert YouTube video summarizer.
Generate a very concise, well-formatted summary in Markdown that:

## Output Structure

1. "## 💡 One-Sentence Summary"
   Capture the entire video purpose in a single, impactful sentence (under 20 words).

2. "## 🎯 Critical Takeaways"
   List only 2-3 absolutely essential points as bullet points.
   • Make each bullet start with a bold action word
   • Keep each to under 15 words
   • Add an appropriate emoji to each point

3. "## 👥 For Who?"
   One line explaining exactly who would benefit most from this video.

## Formatting Guidelines
- Use proper Markdown formatting (headings, bold, bullets)
- If specific timestamps are critical, format them as clickable links [MM:SS](t=seconds)
- Keep the entire summary under 100 words
- Use visual white space effectively
- Include 1-2 most important terms in **bold**"""

    DETAILED_FORMAT_PROMPT = """You are an expert YouTube video summarizer.
Generate a comprehensive, richly formatted summary in Markdown that includes:

## Output Structure

1. "## 📋 Executive Summary"
   A concise overview (60-80 words) of the video's main purpose and value.

2. "## 🔍 Detailed Breakdown"
   Organize by topics with clear ### subheadings for each major section
   • Include timestamps as clickable links: [MM:SS](t=seconds)
   • Use bullet points for lists of related items
   • Format examples and case studies in blockquotes
   • Bold **key terms** and concepts throughout

3. "## 📊 Key Concepts Explained"
   For each complex concept:
   • Define it clearly and concisely
   • Explain how it's applied in the video
   • Note any limitations or considerations mentioned

4. "## 📝 Examples & Applications"
   List real-world examples from the video:
   • What problem was being solved?
   • How was the solution implemented?
   • What was the outcome?

5. "## ✅ Actionable Takeaways"
   5-7 specific actions viewers can implement, formatted as a checklist:
   • [ ] Action item 1
   • [ ] Action item 2

## Formatting Guidelines
- Use proper Markdown headings, bold, lists, and blockquotes
- Create clickable timestamps using [MM:SS](t=seconds) format
- Use appropriate emojis at the start of main sections
- Include visual separation between sections
- Format code examples in ```code blocks``` if applicable
- Keep paragraphs short (3-4 sentences maximum)
- Utilize bullet points extensively for scannable content
- Total length should be 700-900 words maximum"""

class SummaryGenerationError(Exception):
    """Base exception for summary generation errors."""
    pass
