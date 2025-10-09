import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { GenerateTextDto } from './dto/generate-text.dto';
import { EnhanceTextDto } from './dto/enhance-text.dto';
import { ShortenTextDto } from './dto/shorten-text.dto';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private openai: OpenAI | null = null;
  private readonly maxPostLength = 500;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not found in environment variables. AI features will be disabled.');
    } else {
      this.openai = new OpenAI({
        apiKey: apiKey,
      });
      this.logger.log('OpenAI service initialized successfully');
    }
  }

  private ensureOpenAI(): void {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY in your environment variables.');
    }
  }

  /**
   * Generate post text from a prompt with multiple suggestions
   */
  async generateText(dto: GenerateTextDto): Promise<string[]> {
    this.ensureOpenAI();

    const maxLength = dto.maxLength || this.maxPostLength;
    
    try {
      this.logger.log(`Generating text from prompt: "${dto.prompt}"`);
      
      const completion = await this.openai!.chat.completions.create({
        model: 'gpt-4o-mini', // Using GPT-4o-mini as it's the latest efficient model
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that generates engaging social media posts. 
Generate 3 different variations of a post based on the user's prompt. 
Each post must be under ${maxLength} characters.
Be creative, engaging, and appropriate for a university social network.
Return only the 3 posts separated by "---" (three dashes on a new line).
Do not include numbering or labels.`,
          },
          {
            role: 'user',
            content: dto.prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 500,
      });

      const content = completion.choices[0]?.message?.content || '';
      const suggestions = content
        .split('---')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && s.length <= maxLength)
        .slice(0, 3);

      if (suggestions.length === 0) {
        throw new Error('No valid suggestions generated');
      }

      this.logger.log(`Generated ${suggestions.length} suggestions`);
      return suggestions;
    } catch (error) {
      this.logger.error('Error generating text:', error);
      throw new Error('Failed to generate text. Please try again.');
    }
  }

  /**
   * Enhance existing text with improved grammar, clarity, and tone
   */
  async enhanceText(dto: EnhanceTextDto): Promise<string> {
    this.ensureOpenAI();

    const maxLength = dto.maxLength || this.maxPostLength;
    const toneInstruction = dto.tone 
      ? `Adjust the tone to be ${dto.tone}.` 
      : 'Maintain the original tone while improving clarity.';

    try {
      this.logger.log(`Enhancing text with tone: ${dto.tone || 'original'}`);
      
      const completion = await this.openai!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a helpful writing assistant. Enhance the given text by:
- Fixing grammar and spelling errors
- Improving clarity and readability
- ${toneInstruction}
- Keeping it under ${maxLength} characters
- Preserving the core message and meaning

Return only the enhanced text without any explanations or labels.`,
          },
          {
            role: 'user',
            content: dto.text,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      });

      const enhanced = completion.choices[0]?.message?.content?.trim() || dto.text;
      
      // Ensure it doesn't exceed max length
      if (enhanced.length > maxLength) {
        return enhanced.substring(0, maxLength - 3) + '...';
      }

      this.logger.log('Text enhanced successfully');
      return enhanced;
    } catch (error) {
      this.logger.error('Error enhancing text:', error);
      throw new Error('Failed to enhance text. Please try again.');
    }
  }

  /**
   * Shorten text to fit within target length while preserving meaning
   */
  async shortenText(dto: ShortenTextDto): Promise<string> {
    this.ensureOpenAI();

    try {
      this.logger.log(`Shortening text to ${dto.targetLength} characters`);
      
      const completion = await this.openai!.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that shortens text while preserving its core message.
Shorten the given text to under ${dto.targetLength} characters.
Maintain the key points and tone.
Return only the shortened text without explanations.`,
          },
          {
            role: 'user',
            content: dto.text,
          },
        ],
        temperature: 0.5,
        max_tokens: 200,
      });

      const shortened = completion.choices[0]?.message?.content?.trim() || dto.text;
      
      // Final safety check
      if (shortened.length > dto.targetLength) {
        return shortened.substring(0, dto.targetLength - 3) + '...';
      }

      this.logger.log('Text shortened successfully');
      return shortened;
    } catch (error) {
      this.logger.error('Error shortening text:', error);
      throw new Error('Failed to shorten text. Please try again.');
    }
  }

  /**
   * Check if AI service is available
   */
  isAvailable(): boolean {
    return this.openai !== null;
  }
}

