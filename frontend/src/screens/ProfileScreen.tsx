import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api/authApi';

export default function ProfileScreen() {
  const { userData, refreshUserData } = useAuth();
  const insets = useSafeAreaInsets();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPickingPhoto, setIsPickingPhoto] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dp, setDp] = useState('');

  useEffect(() => {
    setName(userData?.name || '');
    setPhone(userData?.phone || '');
    setDp(userData?.dp || '');
  }, [userData]);

  const initials = useMemo(() => (name || userData?.name || 'U').charAt(0).toUpperCase(), [name, userData?.name]);

  const openImagePicker = async () => {
    setIsPickingPhoto(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow photo library access to choose a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
        base64: true,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];
      const imageUri = asset.base64 && asset.mimeType ? `data:${asset.mimeType};base64,${asset.base64}` : asset.uri;
      setDp(imageUri);
      setIsEditing(true);
    } catch (error) {
      console.error('Image picker failed:', error);
      Alert.alert('Photo Selection Failed', 'Unable to select a profile picture right now.');
    } finally {
      setIsPickingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Please enter your name.');
      return;
    }

    setIsSaving(true);
    try {
      await authApi.updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        dp: dp.trim(),
      });

      await refreshUserData();
      setIsEditing(false);
      Alert.alert('Profile updated', 'Your profile changes have been saved successfully.');
    } catch (error: any) {
      Alert.alert('Update failed', error?.response?.data?.message || 'Unable to save profile changes.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <Pressable onPress={openImagePicker} style={styles.avatarWrap}>
            {dp ? (
              <Image source={{ uri: dp }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <View style={styles.avatarBadge}>
              {isPickingPhoto ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.avatarBadgeIcon}>📷</Text>
              )}
            </View>
          </Pressable>

          <Text style={styles.profileName}>{userData?.name || 'User'}</Text>
          <Text style={styles.profileEmail}>{userData?.email || 'No email available'}</Text>

          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: '#EEF2FF' }]}>
              <Text style={[styles.badgeText, { color: '#334155' }]}>{userData?.role || 'user'}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: userData?.isVerified ? '#DCFCE7' : '#FEF3C7' }]}>
              <Text style={[styles.badgeText, { color: userData?.isVerified ? '#166534' : '#92400E' }]}>
                {userData?.isVerified ? 'Verified' : 'Unverified'}
              </Text>
            </View>
          </View>

          <View style={styles.profileStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Balance</Text>
              <Text style={styles.statValue}>
                Rs. {Number(userData?.currentBalance || 0).toLocaleString()}
              </Text>
            </View>
            <View style={styles.statItemDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Plan</Text>
              <Text style={styles.statValue}>
                {userData?.activePlan && userData.activePlan !== 'None' ? userData.activePlan : 'None'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            {!isEditing && (
              <Pressable onPress={() => setIsEditing(true)} hitSlop={8} style={styles.editPill}>
                <Text style={styles.editPillText}>Edit</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <TextInput
              value={name}
              editable={isEditing}
              onChangeText={setName}
              placeholder="Enter your full name"
              placeholderTextColor="#94A3B8"
              style={[styles.input, !isEditing && styles.inputReadonly]}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Phone Number</Text>
            <TextInput
              value={phone}
              editable={isEditing}
              onChangeText={setPhone}
              placeholder="Enter your phone number"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              style={[styles.input, !isEditing && styles.inputReadonly]}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email</Text>
            <View style={styles.readonlyValue}>
              <Text style={styles.readonlyText}>{userData?.email || 'No email available'}</Text>
            </View>
          </View>

          {isEditing && (
            <View style={styles.editActions}>
              <Pressable
                onPress={() => {
                  setIsEditing(false);
                  setName(userData?.name || '');
                  setPhone(userData?.phone || '');
                  setDp(userData?.dp || '');
                }}
                style={styles.cancelButton}
                disabled={isSaving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                style={styles.saveButton}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  content: {
    paddingBottom: 32,
  },

  // Profile card
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  avatarWrap: {
    marginBottom: 16,
    position: 'relative',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#E2E8F0',
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#E2E8F0',
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0284C7',
  },
  avatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#0EA5E9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  avatarBadgeIcon: {
    fontSize: 12,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  profileEmail: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },

  // Profile stats
  profileStats: {
    flexDirection: 'row',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  statItemDivider: {
    width: 1,
    backgroundColor: '#F1F5F9',
  },

  // Section card
  sectionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  editPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  editPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0EA5E9',
  },

  // Form fields
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '500',
    color: '#0F172A',
  },
  inputReadonly: {
    color: '#475569',
    backgroundColor: '#F8FAFC',
  },
  readonlyValue: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  readonlyText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#475569',
  },

  // Edit actions
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
