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

    // Update traveler stages
    setTravelerStages((prev) => new Map(prev.set(travelerId, stage)));

    if (previousStage !== stage) {
      // End previous activity if it exists and isn't idle
      if (previousStage !== "none" && previousStage !== "idle") {
        setActivities((prev) =>
          prev.map((activity) =>
            activity.travelerId === travelerId && !activity.endTime
              ? { ...activity, endTime: timestamp }
              : activity
          )
        );
      }

      // Start new activity based on current stage
      let newActivity: Activity | null = null;

      switch (stage) {
        case "movingToC":
          const isReturning =
            previousStage === "processingAtB1" ||
            previousStage === "processingAtB2";
          newActivity = {
            id: `${travelerId}-moveToC-${timestamp}`,
            travelerId,
            name: isReturning ? "Return to C" : "Travel to C",
            startTime: timestamp,
            color: isReturning ? "#28B946" : "#32D74B",
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

        case "movingToB1":
          const isSwitchingToB1 = [
            "movingToB2",
            "waitingAtB2",
            "processingAtB2",
          ].includes(previousStage);
          newActivity = {
            id: `${travelerId}-moveToB1-${timestamp}`,
            travelerId,
            name: isSwitchingToB1 ? "Switch to B1" : "Travel to B1",
            startTime: timestamp,
            color: isSwitchingToB1 ? "#9933FF" : "#007AFF",
          };
          break;

        case "movingToB2":
          const isSwitchingToB2 = [
            "movingToB1",
            "waitingAtB1",
            "processingAtB1",
          ].includes(previousStage);
          newActivity = {
            id: `${travelerId}-moveToB2-${timestamp}`,
            travelerId,
            name: isSwitchingToB2 ? "Switch to B2" : "Travel to B2",
            startTime: timestamp,
            color: isSwitchingToB2 ? "#CC33FF" : "#0099FF",
          };
          break;

        case "waitingAtB1":
          newActivity = {
            id: `${travelerId}-waitingB1-${timestamp}`,
            travelerId,
            name: "Waiting at B1",
            startTime: timestamp,
            color: "#FF6B6B",
          };
          break;

        case "waitingAtB2":
          newActivity = {
            id: `${travelerId}-waitingB2-${timestamp}`,
            travelerId,
            name: "Waiting at B2",
            startTime: timestamp,
            color: "#FF4444",
          };
          break;

        case "processingAtB1":
          newActivity = {
            id: `${travelerId}-processingB1-${timestamp}`,
            travelerId,
            name: "Processing at B1",
            startTime: timestamp,
            color: "#FF9500",
          };
          break;

        case "processingAtB2":
          newActivity = {
            id: `${travelerId}-processingB2-${timestamp}`,
            travelerId,
            name: "Processing at B2",
            startTime: timestamp,
            color: "#FF7700",
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

        case "completed":
          // Mark traveler as completed and end any ongoing activities
          setCompletedTravelers((prev) => new Set([...prev, travelerId]));
          setActivities((prev) =>
            prev.map((activity) =>
              activity.travelerId === travelerId && !activity.endTime
                ? { ...activity, endTime: timestamp }
                : activity
            )
          );
          break;
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
