import React, { useEffect, useState, useRef } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Alert } from "react-native";
import { useTimelineEvents } from "../contexts/TimelineEventsContext";
import { useSimulation } from "../contexts/SimulationContext";

export const GanttChart: React.FC = () => {
  const { simulationTime } = useSimulation();
  const { activities, completedTravelers, exportTimelineData, events } =
    useTimelineEvents();

  // Debug: Log when activities change
  useEffect(() => {
    console.log(`GanttChart: Activities updated, count: ${activities.length}`);
    console.log(`GanttChart: Events count: ${events.length}`);
    if (activities.length > 0) {
      console.log("Latest activities:", activities.slice(-3));
    }
  }, [activities, events]);

  const renderTravelerRow = (travelerId: number) => {
    const travelerActivities = activities.filter(
      (a) => a.travelerId === travelerId
    );
    if (travelerActivities.length === 0) return null;

    const minTime = Math.min(...activities.map((a) => a.startTime));
    const maxTime = Math.max(...activities.map((a) => a.endTime || Date.now()));
    const totalDuration = maxTime - minTime;

    return (
      <View key={travelerId} style={styles.travelerRow}>
        <Text style={styles.travelerLabel}>Traveler {travelerId}</Text>
        <View style={styles.timelineContainer}>
          {travelerActivities.map((activity) => {
            const startPercentage =
              ((activity.startTime - minTime) / totalDuration) * 100;
            const duration =
              (activity.endTime || Date.now()) - activity.startTime;
            const widthPercentage = (duration / totalDuration) * 100;

            return (
              <View
                key={activity.id}
                style={[
                  styles.activityBar,
                  {
                    left: `${startPercentage}%`,
                    width: `${widthPercentage}%`,
                    backgroundColor: activity.color,
                    opacity: activity.endTime ? 1 : 0.7,
                  },
                ]}
              >
                <Text style={styles.barLabel}>{activity.name}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderTimeAxis = () => {
    if (activities.length === 0) return null;

    const minTime = Math.min(...activities.map((a) => a.startTime));
    const maxTime = Math.max(...activities.map((a) => a.endTime || Date.now()));
    const totalDuration = maxTime - minTime;

    // Generate time markers - show 5 evenly spaced time points
    const timeMarkers = [];
    for (let i = 0; i <= 4; i++) {
      const timePoint = minTime + (totalDuration * i) / 4;
      const percentage = (i / 4) * 100;

      // Convert real time to simulation time equivalent
      const simTimePoint = timePoint - minTime; // Relative to start
      const formattedTime = formatSimulationTime(simTimePoint);

      timeMarkers.push(
        <View key={i} style={[styles.timeMarker, { left: `${percentage}%` }]}>
          <Text style={styles.timeLabel}>{formattedTime}</Text>
        </View>
      );
    }

    return <View style={styles.timeAxis}>{timeMarkers}</View>;
  };

  const formatSimulationTime = (time: number) => {
    const seconds = Math.floor(time / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const exportData = () => {
    if (activities.length === 0) {
      Alert.alert("No Data", "There are no activities to export.");
      return;
    }

    const exportData = exportTimelineData();

    // Convert to formatted JSON string
    const jsonString = JSON.stringify(exportData, null, 2);

    // For web/desktop environments, create downloadable file
    if (typeof window !== "undefined" && window.document) {
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `simulation-timeline-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      Alert.alert(
        "Export Complete",
        "Timeline data has been downloaded as JSON file."
      );
    } else {
      // For mobile environments, show data in alert or copy to clipboard
      Alert.alert(
        "Export Data",
        "Data exported to console. Check browser developer tools.",
        [
          { text: "OK" },
          {
            text: "Copy Summary",
            onPress: () => {
              const summary = exportData.summary;
              const summaryText = `Timeline Export Summary:
- Total Activities: ${summary.totalActivities}
- Unique Travelers: ${summary.uniqueTravelers}
- Completed: ${summary.completedActivities}
- In Progress: ${summary.inProgressActivities}
- Export Time: ${new Date().toLocaleString()}`;
              console.log("EXPORT DATA:", jsonString);
              Alert.alert("Summary", summaryText);
            },
          },
        ]
      );
    }
  };

  const allTravelerIds = [
    ...new Set([...activities.map((a) => a.travelerId), ...completedTravelers]),
  ].sort();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Activity Timeline</Text>
        {activities.length > 0 && (
          <TouchableOpacity style={styles.exportButton} onPress={exportData}>
            <Text style={styles.exportButtonText}>📤 Export</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Debug info */}
      <Text style={styles.debugText}>
        Events: {events.length} | Activities: {activities.length} | Travelers:{" "}
        {allTravelerIds.length}
      </Text>

      {allTravelerIds.length > 0 ? (
        <View style={styles.chart}>
          {allTravelerIds.map((travelerId) => renderTravelerRow(travelerId))}
          {renderTimeAxis()}
        </View>
      ) : (
        <Text style={styles.noData}>No activity data</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    margin: 10,
    marginTop: 15,
    minHeight: 120,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
  },
  exportButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 10,
  },
  exportButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  chart: {
    // Removed minHeight to allow natural expansion
  },
  travelerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    height: 40,
  },
  travelerLabel: {
    width: 100,
    fontSize: 14,
    fontWeight: "500",
  },
  timelineContainer: {
    flex: 1,
    height: 30,
    backgroundColor: "#f0f0f0",
    borderRadius: 15,
    position: "relative",
    marginLeft: 10,
  },
  activityBar: {
    position: "absolute",
    height: "100%",
    borderRadius: 15,
    top: 0,
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  barLabel: {
    fontSize: 10,
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  timeAxis: {
    position: "relative",
    height: 30,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  timeMarker: {
    position: "absolute",
    top: 5,
    alignItems: "center",
    transform: [{ translateX: -25 }], // Center the label
  },
  timeLabel: {
    fontSize: 10,
    color: "#666",
    fontWeight: "500",
  },
  noData: {
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
    padding: 20,
  },
  debugText: {
    fontSize: 10,
    color: "#666",
    textAlign: "center",
    marginBottom: 10,
  },
});
