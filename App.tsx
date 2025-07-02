import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { SimulationProvider } from "./contexts/SimulationContext";
import { SimulationDisplay } from "./components/SimulationDisplay";
import { SimulationControls } from "./components/SimulationControls";
import { GanttChart } from "./components/GanttChart";

export default function App() {
  return (
    <SimulationProvider>
      <View style={styles.container}>
        <Text style={styles.title}>Person Movement Simulation</Text>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          bounces={false}
        >
          <SimulationDisplay />
          <SimulationControls />
          <GanttChart />
        </ScrollView>
        <StatusBar style="auto" />
      </View>
    </SimulationProvider>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
});
