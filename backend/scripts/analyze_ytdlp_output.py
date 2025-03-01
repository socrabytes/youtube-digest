#!/usr/bin/env python3
"""
Script to analyze yt-dlp output and document data types.
This will help ensure our database schema correctly maps to the actual data.
"""

import json
import yt_dlp
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
from pprint import pformat

SAMPLE_VIDEOS = [
    "https://www.youtube.com/watch?v=9bZkp7q19f0",  # Regular video (Gangnam Style)
    "https://www.youtube.com/watch?v=jNQXAC9IVRw",  # First YouTube video
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",  # Music video
    "https://www.youtube.com/watch?v=bhIrmT4uf1M",  # Video with chapters
    "https://www.youtube.com/watch?v=cdiD-9MMpb0",  # Long video
]

def analyze_field_type(field_name: str, values: List[Any]) -> str:
    """Analyze a field's values to determine its type and constraints."""
    non_none_values = [v for v in values if v is not None]
    if not non_none_values:
        return "NULL values only"
    
    sample = non_none_values[0]
    types = set(type(v).__name__ for v in non_none_values)
    
    # Special case for IDs and URLs
    if field_name.endswith('_id'):
        max_length = max(len(str(v)) for v in non_none_values)
        return f"string(max_length={max_length})"
    if field_name.endswith('_url'):
        max_length = max(len(str(v)) for v in non_none_values)
        return f"string(max_length={max_length})"
    
    if 'str' in types:
        max_length = max(len(str(v)) for v in non_none_values)
        return f"string(max_length={max_length})"
    if 'int' in types:
        min_val = min(int(v) for v in non_none_values)
        max_val = max(int(v) for v in non_none_values)
        return f"integer(range={min_val} to {max_val})"
    if 'float' in types:
        return "float"
    if 'dict' in types or 'list' in types:
        return "jsonb"
    if 'bool' in types:
        return "boolean"
    
    return f"unknown ({', '.join(types)})"

def analyze_ytdlp_output(url: str) -> Dict[str, Any]:
    """Extract and analyze data from a YouTube video."""
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(url, download=False)
            # Remove some verbose fields we don't need
            for field in ['formats', 'thumbnails', 'automatic_captions', 
                         'subtitles', 'requested_formats', 'http_headers']:
                info.pop(field, None)
            return info
        except Exception as e:
            print(f"Error processing {url}: {str(e)}")
            return {}

def save_analysis_results(results: List[Dict[str, Any]]):
    """Save analysis results to a markdown file."""
    output_dir = Path("analysis")
    output_dir.mkdir(exist_ok=True)
    
    # Collect all fields and their values
    field_values: Dict[str, List[Any]] = {}
    for result in results:
        for field, value in result.items():
            if field not in field_values:
                field_values[field] = []
            field_values[field].append(value)
    
    # Analyze field types
    field_analysis = {
        field: analyze_field_type(field, values)
        for field, values in field_values.items()
    }
    
    # Save raw data
    with (output_dir / "ytdlp_raw_output.json").open('w') as f:
        json.dump(results, f, indent=2)
    
    # Generate markdown report
    markdown = ["# yt-dlp Field Analysis\n"]
    markdown.append("## Field Types and Constraints\n")
    markdown.append("| Field | Type | Sample Values | Notes |")
    markdown.append("|-------|------|---------------|--------|")
    
    for field, type_info in sorted(field_analysis.items()):
        values = field_values[field]
        sample = [str(v)[:50] + '...' if len(str(v)) > 50 else str(v) 
                 for v in values[:2] if v is not None]
        markdown.append(f"| {field} | {type_info} | {', '.join(sample)} | |")
    
    with (output_dir / "field_analysis.md").open('w') as f:
        f.write('\n'.join(markdown))

if __name__ == "__main__":
    print("Analyzing yt-dlp output for sample videos...")
    results = []
    for url in SAMPLE_VIDEOS:
        print(f"Processing {url}")
        result = analyze_ytdlp_output(url)
        if result:
            results.append(result)
    
    if results:
        save_analysis_results(results)
        print("\nAnalysis complete! Check the 'analysis' directory for results.")
        print("- Raw output: analysis/ytdlp_raw_output.json")
        print("- Field analysis: analysis/field_analysis.md")
    else:
        print("No results were generated. Check for errors above.")
