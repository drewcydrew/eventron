import React, { createContext, useContext, useState, ReactNode } from "react";

// Define the structure for a ride in our theme park
export interface Ride {
  id: number;
  name: string;
  currentRiders: number;
  capacity: number;
  queueLength: number;
  totalRiders: number;
  isOpen: boolean;
  icon: string;
}

// Define the structure for our theme park data
export interface ThemeParkData {
  currentTime: number; // Minutes since 9am (0-540 for 9am to 6pm)
  totalVisitors: number;
  currentVisitors: number;
  rides: Ride[];
  steps: number;
  progress: number;
}

// Define the structure for our theme park configuration
export interface ThemeParkConfig {
  name: string;
  initialRides: Omit<Ride, "currentRiders" | "queueLength" | "totalRiders">[];
}

// Define the context structure
interface ThemeParkContextType {
  config: ThemeParkConfig;
  updateParkName: (name: string) => void;
  toggleRideStatus: (rideId: number) => void;
  resetConfig: () => void;
}

// Create the default configuration
const defaultConfig: ThemeParkConfig = {
  name: "Eventron Adventure Park",
  initialRides: [
    {
      id: 1,
      name: "Roller Coaster",
      capacity: 24,
      isOpen: true,
      icon: "🎢",
    },
    {
      id: 2,
      name: "Water Slide",
      capacity: 30,
      isOpen: true,
      icon: "💦",
    },
    {
      id: 3,
      name: "Ferris Wheel",
      capacity: 16,
      isOpen: true,
      icon: "🎡",
    },
  ],
};

// Create the context
const ThemeParkContext = createContext<ThemeParkContextType>({
  config: defaultConfig,
  updateParkName: () => {},
  toggleRideStatus: () => {},
  resetConfig: () => {},
});

// Create a provider component
export const ThemeParkProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [config, setConfig] = useState<ThemeParkConfig>(defaultConfig);

  // Function to update park name
  const updateParkName = (name: string) => {
    setConfig((prev) => ({ ...prev, name }));
  };

  // Function to toggle ride status
  const toggleRideStatus = (rideId: number) => {
    setConfig((prev) => ({
      ...prev,
      initialRides: prev.initialRides.map((ride) =>
        ride.id === rideId ? { ...ride, isOpen: !ride.isOpen } : ride
      ),
    }));
  };

  // Function to reset configuration to defaults
  const resetConfig = () => {
    setConfig(defaultConfig);
  };

  return (
    <ThemeParkContext.Provider
      value={{ config, updateParkName, toggleRideStatus, resetConfig }}
    >
      {children}
    </ThemeParkContext.Provider>
  );
};

// Custom hook to use the theme park context
export const useThemePark = () => useContext(ThemeParkContext);

// Helper function to create initial simulation data
export const createInitialSimData = (
  config: ThemeParkConfig
): ThemeParkData => {
  return {
    currentTime: 0,
    totalVisitors: 0,
    currentVisitors: 0,
    rides: config.initialRides.map((ride) => ({
      ...ride,
      currentRiders: 0,
      queueLength: 0,
      totalRiders: 0,
    })),
    steps: 0,
    progress: 0,
  };
};
