/**
 * Stratus API Type Definitions
 *
 * TypeScript types matching the Stratus API server.
 *
 * @purpose Type-safe definitions for the Stratus API
 */

export type MessageRole = 'system' | 'user' | 'assistant' | 'tool' | 'developer';

export interface ContentBlock {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string; detail?: string };
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface Message {
  role: MessageRole;
  content?: string | ContentBlock[];
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface ToolFunction {
  name: string;
  description?: string;
  parameters?: Record<string, unknown>;
}

export interface ToolDefinition {
  type: 'function';
  function: ToolFunction;
}

export interface ToolChoiceObject {
  type: 'function';
  function: { name: string };
}

export interface StratusExtensions {
  mode?: 'plan' | 'validate' | 'rank' | 'hybrid';
  validation_threshold?: number;
  max_validation_retries?: number;
  num_candidates?: number;
  return_action_sequence?: boolean;
}

export interface ChatCompletionRequest {
  model: string;
  messages: Message[];
  max_tokens?: number;
  max_completion_tokens?: number;
  temperature?: number;
  top_p?: number;
  n?: number;
  stream?: boolean;
  stop?: string[];
  presence_penalty?: number;
  frequency_penalty?: number;
  user?: string;
  tools?: ToolDefinition[];
  tool_choice?: string | ToolChoiceObject;
  stream_options?: { include_usage?: boolean };
  store?: boolean;
  stratus?: StratusExtensions;
  openai_key?: string;
  anthropic_key?: string;
  gemini_key?: string;
  openrouter_key?: string;
}

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ExecutionTraceStep {
  step: number;
  action: string;
  response_summary: string;
}

export interface BrainSignal {
  action_type: string;
  confidence: number;
  plan_ahead: string[];
  simulation_confirmed: boolean;
  goal_proximity: number;
}

export interface StratusMetadata {
  stratus_model: string;
  execution_llm: string;
  action_sequence?: string[];
  predicted_state_changes?: number[];
  confidence_labels?: string[];
  overall_confidence?: number;
  steps_to_goal?: number;
  planning_time_ms?: number;
  execution_time_ms?: number;
  total_steps_executed?: number;
  execution_trace?: ExecutionTraceStep[];
  brain_signal?: BrainSignal;
  confidence?: number;
  key_source?: 'user' | 'formation';
  formation_markup_applied?: number;
}

export interface ChatCompletionChoice {
  index: number;
  message: Message;
  finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter';
}

export interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage: Usage;
  stratus?: StratusMetadata;
}

export interface ChatCompletionChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: Partial<Message>;
    finish_reason: string | null;
  }>;
  usage?: Usage;
  stratus?: StratusMetadata;
}

export interface ActionStep {
  action_id: string;
  action_text: string;
  confidence: number;
}

export interface StatePrediction {
  step: number;
  action: ActionStep;
  current_state: { step: number; magnitude: number; confidence: 'High' | 'Medium' | 'Low' };
  predicted_state: { step: number; magnitude: number; confidence: 'High' | 'Medium' | 'Low' };
  state_change: number;
  interpretation: string;
  brain_confidence?: number;
  brain_goal_proximity?: number;
}

export interface RolloutRequest {
  goal: string;
  initial_state: string;
  max_steps?: number;
  return_intermediate?: boolean;
}

export interface RolloutSummary {
  total_steps: number;
  initial_magnitude: number;
  final_magnitude: number;
  total_state_change: number;
  outcome: string;
  planner: 'brain' | 'action_planner';
  action_path: string[];
}

export interface RolloutResponse {
  predictions: StatePrediction[];
  summary: RolloutSummary;
  usage: Usage;
}

export interface HealthResponse {
  status: 'healthy';
  stratus_models_loaded: string[];
  llm_providers: string[];
  vault: 'connected' | 'disabled';
  brain: { loaded: boolean; num_actions: number };
  version: string;
  git_sha: string;
}

export interface Model {
  id: string;
  object: 'model';
  created: number;
  owned_by: 'stratus';
}

export interface ModelsListResponse {
  object: 'list';
  data: Model[];
}

