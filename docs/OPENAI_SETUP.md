# OpenAI API Setup Guide

## Overview
The Career Tools feature requires an OpenAI API key to parse and optimize resumes. Without this key, you'll get a 500 error when uploading resumes.

## Quick Fix for the PDF Upload Error

### What's Happening
When you upload a PDF resume, the backend:
1. ✅ Extracts text from the PDF using `pdf-parse`
2. ❌ Tries to parse it with OpenAI (fails if no API key)
3. ❌ Returns a 500 Internal Server Error

### Solution: Add Your OpenAI API Key

#### Step 1: Get an OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign up or log in to your account
3. Navigate to **API Keys** section
4. Click **"Create new secret key"**
5. Copy the key (starts with `sk-...`)
6. **Important**: Save this key somewhere safe - you can't view it again!

#### Step 2: Add the Key to Your Backend

Create a `.env` file in the `backend/` directory with this content:

```env
# Database Configuration (adjust to match your setup)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=ustbian

# JWT Authentication (use your existing secret)
JWT_SECRET=your_jwt_secret_key_here

# OpenAI API Configuration
OPENAI_API_KEY=sk-your-actual-api-key-here

# Server Configuration
PORT=3000
NODE_ENV=development
```

**Replace `sk-your-actual-api-key-here` with your actual OpenAI API key!**

#### Step 3: Restart Your Backend

If your backend is running, restart it to load the new environment variables:

```bash
cd backend
npm run start:dev
```

You should see this log message:
```
[AIService] OpenAI service initialized successfully
```

#### Step 4: Test PDF Upload

Now try uploading your PDF resume again. It should work! 🎉

## What AI Features Use the API Key

The OpenAI API key enables these features:

### Resume Tools
- ✨ **Resume Parsing**: Extract structured data from uploaded PDFs/DOCX
- 🎯 **Resume Generation**: Create professional resumes from scratch
- 📊 **Resume Optimization**: Get ATS scores and improvement suggestions
- 📝 **Cover Letter Generation**: Create tailored cover letters

### Post Tools
- 📝 **Text Generation**: Generate post suggestions from prompts
- ✨ **Text Enhancement**: Make posts more engaging
- 🎯 **Text Shortening**: Condense long posts

## Cost Considerations

- OpenAI charges per token (words) used
- We use `gpt-4o-mini` which is very affordable
- Resume parsing: ~$0.01-0.02 per resume
- Post generation: ~$0.001-0.005 per post
- Monthly free credits available for new accounts

## Troubleshooting

### Error: "OpenAI API key not configured"
- ✅ Check that `.env` file exists in `backend/` directory
- ✅ Verify `OPENAI_API_KEY=sk-...` is set correctly
- ✅ No extra spaces around the `=` sign
- ✅ Restart the backend after adding the key

### Error: "401 Unauthorized" or "Invalid API key"
- ❌ Your API key is incorrect or expired
- ✅ Get a new key from OpenAI Platform
- ✅ Make sure you copied the entire key (starts with `sk-`)

### Error: "429 Rate limit exceeded"
- ❌ You've exceeded OpenAI's rate limits
- ✅ Wait a few minutes and try again
- ✅ Check your OpenAI account usage/limits

### Error: "Failed to extract text from PDF"
- ❌ The PDF might be image-based (scanned) or corrupted
- ✅ Try re-saving the PDF from Word/Google Docs
- ✅ Make sure it's a text-based PDF (you can select text)

## Alternative: Disable AI Features (Development Only)

If you don't want to use OpenAI for development:

1. Add a mock service (not recommended for production)
2. Or skip the career tools feature temporarily

## Security Notes

⚠️ **Never commit your `.env` file to Git!**

The `.env` file is already in `.gitignore`, but double-check:

```bash
git status
```

If you see `.env` listed, **do NOT commit it**. Instead:

```bash
git restore .env  # Unstage it
```

## Support

- OpenAI Documentation: https://platform.openai.com/docs
- OpenAI API Status: https://status.openai.com/
- Get help: https://community.openai.com/

