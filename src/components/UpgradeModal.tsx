/**
 * Upgrade Modal Component
 * Prompts users to upgrade to premium
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { SUBSCRIPTION_PLANS } from '../services/subscription';
import { PremiumFeatures } from '../services/premiumFeatures';

interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: (planId: string) => void;
  feature?: string; // What feature triggered the upgrade prompt
  theme?: 'light' | 'dark';
}

export default function UpgradeModal({
  visible,
  onClose,
  onUpgrade,
  feature,
  theme = 'light',
}: UpgradeModalProps) {
  const isDark = theme === 'dark';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <BlurView intensity={90} tint={isDark ? 'dark' : 'light'} style={styles.overlay}>
        <View style={[styles.modalContainer, isDark && styles.darkModalContainer]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.badge, styles.premiumBadge]}>⭐ PREMIUM</Text>
              <Text style={[styles.title, isDark && styles.darkTitle]}>
                Unlock Full Power
              </Text>
              {feature && (
                <Text style={[styles.subtitle, isDark && styles.darkSubtitle]}>
                  {feature} requires Premium
                </Text>
              )}
            </View>

            {/* Benefits */}
            <View style={styles.benefits}>
              {PremiumFeatures.getUpgradeBenefits().map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <Text style={styles.checkmark}>✓</Text>
                  <Text style={[styles.benefitText, isDark && styles.darkBenefitText]}>
                    {benefit}
                  </Text>
                </View>
              ))}
            </View>

            {/* Plans */}
            <View style={styles.plans}>
              {/* Annual Plan (Recommended) */}
              <TouchableOpacity
                style={[styles.plan, styles.recommendedPlan]}
                onPress={() => onUpgrade('premium_annual')}
              >
                <View style={styles.saveBadge}>
                  <Text style={styles.saveBadgeText}>SAVE 17%</Text>
                </View>
                <Text style={styles.planName}>Annual</Text>
                <Text style={styles.planPrice}>$60/year</Text>
                <Text style={styles.planSubtext}>Just $5/month</Text>
              </TouchableOpacity>

              {/* Monthly Plan */}
              <TouchableOpacity
                style={styles.plan}
                onPress={() => onUpgrade('premium_monthly')}
              >
                <Text style={styles.planName}>Monthly</Text>
                <Text style={styles.planPrice}>$6/month</Text>
                <Text style={styles.planSubtext}>Cancel anytime</Text>
              </TouchableOpacity>
            </View>

            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  darkModalContainer: {
    backgroundColor: '#1e293b',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  premiumBadge: {
    backgroundColor: '#fbbf24',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  darkTitle: {
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  darkSubtitle: {
    color: '#94a3b8',
  },
  benefits: {
    marginBottom: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkmark: {
    fontSize: 20,
    color: '#10b981',
    marginRight: 12,
  },
  benefitText: {
    fontSize: 15,
    color: '#1e293b',
    flex: 1,
  },
  darkBenefitText: {
    color: '#f8fafc',
  },
  plans: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  plan: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    position: 'relative',
  },
  recommendedPlan: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  saveBadge: {
    position: 'absolute',
    top: -10,
    right: 10,
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  saveBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  planSubtext: {
    fontSize: 13,
    color: '#64748b',
  },
  closeButton: {
    padding: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#64748b',
  },
});

