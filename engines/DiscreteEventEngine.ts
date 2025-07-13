export interface SimulationEvent {
  id: string;
  time: number;
  type: 'TRAVELER_START_JOURNEY' | 'TRAVELER_ARRIVE_AT_C' | 'TRAVELER_COLLECT_BOX' | 'TRAVELER_ARRIVE_AT_STATION' | 'TRAVELER_FINISH_PROCESSING' | 'TRAVELER_ARRIVE_AT_A' | 'SIMULATION_COMPLETE';
  entityId: number;
  data?: any;
}

export interface TravelerState {
  id: number;
  currentLocation: string; // Now supports dynamic station IDs
  stage: string; // Dynamic stage names
  journeyStartTime: number;
  currentSegmentStartTime: number;
  x: number;
  y: number;
  isActive: boolean;
  targetStation?: string; // Dynamic station ID
  hasBox?: boolean;
  boxesProcessed?: number;
}

export interface ProcessingStation {
  id: string;
  x: number;
  y: number;
  state: 'available' | 'claimed' | 'active';
  currentProcessingTraveler: number | null;
  claimedByTraveler: number | null;
  queue: number[];
}

export class DiscreteEventEngine {
  private eventQueue: SimulationEvent[] = [];
  private currentTime: number = 0;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private eventHandlers: Map<string, (event: SimulationEvent) => void> = new Map();
  private nextEventId: number = 1;
  private travelers: Map<number, TravelerState> = new Map();
  
  // Simulation parameters
  private locationA = { x: 55, y: 105 };
  private locationC = { x: 100, y: 200 };
  private processingStations: Map<string, ProcessingStation> = new Map();
  private simulationSpeed = 1;
  private baseTravelerSpeed = 2;
  private processingDuration = 2000;
  private collectionDuration = 1000;

  // Box management
  private availableBoxes: number = 5;
  private totalBoxesProcessed: number = 0;
  private maxBoxes: number = 5;
  private hasBeenInitialized: boolean = false;

  constructor() {}

  // Processing station management
  addProcessingStation(id: string, x: number, y: number): void {
    this.processingStations.set(id, {
      id,
      x,
      y,
      state: 'available',
      currentProcessingTraveler: null,
      claimedByTraveler: null,
      queue: []
    });
  }

  removeProcessingStation(id: string): void {
    this.processingStations.delete(id);
  }

  updateProcessingStationLocation(id: string, x: number, y: number): void {
    const station = this.processingStations.get(id);
    if (station) {
      station.x = x;
      station.y = y;
    }
  }

  getProcessingStations(): ProcessingStation[] {
    return Array.from(this.processingStations.values());
  }

  clearProcessingStations(): void {
    this.processingStations.clear();
  }

  // Core event queue management
  scheduleEvent(delay: number, type: SimulationEvent['type'], entityId: number, data?: any): string {
    const event: SimulationEvent = {
      id: `event-${this.nextEventId++}`,
      time: this.currentTime + delay,
      type,
      entityId,
      data
    };
    
    // Insert in chronological order
    const insertIndex = this.eventQueue.findIndex(e => e.time > event.time);
    if (insertIndex === -1) {
      this.eventQueue.push(event);
    } else {
      this.eventQueue.splice(insertIndex, 0, event);
    }
    
    console.log(`Scheduled ${type} for traveler ${entityId} at time ${event.time}`);
    return event.id;
  }

  onEvent(eventType: string, handler: (event: SimulationEvent) => void): void {
    this.eventHandlers.set(eventType, handler);
  }

  // Traveler management
  addTraveler(id: number): void {
    const traveler: TravelerState = {
      id,
      currentLocation: 'A',
      stage: 'idle',
      journeyStartTime: this.currentTime,
      currentSegmentStartTime: this.currentTime,
      x: this.locationA.x,
      y: this.locationA.y,
      isActive: true,
      hasBox: false,
      boxesProcessed: 0
    };
    
    this.travelers.set(id, traveler);
    
    // Only start journey if there are boxes available
    if (this.availableBoxes > 0) {
      this.scheduleEvent(100, 'TRAVELER_START_JOURNEY', id);
    }
  }

  setMaxBoxes(count: number): void {
    this.maxBoxes = count;
    this.availableBoxes = count;
    console.log(`Max boxes set to ${count}`);
  }

