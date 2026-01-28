# Stratus SDK - Product Requirements Document

---

## Executive Summary

The Stratus SDK enables developers to integrate Stratus X1's Predictive Action Model into their AI agent systems with minimal code changes. The SDK provides native client libraries, OpenAI-compatible APIs, and framework integrations that allow agents to simulate actions, validate decisions, and plan multi-step sequences before execution.

**Target Outcome**: 2-line integration that doubles agent success rates and cuts costs by 75%.

---

## Vision & Positioning

### What We're Building

An SDK that makes Stratus X1's world model as easy to use as calling an LLM. Developers should be able to add state prediction, action validation, and planning capabilities to their agents with the same simplicity as adding GPT-4 or Claude.

### Who It's For

**Primary Users:**
1. **AI Engineers** - Building autonomous agents for web automation, workflow orchestration, code execution
2. **Enterprise DevOps** - Deploying agent-based automation systems
3. **Framework Maintainers** - LangChain, AutoGPT, CrewAI, etc.
4. **Researchers** - Experimenting with world models and agent planning

**User Personas:**

| Persona | Need | Pain Point | Success Metric |
|---------|------|------------|----------------|
| **Agent Builder (Alex)** | Improve task success rate from 15% → 35%+ | Agents fail silently, can't debug why actions don't work | 2x task success rate |
| **DevOps Engineer (Sam)** | Reduce token costs for production agents | Agent costs spiraling due to massive context windows | 75% cost reduction |
| **Framework Maintainer (Jordan)** | Add world model layer to existing framework | Users demand better planning, hard to integrate new models | Drop-in integration |
| **Researcher (Dr. Chen)** | Experiment with predictive models for agents | Hard to prototype without production infrastructure | Rapid prototyping |

---

## Product Goals & Success Metrics

### Primary Goals

1. **Adoption**: 100+ developers integrating Stratus within 30 days of launch
2. **Success**: 50+ production deployments within 90 days
3. **Performance**: Demonstrate 2x task success improvement in real-world use cases
4. **Developer Experience**: 95%+ positive feedback on integration simplicity

### Key Metrics

| Metric | Target (30d) | Target (90d) | How We Measure |
|--------|--------------|--------------|----------------|
| SDK Downloads | 500+ | 2,000+ | npm/pip download counts |
| Active Integrations | 100+ | 500+ | Unique API keys making calls |
| Production Deployments | 20+ | 50+ | API usage patterns (>1K calls/day) |
| Task Success Improvement | 1.5-2x | 2x+ | Customer-reported benchmarks |
| Cost Reduction | 60-75% | 75%+ | Token usage analytics |
| Developer NPS | 50+ | 60+ | Post-integration surveys |
| Framework Integrations | 2+ | 5+ | LangChain, AutoGPT, etc. |

### Anti-Goals (What We're NOT Building)

- ❌ A full agent framework (we integrate with existing frameworks)
- ❌ A hosted agent platform (we provide the world model layer)
- ❌ Domain-specific tools (we enable general prediction, not vertical solutions)
- ❌ A prompt engineering library (we complement LLMs, not replace them)

---

## Core Use Cases

### Use Case 1: Web Automation Agent

**Scenario**: Building an agent that navigates websites and completes multi-step tasks (e.g., booking a flight, filling forms).

**Without Stratus**:
- Agent takes action → hopes it works → checks result → often fails
- Success rate: ~15-20% on WebArena benchmark
- High token usage (15K+ tokens per action)
- Slow (multiple LLM calls to recover from errors)

**With Stratus**:
```python
from stratus import StratusClient, AgentLoop

client = StratusClient(api_key="...")
loop = AgentLoop(client, llm="claude-sonnet-4")

# Agent automatically uses Stratus to:
# 1. Predict outcomes before actions
# 2. Validate actions against goal
# 3. Plan multi-step sequences
# 4. Recover from errors

result = loop.run(
    task="Book a flight from SF to NYC on Feb 15",
    environment="browser"
)

# Result: 38% success rate (2x improvement)
# Token usage: 1.5K per action (90% reduction)
```

