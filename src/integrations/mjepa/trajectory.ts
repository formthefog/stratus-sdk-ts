/**
 * Trajectory Prediction & Analysis
 *
 * High-level tools for working with Stratus world modeling capabilities.
 *
 * @purpose Trajectory prediction, quality scoring, batch operations, optimization
 */

import { MJepaGClient } from './client.js';
import {
  TrajectoryOptions,
  TrajectoryResult,
  BatchTrajectoryOptions,
  OptimizationCriteria,
  StatePrediction,
  RolloutRequest,
} from './types.js';

export class TrajectoryPredictor {
  private client: MJepaGClient;
  private defaultQualityThreshold: number;

  constructor(client: MJepaGClient, options?: { qualityThreshold?: number }) {
    this.client = client;
    this.defaultQualityThreshold = options?.qualityThreshold ?? 80;
  }

  async predict(options: TrajectoryOptions): Promise<TrajectoryResult> {
    const request: RolloutRequest = {
      goal: options.goal,
      initial_state: options.initialState,
      max_steps: options.maxSteps ?? 10,
      return_intermediate: options.returnIntermediate !== false,
    };

    const response = await this.client.rollout(request);
    const qualityScore = this.scoreTrajectory(response.predictions, options.maxSteps ?? 10);
    const qualityThreshold = options.qualityThreshold ?? this.defaultQualityThreshold;
    const goalAchieved = qualityScore >= qualityThreshold;

    return {
      predictions: response.predictions,
      summary: {
        totalSteps: response.summary.total_steps,
        goalAchieved,
        qualityScore,
        actions: response.predictions.map(p => p.action.action_text),
        outcome: response.summary.outcome,
        actionPath: response.summary.action_path,
      },
      usage: response.usage,
    };
  }

  async predictMany(
    trajectories: Array<Omit<TrajectoryOptions, 'qualityThreshold'>>,
    options?: BatchTrajectoryOptions
  ): Promise<TrajectoryResult[]> {
    const maxConcurrent = options?.maxConcurrent ?? 5;
    const results: TrajectoryResult[] = [];
    const total = trajectories.length;
    let completed = 0;

    for (let i = 0; i < trajectories.length; i += maxConcurrent) {
      const batch = trajectories.slice(i, i + maxConcurrent);
      const batchResults = await Promise.all(
        batch.map(traj => this.predict({ ...traj, qualityThreshold: options?.qualityThreshold }))
      );

      results.push(...batchResults);
      completed += batchResults.length;

      if (options?.onProgress) {
        options.onProgress(completed, total);
      }
    }

    if (options?.qualityThreshold) {
      return results.filter(r => r.summary.qualityScore >= options.qualityThreshold!);
    }

    return results;
  }

  findOptimal(
    trajectories: TrajectoryResult[],
    criteria?: OptimizationCriteria
  ): TrajectoryResult | null {
    if (trajectories.length === 0) return null;

    const minQuality = criteria?.minQuality ?? 80;
    const maxSteps = criteria?.maxSteps ?? 10;

    let candidates = trajectories.filter(
      t => t.summary.qualityScore >= minQuality && t.summary.totalSteps <= maxSteps
    );

    if (candidates.length === 0) {
      candidates = trajectories;
    }

    if (criteria?.costFunction) {
      let bestScore = -Infinity;
      let best = candidates[0];

      for (const trajectory of candidates) {
        const score =
          trajectory.predictions.reduce((sum, pred) => sum + criteria.costFunction!(pred), 0) /
          trajectory.predictions.length;

        if (score > bestScore) {
          bestScore = score;
          best = trajectory;
        }
      }

      return best;
    }

    return candidates.sort((a, b) => {
      if (Math.abs(a.summary.qualityScore - b.summary.qualityScore) > 1) {
        return b.summary.qualityScore - a.summary.qualityScore;
      }
      return a.summary.totalSteps - b.summary.totalSteps;
    })[0];
  }

  private scoreTrajectory(predictions: StatePrediction[], maxSteps: number): number {
    if (predictions.length === 0) return 0;

    const avgConfidence =
      predictions.reduce((sum, p) => sum + p.action.confidence, 0) / predictions.length;

    const totalProgress = predictions.reduce((sum, p) => sum + p.state_change, 0);
    const normalizedProgress = Math.min(totalProgress * 10, 100);

    const efficiency =
      predictions.length > 0 ? 100 * (1 - predictions.length / maxSteps) : 0;

    const score =
      avgConfidence * 100 * 0.4 + normalizedProgress * 0.4 + efficiency * 0.2;

    return Math.min(Math.max(score, 0), 100);
  }

  compare(trajectories: TrajectoryResult[]): {
    best: TrajectoryResult | null;
    worst: TrajectoryResult | null;
    average: { qualityScore: number; steps: number; confidence: number };
  } {
    if (trajectories.length === 0) {
      return {
        best: null,
        worst: null,
        average: { qualityScore: 0, steps: 0, confidence: 0 },
      };
    }

    const sorted = [...trajectories].sort(
      (a, b) => b.summary.qualityScore - a.summary.qualityScore
    );

    const avgQuality =
      trajectories.reduce((sum, t) => sum + t.summary.qualityScore, 0) / trajectories.length;

    const avgSteps =
      trajectories.reduce((sum, t) => sum + t.summary.totalSteps, 0) / trajectories.length;

    const avgConfidence =
      trajectories.reduce((sum, t) => {
        const conf =
          t.predictions.reduce((s, p) => s + p.action.confidence, 0) / t.predictions.length;
        return sum + conf;
      }, 0) / trajectories.length;

    return {
      best: sorted[0],
      worst: sorted[sorted.length - 1],
      average: { qualityScore: avgQuality, steps: avgSteps, confidence: avgConfidence },
    };
  }

  getSummary(trajectory: TrajectoryResult): string {
    const { summary } = trajectory;
    return [
      `Steps: ${summary.totalSteps}`,
      `Goal: ${summary.goalAchieved ? 'Achieved' : 'Not achieved'}`,
      `Quality: ${summary.qualityScore.toFixed(1)}/100`,
      `Actions: ${summary.actions.join(' -> ')}`,
      `Outcome: ${summary.outcome}`,
    ].join('\n');
  }
}
