import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import PlanSelectionScreen from '../screens/PlanSelectionScreen';
import TermsConditionScreen from '../screens/TermsConditionScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AnalysisScreen from '../screens/AnalysisScreen';
import DepositRequestScreen from '../screens/DepositRequestScreen';
import WithdrawalRequestScreen from '../screens/WithdrawalRequestScreen';
import SystemsScreen from '../screens/SystemsScreen';
import SystemPlansScreen from '../screens/SystemPlansScreen';
import CommunityScreen from '../screens/CommunityScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';

export type RootStackParamList = {
  Login: { email?: string; password?: string } | undefined;
  Register: undefined;
  PlanSelection: undefined;
  Systems: undefined;
  SystemPlans: { system?: any; systemId?: string } | undefined;
  Community: undefined;
  TermsCondition: { selectedPlanId: string; selectedPlanName: string };
  Dashboard: undefined;
  Analysis: undefined;
  Settings: undefined;
  Profile: undefined;
  DepositRequest: undefined;
  WithdrawalRequest: undefined;
  MainTabs: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

type TabKey = 'Home' | 'Community' | 'Analysis' | 'Profile';
type MainRouteName =
  | 'Dashboard'
  | 'Community'
  | 'Analysis'
  | 'Settings'
  | 'Profile'
  | 'PlanSelection'
  | 'Systems'
  | 'SystemPlans'
  | 'TermsCondition'
  | 'DepositRequest'
  | 'WithdrawalRequest';

function LoadingScreen() {
  return (
    <SafeAreaView style={styles.loadingContainer}>
      <ActivityIndicator color="#0EA5E9" size="large" />
      <Text style={styles.loadingText}>Loading your session...</Text>
    </SafeAreaView>
  );
}

function getTabForRoute(routeName: string): TabKey {
  switch (routeName) {
    case 'Community':
      return 'Community';
    case 'Analysis':
      return 'Analysis';
    case 'Profile':
      return 'Profile';
    default:
      return 'Home';
  }
}

function BottomTabs() {
  const navigation = useNavigation<any>();
  const routeName = useNavigationState((state) => state.routes[state.index]?.name || 'Dashboard');
  const activeTab = getTabForRoute(routeName);

  const tabs: Array<{ key: TabKey; label: string; icon: string; route: MainRouteName }> = [
    { key: 'Home', label: 'Dashboard', icon: '🏠', route: 'Dashboard' },
    { key: 'Analysis', label: 'Investments', icon: '📊', route: 'Analysis' },
    { key: 'Community', label: 'Wallet', icon: '👛', route: 'Community' },
    { key: 'Profile', label: 'Profile', icon: '☺', route: 'Profile' },
  ];


  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => {
        const focused = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => navigation.navigate(tab.route)}
            style={({ pressed }) => [styles.tabItem, pressed && styles.tabItemPressed]}
          >
            <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
              <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>{tab.icon}</Text>
            </View>
            <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function MainShell({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.shell}>
      <View style={styles.screenArea}>{children}</View>
      <BottomTabs />
    </View>
  );
}

function MainTabs() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Dashboard" children={() => <MainShell><DashboardScreen /></MainShell>} />
      <Stack.Screen name="Community" children={() => <MainShell><CommunityScreen /></MainShell>} />
      <Stack.Screen name="Analysis" children={() => <MainShell><AnalysisScreen /></MainShell>} />
      <Stack.Screen name="Settings" children={() => <MainShell><SettingsScreen /></MainShell>} />
      <Stack.Screen name="Profile" children={() => <MainShell><ProfileScreen /></MainShell>} />
      <Stack.Screen name="PlanSelection" children={() => <MainShell><PlanSelectionScreen /></MainShell>} />
      <Stack.Screen name="Systems" children={() => <MainShell><SystemsScreen /></MainShell>} />
      <Stack.Screen name="SystemPlans" children={() => <MainShell><SystemPlansScreen /></MainShell>} />
      <Stack.Screen name="TermsCondition" children={() => <MainShell><TermsConditionScreen /></MainShell>} />
      <Stack.Screen name="DepositRequest" children={() => <MainShell><DepositRequestScreen /></MainShell>} />
      <Stack.Screen name="WithdrawalRequest" children={() => <MainShell><WithdrawalRequestScreen /></MainShell>} />
    </Stack.Navigator>
  );
}


export default function AppNavigator() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator 
      initialRouteName="Login"
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ gestureEnabled: false }} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    color: '#334155',
    fontSize: 15,
    fontWeight: '600',
  },
  shell: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  screenArea: {
    flex: 1,
    paddingBottom: 104,
  },
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 78,
    paddingHorizontal: 10,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 8,
  },

  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    marginHorizontal: 3,
    height: 60,
  },
  tabItemPressed: {
    opacity: 0.92,
  },
  tabIconWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    marginBottom: 4,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  tabIconWrapActive: {
    backgroundColor: '#008751',
    transform: [{ scale: 1.04 }],
  },

  tabIcon: {
    fontSize: 18,
    color: '#A8B3C7',
    fontWeight: '800',
  },
  tabIconActive: {
    color: '#FFFFFF',
    fontSize: 19,
  },
  tabLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
});
