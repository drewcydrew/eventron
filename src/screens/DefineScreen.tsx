import React from "react";
import { StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import SimulationList from "../components/SimulationList";
import { useSavedSimulations } from "../context/SavedSimulationsContext";

const DefineScreen = () => {
  const { forceRefresh } = useSavedSimulations();

  // Force a refresh EVERY time the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log("DefineScreen focused - refreshing simulations");
      forceRefresh();

      // Optional: return cleanup function
      return () => {};
    }, [])
  );

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