  private checkSimulationComplete(): void {
    // Check if all boxes are processed and all travelers have returned
    if (this.totalBoxesProcessed >= this.maxBoxes && this.travelers.size === 0) {
      console.log('All boxes processed and all travelers returned. Simulation complete!');
      this.scheduleEvent(100, 'SIMULATION_COMPLETE', 0);
    }
  }

  private selectTargetStation(): string | null {
    if (this.processingStations.size === 0) return null;
    
    let bestStation = null;
    let minLoad = Infinity;
    
    for (const station of this.processingStations.values()) {
      // Only consider truly available stations (not claimed or active)
      if (station.state !== 'available') continue;
      
      // For available stations, load should always be 0 since no one is using them
      const load = 0; // Available stations have no load
      if (load < minLoad) {
        minLoad = load;
        bestStation = station.id;
      }
    }
    
    return bestStation;
  }

  private claimStation(stationId: string, travelerId: number): boolean {
    const station = this.processingStations.get(stationId);
    if (!station) return false;
    
    // Double-check that station is still available
    if (station.state !== 'available') {
      console.log(`Station ${stationId} is no longer available (state: ${station.state})`);
      return false;
    }
    
    // Claim the station atomically
    station.state = 'claimed';
    station.claimedByTraveler = travelerId;
    console.log(`Traveler ${travelerId} successfully claimed station ${stationId}`);
    return true;
  }

  private calculateTravelTime(fromX: number, fromY: number, toX: number, toY: number): number {
    const distance = Math.sqrt((toX - fromX) ** 2 + (toY - fromY) ** 2);
    return Math.max((distance / this.baseTravelerSpeed) * 20, 100);
  }

