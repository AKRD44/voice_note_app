import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

import '../models/recording.dart';
import 'settings_provider.dart';

class RecordingState {
  final List<Recording> recordings;
  final bool isRecording;
  final CurrentRecording? currentRecording;

  RecordingState({
    this.recordings = const [],
    this.isRecording = false,
    this.currentRecording,
  });

  RecordingState copyWith({
    List<Recording>? recordings,
    bool? isRecording,
    CurrentRecording? currentRecording,
  }) {
    return RecordingState(
      recordings: recordings ?? this.recordings,
      isRecording: isRecording ?? this.isRecording,
      currentRecording: currentRecording ?? this.currentRecording,
    );
  }
}

class CurrentRecording {
  final String uri;
  final int duration;
  final DateTime startTime;

  CurrentRecording({
    required this.uri,
    required this.duration,
    required this.startTime,
  });
}

class RecordingNotifier extends StateNotifier<RecordingState> {
  RecordingNotifier(this.ref) : super(RecordingState()) {
    _initializeStore();
  }

  final Ref ref;

  static const String _storageKey = 'recordings_store';

  Future<void> _initializeStore() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final recordingsJson = prefs.getString(_storageKey);

      if (recordingsJson != null) {
        final List<dynamic> decoded = jsonDecode(recordingsJson);
        final recordings = decoded
            .map((json) => Recording.fromJson(json as Map<String, dynamic>))
            .toList();

        // Clean up invalid audio files
        final validRecordings = <Recording>[];
        for (final recording in recordings) {
          final file = File(recording.audioUri);
          if (await file.exists()) {
            validRecordings.add(recording);
          }
        }

        state = state.copyWith(recordings: validRecordings);
        _saveToStorage();
      }
    } catch (e) {
      print('Error initializing recording store: $e');
    }
  }

  Future<void> _saveToStorage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final recordingsJson = jsonEncode(
        state.recordings.map((r) => r.toJson()).toList(),
      );
      await prefs.setString(_storageKey, recordingsJson);
    } catch (e) {
      print('Error saving recordings: $e');
    }
  }

  void startRecording(String uri) {
    state = state.copyWith(
      isRecording: true,
      currentRecording: CurrentRecording(
        uri: uri,
        duration: 0,
        startTime: DateTime.now(),
      ),
    );
  }

  void pauseRecording() {
    state = state.copyWith(isRecording: false);
  }

  void resumeRecording() {
    state = state.copyWith(isRecording: true);
  }

  Future<Recording?> stopRecording() async {
    final current = state.currentRecording;
    if (current == null) return null;

    final settings = ref.read(settingsProvider);
    final recording = Recording(
      id: 'rec_${DateTime.now().millisecondsSinceEpoch}',
      title: 'Recording ${state.recordings.length + 1}',
      audioUri: current.uri,
      duration: current.duration,
      createdAt: DateTime.now(),
      style: settings.defaultStyle,
      language: settings.defaultLanguage,
    );

    state = state.copyWith(
      isRecording: false,
      currentRecording: null,
      recordings: [recording, ...state.recordings],
    );

    await _saveToStorage();
    return recording;
  }

  String addRecording(OmitRecording recording) {
    final id = 'rec_${DateTime.now().millisecondsSinceEpoch}';
    final newRecording = Recording(
      id: id,
      title: recording.title,
      audioUri: recording.audioUri,
      duration: recording.duration,
      createdAt: recording.createdAt,
      transcript: recording.transcript,
      enhancedTranscript: recording.enhancedTranscript,
      style: recording.style,
      language: recording.language,
      tags: recording.tags,
      isProcessing: recording.isProcessing,
      processingProgress: recording.processingProgress,
    );

    state = state.copyWith(
      recordings: [newRecording, ...state.recordings],
    );
    _saveToStorage();

    return id;
  }

  void updateRecording(String id, Recording Function(Recording) updater) {
    state = state.copyWith(
      recordings: state.recordings.map((recording) {
        if (recording.id == id) {
          return updater(recording);
        }
        return recording;
      }).toList(),
    );
    _saveToStorage();
  }

  Future<void> deleteRecording(String id) async {
    final recording = state.recordings.firstWhere(
      (r) => r.id == id,
      orElse: () => throw Exception('Recording not found'),
    );

    try {
      final file = File(recording.audioUri);
      if (await file.exists()) {
        await file.delete();
      }
    } catch (e) {
      print('Error deleting audio file: $e');
    }

    state = state.copyWith(
      recordings: state.recordings.where((r) => r.id != id).toList(),
    );
    _saveToStorage();
  }

  void setProcessingState(String id, bool isProcessing, int progress) {
    updateRecording(id, (recording) {
      return recording.copyWith(
        isProcessing: isProcessing,
        processingProgress: progress,
      );
    });
  }

  void updateTranscript(String id, String transcript, String enhancedTranscript) {
    updateRecording(id, (recording) {
      return recording.copyWith(
        transcript: transcript,
        enhancedTranscript: enhancedTranscript,
        isProcessing: false,
        processingProgress: 100,
      );
    });
  }
}

// Helper class for creating recordings
class OmitRecording {
  final String title;
  final String audioUri;
  final int duration;
  final DateTime createdAt;
  final String? transcript;
  final String? enhancedTranscript;
  final EnhancementStyle style;
  final String language;
  final List<String> tags;
  final bool isProcessing;
  final int processingProgress;

  OmitRecording({
    required this.title,
    required this.audioUri,
    required this.duration,
    required this.createdAt,
    this.transcript,
    this.enhancedTranscript,
    this.style = EnhancementStyle.note,
    this.language = 'en-US',
    this.tags = const [],
    this.isProcessing = false,
    this.processingProgress = 0,
  });
}

// Provider
final recordingProvider =
    StateNotifierProvider<RecordingNotifier, RecordingState>((ref) {
  return RecordingNotifier(ref);
});
