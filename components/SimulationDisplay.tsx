import React from "react";
import { StyleSheet, Text, View, PanResponder } from "react-native";
import { useSimulation } from "../contexts/SimulationContext";

export const SimulationDisplay: React.FC = () => {
  const {
    people,
    locationA,
    locationC,
    processingStations,
    isSimulating,
    simulationTime,
    boxStatus,
    updateLocationA,
    updateLocationC,
    updateProcessingStationLocation,
  } = useSimulation();

  // Get station states from the engine
  const [stationStates, setStationStates] = React.useState<Map<string, any>>(
    new Map()
  );

  React.useEffect(() => {
    // This would ideally come from the simulation context
    // For now, we'll derive state from people data
    const newStates = new Map();

    processingStations.forEach((station) => {
      // Check if any traveler is processing at this station
      const processingTraveler = people.find(
        (p) => p.stage === `processingAt${station.id}`
      );
      // Check if any traveler is moving to this station (claimed)
      const claimedTraveler = people.find(
        (p) => p.stage === `movingTo${station.id}`
      );

      if (processingTraveler) {
        newStates.set(station.id, "active");
      } else if (claimedTraveler) {
        newStates.set(station.id, "claimed");
      } else {
        newStates.set(station.id, "available");
      }
    });

    setStationStates(newStates);
  }, [people, processingStations]);

  const getStationStyle = (stationId: string) => {
    const state = stationStates.get(stationId) || "available";
    switch (state) {
      case "available":
        return styles.stationAvailable;
      case "claimed":
        return styles.stationClaimed;
      case "active":
        return styles.stationActive;
      default:
        return styles.stationAvailable;
    }
  };

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

  // Create pan responders for processing stations
  const createStationPanResponder = (stationId: string) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => !isSimulating,
      onMoveShouldSetPanResponder: () => !isSimulating,
      onPanResponderGrant: () => {},
      onPanResponderMove: (evt, gestureState) => {
        if (!isSimulating) {
          const station = processingStations.find((s) => s.id === stationId);
          if (station) {
            const newX = station.x + gestureState.dx;
            const newY = station.y + gestureState.dy;
            updateProcessingStationLocation(stationId, newX, newY);
          }
        }
      },
      onPanResponderRelease: () => {},
    });
  };

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

      {/* Dynamic Processing Stations */}
      {processingStations.map((station) => (
        <View
          key={station.id}
          style={[
            styles.location,
            { left: station.x, top: station.y },
            !isSimulating && styles.draggable,
            styles.processingStation,
            getStationStyle(station.id),
          ]}
          {...createStationPanResponder(station.id).panHandlers}
        >
          <Text style={styles.locationText}>{station.id}</Text>
        </View>
      ))}

      {/* People with names - different colors for different stages */}
      {people.map((person) => (
        <View key={`person-${person.id}`}>
          {/* Person circle */}
          <View
            style={[
              styles.person,
              { left: person.x, top: person.y },
              person.stage === "collectingAtC" && styles.collecting,
              person.stage.startsWith("processingAt") && styles.processing,
              person.stage.startsWith("waitingAt") && styles.waiting,
              person.stage === "completed" && styles.completed,
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
            {person.stage === "completed" ? "✅" : ""}
          </Text>
        </View>
      ))}

      {/* Debug info */}
      <View style={styles.debugInfo}>
        <Text style={styles.debugText}>
          Boxes Remaining: {boxStatus.availableBoxes} | People: {people.length}{" "}
          | Stations: {processingStations.length}
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
  processingStation: {
    backgroundColor: "#FF9500", // Default orange for processing stations
  },
  stationAvailable: {
    backgroundColor: "#34C759", // Green for available
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  stationClaimed: {
    backgroundColor: "#FF9500", // Orange for claimed
    borderWidth: 2,
    borderColor: "#FFD60A",
  },
  stationActive: {
    backgroundColor: "#FF3B30", // Red for active
    borderWidth: 2,
    borderColor: "#FF6B6B",
  },
  completed: {
    backgroundColor: "#34C759", // Green for completed
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
});
