/**
 * Utility functions for parsing mentions and hashtags from post content
 */

/**
 * Extract unique @username mentions from text
 * Returns array of usernames without the @ symbol
 */
export function extractMentions(content: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const matches = content.matchAll(mentionRegex);
  const usernames = Array.from(matches, match => match[1]);
  
  // Return unique usernames
  return [...new Set(usernames)];
}

/**
 * Extract unique #hashtags from text
 * Returns array of hashtags without the # symbol
 */
export function extractHashtags(content: string): string[] {
  const hashtagRegex = /#(\w+)/g;
  const matches = content.matchAll(hashtagRegex);
  const hashtags = Array.from(matches, match => match[1].toLowerCase());
  
  // Return unique hashtags
  return [...new Set(hashtags)];
}

/**
 * Find mentions that were removed between old and new content
 */
export function getRemovedMentions(oldContent: string, newContent: string): string[] {
  const oldMentions = extractMentions(oldContent);
  const newMentions = extractMentions(newContent);
  
  return oldMentions.filter(username => !newMentions.includes(username));
}

/**
 * Find mentions that were added between old and new content
 */
export function getAddedMentions(oldContent: string, newContent: string): string[] {
  const oldMentions = extractMentions(oldContent);
  const newMentions = extractMentions(newContent);
  
  return newMentions.filter(username => !oldMentions.includes(username));
}

