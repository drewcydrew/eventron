import React, { createContext, useContext, useState, ReactNode } from "react";

interface TimelineEvent {
  id: string;
  travelerId: number;
  eventType: string;
  timestamp: number;
  stage: string;
  data?: any;
}

interface Activity {
  id: string;
  travelerId: number;
  name: string;
  startTime: number;
  endTime?: number;
  color: string;
}

interface TimelineEventsContextType {
  events: TimelineEvent[];
  activities: Activity[];
  completedTravelers: Set<number>;
  addEvent: (event: Omit<TimelineEvent, "id">) => void;
  clearAllEvents: () => void;
  exportTimelineData: () => any;
}

const TimelineEventsContext = createContext<
  TimelineEventsContextType | undefined
>(undefined);

export const useTimelineEvents = () => {
  const context = useContext(TimelineEventsContext);
  if (!context) {
    throw new Error(
      "useTimelineEvents must be used within a TimelineEventsProvider"
    );
  }
  return context;
};

interface TimelineEventsProviderProps {
  children: ReactNode;
}

export const TimelineEventsProvider: React.FC<TimelineEventsProviderProps> = ({
  children,
}) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [completedTravelers, setCompletedTravelers] = useState<Set<number>>(
    new Set()
  );
  const [travelerStages, setTravelerStages] = useState<Map<number, string>>(
    new Map()
  );

  const addEvent = (eventData: Omit<TimelineEvent, "id">) => {
    const event: TimelineEvent = {
      ...eventData,
      id: `${eventData.travelerId}-${eventData.eventType}-${eventData.timestamp}`,
    };

    setEvents((prev) => [...prev, event]);

    // Process the event to update activities
    processEventForActivities(event);
  };

  const processEventForActivities = (event: TimelineEvent) => {
    const { travelerId, timestamp, stage } = event;
    const previousStage = travelerStages.get(travelerId) || "none";

    setTravelerStages((prev) => new Map(prev.set(travelerId, stage)));

    if (previousStage !== stage) {
      if (previousStage !== "none" && previousStage !== "idle") {
        setActivities((prev) =>
          prev.map((activity) =>
            activity.travelerId === travelerId && !activity.endTime
              ? { ...activity, endTime: timestamp }
              : activity
          )
        );
      }

      let newActivity: Activity | null = null;

      switch (stage) {
        case "movingToC":
          const isReturning = previousStage.startsWith("processingAt");
          newActivity = {
            id: `${travelerId}-moveToC-${timestamp}`,
            travelerId,
            name: isReturning ? "Return to C" : "Travel to C",
            startTime: timestamp,
            color: isReturning ? "#28B946" : "#32D74B",
          };
          break;

        case "returningToC":
          newActivity = {
            id: `${travelerId}-returningToC-${timestamp}`,
            travelerId,
            name: "Return to C",
            startTime: timestamp,
            color: "#28B946",
          };
          break;

        case "collectingAtC":
          newActivity = {
            id: `${travelerId}-collectingC-${timestamp}`,
            travelerId,
            name: "Collecting Box",
            startTime: timestamp,
            color: "#28CD41",
          };
          break;

        case "returningToA":
          newActivity = {
            id: `${travelerId}-return-${timestamp}`,
            travelerId,
            name: "Return to A",
            startTime: timestamp,
            color: "#34C759",
          };
          break;

        default:
          // Handle dynamic station stages
          if (stage.startsWith("movingTo") && stage !== "movingToC") {
            const stationId = stage.replace("movingTo", "");
            const isSwitching =
              previousStage.startsWith("movingTo") ||
              previousStage.startsWith("waitingAt") ||
              previousStage.startsWith("processingAt");
            newActivity = {
              id: `${travelerId}-moveTo${stationId}-${timestamp}`,
              travelerId,
              name: isSwitching
                ? `Switch to ${stationId}`
                : `Travel to ${stationId}`,
              startTime: timestamp,
              color: isSwitching ? "#9933FF" : "#007AFF",
            };
          } else if (stage.startsWith("waitingAt")) {
            const stationId = stage.replace("waitingAt", "");
            newActivity = {
              id: `${travelerId}-waiting${stationId}-${timestamp}`,
              travelerId,
              name: `Waiting at ${stationId}`,
              startTime: timestamp,
              color: "#FF6B6B",
            };
          } else if (stage.startsWith("processingAt")) {
            const stationId = stage.replace("processingAt", "");
            newActivity = {
              id: `${travelerId}-processing${stationId}-${timestamp}`,
              travelerId,
              name: `Processing at ${stationId}`,
              startTime: timestamp,
              color: "#FF9500",
            };
          }
          break;
      }

      if (stage === "completed") {
        setCompletedTravelers((prev) => new Set([...prev, travelerId]));
        setActivities((prev) =>
          prev.map((activity) =>
            activity.travelerId === travelerId && !activity.endTime
              ? { ...activity, endTime: timestamp }
              : activity
          )
        );
      }

      if (newActivity) {
        setActivities((prev) => [...prev, newActivity]);
      }
    }
  };

  const clearAllEvents = () => {
    setEvents([]);
    setActivities([]);
    setCompletedTravelers(new Set());
    setTravelerStages(new Map());
  };

  const exportTimelineData = () => {
    return {
      events,
      activities: activities.map((activity) => ({
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
      })),
      summary: {
        totalEvents: events.length,
        totalActivities: activities.length,
        uniqueTravelers: new Set(events.map((e) => e.travelerId)).size,
        completedActivities: activities.filter((a) => a.endTime).length,
        inProgressActivities: activities.filter((a) => !a.endTime).length,
        exportDate: new Date().toISOString(),
      },
    };
  };

  return (
    <TimelineEventsContext.Provider
      value={{
        events,
        activities,
        completedTravelers,
        addEvent,
        clearAllEvents,
        exportTimelineData,
      }}
    >
      {children}
    </TimelineEventsContext.Provider>
  );
};
