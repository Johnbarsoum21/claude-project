import "react-native-gesture-handler";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts, DMSans_500Medium, DMSans_700Bold, DMSans_800ExtraBold } from "@expo-google-fonts/dm-sans";
import RootNavigator from "@/navigation/RootNavigator";

export default function App() {
  const [fontsLoaded] = useFonts({ DMSans_500Medium, DMSans_700Bold, DMSans_800ExtraBold });

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
