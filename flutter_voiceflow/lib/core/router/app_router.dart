import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../screens/home/home_screen.dart';
import '../../screens/library/library_screen.dart';
import '../../screens/recording/recording_screen.dart';
import '../../screens/settings/settings_screen.dart';
import '../../screens/auth/login_screen.dart';
import '../../screens/onboarding/onboarding_screen.dart';
import '../providers/auth_provider.dart';
import '../providers/onboarding_provider.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);
  final onboarding = ref.watch(onboardingProvider);

  return GoRouter(
    initialLocation: '/onboarding',
    debugLogDiagnostics: true,
    redirect: (context, state) {
      final isAuthenticated = authState.value?.isAuthenticated ?? false;
      final seenOnboarding = onboarding.seen;

      if (!seenOnboarding && state.matchedLocation != '/onboarding') {
        return '/onboarding';
      }

      final isLoggingIn = state.matchedLocation == '/login';

      if (!isAuthenticated && !isLoggingIn && state.matchedLocation != '/onboarding') {
        return '/login';
      }

      if (isAuthenticated && (isLoggingIn || state.matchedLocation == '/onboarding')) {
        return '/home';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/onboarding',
        name: 'onboarding',
        pageBuilder: (context, state) => const MaterialPage(child: OnboardingScreen()),
      ),
      GoRoute(
        path: '/login',
        name: 'login',
        pageBuilder: (context, state) => _fadePage(const LoginScreen()),
      ),
      ShellRoute(
        builder: (context, state, child) => MainTabs(child: child),
        routes: [
          GoRoute(
            path: '/home',
            name: 'home',
            pageBuilder: (context, state) => _slidePage(const HomeScreen()),
          ),
          GoRoute(
            path: '/library',
            name: 'library',
            pageBuilder: (context, state) => _slidePage(const LibraryScreen(), fromRight: true),
          ),
          GoRoute(
            path: '/record',
            name: 'record',
            pageBuilder: (context, state) => _scalePage(const RecordingScreen()),
          ),
          GoRoute(
            path: '/settings',
            name: 'settings',
            pageBuilder: (context, state) => _fadePage(const SettingsScreen()),
          ),
        ],
      ),
    ],
  );
});

CustomTransitionPage _fadePage(Widget child) => CustomTransitionPage(
      transitionsBuilder: (context, animation, secondaryAnimation, child) => FadeTransition(
        opacity: animation,
        child: child,
      ),
      child: child,
    );

CustomTransitionPage _slidePage(Widget child, {bool fromRight = false}) => CustomTransitionPage(
      transitionsBuilder: (context, animation, secondary, child) => SlideTransition(
        position: Tween<Offset>(
          begin: Offset(fromRight ? 0.1 : -0.1, 0),
          end: Offset.zero,
        ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOutCubic)),
        child: FadeTransition(opacity: animation, child: child),
      ),
      child: child,
    );

CustomTransitionPage _scalePage(Widget child) => CustomTransitionPage(
      transitionsBuilder: (context, animation, secondary, child) => ScaleTransition(
        scale: Tween<double>(begin: 0.98, end: 1).animate(CurvedAnimation(curve: Curves.easeOutBack, parent: animation)),
        child: FadeTransition(opacity: animation, child: child),
      ),
      child: child,
    );

class MainTabs extends StatelessWidget {
  final Widget child;

  const MainTabs({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: _BottomTabBar(),
    );
  }
}

class _BottomTabBar extends ConsumerStatefulWidget {
  @override
  ConsumerState<_BottomTabBar> createState() => _BottomTabBarState();
}

class _BottomTabBarState extends ConsumerState<_BottomTabBar> {
  int _currentIndex = 0;

  void _onTabTapped(int index) {
    setState(() => _currentIndex = index);
    switch (index) {
      case 0:
        context.go('/home');
        break;
      case 1:
        context.go('/library');
        break;
      case 2:
        context.go('/record');
        break;
      case 3:
        context.go('/settings');
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Theme.of(context).colorScheme.surface.withOpacity(0.9),
            Theme.of(context).colorScheme.surface.withOpacity(0.7),
          ],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
      ),
      child: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: _onTabTapped,
        type: BottomNavigationBarType.fixed,
        backgroundColor: Colors.transparent,
        elevation: 0,
        selectedItemColor: Theme.of(context).colorScheme.primary,
        unselectedItemColor: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.library_books), label: 'Library'),
          BottomNavigationBarItem(icon: Icon(Icons.mic), label: 'Record'),
          BottomNavigationBarItem(icon: Icon(Icons.settings), label: 'Settings'),
        ],
      ),
    );
  }
}
