import 'dart:io';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:path/path.dart' as path;

import '../core/config/supabase_config.dart';

class UploadProgress {
  final double percentage;
  final int bytesUploaded;
  final int totalBytes;

  UploadProgress({
    required this.percentage,
    required this.bytesUploaded,
    required this.totalBytes,
  });
}

class UploadResult {
  final String? url;
  final String? path;
  final String? error;

  UploadResult({
    this.url,
    this.path,
    this.error,
  });
}

class AudioService {
  final _supabase = SupabaseConfig.client;

  Future<UploadResult> uploadWithRetry(
    File audioFile,
    String userId,
    String recordingId, {
    Function(UploadProgress)? onProgress,
    int maxRetries = 3,
  }) async {
    int attempts = 0;
    Exception? lastError;

    while (attempts < maxRetries) {
      try {
        if (attempts > 0) {
          // Exponential backoff
          final waitTime = Duration(milliseconds: (2 ^ attempts) * 1000);
          await Future.delayed(waitTime);
        }

        final result = await _uploadToSupabase(
          audioFile,
          userId,
          recordingId,
          onProgress: onProgress,
        );

        if (result.error == null) {
          return result;
        }

        lastError = Exception(result.error);
        attempts++;
      } catch (e) {
        lastError = e is Exception ? e : Exception(e.toString());
        attempts++;
      }
    }

    return UploadResult(
      error: 'Upload failed after $maxRetries attempts: ${lastError?.toString()}',
    );
  }

  Future<UploadResult> _uploadToSupabase(
    File audioFile,
    String userId,
    String recordingId, {
    Function(UploadProgress)? onProgress,
  }) async {
    try {
      final filePath = '$userId/$recordingId.m4a';
      final fileBytes = await audioFile.readAsBytes();

      // Upload to Supabase Storage
      await _supabase.storage.from('audio-recordings').uploadBinary(
            filePath,
            fileBytes,
            fileOptions: const FileOptions(
              cacheControl: '3600',
              upsert: false,
            ),
          );

      // Get public URL
      final urlResponse = _supabase.storage
          .from('audio-recordings')
          .getPublicUrl(filePath);

      return UploadResult(
        url: urlResponse,
        path: filePath,
      );
    } catch (e) {
      return UploadResult(
        error: e.toString(),
      );
    }
  }

  Future<void> deleteFromSupabase(String filePath) async {
    try {
      await _supabase.storage.from('audio-recordings').remove([filePath]);
    } catch (e) {
      print('Error deleting audio file: $e');
      rethrow;
    }
  }
}
