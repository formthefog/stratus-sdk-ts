/**
 * Trajectory Prediction & Analysis
 *
 * High-level tools for working with M-JEPA-G's world modeling capabilities.
 *
 * @purpose Trajectory prediction, quality scoring, batch operations, optimization
 * @spec Plan: M-JEPA-G Ecosystem Integration
 */
import { MJepaGClient } from './client.js';
import { TrajectoryOptions, TrajectoryResult, BatchTrajectoryOptions, OptimizationCriteria } from './types.js';
/**
 * Trajectory Predictor
 *
 * Provides high-level tools for:
 * - Single trajectory prediction
 * - Batch prediction with rate limiting
 * - Quality scoring
 * - Trajectory optimization
 */
export declare class TrajectoryPredictor {
    private client;
    private defaultQualityThreshold;
    constructor(client: MJepaGClient, options?: {
        qualityThreshold?: number;
    });
    /**
     * Predict a single trajectory
     */
    predict(options: TrajectoryOptions): Promise<TrajectoryResult>;
    /**
     * Predict multiple trajectories with rate limiting
     */
    predictMany(trajectories: Array<Omit<TrajectoryOptions, 'qualityThreshold'>>, options?: BatchTrajectoryOptions): Promise<TrajectoryResult[]>;
    /**
     * Find optimal trajectory given criteria
     */
    findOptimal(trajectories: TrajectoryResult[], criteria?: OptimizationCriteria): TrajectoryResult | null;
    /**
     * Score a trajectory based on quality metrics
     *
     * Components:
     * 1. Confidence - average confidence across steps (0-100)
     * 2. Progress - total state change magnitude (0-100)
     * 3. Efficiency - goal achieved in fewer steps = higher score (0-100)
     *
     * @returns Quality score (0-100)
     */
    private scoreTrajectory;
    /**
     * Compare multiple trajectory predictions
     */
    compare(trajectories: TrajectoryResult[]): {
        best: TrajectoryResult | null;
        worst: TrajectoryResult | null;
        average: {
            qualityScore: number;
            steps: number;
            confidence: number;
        };
    };
    /**
     * Get summary statistics for a trajectory
     */
    getSummary(trajectory: TrajectoryResult): string;
}
