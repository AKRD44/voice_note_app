/**
 * Analytics Service
 * Tracks user behavior and app usage
 * Ready for integration with PostHog, Mixpanel, or Firebase Analytics
 */

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
}

export interface UserProperties {
  userId?: string;
  email?: string;
  subscriptionTier?: 'free' | 'premium';
  language?: string;
  [key: string]: any;
}

/**
 * Analytics Service Class
 * Provides a unified interface for analytics tracking
 */
export class AnalyticsService {
  private static isInitialized = false;
  private static userId: string | null = null;

  /**
   * Initialize analytics service
   * Call this once when the app starts
   */
  static initialize(config?: { apiKey?: string; host?: string }): void {
    if (this.isInitialized) {
      console.warn('Analytics already initialized');
      return;
    }

    // TODO: Initialize your analytics provider here
    // Example for PostHog:
    // posthog.init(config.apiKey, { host: config.host });
    
    // Example for Firebase:
    // await analytics().setAnalyticsCollectionEnabled(true);

    console.log('Analytics initialized:', config);
    this.isInitialized = true;
  }

  /**
   * Identify user
   */
  static identify(userId: string, properties?: UserProperties): void {
    if (!this.isInitialized) {
      console.warn('Analytics not initialized');
      return;
    }

    this.userId = userId;

    // TODO: Identify user in your analytics provider
    // Example for PostHog:
    // posthog.identify(userId, properties);
    
    // Example for Firebase:
    // await analytics().setUserId(userId);
    // await analytics().setUserProperties(properties);

    console.log('User identified:', userId, properties);
  }

  /**
   * Track an event
   */
  static track(eventName: string, properties?: Record<string, any>): void {
    if (!this.isInitialized) {
      console.warn('Analytics not initialized');
      return;
    }

    // TODO: Track event in your analytics provider
    // Example for PostHog:
    // posthog.capture(eventName, properties);
    
    // Example for Firebase:
    // await analytics().logEvent(eventName, properties);

    console.log('Event tracked:', eventName, properties);
  }

  /**
   * Track screen view
   */
  static trackScreen(screenName: string, properties?: Record<string, any>): void {
    this.track('screen_view', {
      screen_name: screenName,
      ...properties,
    });
  }

  /**
   * Reset user data (on sign out)
   */
  static reset(): void {
    this.userId = null;

    // TODO: Reset analytics provider
    // Example for PostHog:
    // posthog.reset();
    
    // Example for Firebase:
    // await analytics().resetAnalyticsData();

    console.log('Analytics reset');
  }

  // ============================================================================
  // Pre-defined Events
  // ============================================================================

  static trackRecordingStarted(properties?: { duration_limit?: number; language?: string }): void {
    this.track('recording_started', properties);
  }

  static trackRecordingCompleted(properties?: {
    duration?: number;
    style?: string;
    word_count?: number;
  }): void {
    this.track('recording_completed', properties);
  }

  static trackTranscriptionSuccess(properties?: {
    duration?: number;
    language?: string;
    word_count?: number;
  }): void {
    this.track('transcription_success', properties);
  }

  static trackEnhancementSuccess(properties?: {
    style?: string;
    tokens_used?: number;
  }): void {
    this.track('enhancement_success', properties);
  }

  static trackExportClicked(properties?: {
    format?: string;
    recording_age_days?: number;
  }): void {
    this.track('export_clicked', properties);
  }

  static trackShareClicked(properties?: {
    method?: 'link' | 'native';
    format?: string;
  }): void {
    this.track('share_clicked', properties);
  }

  static trackUpgradeClicked(properties?: {
    source?: string;
    current_tier?: string;
  }): void {
    this.track('upgrade_clicked', properties);
  }

  static trackSubscriptionPurchased(properties?: {
    tier?: string;
    price?: number;
    currency?: string;
    period?: 'monthly' | 'annual';
  }): void {
    this.track('subscription_purchased', properties);
  }

  static trackSubscriptionCancelled(properties?: {
    tier?: string;
    reason?: string;
  }): void {
    this.track('subscription_cancelled', properties);
  }

  static trackSearchPerformed(properties?: {
    query?: string;
    results_count?: number;
  }): void {
    this.track('search_performed', {
      ...properties,
      query: undefined, // Don't track actual search query for privacy
      has_query: !!properties?.query,
    });
  }

  static trackFolderCreated(): void {
    this.track('folder_created');
  }

  static trackTagCreated(): void {
    this.track('tag_created');
  }

  static trackError(properties: {
    error_type: string;
    error_message: string;
    screen?: string;
    fatal?: boolean;
  }): void {
    this.track('error_occurred', properties);
  }

  static trackPerformance(properties: {
    metric: string;
    value: number;
    unit: 'ms' | 'bytes' | 'count';
  }): void {
    this.track('performance_metric', properties);
  }

  // ============================================================================
  // User Properties
  // ============================================================================

  static setUserProperty(key: string, value: any): void {
    if (!this.isInitialized) return;

    // TODO: Set user property in your analytics provider
    // Example for PostHog:
    // posthog.setPersonProperties({ [key]: value });
    
    // Example for Firebase:
    // await analytics().setUserProperty(key, value);

    console.log('User property set:', key, value);
  }

  static incrementUserProperty(key: string, value: number = 1): void {
    if (!this.isInitialized) return;

    // TODO: Increment user property
    // Example for PostHog:
    // posthog.setPersonProperties({ [key]: posthog.getPersonProperty(key) + value });

    console.log('User property incremented:', key, value);
  }
}

export default AnalyticsService;

