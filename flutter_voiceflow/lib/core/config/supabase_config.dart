import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'dart:io' show Platform;

class SupabaseConfig {
  static const String supabaseUrlKey = 'SUPABASE_URL';
  static const String supabaseAnonKey = 'SUPABASE_ANON_KEY';

  static Future<void> initialize() async {
    // Load environment variables
    // In production, use flutter_dotenv or set these via build config
    const supabaseUrl = String.fromEnvironment(
      supabaseUrlKey,
      defaultValue: '',
    );
    const supabaseAnonKey = String.fromEnvironment(
      supabaseAnonKey,
      defaultValue: '',
    );

    if (supabaseUrl.isEmpty || supabaseAnonKey.isEmpty) {
      throw Exception(
        'Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_ANON_KEY.',
      );
    }

    await Supabase.initialize(
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      authOptions: const FlutterAuthClientOptions(
        authFlowType: AuthFlowType.pkce,
      ),
      storageOptions: const StorageClientOptions(
        retryAttempts: 3,
      ),
    );
  }

  static SupabaseClient get client => Supabase.instance.client;
}
