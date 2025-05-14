import React, { useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSavedSimulations } from "../context/SavedSimulationsContext";

interface SimulationListProps {
  onSelectSimulation?: (id: string) => void;
}

const SimulationList = ({ onSelectSimulation }: SimulationListProps) => {
  const { savedSimulations, deleteSimulation, isLoading, forceRefresh } =
    useSavedSimulations();

  // Force refresh when component mounts
  useEffect(() => {
    forceRefresh().catch((err) =>
      console.error("Error refreshing saved simulations:", err)
    );
  }, []);

  // Show more detailed loading/error state
  if (isLoading) {
    console.log("SimulationList: Showing loading state");
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading saved simulations...</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => forceRefresh()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (savedSimulations.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>No saved simulations yet</Text>
        <Text style={styles.helpText}>
          Run a simulation to completion and save it to see it here!
        </Text>
      </View>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Saved Simulations</Text>

      <FlatList
        data={savedSimulations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.simulationCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.simulationName}>{item.name}</Text>
              <Text style={styles.simulationDate}>{formatDate(item.date)}</Text>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.statRow}>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Park Name:</Text>
                  <Text style={styles.statValue}>{item.parkName}</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Visitors:</Text>
                  <Text style={styles.statValue}>{item.totalVisitors}</Text>
                </View>
              </View>

              <View style={styles.statRow}>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Total Rides:</Text>
                  <Text style={styles.statValue}>{item.totalRides}</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Rides:</Text>
                  <Text style={styles.statValue}>
                    {item.data.rides.filter((r) => r.isOpen).length} open /{" "}
                    {item.data.rides.length} total
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.cardActions}>
              {onSelectSimulation && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.viewButton]}
                  onPress={() => onSelectSimulation(item.id)}
                >
                  <Text style={styles.actionButtonText}>View Details</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => deleteSimulation(item.id)}
              >
                <Text style={styles.actionButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "#fff",
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  listContent: {
    paddingBottom: 20,
  },
  simulationCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
    paddingBottom: 10,
  },
  simulationName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  simulationDate: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  cardBody: {
    marginBottom: 15,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 5,
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#eaeaea",
    paddingTop: 10,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginHorizontal: 5,
  },
  viewButton: {
    backgroundColor: "#2196F3",
  },
  deleteButton: {
    backgroundColor: "#f44336",
  },
  actionButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  noDataText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  helpText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: "#2196F3",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default SimulationList;
