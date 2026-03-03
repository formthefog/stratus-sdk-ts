/**
 * Trajectory Prediction & Analysis
 *
 * High-level tools for working with Stratus world modeling capabilities.
 *
 * @purpose Trajectory prediction, quality scoring, batch operations, optimization
 */
import { MJepaGClient } from './client.js';
import { TrajectoryOptions, TrajectoryResult, BatchTrajectoryOptions, OptimizationCriteria } from './types.js';
export declare class TrajectoryPredictor {
    private client;
    private defaultQualityThreshold;
    constructor(client: MJepaGClient, options?: {
        qualityThreshold?: number;
    });
    predict(options: TrajectoryOptions): Promise<TrajectoryResult>;
    predictMany(trajectories: Array<Omit<TrajectoryOptions, 'qualityThreshold'>>, options?: BatchTrajectoryOptions): Promise<TrajectoryResult[]>;
    findOptimal(trajectories: TrajectoryResult[], criteria?: OptimizationCriteria): TrajectoryResult | null;
    private scoreTrajectory;
    compare(trajectories: TrajectoryResult[]): {
        best: TrajectoryResult | null;
        worst: TrajectoryResult | null;
        average: {
            qualityScore: number;
            steps: number;
            confidence: number;
        };
    };
    getSummary(trajectory: TrajectoryResult): string;
}
