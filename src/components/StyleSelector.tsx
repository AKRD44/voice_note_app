/**
 * Style Selector Component
 * Allows users to select or change transcript enhancement style
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { EnhancementStyle } from '../services/enhancement';
import { EnhancementService } from '../services/enhancement';

const { width } = Dimensions.get('window');

interface StyleSelectorProps {
  visible: boolean;
  currentStyle: EnhancementStyle;
  isPremium?: boolean;
  onSelectStyle: (style: EnhancementStyle) => void;
  onClose: () => void;
  onCustomPrompt?: (prompt: string) => void;
  theme?: 'light' | 'dark';
}

export default function StyleSelector({
  visible,
  currentStyle,
  isPremium = false,
  onSelectStyle,
  onClose,
  onCustomPrompt,
  theme = 'light',
}: StyleSelectorProps) {
  const [selectedStyle, setSelectedStyle] = useState<EnhancementStyle>(currentStyle);
  const isDark = theme === 'dark';

  const availableStyles = EnhancementService.getAvailableStyles(isPremium);

  const handleStylePress = (style: EnhancementStyle) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedStyle(style);
  };

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (selectedStyle === 'custom' && onCustomPrompt) {
      // Show custom prompt input
      onCustomPrompt('');
    } else {
      onSelectStyle(selectedStyle);
    }
    
    onClose();
  };

  const styleCards: Array<{
    style: EnhancementStyle;
    icon: string;
    isPremium: boolean;
  }> = [
    { style: 'note', icon: '📝', isPremium: false },
    { style: 'email', icon: '✉️', isPremium: false },
    { style: 'summary', icon: '📋', isPremium: false },
    { style: 'blog', icon: '✍️', isPremium: true },
    { style: 'transcript', icon: '📄', isPremium: true },
    { style: 'custom', icon: '⚙️', isPremium: true },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <BlurView intensity={90} tint={isDark ? 'dark' : 'light'} style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, isDark && styles.darkTitle]}>
              Choose Style
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Subtitle */}
          <Text style={[styles.subtitle, isDark && styles.darkSubtitle]}>
            Select how you want your transcript formatted
          </Text>

          {/* Style Cards */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {styleCards.map(({ style, icon, isPremium: styleIsPremium }) => {
              const styleInfo = EnhancementService.getStyleInfo(style);
              const isSelected = selectedStyle === style;
              const isLocked = styleIsPremium && !isPremium;

              return (
                <TouchableOpacity
                  key={style}
                  style={[
                    styles.styleCard,
                    isSelected && styles.styleCardSelected,
                    isLocked && styles.styleCardLocked,
                  ]}
                  onPress={() => !isLocked && handleStylePress(style)}
                  activeOpacity={isLocked ? 1 : 0.7}
                  disabled={isLocked}
                >
                  <View style={styles.styleCardContent}>
                    {/* Icon */}
                    <View style={[
                      styles.iconContainer,
                      isSelected && styles.iconContainerSelected,
                      isLocked && styles.iconContainerLocked,
                    ]}>
                      <Text style={styles.icon}>{icon}</Text>
                    </View>

                    {/* Content */}
                    <View style={styles.textContainer}>
                      <View style={styles.titleRow}>
                        <Text style={[
                          styles.styleName,
                          isDark && styles.darkStyleName,
                          isLocked && styles.styleNameLocked,
                        ]}>
                          {styleInfo.name}
                        </Text>
                        {isLocked && (
                          <View style={styles.premiumBadge}>
                            <Text style={styles.premiumBadgeText}>⭐ Premium</Text>
                          </View>
                        )}
                      </View>
                      
                      <Text style={[
                        styles.styleDescription,
                        isDark && styles.darkStyleDescription,
                        isLocked && styles.styleDescriptionLocked,
                      ]}>
                        {styleInfo.description}
                      </Text>
                      
                      <Text style={[
                        styles.styleExample,
                        isDark && styles.darkStyleExample,
                      ]}>
                        {styleInfo.example}
                      </Text>
                    </View>

                    {/* Selection Indicator */}
                    {isSelected && !isLocked && (
                      <View style={styles.selectedIndicator}>
                        <Text style={styles.selectedIcon}>✓</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Premium Upsell for Free Users */}
            {!isPremium && (
              <View style={styles.upsellCard}>
                <Text style={styles.upsellTitle}>Unlock All Styles</Text>
                <Text style={styles.upsellText}>
                  Get access to Blog, Transcript, and Custom styles with Premium
                </Text>
                <TouchableOpacity style={styles.upgradeButton}>
                  <LinearGradient
                    colors={['#3b82f6', '#8b5cf6']}
                    style={styles.upgradeButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* Confirm Button */}
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#3b82f6', '#8b5cf6']}
              style={styles.confirmButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.confirmButtonText}>
                {selectedStyle === 'custom' ? 'Enter Custom Instructions' : 'Apply Style'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
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
    paddingTop: 24,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  darkTitle: {
    color: '#f8fafc',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#64748b',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  darkSubtitle: {
    color: '#94a3b8',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  styleCard: {
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  styleCardSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  styleCardLocked: {
    opacity: 0.6,
    backgroundColor: '#f8fafc',
  },
  styleCardContent: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconContainerSelected: {
    backgroundColor: '#dbeafe',
  },
  iconContainerLocked: {
    backgroundColor: '#e2e8f0',
  },
  icon: {
    fontSize: 28,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  styleName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  darkStyleName: {
    color: '#f8fafc',
  },
  styleNameLocked: {
    color: '#94a3b8',
  },
  styleDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  darkStyleDescription: {
    color: '#94a3b8',
  },
  styleDescriptionLocked: {
    color: '#cbd5e1',
  },
  styleExample: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  darkStyleExample: {
    color: '#64748b',
  },
  selectedIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  selectedIcon: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  premiumBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#fbbf24',
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#78350f',
  },
  upsellCard: {
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    borderWidth: 2,
    borderColor: '#bfdbfe',
  },
  upsellTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  upsellText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 20,
  },
  upgradeButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  upgradeButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  confirmButton: {
    marginHorizontal: 24,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

