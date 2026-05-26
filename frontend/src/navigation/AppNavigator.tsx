import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text } from 'react-native';

import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import PlanSelectionScreen from '../screens/PlanSelectionScreen';
import TermsAndConditionsScreen from '../screens/TermsAndConditionsScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AnalysisScreen from '../screens/AnalysisScreen';

export type RootStackParamList = {
  Login: { email?: string; password?: string } | undefined;
  Register: undefined;
  PlanSelection: undefined;
  TermsCondition: { selectedPlan: string };
  Dashboard: undefined;
  Analysis: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function LoadingScreen() {
  return (
    <SafeAreaView style={styles.loadingContainer}>
      <ActivityIndicator color="#0EA5E9" size="large" />
      <Text style={styles.loadingText}>Loading your session...</Text>
    </SafeAreaView>
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
      <Stack.Screen name="PlanSelection" component={PlanSelectionScreen} />
      <Stack.Screen name="TermsCondition" component={TermsAndConditionsScreen} />
      <Stack.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{
          gestureEnabled: false,
        }}
      />
      <Stack.Screen name="Analysis" component={AnalysisScreen} />
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