export interface EmbeddingRequest {
  model: string;
  input: string | string[];
  encoding_format?: 'float' | 'base64';
}

export interface EmbeddingObject {
  object: 'embedding';
  index: number;
  embedding: number[] | string;
}

export interface EmbeddingResponse {
  object: 'list';
  data: EmbeddingObject[];
  model: string;
  usage: { prompt_tokens: number; completion_tokens: 0; total_tokens: number };
}

export type AnthropicContentBlock =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> };

export interface AnthropicTool {
  name: string;
  description: string;
  input_schema: { type: 'object'; properties: Record<string, unknown>; required?: string[] };
}

export interface AnthropicRequest {
  model: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string | AnthropicContentBlock[] }>;
  max_tokens: number;
  system?: string;
  temperature?: number;
  stream?: boolean;
  stop_sequences?: string[];
  metadata?: Record<string, unknown>;
  tools?: AnthropicTool[];
  tool_choice?: { type: 'auto' | 'any' | 'tool'; name?: string };
}

export interface AnthropicResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: AnthropicContentBlock[];
  model: string;
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use';
  stop_sequence: string | null;
  usage: { input_tokens: number; output_tokens: number };
  stratus?: StratusMetadata;
}

export interface SetLLMKeysRequest {
  openai_key?: string;
  anthropic_key?: string;
  google_key?: string;
  openrouter_key?: string;
}

export interface GetLLMKeysResponse {
  has_openai_key: boolean;
  has_anthropic_key: boolean;
  has_google_key: boolean;
  has_openrouter_key: boolean;
  openai_last_validated: string | null;
  anthropic_last_validated: string | null;
  google_last_validated: string | null;
  openrouter_last_validated: string | null;
  formation_keys_available: boolean;
}

export type LLMProvider = 'openai' | 'anthropic' | 'google' | 'openrouter';

export type CreditPackageName = 'starter' | 'pro' | 'enterprise';

export interface CreditPackage {
  name: CreditPackageName;
  label: string;
  description: string;
  credits: number;
  amount_usdc: number;
  amount_micro_usdc: number;
}

export interface CreditPackagesResponse {
  packages: CreditPackage[];
  network: string;
  asset: string;
  testnet: boolean;
}

export interface CreditPurchaseResponse {
  success: true;
  package: string;
  credits_added: number;
  tx_hash: string;
  user_id: string;
  new_balance_units: number;
  created_account: boolean;
  stratus_api_key?: string;
  idempotent?: boolean;
}

export interface PaymentChallenge {
  error: 'payment_required';
  x402: unknown;
}

export type StratusErrorType =
  | 'invalid_model'
  | 'model_not_loaded'
  | 'llm_provider_error'
  | 'llm_provider_not_configured'
  | 'planning_failed'
  | 'rate_limit'
  | 'authentication_error'
  | 'insufficient_credits'
  | 'internal_error'
  | 'api_error'
  | 'validation_error';

export interface StratusErrorResponse {
  error: {
    message: string;
    type: StratusErrorType;
    param?: string;
    code?: string;
  };
}

export interface InsufficientCreditsErrorResponse extends StratusErrorResponse {
  required_credits: number;
  available_credits: number;
  x402: unknown;
  top_up_url: string;
}

export interface MJepaClientConfig {
  /**
   * API base URL
   * @default 'https://api.stratus.run'
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

export interface TrajectoryOptions {
  initialState: string;
  goal: string;
  maxSteps?: number;
  returnIntermediate?: boolean;
  qualityThreshold?: number;
}

export interface TrajectoryResult {
  predictions: StatePrediction[];
  summary: {
    totalSteps: number;
    goalAchieved: boolean;
    qualityScore: number;
    actions: string[];
    outcome: string;
    actionPath: string[];
  };
  usage: Usage;
}

export interface BatchTrajectoryOptions {
  maxConcurrent?: number;
  onProgress?: (completed: number, total: number) => void;
  qualityThreshold?: number;
}

export interface OptimizationCriteria {
  minQuality?: number;
  maxSteps?: number;
  costFunction?: (prediction: StatePrediction) => number;
}
