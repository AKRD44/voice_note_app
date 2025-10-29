import 'package:flutter/material.dart';
import 'dart:math' as math;

class WaveformVisualizer extends StatefulWidget {
  final bool isActive;
  final String theme; // 'light' or 'dark'
  final int numberOfBars;
  final double height;

  const WaveformVisualizer({
    super.key,
    required this.isActive,
    this.theme = 'dark',
    this.numberOfBars = 40,
    this.height = 100,
  });

  @override
  State<WaveformVisualizer> createState() => _WaveformVisualizerState();
}

class _WaveformVisualizerState extends State<WaveformVisualizer>
    with SingleTickerProviderStateMixin {
  late List<double> _barHeights;
  late AnimationController _controller;
  final List<Animation<double>> _animations = [];

  @override
  void initState() {
    super.initState();
    _initializeBars();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 1),
    );
    _setupAnimations();
  }

  void _initializeBars() {
    _barHeights = List.generate(
      widget.numberOfBars,
      (_) => math.Random().nextDouble() * 0.3 + 0.1,
    );
  }

  void _setupAnimations() {
    for (int i = 0; i < widget.numberOfBars; i++) {
      final animation = Tween<double>(
        begin: _barHeights[i],
        end: math.Random().nextDouble() * 0.8 + 0.2,
      ).animate(
        CurvedAnimation(
          parent: _controller,
          curve: Interval(
            i / widget.numberOfBars,
            (i + 1) / widget.numberOfBars,
            curve: Curves.easeInOut,
          ),
        ),
      );
      _animations.add(animation);
    }

    if (widget.isActive) {
      _controller.repeat(reverse: true);
    }
  }

  @override
  void didUpdateWidget(WaveformVisualizer oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isActive != oldWidget.isActive) {
      if (widget.isActive) {
        _controller.repeat(reverse: true);
      } else {
        _controller.stop();
        _controller.animateTo(0.1);
      }
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Color _getBarColor(int index) {
    final colors = widget.theme == 'dark'
        ? [
            const Color(0xFF3B82F6).withOpacity(0.8),
            const Color(0xFF8B5CF6).withOpacity(0.8),
          ]
        : [
            const Color(0xFF3B82F6).withOpacity(0.6),
            const Color(0xFF8B5CF6).withOpacity(0.6),
          ];
    return colors[index % 2];
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: widget.height,
      width: double.infinity,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: List.generate(
          widget.numberOfBars,
          (index) => AnimatedBuilder(
            animation: _animations[index],
            builder: (context, child) {
              return Container(
                width: 4,
                height: _animations[index].value * widget.height * 0.8,
                margin: const EdgeInsets.symmetric(horizontal: 1),
                decoration: BoxDecoration(
                  color: _getBarColor(index),
                  borderRadius: BorderRadius.circular(2),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
