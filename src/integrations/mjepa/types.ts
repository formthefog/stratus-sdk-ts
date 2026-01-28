/**
 * M-JEPA-G API Type Definitions
 *
 * TypeScript types matching the deployed M-JEPA-G API server.
 *
 * @purpose Type-safe client for M-JEPA-G world model API
 * @spec Plan: M-JEPA-G Ecosystem Integration
 */

/**
 * Chat message role (OpenAI-compatible format)
 */
export type MessageRole = 'system' | 'user' | 'assistant';

/**
 * Chat message (OpenAI-compatible format)
 */
export interface Message {
  role: MessageRole;
  content: string;
}

/**
 * Chat completion request (matches api/models.py ChatCompletionRequest)
 */
export interface ChatCompletionRequest {
  messages: Message[];
  model: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

/**
 * Usage statistics
 */
export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

/**
 * Chat completion choice
 */
export interface ChatCompletionChoice {
  index: number;
  message: Message;
  finish_reason: 'stop' | 'length' | 'error';
}

/**
 * Chat completion response (matches api/models.py ChatCompletionResponse)
 */
export interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage: Usage;
}

/**
 * Chat completion chunk (streaming)
 */
export interface ChatCompletionChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: Partial<Message>;
    finish_reason: 'stop' | 'length' | 'error' | null;
  }>;
}

/**
 * Action with confidence score
 */
export interface Action {
  action_id: string;
  action_text: string;
  confidence: number;
}

/**
 * State prediction with action and metadata
 */
export interface StatePrediction {
  step: number;
  predicted_state: string;
  action: Action;
  state_change: number;
}

/**
 * Rollout request (matches api/models.py RolloutRequest)
 */
export interface RolloutRequest {
  goal: string;
  initial_state: string;
  max_steps?: number;
  return_intermediate?: boolean;
}

/**
 * Rollout response (matches api/models.py RolloutResponse)
 */
export interface RolloutResponse {
  predictions: StatePrediction[];
  summary: {
    total_steps: number;
    outcome: string;
    final_state: string;
  };
  usage: Usage;
}

/**
 * Error response from API
 */
export interface ApiError {
  error: {
    message: string;
    type: string;
    code?: string;
  };
}

/**
 * M-JEPA-G client configuration
 */
export interface MJepaClientConfig {
  /**
   * API base URL
   * @default 'http://212.115.124.137:8000'
   */
  apiUrl?: string;

  /**
   * API key for authentication (Stratus API key)
   */
  apiKey: string;

  /**
   * Request timeout in milliseconds
   * @default 30000
   */
  timeout?: number;

  /**
   * Number of retries on failure
   * @default 3
   */
  retries?: number;

  /**
   * Compression profile for embeddings
   * @default 'Medium'
   */
  compressionProfile?: 'Low' | 'Medium' | 'High' | 'VeryHigh';
}

/**
 * Trajectory prediction options
 */
export interface TrajectoryOptions {
  /**
   * Initial state description
   */
  initialState: string;

  /**
   * Goal to achieve
   */
  goal: string;

  /**
   * Maximum steps to predict
   * @default 10
   */
  maxSteps?: number;

  /**
   * Return intermediate states
   * @default true
   */
  returnIntermediate?: boolean;

  /**
   * Quality threshold (0-100)
   * @default 80
   */
  qualityThreshold?: number;
}

/**
 * Trajectory result with quality metrics
 */
export interface TrajectoryResult {
  predictions: StatePrediction[];
  summary: {
    totalSteps: number;
    goalAchieved: boolean;
    qualityScore: number;
    actions: string[];
    outcome: string;
    finalState: string;
  };
  usage: Usage;
}

/**
 * Batch trajectory options
 */
export interface BatchTrajectoryOptions {
  /**
   * Maximum concurrent requests
   * @default 5
   */
  maxConcurrent?: number;

  /**
   * Progress callback
   */
  onProgress?: (completed: number, total: number) => void;

  /**
   * Quality threshold for filtering
   * @default 80
   */
  qualityThreshold?: number;
}

/**
 * Optimization criteria for trajectory selection
 */
export interface OptimizationCriteria {
  /**
   * Minimum quality score
   * @default 80
   */
  minQuality?: number;

  /**
   * Maximum steps allowed
   * @default 10
   */
  maxSteps?: number;

  /**
   * Custom cost function (higher = better)
   */
  costFunction?: (prediction: StatePrediction) => number;
}
