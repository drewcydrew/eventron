import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import { useTimelineEvents } from "../contexts/TimelineEventsContext";
import { useSimulation } from "../contexts/SimulationContext";

interface TooltipData {
  activity: any;
  visible: boolean;
  x: number;
  y: number;
}

type ViewMode = "traveler" | "box";

export const GanttChart: React.FC = () => {
  const { simulationTime } = useSimulation();
  const { activities, completedTravelers, exportTimelineData, events } =
    useTimelineEvents();

  const [tooltip, setTooltip] = useState<TooltipData>({
    activity: null,
    visible: false,
    x: 0,
    y: 0,
  });

  const [viewMode, setViewMode] = useState<ViewMode>("traveler");

  // Debug: Log when activities change
  useEffect(() => {
    console.log(`GanttChart: Activities updated, count: ${activities.length}`);
    console.log(`GanttChart: Events count: ${events.length}`);
    if (activities.length > 0) {
      console.log("Latest activities:", activities.slice(-3));
    }
  }, [activities, events]);

  const showTooltip = (activity: any, event: any) => {
    // Get the touch position
    const { locationX, locationY } = event.nativeEvent;
    setTooltip({
      activity,
      visible: true,
      x: locationX,
      y: locationY,
    });
  };

  const hideTooltip = () => {
    setTooltip({
      activity: null,
      visible: false,
      x: 0,
      y: 0,
    });
  };

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const formatDuration = (duration: number) => {
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  const renderTooltip = () => {
    if (!tooltip.visible || !tooltip.activity) return null;

    const activity = tooltip.activity;
    const duration = activity.endTime
      ? activity.endTime - activity.startTime
      : Date.now() - activity.startTime;

    return (
      <Modal
        transparent
        visible={tooltip.visible}
        animationType="fade"
        onRequestClose={hideTooltip}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={hideTooltip}
        >
          <View
            style={[
              styles.tooltip,
              {
                left: Math.min(tooltip.x, 250), // Ensure tooltip doesn't go off screen
                top: Math.max(tooltip.y - 100, 50),
              },
            ]}
          >
            <Text style={styles.tooltipTitle}>{activity.name}</Text>
            <Text style={styles.tooltipText}>
              Traveler: {activity.travelerId}
            </Text>
            <Text style={styles.tooltipText}>
              Start: {formatDateTime(activity.startTime)}
            </Text>
            <Text style={styles.tooltipText}>
              End:{" "}
              {activity.endTime
                ? formatDateTime(activity.endTime)
                : "In Progress"}
            </Text>
            <Text style={styles.tooltipText}>
              Duration: {formatDuration(duration)}
            </Text>
            <View
              style={[
                styles.colorIndicator,
                { backgroundColor: activity.color },
              ]}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

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
              <TouchableOpacity
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
                onPress={(event) => showTooltip(activity, event)}
                activeOpacity={0.8}
              >
                <Text style={styles.barLabel} numberOfLines={1}>
                  {activity.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderBoxRow = (boxId: number) => {
    // Get activities related to this box
    // We'll track box lifecycle through processing activities
    const processingActivities = activities.filter(
      (a) => a.name.includes("Processing") && a.travelerId === boxId
    );

    // For box view, we need to reconstruct the box journey
    // Each "box" corresponds to a processing cycle by a traveler
    const boxActivities: any[] = [];

    // Find all travelers and their box processing sequences
    const allTravelers = [...new Set(activities.map((a) => a.travelerId))];
    let currentBoxId = 1;

    allTravelers.forEach((travelerId) => {
      const travelerActivities = activities.filter(
        (a) => a.travelerId === travelerId
      );
      const processingEvents = travelerActivities.filter((a) =>
        a.name.includes("Processing")
      );

      processingEvents.forEach((processingActivity, index) => {
        if (currentBoxId === boxId) {
          // Find the sequence of activities for this box
          const boxSequence = [];

          // Find collection activity before this processing
          const collectionActivity = travelerActivities.find(
            (a) =>
              a.name === "Collecting Box" &&
              a.startTime < processingActivity.startTime &&
              !travelerActivities.find(
                (p) =>
                  p.name.includes("Processing") &&
                  p.startTime > a.startTime &&
                  p.startTime < processingActivity.startTime
              )
          );

          if (collectionActivity) {
            boxSequence.push({
              ...collectionActivity,
              name: `Box ${boxId}: Collection`,
              boxId,
            });
          }

          // Find travel to station activity
          const travelActivity = travelerActivities.find(
            (a) =>
              a.name.includes("Travel to S") &&
              a.startTime < processingActivity.startTime &&
              a.startTime > (collectionActivity?.startTime || 0)
          );

          if (travelActivity) {
            boxSequence.push({
              ...travelActivity,
              name: `Box ${boxId}: Transport`,
              boxId,
            });
          }

          // Add processing activity
          boxSequence.push({
            ...processingActivity,
            name: `Box ${boxId}: Processing`,
            boxId,
          });

          boxActivities.push(...boxSequence);
        }
        currentBoxId++;
      });
    });

    if (boxActivities.length === 0) return null;

    const minTime = Math.min(...activities.map((a) => a.startTime));
    const maxTime = Math.max(...activities.map((a) => a.endTime || Date.now()));
    const totalDuration = maxTime - minTime;

    return (
      <View key={boxId} style={styles.travelerRow}>
        <Text style={styles.travelerLabel}>Box {boxId}</Text>
        <View style={styles.timelineContainer}>
          {boxActivities.map((activity, index) => {
            const startPercentage =
              ((activity.startTime - minTime) / totalDuration) * 100;
            const duration =
              (activity.endTime || Date.now()) - activity.startTime;
            const widthPercentage = (duration / totalDuration) * 100;

            return (
              <TouchableOpacity
                key={`${activity.id}-box-${index}`}
                style={[
                  styles.activityBar,
                  {
                    left: `${startPercentage}%`,
                    width: `${widthPercentage}%`,
                    backgroundColor: activity.color,
                    opacity: activity.endTime ? 1 : 0.7,
                  },
                ]}
                onPress={(event) =>
                  showTooltip(
                    {
                      ...activity,
                      name: activity.name,
                      boxId,
                    },
                    event
                  )
                }
                activeOpacity={0.8}
              >
                <Text style={styles.barLabel} numberOfLines={1}>
                  {activity.name.replace(`Box ${boxId}: `, "")}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const getDisplayIds = () => {
    if (viewMode === "traveler") {
      return [
        ...new Set([
          ...activities.map((a) => a.travelerId),
          ...completedTravelers,
        ]),
      ].sort();
    } else {
      // Calculate total number of boxes processed
      const processingActivities = activities.filter((a) =>
        a.name.includes("Processing")
      );
      const totalBoxes = processingActivities.length;
      return Array.from({ length: totalBoxes }, (_, i) => i + 1);
    }
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

    return (
      <View style={styles.timeAxis}>
        <View style={styles.timeAxisLine} />
        {timeMarkers}
      </View>
    );
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

  const allDisplayIds = getDisplayIds();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Activity Timeline</Text>

        {/* View Mode Toggle */}
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === "traveler" && styles.activeToggleButton,
            ]}
            onPress={() => setViewMode("traveler")}
          >
            <Text
              style={[
                styles.toggleButtonText,
                viewMode === "traveler" && styles.activeToggleText,
              ]}
            >
              By Traveler
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === "box" && styles.activeToggleButton,
            ]}
            onPress={() => setViewMode("box")}
          >
            <Text
              style={[
                styles.toggleButtonText,
                viewMode === "box" && styles.activeToggleText,
              ]}
            >
              By Box
            </Text>
          </TouchableOpacity>
        </View>

        {activities.length > 0 && (
          <TouchableOpacity style={styles.exportButton} onPress={exportData}>
            <Text style={styles.exportButtonText}>📤 Export</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Debug info */}
      <Text style={styles.debugText}>
        Events: {events.length} | Activities: {activities.length} | View:{" "}
        {viewMode} | Rows: {allDisplayIds.length} | 💡 Click activity bars for
        details
      </Text>

      {allDisplayIds.length > 0 ? (
        <ScrollView
          style={styles.chartScrollView}
          contentContainerStyle={styles.chartContent}
          showsVerticalScrollIndicator={true}
        >
          <View style={styles.chart}>
            {allDisplayIds.map((id) =>
              viewMode === "traveler" ? renderTravelerRow(id) : renderBoxRow(id)
            )}
            {renderTimeAxis()}
          </View>
        </ScrollView>
      ) : (
        <Text style={styles.noData}>No activity data</Text>
      )}

      {renderTooltip()}
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
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    flexWrap: "wrap",
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    minWidth: 150,
  },
  viewToggle: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 2,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 80,
    alignItems: "center",
  },
  activeToggleButton: {
    backgroundColor: "#007AFF",
  },
  toggleButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666",
  },
  activeToggleText: {
    color: "white",
    fontWeight: "bold",
  },
  exportButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  exportButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  chartScrollView: {
    flex: 1,
    maxHeight: 400, // Limit max height to ensure it doesn't take up entire screen
  },
  chartContent: {
    paddingBottom: 20, // Extra padding at bottom for better scrolling
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
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
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
    marginLeft: 110, // Align with timeline containers (100px label + 10px margin)
  },
  timeAxisLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  timeMarker: {
    position: "absolute",
    top: 5,
    alignItems: "center",
    width: 50, // Set fixed width for better control
    marginLeft: -25, // Center the marker based on its width
  },
  timeLabel: {
    fontSize: 10,
    color: "#666",
    fontWeight: "500",
    textAlign: "center",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  tooltip: {
    position: "absolute",
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 150,
    maxWidth: 250,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  tooltipTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  tooltipText: {
    fontSize: 12,
    marginBottom: 4,
    color: "#666",
  },
  colorIndicator: {
    width: 20,
    height: 4,
    borderRadius: 2,
    marginTop: 8,
    alignSelf: "flex-start",
  },
});
