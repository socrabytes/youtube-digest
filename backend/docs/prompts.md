# YouTube Video Summary Prompts

## Current Production Prompt

```
You are an expert YouTube video summarizer. 
Generate a clear and informative summary that:
1. Identifies 3-5 key topics or main points
2. Highlights important insights and revelations
3. Explains complex concepts in clear terms
4. Captures the overall significance and impact

Keep the summary focused, informative, and under 250 words.
```

## Prompt Design Principles

1. **Clear Role Definition**: The prompt establishes the AI as an expert specifically in YouTube video summarization.

2. **Structured Output**: The prompt requests specific components:
   - Key topics (3-5)
   - Important insights
   - Clear explanations
   - Overall impact

3. **Length Control**: 250-word limit ensures concise, focused summaries.

## Example Outputs

### Good Summary Example
```
This video explores three key topics in artificial intelligence:

1. Neural Network Basics: Explains how artificial neurons work together to process information, using the analogy of a brain's neural pathways to make the concept accessible.

2. Training Methods: Demonstrates practical techniques for training AI models, highlighting the importance of quality data and proper validation methods.

3. Real-world Applications: Shows how AI is being used in healthcare, specifically in medical imaging analysis, with concrete examples of improved diagnosis rates.

The video reveals that modern AI systems can achieve 95% accuracy in certain medical diagnoses, a significant improvement over traditional methods. Complex concepts like backpropagation are explained through simple visualizations, making them understandable to non-experts.

The overall impact suggests that AI will become increasingly crucial in healthcare, though human oversight remains essential. This balanced perspective helps viewers understand both the potential and limitations of AI in medical applications.
```

### Poor Summary Example (What to Avoid)
```
The video talks about AI and shows some examples. It has information about neural networks and how they work. Then it shows some applications. The speaker seems knowledgeable and uses some slides. There are also some demonstrations of the technology in action.

[This summary lacks specific details, insights, and clear structure. It doesn't help the reader understand the key points or significance of the content.]
```

## Error Cases and Edge Cases

1. **Very Long Videos**: For videos over 2 hours, focus on major themes and key timestamps.
2. **Technical Content**: Maintain balance between technical accuracy and accessibility.
3. **Multiple Speakers**: Include relevant insights from all main speakers.
4. **Tutorial Videos**: Include key steps and learning outcomes.
5. **Opinion Pieces**: Summarize main arguments while maintaining neutrality.

## Usage Tracking

The system tracks:
- Token usage per summary
- Cost per summary
- Success/failure rates
- Average summary length
- Processing time

## Best Practices

1. **Quality Control**:
   - Monitor summary quality regularly
   - Gather user feedback
   - Update prompt based on performance

2. **Cost Management**:
   - Track token usage
   - Optimize prompt length
   - Monitor API costs

3. **Error Handling**:
   - Implement retry logic
   - Rate limiting
   - Proper error messages
