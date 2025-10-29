import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

import '../models/recording.dart';

class SettingsState {
  final String theme; // 'light', 'dark', 'auto'
  final String language;
  final NotificationSettings notifications;
  final bool autoSave;
  final EnhancementStyle defaultStyle;
  final String defaultLanguage;
  final int maxRecordingDuration;
  final String audioQuality; // 'low', 'medium', 'high'
  final SubscriptionInfo subscription;

  SettingsState({
    this.theme = 'auto',
    this.language = 'en-US',
    this.notifications = const NotificationSettings(),
    this.autoSave = true,
    this.defaultStyle = EnhancementStyle.note,
    this.defaultLanguage = 'en-US',
    this.maxRecordingDuration = 180, // 3 minutes for free
    this.audioQuality = 'medium',
    this.subscription = const SubscriptionInfo(),
  });

  SettingsState copyWith({
    String? theme,
    String? language,
    NotificationSettings? notifications,
    bool? autoSave,
    EnhancementStyle? defaultStyle,
    String? defaultLanguage,
    int? maxRecordingDuration,
    String? audioQuality,
    SubscriptionInfo? subscription,
  }) {
    return SettingsState(
      theme: theme ?? this.theme,
      language: language ?? this.language,
      notifications: notifications ?? this.notifications,
      autoSave: autoSave ?? this.autoSave,
      defaultStyle: defaultStyle ?? this.defaultStyle,
      defaultLanguage: defaultLanguage ?? this.defaultLanguage,
      maxRecordingDuration: maxRecordingDuration ?? this.maxRecordingDuration,
      audioQuality: audioQuality ?? this.audioQuality,
      subscription: subscription ?? this.subscription,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'theme': theme,
      'language': language,
      'notifications': notifications.toJson(),
      'autoSave': autoSave,
      'defaultStyle': defaultStyle.name,
      'defaultLanguage': defaultLanguage,
      'maxRecordingDuration': maxRecordingDuration,
      'audioQuality': audioQuality,
      'subscription': subscription.toJson(),
    };
  }

  factory SettingsState.fromJson(Map<String, dynamic> json) {
    return SettingsState(
      theme: json['theme'] as String? ?? 'auto',
      language: json['language'] as String? ?? 'en-US',
      notifications: NotificationSettings.fromJson(
        json['notifications'] as Map<String, dynamic>? ?? {},
      ),
      autoSave: json['autoSave'] as bool? ?? true,
      defaultStyle: EnhancementStyle.values.firstWhere(
        (e) => e.name == json['defaultStyle'] as String? ?? 'note',
        orElse: () => EnhancementStyle.note,
      ),
      defaultLanguage: json['defaultLanguage'] as String? ?? 'en-US',
      maxRecordingDuration: json['maxRecordingDuration'] as int? ?? 180,
      audioQuality: json['audioQuality'] as String? ?? 'medium',
      subscription: SubscriptionInfo.fromJson(
        json['subscription'] as Map<String, dynamic>? ?? {},
      ),
    );
  }
}

class NotificationSettings {
  final bool processingComplete;
  final bool dailyReminder;
  final bool storageWarning;

  const NotificationSettings({
    this.processingComplete = true,
    this.dailyReminder = false,
    this.storageWarning = true,
  });

  Map<String, dynamic> toJson() {
    return {
      'processingComplete': processingComplete,
      'dailyReminder': dailyReminder,
      'storageWarning': storageWarning,
    };
  }

  factory NotificationSettings.fromJson(Map<String, dynamic> json) {
    return NotificationSettings(
      processingComplete: json['processingComplete'] as bool? ?? true,
      dailyReminder: json['dailyReminder'] as bool? ?? false,
      storageWarning: json['storageWarning'] as bool? ?? true,
    );
  }
}

class SubscriptionInfo {
  final String tier; // 'free' or 'premium'
  final DateTime? expiresAt;
  final UsageInfo usage;

  const SubscriptionInfo({
    this.tier = 'free',
    this.expiresAt,
    this.usage = const UsageInfo(),
  });

