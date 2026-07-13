import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api/authApi';

export default function ProfileScreen() {
  const { userData, refreshUserData } = useAuth();
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
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 16 : 48 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.header}>Profile</Text>
              <Text style={styles.sub}>Edit your account details and choose a profile picture.</Text>
            </View>
            <Pressable onPress={() => setIsEditing((value) => !value)} style={({ pressed }) => [styles.editPill, pressed && styles.pressed]}>
              <Text style={styles.editPillText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
            </Pressable>
          </View>

          <View style={styles.profileCard}>
            <Pressable onPress={openImagePicker} style={styles.avatarWrap}>
              {dp ? (
                <Image source={{ uri: dp }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
              )}
              <View style={styles.avatarBadge}>
                {isPickingPhoto ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.avatarBadgeText}>✎</Text>}
              </View>
            </Pressable>

            <Text style={styles.name}>{userData?.name || 'User'}</Text>
            <Text style={styles.email}>{userData?.email || 'No email available'}</Text>

            <View style={styles.chipRow}>
              <StatusChip label={userData?.role || 'user'} tone="neutral" />
              <StatusChip label={userData?.isVerified ? 'Verified' : 'Unverified'} tone={userData?.isVerified ? 'success' : 'warning'} />
              <StatusChip label={userData?.activePlan && userData.activePlan !== 'None' ? userData.activePlan : 'No active plan'} tone={userData?.activePlan && userData.activePlan !== 'None' ? 'success' : 'neutral'} />
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Account Details</Text>

          <EditableField
            label="Full Name"
            value={name}
            editable={isEditing}
            onChangeText={setName}
            placeholder="Enter your full name"
          />

          <EditableField
            label="Phone Number"
            value={phone}
            editable={isEditing}
            onChangeText={setPhone}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
          />

          <ReadonlyRow label="Email" value={userData?.email || 'No email available'} />
          <ReadonlyRow label="Balance" value={`Rs. ${Number(userData?.currentBalance || 0).toLocaleString()}`} />

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Profile Picture</Text>
          <Text style={styles.helperText}>Choose a square image for the best result. The photo is saved to your profile when you tap Save Changes.</Text>

          <Pressable onPress={openImagePicker} style={({ pressed }) => [styles.photoButton, pressed && styles.pressed]}>
            <Text style={styles.photoButtonText}>{isPickingPhoto ? 'Opening gallery...' : 'Select Profile Picture'}</Text>
          </Pressable>

          {isEditing && (
            <Pressable onPress={handleSave} style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]} disabled={isSaving}>
              {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
            </Pressable>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function StatusChip({ label, tone }: { label: string; tone: 'neutral' | 'success' | 'warning' }) {
  return (
    <View style={[styles.chip, chipToneStyles[tone]]}>
      <Text style={[styles.chipText, chipToneTextStyles[tone]]}>{label}</Text>
    </View>
  );
}

function ReadonlyRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.rowBlock}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function EditableField({
  label,
  value,
  editable,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  editable: boolean;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: React.ComponentProps<typeof TextInput>['keyboardType'];
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        editable={editable}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType={keyboardType}
        style={[styles.input, !editable && styles.inputReadonly]}
      />
    </View>
  );
}

const chipToneStyles = StyleSheet.create({
  neutral: { backgroundColor: '#EEF2FF' },
  success: { backgroundColor: '#DCFCE7' },
  warning: { backgroundColor: '#FEF3C7' },
});

const chipToneTextStyles = StyleSheet.create({
  neutral: { color: '#334155' },
  success: { color: '#166534' },
  warning: { color: '#92400E' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  content: { paddingHorizontal: 16, paddingBottom: 28 },
  heroCard: {
    gap: 16,
    marginBottom: 14,
    borderRadius: 28,
    padding: 18,
    backgroundColor: '#0F172A',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  header: { fontSize: 28, fontWeight: '900', color: '#FFFFFF' },
  sub: { marginTop: 4, color: '#CBD5E1', fontSize: 13, lineHeight: 18 },
  editPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  editPillText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  profileCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  avatarWrap: { marginBottom: 12 },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 30, fontWeight: '900', color: '#1D4ED8' },
  avatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  avatarBadgeText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  name: { fontSize: 22, fontWeight: '900', color: '#FFFFFF' },
  email: { marginTop: 4, fontSize: 13, color: '#CBD5E1' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 14 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  chipText: { fontSize: 11, fontWeight: '800', textTransform: 'capitalize' },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  sectionTitle: { fontSize: 15, fontWeight: '900', color: '#0F172A', marginBottom: 12 },
  fieldBlock: { marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '800', color: '#334155', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  inputReadonly: { color: '#475569' },
  rowBlock: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 4,
  },
  rowLabel: { fontSize: 12, fontWeight: '800', color: '#64748B' },
  rowValue: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 14 },
  helperText: { fontSize: 12, color: '#64748B', lineHeight: 18, marginBottom: 12 },
  photoButton: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#0EA5E9',
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 12,
  },
  photoButtonText: { color: '#0369A1', fontSize: 13, fontWeight: '900' },
  saveButton: {
    borderRadius: 16,
    backgroundColor: '#0F766E',
    alignItems: 'center',
    paddingVertical: 13,
  },
  saveButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  pressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
});
