/**
 * Language Selector Component
 * Allows users to select language for transcription
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { SUPPORTED_LANGUAGES, SupportedLanguageCode } from '../services/transcription';

interface LanguageSelectorProps {
  visible: boolean;
  currentLanguage?: SupportedLanguageCode;
  onSelectLanguage: (language: SupportedLanguageCode) => void;
  onClose: () => void;
  theme?: 'light' | 'dark';
}

const LANGUAGE_FLAGS: Record<SupportedLanguageCode, string> = {
  en: '🇺🇸',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
  pt: '🇵🇹',
  it: '🇮🇹',
  ja: '🇯🇵',
  ko: '🇰🇷',
  zh: '🇨🇳',
};

export default function LanguageSelector({
  visible,
  currentLanguage = 'en',
  onSelectLanguage,
  onClose,
  theme = 'light',
}: LanguageSelectorProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguageCode>(currentLanguage);
  const isDark = theme === 'dark';

  const handleLanguagePress = (language: SupportedLanguageCode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedLanguage(language);
  };

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelectLanguage(selectedLanguage);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <BlurView intensity={90} tint={isDark ? 'dark' : 'light'} style={styles.overlay}>
        <View style={[styles.modalContainer, isDark && styles.darkModalContainer]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, isDark && styles.darkTitle]}>
              Select Language
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Subtitle */}
          <Text style={[styles.subtitle, isDark && styles.darkSubtitle]}>
            Choose the language for transcription (or auto-detect)
          </Text>

          {/* Auto-detect Option */}
          <TouchableOpacity
            style={[
              styles.languageCard,
              !selectedLanguage && styles.languageCardSelected,
            ]}
            onPress={() => handleLanguagePress('en')} // Default to English for now
          >
            <View style={styles.languageContent}>
              <Text style={styles.flag}>🌐</Text>
              <View style={styles.languageInfo}>
                <Text style={[styles.languageName, isDark && styles.darkLanguageName]}>
                  Auto-Detect
                </Text>
                <Text style={[styles.languageDescription, isDark && styles.darkLanguageDescription]}>
                  Automatically identify the language
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Language List */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {(Object.keys(SUPPORTED_LANGUAGES) as SupportedLanguageCode[]).map((code) => {
              const language = SUPPORTED_LANGUAGES[code];
              const isSelected = selectedLanguage === code;

              return (
                <TouchableOpacity
                  key={code}
                  style={[
                    styles.languageCard,
                    isSelected && styles.languageCardSelected,
                  ]}
                  onPress={() => handleLanguagePress(code)}
                  activeOpacity={0.7}
                >
                  <View style={styles.languageContent}>
                    <Text style={styles.flag}>{LANGUAGE_FLAGS[code]}</Text>
                    <View style={styles.languageInfo}>
                      <Text style={[styles.languageName, isDark && styles.darkLanguageName]}>
                        {language.name}
                      </Text>
                      <Text style={[styles.languageCode, isDark && styles.darkLanguageCode]}>
                        {code.toUpperCase()}
                      </Text>
                    </View>
                    {isSelected && (
                      <View style={styles.selectedIndicator}>
                        <Text style={styles.selectedIcon}>✓</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Confirm Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
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
    maxHeight: '80%',
  },
  darkModalContainer: {
    backgroundColor: '#1e293b',
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
    marginBottom: 20,
  },
  darkSubtitle: {
    color: '#94a3b8',
  },
  scrollView: {
    maxHeight: 400,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  languageCard: {
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  languageCardSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  languageContent: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  flag: {
    fontSize: 32,
    marginRight: 16,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  darkLanguageName: {
    color: '#f8fafc',
  },
  languageCode: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  darkLanguageCode: {
    color: '#64748b',
  },
  languageDescription: {
    fontSize: 12,
    color: '#94a3b8',
  },
  darkLanguageDescription: {
    color: '#64748b',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIcon: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  confirmButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

