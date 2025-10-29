import 'package:flutter/material.dart';

class ProcessingModal extends StatelessWidget {
  final int stage; // 1-4
  final VoidCallback? onCancel;

  const ProcessingModal({
    super.key,
    required this.stage,
    this.onCancel,
  });

  String _getStageName(int stage) {
    switch (stage) {
      case 1:
        return 'Uploading audio...';
      case 2:
        return 'Transcribing your voice...';
      case 3:
        return 'Enhancing with AI...';
      case 4:
        return 'Saving your note...';
      default:
        return 'Processing...';
    }
  }

  double _getProgress(int stage) {
    switch (stage) {
      case 1:
        return 0.25;
      case 2:
        return 0.60;
      case 3:
        return 0.90;
      case 4:
        return 1.0;
      default:
        return 0.0;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.black54,
      child: Center(
        child: Container(
          margin: const EdgeInsets.all(24),
          padding: const EdgeInsets.all(32),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.3),
                blurRadius: 16,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Progress indicator
              SizedBox(
                width: 80,
                height: 80,
                child: CircularProgressIndicator(
                  value: _getProgress(stage),
                  strokeWidth: 8,
                  backgroundColor: Colors.grey[300],
                  valueColor: AlwaysStoppedAnimation<Color>(
                    Theme.of(context).colorScheme.primary,
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Text(
                _getStageName(stage),
                style: Theme.of(context).textTheme.titleLarge,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'This may take a few moments...',
                style: Theme.of(context).textTheme.bodyMedium,
                textAlign: TextAlign.center,
              ),
              if (onCancel != null) ...[
                const SizedBox(height: 24),
                TextButton(
                  onPressed: onCancel,
                  child: const Text('Cancel'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
