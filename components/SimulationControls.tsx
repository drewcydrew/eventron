import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useSimulation } from "../contexts/SimulationContext";

export const SimulationControls: React.FC = () => {
  const {
    people,
    processingStations,
    isSimulating,
    simulationComplete,
    boxStatus,
    startingTravelers,
    startingBoxes,
    startingStations,
    setStartingTravelers,
    setStartingBoxes,
    setStartingStations,
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
    if (simulationComplete) {
      return `🎉 Simulation Complete! All ${boxStatus.totalProcessed} boxes processed and all travelers returned to A.`;
    }

    if (people.length === 0 && !isSimulating) {
      return "No travelers - ready to start simulation";
    }

    // Build dynamic status for all stations
    const stationStats = processingStations
      .map((station) => {
        const movingTo = people.filter(
          (p) => p.stage === `movingTo${station.id}`
        ).length;
        const processing = people.filter(
          (p) => p.stage === `processingAt${station.id}`
        ).length;
        const waiting = people.filter(
          (p) => p.stage === `waitingAt${station.id}`
        ).length;
        return `${station.id}: Moving:${movingTo} Queue:${waiting} Proc:${processing}`;
      })
      .join(", ");

    const idle = people.filter((p) => p.stage === "idle").length;
    const movingToC = people.filter((p) => p.stage === "movingToC").length;
    const returningToC = people.filter(
      (p) => p.stage === "returningToC"
    ).length;
    const collecting = people.filter((p) => p.stage === "collectingAtC").length;
    const returningToA = people.filter(
      (p) => p.stage === "returningToA"
    ).length;

    return `${people.length} travelers - Boxes at C: ${boxStatus.availableBoxes}, Processed: ${boxStatus.totalProcessed}/${startingBoxes} | Idle: ${idle}, To C: ${movingToC}, Ret to C: ${returningToC}, Collecting: ${collecting}, ${stationStats}, To A: ${returningToA}`;
  };

  return (
    <View style={styles.container}>
      {/* Status Display */}
      <View style={styles.statusSection}>
        <Text style={styles.sectionTitle}>Simulation Status</Text>
        <Text style={styles.status}>{getStatusText()}</Text>
        {isSimulating && !simulationComplete && (
          <Text style={styles.simulationStatus}>🏃 Simulation Running</Text>
        )}
        {simulationComplete && (
          <Text style={styles.completedStatus}>
            ✅ Simulation Completed Successfully!
          </Text>
        )}
      </View>

      {/* Configuration Controls */}
      <View style={styles.configSection}>
        <Text style={styles.sectionTitle}>Initial Configuration</Text>
        <Text style={styles.configNote}>
          {isSimulating
            ? "Configuration locked during simulation"
            : "Adjust settings before starting simulation"}
        </Text>

        <View style={styles.configRow}>
          <Text style={styles.configLabel}>Starting Travelers:</Text>
          <View style={styles.numberControls}>
            <TouchableOpacity
              style={[
                styles.numberButton,
                isSimulating && styles.disabledButton,
              ]}
              onPress={() =>
                !isSimulating &&
                setStartingTravelers(Math.max(1, startingTravelers - 1))
              }
              disabled={isSimulating}
            >
              <Text
                style={[
                  styles.numberButtonText,
                  isSimulating && styles.disabledText,
                ]}
              >
                -
              </Text>
            </TouchableOpacity>
            <Text style={styles.numberDisplay}>{startingTravelers}</Text>
            <TouchableOpacity
              style={[
                styles.numberButton,
                isSimulating && styles.disabledButton,
              ]}
              onPress={() =>
                !isSimulating &&
                setStartingTravelers(Math.min(10, startingTravelers + 1))
              }
              disabled={isSimulating}
            >
              <Text
                style={[
                  styles.numberButtonText,
                  isSimulating && styles.disabledText,
                ]}
              >
                +
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.configRow}>
          <Text style={styles.configLabel}>Starting Boxes:</Text>
          <View style={styles.numberControls}>
            <TouchableOpacity
              style={[
                styles.numberButton,
                isSimulating && styles.disabledButton,
              ]}
              onPress={() =>
                !isSimulating &&
                setStartingBoxes(Math.max(1, startingBoxes - 1))
              }
              disabled={isSimulating}
            >
              <Text
                style={[
                  styles.numberButtonText,
                  isSimulating && styles.disabledText,
                ]}
              >
                -
              </Text>
            </TouchableOpacity>
            <Text style={styles.numberDisplay}>{startingBoxes}</Text>
            <TouchableOpacity
              style={[
                styles.numberButton,
                isSimulating && styles.disabledButton,
              ]}
              onPress={() =>
                !isSimulating &&
                setStartingBoxes(Math.min(20, startingBoxes + 1))
              }
              disabled={isSimulating}
            >
              <Text
                style={[
                  styles.numberButtonText,
                  isSimulating && styles.disabledText,
                ]}
              >
                +
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.configRow}>
          <Text style={styles.configLabel}>Processing Stations:</Text>
          <View style={styles.numberControls}>
            <TouchableOpacity
              style={[
                styles.numberButton,
                isSimulating && styles.disabledButton,
              ]}
              onPress={() =>
                !isSimulating &&
                setStartingStations(Math.max(1, startingStations - 1))
              }
              disabled={isSimulating}
            >
              <Text
                style={[
                  styles.numberButtonText,
                  isSimulating && styles.disabledText,
                ]}
              >
                -
              </Text>
            </TouchableOpacity>
            <Text style={styles.numberDisplay}>{startingStations}</Text>
            <TouchableOpacity
              style={[
                styles.numberButton,
                isSimulating && styles.disabledButton,
              ]}
              onPress={() =>
                !isSimulating &&
                setStartingStations(Math.min(8, startingStations + 1))
              }
              disabled={isSimulating}
            >
              <Text
                style={[
                  styles.numberButtonText,
                  isSimulating && styles.disabledText,
                ]}
              >
                +
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsSection}>
        <Text style={styles.sectionTitle}>Instructions</Text>
        <Text style={styles.instructionText}>
          • Configure initial settings above{"\n"}• Use controls at bottom to
          manage simulation{"\n"}• Switch to Simulation tab to view animation
          {"\n"}• Switch to Timeline tab to see activity charts{"\n"}• Drag
          locations and stations when simulation is stopped
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  statusSection: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  status: {
    fontSize: 14,
    lineHeight: 20,
    color: "#666",
  },
  simulationStatus: {
    fontSize: 14,
    color: "#34C759",
    fontWeight: "500",
    marginTop: 8,
  },
  completedStatus: {
    fontSize: 14,
    color: "#34C759",
    fontWeight: "bold",
    marginTop: 8,
  },
  configSection: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  configNote: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    marginBottom: 15,
  },
  configRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  configLabel: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
    color: "#333",
  },
  numberControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  numberButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#C7C7CC",
  },
  numberButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledText: {
    color: "#8E8E93",
  },
  numberDisplay: {
    fontSize: 16,
    fontWeight: "bold",
    minWidth: 32,
    textAlign: "center",
    color: "#333",
  },
  instructionsSection: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#666",
  },
});
