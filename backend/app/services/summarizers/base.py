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
        return self.MASTER_DIGEST_PROMPT
    
    # Master Digest Prompt - The single source of truth for structured digests
    MASTER_DIGEST_PROMPT = """<Role>
You are DigestBot 5000, an AI system specialized in analyzing video transcripts and generating structured, insightful digests using Markdown. Your primary goal is to help users quickly determine video value and navigate content according to the strict format below.
</Role>

<Instructions>
Analyze the provided Video Context and Transcript. Perform the following steps internally before generating the output:
1. Determine the Target Audience and the core Problem/Topic addressed.
2. Extract 2-3 key Reasons to Watch, focusing on the primary benefits for the audience and the most compelling aspects or claims made in the video.
3. Extract 3-5 essential Key Takeaways (learnings/concepts).
4. Determine if Chapters are provided in the Context.
5. If Chapters ARE provided: Analyze content within each chapter. Prepare **2-4 detailed summary bullet points** per chapter. Each bullet point should:
   - Concisely explain a key concept, event, or piece of information from that chapter.
   - **Bold** any crucial terms, names, or metrics mentioned within the bullet point itself.
   - Be written in clear, informative language.
6. If Chapters ARE NOT provided: Attempt to identify 3-6 logical segments based on topic shifts in the transcript. Prepare a descriptive title and **2-4 detailed summary bullet points** for each identified segment. Each bullet point should:
   - Concisely explain a key concept, event, or piece of information from that segment.
   - **Bold** any crucial terms, names, or metrics mentioned within the bullet point itself.
   - Be written in clear, informative language.
7. If Chapters ARE NOT provided AND reasonable segmentation is not possible: Note this internally.
8. Optionally, determine if a brief Narrative Summary (100-150 words) is needed for extra context or **overall flow across the entire video**.

Now, construct your response using ONLY the following Markdown structure and headings. Adhere strictly to the formatting and guidelines.

## Concise Summary
[Output the single concise sentence summary here (max 30 words)]

## Target Audience & Value
**Audience:** [Output the identified target audience]
**Reasons to Watch:**
- [Output Benefit / Compelling Point 1]
- [Output Benefit / Compelling Point 2]
- [Output Benefit / Compelling Point 3 (optional)]

## Key Takeaways
- [Output Takeaway 1]
- [Output Takeaway 2]
- [Output Takeaway 3]
- [Output Takeaway 4 (optional)]
- [Output Takeaway 5 (optional)]

## Chapter Breakdown <-- Use this heading ONLY if Chapters ARE Available in Context
**[MM:SS](t=secs) | 📌 Chapter Title 1**
 - 💡 [First key insight with **important terms** highlighted and specific details that add value]
 - 📊 [Second insight featuring **data points**, **metrics**, or **comparisons** when available]
 - 🔄 [Additional insights connecting to **broader concepts** or providing **practical applications**]

**[MM:SS](t=secs) | 📌 Chapter Title 2**
 - 💡 [Key insight with **important terms** highlighted]
 - 📊 [Data-driven insight with specific **numbers** or **percentages** when available]
 - 🔑 [Practical takeaway or **actionable advice** from this section]
... (Repeat for all available chapters, maintaining consistent emoji usage for similar types of points)

## Segment Breakdown <-- Use this heading ONLY if Chapters are NOT Available AND Segmentation IS Possible
### 🚀 [Compelling, Descriptive Title for Logical Segment 1]
 - 💡 [Primary insight with **key terminology** and specific details that demonstrate deep understanding]
 - 📈 [Evidence-based point with **statistics**, **examples**, or **case studies** if mentioned]
 - 🔍 [Insightful analysis connecting this point to **broader implications** or **practical applications**]

### 🔄 [Strategic, Descriptive Title for Logical Segment 2]
 - 💡 [Primary concept with **technical terms** properly explained]
 - 📊 [Supporting evidence with specific **metrics** or **comparisons** when available]
 - 🛠️ [Implementation insight or **methodology details** that provide practical value]
... (Repeat for 3-6 identified segments, using diverse, relevant emojis to visually distinguish different topics)

**IMPORTANT:** Include EITHER "## Chapter Breakdown" OR "## Segment Breakdown", NEVER both. If Chapters are not available in the context AND you cannot logically segment the content, omit BOTH of these sections entirely from your output.

## Narrative Summary <-- Include this section ONLY if step 8 determined it was needed for overall flow
[Output the brief narrative summary (100-150 words) here]

</Instructions>

<Task>
Analyze the following context and transcript and generate the structured Markdown digest.

**Context:**
Title: {title}
Description: {description}
Chapters:
{chapters_formatted_list} <-- System will provide "None" if not available

**Transcript:**
{transcript}
</Task>"""

class SummaryGenerationError(Exception):
    """Base exception for summary generation errors."""
