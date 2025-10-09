import { useEffect } from 'react';

export function useAutoResizeTextarea(
  textareaRef: React.RefObject<HTMLTextAreaElement>,
  value: string,
  minHeight = 48,  // Minimum height in pixels (single line)
  maxHeight = 200, // Maximum height in pixels
) {
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to min to get accurate scrollHeight
    textarea.style.height = `${minHeight}px`;
    
    // Calculate new height based on content
    const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
    
    // Set the new height
    textarea.style.height = `${newHeight}px`;
    
    // Add scrollbar if content exceeds max height
    if (textarea.scrollHeight > maxHeight) {
      textarea.style.overflowY = 'auto';
    } else {
      textarea.style.overflowY = 'hidden';
    }
  }, [value, textareaRef, minHeight, maxHeight]);
}

