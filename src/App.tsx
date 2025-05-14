import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SavedSimulationsProvider } from "./context/SavedSimulationsContext";
import { ThemeParkProvider } from "./context/ThemeParkContext";
import RunScreen from "./screens/RunScreen";
import DefineScreen from "./screens/DefineScreen";
// Import other screens as needed

const Tab = createBottomTabNavigator();

const AppContent = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Run" component={RunScreenWrapper} />
        <Tab.Screen name="Define" component={DefineScreen} />
        {/* Add other screens as needed */}
      </Tab.Navigator>
    </NavigationContainer>
  );
};

// Custom wrapper for RunScreen that provides ThemeParkProvider
const RunScreenWrapper = () => {
  return (
    <ThemeParkProvider>
      <RunScreen />
    </ThemeParkProvider>
  );
};

export default function App() {
  return (
    <SavedSimulationsProvider>
      <AppContent />
    </SavedSimulationsProvider>
  );
}
