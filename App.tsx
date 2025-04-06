import "react-native-gesture-handler";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import BlankScreen from "./src/screens/DefineScreen";
import SecondScreen from "./src/screens/RunScreen";

export type TabParamList = {
  Define: undefined;
  Run: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: "#333333",
          tabBarInactiveTintColor: "#666666",
          tabBarStyle: {
            borderTopColor: "rgba(0, 0, 0, 0.1)",
            borderTopWidth: 0.5,
          },
        }}
      >
        <Tab.Screen
          name="Define"
          component={BlankScreen}
          options={{
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="build-outline" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Run"
          component={SecondScreen}
          options={({ navigation, route }) => ({
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bar-chart-outline" size={size} color={color} />
            ),
          })}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
