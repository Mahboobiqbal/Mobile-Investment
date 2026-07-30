import React, { useMemo, useState, useEffect, useCallback } from 'react';
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
  {
    id: '4',
    title: 'Security update: 2FA now available',
    body: 'Two-factor authentication has been enabled for all accounts. Enable it in your profile settings for added security.',
    author: 'SmartInvest Admin',
    createdAt: '3 days ago',
    category: 'announcement',
  },
  {
    id: '5',
    title: 'Understanding investment returns',
    body: 'Learn how daily ROI is calculated and credited to your account. Our system processes returns every 24 hours.',
    author: 'SmartInvest Team',
    createdAt: '5 days ago',
    category: 'education',
  },
];

const CATEGORIES = [
  { key: 'all', label: 'All', icon: '📋' },
  { key: 'update', label: 'Updates', icon: '📊' },
  { key: 'announcement', label: 'Announcements', icon: '📢' },
  { key: 'education', label: 'Education', icon: '📖' },
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
  const [activeCategory, setActiveCategory] = useState('all');

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

  const filteredPosts = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = postsData;
    if (activeCategory !== 'all') {
      result = result.filter(p => p.category === activeCategory);
    }
    if (q) {
      result = result.filter(post =>
        post.title.toLowerCase().includes(q) ||
        post.body.toLowerCase().includes(q) ||
        post.author.toLowerCase().includes(q)
      );
    }
    return result;
  }, [query, postsData, activeCategory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  }, []);

  const renderItem = ({ item, index }: { item: CommunityPost; index: number }) => {
    const cat = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.update;
    const isFirst = index === 0;

    return (
      <View style={[styles.postCard, isFirst && styles.postCardFirst]}>
        <View style={styles.postCardTop}>
          <View style={[styles.categoryBadge, { backgroundColor: cat.bg }]}>
            <Text style={styles.categoryBadgeIcon}>{cat.icon}</Text>
            <Text style={[styles.categoryBadgeLabel, { color: cat.text }]}>{cat.label}</Text>
          </View>
          <Text style={styles.postTime}>{item.createdAt}</Text>
        </View>

        <Text style={styles.postTitle}>{item.title}</Text>
        <Text style={styles.postBody} numberOfLines={3}>{item.body}</Text>

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
          <Pressable style={styles.readMoreBtn}>
            <Text style={styles.readMoreText}>Read More</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={filteredPosts}
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
              <View style={styles.heroContent}>
                <Text style={styles.heroBadge}>Community</Text>
                <Text style={styles.heroTitle}>Stay Connected</Text>
                <Text style={styles.heroSubtitle}>
                  Latest updates, announcements, and educational content from the SmartInvest team.
                </Text>
              </View>
              <View style={styles.heroGraphic}>
                <Text style={styles.heroGraphicIcon}>💬</Text>
              </View>
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

            <View style={styles.categoriesRow}>
              <ScrollableCategories
                categories={CATEGORIES}
                active={activeCategory}
                onSelect={setActiveCategory}
              />
            </View>

            {fetchError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerTitle}>Connection Issue</Text>
                <Text style={styles.errorBannerText}>
                  Unable to fetch latest posts. Showing cached content.
                </Text>
              </View>
            ) : null}

            {filteredPosts.length > 0 && (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {activeCategory === 'all' ? 'All Posts' : CATEGORIES.find(c => c.key === activeCategory)?.label || 'Posts'}
                </Text>
                <Text style={styles.sectionCount}>{filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''}</Text>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Text style={styles.emptyIcon}>📭</Text>
            </View>
            <Text style={styles.emptyTitle}>No posts found</Text>
            <Text style={styles.emptySubtext}>
              {query ? 'Try a different search term or category.' : 'Check back later for new content.'}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

function ScrollableCategories({
  categories,
  active,
  onSelect,
}: {
  categories: { key: string; label: string; icon: string }[];
  active: string;
  onSelect: (key: string) => void;
}) {
  return (
    <View style={styles.categoriesInner}>
      {categories.map((cat) => {
        const isActive = cat.key === active;
        return (
          <Pressable
            key={cat.key}
            onPress={() => onSelect(cat.key)}
            style={[styles.categoryChip, isActive && styles.categoryChipActive]}
          >
            <Text style={styles.categoryChipIcon}>{cat.icon}</Text>
            <Text style={[styles.categoryChipLabel, isActive && styles.categoryChipLabelActive]}>
              {cat.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  listContent: {
    paddingBottom: 100,
  },

  heroSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
    backgroundColor: '#059669',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroContent: {
    flex: 1,
  },
  heroBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A7F3D0',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
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
    marginTop: 8,
    lineHeight: 19,
    paddingRight: 10,
  },
  heroGraphic: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 10,
  },
  heroGraphicIcon: {
    fontSize: 48,
  },

  searchContainer: {
    paddingHorizontal: 20,
    marginTop: -16,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 5,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 10,
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

  categoriesRow: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  categoriesInner: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 5,
  },
  categoryChipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  categoryChipIcon: {
    fontSize: 12,
  },
  categoryChipLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  categoryChipLabelActive: {
    color: '#FFFFFF',
  },

  errorBanner: {
    marginHorizontal: 20,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
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

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },

  postCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    padding: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  postCardFirst: {
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  postCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  categoryBadgeIcon: {
    fontSize: 12,
  },
  categoryBadgeLabel: {
    fontSize: 11,
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
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    lineHeight: 21,
  },
  postBody: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    lineHeight: 19,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  authorAvatarPlaceholder: {
    width: 26,
    height: 26,
    borderRadius: 13,
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
  readMoreBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  readMoreText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0EA5E9',
  },

  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 28,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 19,
  },
});
