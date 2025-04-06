import React from "react";
import { createRef } from "react";
import { NavigationContainerRef } from "@react-navigation/native";

type RootStackParamList = {
  ScreenOne: undefined;
  ScreenTwo: undefined;
};

// Create a ref for navigation
export const navigationRef =
  createRef<NavigationContainerRef<RootStackParamList>>();

// Navigation service for accessing navigation outside of components
export const navigationService = {
  navigate: (name: keyof RootStackParamList, params?: any) => {
    if (navigationRef.current) {
      navigationRef.current.navigate(name, params);
    }
  },

  // You can add other navigation methods here as needed
  goBack: () => {
    if (navigationRef.current) {
      navigationRef.current.goBack();
    }
  },

  reset: (state: any) => {
    if (navigationRef.current) {
      navigationRef.current.reset(state);
    }
  },
};
