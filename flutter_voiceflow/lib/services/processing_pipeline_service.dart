import 'dart:io';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/models/recording.dart';
import '../core/config/supabase_config.dart';
import 'openai_service.dart';
import 'audio_service.dart';

enum ProcessingStage {
  uploading,
  transcribing,
  enhancing,
  saving,
  complete,
  error,
}

class ProcessingOptions {
  final String userId;
  final String audioUri;
  final String recordingId;
  final EnhancementStyle style;
  final String? language;
  final String? customPrompt;
  final bool isPremium;
  final Function(ProcessingStage, double)? onProgress;
  final Function(ProcessingStage)? onStageComplete;

  ProcessingOptions({
    required this.userId,
    required this.audioUri,
    required this.recordingId,
    this.style = EnhancementStyle.note,
    this.language,
    this.customPrompt,
    this.isPremium = false,
    this.onProgress,
    this.onStageComplete,
  });
}

class ProcessingResult {
  final String recordingId;
  final String audioUrl;
  final String originalTranscript;
  final String enhancedTranscript;
  final String language;
  final EnhancementStyle style;
  final int duration;
  final int wordCount;
  final int characterCount;
  final double? totalCost;
  final String? error;

  ProcessingResult({
    required this.recordingId,
    required this.audioUrl,
    required this.originalTranscript,
    required this.enhancedTranscript,
    required this.language,
    required this.style,
    required this.duration,
    required this.wordCount,
    required this.characterCount,
    this.totalCost,
    this.error,
  });
}

class ProcessingPipelineService {
  final OpenAIService _openaiService = OpenAIService();
  final AudioService _audioService = AudioService();
  final _supabase = SupabaseConfig.client;

  Future<ProcessingResult> process(ProcessingOptions options) async {
    String audioUrl = '';
    String originalTranscript = '';
    String enhancedTranscript = '';
    String detectedLanguage = options.language ?? 'en';
    int audioDuration = 0;
    double totalCost = 0;

    try {
      // STAGE 1: Upload Audio (0-25%)
      options.onProgress?.call(ProcessingStage.uploading, 0);
      final audioFile = File(options.audioUri);
      
      final uploadResult = await _audioService.uploadWithRetry(
        audioFile,
        options.userId,
        options.recordingId,
        (progress) {
          options.onProgress?.call(
            ProcessingStage.uploading,
            (progress / 100) * 25,
          );
        },
      );

      if (uploadResult.error != null) {
        throw Exception('Upload failed: ${uploadResult.error}');
      }

      audioUrl = uploadResult.url!;
      options.onProgress?.call(ProcessingStage.uploading, 25);
      options.onStageComplete?.call(ProcessingStage.uploading);

      // STAGE 2: Transcribe (25-60%)
      options.onProgress?.call(ProcessingStage.transcribing, 25);

      final transcriptionResult = await _openaiService.transcribeAudio(
        audioFile,
        language: options.language,
        temperature: 0,
      );

      if (transcriptionResult.error != null) {
        throw Exception('Transcription failed: ${transcriptionResult.error}');
      }

      if (transcriptionResult.text.isEmpty) {
        throw Exception('Transcription produced empty result');
      }

      originalTranscript = transcriptionResult.text;
      detectedLanguage = transcriptionResult.language ?? options.language ?? 'en';
      
      // Estimate audio duration (would need audio analysis)
      audioDuration = 0; // TODO: Get from audio file metadata
      
      totalCost += OpenAIService.estimateWhisperCost(audioDuration);

      options.onProgress?.call(ProcessingStage.transcribing, 60);
      options.onStageComplete?.call(ProcessingStage.transcribing);

      // STAGE 3: Enhance (60-90%)
      options.onProgress?.call(ProcessingStage.enhancing, 60);

      final enhancementResult = await _openaiService.enhanceTranscript(
        originalTranscript,
        options.style,
        customPrompt: options.customPrompt,
      );

      if (enhancementResult.error != null) {
        enhancedTranscript = originalTranscript; // Fallback to original
      } else {
        enhancedTranscript = enhancementResult.enhanced;
        if (enhancementResult.tokensUsed != null) {
          // Rough estimate: 60% input, 40% output
          final inputTokens = (enhancementResult.tokensUsed! * 0.6).round();
          final outputTokens = (enhancementResult.tokensUsed! * 0.4).round();
          totalCost += OpenAIService.estimateGPT4Cost(inputTokens, outputTokens);
        }
      }

      options.onProgress?.call(ProcessingStage.enhancing, 90);
      options.onStageComplete?.call(ProcessingStage.enhancing);

      // STAGE 4: Save to Database (90-100%)
      options.onProgress?.call(ProcessingStage.saving, 90);

      final wordCount = enhancedTranscript.split(RegExp(r'\s+')).where((w) => w.isNotEmpty).length;
      final characterCount = enhancedTranscript.length;

      await _supabase.from('recordings').insert({
        'user_id': options.userId,
        'title': 'Recording ${DateTime.now().toLocal()}',
        'audio_url': audioUrl,
        'original_transcript': originalTranscript,
        'enhanced_transcript': enhancedTranscript,
        'language': detectedLanguage,
        'style': options.style.name,
        'duration': audioDuration,
        'word_count': wordCount,
        'character_count': characterCount,
      });

      options.onProgress?.call(ProcessingStage.saving, 100);
      options.onStageComplete?.call(ProcessingStage.saving);

      options.onProgress?.call(ProcessingStage.complete, 100);
      options.onStageComplete?.call(ProcessingStage.complete);

      return ProcessingResult(
        recordingId: options.recordingId,
        audioUrl: audioUrl,
        originalTranscript: originalTranscript,
        enhancedTranscript: enhancedTranscript,
        language: detectedLanguage,
        style: options.style,
        duration: audioDuration,
        wordCount: wordCount,
        characterCount: characterCount,
        totalCost: totalCost,
      );
    } catch (e) {
      options.onProgress?.call(ProcessingStage.error, 0);
      options.onStageComplete?.call(ProcessingStage.error);

      // Cleanup uploaded file on error
      if (audioUrl.isNotEmpty) {
        try {
          final pathParts = audioUrl.split('/');
          final filePath = '${options.userId}/${pathParts.last}';
          await _audioService.deleteFromSupabase(filePath);
        } catch (cleanupError) {
          print('Failed to cleanup after error: $cleanupError');
        }
      }

      return ProcessingResult(
        recordingId: options.recordingId,
        audioUrl: audioUrl,
        originalTranscript: originalTranscript,
        enhancedTranscript: enhancedTranscript,
        language: detectedLanguage,
        style: options.style,
        duration: audioDuration,
        wordCount: 0,
        characterCount: 0,
        totalCost: totalCost,
        error: e.toString(),
      );
    }
  }

  static String getStageName(ProcessingStage stage) {
    switch (stage) {
      case ProcessingStage.uploading:
        return 'Uploading audio...';
      case ProcessingStage.transcribing:
        return 'Transcribing your voice...';
      case ProcessingStage.enhancing:
        return 'Enhancing with AI...';
      case ProcessingStage.saving:
        return 'Saving your note...';
      case ProcessingStage.complete:
        return 'Complete!';
      case ProcessingStage.error:
        return 'Processing failed';
    }
  }
}
