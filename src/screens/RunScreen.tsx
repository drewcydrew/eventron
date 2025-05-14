import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { useState, useRef, useEffect } from "react";

import SimulationControls from "../components/SimulationControls";
import SimulationDisplay from "../components/SimulationDisplay";
import SimulationList from "../components/SimulationList";
import {
  useThemePark,
  ThemeParkData,
  createInitialSimData,
} from "../context/ThemeParkContext";
import { useSavedSimulations } from "../context/SavedSimulationsContext";

// Main content component
const RunScreen = () => {
  const { config } = useThemePark();
  const { saveSimulation, loadSimulation, forceRefresh } =
    useSavedSimulations();

  // State for simulation
  const [simStatus, setSimStatus] = useState("idle"); // idle, running, paused, complete
  const [simData, setSimData] = useState<ThemeParkData>(() =>
    createInitialSimData(config)
  );
  const [showList, setShowList] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  // Force refresh saved simulations when viewing the list
  useEffect(() => {
    if (showList) {
      forceRefresh();
    }
  }, [showList]);

  // Reset simulation data when config changes
  useEffect(() => {
    if (simStatus === "idle") {
      setSimData(createInitialSimData(config));
    }
  }, [config, simStatus]);

  // Reference for the interval timer
  const simulationInterval = useRef<NodeJS.Timeout | null>(null);

  // Effect to handle the simulation progress
  useEffect(() => {
    if (simStatus === "running") {
      // Start the simulation interval
      simulationInterval.current = setInterval(() => {
        setSimData((prev) => {
          // Calculate new time (advance by 15 minutes each step)
          const newTime = prev.currentTime + 15;
          const progress = Math.min(100, (newTime / 540) * 100); // 540 mins = 9am to 6pm

          // Simulate visitor arrivals (more in the morning and midday)
          const timeOfDay = newTime / 60; // Hours since 9am
          let newVisitors = 0;

          // More visitors arrive in the morning and midday
          if (timeOfDay < 2) {
            // 9am-11am: ramp up
            newVisitors = Math.floor(Math.random() * 20) + 10;
          } else if (timeOfDay < 5) {
            // 11am-2pm: peak
            newVisitors = Math.floor(Math.random() * 30) + 20;
          } else if (timeOfDay < 8) {
            // 2pm-5pm: steady
            newVisitors = Math.floor(Math.random() * 15) + 5;
          } else {
            // 5pm-6pm: declining
            newVisitors = Math.floor(Math.random() * 5);
          }

          // Update rides (capacity cycles every step)
          const updatedRides = prev.rides.map((ride) => {
            // Skip closed rides
            if (!ride.isOpen) {
              return ride;
            }

            // Calculate how many people get off the ride
            const exitingRiders = ride.currentRiders;

            // Calculate how many people get on the ride
            const newRiders = Math.min(ride.capacity, ride.queueLength);

            // Calculate new queue length (some portion of new visitors join + remaining after people get on)
            // Only distribute visitors to open rides
            const openRidesCount =
              prev.rides.filter((r) => r.isOpen).length || 1;
            const newVisitorsToThisRide = Math.floor(
              (newVisitors / openRidesCount) * (0.8 + Math.random() * 0.4)
            );

            const newQueueLength = Math.max(
              0,
              ride.queueLength - newRiders + newVisitorsToThisRide
            );

            return {
              ...ride,
              currentRiders: newRiders,
              queueLength: newQueueLength,
              totalRiders: ride.totalRiders + exitingRiders,
            };
          });

          // Calculate how many people left the park (some portion of those who finished rides)
          const exitingVisitors =
            updatedRides.reduce((sum, ride) => sum + ride.currentRiders, 0) / 2;

          // Calculate new total visitors in park
          const newCurrentVisitors = Math.max(
            0,
            prev.currentVisitors + newVisitors - exitingVisitors
          );

          // Check if we've reached 6pm and should complete the simulation
          if (newTime >= 540) {
            // 9 hours (540 minutes) = 6pm
            if (simulationInterval.current) {
              clearInterval(simulationInterval.current);
            }
            setSimStatus("complete");
            setHasSaved(false); // Reset saved flag when simulation completes
            return {
              ...prev,
              currentTime: 540, // Cap at 6pm
              totalVisitors: prev.totalVisitors + newVisitors,
              currentVisitors: 0, // Everyone leaves at closing
              rides: updatedRides.map((ride) => ({
                ...ride,
                currentRiders: 0,
                queueLength: 0,
              })),
              steps: prev.steps + 1,
              progress: 100,
            };
          }

          return {
            ...prev,
            currentTime: newTime,
            totalVisitors: prev.totalVisitors + newVisitors,
            currentVisitors: newCurrentVisitors,
            rides: updatedRides,
            steps: prev.steps + 1,
            progress,
          };
        });
      }, 1000); // Update every second for a faster simulation
    } else if (simulationInterval.current) {
      // Clear interval if not running
      clearInterval(simulationInterval.current);
    }

    // Cleanup on unmount
    return () => {
      if (simulationInterval.current) {
        clearInterval(simulationInterval.current);
      }
    };
  }, [simStatus]);

  // Functions to control simulation
  const startSimulation = () => {
    setSimStatus("running");
  };

  const stopSimulation = () => {
    setSimStatus("paused");
  };

  const resetSimulation = () => {
    setSimStatus("idle");
    setSimData(createInitialSimData(config));
    setHasSaved(false);
  };

  // Function to save the current simulation
  const handleSaveSimulation = async () => {
    await saveSimulation(config.name, simData);
    setHasSaved(true);
    setShowList(true); // Show list after saving
  };

  // Function to load a saved simulation
  const handleSelectSimulation = (id: string) => {
    const loadedSim = loadSimulation(id);
    if (loadedSim) {
      setSimStatus("complete"); // Set to complete since we're loading a completed simulation
      setSimData(loadedSim.data);
      setHasSaved(true); // Mark as saved since it came from saved simulations
      setShowList(false); // Hide list after loading
    }
  };

  return (
    <View style={styles.container}>
      {!showList ? (
        // Show simulation display and controls
        <>
          <SimulationDisplay status={simStatus} data={simData} />
          <SimulationControls
            status={simStatus}
            onStart={startSimulation}
            onStop={stopSimulation}
            onReset={resetSimulation}
            onSave={handleSaveSimulation}
            canSave={simStatus === "complete" && !hasSaved}
          />
          <View style={styles.toggleButtonContainer}>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setShowList(true)}
            >
              <Text style={styles.toggleButtonText}>
                View Saved Simulations
              </Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        // Show list of saved simulations
        <>
          <SimulationList onSelectSimulation={handleSelectSimulation} />
          <View style={styles.toggleButtonContainer}>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setShowList(false)}
            >
              <Text style={styles.toggleButtonText}>Back to Simulation</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  toggleButtonContainer: {
    width: "100%",
    padding: 10,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  toggleButton: {
    backgroundColor: "#673ab7",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  toggleButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default RunScreen;
