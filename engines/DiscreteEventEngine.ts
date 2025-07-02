export interface SimulationEvent {
  id: string;
  time: number;
  type: 'TRAVELER_START_JOURNEY' | 'TRAVELER_ARRIVE_AT_C' | 'TRAVELER_COLLECT_BOX' | 'TRAVELER_ARRIVE_AT_B1' | 'TRAVELER_ARRIVE_AT_B2' | 'TRAVELER_FINISH_PROCESSING_B1' | 'TRAVELER_FINISH_PROCESSING_B2' | 'TRAVELER_ARRIVE_AT_A' | 'SIMULATION_COMPLETE';
  entityId: number;
  data?: any;
}

export interface TravelerState {
  id: number;
  currentLocation: 'A' | 'C' | 'B1' | 'B2' | 'TRAVELING_TO_C' | 'TRAVELING_TO_B1' | 'TRAVELING_TO_B2' | 'TRAVELING_TO_A';
  stage: "idle" | "movingToC" | "collectingAtC" | "movingToB1" | "movingToB2" | "processingAtB1" | "processingAtB2" | "waitingAtB1" | "waitingAtB2" | "returningToA";
  journeyStartTime: number;
  currentSegmentStartTime: number;
  x: number;
  y: number;
  isActive: boolean;
  targetStation?: 'B1' | 'B2';
  hasBox?: boolean;
  boxesProcessed?: number;
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
  private locationC = { x: 100, y: 200 }; // New collection point
  private locationB1 = { x: 200, y: 305 };
  private locationB2 = { x: 300, y: 305 };
  private simulationSpeed = 1; // Simulation time multiplier
  private baseTravelerSpeed = 2; // Base traveler movement speed (unchanged by simulation speed)
  private processingDuration = 2000;
  private collectionDuration = 1000; // Time to collect box at C

  // Queueing logic for both stations
  private processingQueueB1: number[] = [];
  private processingQueueB2: number[] = [];
  private currentProcessingTravelerB1: number | null = null;
  private currentProcessingTravelerB2: number | null = null;

  // Box management
  private availableBoxes: number = 5; // Start with 5 boxes at C
  private totalBoxesProcessed: number = 0;
  private maxBoxes: number = 5; // Configurable max boxes
  private hasBeenInitialized: boolean = false; // Track if simulation has been initialized

  constructor() {}

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

  private calculateTravelTime(fromX: number, fromY: number, toX: number, toY: number): number {
    const distance = Math.sqrt((toX - fromX) ** 2 + (toY - fromY) ** 2);
    return Math.max((distance / this.baseTravelerSpeed) * 20, 100);
  }

  private selectTargetStation(): 'B1' | 'B2' {
    // Choose the station with fewer people (processing + waiting)
    const b1Load = (this.currentProcessingTravelerB1 ? 1 : 0) + this.processingQueueB1.length;
    const b2Load = (this.currentProcessingTravelerB2 ? 1 : 0) + this.processingQueueB2.length;
    
    console.log(`Station loads - B1: ${b1Load}, B2: ${b2Load}`);
    
    // If loads are equal, alternate between stations
    if (b1Load === b2Load) {
      return Math.random() < 0.5 ? 'B1' : 'B2';
    }
    
    return b1Load < b2Load ? 'B1' : 'B2';
  }

