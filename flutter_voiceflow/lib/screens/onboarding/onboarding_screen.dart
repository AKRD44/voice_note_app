import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../widgets/animated/animated_primitives.dart';
import '../../core/motion/animations.dart';

final onboardingSeenProvider = StateProvider<bool>((_) => false);

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final PageController _controller = PageController();
  int _index = 0;

  final _pages = const [
    _OnboardPage(
      title: 'Your voice, finally organized',
      subtitle:
          'Capture fleeting thoughts, messy ideas, and wandering voice notes. We turn them into clean, structured writing you can use.',
      emoji: '✨',
    ),
    _OnboardPage(
      title: 'From chaos to clarity',
      subtitle:
          'Filler words gone. Grammar fixed. Your tone intact. Choose styles like Note, Email, Blog, or craft your own.',
      emoji: '🧠',
    ),
    _OnboardPage(
      title: 'Speak. Breathe. Ship.',
      subtitle:
          'Whether you’re a founder, creator, or researcher, free your mind. We’ll handle the structure.',
      emoji: '🚀',
    ),
  ];

  void _next() {
    if (_index < _pages.length - 1) {
      _controller.nextPage(duration: Motion.normal, curve: Motion.easeOutExpo);
    } else {
      ref.read(onboardingSeenProvider.notifier).state = true;
      context.go('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: AnimatedGradientBackground(
        child: SafeArea(
          child: Stack(
            children: [
              // Pages
              PageView.builder(
                controller: _controller,
                onPageChanged: (i) => setState(() => _index = i),
                itemCount: _pages.length,
                itemBuilder: (context, i) {
                  final page = _pages[i];
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        const SizedBox(height: 24),
                        Text(
                          page.emoji,
                          style: const TextStyle(fontSize: 56),
                        ).appear(),
                        const SizedBox(height: 16),
                        Text(
                          page.title,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 32,
                            fontWeight: FontWeight.w800,
                            color: isDark ? Colors.white : const Color(0xFF1E293B),
                            height: 1.2,
                          ),
                        ).appear(delayMs: 100),
                        const SizedBox(height: 16),
                        GlassCard(
                          padding: const EdgeInsets.all(20),
                          child: Text(
                            page.subtitle,
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 16,
                              color: isDark ? Colors.white70 : const Color(0xFF475569),
                              height: 1.5,
                            ),
                          ).appear(delayMs: 150),
                        ),
                        const Spacer(),
                        // Progress dots
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: List.generate(_pages.length, (j) {
                            final active = j == _index;
                            return AnimatedContainer(
                              duration: Motion.fast,
                              margin: const EdgeInsets.symmetric(horizontal: 4),
                              height: 8,
                              width: active ? 24 : 8,
                              decoration: BoxDecoration(
                                color: active
                                    ? const Color(0xFF3B82F6)
                                    : Colors.white.withOpacity(0.4),
                                borderRadius: BorderRadius.circular(6),
                              ),
                            ).animate(delay: Motion.stagger(j)).scale(begin: const Offset(.8, .8));
                          }),
                        ),
                        const SizedBox(height: 24),
                        // CTA
                        AnimatedPrimaryButton(
                          label: _index == _pages.length - 1 ? 'Get started' : 'Continue',
                          icon: Icons.arrow_forward_rounded,
                          onPressed: _next,
                        ),
                        const SizedBox(height: 24),
                      ],
                    ),
                  );
                },
              ),
              // Skip
              Positioned(
                right: 16,
                top: 8,
                child: TextButton(
                  onPressed: () {
                    ref.read(onboardingSeenProvider.notifier).state = true;
                    context.go('/login');
                  },
                  child: const Text('Skip'),
                ).appear(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OnboardPage {
  final String title;
  final String subtitle;
  final String emoji;
  const _OnboardPage({required this.title, required this.subtitle, required this.emoji});
}
