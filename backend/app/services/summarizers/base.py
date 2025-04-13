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
5. If Chapters ARE provided: Analyze content within each chapter. Prepare **2-4 detailed summary points** per chapter with appropriate formatting.
6. If Chapters ARE NOT provided: Attempt to identify 3-6 logical segments based on topic shifts in the transcript. Create a descriptive title and **2-4 detailed summary points** for each identified segment with appropriate formatting.
7. If Chapters ARE NOT provided AND reasonable segmentation is not possible: Note this internally.
8. Extract elements for a Video Highlights section, including key tools, compelling data points, actionable strategies, memorable quotes, and core case studies/examples.
9. Optionally, determine if a brief Narrative Summary (100-150 words) is needed for extra context or **overall flow across the entire video**.

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
**[00:45](t=45) | 📌 Introduction to Modern Design Systems**
* 🌟 **Key Concept:** **Design tokens** serve as the foundation for creating consistent interfaces across platforms.
* 📱 The speaker demonstrates how a single color change propagates across **mobile**, **web**, and **desktop** applications.
* 💬 "Design systems aren't just style guides - they're living codebases that enforce consistency."

**[05:30](t=330) | 📌 Component Architecture**
**Component Types to Consider:**
* 🧩 **Primitive components:** Basic UI elements like buttons, inputs, cards
* 🔄 **Compound components:** Combinations of primitives that work together
* 🏗️ **Page templates:** Full layouts that dictate content organization

**When to create new components:**
1. When the same UI pattern appears 3+ times
2. When business logic needs to be encapsulated
3. When accessibility requirements demand special handling

**[12:15](t=735) | 📌 Practical Implementation**
* **Step-by-Step Process:**
  1. 📋 Start with an inventory of existing UI elements
  2. 🎨 Create a token structure for colors, spacing, typography
  3. 🛠️ Build primitives first, then compose more complex components
  
* **Common Pitfalls:**
  * ❌ Over-abstracting components too early
  * ❌ Not documenting component API constraints
  * ✅ Solution: Start small and iterate based on real usage

**[18:45](t=1125) | 📌 Case Study: Netflix Redesign**
> "The biggest challenge wasn't technical - it was getting designers and developers speaking the same language."
> - Senior Design Systems Engineer

**Before & After Metrics:**
* 📉 Design inconsistencies: 234 → 12
* 📈 Development velocity: 65% increase
* 🚀 Time to market: Reduced by 3 weeks per feature

## Segment Breakdown <-- Use this heading ONLY if Chapters are NOT Available AND Segmentation IS Possible
### 🚀 The Problem with Traditional Marketing Approaches
Modern consumers are increasingly resistant to traditional marketing tactics. The speaker identifies three critical failures in conventional approaches:

* **Banner Blindness:** 86% of consumers suffer from "banner blindness" - the unconscious ignoring of advertisement-like information
* **Trust Deficit:** Only 34% of consumers trust the brands they buy from, down from 58% a decade ago
* **Content Saturation:** The average person encounters between 6,000-10,000 ads daily, creating an "attention wall"

> "We're not just competing with other brands. We're competing with TikTok, Netflix, and every other source of dopamine in our customers' lives."

### 🔍 The Psychology Behind Effective Storytelling
**The Science of Memory Formation:**
Storytelling triggers the release of oxytocin, which enhances:
1. Trust building
2. Emotional connection
3. Memory formation

When information is presented in narrative form, retention increases by up to 22x compared to facts alone.

* 🧠 **Neural Coupling:** When listening to well-crafted stories, a phenomenon called "neural coupling" occurs where the listener's brain activity starts to mirror the speaker's
* 💭 **Narrative Transportation:** The feeling of being "lost in a story" reduces counterarguing and critical thinking about brand messages

### 🛠️ Building Your Brand Narrative Framework
The workshop introduces the SPARK framework for creating compelling brand stories:

* **S**ituation - Establish the current reality
* **P**roblem - Identify the conflict or challenge
* **A**pproach - Introduce your unique solution
* **R**esults - Highlight tangible outcomes
* **K**nowledge - Share lessons learned or insights

**Practical Exercise Results:**
Participants who applied this framework saw an average 43% increase in audience engagement with their next campaign.

### 🔮 Future Trends: AI and Personalized Storytelling
**Emerging Technologies:**
* **AI-Generated Narrative Variants:** Testing thousands of slight story variations to find optimal engagement
* **Emotional Response Tracking:** Using facial recognition and biometrics to measure story impact
* **Cross-Platform Narrative Ecosystems:** Creating cohesive but platform-appropriate story elements

**Expert Prediction:** "Within 5 years, 70% of brand stories will have AI-optimized elements, but the core human truth at their center will remain irreplaceable."

## Video Highlights ✨
* **Key Tools Mentioned:** 🛠️ **StoryEngine** - AI platform for narrative optimization, 📱 **EmoMap** - Emotional journey mapping software
* **Compelling Data Points:** 📊 Stories are 22x more memorable than facts alone, 📈 Narrative-driven campaigns show 37% higher conversion rates
* **Actionable Strategies:** 🔄 The SPARK framework for brand storytelling, 🎯 "Three Scene" minimum for any marketing narrative
* **Memorable Quotes:** 💬 "In a world of data, story is the electricity that makes it meaningful" - Speaker, 🗣️ "Your brand isn't what you say it is, it's the story people tell themselves about you"
* **Core Case Studies:** 🖼️ **Airbnb's "Belong Anywhere"** campaign transformation, 📚 **LEGO's revival** through storytelling focus

## Narrative Summary <-- Include this section ONLY if step 9 determined it was needed for overall flow
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
{transcript}"""

class SummaryGenerationError(Exception):
    """Base exception for summary generation errors."""
