import React, {
  createContext,
  useContext,
  useState,
  useRef,
  ReactNode,
  useEffect,
} from "react";
import {
  DiscreteEventEngine,
  TravelerState,
} from "../engines/DiscreteEventEngine";
import { useTimelineEvents } from "./TimelineEventsContext";

interface Location {
  id: string;
  x: number;
  y: number;
}

interface ProcessingStation {
  id: string;
  x: number;
  y: number;
  state?: "available" | "claimed" | "active";
}

interface SimulationContextType {
  people: TravelerState[];
  locationA: Location;
  locationC: Location;
  processingStations: ProcessingStation[];
  isSimulating: boolean;
  simulationComplete: boolean;
  speed: number;
  simulationTime: number;
  boxStatus: { availableBoxes: number; totalProcessed: number };
  startingTravelers: number;
  startingBoxes: number;
  startingStations: number;
  startSimulation: () => void;
  stopSimulation: () => void;
  resetSimulation: () => void;
  addTraveler: () => void;
  setSpeed: (speed: number) => void;
  setStartingTravelers: (count: number) => void;
  setStartingBoxes: (count: number) => void;
  setStartingStations: (count: number) => void;
  updateLocationA: (x: number, y: number) => void;
  updateLocationC: (x: number, y: number) => void;
  updateProcessingStationLocation: (id: string, x: number, y: number) => void;
  ganttClearTrigger: number;
}

const SimulationContext = createContext<SimulationContextType | undefined>(
  undefined
);

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error("useSimulation must be used within a SimulationProvider");
  }
  return context;
};

interface SimulationProviderProps {
  children: ReactNode;
}

