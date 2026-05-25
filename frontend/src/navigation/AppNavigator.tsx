import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text } from 'react-native';

import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import PlanSelectionScreen from '../screens/PlanSelectionScreen';
import TermsAndConditionsScreen from '../screens/TermsAndConditionsScreen';
import DashboardScreen from '../screens/DashboardScreen';

type AppStackParamList = {
  Login: undefined;
  Register: undefined;
  PlanSelection: undefined;
  TermsAndConditions: { plan: any };
  Dashboard: undefined;
};

const Stack = createNativeStackNavigator<AppStackParamList>();

function LoadingScreen() {
  return (
    <SafeAreaView style={styles.loadingContainer}>
      <ActivityIndicator color="#0EA5E9" size="large" />
      <Text style={styles.loadingText}>Loading your session...</Text>
    </SafeAreaView>
  );
}

export default function AppNavigator() {
  const { token, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {token === null ? (
        // Auth Stack: Login and Register
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        // Onboarded Stack: Plan Selection → Terms & Conditions → Dashboard
        <>
          <Stack.Screen name="PlanSelection" component={PlanSelectionScreen} />
          <Stack.Screen name="TermsAndConditions" component={TermsAndConditionsScreen} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
        </>
      )}
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
});
