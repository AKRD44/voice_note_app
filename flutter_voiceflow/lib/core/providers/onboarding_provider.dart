import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

class OnboardingState {
  final bool seen;
  OnboardingState(this.seen);
}

class OnboardingNotifier extends StateNotifier<OnboardingState> {
  OnboardingNotifier() : super(OnboardingState(false)) {
    _load();
  }

  static const _key = 'onboarding_seen';

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    state = OnboardingState(prefs.getBool(_key) ?? false);
  }

  Future<void> markSeen() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_key, true);
    state = OnboardingState(true);
  }
}

final onboardingProvider = StateNotifierProvider<OnboardingNotifier, OnboardingState>(
  (ref) => OnboardingNotifier(),
);