  bool get isPremium => tier == 'premium';

  Map<String, dynamic> toJson() {
    return {
      'tier': tier,
      'expiresAt': expiresAt?.toIso8601String(),
      'usage': usage.toJson(),
    };
  }

  factory SubscriptionInfo.fromJson(Map<String, dynamic> json) {
    return SubscriptionInfo(
      tier: json['tier'] as String? ?? 'free',
      expiresAt: json['expiresAt'] != null
          ? DateTime.parse(json['expiresAt'] as String)
          : null,
      usage: UsageInfo.fromJson(
        json['usage'] as Map<String, dynamic>? ?? {},
      ),
    );
  }
}

class UsageInfo {
  final int recordingsThisMonth;
  final int minutesThisMonth;
  final int storageUsed; // in MB

  const UsageInfo({
    this.recordingsThisMonth = 0,
    this.minutesThisMonth = 0,
    this.storageUsed = 0,
  });

  Map<String, dynamic> toJson() {
    return {
      'recordingsThisMonth': recordingsThisMonth,
      'minutesThisMonth': minutesThisMonth,
      'storageUsed': storageUsed,
    };
  }

  factory UsageInfo.fromJson(Map<String, dynamic> json) {
    return UsageInfo(
      recordingsThisMonth: json['recordingsThisMonth'] as int? ?? 0,
      minutesThisMonth: json['minutesThisMonth'] as int? ?? 0,
      storageUsed: json['storageUsed'] as int? ?? 0,
    );
  }
}

class SettingsNotifier extends StateNotifier<SettingsState> {
  SettingsNotifier() : super(SettingsState()) {
    _loadSettings();
  }

  static const String _storageKey = 'settings_store';

  Future<void> _loadSettings() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final settingsJson = prefs.getString(_storageKey);

      if (settingsJson != null) {
        final json = jsonDecode(settingsJson) as Map<String, dynamic>;
        state = SettingsState.fromJson(json);
      }
    } catch (e) {
      print('Error loading settings: $e');
    }
  }

  Future<void> _saveSettings() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final settingsJson = jsonEncode(state.toJson());
      await prefs.setString(_storageKey, settingsJson);
    } catch (e) {
      print('Error saving settings: $e');
    }
  }

  Future<void> initializeSettings() async {
    // Check for premium subscription
    final prefs = await SharedPreferences.getInstance();
    final hasPremium = prefs.getBool('hasPremium') ?? false;

    if (hasPremium) {
      state = state.copyWith(
        subscription: SubscriptionInfo(
          tier: 'premium',
          usage: state.subscription.usage,
        ),
        maxRecordingDuration: 900, // 15 minutes for premium
      );
      _saveSettings();
    }
  }

  void setTheme(String theme) {
    state = state.copyWith(theme: theme);
    _saveSettings();
  }

  void setLanguage(String language) {
    state = state.copyWith(
      language: language,
      defaultLanguage: language,
    );
    _saveSettings();
  }

  void setNotificationSettings(NotificationSettings notifications) {
    state = state.copyWith(notifications: notifications);
    _saveSettings();
  }

  void setDefaultStyle(EnhancementStyle style) {
    state = state.copyWith(defaultStyle: style);
    _saveSettings();
  }

  void setAudioQuality(String quality) {
    state = state.copyWith(audioQuality: quality);
    _saveSettings();
  }

  void updateUsage(UsageInfo usage) {
    state = state.copyWith(
      subscription: SubscriptionInfo(
        tier: state.subscription.tier,
        expiresAt: state.subscription.expiresAt,
        usage: usage,
      ),
    );
    _saveSettings();
  }

  void resetUsage() {
    state = state.copyWith(
      subscription: SubscriptionInfo(
        tier: state.subscription.tier,
        expiresAt: state.subscription.expiresAt,
        usage: const UsageInfo(),
      ),
    );
    _saveSettings();
  }
}

// Provider
final settingsProvider = StateNotifierProvider<SettingsNotifier, SettingsState>(
  (ref) => SettingsNotifier(),
);
