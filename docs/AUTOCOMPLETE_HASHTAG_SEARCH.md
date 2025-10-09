# Mention Autocomplete & Hashtag Search Features

## Overview

Enhanced the mention and hashtag system with interactive autocomplete and search capabilities.

## Features Implemented

### 1. Mention Autocomplete Dropdown

#### How It Works
1. User types `@` in post creation or edit textarea
2. Dropdown appears below the textarea
3. As user types username, it searches and filters users
4. User can select with mouse click or keyboard (↑↓ arrows, Enter)
5. Selected username is automatically inserted with a space

#### Components
- **`MentionAutocomplete.tsx`**: The dropdown UI component
  - Shows up to 5 matching users
  - Displays avatar, display name, and @username
  - Keyboard navigation support
  - Loading state with spinner
  - Empty states for different scenarios

- **`useMentionAutocomplete.ts`**: Custom React hook
  - Detects @ symbol in textarea
  - Calculates dropdown position
  - Handles user selection
  - Manages cursor position after insertion

#### User Experience
```
Type: "@j"
  ↓
Dropdown shows:
  [👤] John Doe (@john)  ✓
  [👤] Jane Smith (@jane)
  [👤] Jake Wilson (@jake)
  
Select with:
- Mouse click
- ↑↓ arrows + Enter
- Esc to close

Result: "@john " inserted at cursor
```

#### Features
- Real-time search (debounced 200ms)
- Keyboard navigation (↑↓ arrows)
- Enter to select
- Esc to close
- Click outside to close
- Prevents form submission when selecting

### 2. Hashtag Search Page

#### How It Works
1. User clicks any `#hashtag` in a post
2. Navigates to `/hashtag/[tag]` page
3. Shows all posts containing that hashtag
4. Case-insensitive search

#### Backend
- **Endpoint**: `GET /posts/hashtag/:tag`
- **Search**: Case-insensitive LIKE query
- **Returns**: Posts with commentsCount and likesCount

#### Frontend
- Beautiful dedicated page for each hashtag
- Shows hashtag header with post count
- Lists all matching posts
- Empty state with call-to-action
- Back button and "Go to Feed" button

#### User Experience
```
Post content: "Learning #react is awesome!"
                        ↓ Click
Navigate to /hashtag/react
                        ↓
┌────────────────────────────┐
│ #  #react                  │
│    42 posts                │
├────────────────────────────┤
│ All posts with #react...  │
└────────────────────────────┘
```

## Files Modified

### Backend
- `backend/src/posts/posts.service.ts`
  - Added `searchByHashtag()` method

- `backend/src/posts/posts.controller.ts`
  - Added `GET /posts/hashtag/:tag` endpoint

### Frontend

#### New Files
- `web/src/components/MentionAutocomplete.tsx`
- `web/src/hooks/useMentionAutocomplete.ts`
- `web/src/app/hashtag/[tag]/page.tsx`

#### Modified Files
- `web/src/app/feed/page.tsx`
  - Integrated mention autocomplete
  - Added refs for textareas
  - Added event handlers

- `web/src/utils/text-parser.tsx`
  - Made hashtags clickable links

- `web/src/lib/api.ts`
  - Added `searchByHashtag()` method

## Technical Details

### Mention Detection Logic
```javascript
// Detects @ followed by characters (no spaces)
const lastAtIndex = textBeforeCursor.lastIndexOf('@');
const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);

// Valid if no space or newline after @
if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
  return { shouldShow: true, query: textAfterAt };
}
```

### Position Calculation
```javascript
// Simple positioning: below the textarea
const textareaRect = textarea.getBoundingClientRect();
const top = textareaRect.bottom + window.scrollY + 5;
const left = textareaRect.left + window.scrollX;
```

### Hashtag Search Query
```sql
-- Case-insensitive LIKE search
SELECT * FROM posts 
WHERE LOWER(content) LIKE '%#react%'
ORDER BY created_at DESC;
```

