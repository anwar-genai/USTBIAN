import { Body, Controller, Post, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AIService } from './ai.service';
import { GenerateTextDto } from './dto/generate-text.dto';
import { EnhanceTextDto } from './dto/enhance-text.dto';
import { ShortenTextDto } from './dto/shorten-text.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('AI')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('bearer')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate post text from prompt with multiple suggestions' })
  @ApiResponse({ status: 200, description: 'Returns array of generated text suggestions' })
  @ApiResponse({ status: 400, description: 'Invalid request or AI service unavailable' })
  async generateText(@Body() dto: GenerateTextDto) {
    if (!this.aiService.isAvailable()) {
      return {
        error: 'AI service is not configured. Please contact the administrator.',
        suggestions: [],
      };
    }

    try {
      const suggestions = await this.aiService.generateText(dto);
      return { suggestions };
    } catch (error) {
      return {
        error: error.message || 'Failed to generate text',
        suggestions: [],
      };
    }
  }

  @Post('enhance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enhance existing text with improved grammar and tone' })
  @ApiResponse({ status: 200, description: 'Returns enhanced text' })
  @ApiResponse({ status: 400, description: 'Invalid request or AI service unavailable' })
  async enhanceText(@Body() dto: EnhanceTextDto) {
    if (!this.aiService.isAvailable()) {
      return {
        error: 'AI service is not configured. Please contact the administrator.',
        enhanced: dto.text,
      };
    }

    try {
      const enhanced = await this.aiService.enhanceText(dto);
      return { enhanced };
    } catch (error) {
      return {
        error: error.message || 'Failed to enhance text',
        enhanced: dto.text,
      };
    }
  }

  @Post('shorten')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Shorten text to fit within character limit' })
  @ApiResponse({ status: 200, description: 'Returns shortened text' })
  @ApiResponse({ status: 400, description: 'Invalid request or AI service unavailable' })
  async shortenText(@Body() dto: ShortenTextDto) {
    if (!this.aiService.isAvailable()) {
      return {
        error: 'AI service is not configured. Please contact the administrator.',
        shortened: dto.text,
      };
    }

    try {
      const shortened = await this.aiService.shortenText(dto);
      return { shortened };
    } catch (error) {
      return {
        error: error.message || 'Failed to shorten text',
        shortened: dto.text,
      };
    }
  }

  @Post('status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check if AI service is available' })
  async checkStatus() {
    return {
      available: this.aiService.isAvailable(),
      message: this.aiService.isAvailable()
        ? 'AI service is operational'
        : 'AI service is not configured',
    };
  }
}

