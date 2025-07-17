import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { SimulationProvider } from "./contexts/SimulationContext";
import { TimelineEventsProvider } from "./contexts/TimelineEventsContext";
import { SimulationDisplay } from "./components/SimulationDisplay";
import { SimulationControls } from "./components/SimulationControls";
import { GanttChart } from "./components/GanttChart";
import React, { useState } from "react";
import { useSimulation } from "./contexts/SimulationContext";
import AppBanner from "./components/AppBanner";

type TabType = "simulation" | "controls" | "timeline";

// Inner component that has access to simulation context
const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("simulation");

  const {
    isSimulating,
    speed,
    addTraveler,
    startSimulation,
    stopSimulation,
    resetSimulation,
    setSpeed,
  } = useSimulation();

  const renderContent = () => {
    switch (activeTab) {
      case "simulation":
        return <SimulationDisplay />;
      case "controls":
        return <SimulationControls />;
      case "timeline":
        return <GanttChart />;
      default:
        return <SimulationDisplay />;
    }
  };

  const speedOptions = [0.25, 0.5, 1, 2, 4];

  return (
    <View style={styles.container}>
      <AppBanner
        appName="Eventron"
        appIcon={require("./assets/icon.png")}
        privacyPolicyUrl=""
        androidUrl=""
        androidTestersGroupUrl=""
        iosUrl=""
      />

      <Text style={styles.title}>Person Movement Simulation</Text>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "simulation" && styles.activeTab]}
          onPress={() => setActiveTab("simulation")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "simulation" && styles.activeTabText,
            ]}
          >
            Simulation
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "controls" && styles.activeTab]}
          onPress={() => setActiveTab("controls")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "controls" && styles.activeTabText,
            ]}
          >
            Configuration
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "timeline" && styles.activeTab]}
          onPress={() => setActiveTab("timeline")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "timeline" && styles.activeTabText,
            ]}
          >
            Timeline
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      <View style={styles.contentContainer}>{renderContent()}</View>

      {/* Always Visible Controls */}
      <View style={styles.globalControls}>
        {/* Speed Control */}
        <View style={styles.speedControl}>
          <Text style={styles.speedLabel}>Speed: {speed.toFixed(2)}x</Text>
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

        {/* Main Action Controls */}
        <View style={styles.actionControls}>
          <TouchableOpacity
            style={[styles.controlButton, styles.addButton]}
            onPress={addTraveler}
          >
            <Text style={styles.controlButtonText}>Add Traveler</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.controlButton,
              styles.startButton,
              isSimulating && styles.disabledButton,
            ]}
            onPress={startSimulation}
            disabled={isSimulating}
          >
            <Text
              style={[
                styles.controlButtonText,
                isSimulating && styles.disabledButtonText,
              ]}
            >
              Start
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.controlButton,
              styles.stopButton,
              !isSimulating && styles.disabledButton,
            ]}
            onPress={stopSimulation}
            disabled={!isSimulating}
          >
            <Text
              style={[
                styles.controlButtonText,
                !isSimulating && styles.disabledButtonText,
              ]}
            >
              Stop
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.resetButton]}
            onPress={resetSimulation}
          >
            <Text style={styles.controlButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>

      <StatusBar style="auto" />
    </View>
  );
};

// Main App component that sets up providers
export default function App() {
  return (
    <TimelineEventsProvider>
      <SimulationProvider>
        <AppContent />
      </SimulationProvider>
    </TimelineEventsProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#e0e0e0",
    borderRadius: 10,
    padding: 4,
    marginBottom: 15,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#007AFF",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  activeTabText: {
    color: "white",
    fontWeight: "bold",
  },
  contentContainer: {
    flex: 1,
  },
  globalControls: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  speedControl: {
    alignItems: "center",
    marginBottom: 15,
  },
  speedLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    color: "#333",
  },
  speedButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  speedButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#E5E5E5",
    minWidth: 35,
    alignItems: "center",
  },
  activeSpeedButton: {
    backgroundColor: "#007AFF",
  },
  speedButtonText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#333",
  },
  activeSpeedButtonText: {
    color: "white",
  },
  actionControls: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 8,
  },
  controlButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
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
  disabledButton: {
    backgroundColor: "#C7C7CC",
  },
  controlButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  disabledButtonText: {
    color: "#8E8E93",
  },
});
