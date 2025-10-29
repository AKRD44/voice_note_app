import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../config/supabase_config.dart';

// Auth State Model
class AuthState {
  final User? user;
  final Session? session;
  final UserProfile? profile;
  final bool isLoading;
  final bool isAuthenticated;

  AuthState({
    this.user,
    this.session,
    this.profile,
    this.isLoading = false,
    this.isAuthenticated = false,
  });

  AuthState copyWith({
    User? user,
    Session? session,
    UserProfile? profile,
    bool? isLoading,
    bool? isAuthenticated,
  }) {
    return AuthState(
      user: user ?? this.user,
      session: session ?? this.session,
      profile: profile ?? this.profile,
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
    );
  }
}

// User Profile Model
class UserProfile {
  final String id;
  final String? displayName;
  final String? avatarUrl;
  final String subscriptionTier;
  final DateTime? subscriptionExpiresAt;
  final DateTime createdAt;
  final DateTime updatedAt;

  UserProfile({
    required this.id,
    this.displayName,
    this.avatarUrl,
    this.subscriptionTier = 'free',
    this.subscriptionExpiresAt,
    required this.createdAt,
    required this.updatedAt,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['id'] as String,
      displayName: json['display_name'] as String?,
      avatarUrl: json['avatar_url'] as String?,
      subscriptionTier: json['subscription_tier'] as String? ?? 'free',
      subscriptionExpiresAt: json['subscription_expires_at'] != null
          ? DateTime.parse(json['subscription_expires_at'] as String)
          : null,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  bool get isPremium => subscriptionTier == 'premium';
}

// Auth Provider
class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(AuthState()) {
    _initializeAuth();
  }

  final _supabase = SupabaseConfig.client;

  Future<void> _initializeAuth() async {
    state = state.copyWith(isLoading: true);

    try {
      final session = _supabase.auth.currentSession;
      if (session != null && session.user != null) {
        await _loadUserProfile(session.user!.id);
        state = state.copyWith(
          user: session.user,
          session: session,
          isAuthenticated: true,
          isLoading: false,
        );
      } else {
        state = state.copyWith(isLoading: false);
      }
    } catch (e) {
      state = state.copyWith(isLoading: false);
    }

    // Listen to auth state changes
    _supabase.auth.onAuthStateChange.listen((data) {
      final session = data.session;
      if (session != null && session.user != null) {
        _loadUserProfile(session.user!.id);
        state = state.copyWith(
          user: session.user,
          session: session,
          isAuthenticated: true,
        );
      } else {
        state = AuthState(isLoading: false);
      }
    });
  }

  Future<void> _loadUserProfile(String userId) async {
    try {
      final response = await _supabase
          .from('profiles')
          .select()
          .eq('id', userId)
          .single();

      final profile = UserProfile.fromJson(response);
      state = state.copyWith(profile: profile);
    } catch (e) {
      // Profile might not exist yet
      print('Error loading profile: $e');
    }
  }

  Future<void> signInWithGoogle() async {
    try {
      state = state.copyWith(isLoading: true);

      final googleSignIn = GoogleSignIn(
        scopes: ['email', 'profile'],
      );

      final googleUser = await googleSignIn.signIn();
      if (googleUser == null) {
        state = state.copyWith(isLoading: false);
        throw Exception('Google sign-in was cancelled');
      }

      final googleAuth = await googleUser.authentication;
      final accessToken = googleAuth.accessToken;
      final idToken = googleAuth.idToken;

      if (accessToken == null || idToken == null) {
        throw Exception('Failed to get Google auth tokens');
      }

      final response = await _supabase.auth.signInWithIdToken(
        provider: OAuthProvider.google,
        idToken: idToken,
        accessToken: accessToken,
      );

      if (response.session != null && response.user != null) {
        await _loadUserProfile(response.user!.id);
        state = state.copyWith(
          user: response.user,
          session: response.session,
          isAuthenticated: true,
          isLoading: false,
        );
      }
    } catch (e) {
      state = state.copyWith(isLoading: false);
      rethrow;
    }
  }

  Future<void> signOut() async {
    try {
      await _supabase.auth.signOut();
      state = AuthState(isLoading: false);
    } catch (e) {
      rethrow;
    }
  }

  Future<void> refreshSession() async {
    try {
      final session = await _supabase.auth.refreshSession();
      if (session.session != null && session.session!.user != null) {
        await _loadUserProfile(session.session!.user!.id);
        state = state.copyWith(
          user: session.session!.user,
          session: session.session,
          isAuthenticated: true,
        );
      }
    } catch (e) {
      rethrow;
    }
  }
}

// Providers
final authNotifierProvider = StateNotifierProvider<AuthNotifier, AuthState>(
  (ref) => AuthNotifier(),
);

final authStateProvider = Provider<AuthState>((ref) {
  return ref.watch(authNotifierProvider);
});

// Theme mode provider
final themeModeProvider = StateProvider<ThemeMode>((ref) => ThemeMode.system);
