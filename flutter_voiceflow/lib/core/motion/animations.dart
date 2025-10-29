import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

/// Motion design system with reusable presets inspired by reactbits animations.
class Motion {
  // Durations
  static const fast = Duration(milliseconds: 200);
  static const normal = Duration(milliseconds: 400);
  static const slow = Duration(milliseconds: 800);
  static const xSlow = Duration(milliseconds: 1400);

  // Curves
  static const easeOutExpo = Curves.easeOutExpo;
  static const easeInOutCubic = Curves.easeInOutCubic;
  static const spring = Curves.easeOutBack;

  // Common effects
  static Effect fadeIn([Duration? duration]) => FadeEffect(
        duration: duration ?? normal,
        curve: easeInOutCubic,
      );

  static Effect slideUp({double from = 12, Duration? duration}) => MoveEffect(
        begin: Offset(0, from),
        end: Offset.zero,
        duration: duration ?? normal,
        curve: easeOutExpo,
      );

  static Effect slideDown({double from = 12, Duration? duration}) => MoveEffect(
        begin: Offset(0, -from),
        end: Offset.zero,
        duration: duration ?? normal,
        curve: easeOutExpo,
      );

  static Effect slideRight({double from = 16, Duration? duration}) => MoveEffect(
        begin: Offset(-from, 0),
        end: Offset.zero,
        duration: duration ?? normal,
        curve: easeOutExpo,
      );

  static Effect scaleIn({double from = .96, Duration? duration}) => ScaleEffect(
        begin: Offset(from, from),
        end: const Offset(1, 1),
        duration: duration ?? normal,
        curve: spring,
      );

  static Effect blurIn([Duration? duration]) => BlurEffect(
        begin: const Offset(8, 8),
        end: Offset.zero,
        duration: duration ?? slow,
        curve: easeInOutCubic,
      );

  static Effect shimmer({Duration? duration}) => ShimmerEffect(
        duration: duration ?? xSlow,
      );

  // Staggers
  static Duration stagger(int index, {int gapMs = 80}) => Duration(milliseconds: index * gapMs);
}

extension MotionX on Widget {
  Widget appear({int delayMs = 0}) => animate(
        delay: Duration(milliseconds: delayMs),
      ).fade(duration: Motion.normal, curve: Motion.easeInOutCubic).move(
            begin: const Offset(0, 8),
            end: Offset.zero,
            duration: Motion.normal,
            curve: Motion.easeOutExpo,
          );

  Widget pop({int delayMs = 0}) => animate(delay: Duration(milliseconds: delayMs))
      .scale(duration: Motion.normal, curve: Motion.spring, begin: const Offset(.96, .96))
      .fade(duration: Motion.fast);
}
