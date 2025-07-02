import React, { useEffect, useState, useRef } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Alert } from "react-native";
import { useSimulation } from "../contexts/SimulationContext";

interface Activity {
  id: string;
  travelerId: number;
  name: string;
  startTime: number;
  endTime?: number;
  color: string;
}

export const GanttChart: React.FC = () => {
  const { people, isSimulating, ganttClearTrigger, simulationTime } =
    useSimulation();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [completedTravelers, setCompletedTravelers] = useState<Set<number>>(
    new Set()
  );
  const travelerStagesRef = useRef<Map<number, string>>(new Map());

  // Clear all data when reset is triggered
  useEffect(() => {
    if (ganttClearTrigger > 0) {
      setActivities([]);
      setCompletedTravelers(new Set());
      travelerStagesRef.current.clear();
    }
  }, [ganttClearTrigger]);

  useEffect(() => {
    const now = Date.now();
    const currentTravelerIds = new Set(people.map((p) => p.id));
    const previousTravelerIds = new Set(travelerStagesRef.current.keys());

    // Check for travelers that have been removed (completed their journey)
    for (const id of previousTravelerIds) {
      if (!currentTravelerIds.has(id)) {
        setCompletedTravelers((prev) => new Set([...prev, id]));
        // End any ongoing activities for this traveler
        setActivities((prev) =>
          prev.map((activity) =>
            activity.travelerId === id && !activity.endTime
              ? { ...activity, endTime: now }
              : activity
          )
        );
      }
    }

    people.forEach((person) => {
      const previousStage = travelerStagesRef.current.get(person.id) || "none";
      const currentStage = person.stage;

      if (previousStage !== currentStage) {
        // Stage changed, end previous activity and start new one
        if (previousStage !== "none" && previousStage !== "idle") {
          setActivities((prev) =>
            prev.map((activity) =>
              activity.travelerId === person.id && !activity.endTime
                ? { ...activity, endTime: now }
                : activity
            )
          );
        }

        // Start new activity based on current stage
        if (currentStage === "movingToC") {
          const activityName =
            previousStage === "processingAtB1" ||
            previousStage === "processingAtB2"
              ? "Return to C"
              : "Travel to C";
          const color =
            previousStage === "processingAtB1" ||
            previousStage === "processingAtB2"
              ? "#28B946" // Darker green for return journey
              : "#32D74B"; // Regular green for initial journey

          setActivities((prev) => [
            ...prev,
            {
              id: `${person.id}-moveToC-${now}`,
              travelerId: person.id,
              name: activityName,
              startTime: now,
              color: color,
            },
          ]);
        } else if (currentStage === "collectingAtC") {
          setActivities((prev) => [
            ...prev,
            {
              id: `${person.id}-collectingC-${now}`,
              travelerId: person.id,
              name: "Collecting Box",
              startTime: now,
              color: "#28CD41",
            },
          ]);
        } else if (currentStage === "movingToB1") {
          const activityName =
            previousStage === "movingToB2" ||
            previousStage === "waitingAtB2" ||
            previousStage === "processingAtB2"
              ? "Switch to B1"
              : "Travel to B1";
          const color =
            previousStage === "movingToB2" ||
            previousStage === "waitingAtB2" ||
            previousStage === "processingAtB2"
              ? "#9933FF" // Purple for switching
              : "#007AFF"; // Blue for initial travel

          setActivities((prev) => [
            ...prev,
            {
              id: `${person.id}-moveToB1-${now}`,
              travelerId: person.id,
              name: activityName,
              startTime: now,
              color: color,
            },
          ]);
        } else if (currentStage === "movingToB2") {
          const activityName =
            previousStage === "movingToB1" ||
            previousStage === "waitingAtB1" ||
            previousStage === "processingAtB1"
              ? "Switch to B2"
              : "Travel to B2";
          const color =
            previousStage === "movingToB1" ||
            previousStage === "waitingAtB1" ||
            previousStage === "processingAtB1"
              ? "#CC33FF" // Light purple for switching
              : "#0099FF"; // Light blue for initial travel

          setActivities((prev) => [
            ...prev,
            {
              id: `${person.id}-moveToB2-${now}`,
              travelerId: person.id,
              name: activityName,
              startTime: now,
              color: color,
            },
          ]);
        } else if (currentStage === "waitingAtB1") {
          setActivities((prev) => [
            ...prev,
            {
              id: `${person.id}-waitingB1-${now}`,
              travelerId: person.id,
              name: "Waiting at B1",
              startTime: now,
              color: "#FF6B6B", // Red color for waiting
            },
          ]);
        } else if (currentStage === "waitingAtB2") {
          setActivities((prev) => [
            ...prev,
            {
              id: `${person.id}-waitingB2-${now}`,
              travelerId: person.id,
              name: "Waiting at B2",
              startTime: now,
              color: "#FF4444", // Slightly different red for B2 waiting
            },
          ]);
        } else if (currentStage === "processingAtB1") {
          setActivities((prev) => [
            ...prev,
            {
              id: `${person.id}-processingB1-${now}`,
              travelerId: person.id,
              name: "Processing at B1",
              startTime: now,
              color: "#FF9500",
            },
          ]);
        } else if (currentStage === "processingAtB2") {
          setActivities((prev) => [
            ...prev,
            {
              id: `${person.id}-processingB2-${now}`,
              travelerId: person.id,
              name: "Processing at B2",
              startTime: now,
              color: "#FF7700", // Slightly different orange for B2 processing
            },
          ]);
        } else if (currentStage === "returningToA") {
          setActivities((prev) => [
            ...prev,
            {
              id: `${person.id}-return-${now}`,
              travelerId: person.id,
              name: "Return to A",
              startTime: now,
              color: "#34C759",
            },
          ]);
        }

        travelerStagesRef.current.set(person.id, currentStage);
      }
    });

    // Only clean up stages for travelers that no longer exist
    for (const [id] of travelerStagesRef.current) {
      if (!currentTravelerIds.has(id)) {
        travelerStagesRef.current.delete(id);
      }
    }
  }, [people]);

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

    // Prepare export data
    const exportActivities = activities.map((activity) => ({
      travelerId: activity.travelerId,
      travelerName: `Traveler ${activity.travelerId}`,
      activityName: activity.name,
      startTime: new Date(activity.startTime).toISOString(),
      endTime: activity.endTime
        ? new Date(activity.endTime).toISOString()
        : "In Progress",
      duration: activity.endTime
        ? activity.endTime - activity.startTime
        : Date.now() - activity.startTime,
      color: activity.color,
    }));

    // Create summary statistics
    const summary = {
      totalActivities: activities.length,
      uniqueTravelers: allTravelerIds.length,
      completedActivities: activities.filter((a) => a.endTime).length,
      inProgressActivities: activities.filter((a) => !a.endTime).length,
      exportDate: new Date().toISOString(),
      simulationTimeAtExport: simulationTime,
    };

    const exportData = {
      summary,
      activities: exportActivities,
    };

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
});