  // Core event processing
  private processEvent(event: SimulationEvent): void {
    const traveler = this.travelers.get(event.entityId);
    
    switch (event.type) {
      case 'TRAVELER_START_JOURNEY':
        if (!traveler || !traveler.isActive) return;
        
        if (this.availableBoxes <= 0) {
          console.log(`Traveler ${event.entityId} cannot start - no boxes available`);
          traveler.stage = 'returningToA';
          traveler.currentLocation = 'TRAVELING_TO_A';
          traveler.currentSegmentStartTime = this.currentTime;
          
          const travelTimeToA = this.calculateTravelTime(
            traveler.x, traveler.y,
            this.locationA.x, this.locationA.y
          );
          this.scheduleEvent(travelTimeToA, 'TRAVELER_ARRIVE_AT_A', event.entityId);
          return;
        }
        
        traveler.stage = 'movingToC';
        traveler.currentLocation = 'TRAVELING_TO_C';
        traveler.currentSegmentStartTime = this.currentTime;
        
        const initialTravelTimeToC = this.calculateTravelTime(
          traveler.x, traveler.y,
          this.locationC.x, this.locationC.y
        );
        this.scheduleEvent(initialTravelTimeToC, 'TRAVELER_ARRIVE_AT_C', event.entityId);
        console.log(`Traveler ${event.entityId} heading to C (boxes available: ${this.availableBoxes})`);
        break;

      case 'TRAVELER_ARRIVE_AT_C':
        if (!traveler || !traveler.isActive) return;
        
        traveler.x = this.locationC.x;
        traveler.y = this.locationC.y;
        traveler.currentLocation = 'C';
        traveler.currentSegmentStartTime = this.currentTime;
        
        if (this.availableBoxes <= 0) {
          console.log(`Traveler ${event.entityId} arrived at C but no boxes left - returning to A`);
          traveler.stage = 'returningToA';
          traveler.currentLocation = 'TRAVELING_TO_A';
          traveler.currentSegmentStartTime = this.currentTime;
          const travelTimeToAFromC = this.calculateTravelTime(
            this.locationC.x, this.locationC.y,
            this.locationA.x, this.locationA.y
          );
          this.scheduleEvent(travelTimeToAFromC, 'TRAVELER_ARRIVE_AT_A', event.entityId);
          return;
        }
        
        traveler.stage = 'collectingAtC';
        this.scheduleEvent(this.collectionDuration, 'TRAVELER_COLLECT_BOX', event.entityId);
        console.log(`Traveler ${event.entityId} collecting box at C`);
        break;

      case 'TRAVELER_COLLECT_BOX':
        if (!traveler || !traveler.isActive) return;
        
        if (this.availableBoxes <= 0) {
          console.log(`Traveler ${event.entityId} tried to collect but no boxes left - returning to A`);
          traveler.stage = 'returningToA';
          traveler.currentLocation = 'TRAVELING_TO_A';
          traveler.currentSegmentStartTime = this.currentTime;
          const travelTimeToAAfterCollect = this.calculateTravelTime(
            this.locationC.x, this.locationC.y,
            this.locationA.x, this.locationA.y
          );
          this.scheduleEvent(travelTimeToAAfterCollect, 'TRAVELER_ARRIVE_AT_A', event.entityId);
          return;
        }
        
        this.availableBoxes--;
        traveler.hasBox = true;
        
        const targetStation = this.selectTargetStation();
        if (!targetStation) {
          console.log(`Traveler ${event.entityId} no available processing stations - returning to A`);
          traveler.stage = 'returningToA';
          traveler.currentLocation = 'TRAVELING_TO_A';
          traveler.currentSegmentStartTime = this.currentTime;
          const travelTimeToANoStations = this.calculateTravelTime(
            this.locationC.x, this.locationC.y,
            this.locationA.x, this.locationA.y
          );
          this.scheduleEvent(travelTimeToANoStations, 'TRAVELER_ARRIVE_AT_A', event.entityId);
          return;
        }
        
        // Attempt to claim the selected station
        const claimSuccessful = this.claimStation(targetStation, event.entityId);
        if (!claimSuccessful) {
          console.log(`Traveler ${event.entityId} failed to claim station ${targetStation} - trying again`);
          // Put the box back and try again
          this.availableBoxes++;
          traveler.hasBox = false;
          // Schedule another attempt to collect a box (which will trigger station selection again)
          this.scheduleEvent(100, 'TRAVELER_COLLECT_BOX', event.entityId);
          return;
        }
        
        traveler.targetStation = targetStation;
        traveler.currentSegmentStartTime = this.currentTime;
        traveler.stage = `movingTo${targetStation}`;
        traveler.currentLocation = `TRAVELING_TO_${targetStation}`;
        
        const station = this.processingStations.get(targetStation);
        if (station) {
          const travelTimeToStation = this.calculateTravelTime(
            this.locationC.x, this.locationC.y,
            station.x, station.y
          );
          this.scheduleEvent(travelTimeToStation, 'TRAVELER_ARRIVE_AT_STATION', event.entityId, { stationId: targetStation });
        }
        
        console.log(`Traveler ${event.entityId} collected box, heading to claimed ${targetStation}`);
        break;

      case 'TRAVELER_ARRIVE_AT_STATION':
        if (!traveler || !traveler.isActive) return;
        
        const stationId = event.data?.stationId || traveler.targetStation;
        const arrivalStation = this.processingStations.get(stationId);
        if (!arrivalStation) return;
        
        // Verify this traveler has claim on the station
        if (arrivalStation.claimedByTraveler !== event.entityId) {
          console.log(`Traveler ${event.entityId} arrived at ${stationId} but doesn't have claim - returning to A`);
          traveler.stage = 'returningToA';
          traveler.currentLocation = 'TRAVELING_TO_A';
          traveler.currentSegmentStartTime = this.currentTime;
          const travelTimeToA = this.calculateTravelTime(
            arrivalStation.x, arrivalStation.y,
            this.locationA.x, this.locationA.y
          );
          this.scheduleEvent(travelTimeToA, 'TRAVELER_ARRIVE_AT_A', event.entityId);
          return;
        }
        
        traveler.x = arrivalStation.x;
        traveler.y = arrivalStation.y;
        traveler.currentLocation = stationId;
        traveler.currentSegmentStartTime = this.currentTime;
        
        // Start processing immediately since station is claimed by this traveler
        arrivalStation.state = 'active';
        arrivalStation.currentProcessingTraveler = event.entityId;
        traveler.stage = `processingAt${stationId}`;
        this.scheduleEvent(this.processingDuration, 'TRAVELER_FINISH_PROCESSING', event.entityId, { stationId });
        console.log(`Traveler ${event.entityId} started processing at ${stationId} (station now active)`);
        break;

      case 'TRAVELER_FINISH_PROCESSING':
        if (!traveler || !traveler.isActive) return;
        
        const processingStationId = event.data?.stationId || traveler.targetStation;
        const processingStation = this.processingStations.get(processingStationId);
        if (!processingStation) return;
        
        traveler.hasBox = false;
        traveler.boxesProcessed = (traveler.boxesProcessed || 0) + 1;
        this.totalBoxesProcessed++;
        
        // Release the station
        processingStation.state = 'available';
        processingStation.currentProcessingTraveler = null;
        processingStation.claimedByTraveler = null;
        
        console.log(`Traveler ${event.entityId} finished processing at ${processingStationId} (station now available) (total processed: ${this.totalBoxesProcessed}/${this.maxBoxes})`);
        
        // Note: No queue processing needed since stations must be claimed first
        
        // Check if all boxes have been processed
        if (this.totalBoxesProcessed >= this.maxBoxes) {
          // All boxes processed - return directly to A
          console.log(`Traveler ${event.entityId} - all boxes processed, returning directly to A`);
          traveler.stage = 'returningToA';
          traveler.currentLocation = 'TRAVELING_TO_A';
          traveler.currentSegmentStartTime = this.currentTime;
          
          const directTravelTimeToA = this.calculateTravelTime(
            processingStation.x, processingStation.y,
            this.locationA.x, this.locationA.y
          );
          this.scheduleEvent(directTravelTimeToA, 'TRAVELER_ARRIVE_AT_A', event.entityId);
        } else {
          // More boxes available - return to C first
          console.log(`Traveler ${event.entityId} returning to C after processing`);
          traveler.stage = 'returningToC';
          traveler.currentLocation = 'TRAVELING_TO_C';
          traveler.currentSegmentStartTime = this.currentTime;
          
          const returnTravelTimeToC = this.calculateTravelTime(
            processingStation.x, processingStation.y,
            this.locationC.x, this.locationC.y
          );
          
          this.scheduleEvent(returnTravelTimeToC, 'TRAVELER_ARRIVE_AT_C', event.entityId, { postProcessing: true });
        }
        break;

      case 'TRAVELER_ARRIVE_AT_A':
        if (!traveler || !traveler.isActive) return;
        
        traveler.x = this.locationA.x;
        traveler.y = this.locationA.y;
        traveler.currentLocation = 'A';
        traveler.stage = 'completed';
        
        console.log(`Traveler ${event.entityId} completed journey and arrived at A (processed ${traveler.boxesProcessed || 0} boxes)`);
        
        // Remove traveler immediately and check for simulation completion
        traveler.isActive = false;
        this.travelers.delete(event.entityId);
        
        // Check if simulation should complete
        this.checkSimulationComplete();
        break;

      case 'SIMULATION_COMPLETE':
        console.log('Simulation automatically stopping - all work complete!');
        this.stop();
        break;

      // Handle special case for post-processing arrival at C
      case 'TRAVELER_ARRIVE_AT_C':
        if (event.data?.postProcessing) {
          if (!traveler || !traveler.isActive) return;
          
          traveler.x = this.locationC.x;
          traveler.y = this.locationC.y;
          traveler.currentLocation = 'C';
          traveler.currentSegmentStartTime = this.currentTime;
          
          // Check if more boxes are available for another round
          if (this.availableBoxes > 0 && this.totalBoxesProcessed < this.maxBoxes) {
            console.log(`Traveler ${event.entityId} at C - more boxes available, collecting another`);
            traveler.stage = 'collectingAtC';
            this.scheduleEvent(this.collectionDuration, 'TRAVELER_COLLECT_BOX', event.entityId);
          } else {
            console.log(`Traveler ${event.entityId} at C - no more boxes or all processed, returning to A to complete journey`);
            traveler.stage = 'returningToA';
            traveler.currentLocation = 'TRAVELING_TO_A';
            traveler.currentSegmentStartTime = this.currentTime;
            
            const finalTravelTimeToA = this.calculateTravelTime(
              this.locationC.x, this.locationC.y,
              this.locationA.x, this.locationA.y
            );
            this.scheduleEvent(finalTravelTimeToA, 'TRAVELER_ARRIVE_AT_A', event.entityId);
          }
          
          // Notify observers for this special case
          const handler = this.eventHandlers.get(event.type);
          if (handler) {
            handler(event);
          }
          return;
        }
        break;
    }

    // Notify observers
    const handler = this.eventHandlers.get(event.type);
    if (handler) {
      handler(event);
    }
  }

