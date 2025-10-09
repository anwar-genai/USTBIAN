import { useState, useCallback, useRef, useEffect } from 'react';

interface MentionState {
  show: boolean;
  query: string;
  position: { top: number; left: number };
  cursorPosition: number;
}

export function useMentionAutocomplete(textareaRef: React.RefObject<HTMLTextAreaElement>) {
  const [mentionState, setMentionState] = useState<MentionState>({
    show: false,
    query: '',
    position: { top: 0, left: 0 },
    cursorPosition: 0,
  });

  const detectMention = useCallback((text: string, cursorPos: number) => {
    // Find the @ symbol before the cursor
    const textBeforeCursor = text.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    // Check if there's an @ before cursor and no space after it
    if (lastAtIndex === -1) {
      return { shouldShow: false, query: '', startPos: 0 };
    }

    const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
    
    // If there's a space or newline after @, don't show autocomplete
    if (textAfterAt.includes(' ') || textAfterAt.includes('\n')) {
      return { shouldShow: false, query: '', startPos: 0 };
    }

    // Valid mention query
    return { shouldShow: true, query: textAfterAt, startPos: lastAtIndex };
  }, []);

  const calculatePosition = useCallback((textarea: HTMLTextAreaElement, cursorPos: number) => {
    // Simple positioning: just below the textarea
    const textareaRect = textarea.getBoundingClientRect();
    
    // Calculate dropdown position - position it below the textarea
    const top = textareaRect.bottom + window.scrollY + 5;
    const left = textareaRect.left + window.scrollX;

    return { top, left };
  }, []);

  const handleTextChange = useCallback((text: string, cursorPos: number) => {
    const { shouldShow, query, startPos } = detectMention(text, cursorPos);

    console.log('Mention detection:', { shouldShow, query, startPos, cursorPos, text });

    if (shouldShow && textareaRef.current) {
      const position = calculatePosition(textareaRef.current, cursorPos);
      console.log('Setting mention state:', { show: true, query, position });
      setMentionState({
        show: true,
        query,
        position,
        cursorPosition: startPos,
      });
    } else {
      setMentionState((prev) => ({ ...prev, show: false }));
    }
  }, [detectMention, calculatePosition, textareaRef]);

  const handleMentionSelect = useCallback((username: string, text: string, setText: (text: string) => void) => {
    if (!textareaRef.current) return;

    const cursorPos = mentionState.cursorPosition;
    const beforeMention = text.substring(0, cursorPos);
    const afterCursor = text.substring(textareaRef.current.selectionStart);

    // Insert @username with a space
    const newText = `${beforeMention}@${username} ${afterCursor}`;
    setText(newText);

    // Close autocomplete
    setMentionState((prev) => ({ ...prev, show: false }));

    // Set cursor after the mention
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = beforeMention.length + username.length + 2; // +2 for @ and space
        textareaRef.current.selectionStart = newCursorPos;
        textareaRef.current.selectionEnd = newCursorPos;
        textareaRef.current.focus();
      }
    }, 0);
  }, [mentionState.cursorPosition, textareaRef]);

  const closeMentionAutocomplete = useCallback(() => {
    setMentionState((prev) => ({ ...prev, show: false }));
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mentionState.show && textareaRef.current && !textareaRef.current.contains(e.target as Node)) {
        // Check if click is on autocomplete dropdown
        const target = e.target as HTMLElement;
        if (!target.closest('.mention-autocomplete')) {
          closeMentionAutocomplete();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mentionState.show, closeMentionAutocomplete, textareaRef]);

  return {
    mentionState,
    handleTextChange,
    handleMentionSelect,
    closeMentionAutocomplete,
  };
}

