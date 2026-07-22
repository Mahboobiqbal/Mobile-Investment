import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, TextInput, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';

type CommunityPost = {
  id: string;
  title: string;
  body: string;
  author: string;
  authorAvatar?: string | null;
  createdAt: string;
  category: 'update' | 'announcement' | 'education';
};

const SAMPLE_POSTS: CommunityPost[] = [
  {
    id: '1',
    title: 'New weekly ROI update',
    body: 'This week our team processed the latest approved returns. Check the dashboard analytics for your updated balance.',
    author: 'SmartInvest Admin',
    createdAt: '10 min ago',
    category: 'update',
  },
  {
    id: '2',
    title: 'Apartment plan now available',
    body: 'A new Apartment system has been added with multiple plan options. Open the Plans tab to review it.',
    author: 'SmartInvest Admin',
    createdAt: '2 hours ago',
    category: 'announcement',
  },
  {
    id: '3',
    title: 'How to choose a plan',
    body: 'Choose a plan based on your comfort with minimum investment, return rate, and long-term goals.',
    author: 'SmartInvest Team',
    createdAt: 'Yesterday',
    category: 'education',
  },
];

const CATEGORY_CONFIG: Record<string, { label: string; border: string; bg: string; text: string; icon: string }> = {
  update: { label: 'Update', border: '#0EA5E9', bg: '#F0F9FF', text: '#0369A1', icon: '📊' },
  announcement: { label: 'Announcement', border: '#8B5CF6', bg: '#FAF5FF', text: '#6D28D9', icon: '📢' },
  education: { label: 'Education', border: '#10B981', bg: '#F0FDF4', text: '#047857', icon: '📖' },
};

export default function CommunityScreen() {
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [postsData, setPostsData] = useState<CommunityPost[]>(SAMPLE_POSTS);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    try {
      const res = await api.get('/community/posts');
      const remote = (res.data.posts || []).map((p: any) => ({
        id: p._id,
        title: p.title,
        body: p.body,
        author: p.author || 'Admin',
        authorAvatar: p.authorAvatar || null,
        createdAt: new Date(p.createdAt).toLocaleString(),
        category: p.category || 'update',
      }));
      setPostsData(remote.length ? remote : SAMPLE_POSTS);
      setFetchError(null);
    } catch (err: any) {
      console.warn('Failed to fetch community posts', err);
      setFetchError(err?.message || 'Failed to fetch posts');
    }
  };

  const posts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return postsData;
    return postsData.filter(post =>
      post.title.toLowerCase().includes(q) ||
      post.body.toLowerCase().includes(q) ||
      post.author.toLowerCase().includes(q)
    );
  }, [query, postsData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: CommunityPost }) => {
    const cat = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.update;
    return (
      <View style={[styles.postCard, { borderLeftColor: cat.border }]}>
        <View style={styles.postHeader}>
          <View style={[styles.categoryPill, { backgroundColor: cat.bg }]}>
            <Text style={styles.categoryIcon}>{cat.icon}</Text>
            <Text style={[styles.categoryLabel, { color: cat.text }]}>{cat.label}</Text>
          </View>
          <Text style={styles.postTime}>{item.createdAt}</Text>
        </View>

        <Text style={styles.postTitle}>{item.title}</Text>
        <Text style={styles.postBody}>{item.body}</Text>

        <View style={styles.postDivider} />

        <View style={styles.postFooter}>
          <View style={styles.authorRow}>
            {item.authorAvatar ? (
              <Image source={{ uri: item.authorAvatar }} style={styles.authorAvatar} />
            ) : (
              <View style={[styles.authorAvatarPlaceholder, { backgroundColor: cat.bg }]}>
                <Text style={[styles.authorAvatarInitial, { color: cat.text }]}>
                  {(item.author || 'A').charAt(0)}
                </Text>
              </View>
            )}
            <Text style={styles.authorName}>{item.author}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0EA5E9']}
            tintColor="#0EA5E9"
          />
        }
        ListHeaderComponent={() => (
          <View>
            <View style={styles.heroSection}>
              <Text style={styles.heroTitle}>Updates</Text>
              <Text style={styles.heroSubtitle}>
                Stay informed with the latest news, announcements, and educational content from our team.
              </Text>
            </View>

            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  placeholder="Search posts..."
                  placeholderTextColor="#94A3B8"
                  value={query}
                  onChangeText={setQuery}
                  style={styles.searchInput}
                />
                {query.length > 0 && (
                  <Pressable onPress={() => setQuery('')} hitSlop={8}>
                    <Text style={styles.searchClear}>✕</Text>
                  </Pressable>
                )}
              </View>
            </View>

            {fetchError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerTitle}>Connection Issue</Text>
                <Text style={styles.errorBannerText}>
                  Unable to fetch latest posts. Showing cached content.
                </Text>
              </View>
            ) : null}
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No results</Text>
            <Text style={styles.emptySubtext}>
              No posts match your search. Try a different keyword.
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  listContent: {
    paddingBottom: 100,
  },

  // Hero header
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    backgroundColor: '#0F172A',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 6,
    lineHeight: 19,
  },

  // Search
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: -14,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
    paddingVertical: 0,
  },
  searchClear: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
  },

  // Error
  errorBanner: {
    marginHorizontal: 20,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  errorBannerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2,
  },
  errorBannerText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#B45309',
  },

  // Post card
  postCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryIcon: {
    fontSize: 11,
  },
  categoryLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  postTime: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
  },
  postTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    lineHeight: 20,
  },
  postBody: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
    lineHeight: 19,
  },
  postDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  postFooter: {},
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  authorAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorAvatarInitial: {
    fontSize: 11,
    fontWeight: '800',
  },
  authorName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },

  // Empty state
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
