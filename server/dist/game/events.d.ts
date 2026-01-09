import { GameEvent, EventType, EventConfig, GameConfig, GameLevel } from '../types';
import { SeededRandom } from '../utils/randomSeed';
interface EventDefinition {
    type: EventType;
    name: string;
    description: string;
    baseChance: number;
    duration: number;
    levelMultiplier: Record<GameLevel, number>;
}
/**
 * Process random events for a quarter
 * Returns updated events array with new and expired events
 */
export declare function processRandomEvents(quarter: number, config: GameConfig, currentEvents: GameEvent[], random: SeededRandom): GameEvent[];
/**
 * Get default event configuration based on game level
 */
export declare function getEventConfig(level: GameLevel): EventConfig;
/**
 * Get event definition by type
 */
export declare function getEventDefinition(type: EventType): EventDefinition | undefined;
/**
 * Get all active events from an events array
 */
export declare function getActiveEvents(events: GameEvent[]): GameEvent[];
/**
 * Check if a specific event type is active
 */
export declare function isEventActive(events: GameEvent[], type: EventType): boolean;
/**
 * Get event display info
 */
export declare const EVENT_INFO: Record<EventType, {
    name: string;
    icon: string;
    color: string;
}>;
export {};
//# sourceMappingURL=events.d.ts.map