// Create the inner component that has access to timeline context
const SimulationProviderInner: React.FC<SimulationProviderProps> = ({
  children,
}) => {
  const timelineEvents = useTimelineEvents();

  const [locationA, setLocationA] = useState<Location>({
    id: "A",
    x: 40,
    y: 90,
  });
  const [locationC, setLocationC] = useState<Location>({
    id: "C",
    x: 120,
    y: 180,
  });
  const [processingStations, setProcessingStations] = useState<
    ProcessingStation[]
  >([
    { id: "S1", x: 180, y: 290 },
    { id: "S2", x: 280, y: 290 },
  ]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationComplete, setSimulationComplete] = useState(false);
  const [speed, setSpeedState] = useState(1);
  const [ganttClearTrigger, setGanttClearTrigger] = useState(0);
  const [simulationTime, setSimulationTime] = useState(0);
  const [people, setPeople] = useState<TravelerState[]>([]);
  const [boxStatus, setBoxStatus] = useState({
    availableBoxes: 5,
    totalProcessed: 0,
  });
  const [startingTravelers, setStartingTravelersState] = useState(2);
  const [startingBoxes, setStartingBoxesState] = useState(5);
  const [startingStations, setStartingStationsState] = useState(2);

  const engineRef = useRef<DiscreteEventEngine>(new DiscreteEventEngine());
  const nextIdRef = useRef(1);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousPeopleRef = useRef<Map<number, string>>(new Map());

  // Set up event observers
  useEffect(() => {
    const engine = engineRef.current;

    engine.onEvent("TRAVELER_START_JOURNEY", () => {
      console.log("Event: TRAVELER_START_JOURNEY");
    });

    engine.onEvent("TRAVELER_ARRIVE_AT_C", () => {
      console.log("Event: TRAVELER_ARRIVE_AT_C");
    });

    engine.onEvent("TRAVELER_COLLECT_BOX", () => {
      console.log("Event: TRAVELER_COLLECT_BOX");
    });

    engine.onEvent("TRAVELER_ARRIVE_AT_STATION", () => {
      console.log("Event: TRAVELER_ARRIVE_AT_STATION");
    });

    engine.onEvent("TRAVELER_FINISH_PROCESSING", () => {
      console.log("Event: TRAVELER_FINISH_PROCESSING");
    });

    engine.onEvent("TRAVELER_ARRIVE_AT_A", () => {
      console.log("Event: TRAVELER_ARRIVE_AT_A");
    });

    engine.onEvent("SIMULATION_COMPLETE", () => {
      console.log("Event: SIMULATION_COMPLETE - stopping simulation");
      setIsSimulating(false);
      setSimulationComplete(true);

      // Stop the update interval to freeze time display
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    });

    return () => {
      engine.stop();
    };
  }, []);

  // Track people changes and dispatch timeline events
  useEffect(() => {
    people.forEach((person) => {
      const previousStage = previousPeopleRef.current.get(person.id);
      const currentStage = person.stage;

      // Only dispatch event if stage has changed
      if (previousStage !== currentStage) {
        console.log(
          `Traveler ${person.id} stage changed: ${previousStage} -> ${currentStage}`
        );

        timelineEvents.addEvent({
          travelerId: person.id,
          eventType: `stage_${currentStage}`,
          timestamp: Date.now(),
          stage: currentStage,
          data: { x: person.x, y: person.y, hasBox: person.hasBox },
        });

        // Update the previous stage tracker
        previousPeopleRef.current.set(person.id, currentStage);
      }
    });

    // Clean up removed travelers
    const currentTravelerIds = new Set(people.map((p) => p.id));
    for (const [id] of previousPeopleRef.current) {
      if (!currentTravelerIds.has(id)) {
        // Traveler completed their journey
        timelineEvents.addEvent({
          travelerId: id,
          eventType: "stage_completed",
          timestamp: Date.now(),
          stage: "completed",
        });
        previousPeopleRef.current.delete(id);
      }
    }
  }, [people, timelineEvents]);

  // Update processing stations in engine when they change
  useEffect(() => {
    const engine = engineRef.current;
    engine.clearProcessingStations();

    processingStations.forEach((station) => {
      engine.addProcessingStation(station.id, station.x + 15, station.y + 15);
    });

    engine.updateLocations(
      { x: locationA.x + 15, y: locationA.y + 15 },
      { x: locationC.x + 15, y: locationC.y + 15 }
    );
  }, [locationA, locationC, processingStations]);

  // Generate processing stations based on count
  const generateProcessingStations = (count: number): ProcessingStation[] => {
    const stations: ProcessingStation[] = [];
    const baseY = 290;
    const startX = 180;
    const spacing = 100;

    for (let i = 0; i < count; i++) {
      stations.push({
        id: `S${i + 1}`,
        x: startX + i * spacing,
        y: baseY,
      });
    }

    return stations;
  };

  const startSimulation = () => {
    if (isSimulating) return;

    setIsSimulating(true);
    setSimulationComplete(false);

    const engine = engineRef.current;
    engine.setSimulationSpeed(speed);

    if (!engine.getHasBeenInitialized()) {
      console.log(`Spawning ${startingTravelers} initial travelers`);
      for (let i = 0; i < startingTravelers; i++) {
        const id = nextIdRef.current++;
        engine.addTraveler(id);
      }
    }

    engine.start();

    updateIntervalRef.current = setInterval(() => {
      setSimulationTime(engine.getCurrentTime());
      setPeople(engine.getTravelerStates());
      setBoxStatus(engine.getBoxStatus());
    }, 50);

    console.log("Started discrete event simulation");
  };

  const stopSimulation = () => {
    setIsSimulating(false);
    engineRef.current.stop();

    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }

    console.log("Simulation stopped from context");
  };

  const resetSimulation = () => {
    stopSimulation();
    engineRef.current.reset();
    setPeople([]);
    setSimulationTime(0);
    setBoxStatus({ availableBoxes: startingBoxes, totalProcessed: 0 });
    nextIdRef.current = 1;
    setGanttClearTrigger((prev) => prev + 1);
    previousPeopleRef.current.clear();
    timelineEvents.clearAllEvents();
  };

  const addTraveler = () => {
    const id = nextIdRef.current++;
    engineRef.current.addTraveler(id);
    setPeople(engineRef.current.getTravelerStates());
  };

  const setSpeed = (newSpeed: number) => {
    setSpeedState(newSpeed);
    engineRef.current.setSimulationSpeed(newSpeed);
  };

  const setStartingTravelers = (count: number) => {
    if (!isSimulating) {
      setStartingTravelersState(count);
    }
  };

  const setStartingBoxes = (count: number) => {
    if (!isSimulating) {
      setStartingBoxesState(count);
      engineRef.current.setMaxBoxes(count);
      setBoxStatus((prev) => ({ ...prev, availableBoxes: count }));
    }
  };

  const setStartingStations = (count: number) => {
    if (!isSimulating) {
      setStartingStationsState(count);
      setProcessingStations(generateProcessingStations(count));
    }
  };

  const updateLocationA = (x: number, y: number) => {
    setLocationA((prev) => ({ ...prev, x, y }));
  };

  const updateLocationC = (x: number, y: number) => {
    setLocationC((prev) => ({ ...prev, x, y }));
  };

  const updateProcessingStationLocation = (
    id: string,
    x: number,
    y: number
  ) => {
    setProcessingStations((prev) =>
      prev.map((station) =>
        station.id === id ? { ...station, x, y } : station
      )
    );
  };

  return (
    <SimulationContext.Provider
      value={{
        people,
        locationA,
        locationC,
        processingStations,
        isSimulating,
        simulationComplete,
        speed,
        simulationTime,
        boxStatus,
        startingTravelers,
        startingBoxes,
        startingStations,
        startSimulation,
        stopSimulation,
        resetSimulation,
        addTraveler,
        setSpeed,
        setStartingTravelers,
        setStartingBoxes,
        setStartingStations,
        updateLocationA,
        updateLocationC,
        updateProcessingStationLocation,
        ganttClearTrigger,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};

// Export the wrapper that ensures timeline context is available
export const SimulationProvider: React.FC<SimulationProviderProps> = ({
  children,
}) => {
  return <SimulationProviderInner>{children}</SimulationProviderInner>;
};
