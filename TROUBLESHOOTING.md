# Troubleshooting Guide

## Issue 1: PDF Upload Returns Error

### Symptoms
- Upload PDF resume → get error (400 or 500)
- Browser console shows errors like:
  - `"Failed to read the PDF file"`
  - `"Internal server error"`
- Backend is running but PDF isn't accepted

### Quick Fix - Now Supports ALL PDFs! ✅

**As of the latest update, the app now accepts ANY PDF format!** Even if automatic parsing fails, you can enter data manually.

#### Step 1: Ensure OpenAI API Key is Set

1. **Get an OpenAI API key**: https://platform.openai.com/api-keys
2. **Create `backend/.env` file** (if it doesn't exist)
3. **Add your API key**:
   ```env
   OPENAI_API_KEY=sk-your-actual-key-here
   ```
4. **Restart the backend**:
   ```bash
   cd backend
   npm run start:dev
   ```
5. **Verify** you see: `[AIService] OpenAI service initialized successfully`

#### Step 2: Upload Your PDF

Now when you upload a PDF:

**If parsing works:** ✅
- You'll see pre-filled form with your data
- Review and save!

**If parsing fails:** ✅ (Still works!)
- You'll see a friendly dialog:
  ```
  ✅ File uploaded successfully!
  
  ⚠️ We couldn't automatically extract data from your PDF.
  This can happen with certain PDF formats.
  
  Would you like to enter your information manually?
  ```
- Click OK → Enter data manually or copy-paste from your PDF
- Save and done!

### What Changed

The app now has **graceful fallback**:
- ❌ Before: PDF parse fails → Error → Blocked
- ✅ After: PDF parse fails → Manual entry → Success!

### Detailed Guide
See [PDF_UPLOAD_FIXED.md](PDF_UPLOAD_FIXED.md) for complete details on the fix.

---

## Issue 2: "Get ATS Score" Button Fails - SOLVED! ✅

### Symptoms
- DOCX upload works and extracts data ✅
- Click "Get ATS Score & Suggestions" button
- Get error: `Failed to create resume: 400` 
- Error says: `"property rawText should not exist"`
- No score or suggestions appear

### Root Cause - FOUND!
The uploaded resume data includes metadata fields (`rawText`, `parsingSuccess`, `fileName`) that the backend DTO doesn't accept. When trying to create the temp resume, validation fails.

### Quick Fix - Filter Extra Fields! ✅

**The fix:** Filter out metadata fields before sending to backend.

#### Step 1: Restart Frontend (to load the fix)

```bash
cd web
# Press Ctrl+C to stop
npm run dev
```

Wait for it to start on port 3001.

#### Step 2: Upload and Get ATS Score

1. Go to http://localhost:3001/career
2. Upload your DOCX resume
3. Click "🚀 Get ATS Score & Suggestions"
4. Should work now! ✅

#### What Was Fixed

**Before:**
```typescript
// Sent ALL fields including metadata
const tempResume = await api.createResume(token, {
  title: "...",
  ...resumeData, // Includes rawText, parsingSuccess, fileName
});
// ❌ Backend rejects: "property rawText should not exist"
```

**After:**
```typescript
// Filter out metadata fields
const { rawText, parsingSuccess, fileName, error, ...cleanResumeData } = resumeData;

const tempResume = await api.createResume(token, {
  title: "...",
  ...cleanResumeData, // Only valid resume fields
});
// ✅ Backend accepts it!
```

#### Why This Happened

1. Backend adds helpful metadata when parsing: `rawText`, `parsingSuccess`, `fileName`
2. Frontend stores this data in sessionStorage
3. When creating resume, frontend sends ALL data including metadata
4. Backend DTO validation rejects unknown fields
5. Resume creation fails → Optimization never runs

#### Now It Works Because

The frontend now filters out metadata before sending to backend!

### Detailed Guide
See [FINAL_FIX.md](FINAL_FIX.md) for complete details.

---

## Issue 3: Getting Unexpected Text When Saving Resume

If you're seeing text like "A production-ready real-time interview practice agent..." when saving a resume, follow these steps:

### 1. Check Your Branch
```bash
git branch
```
Make sure you're on `feature/career-tools`

### 2. Verify Backend is Running Correctly

**Stop any running backend:**
```bash
# On Windows (PowerShell)
Get-Process -Name node | Stop-Process

# Or close the terminal running the backend
```

**Restart the backend:**
```bash
cd backend
npm run start:dev
```

**Look for these log messages:**
- ✅ `[AIService] OpenAI service initialized successfully`
- ✅ `Application successfully started`
- ✅ Server running on `http://localhost:3000`

### 3. Check Environment Variables

Make sure `backend/.env` has:
```env
OPENAI_API_KEY=sk-your-actual-key-here
# NOT a placeholder, must be a real key
```

### 4. Clear Browser Cache

**In Chrome/Edge:**
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

**Or:**
- Try incognito/private window

### 5. Check Console Logs

**When you try to save, check:**

**Browser Console (F12):**
```
Saving resume data: { title: "...", ... }
Resume created: { id: "...", ... }
```

**Backend Console:**
```
Creating resume for user: ...
Resume data: { "title": "...", ... }
Resume saved successfully: ...
```

### 6. Test API Directly

**Open browser DevTools Console and run:**
```javascript
const token = localStorage.getItem('token');
const testData = {
  title: "Test Resume",
  fullName: "John Doe",
  email: "test@test.com"
};

fetch('http://localhost:3000/career/resumes', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(testData)
})
.then(r => r.json())
.then(d => console.log('Response:', d))
.catch(e => console.error('Error:', e));
```

### 7. Check for Port Conflicts

Make sure:
- Backend is on `http://localhost:3000`
- Frontend is on `http://localhost:3001` (or your configured port)
- No other services using these ports

### 8. Database Check

**Option 1: Reset Database Tables**
```bash
cd backend
# If using synchronize: true, just restart
npm run start:dev
```

**Option 2: Check Database**
```sql
-- Connect to PostgreSQL
SELECT * FROM resumes ORDER BY created_at DESC LIMIT 1;
```

### 9. Try a Clean Test

1. **Stop everything**
2. **Clear browser completely**
3. **Start backend fresh:**
   ```bash
   cd backend
   npm run start:dev
   ```
4. **Start frontend:**
   ```bash
   cd web
   npm run dev
   ```
5. **Login**
6. **Go to Career Center**
7. **Create minimal resume:**
   - Title: "Software Engineer Resume"
   - Your Name: "Test User"
   - Email: "test@example.com"
   - Skip other fields
   - Go to Preview step
   - Click Save

### 10. Check What You See

**Where exactly did you see that text?**
- [ ] In the summary field?
- [ ] As an error message?
- [ ] In the saved resume?
- [ ] In the browser console?

### Expected Behavior

When you save a resume, you should:
1. See "Resume saved successfully!" alert
2. Be redirected to the resume detail page
3. See your resume data displayed

### Common Causes

1. **Wrong OpenAI Key**: Set a valid key in `backend/.env`
2. **Cached Data**: Clear browser cache
3. **Wrong Backend**: Make sure you're running the feature/career-tools backend
4. **Port Conflict**: Another service might be on port 3000
5. **Pasted Text**: The text might have been accidentally pasted into a field

### Still Having Issues?

Please provide:
1. **Browser console logs** (full output when saving)
2. **Backend console logs** (full output when saving)
3. **Screenshot** of where you see the strange text
4. **Steps you took** before seeing the issue

---

## Quick Fix Commands

```bash
# 1. Make sure you're on the right branch
git checkout feature/career-tools

# 2. Stop all Node processes (Windows PowerShell)
Get-Process -Name node | Stop-Process

# 3. Restart backend
cd backend
npm run start:dev

# 4. In new terminal, restart frontend
cd web
npm run dev

# 5. Clear browser cache and try again
```

