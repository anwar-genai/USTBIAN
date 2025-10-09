# AI-Powered Post Generation Features

This document describes the AI-powered features for post text generation and modification in Ustbian.

## Overview

The application now includes AI capabilities powered by OpenAI's GPT models to help users create better posts. The features include:

- **Generate from Scratch**: Create post content from a simple prompt
- **Enhance Text**: Improve existing text with better grammar, clarity, and tone
- **Shorten Text**: Automatically reduce text length while preserving meaning
- **Multiple Suggestions**: Get 3 different variations when generating content

## Features

### 1. AI Text Generation
Users can generate post content by providing a simple prompt. The AI returns 3 different suggestions to choose from.

**How to use:**
1. Click the "Generate" button in the AI toolbar
2. Enter a prompt describing what you want to post about
3. Review the 3 AI-generated suggestions
4. Select one to insert into your post

### 2. Text Enhancement
Improve existing text with different tone options:
- **Auto**: General improvement (grammar, clarity)
- **Professional**: Business-appropriate tone
- **Casual**: Relaxed, informal tone
- **Friendly**: Warm, approachable tone
- **Humorous**: Add humor and lightheartedness

**How to use:**
1. Type or paste text in the post field
2. Click the "Enhance" button
3. Choose a tone option from the dropdown
4. The text will be automatically replaced with the enhanced version

### 3. Text Shortening
Automatically reduce text that exceeds the 500-character limit while maintaining the core message.

**How to use:**
1. Type or paste text (even if it exceeds 500 chars)
2. Click the "Shorten" button
3. The text will be intelligently shortened to fit

## Technical Implementation

### Backend (NestJS)

#### Files Created:
- `backend/src/ai/ai.service.ts` - Core AI service with OpenAI integration
- `backend/src/ai/ai.controller.ts` - REST API endpoints
- `backend/src/ai/ai.module.ts` - NestJS module configuration
- `backend/src/ai/dto/generate-text.dto.ts` - DTO for text generation
- `backend/src/ai/dto/enhance-text.dto.ts` - DTO for text enhancement
- `backend/src/ai/dto/shorten-text.dto.ts` - DTO for text shortening

#### API Endpoints:

**POST /ai/generate**
- Generate post text from a prompt
- Body: `{ prompt: string, maxLength?: number }`
- Returns: `{ suggestions: string[] }`

**POST /ai/enhance**
- Enhance existing text
- Body: `{ text: string, tone?: 'professional' | 'casual' | 'friendly' | 'humorous', maxLength?: number }`
- Returns: `{ enhanced: string }`

**POST /ai/shorten**
- Shorten text to target length
- Body: `{ text: string, targetLength: number }`
- Returns: `{ shortened: string }`

**POST /ai/status**
- Check if AI service is available
- Returns: `{ available: boolean, message: string }`

### Frontend (Next.js)

#### Components Created:
- `web/src/components/AIToolbar.tsx` - Toolbar with AI action buttons
- `web/src/components/AIPromptDialog.tsx` - Dialog for entering generation prompts
- `web/src/components/AIGenerateDialog.tsx` - Dialog for selecting AI suggestions

#### Integration:
The AI features are integrated into:
- Post creation form (feed page)
- Post editing interface (feed page)

Both interfaces include:
- Character counter with visual warnings
- Loading states during AI processing
- Error handling with user-friendly messages
- Disabled states when AI is processing

## Setup Instructions

