import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_haptic_feedback/flutter_haptic_feedback.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../core/providers/auth_provider.dart';
import '../../widgets/animated/animated_primitives.dart';
import '../../core/motion/animations.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  bool _isSigningIn = false;

  Future<void> _handleGoogleSignIn() async {
    try {
      setState(() => _isSigningIn = true);
      FlutterHapticFeedback.lightImpact();

      await ref.read(authNotifierProvider.notifier).signInWithGoogle();

      if (mounted) {
        Fluttertoast.showToast(
          msg: 'Welcome to VoiceFlow!',
          toastLength: Toast.LENGTH_SHORT,
        );
        context.go('/home');
      }
    } catch (e) {
      if (mounted) {
        FlutterHapticFeedback.notificationFeedback(
          type: NotificationFeedbackType.error,
        );
        Fluttertoast.showToast(
          msg: 'Sign-in failed: ${e.toString()}',
          toastLength: Toast.LENGTH_LONG,
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSigningIn = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      body: AnimatedGradientBackground(
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Logo Section
                  Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white.withOpacity(0.2),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.3),
                          blurRadius: 12,
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
                  ).pop(),
                  const SizedBox(height: 20),
                  const Text(
                    'VoiceFlow',
                    style: TextStyle(
                      fontSize: 36,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ).appear(),
                  const SizedBox(height: 8),
                  Text(
                    'Transform messy thoughts into polished text',
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.white.withOpacity(0.9),
                    ),
                    textAlign: TextAlign.center,
                  ).appear(delayMs: 50),
                  const SizedBox(height: 48),

                  // Auth Card
                  GlassCard(
                    child: Column(
                      children: [
                        const Text(
                          'Welcome Back',
                          style: TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ).appear(),
                        const SizedBox(height: 8),
                        Text(
                          'Sign in to continue your voice notes journey',
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.white.withOpacity(0.8),
                          ),
                          textAlign: TextAlign.center,
                        ).appear(delayMs: 80),
                        const SizedBox(height: 24),
                        SizedBox(
                          width: double.infinity,
                          child: AnimatedPrimaryButton(
                            label: 'Continue with Google',
                            icon: Icons.g_mobiledata_rounded,
                            onPressed: _isSigningIn ? null : _handleGoogleSignIn,
                            loading: _isSigningIn,
                          ),
                        ).appear(delayMs: 120),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