  // Get current state for rendering
  getTravelerStates(): TravelerState[] {
    const states: TravelerState[] = [];
    
    for (const traveler of this.travelers.values()) {
      if (!traveler.isActive) continue;
      
      const currentState = { ...traveler };
      
      // Calculate interpolated position for traveling travelers
      if (traveler.currentLocation === 'TRAVELING_TO_C') {
        const elapsed = this.currentTime - traveler.currentSegmentStartTime;
        let startX, startY;
        
        // Determine starting position based on stage
        if (traveler.stage === 'returningToC') {
          // Coming from a processing station
          if (traveler.targetStation) {
            const station = this.processingStations.get(traveler.targetStation);
            if (station) {
              startX = station.x;
              startY = station.y;
            } else {
              startX = this.locationA.x;
              startY = this.locationA.y;
            }
          } else {
            startX = this.locationA.x;
            startY = this.locationA.y;
          }
        } else {
          // Initial journey from A
          startX = this.locationA.x;
          startY = this.locationA.y;
        }
        
        const totalTime = this.calculateTravelTime(startX, startY, this.locationC.x, this.locationC.y);
        const progress = Math.min(elapsed / totalTime, 1);
        
        currentState.x = startX + (this.locationC.x - startX) * progress;
        currentState.y = startY + (this.locationC.y - startY) * progress;
      } else if (traveler.currentLocation.startsWith('TRAVELING_TO_') && traveler.targetStation) {
        const targetStationId = traveler.targetStation;
        const targetStation = this.processingStations.get(targetStationId);
        
        if (targetStation) {
          const elapsed = this.currentTime - traveler.currentSegmentStartTime;
          const startX = this.locationC.x;
          const startY = this.locationC.y;
          
          const totalTime = this.calculateTravelTime(startX, startY, targetStation.x, targetStation.y);
          const progress = Math.min(elapsed / totalTime, 1);
          
          currentState.x = startX + (targetStation.x - startX) * progress;
          currentState.y = startY + (targetStation.y - startY) * progress;
        }
      } else if (traveler.currentLocation === 'TRAVELING_TO_A') {
        const elapsed = this.currentTime - traveler.currentSegmentStartTime;
        const totalTime = this.calculateTravelTime(this.locationC.x, this.locationC.y, this.locationA.x, this.locationA.y);
        const progress = Math.min(elapsed / totalTime, 1);
        
        currentState.x = this.locationC.x + (this.locationA.x - this.locationC.x) * progress;
        currentState.y = this.locationC.y + (this.locationA.y - this.locationC.y) * progress;
      }
      
      states.push(currentState);
    }
    
    return states;
  }

