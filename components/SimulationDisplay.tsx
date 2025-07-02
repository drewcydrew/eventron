import React from "react";
import { StyleSheet, Text, View, PanResponder } from "react-native";
import { useSimulation } from "../contexts/SimulationContext";

export const SimulationDisplay: React.FC = () => {
  const {
    people,
    locationA,
    locationC,
    locationB1,
    locationB2,
    isSimulating,
    simulationTime,
    boxStatus,
    updateLocationA,
    updateLocationC,
    updateLocationB1,
    updateLocationB2,
  } = useSimulation();

  const panResponderA = PanResponder.create({
    onStartShouldSetPanResponder: () => !isSimulating,
    onMoveShouldSetPanResponder: () => !isSimulating,
    onPanResponderGrant: () => {},
    onPanResponderMove: (evt, gestureState) => {
      if (!isSimulating) {
        const newX = locationA.x + gestureState.dx;
        const newY = locationA.y + gestureState.dy;
        updateLocationA(newX, newY);
      }
    },
    onPanResponderRelease: () => {},
  });

  const panResponderC = PanResponder.create({
    onStartShouldSetPanResponder: () => !isSimulating,
    onMoveShouldSetPanResponder: () => !isSimulating,
    onPanResponderGrant: () => {},
    onPanResponderMove: (evt, gestureState) => {
      if (!isSimulating) {
        const newX = locationC.x + gestureState.dx;
        const newY = locationC.y + gestureState.dy;
        updateLocationC(newX, newY);
      }
    },
    onPanResponderRelease: () => {},
  });

  const panResponderB1 = PanResponder.create({
    onStartShouldSetPanResponder: () => !isSimulating,
    onMoveShouldSetPanResponder: () => !isSimulating,
    onPanResponderGrant: () => {},
    onPanResponderMove: (evt, gestureState) => {
      if (!isSimulating) {
        const newX = locationB1.x + gestureState.dx;
        const newY = locationB1.y + gestureState.dy;
        updateLocationB1(newX, newY);
      }
    },
    onPanResponderRelease: () => {},
  });

  const panResponderB2 = PanResponder.create({
    onStartShouldSetPanResponder: () => !isSimulating,
    onMoveShouldSetPanResponder: () => !isSimulating,
    onPanResponderGrant: () => {},
    onPanResponderMove: (evt, gestureState) => {
      if (!isSimulating) {
        const newX = locationB2.x + gestureState.dx;
        const newY = locationB2.y + gestureState.dy;
        updateLocationB2(newX, newY);
      }
    },
    onPanResponderRelease: () => {},
  });

  const formatSimulationTime = (time: number) => {
    const seconds = Math.floor(time / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  console.log(
    `Rendering SimulationDisplay - Time: ${simulationTime}, People:`,
    people.map((p) => `T${p.id}:(${p.x.toFixed(1)},${p.y.toFixed(1)})`)
  );

  return (
    <View style={styles.simulationArea}>
      {/* Simulation Time Display */}
      <View style={styles.timeDisplay}>
        <Text style={styles.timeText}>
          Time: {formatSimulationTime(simulationTime)}
        </Text>
      </View>

      {/* Location A marker */}
      <View
        style={[
          styles.location,
          { left: locationA.x, top: locationA.y },
          !isSimulating && styles.draggable,
        ]}
        {...panResponderA.panHandlers}
      >
        <Text style={styles.locationText}>A</Text>
      </View>

      {/* Location C marker */}
      <View
        style={[
          styles.location,
          { left: locationC.x, top: locationC.y },
          !isSimulating && styles.draggable,
          styles.locationC,
        ]}
        {...panResponderC.panHandlers}
      >
        <Text style={styles.locationText}>C</Text>
      </View>

      {/* Box count display for location C */}
      <View
        style={[
          styles.boxCounter,
          {
            left: locationC.x - 10,
            top: locationC.y + 35,
          },
        ]}
      >
        <Text style={styles.boxCountText}>📦 {boxStatus.availableBoxes}</Text>
      </View>

      {/* Location B1 marker */}
      <View
        style={[
          styles.location,
          { left: locationB1.x, top: locationB1.y },
          !isSimulating && styles.draggable,
        ]}
        {...panResponderB1.panHandlers}
      >
        <Text style={styles.locationText}>B1</Text>
      </View>

      {/* Location B2 marker */}
      <View
        style={[
          styles.location,
          { left: locationB2.x, top: locationB2.y },
          !isSimulating && styles.draggable,
        ]}
        {...panResponderB2.panHandlers}
      >
        <Text style={styles.locationText}>B2</Text>
      </View>

      {/* People with names - different colors for different stages */}
      {people.map((person) => (
        <View key={`person-${person.id}`}>
          {/* Person circle */}
          <View
            style={[
              styles.person,
              { left: person.x, top: person.y },
              person.stage === "collectingAtC" && styles.collecting,
              (person.stage === "processingAtB1" ||
                person.stage === "processingAtB2") &&
                styles.processing,
              (person.stage === "waitingAtB1" ||
                person.stage === "waitingAtB2") &&
                styles.waiting,
              person.hasBox && styles.hasBox,
            ]}
          />
          {/* Person name above */}
          <Text
            style={[
              styles.personName,
              {
                left: person.x - 15,
                top: person.y - 20,
              },
            ]}
          >
            T{person.id}
            {person.hasBox ? "📦" : ""}
          </Text>
        </View>
      ))}

      {/* Debug info */}
      <View style={styles.debugInfo}>
        <Text style={styles.debugText}>
          Time: {simulationTime.toFixed(0)}ms | People: {people.length}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  simulationArea: {
    height: 300,
    backgroundColor: "#fff",
    borderRadius: 10,
    position: "relative",
    margin: 10,
  },
  timeDisplay: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 1000,
  },
  timeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
  },
  person: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#007AFF",
  },
  processing: {
    backgroundColor: "#FF9500",
  },
  waiting: {
    backgroundColor: "#FF6B6B", // Red color for waiting
  },
  personName: {
    position: "absolute",
    fontSize: 10,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    width: 50,
    zIndex: 999,
  },
  location: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
  },
  draggable: {},
  locationText: {
    color: "white",
    fontWeight: "bold",
  },
  debugInfo: {
    position: "absolute",
    bottom: 10,
    left: 10,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  debugText: {
    fontSize: 10,
    color: "#666",
  },
  locationC: {
    backgroundColor: "#32D74B", // Green color for collection point
  },
  collecting: {
    backgroundColor: "#32D74B", // Green for collecting
  },
  hasBox: {
    borderWidth: 2,
    borderColor: "#8B4513", // Brown border when carrying box
  },
  boxCounter: {
    position: "absolute",
    backgroundColor: "rgba(50, 215, 75, 0.9)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignItems: "center",
    minWidth: 40,
  },
  boxCountText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
});
