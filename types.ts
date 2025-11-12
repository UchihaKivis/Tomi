export interface Tool {
  name: string;
  interactive?: boolean;
  description?: string;
  params?: Record<string, any>;
}

export interface Agent {
  name: string;
  role: string; // e.g., 'planner', 'if_else', 'end'
  type: 'core' | 'tool' | 'logic' | 'data' | 'agent'; // Category
  description: string;
  model?: string; // Optional for non-AI nodes
  context?: string; // Optional for non-AI nodes
  condition?: string; // For logic nodes like if/else, while
  tools: (string | Tool)[];
  tasks: string[];
  x?: number; // Position for visual editor
  y?: number; // Position for visual editor
}

export interface FlowLink {
  from: string;
  to: string[];
  label?: string;
  port?: 'true' | 'false' | 'loop' | 'exit' | string; // To specify output port for logic nodes
}

export interface SystemData {
  system: {
    name: string;
    description?: string;
    agents: Agent[];
    flow: FlowLink[] | string;
    communication: string;
    memory?: {
      type: string;
      backend: string;
      embedding_model: string;
    };
    deployment: string | {
      target: string;
      monitoring?: {
        enabled: boolean;
        tools?: string[];
      };
    };
  };
}

export interface AgentStatus {
    status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
    error?: string;
    solution?: string;
}

export interface SimulationLog {
    type: 'info' | 'success' | 'error' | 'warning';
    message: string;
    agentName: string;
    durationMs?: number;
}

export interface SimulationUpdate {
    log?: SimulationLog;
    statusUpdate?: {
        agentName: string;
        status: AgentStatus['status'];
        error?: string;
        solution?: string;
    };
    dataFlowUpdate?: DataFlowMetric;
    waitForStep?: { agentName: string, message?: string };
}


export interface DataFlowMetric {
    from: string;
    to: string;
    packetCount: number;
    totalSizeKB: number;
}

export interface Version {
    id: string;
    yaml: string;
    timestamp: string;
    prompt: string;
    templateId: string;
}