### Prerequisites
1. OpenAI API key (get one at https://platform.openai.com/api-keys)
2. Node.js and npm installed
3. Backend and frontend already set up

### Backend Setup

1. **Install OpenAI SDK**
   ```bash
   cd backend
   npm install openai
   ```

2. **Configure Environment Variables**
   
   Create or update `backend/.env` with:
   ```env
   OPENAI_API_KEY=sk-your-openai-api-key-here
   ```

   **Security Note**: 
   - Never commit the `.env` file to version control
   - Keep your API key confidential
   - The key is only used on the server side, never exposed to the client

3. **Start the Backend**
   ```bash
   npm run start:dev
   ```

   The AI module will initialize automatically. Check the console for:
   ```
   [AIService] OpenAI service initialized successfully
   ```

   If the API key is not set, you'll see:
   ```
   [AIService] OPENAI_API_KEY not found in environment variables. AI features will be disabled.
   ```

### Frontend Setup

No additional setup required! The frontend will automatically detect if AI features are available.

### Verification

1. Log in to the application
2. Navigate to the feed page
3. You should see the AI Assistant toolbar below the post input field
4. Try clicking "Generate" to test the functionality

## Usage Guidelines

### Character Limits
- Posts have a maximum of 500 characters
- AI-generated content respects this limit
- The shorten feature targets 500 characters by default

### Best Practices

**For Generation:**
- Be specific in your prompts
- Example: "Share my excitement about finishing a group project" is better than "project"
- Review all 3 suggestions before selecting one

**For Enhancement:**
- Choose the appropriate tone for your audience
- Use "Auto" for general improvements
- Use specific tones (Professional, Casual, etc.) when context matters

**For Shortening:**
- Use when you've exceeded the character limit
- Review the shortened text to ensure key points are preserved
- You can manually edit after shortening if needed

### Error Handling

If AI features are unavailable:
- The toolbar buttons will still be visible
- Clicking them will show an error message
- You can still post without AI assistance

Common errors:
- "AI service is not configured" - API key not set
- "Failed to generate text" - Network or API issue
- "Failed to enhance text" - Request timeout or invalid input

## Cost Considerations

- The application uses **GPT-4o-mini** model for cost efficiency
- Average costs per operation:
  - Generate: ~3-5 cents per request (3 suggestions)
  - Enhance: ~1-2 cents per request
  - Shorten: ~1-2 cents per request

- Monitor your OpenAI usage at: https://platform.openai.com/usage

## Model Information

**Current Model**: `gpt-4o-mini`
- Fast response times (1-3 seconds typically)
- Cost-effective for high-volume usage
- High-quality text generation
- Good understanding of context and tone

**Alternative Models**:
You can change the model in `backend/src/ai/ai.service.ts` by modifying the `model` parameter in the OpenAI API calls. Options include:
- `gpt-4o` - More capable but more expensive
- `gpt-3.5-turbo` - Faster but less capable

## Security & Privacy

- API keys are stored securely in environment variables
- All AI processing happens server-side
- User posts are sent to OpenAI for processing (review OpenAI's privacy policy)
- No user data is permanently stored by OpenAI when using the API
- Posts are validated and sanitized before AI processing

## Troubleshooting

### AI buttons not working
1. Check backend console for API key initialization message
2. Verify `.env` file contains `OPENAI_API_KEY`
3. Ensure backend is running and accessible
4. Check browser console for network errors

### Slow response times
1. Check your internet connection
2. Verify OpenAI API status: https://status.openai.com
3. Consider switching to a faster model
4. Check if you've hit rate limits

### "AI service is not configured" error
1. Ensure `OPENAI_API_KEY` is set in backend `.env`
2. Restart the backend server
3. Verify the API key is valid (test at OpenAI platform)

### Character limit issues
1. The 500-character limit is enforced by both frontend and backend
2. Use the "Shorten" feature if your text exceeds the limit
3. The character counter shows real-time character count

## Future Enhancements

Potential improvements for future versions:
- [ ] Regenerate button for new suggestions without closing dialog
- [ ] Save favorite prompts for quick access
- [ ] Translate posts to different languages
- [ ] Sentiment analysis before posting
- [ ] Hashtag suggestions
- [ ] Image description generation for accessibility
- [ ] Draft saving with AI suggestions
- [ ] Post scheduling with AI optimization

## Support

For issues or questions:
1. Check this documentation first
2. Review OpenAI API documentation: https://platform.openai.com/docs
3. Check the browser console and backend logs for error messages
4. Verify your OpenAI API key is active and has sufficient credits

## License

This feature is part of the Ustbian project and follows the same license terms.

