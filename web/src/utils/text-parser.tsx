import React from 'react';
import Link from 'next/link';

/**
 * Parse text and render mentions (@username) and hashtags (#tag) with special styling
 */
export function parseTextWithMentionsAndHashtags(text: string): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  
  // Regex to match @mentions, #hashtags, or regular text
  // Matches @username (letters, numbers, underscore) and #hashtag (letters, numbers)
  const regex = /(@\w+)|(#\w+)|([^@#]+)/g;
  
  let match;
  let key = 0;
  
  while ((match = regex.exec(text)) !== null) {
    const [fullMatch, mention, hashtag, regularText] = match;
    
    if (mention) {
      // Render @mention as a link
      const username = mention.slice(1); // Remove @ symbol
      elements.push(
        <Link
          key={`mention-${key++}`}
          href={`/user/${username}`}
          className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition"
          onClick={(e) => e.stopPropagation()} // Prevent parent click handlers
        >
          {mention}
        </Link>
      );
    } else if (hashtag) {
      // Render #hashtag with special styling (not clickable for now, but can be made searchable later)
      elements.push(
        <span
          key={`hashtag-${key++}`}
          className="font-semibold text-purple-600"
        >
          {hashtag}
        </span>
      );
    } else if (regularText) {
      // Regular text
      elements.push(
        <span key={`text-${key++}`}>
          {regularText}
        </span>
      );
    }
  }
  
  return elements;
}

/**
 * Parse multiline text preserving line breaks
 */
export function parseMultilineText(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  
  lines.forEach((line, index) => {
    elements.push(
      <React.Fragment key={`line-${index}`}>
        {parseTextWithMentionsAndHashtags(line)}
        {index < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
  
  return elements;
}

/**
 * Extract mentions from text (for other uses like autocomplete)
 */
export function extractMentions(text: string): string[] {
  const regex = /@(\w+)/g;
  const matches = text.matchAll(regex);
  return Array.from(matches, match => match[1]);
}

/**
 * Extract hashtags from text
 */
export function extractHashtags(text: string): string[] {
  const regex = /#(\w+)/g;
  const matches = text.matchAll(regex);
  return Array.from(matches, match => match[1]);
}

