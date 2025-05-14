import React, { useEffect } from "react";
import { StyleSheet, View, Text } from "react-native";
import SimulationList from "../components/SimulationList";
import { useSavedSimulations } from "../context/SavedSimulationsContext";

const DefineScreen = () => {
  const { forceRefresh } = useSavedSimulations();

  // Force a refresh when the screen is focused
  useEffect(() => {
    // Refresh saved simulations data when component mounts
    forceRefresh();
  }, []);

  return (
    <View style={styles.container}>
      <SimulationList
        onSelectSimulation={(id) => {
          // Handle simulation selection (e.g., navigation or state update)
          console.log(`Selected simulation with ID: ${id}`);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});

export default DefineScreen;
