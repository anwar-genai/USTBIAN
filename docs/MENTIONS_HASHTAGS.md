# User Mentions and Hashtags Feature

## Overview

This feature adds support for mentioning users (@username) and using hashtags (#tag) in posts and comments.

## Features Implemented

### 1. User Mentions (@username)

#### Backend
- **Mention Parsing**: Utility function to extract @username from post content
- **Automatic Notifications**: When a user mentions someone, a notification is created
- **Real-time**: Notifications are sent via WebSocket in real-time
- **Edit Handling**: 
  - If a mention is removed during edit, the notification is deleted
  - If a new mention is added, a new notification is created
- **Delete Handling**: When a post is deleted, all related mention notifications are cleaned up

#### Frontend
- **Visual Styling**: Mentions appear in bold blue and are clickable
- **Navigation**: Clicking a mention navigates to the user's profile
- **Multiline Support**: Mentions work correctly in multiline posts

#### Notification Format
```
Type: mention
Message: "@username mentioned you in a post"
Metadata: { postId: "..." }
```

### 2. Hashtags (#tag)

#### Frontend
- **Visual Styling**: Hashtags appear in bold purple
- **Parsing**: Hashtags are automatically detected and styled
- **Multiline Support**: Hashtags work correctly in multiline posts
- **Future Ready**: Structure in place for hashtag search feature

## Technical Implementation

### Backend Files

#### New Files
- `backend/src/posts/utils/mention-parser.ts` - Utility functions for parsing mentions and hashtags

#### Modified Files
- `backend/src/posts/posts.service.ts` - Added mention handling on create/update/delete
- `backend/src/posts/posts.module.ts` - Added NotificationsModule import
- `backend/src/notifications/notifications.service.ts` - Added mention notification methods

### Frontend Files

#### New Files
- `web/src/utils/text-parser.tsx` - React components for parsing and rendering mentions/hashtags

#### Modified Files
- `web/src/app/feed/page.tsx` - Updated to use text parser for posts and comments

## Usage Examples

### Mentioning a User
```
Hey @john, check out this awesome project!
```
- User "john" receives a notification
- @john appears in bold blue and is clickable

### Using Hashtags
```
Just finished the #project! #excited #learning
```
- Hashtags appear in bold purple
- Can be used to categorize posts (future: hashtag search)

### Combined
```
Great job @alice on the #hackathon project!
We should collaborate on #nextproject @bob
```
- Both alice and bob receive notifications
- Mentions are blue, hashtags are purple

## API Reference

### Backend Methods

#### PostsService

**`handleMentions(post: PostEntity, authorId: string)`**
- Extracts mentions from post content
- Creates notifications for mentioned users
- Called automatically on post creation

**`handleMentionChanges(post: PostEntity, oldContent: string, newContent: string, authorId: string)`**
- Detects added and removed mentions
- Creates notifications for new mentions
- Deletes notifications for removed mentions
- Called automatically on post update

#### NotificationsService

**`deleteMentionNotification(recipientId: string, actorId: string, postId: string)`**
- Deletes mention notification for a specific user and post
- Emits real-time deletion event

**`deleteAllMentionNotificationsForPost(postId: string)`**
- Deletes all mention notifications for a post
- Called when post is deleted
- Emits real-time deletion events for all affected users

### Frontend Utilities

**`parseMultilineText(text: string): React.ReactNode[]`**
- Parses text with mentions and hashtags
- Preserves line breaks
- Returns React elements for rendering

**`parseTextWithMentionsAndHashtags(text: string): React.ReactNode[]`**
- Parses single line text
- Identifies @mentions and #hashtags
- Returns styled React elements

**`extractMentions(text: string): string[]`**
- Extracts array of usernames from text
- Returns usernames without @ symbol

**`extractHashtags(text: string): string[]`**
- Extracts array of hashtags from text
- Returns hashtags without # symbol

## Notification Flow

### Create Post with Mention
```
User creates post "Hey @alice!"
    ↓
PostsService.create()
    ↓
handleMentions() extracts "@alice"
    ↓
Find user "alice" in database
    ↓
NotificationsService.create()
    ↓
Save notification to database
    ↓
RealtimeGateway.emitNotification()
    ↓
WebSocket sends to alice's client
    ↓
NotificationBell shows new notification
```

### Edit Post - Remove Mention
```
User edits post from "Hey @alice!" to "Hey everyone!"
    ↓
PostsService.update()
    ↓
handleMentionChanges() detects @alice removed
    ↓
NotificationsService.deleteMentionNotification()
    ↓
Delete notification from database
    ↓
RealtimeGateway.emitNotificationDeleted()
    ↓
WebSocket sends deletion to alice's client
    ↓
NotificationBell removes notification
```

### Delete Post
```
User deletes post
    ↓
PostsService.remove()
    ↓
deleteAllMentionNotificationsForPost()
    ↓
Find all mention notifications for post
    ↓
Group by recipient
    ↓
Delete all from database
    ↓
Emit deletion events to all recipients
    ↓
Notifications removed from all users' bells
```

## Styling

### Mentions
- **Color**: Blue (text-blue-600)
- **Font Weight**: Semi-bold
- **Hover Effect**: Darker blue + underline
- **Clickable**: Yes, navigates to user profile
- **Format**: @username

### Hashtags
- **Color**: Purple (text-purple-600)
- **Font Weight**: Semi-bold
- **Clickable**: No (future feature)
- **Format**: #tagname

## Limitations

### Current
- Mentions only work for existing usernames
- No autocomplete for mentions (future feature)
- Hashtags are display-only (no search yet)
- Case-sensitive username matching

### Validation
- Mentions must be valid usernames (alphanumeric + underscore)
- Hashtags must be alphanumeric only
- Maximum 500 characters per post (including mentions/hashtags)

## Future Enhancements

1. **Mention Autocomplete**
   - Show dropdown with matching users as you type @
   - Include avatars and display names
   - Arrow key navigation

2. **Hashtag Search**
   - Click hashtag to see all posts with that tag
   - Trending hashtags section
   - Hashtag analytics

3. **Mention Notifications Enhancement**
   - Group multiple mentions into one notification
   - Show post preview in notification
   - Click notification to jump to specific post

4. **Advanced Parsing**
   - Support for international usernames
   - Emoji in hashtags
   - Multi-word hashtags with underscore

5. **Privacy Controls**
   - Allow users to disable mention notifications
   - Block specific users from mentioning you
   - Private/public hashtags

## Testing Checklist

- [x] Mention user in new post → user receives notification
- [x] Mention multiple users → all receive notifications
- [x] Mention non-existent user → no error, just no notification
- [x] Edit post to add mention → new user receives notification
- [x] Edit post to remove mention → notification deleted
- [x] Delete post → all mention notifications deleted
- [x] Mention appears in blue and bold
- [x] Click mention → navigates to profile
- [x] Hashtag appears in purple and bold
- [x] Multiple hashtags in one post work correctly
- [x] Mentions and hashtags in multiline posts work
- [x] Comments support mentions and hashtags

## Performance Considerations

- **Database Queries**: Uses `IN` clause for bulk user lookups
- **Real-time**: WebSocket events sent only to affected users
- **Parsing**: Regex-based parsing is efficient for short posts
- **Notifications**: Batch processing for multiple mentions

## Security

- **SQL Injection**: Protected by TypeORM parameterized queries
- **XSS**: React automatically escapes text
- **Mention Spam**: Limited by post character limit (500)
- **Notification Spam**: One notification per mention per post

## Browser Compatibility

- **Modern Browsers**: Full support (Chrome, Firefox, Safari, Edge)
- **Mobile**: Fully responsive
- **WebSocket**: Fallbacks handled by Socket.IO

## Dependencies

### Backend
- TypeORM (database queries)
- Socket.IO (real-time notifications)

### Frontend
- Next.js (routing for mention clicks)
- React (rendering parsed text)

## Migration Notes

- No database migrations required
- Existing posts don't have retroactive mention notifications
- NotificationType.MENTION already existed in schema
- Backward compatible with existing notification system

