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

interface Location {
  id: string;
  x: number;
  y: number;
}

interface SimulationContextType {
  people: TravelerState[];
  locationA: Location;
  locationC: Location;
  locationB1: Location;
  locationB2: Location;
  isSimulating: boolean;
  simulationComplete: boolean;
  speed: number;
  simulationTime: number;
  boxStatus: { availableBoxes: number; totalProcessed: number };
  startingTravelers: number;
  startingBoxes: number;
  startSimulation: () => void;
  stopSimulation: () => void;
  resetSimulation: () => void;
  addTraveler: () => void;
  setSpeed: (speed: number) => void;
  setStartingTravelers: (count: number) => void;
  setStartingBoxes: (count: number) => void;
  updateLocationA: (x: number, y: number) => void;
  updateLocationC: (x: number, y: number) => void;
  updateLocationB1: (x: number, y: number) => void;
  updateLocationB2: (x: number, y: number) => void;
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

export const SimulationProvider: React.FC<SimulationProviderProps> = ({
  children,
}) => {
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
  const [locationB1, setLocationB1] = useState<Location>({
    id: "B1",
    x: 180,
    y: 290,
  });
  const [locationB2, setLocationB2] = useState<Location>({
    id: "B2",
    x: 280,
    y: 290,
  });
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationComplete, setSimulationComplete] = useState(false);
  const [speed, setSpeedState] = useState(1); // This is now simulation speed
  const [ganttClearTrigger, setGanttClearTrigger] = useState(0);
  const [simulationTime, setSimulationTime] = useState(0);
  const [people, setPeople] = useState<TravelerState[]>([]);
  const [boxStatus, setBoxStatus] = useState({
    availableBoxes: 5,
    totalProcessed: 0,
  });
  const [startingTravelers, setStartingTravelersState] = useState(2);
  const [startingBoxes, setStartingBoxesState] = useState(5);

  const engineRef = useRef<DiscreteEventEngine>(new DiscreteEventEngine());
  const nextIdRef = useRef(1);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Set up event observers
  useEffect(() => {
    const engine = engineRef.current;

    // Observer for all events - used by Gantt chart (update event names)
    engine.onEvent("TRAVELER_START_JOURNEY", () => {
      console.log("Event: TRAVELER_START_JOURNEY");
    });

    engine.onEvent("TRAVELER_ARRIVE_AT_C", () => {
      console.log("Event: TRAVELER_ARRIVE_AT_C");
    });

    engine.onEvent("TRAVELER_COLLECT_BOX", () => {
      console.log("Event: TRAVELER_COLLECT_BOX");
    });

    engine.onEvent("TRAVELER_ARRIVE_AT_B1", () => {
      console.log("Event: TRAVELER_ARRIVE_AT_B1");
    });

    engine.onEvent("TRAVELER_ARRIVE_AT_B2", () => {
      console.log("Event: TRAVELER_ARRIVE_AT_B2");
    });

    engine.onEvent("TRAVELER_FINISH_PROCESSING_B1", () => {
      console.log("Event: TRAVELER_FINISH_PROCESSING_B1");
    });

    engine.onEvent("TRAVELER_FINISH_PROCESSING_B2", () => {
      console.log("Event: TRAVELER_FINISH_PROCESSING_B2");
    });

    engine.onEvent("TRAVELER_ARRIVE_AT_A", () => {
      console.log("Event: TRAVELER_ARRIVE_AT_A");
    });

    engine.onEvent("SIMULATION_COMPLETE", () => {
      console.log("Event: SIMULATION_COMPLETE");
      setIsSimulating(false);
      setSimulationComplete(true);
    });

    return () => {
      engine.stop();
    };
  }, []);

  // Update locations in engine when they change
  useEffect(() => {
    engineRef.current.updateLocations(
      { x: locationA.x + 15, y: locationA.y + 15 },
      { x: locationC.x + 15, y: locationC.y + 15 },
      { x: locationB1.x + 15, y: locationB1.y + 15 },
      { x: locationB2.x + 15, y: locationB2.y + 15 }
    );
  }, [locationA, locationC, locationB1, locationB2]);

  const startSimulation = () => {
    if (isSimulating) return;

    setIsSimulating(true);
    setSimulationComplete(false);

    const engine = engineRef.current;
    engine.setSimulationSpeed(speed); // Use simulation speed

    // Only spawn initial travelers if this is the first time starting
    if (!engine.getHasBeenInitialized()) {
      console.log(`Spawning ${startingTravelers} initial travelers`);
      for (let i = 0; i < startingTravelers; i++) {
        const id = nextIdRef.current++;
        engine.addTraveler(id);
      }
    }

    engine.start();

    // Update display at regular intervals
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
  };

  const resetSimulation = () => {
    stopSimulation();
    engineRef.current.reset();
    setPeople([]);
    setSimulationTime(0);
    setBoxStatus({ availableBoxes: startingBoxes, totalProcessed: 0 });
    nextIdRef.current = 1;
    setGanttClearTrigger((prev) => prev + 1);
  };

  const addTraveler = () => {
    const id = nextIdRef.current++;
    engineRef.current.addTraveler(id);

    // Update display immediately
    setPeople(engineRef.current.getTravelerStates());
  };

  const setSpeed = (newSpeed: number) => {
    setSpeedState(newSpeed);
    engineRef.current.setSimulationSpeed(newSpeed); // Update simulation speed
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

  const updateLocationA = (x: number, y: number) => {
    setLocationA((prev) => ({ ...prev, x, y }));
  };

  const updateLocationC = (x: number, y: number) => {
    setLocationC((prev) => ({ ...prev, x, y }));
  };

  const updateLocationB1 = (x: number, y: number) => {
    setLocationB1((prev) => ({ ...prev, x, y }));
  };

  const updateLocationB2 = (x: number, y: number) => {
    setLocationB2((prev) => ({ ...prev, x, y }));
  };

  return (
    <SimulationContext.Provider
      value={{
        people,
        locationA,
        locationC,
        locationB1,
        locationB2,
        isSimulating,
        simulationComplete,
        speed,
        simulationTime,
        boxStatus,
        startingTravelers,
        startingBoxes,
        startSimulation,
        stopSimulation,
        resetSimulation,
        addTraveler,
        setSpeed,
        setStartingTravelers,
        setStartingBoxes,
        updateLocationA,
        updateLocationC,
        updateLocationB1,
        updateLocationB2,
        ganttClearTrigger,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};