  private processEvent(event: SimulationEvent): void {
    const traveler = this.travelers.get(event.entityId);
    
    switch (event.type) {
      case 'TRAVELER_START_JOURNEY':
        if (!traveler || !traveler.isActive) return;
        
        // Check if there are boxes available before starting journey
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
        
        // Go to C to collect a box
        traveler.stage = 'movingToC';
        traveler.currentLocation = 'TRAVELING_TO_C';
        traveler.currentSegmentStartTime = this.currentTime;
        
        // Calculate travel time from current position to C
        const travelTimeToC = this.calculateTravelTime(
          traveler.x, traveler.y,
          this.locationC.x, this.locationC.y
        );
        this.scheduleEvent(travelTimeToC, 'TRAVELER_ARRIVE_AT_C', event.entityId);
        console.log(`Traveler ${event.entityId} heading to C (boxes available: ${this.availableBoxes})`);
        break;

      case 'TRAVELER_ARRIVE_AT_C':
        if (!traveler || !traveler.isActive) return;
        
        traveler.x = this.locationC.x;
        traveler.y = this.locationC.y;
        traveler.currentLocation = 'C';
        traveler.stage = 'collectingAtC';
        traveler.currentSegmentStartTime = this.currentTime;
        
        // Check if boxes are still available
        if (this.availableBoxes <= 0) {
          console.log(`Traveler ${event.entityId} arrived at C but no boxes left - going to A`);
          // Go directly to A
          traveler.stage = 'returningToA';
          traveler.currentLocation = 'TRAVELING_TO_A';
          const travelTimeToA = this.calculateTravelTime(
            this.locationC.x, this.locationC.y,
            this.locationA.x, this.locationA.y
          );
          this.scheduleEvent(travelTimeToA, 'TRAVELER_ARRIVE_AT_A', event.entityId);
          return;
        }
        
        // Start collecting if boxes are available
        traveler.stage = 'collectingAtC';
        this.scheduleEvent(this.collectionDuration, 'TRAVELER_COLLECT_BOX', event.entityId);
        console.log(`Traveler ${event.entityId} collecting box at C`);
        break;

      case 'TRAVELER_COLLECT_BOX':
        if (!traveler || !traveler.isActive) return;
        
        // Check if boxes are still available when collection completes
        if (this.availableBoxes <= 0) {
          console.log(`Traveler ${event.entityId} tried to collect but no boxes left`);
          traveler.stage = 'returningToA';
          traveler.currentLocation = 'TRAVELING_TO_A';
          const travelTimeToA = this.calculateTravelTime(
            this.locationC.x, this.locationC.y,
            this.locationA.x, this.locationA.y
          );
          this.scheduleEvent(travelTimeToA, 'TRAVELER_ARRIVE_AT_A', event.entityId);
          return;
        }
        
        // Successfully collect a box
        this.availableBoxes--;
        traveler.hasBox = true;
        
        // Select target station for processing
        const targetStation = this.selectTargetStation();
        traveler.targetStation = targetStation;
        traveler.currentSegmentStartTime = this.currentTime;
        
        console.log(`Traveler ${event.entityId} collected box (${this.availableBoxes} remaining), heading to ${targetStation}`);
        
        if (targetStation === 'B1') {
          traveler.stage = 'movingToB1';
          traveler.currentLocation = 'TRAVELING_TO_B1';
          const travelTime = this.calculateTravelTime(
            this.locationC.x, this.locationC.y,
            this.locationB1.x, this.locationB1.y
          );
          this.scheduleEvent(travelTime, 'TRAVELER_ARRIVE_AT_B1', event.entityId);
        } else {
          traveler.stage = 'movingToB2';
          traveler.currentLocation = 'TRAVELING_TO_B2';
          const travelTime = this.calculateTravelTime(
            this.locationC.x, this.locationC.y,
            this.locationB2.x, this.locationB2.y
          );
          this.scheduleEvent(travelTime, 'TRAVELER_ARRIVE_AT_B2', event.entityId);
        }
        break;

      case 'TRAVELER_ARRIVE_AT_B1':
        if (!traveler || !traveler.isActive) return;
        
        traveler.x = this.locationB1.x;
        traveler.y = this.locationB1.y;
        traveler.currentLocation = 'B1';
        traveler.currentSegmentStartTime = this.currentTime;
        
        // Only allow switching if this traveler came directly from C
        const canSwitchFromB1 = traveler.stage === 'movingToB1';
        
        if (canSwitchFromB1) {
          const b1LoadWithMe = (this.currentProcessingTravelerB1 ? 1 : 0) + this.processingQueueB1.length + 1;
          const b2LoadCurrent = (this.currentProcessingTravelerB2 ? 1 : 0) + this.processingQueueB2.length;
          
          console.log(`Traveler ${event.entityId} at B1 - B1 load (with me): ${b1LoadWithMe}, B2 load: ${b2LoadCurrent}`);
          
          // Only switch if B2 is significantly better (at least 2 people difference)
          if (b2LoadCurrent + 2 <= b1LoadWithMe) {
            console.log(`Traveler ${event.entityId} switching from B1 to B2`);
            traveler.targetStation = 'B2';
            traveler.stage = 'movingToB2';
            traveler.currentLocation = 'TRAVELING_TO_B2';
            
            const travelTime = this.calculateTravelTime(
              this.locationB1.x, this.locationB1.y,
              this.locationB2.x, this.locationB2.y
            );
            this.scheduleEvent(travelTime, 'TRAVELER_ARRIVE_AT_B2', event.entityId);
            break;
          }
        }
        
        // Stay at B1
        if (this.currentProcessingTravelerB1 === null) {
          this.currentProcessingTravelerB1 = event.entityId;
          traveler.stage = 'processingAtB1';
          this.scheduleEvent(this.processingDuration, 'TRAVELER_FINISH_PROCESSING_B1', event.entityId);
          console.log(`Traveler ${event.entityId} started processing at B1`);
        } else {
          traveler.stage = 'waitingAtB1';
          this.processingQueueB1.push(event.entityId);
          console.log(`Traveler ${event.entityId} joining B1 queue. Queue length: ${this.processingQueueB1.length}`);
        }
        break;

      case 'TRAVELER_ARRIVE_AT_B2':
        if (!traveler || !traveler.isActive) return;
        
        traveler.x = this.locationB2.x;
        traveler.y = this.locationB2.y;
        traveler.currentLocation = 'B2';
        traveler.currentSegmentStartTime = this.currentTime;
        
        // Only allow switching if this traveler came directly from C
        const canSwitchFromB2 = traveler.stage === 'movingToB2';
        
        if (canSwitchFromB2) {
          const b1LoadCurrent = (this.currentProcessingTravelerB1 ? 1 : 0) + this.processingQueueB1.length;
          const b2LoadWithMe = (this.currentProcessingTravelerB2 ? 1 : 0) + this.processingQueueB2.length + 1;
          
          console.log(`Traveler ${event.entityId} at B2 - B1 load: ${b1LoadCurrent}, B2 load (with me): ${b2LoadWithMe}`);
          
          // Only switch if B1 is significantly better (at least 2 people difference)
          if (b1LoadCurrent + 2 <= b2LoadWithMe) {
            console.log(`Traveler ${event.entityId} switching from B2 to B1`);
            traveler.targetStation = 'B1';
            traveler.stage = 'movingToB1';
            traveler.currentLocation = 'TRAVELING_TO_B1';
            
            const travelTime = this.calculateTravelTime(
              this.locationB2.x, this.locationB2.y,
              this.locationB1.x, this.locationB1.y
            );
            this.scheduleEvent(travelTime, 'TRAVELER_ARRIVE_AT_B1', event.entityId);
            break;
          }
        }
        
        // Stay at B2
        if (this.currentProcessingTravelerB2 === null) {
          this.currentProcessingTravelerB2 = event.entityId;
          traveler.stage = 'processingAtB2';
          this.scheduleEvent(this.processingDuration, 'TRAVELER_FINISH_PROCESSING_B2', event.entityId);
          console.log(`Traveler ${event.entityId} started processing at B2`);
        } else {
          traveler.stage = 'waitingAtB2';
          this.processingQueueB2.push(event.entityId);
          console.log(`Traveler ${event.entityId} joining B2 queue. Queue length: ${this.processingQueueB2.length}`);
        }
        break;

      case 'TRAVELER_FINISH_PROCESSING_B1':
        if (!traveler || !traveler.isActive) return;
        
        traveler.hasBox = false; // Processed the box
        traveler.boxesProcessed = (traveler.boxesProcessed || 0) + 1;
        this.totalBoxesProcessed++;
        this.currentProcessingTravelerB1 = null;
        
        console.log(`Traveler ${event.entityId} finished processing at B1 (total processed: ${this.totalBoxesProcessed}/5)`);
        
        // Process next in queue
        if (this.processingQueueB1.length > 0) {
          const nextTravelerId = this.processingQueueB1.shift()!;
          const nextTraveler = this.travelers.get(nextTravelerId);
          if (nextTraveler && nextTraveler.isActive) {
            this.currentProcessingTravelerB1 = nextTravelerId;
            nextTraveler.stage = 'processingAtB1';
            nextTraveler.currentSegmentStartTime = this.currentTime;
            this.scheduleEvent(this.processingDuration, 'TRAVELER_FINISH_PROCESSING_B1', nextTravelerId);
            console.log(`Traveler ${nextTravelerId} started processing at B1 from queue`);
          }
        }
        
        // Check if more boxes are available
        if (this.availableBoxes > 0) {
          console.log(`Traveler ${event.entityId} going back to C for another box`);
          this.scheduleEvent(100, 'TRAVELER_START_JOURNEY', event.entityId);
        } else {
          console.log(`Traveler ${event.entityId} returning to C then A - no more boxes`);
          traveler.stage = 'movingToC';
          traveler.currentLocation = 'TRAVELING_TO_C';
          traveler.currentSegmentStartTime = this.currentTime;
          
          const travelTimeToC = this.calculateTravelTime(
            this.locationB1.x, this.locationB1.y,
            this.locationC.x, this.locationC.y
          );
          this.scheduleEvent(travelTimeToC, 'TRAVELER_ARRIVE_AT_C', event.entityId);
        }
        break;

      case 'TRAVELER_FINISH_PROCESSING_B2':
        if (!traveler || !traveler.isActive) return;
        
        traveler.hasBox = false; // Processed the box
        traveler.boxesProcessed = (traveler.boxesProcessed || 0) + 1;
        this.totalBoxesProcessed++;
        this.currentProcessingTravelerB2 = null;
        
        console.log(`Traveler ${event.entityId} finished processing at B2 (total processed: ${this.totalBoxesProcessed}/5)`);
        
        // Process next in queue
        if (this.processingQueueB2.length > 0) {
          const nextTravelerId = this.processingQueueB2.shift()!;
          const nextTraveler = this.travelers.get(nextTravelerId);
          if (nextTraveler && nextTraveler.isActive) {
            this.currentProcessingTravelerB2 = nextTravelerId;
            nextTraveler.stage = 'processingAtB2';
            nextTraveler.currentSegmentStartTime = this.currentTime;
            this.scheduleEvent(this.processingDuration, 'TRAVELER_FINISH_PROCESSING_B2', nextTravelerId);
            console.log(`Traveler ${nextTravelerId} started processing at B2 from queue`);
          }
        }
        
        // Check if more boxes are available
        if (this.availableBoxes > 0) {
          console.log(`Traveler ${event.entityId} going back to C for another box`);
          this.scheduleEvent(100, 'TRAVELER_START_JOURNEY', event.entityId);
        } else {
          console.log(`Traveler ${event.entityId} returning to C then A - no more boxes`);
          traveler.stage = 'movingToC';
          traveler.currentLocation = 'TRAVELING_TO_C';
          traveler.currentSegmentStartTime = this.currentTime;
          
          const travelTimeToC = this.calculateTravelTime(
            this.locationB2.x, this.locationB2.y,
            this.locationC.x, this.locationC.y
          );
          this.scheduleEvent(travelTimeToC, 'TRAVELER_ARRIVE_AT_C', event.entityId);
        }
        break;

      case 'TRAVELER_ARRIVE_AT_A':
        if (!traveler || !traveler.isActive) return;
        
        traveler.isActive = false;
        this.travelers.delete(event.entityId);
        console.log(`Traveler ${event.entityId} completed journey (processed ${traveler.boxesProcessed || 0} boxes)`);
        
        // Check if simulation should complete
        this.checkSimulationComplete();
        break;

      case 'SIMULATION_COMPLETE':
        console.log('Simulation automatically stopping - all work complete!');
        this.stop();
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
        let startX, startY, totalTime;
        
        // Determine where they're coming from
        if (traveler.targetStation === 'B1') {
          startX = this.locationB1.x;
          startY = this.locationB1.y;
        } else if (traveler.targetStation === 'B2') {
          startX = this.locationB2.x;
          startY = this.locationB2.y;
        } else {
          // Coming from A initially
          startX = this.locationA.x;
          startY = this.locationA.y;
        }
        
        totalTime = this.calculateTravelTime(startX, startY, this.locationC.x, this.locationC.y);
        const progress = Math.min(elapsed / totalTime, 1);
        
        currentState.x = startX + (this.locationC.x - startX) * progress;
        currentState.y = startY + (this.locationC.y - startY) * progress;
      } else if (traveler.currentLocation === 'TRAVELING_TO_B1') {
        const elapsed = this.currentTime - traveler.currentSegmentStartTime;
        let startX, startY, totalTime;
        
        // Determine starting position based on where they're coming from
        if (traveler.stage === 'movingToB1' && !traveler.hasBox) {
          // This shouldn't happen in our flow, but handle it
          startX = this.locationA.x;
          startY = this.locationA.y;
          totalTime = this.calculateTravelTime(startX, startY, this.locationB1.x, this.locationB1.y);
        } else if (traveler.x === this.locationC.x && traveler.y === this.locationC.y) {
          // Coming from C
          startX = this.locationC.x;
          startY = this.locationC.y;
          totalTime = this.calculateTravelTime(startX, startY, this.locationB1.x, this.locationB1.y);
        } else {
          // Coming from B2 (switching)
          startX = this.locationB2.x;
          startY = this.locationB2.y;
          totalTime = this.calculateTravelTime(startX, startY, this.locationB1.x, this.locationB1.y);
        }
        
        const progress = Math.min(elapsed / totalTime, 1);
        currentState.x = startX + (this.locationB1.x - startX) * progress;
        currentState.y = startY + (this.locationB1.y - startY) * progress;
      } else if (traveler.currentLocation === 'TRAVELING_TO_B2') {
        const elapsed = this.currentTime - traveler.currentSegmentStartTime;
        let startX, startY, totalTime;
        
        // Determine starting position based on where they're coming from
        if (traveler.stage === 'movingToB2' && !traveler.hasBox) {
          // This shouldn't happen in our flow, but handle it
          startX = this.locationA.x;
          startY = this.locationA.y;
          totalTime = this.calculateTravelTime(startX, startY, this.locationB2.x, this.locationB2.y);
        } else if (traveler.x === this.locationC.x && traveler.y === this.locationC.y) {
          // Coming from C
          startX = this.locationC.x;
          startY = this.locationC.y;
          totalTime = this.calculateTravelTime(startX, startY, this.locationB2.x, this.locationB2.y);
        } else {
          // Coming from B1 (switching)
          startX = this.locationB1.x;
          startY = this.locationB1.y;
          totalTime = this.calculateTravelTime(startX, startY, this.locationB2.x, this.locationB2.y);
        }
        
        const progress = Math.min(elapsed / totalTime, 1);
        currentState.x = startX + (this.locationB2.x - startX) * progress;
        currentState.y = startY + (this.locationB2.y - startY) * progress;
      } else if (traveler.currentLocation === 'TRAVELING_TO_A') {
        const elapsed = this.currentTime - traveler.currentSegmentStartTime;
        // Now always coming from C when going to A
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
    
    // Advance simulation time based on simulation speed
    this.currentTime += 50 * this.simulationSpeed; // simulationSpeed affects time advancement
  }

  stop(): void {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  reset(): void {
    this.stop();
    this.eventQueue = [];
    this.travelers.clear();
    this.processingQueueB1 = [];
    this.processingQueueB2 = [];
    this.currentProcessingTravelerB1 = null;
    this.currentProcessingTravelerB2 = null;
    this.availableBoxes = this.maxBoxes; // Reset to configured max
    this.totalBoxesProcessed = 0;
    this.currentTime = 0;
    this.nextEventId = 1;
    this.hasBeenInitialized = false; // Allow re-initialization
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

  updateLocations(locA: {x: number, y: number}, locC: {x: number, y: number}, locB1: {x: number, y: number}, locB2: {x: number, y: number}): void {
    this.locationA = locA;
    this.locationC = locC;
    this.locationB1 = locB1;
    this.locationB2 = locB2;
  }

  // Add getter for queue status
  getQueueStatus(): { 
    b1QueueLength: number; 
    b2QueueLength: number; 
    processingTravelerB1: number | null;
    processingTravelerB2: number | null;
  } {
    return {
      b1QueueLength: this.processingQueueB1.length,
      b2QueueLength: this.processingQueueB2.length,
      processingTravelerB1: this.currentProcessingTravelerB1,
      processingTravelerB2: this.currentProcessingTravelerB2
    };
  }

  // Add getter for box status
  getBoxStatus(): { availableBoxes: number; totalProcessed: number } {
    return {
      availableBoxes: this.availableBoxes,
      totalProcessed: this.totalBoxesProcessed
    };
  }
}