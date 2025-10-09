import { useEffect, useRef } from 'react';

export const useAutoExpandTextarea = (
  textareaRef: React.RefObject<HTMLTextAreaElement>,
  value: string,
  minHeight = 56,
  maxHeight = 200
) => {
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to min to get accurate scrollHeight
    textarea.style.height = `${minHeight}px`;
    
    // Calculate new height based on content
    const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
    
    // Set the new height with smooth transition
    textarea.style.height = `${newHeight}px`;
    
    // Add scrollbar if content exceeds max height
    if (textarea.scrollHeight > maxHeight) {
      textarea.style.overflowY = 'auto';
    } else {
      textarea.style.overflowY = 'hidden';
    }
  }, [value, textareaRef, minHeight, maxHeight]);
};
