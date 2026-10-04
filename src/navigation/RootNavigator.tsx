import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import { useAppStore } from "@/store/useAppStore";
import { colors } from "@/theme/theme";
import AuthScreen from "@/screens/AuthScreen";
import OnboardingNavigator from "@/navigation/OnboardingNavigator";
import MainTabNavigator from "@/navigation/MainTabNavigator";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { init, loading, userId, profile } = useAppStore();

  useEffect(() => {
    init();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!userId ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : !profile?.onboarding_completed ? (
          <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
        ) : (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
