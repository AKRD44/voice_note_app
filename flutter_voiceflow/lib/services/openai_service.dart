import 'dart:io';
import 'package:dio/dio.dart';
import 'package:openai_dart/openai_dart.dart';
import 'package:openai_dart/src/models/audio/create_transcription_request.dart';

import '../core/models/recording.dart';

class OpenAIService {
  late final OpenAIClient _client;
  
  OpenAIService() {
    // Get API key from environment or constants
    const apiKey = String.fromEnvironment('OPENAI_API_KEY', defaultValue: '');
    if (apiKey.isEmpty) {
      throw Exception('OPENAI_API_KEY not set');
    }
    _client = OpenAIClient(apiKey: apiKey);
  }

  // Enhancement prompts
  static const Map<EnhancementStyle, String> enhancementPrompts = {
    EnhancementStyle.note: '''You are an expert note-taking assistant. Transform this voice transcript into a clean, well-organized note.

Rules:
- Remove filler words (um, uh, like, you know, etc.)
- Fix grammar and punctuation
- Format as concise bullet points with headings where appropriate
- Maintain the original meaning and tone
- Keep it brief and scannable

Output only the enhanced note with no additional commentary.''',

    EnhancementStyle.email: '''You are a professional email writer. Transform this voice transcript into a well-structured email.

Rules:
- Remove filler words
- Fix grammar and punctuation
- Structure with: greeting (if mentioned), clear body paragraphs, closing (if appropriate)
- Use professional but friendly tone
- Maintain the original intent

Output only the enhanced email with no additional commentary.''',

    EnhancementStyle.blog: '''You are an engaging content writer. Transform this voice transcript into a compelling blog post section.

Rules:
- Remove filler words
- Fix grammar and punctuation
- Add engaging introductory sentence if needed
- Use storytelling techniques where appropriate
- Break into clear paragraphs
- Maintain the speaker's voice and personality

Output only the enhanced blog content with no additional commentary.''',

    EnhancementStyle.summary: '''You are a professional summarizer. Extract only the key points from this voice transcript.

Rules:
- Remove all filler words
- Extract only the main ideas
- Format as 3-5 concise bullet points
- Each point should be one clear sentence
- Prioritize the most important information

Output only the summary bullets with no additional commentary.''',

    EnhancementStyle.transcript: '''You are a transcription editor. Clean up this voice transcript while preserving all content.

Rules:
- Remove filler words (um, uh, like, you know)
- Fix grammar and punctuation
- Format into clear paragraphs
- Preserve all information and details
- Maintain the speaker's tone and style

Output only the cleaned transcript with no additional commentary.''',

    EnhancementStyle.custom: '''You are a helpful AI assistant. Transform this voice transcript according to the user's specific instructions.

Rules:
- Follow the custom instructions provided
- Remove filler words unless requested otherwise
- Fix grammar and punctuation
- Maintain the original meaning
- Apply the requested style or format

Output only the transformed content with no additional commentary.''',
  };

  Future<TranscriptionResult> transcribeAudio(
    File audioFile, {
    String? language,
    String? prompt,
    double temperature = 0,
  }) async {
    try {
      final request = CreateTranscriptionRequest(
        file: audioFile,
        model: 'whisper-1',
        language: language,
        prompt: prompt,
        temperature: temperature,
        responseFormat: TranscriptionResponseFormat.json,
      );

      final response = await _client.audio.createTranscription(request: request);

      return TranscriptionResult(
        text: response.text ?? '',
        language: response.language,
        error: null,
      );
    } catch (e) {
      return TranscriptionResult(
        text: '',
        error: e.toString(),
      );
    }
  }

  Future<EnhancementResult> enhanceTranscript(
    String transcript,
    EnhancementStyle style, {
    String? customPrompt,
  }) async {
    try {
      final systemPrompt = style == EnhancementStyle.custom && customPrompt != null
          ? '${enhancementPrompts[EnhancementStyle.custom]}\n\nCustom Instructions: $customPrompt'
          : enhancementPrompts[style] ?? enhancementPrompts[EnhancementStyle.note]!;

      final response = await _client.chat.createCompletion(
        model: Model.gpt4TurboPreview,
        messages: [
          ChatCompletionMessage(
            role: ChatCompletionMessageRole.system,
            content: systemPrompt,
          ),
          ChatCompletionMessage(
            role: ChatCompletionMessageRole.user,
            content: 'Transcript:\n$transcript',
          ),
        ],
        temperature: 0.3,
        maxTokens: 2000,
      );

      final enhanced = response.choices.first.message?.content ?? '';
      final tokensUsed = response.usage?.totalTokens;

      return EnhancementResult(
        enhanced: enhanced,
        tokensUsed: tokensUsed,
        error: null,
      );
    } catch (e) {
      return EnhancementResult(
        enhanced: '',
        error: e.toString(),
      );
    }
  }

  static double estimateWhisperCost(int durationInSeconds) {
    final minutes = durationInSeconds / 60;
    return minutes * 0.006; // $0.006 per minute
  }

  static double estimateGPT4Cost(int inputTokens, int outputTokens) {
    final inputCost = (inputTokens / 1000) * 0.01; // $0.01 per 1K input tokens
    final outputCost = (outputTokens / 1000) * 0.03; // $0.03 per 1K output tokens
    return inputCost + outputCost;
  }
}

class TranscriptionResult {
  final String text;
  final String? language;
  final String? error;

  TranscriptionResult({
    required this.text,
    this.language,
    this.error,
  });
}

class EnhancementResult {
  final String enhanced;
  final int? tokensUsed;
  final String? error;

  EnhancementResult({
    required this.enhanced,
    this.tokensUsed,
    this.error,
  });
}
