import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeParkData } from "./ThemeParkContext";

// Define the structure for a saved simulation
export interface SavedSimulation {
  id: string;
  name: string;
  date: string;
  parkName: string;
  totalVisitors: number;
  totalRides: number;
  data: ThemeParkData;
}

// Define the context structure
interface SavedSimulationsContextType {
  savedSimulations: SavedSimulation[];
  saveSimulation: (parkName: string, data: ThemeParkData) => Promise<void>;
  loadSimulation: (id: string) => SavedSimulation | undefined;
  deleteSimulation: (id: string) => Promise<void>;
  isLoading: boolean;
  forceRefresh: () => Promise<void>;
}

// Create the context
const SavedSimulationsContext = createContext<SavedSimulationsContextType>({
  savedSimulations: [],
  saveSimulation: async () => {},
  loadSimulation: () => undefined,
  deleteSimulation: async () => {},
  isLoading: true,
  forceRefresh: async () => {},
});

// Create a provider component
export const SavedSimulationsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [savedSimulations, setSavedSimulations] = useState<SavedSimulation[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false); // Start with false instead of true
  const isInitialLoadDone = useRef(false);
  const isMounted = useRef(true);

  // Set up isMounted ref for cleanup
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Load saved simulations from storage
  const loadSavedSimulations = async () => {
    // Safety timeout to ensure isLoading eventually becomes false
    const safetyTimeout = setTimeout(() => {
      if (isMounted.current) {
        console.log("Safety timeout triggered - setting isLoading to false");
        setIsLoading(false);
      }
    }, 3000);

    if (isMounted.current) setIsLoading(true);

    try {
      console.log("Loading saved simulations from storage");
      const savedSimulationsJson = await AsyncStorage.getItem(
        "savedSimulations"
      );

      // Only update state if component is still mounted
      if (isMounted.current) {
        if (savedSimulationsJson) {
          const parsedData = JSON.parse(savedSimulationsJson);
          console.log(`Loaded ${parsedData.length} saved simulations`);
          setSavedSimulations(parsedData);
        } else {
          console.log("No saved simulations found in storage");
          setSavedSimulations([]);
        }
      }
    } catch (error) {
      console.error("Failed to load saved simulations:", error);
      // Ensure we set empty array on error to avoid null issues
      if (isMounted.current) setSavedSimulations([]);
    } finally {
      // Clear the safety timeout as we're done
      clearTimeout(safetyTimeout);

      // Only update state if component is still mounted
      if (isMounted.current) {
        console.log("Setting isLoading to false");
        setIsLoading(false);
        isInitialLoadDone.current = true;
      }
    }
  };

  // Load saved simulations from storage when component mounts
  useEffect(() => {
    loadSavedSimulations();
  }, []);

  // Force refresh function
  const forceRefresh = async () => {
    await loadSavedSimulations();
  };

  // Save to AsyncStorage whenever savedSimulations changes
  useEffect(() => {
    const saveToPersistentStorage = async () => {
      if (isInitialLoadDone.current) {
        try {
          await AsyncStorage.setItem(
            "savedSimulations",
            JSON.stringify(savedSimulations)
          );
        } catch (error) {
          console.error("Failed to save simulations to storage:", error);
        }
      }
    };

    saveToPersistentStorage();
  }, [savedSimulations]);

  // Function to save a simulation
  const saveSimulation = async (parkName: string, data: ThemeParkData) => {
    const totalRides = data.rides.reduce(
      (sum, ride) => sum + ride.totalRiders,
      0
    );

    const newSimulation: SavedSimulation = {
      id: Date.now().toString(),
      name: `${parkName} - ${new Date().toLocaleDateString()}`,
      date: new Date().toISOString(),
      parkName,
      totalVisitors: data.totalVisitors,
      totalRides,
      data,
    };

    setSavedSimulations((prev) => [newSimulation, ...prev]);
  };

  // Function to load a specific simulation
  const loadSimulation = (id: string) => {
    return savedSimulations.find((sim) => sim.id === id);
  };

  // Function to delete a simulation
  const deleteSimulation = async (id: string) => {
    setSavedSimulations((prev) => prev.filter((sim) => sim.id !== id));
  };

  return (
    <SavedSimulationsContext.Provider
      value={{
        savedSimulations,
        saveSimulation,
        loadSimulation,
        deleteSimulation,
        isLoading,
        forceRefresh,
      }}
    >
      {children}
    </SavedSimulationsContext.Provider>
  );
};

// Custom hook to use the saved simulations context
export const useSavedSimulations = () => useContext(SavedSimulationsContext);
