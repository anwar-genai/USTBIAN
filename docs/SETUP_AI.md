# Quick Setup Guide for AI Features

This is a condensed guide to get AI features running quickly.

## Prerequisites

- OpenAI API account
- API key from https://platform.openai.com/api-keys

## Setup Steps

### 1. Get OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. **Important**: Save it securely - you won't be able to see it again!

### 2. Backend Configuration

```bash
# Navigate to backend directory
cd backend

# Install OpenAI SDK
npm install openai

# Create or edit .env file
# Add this line (replace with your actual key):
OPENAI_API_KEY=sk-your-actual-api-key-here

# Start the backend
npm run start:dev
```

### 3. Verify Installation

Check the backend console output. You should see:
```
[AIService] OpenAI service initialized successfully
```

If you see a warning about missing API key, double-check step 2.

### 4. Test the Features

1. Open the application in your browser
2. Log in to your account
3. Go to the feed page
4. Look for the "AI Assistant" toolbar below the post input
5. Click "Generate" and try creating a post!

## That's It! 🎉

The AI features are now active. See `AI_FEATURES.md` for detailed usage instructions.

## Quick Troubleshooting

**Problem**: "AI service is not configured" error
- **Solution**: Check that OPENAI_API_KEY is in your `.env` file and restart the backend

**Problem**: Slow responses
- **Solution**: Normal - AI processing takes 1-3 seconds. Check your internet connection.

**Problem**: "Failed to generate text" error
- **Solution**: Verify your API key is valid and you have credits at https://platform.openai.com/usage

## Environment Variables Reference

Add to `backend/.env`:
```env
# Required for AI features
OPENAI_API_KEY=sk-your-openai-api-key-here

# Existing variables (keep these)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ustbian
DB_USER=postgres
DB_PASSWORD=postgres
TYPEORM_SYNC=true
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
```

## Cost Estimate

Using GPT-4o-mini (default model):
- Generate: ~$0.03-0.05 per request
- Enhance: ~$0.01-0.02 per request  
- Shorten: ~$0.01-0.02 per request

Typical usage: ~$1-5 per month for moderate use.

Monitor usage: https://platform.openai.com/usage

## API Key Security

✅ **DO**:
- Store in `.env` file
- Add `.env` to `.gitignore`
- Use environment variables in production
- Rotate keys periodically

❌ **DON'T**:
- Commit to version control
- Share publicly
- Hardcode in source files
- Use in client-side code

## Need Help?

- Full documentation: See `AI_FEATURES.md`
- OpenAI docs: https://platform.openai.com/docs
- Check logs: Backend console and browser console

