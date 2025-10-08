# Development Guidelines for Ustbian

## How to Approach Complex Features

### 1. **Start Simple, Add Complexity Later**

**❌ Bad Approach:**
- Implement real-time WebSocket notifications with complex state management
- Add extensive debugging and logging
- Try to handle all edge cases upfront

**✅ Good Approach:**
- Start with polling (fetch notifications every X seconds)
- Get it working reliably first
- Add real-time features as an enhancement later

### 2. **Time-Box Debugging**

**Rule: If debugging takes more than 30 minutes without progress, step back and simplify.**

**Options when stuck:**
1. **Simplify**: Remove the complex feature, use a simpler approach
2. **Isolate**: Create a minimal test case to reproduce the issue
3. **Alternative**: Find a different way to achieve the same goal
4. **Ask for help**: Document the issue and seek external input

### 3. **Real-Time Features: Best Practices**

#### When to Use Real-Time (WebSockets)
- Chat applications
- Live collaboration tools
- Stock tickers / live dashboards
- Gaming

#### When NOT to Use Real-Time
- Notifications (polling every 30s is fine)
- User profiles
- Settings updates
- Most CRUD operations

#### If You Must Use Real-Time:

**1. Use a proven library/service:**
- Socket.io (what we use)
- Pusher
- Ably
- Firebase Realtime Database

**2. Have a fallback:**
```typescript
// Always have polling as a backup
useEffect(() => {
  // Try real-time first
  setupWebSocket();
  
  // But also poll as backup
  const interval = setInterval(() => {
    fetchData();
  }, 30000); // 30 seconds
  
  return () => clearInterval(interval);
}, []);
```

**3. Keep it simple:**
```typescript
// ❌ Complex
socket.on('notification.created', handleCreate);
socket.on('notification.updated', handleUpdate);
socket.on('notification.deleted', handleDelete);
socket.on('notification.read', handleRead);

// ✅ Simple
socket.on('notifications.changed', () => {
  fetchNotifications(); // Just refetch everything
});
```

### 4. **State Management Principles**

**Keep State Close to Where It's Used:**
```typescript
// ❌ Global state for everything
const GlobalContext = {
  notifications,
  posts,
  users,
  comments,
  likes,
  // ... 50 more things
};

// ✅ Separate contexts
const NotificationContext = { notifications };
const PostContext = { posts };
```

**Use Server State Libraries:**
- React Query / TanStack Query
- SWR
- Apollo Client (for GraphQL)

These handle:
- Caching
- Refetching
- Loading states
- Error handling
- Optimistic updates

### 5. **Mobile Development Best Practices**

**For Flutter:**
1. Use `Provider` or `Riverpod` for state management
2. Use `http` or `dio` for API calls
3. Keep business logic separate from UI
4. Use `FutureBuilder` and `StreamBuilder` appropriately

**API Integration:**
```dart
// ❌ Complex real-time
Stream<List<Notification>> watchNotifications() {
  return socket.stream.map(...);
}

// ✅ Simple polling
Future<List<Notification>> fetchNotifications() async {
  final response = await http.get(...);
  return parseNotifications(response);
}

// Then use with a timer
Timer.periodic(Duration(seconds: 30), (_) {
  fetchNotifications();
});
```

### 6. **Debugging Strategy**

**When Something Doesn't Work:**

1. **Check the basics first** (5 minutes):
   - Is the server running?
   - Is the API endpoint correct?
   - Are there any console errors?
   - Is the data in the correct format?

2. **Add minimal logging** (10 minutes):
   - Log request/response
   - Log state changes
   - Don't add 50 console.logs everywhere

3. **Isolate the problem** (15 minutes):
   - Does it work in Postman/curl?
   - Does it work with hardcoded data?
   - Does it work without real-time features?

4. **If still stuck** (30 minutes total):
   - **STOP**
   - Document what you tried
   - Simplify the approach
   - Move on to something else

### 7. **Code Organization**

**File Structure:**
```
src/
├── features/          # Feature-based organization
│   ├── notifications/
│   │   ├── api.ts     # API calls
│   │   ├── types.ts   # TypeScript types
│   │   ├── hooks.ts   # Custom hooks
│   │   └── components/
│   ├── posts/
│   └── users/
├── shared/            # Shared utilities
│   ├── components/
│   ├── hooks/
│   └── utils/
└── lib/               # Third-party integrations
    ├── api.ts
    └── socket.ts
```

### 8. **Testing Strategy**

**Priority Order:**
1. **Manual testing** - Does it work when you click around?
2. **Integration tests** - Do the APIs work together?
3. **Unit tests** - Do individual functions work?
4. **E2E tests** - Does the whole flow work?

**Don't write tests for:**
- Code that's likely to change
- Simple getters/setters
- Third-party library wrappers

**Do write tests for:**
- Business logic
- Data transformations
- Critical user flows
- Bug fixes (regression tests)

### 9. **Performance Optimization**

**Rules:**
1. **Don't optimize prematurely**
2. **Measure before optimizing**
3. **Optimize the biggest bottleneck first**

**Common Issues:**
- Too many re-renders → Use React.memo, useMemo
- Large lists → Use virtualization (react-window)
- Heavy computations → Use web workers
- Large bundles → Code splitting, lazy loading

### 10. **Git Workflow**

**Branch Strategy:**
```
main/master    → Production-ready code
develop        → Integration branch
feature/*      → New features
bugfix/*       → Bug fixes
hotfix/*       → Urgent production fixes
```

**Commit Messages:**
```
feat: Add notification bell component
fix: Resolve notification deletion issue
refactor: Simplify notification context
docs: Update development guidelines
```

**When to Commit:**
- After completing a logical unit of work
- Before switching tasks
- At the end of the day
- When tests pass

**When to Push:**
- After completing a feature
- Before asking for code review
- At least once per day

### 11. **Code Review Checklist**

**Before Submitting:**
- [ ] Code works as expected
- [ ] No console errors
- [ ] No linter warnings
- [ ] Removed debug code/console.logs
- [ ] Updated documentation if needed
- [ ] Self-reviewed the changes

**What Reviewers Look For:**
- Code clarity and readability
- Potential bugs
- Performance issues
- Security concerns
- Better alternatives

### 12. **Common Pitfalls to Avoid**

1. **Over-engineering** - Don't build for future requirements
2. **Under-engineering** - Don't hack everything together
3. **Premature optimization** - Make it work first
4. **Analysis paralysis** - Pick an approach and try it
5. **Not reading error messages** - They usually tell you what's wrong
6. **Copy-pasting without understanding** - Understand before using
7. **Not asking for help** - Ask after 30 minutes of being stuck

### 13. **Resources**

**Documentation:**
- React: https://react.dev
- Flutter: https://flutter.dev
- NestJS: https://nestjs.com
- TypeORM: https://typeorm.io

**Learning:**
- Frontend Masters
- Egghead.io
- Official documentation (always start here)

**Tools:**
- VS Code with extensions
- Postman for API testing
- React DevTools
- Flutter DevTools

---

## Summary

**The Golden Rule:** 
> "Make it work, make it right, make it fast" - in that order.

**When in doubt:**
1. Start simple
2. Get it working
3. Refactor if needed
4. Optimize if necessary

**Remember:**
- Perfect is the enemy of good
- Shipping is better than perfecting
- You can always improve it later
- Done is better than perfect
