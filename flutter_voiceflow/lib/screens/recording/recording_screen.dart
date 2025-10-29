import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:record/record.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:flutter_haptic_feedback/flutter_haptic_feedback.dart';
import 'package:fluttertoast/fluttertoast.dart';

import '../../core/providers/recording_provider.dart';
import '../../core/providers/settings_provider.dart';
import '../../core/providers/auth_provider.dart';
import '../../services/processing_pipeline_service.dart';
import '../../widgets/waveform_visualizer.dart';
import '../../widgets/processing_modal.dart';

class RecordingScreen extends ConsumerStatefulWidget {
  const RecordingScreen({super.key});

  @override
  ConsumerState<RecordingScreen> createState() => _RecordingScreenState();
}

class _RecordingScreenState extends ConsumerState<RecordingScreen> {
  final AudioRecorder _recorder = AudioRecorder();
  bool _isRecording = false;
  bool _isPaused = false;
  int _duration = 0;
  Timer? _durationTimer;
  String? _audioPath;
  bool _showProcessing = false;
  int _processingStage = 0;

  @override
  void initState() {
    super.initState();
    _requestPermissions();
  }

  @override
  void dispose() {
    _durationTimer?.cancel();
    _recorder.dispose();
    super.dispose();
  }

  Future<void> _requestPermissions() async {
    final status = await Permission.microphone.request();
    if (!status.isGranted) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Microphone permission is required'),
          ),
        );
        context.pop();
      }
    }
  }

  Future<void> _startRecording() async {
    try {
      if (await _recorder.hasPermission()) {
        final directory = await getApplicationDocumentsDirectory();
        final fileName = 'recording_${DateTime.now().millisecondsSinceEpoch}.m4a';
        _audioPath = '${directory.path}/$fileName';

        await _recorder.start(
          const RecordConfig(),
          path: _audioPath!,
        );

        setState(() {
          _isRecording = true;
          _isPaused = false;
          _duration = 0;
        });

        ref.read(recordingProvider.notifier).startRecording(_audioPath!);

        _durationTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
          setState(() {
            _duration++;
          });

          final settings = ref.read(settingsProvider);
          if (_duration >= settings.maxRecordingDuration) {
            _stopRecording();
          }
        });

        FlutterHapticFeedback.lightImpact();
      }
    } catch (e) {
      Fluttertoast.showToast(
        msg: 'Failed to start recording: ${e.toString()}',
        toastLength: Toast.LENGTH_LONG,
      );
    }
  }

  Future<void> _pauseRecording() async {
    try {
      await _recorder.pause();
      setState(() {
        _isPaused = true;
      });
      _durationTimer?.cancel();
      ref.read(recordingProvider.notifier).pauseRecording();
      FlutterHapticFeedback.lightImpact();
    } catch (e) {
      print('Failed to pause recording: $e');
    }
  }

  Future<void> _resumeRecording() async {
    try {
      await _recorder.resume();
      setState(() {
        _isPaused = false;
      });
      _durationTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
        setState(() {
          _duration++;
        });
      });
      ref.read(recordingProvider.notifier).resumeRecording();
      FlutterHapticFeedback.lightImpact();
    } catch (e) {
      print('Failed to resume recording: $e');
    }
  }

  Future<void> _stopRecording() async {
    try {
      _durationTimer?.cancel();
      final path = await _recorder.stop();

      setState(() {
        _isRecording = false;
        _isPaused = false;
      });

      if (path != null) {
        final recording = await ref.read(recordingProvider.notifier).stopRecording();
        if (recording != null) {
          _processRecording(recording);
        }
      }

      FlutterHapticFeedback.mediumImpact();
    } catch (e) {
      Fluttertoast.showToast(
        msg: 'Failed to stop recording: ${e.toString()}',
        toastLength: Toast.LENGTH_LONG,
      );
    }
  }

  Future<void> _processRecording(dynamic recording) async {
    setState(() {
      _showProcessing = true;
      _processingStage = 0;
    });

    try {
      final authState = ref.read(authStateProvider);
      if (authState.user == null) {
        throw Exception('User not authenticated');
      }

      final settings = ref.read(settingsProvider);
      final pipeline = ProcessingPipelineService();

      final result = await pipeline.process(
        ProcessingOptions(
          userId: authState.user!.id,
          audioUri: recording.audioUri,
          recordingId: recording.id,
          style: settings.defaultStyle,
          language: settings.defaultLanguage,
          isPremium: settings.subscription.isPremium,
          onProgress: (stage, progress) {
            setState(() {
              _processingStage = _mapStageToNumber(stage);
            });
            ref.read(recordingProvider.notifier).setProcessingState(
                  recording.id,
                  true,
                  progress.round(),
                );
          },
          onStageComplete: (stage) {
            print('Stage complete: $stage');
          },
        ),
      );

      if (result.error != null) {
        throw Exception(result.error);
      }

      ref.read(recordingProvider.notifier).updateTranscript(
            recording.id,
            result.originalTranscript,
            result.enhancedTranscript,
          );

      setState(() {
        _showProcessing = false;
      });

      if (mounted) {
        Fluttertoast.showToast(
          msg: 'Recording processed successfully!',
          toastLength: Toast.LENGTH_SHORT,
        );
        Future.delayed(const Duration(seconds: 1), () {
          if (mounted) {
            context.go('/library');
          }
        });
      }
    } catch (e) {
      setState(() {
        _showProcessing = false;
      });
      ref.read(recordingProvider.notifier).setProcessingState(
            recording.id,
            false,
            0,
          );

      if (mounted) {
        Fluttertoast.showToast(
          msg: 'Processing failed: ${e.toString()}',
          toastLength: Toast.LENGTH_LONG,
        );
      }
    }
  }

  int _mapStageToNumber(ProcessingStage stage) {
    switch (stage) {
      case ProcessingStage.uploading:
        return 1;
      case ProcessingStage.transcribing:
        return 2;
      case ProcessingStage.enhancing:
        return 3;
      case ProcessingStage.saving:
        return 4;
      case ProcessingStage.complete:
        return 4;
      case ProcessingStage.error:
        return 0;
    }
  }

  String _formatDuration(int seconds) {
    final mins = seconds ~/ 60;
    final secs = seconds % 60;
    return '${mins.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
  }

  double _getProgress() {
    final settings = ref.read(settingsProvider);
    return (_duration / settings.maxRecordingDuration) * 100;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final settings = ref.read(settingsProvider);

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: isDark
                ? [const Color(0xFF1E293B), const Color(0xFF0F172A)]
                : [const Color(0xFFF8FAFC), const Color(0xFFE2E8F0)],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.all(24),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => context.pop(),
                      color: isDark ? Colors.white : Colors.black,
                    ),
                    Expanded(
                      child: Text(
                        _isRecording ? 'Recording...' : 'New Recording',
                        style: theme.textTheme.titleLarge,
                        textAlign: TextAlign.center,
                      ),
                    ),
                    const SizedBox(width: 48), // Balance close button
                  ],
                ),
              ),

              // Main Content
              Expanded(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Waveform Visualizer
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: WaveformVisualizer(
                          isActive: _isRecording && !_isPaused,
                          theme: isDark ? 'dark' : 'light',
                        ),
                      ),
                      const SizedBox(height: 32),

                      // Duration Display
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.baseline,
                        textBaseline: TextBaseline.alphabetic,
                        children: [
                          Text(
                            _formatDuration(_duration),
                            style: TextStyle(
                              fontSize: 48,
                              fontWeight: FontWeight.bold,
                              color: isDark ? Colors.white : Colors.black,
                              fontFamily: 'monospace',
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            '/ ${(settings.maxRecordingDuration / 60).toStringAsFixed(0)}:00',
                            style: TextStyle(
                              fontSize: 24,
                              color: isDark
                                  ? Colors.white70
                                  : Colors.black54,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),

                      // Progress Ring
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: Container(
                          height: 8,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(4),
                            color: isDark
                                ? Colors.white.withOpacity(0.2)
                                : Colors.black.withOpacity(0.1),
                          ),
                          child: FractionallySizedBox(
                            alignment: Alignment.centerLeft,
                            widthFactor: _getProgress() / 100,
                            child: Container(
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(4),
                                gradient: const LinearGradient(
                                  colors: [Color(0xFF3B82F6), Color(0xFF8B5CF6)],
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 48),

                      // Control Buttons
                      if (!_isRecording)
                        GestureDetector(
                          onTap: _startRecording,
                          child: Container(
                            width: 120,
                            height: 120,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: const LinearGradient(
                                colors: [Color(0xFF3B82F6), Color(0xFF8B5CF6)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.3),
                                  blurRadius: 8,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: const Center(
                              child: Text(
                                '🎤',
                                style: TextStyle(fontSize: 48),
                              ),
                            ),
                          ),
                        )
                      else
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            GestureDetector(
                              onTap: _isPaused ? _resumeRecording : _pauseRecording,
                              child: Container(
                                width: 80,
                                height: 80,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: Colors.white.withOpacity(0.1),
                                ),
                                child: Center(
                                  child: Text(
                                    _isPaused ? '▶️' : '⏸️',
                                    style: const TextStyle(fontSize: 32),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 32),
                            GestureDetector(
                              onTap: _stopRecording,
                              child: Container(
                                width: 80,
                                height: 80,
                                decoration: const BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: Color(0xFFEF4444),
                                ),
                                child: const Center(
                                  child: Text(
                                    '⏹️',
                                    style: TextStyle(fontSize: 32),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),

                      const SizedBox(height: 32),

                      // Status Text
                      Text(
                        !_isRecording
                            ? 'Tap the microphone to start recording'
                            : _isPaused
                                ? 'Recording paused'
                                : 'Recording in progress...',
                        style: TextStyle(
                          color: isDark ? Colors.white70 : Colors.black54,
                          fontSize: 16,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),

      // Processing Modal
      if (_showProcessing)
        ProcessingModal(
          stage: _processingStage,
          onCancel: () {
            setState(() {
              _showProcessing = false;
            });
          },
        ),
    );
  }
}