  // Simulation control
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.hasBeenInitialized = true; // Mark as initialized after first start
    console.log('Starting discrete event simulation');
    
    this.intervalId = setInterval(() => {
      this.step();
    }, 50);
  }

  step(): void {
    if (!this.isRunning) return;
    
    // Process all events due at current time
    while (this.eventQueue.length > 0 && this.eventQueue[0].time <= this.currentTime) {
      const event = this.eventQueue.shift()!;
      this.processEvent(event);
    }
    
    // Only advance time if simulation is still running
    if (this.isRunning) {
      this.currentTime += 50 * this.simulationSpeed;
    }
  }

  stop(): void {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('Simulation stopped');
  }

  reset(): void {
    this.stop();
    this.eventQueue = [];
    this.travelers.clear();
    
    // Reset all processing stations
    for (const station of this.processingStations.values()) {
      station.state = 'available';
      station.currentProcessingTraveler = null;
      station.claimedByTraveler = null;
      station.queue = [];
    }
    
    this.availableBoxes = this.maxBoxes;
    this.totalBoxesProcessed = 0;
    this.currentTime = 0;
    this.nextEventId = 1;
    this.hasBeenInitialized = false;
  }

  getHasBeenInitialized(): boolean {
    return this.hasBeenInitialized;
  }

  // Getters
  getCurrentTime(): number {
    return this.currentTime;
  }

  getQueueLength(): number {
    return this.eventQueue.length;
  }

  setSimulationSpeed(newSpeed: number): void {
    this.simulationSpeed = newSpeed;
    console.log(`Simulation speed set to ${newSpeed}x`);
  }

  getSimulationSpeed(): number {
    return this.simulationSpeed;
  }

  updateLocations(locA: {x: number, y: number}, locC: {x: number, y: number}): void {
    this.locationA = locA;
    this.locationC = locC;
  }

  getQueueStatus(): any {
    const status: any = {};
    for (const station of this.processingStations.values()) {
      status[`${station.id}QueueLength`] = station.queue.length;
      status[`processingTraveler${station.id}`] = station.currentProcessingTraveler;
    }
    return status;
  }

  // Add getter for box status
  getBoxStatus(): { availableBoxes: number; totalProcessed: number } {
    return {
      availableBoxes: this.availableBoxes,
      totalProcessed: this.totalBoxesProcessed
    };
  }
}