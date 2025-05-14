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

const persistSimulations = async (sims: SavedSimulation[]) => {
  await AsyncStorage.setItem("savedSimulations", JSON.stringify(sims));
};

export interface SavedSimulation {
  id: string;
  name: string;
  date: string;
  parkName: string;
  totalVisitors: number;
  totalRides: number;
  data: ThemeParkData;
}

interface SavedSimulationsContextType {
  savedSimulations: SavedSimulation[];
  saveSimulation: (parkName: string, data: ThemeParkData) => Promise<string>;
  loadSimulation: (id: string) => SavedSimulation | undefined;
  deleteSimulation: (id: string) => Promise<void>;
  isLoading: boolean;
  forceRefresh: () => Promise<void>;
}

const SavedSimulationsContext = createContext<SavedSimulationsContextType>({
  savedSimulations: [],
  saveSimulation: async () => "",
  loadSimulation: () => undefined,
  deleteSimulation: async () => {},
  isLoading: false,
  forceRefresh: async () => {},
});

export const SavedSimulationsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [savedSimulations, setSavedSimulations] = useState<SavedSimulation[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true); // start true
  const didInitialLoad = useRef(false);
  const isMounted = useRef(true);

  /* ---------- initial load --------- */
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("savedSimulations");
        const sims: SavedSimulation[] = raw ? JSON.parse(raw) : [];
        if (isMounted.current) setSavedSimulations(sims);
      } catch (e) {
        console.warn("Could not load simulations", e);
      } finally {
        if (isMounted.current) {
          didInitialLoad.current = true;
          setIsLoading(false);
        }
      }
    })();
    return () => {
      isMounted.current = false;
    };
  }, []);

  /* ---------- create ---------- */
  const saveSimulation = async (parkName: string, data: ThemeParkData) => {
    const totalRides = data.rides.reduce((s, r) => s + r.totalRiders, 0);
    const newSim: SavedSimulation = {
      id: Date.now().toString(),
      name: `${parkName} – ${new Date().toLocaleDateString()}`,
      date: new Date().toISOString(),
      parkName,
      totalVisitors: data.totalVisitors,
      totalRides,
      data,
    };
    const next = [newSim, ...savedSimulations];
    setSavedSimulations(next);
    await persistSimulations(next); // ‼ guarantees write finished
    return newSim.id;
  };

  /* ---------- read helpers ---------- */
  const loadSimulation = (id: string) =>
    savedSimulations.find((s) => s.id === id);

  /* ---------- delete ---------- */
  const deleteSimulation = async (id: string) => {
    const next = savedSimulations.filter((s) => s.id !== id);
    setSavedSimulations(next);
    await persistSimulations(next); // keep disk in sync
  };

  /* ---------- external refresh ---------- */
  const forceRefresh = async () => {
    const raw = await AsyncStorage.getItem("savedSimulations");
    setSavedSimulations(raw ? JSON.parse(raw) : []);
  };

  /* ---------- keep disk in sync on future edits ---------- */
  useEffect(() => {
    if (didInitialLoad.current) {
      persistSimulations(savedSimulations).catch(console.error);
    }
  }, [savedSimulations]);

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

export const useSavedSimulations = () => useContext(SavedSimulationsContext);