## Keyboard Shortcuts

### Mention Autocomplete
- `↑` - Move selection up
- `↓` - Move selection down
- `Enter` - Select highlighted user
- `Esc` - Close dropdown

### General
- `@` - Trigger mention autocomplete
- `#tag` + Click - Search hashtag

## Styling

### Dropdown
- White background with shadow
- Blue highlight for selected item
- Avatars or colored initials
- Max height 256px (scrollable)
- Z-index 50 (above content)

### Hashtag Page
- Purple theme (#hashtag icon)
- Grid layout for posts
- Hover effects on posts
- Empty state with CTA button

## Edge Cases Handled

1. **Empty Query**: Shows "Type a username to search..."
2. **No Results**: Shows "No users found"
3. **Not Logged In**: Gracefully handles missing token
4. **No Hashtag Posts**: Shows empty state with CTA
5. **Keyboard in Empty List**: Only Esc works
6. **Click Outside**: Closes dropdown
7. **Form Submission**: Prevented when selecting mention

## Performance

- **Debounced Search**: 200ms delay to reduce API calls
- **Limited Results**: Only 5 users shown in dropdown
- **Efficient Queries**: Uses indexed database searches
- **React Optimization**: Proper useCallback and useMemo usage

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive
- Touch-friendly (large tap targets)
- Keyboard accessible

## Future Enhancements

1. **Mention Autocomplete**
   - Cache recent/frequent users
   - Show online status indicator
   - Group by recent interactions
   - Fuzzy search matching

2. **Hashtag Search**
   - Trending hashtags sidebar
   - Hashtag analytics (usage over time)
   - Related hashtags suggestions
   - Hashtag following

3. **General**
   - Mention autocomplete in comments
   - Hashtag autocomplete while typing
   - Search history
   - Saved searches

## Debugging

Console logs added for debugging:
- Mention detection: `console.log('Mention detection:', ...)`
- State changes: `console.log('Setting mention state:', ...)`
- Component renders: `console.log('MentionAutocomplete render:', ...)`

Check browser console to see:
- When @ is detected
- Query value
- Position calculations
- Component render cycles

## Testing Checklist

- [x] Type @ shows dropdown
- [x] Type @j filters to users starting with "j"
- [x] Arrow keys navigate list
- [x] Enter selects user
- [x] Esc closes dropdown
- [x] Click outside closes dropdown
- [x] Selected user is inserted correctly
- [x] Cursor moves after inserted mention
- [x] Works in post creation
- [x] Works in post editing
- [x] Click hashtag navigates to search page
- [x] Hashtag page shows correct posts
- [x] Empty state displays properly
- [x] Back button works
- [x] Mobile responsive

## Known Issues

None currently. If dropdown doesn't appear:
1. Check browser console for errors
2. Verify console.log messages
3. Check textarea ref is set
4. Ensure user is logged in (for API calls)

## API Reference

### Backend

#### GET /posts/hashtag/:tag
Search posts by hashtag.

**Parameters:**
- `tag` (path): Hashtag to search (without #)

**Response:**
```json
[
  {
    "id": "uuid",
    "content": "Post with #hashtag",
    "author": { ... },
    "commentsCount": 5,
    "likesCount": 10,
    "createdAt": "2025-10-09T..."
  }
]
```

### Frontend

#### api.searchByHashtag(tag: string)
Search posts by hashtag from frontend.

**Parameters:**
- `tag`: Hashtag name (without #)

**Returns:** Promise<Post[]>

**Example:**
```javascript
const posts = await api.searchByHashtag('react');
```

## Success Metrics

- Faster mention completion (no typing full usernames)
- Better hashtag discovery and engagement
- Reduced typos in mentions
- Increased hashtag usage
- Better content categorization

## Conclusion

These features significantly enhance the social interaction capabilities of the platform, making it easier to mention users and discover content through hashtags.

