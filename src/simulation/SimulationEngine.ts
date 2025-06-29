import { Sim } from 'simjs';
import { ThemeParkData, Ride, ThemeParkConfig } from '../context/ThemeParkContext';

export interface SimulationEvent {
  type: 'visitor_arrival' | 'ride_cycle_complete' | 'park_close';
  time: number;
  data?: any;
}

export class ThemeParkSimulation {
  private sim: Sim;
  private data: ThemeParkData;
  private config: ThemeParkConfig;
  private isRunning: boolean = false;
  private onUpdate?: (data: ThemeParkData) => void;

  constructor(config: ThemeParkConfig, initialData: ThemeParkData) {
    this.sim = new Sim();
    this.config = config;
    this.data = { ...initialData };
  }

  setUpdateCallback(callback: (data: ThemeParkData) => void) {
    this.onUpdate = callback;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    
    // Schedule initial events
    this.scheduleVisitorArrivals();
    this.scheduleRideCycles();
    this.scheduleParkClose();
    
    // Start the simulation
    this.sim.start();
  }

  stop() {
    this.isRunning = false;
    this.sim.stop();
  }

  reset() {
    this.stop();
    this.sim = new Sim();
    this.data = {
      currentTime: 0,
      totalVisitors: 0,
      currentVisitors: 0,
      rides: this.config.initialRides.map(ride => ({
        ...ride,
        currentRiders: 0,
        queueLength: 0,
        totalRiders: 0,
      })),
      steps: 0,
      progress: 0,
    };
    this.isRunning = false;
  }

  getCurrentData(): ThemeParkData {
    return { ...this.data };
  }

  private scheduleVisitorArrivals() {
    // Schedule visitor arrivals throughout the day
    const scheduleNextArrival = () => {
      if (!this.isRunning || this.data.currentTime >= 540) return;

      // Calculate arrival rate based on time of day
      const timeOfDay = this.data.currentTime / 60;
      let arrivalInterval: number;
      
      if (timeOfDay < 2) arrivalInterval = 2; // Every 2 minutes - morning rush
      else if (timeOfDay < 5) arrivalInterval = 1.5; // Every 1.5 minutes - busy afternoon
      else if (timeOfDay < 8) arrivalInterval = 4; // Every 4 minutes - evening slowdown
      else arrivalInterval = 8; // Every 8 minutes - near closing

      // Add some randomness
      const nextArrivalTime = arrivalInterval * (0.5 + Math.random());
      
      this.sim.schedule(() => {
        this.handleVisitorArrival();
        scheduleNextArrival();
      }, nextArrivalTime);
    };

    scheduleNextArrival();
  }

  private handleVisitorArrival() {
    const numVisitors = Math.floor(Math.random() * 5) + 1; // 1-5 visitors per group
    
    this.data.totalVisitors += numVisitors;
    this.data.currentVisitors += numVisitors;
    
    // Distribute visitors to ride queues
    const openRides = this.data.rides.filter(ride => ride.isOpen);
    if (openRides.length > 0) {
      for (let i = 0; i < numVisitors; i++) {
        // Random choice with preference for less crowded rides
        const ride = this.selectRideForVisitor(openRides);
        ride.queueLength++;
      }
    }

    this.updateTime();
    this.notifyUpdate();
  }

  private selectRideForVisitor(openRides: Ride[]): Ride {
    // Probability inversely related to queue length
    const weights = openRides.map(ride => 1 / (ride.queueLength + 1));
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    
    let random = Math.random() * totalWeight;
    for (let i = 0; i < openRides.length; i++) {
      random -= weights[i];
      if (random <= 0) return openRides[i];
    }
    
    return openRides[0]; // fallback
  }

  private scheduleRideCycles() {
    this.data.rides.forEach(ride => {
      if (ride.isOpen) {
        this.scheduleRideCycle(ride);
      }
    });
  }

  private scheduleRideCycle(ride: Ride) {
    if (!this.isRunning || this.data.currentTime >= 540) return;

    // Ride cycle time (in minutes)
    const cycleTime = 3 + Math.random() * 2; // 3-5 minutes
    
    this.sim.schedule(() => {
      this.handleRideCycleComplete(ride);
      // Schedule next cycle
      this.scheduleRideCycle(ride);
    }, cycleTime);
  }

  private handleRideCycleComplete(ride: Ride) {
    // Riders exit
    const exitingRiders = ride.currentRiders;
    this.data.currentVisitors -= exitingRiders;
    ride.totalRiders += exitingRiders;

    // New riders board from queue
    const newRiders = Math.min(ride.capacity, ride.queueLength);
    ride.currentRiders = newRiders;
    ride.queueLength -= newRiders;

    this.updateTime();
    this.notifyUpdate();
  }

  private scheduleParkClose() {
    this.sim.schedule(() => {
      this.handleParkClose();
    }, 540); // 540 minutes = 9 hours (9am to 6pm)
  }

  private handleParkClose() {
    // All visitors leave
    this.data.currentVisitors = 0;
    this.data.rides.forEach(ride => {
      ride.currentRiders = 0;
      ride.queueLength = 0;
    });
    
    this.data.currentTime = 540;
    this.data.progress = 100;
    this.isRunning = false;
    
    this.notifyUpdate();
  }

  private updateTime() {
    this.data.currentTime = this.sim.time();
    this.data.progress = Math.min(100, (this.data.currentTime / 540) * 100);
    this.data.steps++;
  }

  private notifyUpdate() {
    if (this.onUpdate) {
      this.onUpdate({ ...this.data });
    }
  }

  isSimulationRunning(): boolean {
    return this.isRunning;
  }

  isSimulationComplete(): boolean {
    return this.data.currentTime >= 540;
  }
}
