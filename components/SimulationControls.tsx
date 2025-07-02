import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useSimulation } from "../contexts/SimulationContext";

export const SimulationControls: React.FC = () => {
  const {
    people,
    isSimulating,
    simulationComplete,
    speed,
    boxStatus,
    startingTravelers,
    startingBoxes,
    startSimulation,
    stopSimulation,
    resetSimulation,
    addTraveler,
    setSpeed,
    setStartingTravelers,
    setStartingBoxes,
  } = useSimulation();

  // Force component updates during simulation for real-time status
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  React.useEffect(() => {
    if (isSimulating) {
      const interval = setInterval(forceUpdate, 200); // Update status every 200ms
      return () => clearInterval(interval);
    }
  }, [isSimulating]);

  const getStatusText = () => {
    if (people.length === 0) {
      if (simulationComplete) {
        return `Simulation Complete! All ${boxStatus.totalProcessed} boxes processed.`;
      }
      return "No travelers";
    }
    const movingToB1 = people.filter((p) => p.stage === "movingToB1").length;
    const movingToB2 = people.filter((p) => p.stage === "movingToB2").length;
    const processingB1 = people.filter(
      (p) => p.stage === "processingAtB1"
    ).length;
    const processingB2 = people.filter(
      (p) => p.stage === "processingAtB2"
    ).length;
    const waitingB1 = people.filter((p) => p.stage === "waitingAtB1").length;
    const waitingB2 = people.filter((p) => p.stage === "waitingAtB2").length;
    const returning = people.filter((p) => p.stage === "returningToA").length;
    const idle = people.filter((p) => p.stage === "idle").length;

    return `${people.length} travelers - Boxes at C: ${boxStatus.availableBoxes}, Processed: ${boxStatus.totalProcessed}/${startingBoxes} | Idle: ${idle}, To B1: ${movingToB1}, To B2: ${movingToB2}, B1 Queue: ${waitingB1}, B1 Proc: ${processingB1}, B2 Queue: ${waitingB2}, B2 Proc: ${processingB2}, Returning: ${returning}`;
  };

  const speedOptions = [0.25, 0.5, 1, 2, 4]; // Better simulation speed options

  return (
    <View style={styles.container}>
      <Text style={styles.status}>Status: {getStatusText()}</Text>
      {isSimulating && !simulationComplete && (
        <Text style={styles.simulationStatus}>
          🏃 Simulation Running at {speed}x speed
        </Text>
      )}
      {simulationComplete && (
        <Text style={styles.completedStatus}>
          ✅ Simulation Completed Successfully!
        </Text>
      )}

      {/* Configuration Controls */}
      {!isSimulating && (
        <View style={styles.configSection}>
          <Text style={styles.configTitle}>Simulation Configuration</Text>

          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Starting Travelers:</Text>
            <View style={styles.numberControls}>
              <TouchableOpacity
                style={styles.numberButton}
                onPress={() =>
                  setStartingTravelers(Math.max(1, startingTravelers - 1))
                }
              >
                <Text style={styles.numberButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.numberDisplay}>{startingTravelers}</Text>
              <TouchableOpacity
                style={styles.numberButton}
                onPress={() =>
                  setStartingTravelers(Math.min(10, startingTravelers + 1))
                }
              >
                <Text style={styles.numberButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.configRow}>
            <Text style={styles.configLabel}>Starting Boxes:</Text>
            <View style={styles.numberControls}>
              <TouchableOpacity
                style={styles.numberButton}
                onPress={() => setStartingBoxes(Math.max(1, startingBoxes - 1))}
              >
                <Text style={styles.numberButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.numberDisplay}>{startingBoxes}</Text>
              <TouchableOpacity
                style={styles.numberButton}
                onPress={() =>
                  setStartingBoxes(Math.min(20, startingBoxes + 1))
                }
              >
                <Text style={styles.numberButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Speed Control */}
      <View style={styles.speedControl}>
        <Text style={styles.speedLabel}>
          Simulation Speed: {speed.toFixed(2)}x
        </Text>
        <View style={styles.speedButtons}>
          {speedOptions.map((speedOption) => (
            <TouchableOpacity
              key={speedOption}
              style={[
                styles.speedButton,
                speed === speedOption && styles.activeSpeedButton,
              ]}
              onPress={() => setSpeed(speedOption)}
            >
              <Text
                style={[
                  styles.speedButtonText,
                  speed === speedOption && styles.activeSpeedButtonText,
                ]}
              >
                {speedOption}x
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Main Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, styles.addButton]}
          onPress={addTraveler}
        >
          <Text style={styles.buttonText}>Add Traveler</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.startButton]}
          onPress={startSimulation}
          disabled={isSimulating}
        >
          <Text style={styles.buttonText}>Start</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.stopButton]}
          onPress={stopSimulation}
          disabled={!isSimulating}
        >
          <Text style={styles.buttonText}>Stop</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.resetButton]}
          onPress={resetSimulation}
        >
          <Text style={styles.buttonText}>Reset</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 180,
    justifyContent: "space-between",
    paddingVertical: 10,
    marginBottom: 10,
  },
  status: {
    textAlign: "center",
    fontSize: 16,
    marginTop: 10,
  },
  simulationStatus: {
    textAlign: "center",
    fontSize: 14,
    color: "#34C759",
    fontWeight: "500",
    marginTop: 5,
  },
  completedStatus: {
    textAlign: "center",
    fontSize: 14,
    color: "#34C759",
    fontWeight: "bold",
    marginTop: 5,
  },
  configSection: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: 8,
    padding: 15,
    marginVertical: 10,
  },
  configTitle: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  configRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  configLabel: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  numberControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  numberButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  numberButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  numberDisplay: {
    fontSize: 16,
    fontWeight: "bold",
    minWidth: 30,
    textAlign: "center",
  },
  speedControl: {
    alignItems: "center",
    marginTop: 15,
    paddingHorizontal: 20,
  },
  speedLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 10,
  },
  speedButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 10,
  },
  speedButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#E5E5E5",
    minWidth: 40,
    alignItems: "center",
  },
  activeSpeedButton: {
    backgroundColor: "#007AFF",
  },
  speedButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#333",
  },
  activeSpeedButtonText: {
    color: "white",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
    paddingHorizontal: 10,
    flexWrap: "wrap",
    gap: 10,
  },
  button: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 70,
    alignItems: "center",
  },
  addButton: {
    backgroundColor: "#5856D6",
  },
  startButton: {
    backgroundColor: "#34C759",
  },
  stopButton: {
    backgroundColor: "#FF9500",
  },
  resetButton: {
    backgroundColor: "#FF3B30",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
