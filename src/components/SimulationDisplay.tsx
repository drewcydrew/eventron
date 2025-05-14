import { StyleSheet, Text, View, Animated, ScrollView } from "react-native";
import { useRef, useEffect } from "react";
import { useThemePark, ThemeParkData } from "../context/ThemeParkContext";

// Define interface for component props
interface SimulationDisplayProps {
  status: string;
  data: ThemeParkData;
}

// Helper function to format time (minutes since 9am to clock time)
const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60) + 9; // Add 9 for 9am start
  const mins = minutes % 60;
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours > 12 ? hours - 12 : hours;
  return `${displayHours}:${mins.toString().padStart(2, "0")} ${ampm}`;
};

const SimulationDisplay = ({ status, data }: SimulationDisplayProps) => {
  const { config } = useThemePark();
  const progressAnimation = useRef(new Animated.Value(0)).current;

  // Update animation when data changes
  useEffect(() => {
    Animated.timing(progressAnimation, {
      toValue: data.progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [data.progress]);

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.container}>
        <Text style={styles.parkName}>{config.name}</Text>
        <Text style={styles.title}>Theme Park Simulation</Text>

        {/* Time Display */}
        <View style={styles.timeContainer}>
          <Text style={styles.timeLabel}>Current Time:</Text>
          <Text style={styles.timeValue}>{formatTime(data.currentTime)}</Text>
        </View>

        {/* Status Display */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Status:</Text>
          <Text
            style={[
              styles.statusValue,
              status === "running"
                ? styles.statusRunning
                : status === "paused"
                ? styles.statusPaused
                : status === "complete"
                ? styles.statusComplete
                : styles.statusIdle,
            ]}
          >
            {status.toUpperCase()}
          </Text>
        </View>

        {/* Visitor Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Visitors:</Text>
            <Text style={styles.statValue}>{data.totalVisitors}</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Current Visitors:</Text>
            <Text style={styles.statValue}>{data.currentVisitors}</Text>
          </View>
        </View>

        {/* Progress of the day */}
        <View style={styles.dayProgressContainer}>
          <Text style={styles.dayProgressLabel}>Day Progress:</Text>
          <View style={styles.progressBarContainer}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressAnimation.interpolate({
                    inputRange: [0, 100],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            />
          </View>
        </View>

        {/* Rides */}
        <View style={styles.ridesContainer}>
          <Text style={styles.sectionTitle}>Attractions</Text>

          {data.rides.map((ride) => (
            <View
              key={ride.id}
              style={[styles.rideCard, !ride.isOpen && styles.closedRideCard]}
            >
              <View style={styles.rideHeaderRow}>
                <Text style={styles.rideName}>{ride.name}</Text>
                <Text
                  style={[
                    styles.rideStatus,
                    ride.isOpen
                      ? styles.rideStatusOpen
                      : styles.rideStatusClosed,
                  ]}
                >
                  {ride.isOpen ? "OPEN" : "CLOSED"}
                </Text>
              </View>

              {ride.isOpen ? (
                <>
                  <View style={styles.rideStats}>
                    <View style={styles.rideStat}>
                      <Text>Current Riders:</Text>
                      <Text style={styles.rideStatValue}>
                        {ride.currentRiders}
                      </Text>
                    </View>

                    <View style={styles.rideStat}>
                      <Text>In Queue:</Text>
                      <Text style={styles.rideStatValue}>
                        {ride.queueLength}
                      </Text>
                    </View>

                    <View style={styles.rideStat}>
                      <Text>Total Riders:</Text>
                      <Text style={styles.rideStatValue}>
                        {ride.totalRiders}
                      </Text>
                    </View>
                  </View>

                  {/* Visual representation of ride */}
                  <View style={styles.rideVisual}>
                    <View style={styles.rideIconContainer}>
                      <Text style={styles.rideIcon}>{ride.icon}</Text>
                    </View>

                    {/* Queue visualization */}
                    <View style={styles.queueVisual}>
                      {Array(Math.min(10, Math.ceil(ride.queueLength / 5)))
                        .fill(0)
                        .map((_, i) => (
                          <Text key={i} style={styles.visitorIcon}>
                            👤
                          </Text>
                        ))}
                    </View>
                  </View>
                </>
              ) : (
                <View style={styles.closedRideVisual}>
                  <Text style={styles.rideIcon}>{ride.icon}</Text>
                  <Text style={styles.closedMessage}>
                    This attraction is closed today
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Simulation Complete Message */}
        {status === "complete" && (
          <View
            style={[
              styles.simulationVisualization,
              styles.completeVisualization,
            ]}
          >
            <Text style={styles.completeText}>✅ Park Closed!</Text>
            <Text>{config.name} has closed for the day.</Text>
            <Text style={styles.summaryText}>
              Total Visitors: {data.totalVisitors}
            </Text>
            <Text style={styles.summaryText}>
              Total Rides Given:{" "}
              {data.rides.reduce((sum, ride) => sum + ride.totalRiders, 0)}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    paddingBottom: 20,
  },
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "#fff",
    alignItems: "center",
    padding: 16,
  },
  parkName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0066cc",
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#f0f8ff",
    padding: 10,
    borderRadius: 8,
    width: "90%",
    justifyContent: "center",
  },
  timeLabel: {
    fontWeight: "bold",
    marginRight: 10,
    fontSize: 16,
  },
  timeValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0066cc",
  },
  statusContainer: {
    flexDirection: "row",
    marginBottom: 15,
  },
  statusLabel: {
    fontWeight: "bold",
    marginRight: 10,
  },
  statusValue: {
    fontWeight: "bold",
  },
  statusRunning: {
    color: "green",
  },
  statusPaused: {
    color: "orange",
  },
  statusIdle: {
    color: "gray",
  },
  statusComplete: {
    color: "blue",
    fontWeight: "bold",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 16,
  },
  statItem: {
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 10,
    borderRadius: 8,
    width: "45%",
  },
  statLabel: {
    fontSize: 14,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  dayProgressContainer: {
    width: "90%",
    marginVertical: 16,
  },
  dayProgressLabel: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 20,
    width: "100%",
    backgroundColor: "#e0e0e0",
    borderRadius: 10,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#4caf50",
  },
  ridesContainer: {
    width: "100%",
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  rideCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  rideHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  rideName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  rideStatus: {
    fontWeight: "bold",
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rideStatusOpen: {
    backgroundColor: "#d4edda",
    color: "#155724",
  },
  rideStatusClosed: {
    backgroundColor: "#f8d7da",
    color: "#721c24",
  },
  rideStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  rideStat: {
    alignItems: "center",
  },
  rideStatValue: {
    fontWeight: "bold",
    color: "#0066cc",
  },
  rideVisual: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#eaeaea",
  },
  rideIconContainer: {
    marginRight: 12,
    backgroundColor: "#e6f2ff",
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  rideIcon: {
    fontSize: 24,
  },
  queueVisual: {
    flexDirection: "row",
    flexWrap: "wrap",
    flex: 1,
  },
  visitorIcon: {
    fontSize: 16,
    marginRight: 2,
    marginBottom: 2,
  },
  closedRideCard: {
    opacity: 0.7,
    backgroundColor: "#f5f5f5",
  },
  closedRideVisual: {
    alignItems: "center",
    paddingVertical: 15,
  },
  closedMessage: {
    marginTop: 10,
    fontStyle: "italic",
    color: "#721c24",
  },
  simulationVisualization: {
    marginTop: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    alignItems: "center",
    width: "90%",
  },
  completeVisualization: {
    backgroundColor: "#e6f7ff",
    borderColor: "#91d5ff",
  },
  completeText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 8,
    color: "#0066cc",
  },
});

export default SimulationDisplay;
