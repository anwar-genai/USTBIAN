# AI Module

This module provides AI-powered text generation, enhancement, and manipulation features for the Ustbian social network.

## Overview

The AI module integrates OpenAI's GPT models to help users create better posts with:
- Text generation from prompts
- Text enhancement with tone adjustment
- Intelligent text shortening

## Installation

```bash
npm install openai
```

## Configuration

Add to your `.env` file:
```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

Get your API key from: https://platform.openai.com/api-keys

## Module Structure

```
ai/
├── ai.module.ts          # NestJS module definition
├── ai.service.ts         # Core AI service with OpenAI integration
├── ai.controller.ts      # REST API endpoints
├── dto/
│   ├── generate-text.dto.ts
│   ├── enhance-text.dto.ts
│   └── shorten-text.dto.ts
└── README.md
```

## API Endpoints

All endpoints require JWT authentication (`@UseGuards(JwtAuthGuard)`).

### POST /ai/generate
Generate post text from a prompt with multiple suggestions.

**Request Body:**
```json
{
  "prompt": "Write about enjoying the weekend",
  "maxLength": 500
}
```

**Response:**
```json
{
  "suggestions": [
    "Had an amazing weekend! Spent time with friends...",
    "Weekend vibes! Finally got to relax and unwind...",
    "This weekend was exactly what I needed..."
  ]
}
```

### POST /ai/enhance
Enhance existing text with improved grammar and tone.

**Request Body:**
```json
{
  "text": "had great day today feeling awesome",
  "tone": "friendly",
  "maxLength": 500
}
```

**Response:**
```json
{
  "enhanced": "I had a great day today and I'm feeling awesome! 😊"
}
```

**Tone Options:**
- `professional` - Business-appropriate
- `casual` - Relaxed and informal
- `friendly` - Warm and approachable
- `humorous` - Light and funny
- (empty) - Auto-enhance without changing tone

### POST /ai/shorten
Shorten text while preserving meaning.

**Request Body:**
```json
{
  "text": "This is a very long post that needs to be shortened...",
  "targetLength": 500
}
```

**Response:**
```json
{
  "shortened": "This long post needs shortening..."
}
```

### POST /ai/status
Check if AI service is available.

**Response:**
```json
{
  "available": true,
  "message": "AI service is operational"
}
```

## Service Methods

### `generateText(dto: GenerateTextDto): Promise<string[]>`
Generates 3 different post variations from a prompt.

### `enhanceText(dto: EnhanceTextDto): Promise<string>`
Enhances text with improved grammar, clarity, and optional tone adjustment.

### `shortenText(dto: ShortenTextDto): Promise<string>`
Shortens text to fit within target length while maintaining core message.

### `isAvailable(): boolean`
Checks if OpenAI API key is configured and service is ready.

## Error Handling

The service gracefully handles errors:
- If API key is not set, `isAvailable()` returns false
- API errors return user-friendly error messages
- Network timeouts are caught and reported
- Invalid inputs are validated by DTOs

## Security

- API key is stored securely in environment variables
- Never exposed to frontend/client code
- All endpoints require authentication
- Requests are validated with DTOs using class-validator

## Model Configuration

Current model: `gpt-4o-mini`
- Fast and cost-effective
- Good quality for social media posts
- ~$0.01-0.05 per request

To change the model, edit `ai.service.ts` and update the `model` parameter in OpenAI API calls.

## Validation

DTOs include validation decorators:
- `@MinLength()` - Minimum text length
- `@MaxLength()` - Maximum text length
- `@IsString()` - String validation
- `@IsInt()` - Integer validation
- `@IsIn()` - Enum validation for tone options

## Usage Example

```typescript
// In a controller or service
import { AIService } from './ai/ai.service';

constructor(private aiService: AIService) {}

async createPost() {
  // Check if AI is available
  if (this.aiService.isAvailable()) {
    const suggestions = await this.aiService.generateText({
      prompt: 'Share excitement about new project',
      maxLength: 500
    });
    console.log(suggestions);
  }
}
```

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e
```

## Monitoring

Monitor OpenAI API usage at: https://platform.openai.com/usage

Set up usage alerts to avoid unexpected costs.

## Troubleshooting

**Service not initializing:**
- Check OPENAI_API_KEY is in .env
- Restart the application
- Verify API key is valid

**Slow responses:**
- Normal latency is 1-3 seconds
- Check OpenAI API status
- Consider using a faster model

**Rate limit errors:**
- Monitor usage at OpenAI dashboard
- Implement request queuing if needed
- Consider upgrading OpenAI plan

## Dependencies

- `openai` - Official OpenAI Node.js SDK
- `@nestjs/config` - Configuration management
- `class-validator` - DTO validation
- `class-transformer` - DTO transformation

## Future Enhancements

- [ ] Response caching for common prompts
- [ ] Rate limiting per user
- [ ] Custom prompt templates
- [ ] Multi-language support
- [ ] Batch processing
- [ ] Usage analytics

## License

Part of Ustbian project - see main LICENSE file.

