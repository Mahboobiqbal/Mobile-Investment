import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
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
import ActivePlanHistoryScreen from '../screens/ActivePlanHistoryScreen';

export type RootStackParamList = {
  Login: { email?: string; password?: string } | undefined;
  Register: undefined;
  ForgotPassword: { email?: string } | undefined;
  PlanSelection: undefined;
  Systems: undefined;
  SystemPlans: { system?: any; systemId?: string } | undefined;
  Community: undefined;
  TermsCondition: { selectedPlanId: string; selectedPlanName: string; investmentAmount?: number } | undefined;
  ActivePlanHistory: {
    selectedPlanId: string;
    selectedPlanName: string;
    investmentAmount?: number;
    dailyReturnRate?: number;
  };
  Dashboard: undefined;
  Analysis: undefined;
  Settings: undefined;
  Profile: undefined;
  DepositRequest: { selectedPlanId?: string; selectedPlanName?: string; investmentAmount?: number } | undefined;
  WithdrawalRequest: undefined;
  MainTabs: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootStackParamList>();

function LoadingScreen() {
  return (
    <SafeAreaView style={styles.loadingContainer}>
      <ActivityIndicator color="#0EA5E9" size="large" />
      <Text style={styles.loadingText}>Loading your session...</Text>
    </SafeAreaView>
  );
}

function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
              <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>🏠</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Analysis"
        component={AnalysisScreen}
        options={{
          tabBarLabel: 'Investments',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
              <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>📊</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{
          tabBarLabel: 'Wallet',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
              <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>👛</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
              <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>☺</Text>
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { token, loading, userData } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator
      initialRouteName={token && userData ? 'MainTabs' : 'Login'}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="MainTabs" component={BottomTabs} options={{ gestureEnabled: false }} />
      <Stack.Screen
        name="PlanSelection"
        component={PlanSelectionScreen}
        options={{ headerShown: true, title: 'Select Plan', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="Systems"
        component={SystemsScreen}
        options={{ headerShown: true, title: 'Systems', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="SystemPlans"
        component={SystemPlansScreen}
        options={{ headerShown: true, title: 'Plans', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="TermsCondition"
        component={TermsConditionScreen}
        options={{ headerShown: true, title: 'Terms', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="ActivePlanHistory"
        component={ActivePlanHistoryScreen}
        options={{ headerShown: true, title: 'Active Plan History', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="DepositRequest"
        component={DepositRequestScreen}
        options={{ headerShown: true, title: 'Deposit', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="WithdrawalRequest"
        component={WithdrawalRequestScreen}
        options={{ headerShown: true, title: 'Withdraw', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerShown: true, title: 'Settings', headerBackTitle: 'Back' }}
      />
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
  tabBar: {
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
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
