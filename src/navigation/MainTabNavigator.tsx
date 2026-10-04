import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Home, Sparkles, Users, GraduationCap } from "lucide-react-native";
import { colors } from "@/theme/theme";
import HomeScreen from "@/screens/home/HomeScreen";
import AiChatScreen from "@/screens/ai/AiChatScreen";
import SocialScreen from "@/screens/social/SocialScreen";
import LearnScreen from "@/screens/learn/LearnScreen";

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDim,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }} />
      <Tab.Screen name="AI" component={AiChatScreen} options={{ tabBarIcon: ({ color, size }) => <Sparkles color={color} size={size} /> }} />
      <Tab.Screen name="Social" component={SocialScreen} options={{ tabBarIcon: ({ color, size }) => <Users color={color} size={size} /> }} />
      <Tab.Screen name="Learn" component={LearnScreen} options={{ tabBarIcon: ({ color, size }) => <GraduationCap color={color} size={size} /> }} />
    </Tab.Navigator>
  );
}