**Expected Outcome**: Success rate improves from 15% → 35%+, costs drop by 75%.

---

### Use Case 2: Code Execution Agent

**Scenario**: Agent that writes and executes code to solve problems (SWE-Bench, data analysis).

**Without Stratus**:
- Agent proposes code → runs it → sees error → tries to fix → often stuck
- Limited lookahead (can't predict if code will work)
- High failure rate on complex problems

**With Stratus**:
```python
from stratus import StratusClient

client = StratusClient(api_key="...")

# Before executing code, simulate outcome
current_state = {"code": proposed_code, "context": file_context}
action = {"type": "execute", "code": proposed_code}

predicted_state = client.predict(
    current_state=current_state,
    action=action,
    goal="function passes all tests"
)

if predicted_state.goal_progress > 0.8:
    # High confidence this will work
    execute_code(proposed_code)
else:
    # Likely to fail, try alternative
    alternative = llm.generate_alternative(predicted_state.issues)
```

**Expected Outcome**: Higher first-attempt success, fewer iteration loops.

---

### Use Case 3: Tool-Using Agent (LangChain Integration)

**Scenario**: LangChain agent using multiple tools (search, calculator, database) to answer questions.

**Without Stratus**:
- Agent picks tools somewhat randomly
- Often picks wrong sequence
- Can't validate if tool choice helps

**With Stratus**:
```python
from langchain.agents import initialize_agent
from stratus.integrations.langchain import StratusToolWrapper

# Wrap existing tools with Stratus prediction
tools = [
    StratusToolWrapper(search_tool),
    StratusToolWrapper(calculator_tool),
    StratusToolWrapper(database_tool)
]

# Agent now validates each tool call before execution
agent = initialize_agent(
    tools=tools,
    llm=llm,
    agent="zero-shot-react-description",
    stratus_enabled=True  # Single flag to enable prediction
)

result = agent.run("What was Apple's revenue growth in Q3 2024?")
```

**Expected Outcome**: Fewer wasted tool calls, faster task completion.

---

### Use Case 4: Multi-Agent Workflow

**Scenario**: Multiple agents coordinating on a complex task (e.g., research → analysis → writing).

**Without Stratus**:
- Agents pass incomplete/wrong artifacts
- Hard to validate handoffs
- Cascading failures

**With Stratus**:
```python
from stratus import MultiAgentCoordinator

coordinator = MultiAgentCoordinator(
    agents=[research_agent, analysis_agent, writing_agent],
    stratus_client=client
)

# Stratus validates each handoff
result = coordinator.run(
    task="Write a report on AI safety research",
    validation="each agent's output enables next agent to succeed"
)
```

**Expected Outcome**: Fewer handoff failures, higher end-to-end success.

---

## Technical Requirements

### SDK Architecture

```
┌─────────────────────────────────────────────────────┐
│                  User's Agent Code                   │
└───────────────────┬─────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────┐
│              Stratus SDK (Client)                    │
│  ┌──────────────┬─────────────┬─────────────────┐   │
│  │  Core Client │ AgentLoop   │ Framework       │   │
│  │  (Predict)   │ (Orchestrate)│ Integrations   │   │
│  └──────────────┴─────────────┴─────────────────┘   │
└───────────────────┬─────────────────────────────────┘
                    │ HTTPS/WebSocket
┌───────────────────▼─────────────────────────────────┐
│           Stratus X1 API (Backend)                   │
│  ┌──────────────┬─────────────┬─────────────────┐   │
│  │ Prediction   │ Validation  │ Planning        │   │
│  │ Endpoint     │ Endpoint    │ Endpoint        │   │
│  └──────────────┴─────────────┴─────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Core Components

#### 1. Client Libraries (Priority 1)

**Languages**:
- **Python** (primary, 80% of users)
- **TypeScript/JavaScript** (secondary, 15% of users)
- **Go** (tertiary, 5% of users - later phase)

**Core Client API**:
```python
class StratusClient:
    def __init__(self, api_key: str, base_url: Optional[str] = None):
        """Initialize Stratus client."""

    def predict(
        self,
        current_state: State,
        action: Action,
        goal: Optional[str] = None,
        context: Optional[Dict] = None
    ) -> PredictedState:
        """Predict next state given current state and action."""

    def validate(
        self,
        current_state: State,
        action: Action,
        goal: str
    ) -> ValidationResult:
        """Validate if action progresses toward goal."""

    def plan(
        self,
        current_state: State,
        goal: str,
        max_steps: int = 5
    ) -> List[Action]:
        """Generate multi-step action plan."""

    def batch_predict(
        self,
        predictions: List[PredictionRequest]
    ) -> List[PredictedState]:
        """Batch prediction for multiple action candidates."""
```

**Type Definitions**:
```python
@dataclass
class State:
    """Environment state representation."""
    observation: Union[str, Dict, np.ndarray]
    metadata: Optional[Dict] = None

@dataclass
class Action:
    """Action representation."""
    type: str  # e.g., "click", "type", "execute", "search"
    parameters: Dict
    metadata: Optional[Dict] = None

@dataclass
class PredictedState:
    """Predicted next state."""
    state: State
    confidence: float  # 0-1
    goal_progress: float  # -1 to 1 (negative = regress, positive = progress)
    embedding: np.ndarray  # 768-dim state embedding
    issues: List[str]  # Predicted problems

@dataclass
class ValidationResult:
    """Action validation result."""
    valid: bool
    confidence: float
    reason: str
    alternatives: List[Action]  # Suggested alternatives if invalid
```

#### 2. AgentLoop (Orchestration Layer)

High-level orchestration that handles LLM + Stratus coordination:

```python
class AgentLoop:
    def __init__(
        self,
        stratus_client: StratusClient,
        llm: str = "claude-sonnet-4",  # OpenAI-compatible
        strategy: str = "validate"  # validate | plan | hybrid
    ):
        """Initialize agent loop with Stratus + LLM."""

    def run(
        self,
        task: str,
        environment: str,
        max_steps: int = 50,
        callbacks: Optional[List[Callback]] = None
    ) -> AgentResult:
        """
        Run agent loop:
        1. LLM proposes action
        2. Stratus validates/predicts
        3. Execute if validated
        4. Repeat until goal reached or max_steps
        """

@dataclass
class AgentResult:
    """Agent execution result."""
    success: bool
    steps_taken: int
    final_state: State
    trace: List[Step]  # Full execution trace
    metrics: Metrics  # Token usage, latency, cost
```

**Strategies**:
- **validate**: Stratus validates each LLM-proposed action before execution
- **plan**: Stratus generates full plan, LLM refines/executes
- **hybrid**: Stratus plans 3-5 steps ahead, LLM executes with validation

#### 3. Framework Integrations (Priority 2)

**LangChain Integration**:
```python
from stratus.integrations.langchain import StratusToolWrapper, StratusAgent

# Option 1: Wrap existing tools
tools = [StratusToolWrapper(tool) for tool in existing_tools]

# Option 2: Use Stratus-native agent
agent = StratusAgent(
    tools=tools,
    llm=llm,
    stratus_client=client
)
```

**AutoGPT Integration**:
```python
from stratus.integrations.autogpt import StratusPlugin

# Add as AutoGPT plugin
plugins = [StratusPlugin(api_key="...")]
```

**CrewAI Integration**:
```python
from stratus.integrations.crewai import StratusValidator

# Add validation layer to crew
crew = Crew(
    agents=[...],
    validator=StratusValidator(client)
)
```

#### 4. OpenAI API Compatibility Layer

For drop-in replacement in existing codebases:

```python
# Existing code uses OpenAI
from openai import OpenAI
client = OpenAI(api_key="...")

# Switch to Stratus with zero code changes
from stratus.openai import OpenAI  # Drop-in replacement
client = OpenAI(
    api_key="stratus-key",
    base_url="https://api.stratus.run/v1"
)

# Existing calls now use Stratus for validation
# (intercepts chat completions, validates actions)
```

---

## API Specification

### REST API Endpoints

Base URL: `https://api.stratus.run/v1`

#### POST /predict

Predict next state given current state and action.

**Request**:
```json
{
  "current_state": {
    "observation": "...",  // String, dict, or base64-encoded array
    "metadata": {}
  },
  "action": {
    "type": "click",
    "parameters": {"element": "button#submit"},
    "metadata": {}
  },
  "goal": "Complete form submission",  // Optional
  "context": {}  // Optional additional context
}
```

**Response**:
```json
{
  "predicted_state": {
    "observation": "...",
    "metadata": {}
  },
  "confidence": 0.92,
  "goal_progress": 0.85,
  "embedding": [...],  // 768-dim array
  "issues": [],
  "latency_ms": 45
}
```

#### POST /validate

Validate if action progresses toward goal.

**Request**:
```json
{
  "current_state": {...},
  "action": {...},
  "goal": "Complete form submission"
}
```

**Response**:
```json
{
  "valid": true,
  "confidence": 0.88,
  "reason": "Action likely completes form submission",
  "alternatives": [],  // Suggested alternatives if invalid
  "goal_progress": 0.85
}
```

#### POST /plan

Generate multi-step action plan.

**Request**:
```json
{
  "current_state": {...},
  "goal": "Book a flight from SF to NYC",
  "max_steps": 5,
  "strategy": "greedy"  // greedy | beam | sampling
}
```

**Response**:
```json
{
  "plan": [
    {
      "step": 1,
      "action": {...},
      "predicted_state": {...},
      "confidence": 0.90
    },
    ...
  ],
  "total_confidence": 0.75,
  "expected_steps": 5,
  "alternatives": []  // Alternative plans
}
```

#### POST /batch

Batch prediction for multiple action candidates.

**Request**:
```json
{
  "predictions": [
    {"current_state": {...}, "action": {...}, "goal": "..."},
    {"current_state": {...}, "action": {...}, "goal": "..."},
    ...
  ]
}
```

**Response**:
```json
{
  "results": [
    {"predicted_state": {...}, "confidence": 0.92, ...},
    ...
  ]
}
```

### WebSocket API (Real-Time Streaming)

For long-running agent loops with live feedback:

```
ws://api.stratus.run/v1/stream
```

**Message Format**:
```json
// Client → Server (predict)
{
  "type": "predict",
  "id": "req-123",
  "current_state": {...},
  "action": {...}
}

// Server → Client (result)
{
  "type": "predict_result",
  "id": "req-123",
  "predicted_state": {...},
  "confidence": 0.92
}
```

### Authentication

**API Key Authentication** (Header):
```
Authorization: Bearer stratus_sk_...
```

**Rate Limits**:
- Free tier: 100 predictions/day
- Developer tier: 10K predictions/day
- Production tier: Unlimited (metered)

---

## Data Formats & Standards

### State Representation

Stratus supports multiple state formats:

1. **Text** (string): Raw text observations
   ```python
   state = State(observation="User is on homepage. Button visible.")
   ```

2. **Structured** (dict): Key-value observations
   ```python
   state = State(observation={
       "page": "homepage",
       "elements": ["button#submit", "input#email"],
       "form_filled": False
   })
   ```

3. **Embedding** (numpy array): Pre-computed 768-dim embedding
   ```python
   state = State(observation=np.array([...]))  # 768-dim
   ```

### Action Types

Standard action vocabulary (extensible):

| Action Type | Parameters | Example Use Case |
|-------------|------------|------------------|
| `click` | `element: str` | Web automation |
| `type` | `element: str, text: str` | Form filling |
| `navigate` | `url: str` | Web navigation |
| `execute` | `code: str, language: str` | Code execution |
| `search` | `query: str` | Information retrieval |
| `call_tool` | `tool: str, args: Dict` | Tool use |
| `wait` | `duration_ms: int` | Timing control |
| `custom` | `parameters: Dict` | User-defined actions |

### Goal Specification

Goals can be:
- **Natural language**: "Complete the checkout process"
- **Structured**: `{"goal_type": "form_submission", "form_id": "checkout"}`
- **Metric-based**: `{"metric": "cart_total", "target": 0}`

---

## Developer Experience

### Getting Started (Time to First Success)

**Target**: Developer goes from signup → first working prediction in **< 5 minutes**.

#### Step 1: Install SDK (30 seconds)
```bash
pip install stratus-sdk
# or
npm install @stratus/sdk
```

#### Step 2: Get API Key (1 minute)
```bash
# Sign up at stratus.run
# Copy API key from dashboard
export STRATUS_API_KEY="stratus_sk_..."
```

#### Step 3: First Prediction (2 minutes)
```python
from stratus import StratusClient

client = StratusClient()  # Uses STRATUS_API_KEY env var

# Predict outcome of clicking a button
result = client.predict(
    current_state={"page": "homepage", "button_visible": True},
    action={"type": "click", "element": "button#submit"},
    goal="Submit form"
)

print(f"Confidence: {result.confidence}")
print(f"Goal progress: {result.goal_progress}")
# Output:
# Confidence: 0.92
# Goal progress: 0.85
```

#### Step 4: Full Agent Loop (2 minutes)
```python
from stratus import AgentLoop

loop = AgentLoop(client, llm="claude-sonnet-4")

result = loop.run(
    task="Fill out contact form and submit",
    environment="browser"
)

print(f"Success: {result.success}")
print(f"Steps: {result.steps_taken}")
```

### Code Examples & Templates

Provide ready-to-run examples for common patterns:

1. **Web automation with Selenium**
2. **API agent with LangChain**
3. **Code execution with SWE-Bench**
4. **Multi-agent coordination**
5. **Custom environment integration**

### Documentation Structure

```
docs/
├── quickstart.md              # 5-minute getting started
├── concepts/
│   ├── how-stratus-works.md   # Architecture overview
│   ├── state-action-goal.md   # Core concepts
│   └── integration-patterns.md
├── guides/
│   ├── web-automation.md
│   ├── code-execution.md
│   ├── tool-use.md
│   └── multi-agent.md
├── api-reference/
│   ├── client.md
│   ├── agent-loop.md
│   └── rest-api.md
├── integrations/
│   ├── langchain.md
│   ├── autogpt.md
│   └── custom.md
└── examples/
    ├── selenium-agent/
    ├── langchain-tools/
    └── swe-bench/
```

### Error Handling & Debugging

**Principle**: Errors should be actionable and clear.

**Example Error Messages**:

```python
# ❌ Bad error
Exception: Prediction failed

# ✅ Good error
StratusValidationError:
  Action validation failed (confidence: 0.32)

  Reason: Current state missing required field 'page_url'

  Fix: Include 'page_url' in state.observation

  Example:
    state = State(observation={
        "page_url": "https://example.com",
        ...
    })
```

**Debug Mode**:
```python
client = StratusClient(debug=True)  # Verbose logging

result = client.predict(...)
# Logs:
# [DEBUG] Sending prediction request...
# [DEBUG] State embedding: 768 dims
# [DEBUG] Action encoded: click (id: 42)
# [DEBUG] Prediction latency: 45ms
# [DEBUG] Confidence: 0.92 (HIGH)
```

### Monitoring & Observability

Built-in metrics and tracing:

```python
from stratus import StratusClient, MetricsCallback

client = StratusClient()

# Log metrics to your observability stack
metrics_cb = MetricsCallback(
    backend="prometheus",  # or datadog, cloudwatch, etc.
    labels={"agent": "checkout-bot", "env": "prod"}
)

loop = AgentLoop(client, callbacks=[metrics_cb])
result = loop.run(...)

# Metrics automatically tracked:
# - stratus_predictions_total
# - stratus_prediction_latency_ms
# - stratus_confidence_score
# - stratus_goal_progress
# - stratus_api_errors_total
```

---

## Testing & Quality

### Unit Tests (SDK)

Every SDK component must have:
- Unit tests (90%+ coverage)
- Integration tests (against staging API)
- Type checking (Python: mypy, TS: tsc)
- Linting (Python: ruff, TS: eslint)

### End-to-End Tests

Real agent scenarios:
1. Web automation (Selenium + Stratus)
2. LangChain tool use
3. Code execution
4. Multi-agent coordination

**Target**: All examples in docs must pass E2E tests.

### Performance Tests

Benchmarks to track:
- SDK overhead (< 5ms for local operations)
- API latency (p50 < 100ms, p99 < 500ms)
- Batch efficiency (10x predictions in 2x time)

---

## Deployment & Distribution

### Package Distribution

**Python**:
- PyPI: `pip install stratus-sdk`
- Versioning: SemVer (0.1.0 → 1.0.0 at stable release)
- Python versions: 3.9+

**TypeScript/JavaScript**:
- npm: `npm install @stratus/sdk`
- Versioning: SemVer
- Node versions: 16+

### Release Process

1. **Alpha** (internal testing): 0.1.x
2. **Beta** (public beta users): 0.2.x - 0.9.x
3. **Stable** (public release): 1.0.0

**Breaking changes**: Only in major versions (0.x → 1.x)

### Backwards Compatibility

**Promise**: SDK 1.x will maintain API compatibility for 12+ months.

**Deprecation process**:
1. Announce deprecation (release notes)
2. Warn in code (logging)
3. Remove in next major version

---

## Go-to-Market Integration

### Beta Program

**Target**: 5-10 beta users with SDK before public launch.

**Beta checklist**:
- [ ] Python SDK functional (predict, validate, plan)
- [ ] LangChain integration working
- [ ] Quickstart docs complete
- [ ] API rate limits configured
- [ ] Error handling polished
- [ ] Example projects ready

**Beta user profiles**:
1. AI engineer at startup (web automation use case)
2. Enterprise DevOps (workflow automation)
3. Framework maintainer (LangChain contributor)
4. Researcher (academic lab)
5. Open source developer (AutoGPT contributor)

### Launch Assets

SDK-specific launch content:
1. **GitHub repo**: `stratus-ai/stratus-sdk-python`
2. **Documentation site**: docs.stratus.run/sdk
3. **Example projects**: 5+ fully working examples
4. **Tutorial video**: "Build your first Stratus agent in 10 minutes"
5. **Blog post**: "Introducing Stratus SDK: Add a world model to your agent in 2 lines"

### Community Building

**Day 1**:
- Open source SDK on GitHub
- Publish quickstart docs
- Share on Twitter, HN, Reddit

**Week 1**:
- 5+ example projects public
- Tutorial videos live
- Office hours for beta users

**Month 1**:
- Framework integrations (LangChain, AutoGPT)
- Community showcase (users share projects)
- First community contributions (PRs accepted)

---

## Risks & Mitigations

### Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **API latency too high** | Users abandon if > 500ms | Optimize model inference, add edge caching |
| **SDK bugs in production** | Loss of trust, churn | Extensive testing, staged rollout, fast hotfix process |
| **State format incompatibility** | Integration friction | Support multiple formats (text, dict, embedding) |
| **Framework integration breaks** | Existing users blocked | Pin dependencies, regression tests, deprecation warnings |

### Product Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Developers don't see value** | Low adoption | Clear before/after benchmarks, case studies |
| **Too complex to integrate** | High drop-off | 2-line integration, clear docs, video tutorials |
| **Competitors release similar SDK** | Market share loss | Speed to market, superior DX, community building |
| **Model accuracy insufficient** | Users lose trust | Continuous training, confidence thresholds, fallback to LLM-only |

### Business Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Pricing too high** | Adoption blocked | Free tier (100 preds/day), pay-as-you-go, volume discounts |
| **Customer support overwhelmed** | Poor user experience | Comprehensive docs, community forum, office hours |
| **Open source forks** | Revenue loss | Dual license (SDK open, model closed), hosted API advantages |

---

## Timeline & Milestones

### Phase 1: Alpha (Weeks 1-2)

**Goal**: Internal SDK working for core use cases

**Deliverables**:
- [ ] Python SDK core client (predict, validate, plan)
- [ ] AgentLoop orchestration layer
- [ ] Basic tests (unit + integration)
- [ ] Internal documentation

**Success Criteria**: Team can build working agent with SDK.

---

### Phase 2: Private Beta (Weeks 3-4)

**Goal**: 5-10 beta users successfully integrating SDK

**Deliverables**:
- [ ] LangChain integration
- [ ] Quickstart documentation
- [ ] 3+ example projects
- [ ] Error handling polished
- [ ] Beta user onboarding flow

**Success Criteria**: Beta users report 1.5-2x task success improvement.

---

### Phase 3: Public Beta (Weeks 5-8)

**Goal**: 100+ developers using SDK, positive feedback

**Deliverables**:
- [ ] TypeScript/JS SDK
- [ ] AutoGPT integration
- [ ] Full API documentation
- [ ] Tutorial videos
- [ ] GitHub repo public
- [ ] Community forum

**Success Criteria**: 100+ active users, 50+ GitHub stars, positive sentiment.

---

### Phase 4: Stable Release (Weeks 9-12)

**Goal**: Production-ready SDK, 500+ developers

**Deliverables**:
- [ ] SDK v1.0.0 (stable API)
- [ ] Go SDK (optional)
- [ ] Advanced features (batch, streaming)
- [ ] Enterprise support tier
- [ ] Case studies published

**Success Criteria**: 500+ users, 50+ production deployments, 60+ NPS.

---

## Open Questions & Decisions Needed

### Technical Decisions

1. **State encoding strategy**
   - Should SDK auto-encode states to embeddings, or send raw to API?
   - Decision: Send raw, let API handle encoding (more flexible)

2. **Batch API design**
   - Synchronous batch or async job queue?
   - Decision: Sync for < 100 predictions, async for larger batches

3. **Caching strategy**
   - Cache predictions client-side or server-side?
   - Decision: Server-side (30s TTL), optional client-side cache

4. **Streaming vs polling for long-running plans**
   - WebSocket streaming or HTTP polling?
   - Decision: WebSocket for real-time, polling as fallback

### Product Decisions

5. **Free tier limits**
   - 100 predictions/day sufficient?
   - Decision: Start with 100, adjust based on beta feedback

6. **OpenAI compatibility layer**
   - Full compatibility or subset?
   - Decision: Subset (chat completions + tools), not embeddings/fine-tuning

7. **Framework integration priority**
   - LangChain first, or broader coverage?
   - Decision: LangChain first (80% of users), then AutoGPT, CrewAI

8. **Open source vs closed**
   - SDK open source, model closed?
   - Decision: SDK open (MIT license), model API closed

---

## Success Criteria

### Week 4 (Beta Launch)

- [ ] 5-10 beta users onboarded
- [ ] Python SDK functional (predict, validate, plan)
- [ ] LangChain integration working
- [ ] Quickstart docs complete
- [ ] At least 1 user reports 1.5x+ task success improvement

### Week 8 (Public Beta)

- [ ] 100+ developers using SDK
- [ ] 50+ GitHub stars
- [ ] TypeScript SDK released
- [ ] 3+ framework integrations
- [ ] Positive community sentiment (Twitter, HN)

### Week 12 (Stable Release)

- [ ] 500+ active users
- [ ] 50+ production deployments
- [ ] SDK v1.0.0 released
- [ ] Case studies published
- [ ] 60+ NPS score
- [ ] $10K+ MRR from SDK users

---

## Appendix

### Related Documents

- `VISION.md` - Stratus X1 product vision
- `ROADMAP.md` - Overall product roadmap
- `API_SERVER_TECHNICAL_SPEC.md` - Backend API specification
- `STRATUS_X1_PROFILE.md` - Model capabilities profile

### Glossary

- **PAM**: Predictive Action Model
- **JEPA**: Joint Embedding Predictive Architecture
- **State**: Environment observation at a point in time
- **Action**: Operation to execute in environment
- **Goal**: Desired end state or success criteria
- **Validation**: Checking if action progresses toward goal
- **Planning**: Generating multi-step action sequence

### References

- Meta V-JEPA 2 paper: https://ai.meta.com/research/publications/v-jepa-2/
- WebArena benchmark: https://webarena.dev/
- SWE-Bench: https://www.swebench.com/
- LangChain docs: https://langchain.com/

---

**Document Status**: Draft v1.0
**Last Updated**: 2026-01-27
**Owner**: Formation
**Reviewers**: TBD
**Next Review**: Beta launch readiness (Week 3)
