import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from "react-native";
import { useState } from "react";
import { useThemePark } from "../context/ThemeParkContext";
import { useSavedSimulations } from "../context/SavedSimulationsContext";

// Create a proper interface for the component props
interface SimulationControlsProps {
  status: string;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onSave: () => void;
  canSave: boolean;
}

const SimulationControls = ({
  status,
  onStart,
  onStop,
  onReset,
  onSave,
  canSave,
}: SimulationControlsProps) => {
  const { config, updateParkName, toggleRideStatus, resetConfig } =
    useThemePark();
  const [showConfig, setShowConfig] = useState(false);
  const [tempParkName, setTempParkName] = useState(config.name);

  // Handle park name change
  const handleNameChange = () => {
    updateParkName(tempParkName);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Simulation Controls</Text>

      <View style={styles.buttonContainer}>
        {/* Start/Stop toggle button */}
        <TouchableOpacity
          style={[
            styles.button,
            status === "complete" && styles.disabledButton,
          ]}
          onPress={status === "running" ? onStop : onStart}
          disabled={status === "complete"}
        >
          <Text style={styles.buttonText}>
            {status === "running" ? "Stop" : "Start"}
          </Text>
        </TouchableOpacity>

        {/* Reset button */}
        <TouchableOpacity style={styles.button} onPress={onReset}>
          <Text style={styles.buttonText}>Reset</Text>
        </TouchableOpacity>

        {/* Save button - only enabled for completed simulations */}
        <TouchableOpacity
          style={[
            styles.button,
            styles.saveButton,
            !canSave && styles.disabledButton,
          ]}
          onPress={onSave}
          disabled={!canSave}
        >
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>

        {/* Config button */}
        <TouchableOpacity
          style={[styles.button, styles.configButton]}
          onPress={() => setShowConfig(!showConfig)}
        >
          <Text style={styles.buttonText}>
            {showConfig ? "Hide Config" : "Edit Config"}
          </Text>
        </TouchableOpacity>
      </View>

      {showConfig && (
        <View style={styles.configPanel}>
          <Text style={styles.configTitle}>Park Configuration</Text>

          {/* Park Name Editor */}
          <View style={styles.configItem}>
            <Text style={styles.configLabel}>Park Name:</Text>
            <View style={styles.nameInputContainer}>
              <TextInput
                style={styles.nameInput}
                value={tempParkName}
                onChangeText={setTempParkName}
                placeholder="Enter park name"
              />
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleNameChange}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Ride Status Controls */}
          <Text style={styles.ridesTitle}>Ride Status:</Text>

          {config.initialRides.map((ride) => (
            <View key={ride.id} style={styles.rideToggleContainer}>
              <Text style={styles.rideToggleLabel}>
                {ride.icon} {ride.name}:
              </Text>
              <View style={styles.toggleContainer}>
                <Text style={styles.toggleLabel}>
                  {ride.isOpen ? "Open" : "Closed"}
                </Text>
                <Switch
                  value={ride.isOpen}
                  onValueChange={() => toggleRideStatus(ride.id)}
                  trackColor={{ false: "#767577", true: "#81b0ff" }}
                  thumbColor={ride.isOpen ? "#f5dd4b" : "#f4f3f4"}
                />
              </View>
            </View>
          ))}

          {/* Reset Config Button */}
          <TouchableOpacity
            style={[styles.button, styles.resetConfigButton]}
            onPress={() => {
              resetConfig();
              setTempParkName(config.name);
            }}
          >
            <Text style={styles.buttonText}>Reset to Defaults</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    padding: 20,
    backgroundColor: "#f8f8f8",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eaeaea",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 5,
    minWidth: 90,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#cccccc",
  },
  configButton: {
    backgroundColor: "#9c27b0",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  configPanel: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginTop: 10,
  },
  configTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  configItem: {
    marginBottom: 15,
  },
  configLabel: {
    fontSize: 14,
    marginBottom: 5,
    fontWeight: "500",
  },
  nameInputContainer: {
    flexDirection: "row",
  },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  saveButton: {
    backgroundColor: "#4caf50",
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
    marginLeft: 10,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  ridesTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 10,
    marginBottom: 10,
  },
  rideToggleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  rideToggleLabel: {
    fontSize: 14,
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  toggleLabel: {
    marginRight: 8,
    fontSize: 14,
  },
  resetConfigButton: {
    backgroundColor: "#ff9800",
    width: "100%",
    marginTop: 15,
  },
});

export default SimulationControls;
