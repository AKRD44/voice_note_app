import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/motion/animations.dart';

class AnimatedPrimaryButton extends StatefulWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool loading;
  final IconData? icon;

  const AnimatedPrimaryButton({
    super.key,
    required this.label,
    this.onPressed,
    this.loading = false,
    this.icon,
  });

  @override
  State<AnimatedPrimaryButton> createState() => _AnimatedPrimaryButtonState();
}

class _AnimatedPrimaryButtonState extends State<AnimatedPrimaryButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final gradient = const LinearGradient(
      colors: [Color(0xFF3B82F6), Color(0xFF8B5CF6)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    );

    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapCancel: () => setState(() => _pressed = false),
      onTapUp: (_) => setState(() => _pressed = false),
      onTap: widget.loading ? null : widget.onPressed,
      child: AnimatedContainer(
        duration: Motion.fast,
        curve: Motion.spring,
        transform: Matrix4.identity()..scale(_pressed ? 0.98 : 1.0),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF3B82F6).withOpacity(0.35),
              blurRadius: _pressed ? 8 : 16,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            gradient: gradient,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (widget.loading)
                const SizedBox(
                  height: 18,
                  width: 18,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                )
              else ...[
                if (widget.icon != null) ...[
                  Icon(widget.icon, color: Colors.white),
                  const SizedBox(width: 8),
                ],
                Text(
                  widget.label,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 16,
                  ),
                ),
              ]
            ],
          ),
        ),
      ).pop(),
    );
  }
}

class GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsets padding;

  const GlassCard({super.key, required this.child, this.padding = const EdgeInsets.all(16)});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.15)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.15),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
          child: Container(
            color: Colors.white.withOpacity(0.10),
            padding: padding,
            child: child,
          ),
        ),
      ).appear(),
    );
  }
}

class AnimatedGradientBackground extends StatefulWidget {
  final Widget child;
  const AnimatedGradientBackground({super.key, required this.child});

  @override
  State<AnimatedGradientBackground> createState() => _AnimatedGradientBackgroundState();
}

class _AnimatedGradientBackgroundState extends State<AnimatedGradientBackground>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(seconds: 12))..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        final t = _controller.value;
        return Container(
          decoration: BoxDecoration(
            gradient: RadialGradient(
              center: Alignment(0.6 * (t * 2 - 1), -0.2),
              radius: 1.2,
              colors: const [
                Color(0xFF0F172A),
                Color(0xFF1E293B),
                Color(0xFF111827),
              ],
            ),
          ),
          child: Stack(
            children: [
              Positioned(
                left: 40 + 80 * (1 - t),
                top: 120,
                child: _blob(const Color(0xFF3B82F6).withOpacity(0.25), 180),
              ),
              Positioned(
                right: 24 + 40 * t,
                bottom: 80,
                child: _blob(const Color(0xFF8B5CF6).withOpacity(0.20), 140),
              ),
              widget.child,
            ],
          ),
        );
      },
    );
  }

  Widget _blob(Color color, double size) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: color,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(color: color, blurRadius: 60, spreadRadius: 20),
        ],
      ),
    ).blurred(blur: 40).animate().fade(duration: Motion.slow);
  }
}
