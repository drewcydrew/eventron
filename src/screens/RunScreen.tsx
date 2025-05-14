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
  const { saveSimulation, loadSimulation, forceRefresh, savedSimulations } =
    useSavedSimulations();

  const [simStatus, setSimStatus] = useState("idle");
  const [simData, setSimData] = useState<ThemeParkData>(() =>
    createInitialSimData(config)
  );
  const [showList, setShowList] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  const simulationInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (showList) {
      forceRefresh();
    }
  }, [showList]);

  useEffect(() => {
    if (simStatus === "idle") {
      setSimData(createInitialSimData(config));
    }
  }, [config, simStatus]);

  useEffect(() => {
    if (simStatus === "running") {
      simulationInterval.current = setInterval(() => {
        setSimData((prev) => {
          const newTime = prev.currentTime + 15;
          const progress = Math.min(100, (newTime / 540) * 100);

          const timeOfDay = newTime / 60;
          let newVisitors = 0;
          if (timeOfDay < 2) newVisitors = Math.floor(Math.random() * 20) + 10;
          else if (timeOfDay < 5)
            newVisitors = Math.floor(Math.random() * 30) + 20;
          else if (timeOfDay < 8)
            newVisitors = Math.floor(Math.random() * 15) + 5;
          else newVisitors = Math.floor(Math.random() * 5);

          const updatedRides = prev.rides.map((ride) => {
            if (!ride.isOpen) return ride;

            const exitingRiders = ride.currentRiders;
            const newRiders = Math.min(ride.capacity, ride.queueLength);
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

          const exitingVisitors =
            updatedRides.reduce((sum, ride) => sum + ride.currentRiders, 0) / 2;

          const newCurrentVisitors = Math.max(
            0,
            prev.currentVisitors + newVisitors - exitingVisitors
          );

          if (newTime >= 540) {
            if (simulationInterval.current)
              clearInterval(simulationInterval.current);
            setSimStatus("complete");
            setHasSaved(false);
            return {
              ...prev,
              currentTime: 540,
              totalVisitors: prev.totalVisitors + newVisitors,
              currentVisitors: 0,
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
      }, 1000);
    } else if (simulationInterval.current) {
      clearInterval(simulationInterval.current);
    }

    return () => {
      if (simulationInterval.current) clearInterval(simulationInterval.current);
    };
  }, [simStatus]);

  const startSimulation = () => setSimStatus("running");
  const stopSimulation = () => setSimStatus("paused");
  const resetSimulation = () => {
    setSimStatus("idle");
    setSimData(createInitialSimData(config));
    setHasSaved(false);
  };

  const handleSaveSimulation = async () => {
    console.log("===== SAVING SIMULATION =====");
    console.log("Park Name:", config.name);
    console.log("Total Visitors:", simData.totalVisitors);
    console.log(
      "Total Rides:",
      simData.rides.reduce((sum, ride) => sum + ride.totalRiders, 0)
    );
    console.log("Rides:", simData.rides.length);

    try {
      await saveSimulation(config.name, simData);
      await forceRefresh(); // Ensure context is up-to-date
      console.log("✓ Simulation saved successfully!");
      console.log("Storage now has", savedSimulations.length, "simulations");
      console.log("Latest simulation ID:", savedSimulations[0]?.id);

      setHasSaved(true);
      setShowList(true);
    } catch (error) {
      console.error("❌ ERROR saving simulation:", error);
    }
  };

  const handleSelectSimulation = (id: string) => {
    const loadedSim = loadSimulation(id);
    if (loadedSim) {
      setSimStatus("complete");
      setSimData(loadedSim.data);
      setHasSaved(true);
      setShowList(false);
    }
  };

  return (
    <View style={styles.container}>
      {!showList ? (
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
