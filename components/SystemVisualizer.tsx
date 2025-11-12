import React, { useMemo, useEffect, useRef, useState } from 'react';
import {
  CpuChipIcon,
  ServerIcon,
  CloudIcon,
  CodeBracketSquareIcon,
  MagnifyingGlassIcon,
  CircleStackIcon,
  InformationCircleIcon,
  SitemapIcon,
  ChatBubbleLeftRightIcon,
  WrenchScrewdriverIcon,
  CheckCircleIcon,
  XCircleIcon,
  FlagIcon,
  PaperAirplaneIcon,
  SquareIcon,
  ClipboardDocumentListIcon,
  DocumentMagnifyingGlassIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
  ShareIcon,
  ArrowPathIcon,
  HandThumbUpIcon,
  ArrowsRightLeftIcon,
  DashedCircleIcon,
  BeakerIcon,
  DocumentDuplicateIcon
} from './Icons';
import ResearchPlanVisualizer from './ResearchPlanVisualizer';
import Tooltip from './Tooltip';
import type { SystemData, Agent, FlowLink, Tool, AgentStatus, DataFlowMetric } from '../types';

interface SystemVisualizerProps {
  parsedYaml: SystemData;
  agentStatuses: Record<string, AgentStatus>;
  dataFlowMetrics: Record<string, DataFlowMetric>;
}

const ToolIcon: React.FC<{ tool: string }> = ({ tool }) => {
    const iconMap: { [key: string]: React.ReactNode } = {
        'vertex_ai_search': <MagnifyingGlassIcon className="w-4 h-4 mr-1.5 text-cyan-400" />,
        'google_custom_search_api': <MagnifyingGlassIcon className="w-4 h-4 mr-1.5 text-cyan-400" />,
        'bigquery': <ServerIcon className="w-4 h-4 mr-1.5 text-cyan-400" />,
        'bigquery_connector': <ServerIcon className="w-4 h-4 mr-1.5 text-cyan-400" />,
        'cloud_functions': <CodeBracketSquareIcon className="w-4 h-4 mr-1.5 text-cyan-400" />,
        'google_drive_api': <CloudIcon className="w-4 h-4 mr-1.5 text-cyan-400" />,
        'google_slides_api': <CloudIcon className="w-4 h-4 mr-1.5 text-cyan-400" />,
        'google_docs_api': <CloudIcon className="w-4 h-4 mr-1.5 text-cyan-400" />,
        'cloud_storage_uploader': <CloudIcon className="w-4 h-4 mr-1.5 text-cyan-400" />,
        'langchain_vertex': <CpuChipIcon className="w-4 h-4 mr-1.5 text-gray-400" />,
        'vertex_ai_embeddings': <CpuChipIcon className="w-4 h-4 mr-1.5 text-gray-400" />,
        'visualize_research_plan': <SitemapIcon className="w-4 h-4 mr-1.5 text-cyan-400" />,
        'collect_user_feedback': <ChatBubbleLeftRightIcon className="w-4 h-4 mr-1.5 text-cyan-400" />,
        'QualityAssurance': <WrenchScrewdriverIcon className="w-4 h-4 mr-1.5 text-gray-400" />,
        'vertex_ai_natural_language_api': <CpuChipIcon className="w-4 h-4 mr-1.5 text-gray-400" />,
        'zendesk_api_connector': <WrenchScrewdriverIcon className="w-4 h-4 mr-1.5 text-gray-400" />,
        'twitter_api_connector': <ChatBubbleLeftRightIcon className="w-4 h-4 mr-1.5 text-cyan-400" />,
        'google_sheets_api': <CloudIcon className="w-4 h-4 mr-1.5 text-cyan-400" />
    };

    // FIX: The 'tool' prop is always a string based on usage in AgentCard, so the conditional type check was incorrect and caused an error.
    const toolName = tool;
    return iconMap[toolName] || <CpuChipIcon className="w-4 h-4 mr-1.5 text-gray-400" />;
};

const StatusIcon: React.FC<{ status: AgentStatus['status'] }> = ({ status }) => {
    if (status === 'pending') return null;

    const iconMap = {
        running: (
            <div className="relative flex h-3 w-3" title="Uruchomiony">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </div>
        ),
        success: <span title="Sukces"><CheckCircleIcon className="w-4 h-4 text-green-400" /></span>,
        failed: <span title="Błąd"><XCircleIcon className="w-4 h-4 text-red-400" /></span>,
        pending: null,
    };
    return <div className="ml-auto">{iconMap[status]}</div>;
};

const AgentRoleIcon: React.FC<{ role: string; type: Agent['type'] }> = ({ role, type }) => {
    const iconMap: { [key: string]: React.FC<any> } = {
        // From palette
        start: FlagIcon,
        agent: PaperAirplaneIcon,
        end: SquareIcon,
        note: ClipboardDocumentListIcon,
        file_search: DocumentMagnifyingGlassIcon,
        guardrails: ShieldCheckIcon,
        mcp: Squares2X2Icon,
        if_else: ShareIcon,
        'while': ArrowPathIcon,
        user_approval: HandThumbUpIcon,
        transform: ArrowsRightLeftIcon,
        set_state: DashedCircleIcon,

        // Common roles from templates
        planner: FlagIcon,
        retriever: MagnifyingGlassIcon,
        collector: MagnifyingGlassIcon,
        data_analyst: BeakerIcon,
        analyzer: BeakerIcon,
        refiner: BeakerIcon,
        validator: ShieldCheckIcon,
        summarizer: DocumentDuplicateIcon,
        reporter: DocumentDuplicateIcon,
        writer: DocumentDuplicateIcon,
        exporter: DocumentDuplicateIcon,
        feedback_collector: ChatBubbleLeftRightIcon,
        qa_analyst: WrenchScrewdriverIcon,
        classifier: SitemapIcon,
        responder: ChatBubbleLeftRightIcon,
        escalator: HandThumbUpIcon,
        optimizer: BeakerIcon,
        researcher: MagnifyingGlassIcon,
    };

    const colorMap: { [key: string]: string } = {
      core: 'text-blue-400',
      tool: 'text-yellow-400',
      logic: 'text-orange-400',
      data: 'text-purple-400',
      agent: 'text-cyan-400',
    };

    const IconComponent = iconMap[role] || CpuChipIcon;
    const iconColor = colorMap[type] || colorMap.agent;

    return <IconComponent className={`w-6 h-6 mr-3 ${iconColor}`} />;
};

const AgentCard: React.FC<{
    agent: Agent,
    highlight: 'default' | 'dimmed' | 'main' | 'related',
    status: AgentStatus['status'],
    onMouseEnter: (event: React.MouseEvent<HTMLDivElement>) => void,
    onMouseLeave: () => void,
    onVisualizePlan: (agent: Agent) => void
}> = ({ agent, highlight, status, onMouseEnter, onMouseLeave, onVisualizePlan }) => {
    const highlightClasses = {
        default: 'opacity-100',
        dimmed: 'opacity-40',
        main: 'shadow-lg shadow-cyan-500/20 opacity-100 scale-105',
        related: 'opacity-100'
    };

    const statusBorderClasses = {
        pending: highlight === 'main' ? 'border-cyan-400' : highlight === 'related' ? 'border-cyan-600' : 'border-gray-700',
        running: 'border-cyan-400 ring-2 ring-cyan-400/30',
        success: 'border-green-500',
        failed: 'border-red-500',
    };
    
    const agentCardClasses = `bg-gray-800 border-2 rounded-lg p-4 flex flex-col gap-3 transition-all duration-300 w-72 relative z-10 ${highlightClasses[highlight]} ${statusBorderClasses[status]}`;

    return (
        <div
            className={agentCardClasses}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div className="flex items-center">
                <AgentRoleIcon role={agent.role} type={agent.type || 'agent'} />
                <div>
                    <h4 className="font-bold text-white">{agent.name}</h4>
                    <span className="text-xs text-gray-400 bg-gray-700 px-2 py-0.5 rounded-full">{agent.role}</span>
                </div>
                <StatusIcon status={status} />
            </div>
            <p className="text-sm text-gray-400"><span className="font-semibold text-gray-300">Model:</span> {agent.model}</p>

            {agent.context && (
                <div className="mt-1 p-2 bg-gray-700/50 rounded-md">
                    <div className="flex items-start">
                        <InformationCircleIcon className="w-4 h-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                        <p className="text-xs text-gray-400 truncate"><span className="font-semibold text-gray-300">Kontekst:</span> {agent.context}</p>
                    </div>
                </div>
            )}

            <div>
                <h5 className="text-sm font-semibold text-gray-300 mb-1.5">Narzędzia:</h5>
                <div className="flex flex-col gap-2">
                    {agent.tools?.map((tool, toolIndex) => {
                        const toolObj = typeof tool === 'string' ? { name: tool } : tool;

                        if (toolObj.interactive) {
                            return (
                                <button
                                    key={toolIndex}
                                    onClick={() => onVisualizePlan(agent)}
                                    className="w-full bg-cyan-800/50 hover:bg-cyan-700/60 p-2 rounded-md text-left transition-colors duration-200"
                                    title={toolObj.description}
                                >
                                    <div className="flex items-center text-xs text-cyan-300">
                                        <ToolIcon tool={toolObj.name} />
                                        <span className="font-medium">{toolObj.name}</span>
                                        <span className="ml-auto text-xs text-cyan-500 font-mono">[UI]</span>
                                    </div>
                                </button>
                            );
                        }

                        return (
                            <div key={toolIndex} className="bg-gray-700/50 p-2 rounded-md">
                                <div className="flex items-center text-xs text-gray-300">
                                    <ToolIcon tool={toolObj.name} />
                                    <span className="font-medium">{toolObj.name}</span>
                                </div>
                                {toolObj.params && (
                                    <div className="mt-2 ml-2 pl-2 border-l-2 border-gray-600">
                                        <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono">
                                            <code>{JSON.stringify(toolObj.params, null, 2)}</code>
                                        </pre>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div>
                <h5 className="text-sm font-semibold text-gray-300 mb-1.5">Zadania:</h5>
                <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                    {agent.tasks?.map((task) => (
                        <li key={task}>{task}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const DataFlowLegend: React.FC = () => (
    <div className="flex items-center justify-center gap-4 text-xs text-gray-400 p-2 rounded-lg bg-gray-800/50 mt-2 mb-4">
        <span className="font-semibold mr-2">Legenda przepływu danych:</span>
        <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-cyan-300 mr-1.5"></div>Normalny</div>
        <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-yellow-500 mr-1.5"></div>Wysoki</div>
        <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-orange-500 mr-1.5"></div>Wąskie gardło</div>
    </div>
);

const SystemVisualizer: React.FC<SystemVisualizerProps> = ({ parsedYaml, agentStatuses, dataFlowMetrics }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const [svgElements, setSvgElements] = useState<{ edges: React.ReactElement[], particles: React.ReactElement[] }>({ edges: [], particles: [] });
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);
  const [visualizingPlanFor, setVisualizingPlanFor] = useState<Agent | null>(null);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    content: React.ReactNode;
    x: number;
    y: number;
  }>({ visible: false, content: null, x: 0, y: 0 });

  if (!parsedYaml || !parsedYaml.system) {
    return (
      <div className="p-4 text-center text-gray-400">
        Brak danych do wizualizacji lub nieprawidłowa struktura YAML.
      </div>
    );
  }

  const { name, description, agents, flow, communication, deployment, memory } = parsedYaml.system;

  const flowLinks: FlowLink[] = useMemo(() => {
    if (Array.isArray(flow)) return flow;
    if (typeof flow === 'string') {
        const parts = flow.split('->').map(s => s.trim());
        if (parts.length === 2) return [{ from: parts[0], to: [parts[1]] }];
    }
    return [];
  }, [flow]);

  const { predecessors, successors } = useMemo(() => {
    const predecessors = new Map<string, Set<string>>();
    const successors = new Map<string, Set<string>>();
    if (!agents) return { predecessors, successors };

    agents.forEach(agent => {
        predecessors.set(agent.name, new Set());
        successors.set(agent.name, new Set());
    });

    flowLinks.forEach(link => {
        link.to.forEach(toAgent => {
            if (successors.has(link.from)) {
                successors.get(link.from)!.add(toAgent);
            }
            if (predecessors.has(toAgent)) {
                predecessors.get(toAgent)!.add(link.from);
            }
        });
    });

    return { predecessors, successors };
  }, [agents, flowLinks]);

  const columns = useMemo(() => {
    if (!agents || agents.length === 0) return [];

    const agentMap = new Map(agents.map(a => [a.name, a]));
    const adj: Map<string, string[]> = new Map();
    const inDegree: Map<string, number> = new Map();

    agents.forEach(agent => {
        adj.set(agent.name, []);
        inDegree.set(agent.name, 0);
    });

    flowLinks.forEach(link => {
        link.to.forEach(toAgent => {
            adj.get(link.from)?.push(toAgent);
            inDegree.set(toAgent, (inDegree.get(toAgent) || 0) + 1);
        });
    });

    const queue = agents.filter(agent => inDegree.get(agent.name) === 0).map(a => a.name);
    const result: Agent[][] = [];
    const agentsInFlow = new Set<string>();

    while (queue.length > 0) {
        const levelSize = queue.length;
        const currentLevel: Agent[] = [];

        for (let i = 0; i < levelSize; i++) {
            const agentName = queue.shift()!;
            const agent = agentMap.get(agentName);
            if(agent) {
              currentLevel.push(agent);
              agentsInFlow.add(agentName);
            }

            adj.get(agentName)?.forEach(neighbor => {
                inDegree.set(neighbor, (inDegree.get(neighbor) || 0) - 1);
                if (inDegree.get(neighbor) === 0) {
                    queue.push(neighbor);
                }
            });
        }
        if(currentLevel.length > 0) result.push(currentLevel);
    }
    
    const orphanAgents = agents.filter(a => !agentsInFlow.has(a.name));
    if (orphanAgents.length > 0) {
        if (result.length > 0) {
            result[0] = [...orphanAgents, ...result[0]];
        } else {
            result.push(orphanAgents);
        }
    }

    return result;
  }, [agents, flowLinks]);
  
  const handleShowAgentTooltip = (event: React.MouseEvent, agent: Agent) => {
    const content = (
        <div className="max-w-xs space-y-2">
            <h5 className="font-bold text-base text-cyan-400 border-b border-gray-600 pb-1 mb-2">{agent.name}</h5>
            <div>
                <p className="font-semibold text-gray-300">Kontekst:</p>
                <p className="text-gray-400 italic">"{agent.context}"</p>
            </div>
            <div className="pt-1">
                <p className="font-semibold text-gray-300">Model:</p>
                <p className="text-gray-400 font-mono bg-gray-700/50 px-2 py-0.5 rounded-md inline-block">{agent.model}</p>
            </div>
        </div>
    );
    setTooltip({ visible: true, content, x: event.clientX, y: event.clientY });
  };

  const handleShowFlowTooltip = (event: React.MouseEvent, link: FlowLink, toAgent: string, metric: DataFlowMetric | undefined) => {
    const content = (
        <div className="space-y-1.5">
            <h5 className="font-bold text-base text-cyan-400 border-b border-gray-600 pb-1 mb-2">Szczegóły Przepływu</h5>
            <p><span className="font-semibold text-gray-300 w-16 inline-block">Z:</span> {link.from}</p>
            <p><span className="font-semibold text-gray-300 w-16 inline-block">Do:</span> {toAgent}</p>
            {link.label && <p><span className="font-semibold text-gray-300 w-16 inline-block">Opis:</span> {link.label}</p>}
            {metric && (
                <div className="pt-2 mt-2 border-t border-gray-600">
                    <p><span className="font-semibold text-gray-300 w-16 inline-block">Pakiety:</span> {metric.packetCount}</p>
                    <p><span className="font-semibold text-gray-300 w-16 inline-block">Rozmiar:</span> {metric.totalSizeKB.toFixed(2)} KB</p>
                </div>
            )}
        </div>
    );
    setTooltip({ visible: true, content, x: event.clientX, y: event.clientY });
  };
  
  const handleHideTooltip = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  useEffect(() => {
      const calculateSvgElements = () => {
          if (!containerRef.current) return;
          const newEdges: React.ReactElement[] = [];
          const newParticles: React.ReactElement[] = [];
          const containerRect = containerRef.current.getBoundingClientRect();

          flowLinks.forEach((link, index) => {
              const fromNode = nodeRefs.current.get(link.from);
              if (!fromNode) return;

              const fromRect = fromNode.getBoundingClientRect();
              const startX = fromRect.right - containerRect.left;
              const startY = fromRect.top - containerRect.top + fromRect.height / 2;
              
              link.to.forEach((toAgent, toIndex) => {
                  const toNode = nodeRefs.current.get(toAgent);
                  if (!toNode) return;

                  const toRect = toNode.getBoundingClientRect();
                  const endX = toRect.left - containerRect.left;
                  const endY = toRect.top - containerRect.top + toRect.height / 2;

                  const isRelated = hoveredAgent && (link.from === hoveredAgent || toAgent === hoveredAgent);
                  const isDimmed = hoveredAgent && !isRelated;
                  
                  const metricKey = `${link.from}->${toAgent}`;
                  const metric = dataFlowMetrics[metricKey];

                  let strokeColor = "#4b5563"; // gray-600
                  let strokeWidth = 2;
                  let opacity = 1.0;
                  
                  if (isRelated) {
                    strokeColor = "#22d3ee";
                    strokeWidth = 2.5;
                  } else if (isDimmed) {
                    opacity = 0.3;
                  }

                  if (metric && !isDimmed) {
                      const { totalSizeKB } = metric;
                      if (totalSizeKB > 500) strokeColor = "#f97316"; // orange-500
                      else if (totalSizeKB > 100) strokeColor = "#eab308"; // yellow-500
                      else strokeColor = "#67e8f9"; // cyan-300
                      
                      const numParticles = Math.min(Math.ceil(totalSizeKB / 50), 10);
                      const pathD = `M${startX},${startY} C${startX + 60},${startY} ${endX - 60},${endY} ${endX},${endY}`;

                      for (let i = 0; i < numParticles; i++) {
                          newParticles.push(
                              <circle cx="0" cy="0" r="3" fill={strokeColor} key={`p-${index}-${toIndex}-${i}`}>
                                  <animateMotion
                                      dur="3s"
                                      repeatCount="indefinite"
                                      path={pathD}
                                      begin={`${i * (3 / numParticles)}s`}
                                  />
                              </circle>
                          );
                      }
                  }

                  const controlX1 = startX + 60;
                  const controlY1 = startY;
                  const controlX2 = endX - 60;
                  const controlY2 = endY;

                  const pathId = `edge-${index}-${toIndex}`;
                  const pathD = `M${startX},${startY} C${controlX1},${controlY1} ${controlX2},${controlY2} ${endX},${endY}`;
                  
                  newEdges.push(
                    <g 
                       key={pathId} 
                       style={{ transition: 'all 0.3s ease', opacity }}
                       onMouseEnter={(e) => handleShowFlowTooltip(e, link, toAgent, metric)}
                       onMouseLeave={handleHideTooltip}
                    >
                      <path d={pathD} stroke="transparent" strokeWidth={20} fill="none" className="cursor-pointer" />
                      <path d={pathD} stroke={strokeColor} strokeWidth={strokeWidth} fill="none" markerEnd="url(#arrowhead)" />
                       {link.label && (
                         <>
                          <path id={`text-path-${pathId}`} d={pathD} fill="none"/>
                          <text dy="-5" fill={isRelated ? "#67e8f9" : "#9ca3af"} fontSize="12" className="font-semibold transition-colors duration-300 pointer-events-none">
                            <textPath href={`#text-path-${pathId}`} startOffset="50%" textAnchor="middle">
                               {link.label}
                            </textPath>
                          </text>
                         </>
                       )}
                    </g>
                  );
              });
          });
          setSvgElements({ edges: newEdges, particles: newParticles });
      };

      const timeoutId = setTimeout(calculateSvgElements, 100);
      window.addEventListener('resize', calculateSvgElements);

      return () => {
          clearTimeout(timeoutId);
          window.removeEventListener('resize', calculateSvgElements);
      };
  }, [columns, flowLinks, hoveredAgent, dataFlowMetrics]);


  const getHighlightState = (agentName: string): 'default' | 'dimmed' | 'main' | 'related' => {
      if (!hoveredAgent) return 'default';
      if (agentName === hoveredAgent) return 'main';
      if (successors.get(hoveredAgent)?.has(agentName) || predecessors.get(hoveredAgent)?.has(agentName)) {
          return 'related';
      }
      return 'dimmed';
  };

  return (
    <>
      <Tooltip
        visible={tooltip.visible}
        content={tooltip.content}
        x={tooltip.x}
        y={tooltip.y}
      />
      <div className="p-4 sm:p-6 bg-gray-900/50 h-full overflow-y-auto">
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{name}</h2>
            {description && <p className="text-sm text-gray-400 max-w-xl">{description}</p>}
            <div className="h-0.5 w-20 bg-cyan-400 mt-2"></div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-300">Wizualizacja Przepływu</h3>
            <DataFlowLegend />
            <div ref={containerRef} className="relative p-4 min-h-[400px]">
              <svg className="absolute top-0 left-0 w-full h-full z-0 overflow-visible">
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="8" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
                  </marker>
                </defs>
                {svgElements.edges}
                {svgElements.particles}
              </svg>

              <div className="relative z-10 flex items-start justify-start gap-24">
                {columns.map((column, colIndex) => (
                  <div key={colIndex} className="flex flex-col items-center gap-8 flex-shrink-0">
                    {column.map(agent => {
                      const status = agentStatuses[agent.name]?.status || 'pending';
                      return (
                        <div key={agent.name} ref={el => { nodeRefs.current.set(agent.name, el); }}>
                           <AgentCard
                                agent={agent}
                                highlight={getHighlightState(agent.name)}
                                status={status}
                                onMouseEnter={(e) => {
                                    setHoveredAgent(agent.name);
                                    handleShowAgentTooltip(e, agent);
                                }}
                                onMouseLeave={() => {
                                    setHoveredAgent(null);
                                    handleHideTooltip();
                                }}
                                onVisualizePlan={setVisualizingPlanFor}
                            />
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {memory && (
            <div>
              <h3 className="text-lg font-semibold text-gray-300 mb-3">Pamięć (Memory)</h3>
              <div className="bg-gray-800 p-3 rounded-lg flex items-center border border-gray-700">
                  <CircleStackIcon className="w-8 h-8 mr-4 text-cyan-400 flex-shrink-0" />
                  <div>
                      <p className="font-semibold text-gray-200">{memory.type} ({memory.backend})</p>
                      <p className="text-xs text-gray-400">Model embeddingu: {memory.embedding_model}</p>
                  </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-700/50">
              <div className="bg-gray-800 p-3 rounded-lg flex items-center">
                  <ServerIcon className="w-5 h-5 mr-3 text-cyan-400" />
                  <div>
                      <p className="text-xs text-gray-400">Komunikacja</p>
                      <p className="font-semibold text-gray-200">{communication}</p>
                  </div>
              </div>
              <div className="bg-gray-800 p-3 rounded-lg flex items-center">
                  <CloudIcon className="w-5 h-5 mr-3 text-cyan-400" />
                  <div>
                      <p className="text-xs text-gray-400">Wdrożenie</p>
                      {typeof deployment === 'object' && deployment.target ? (
                          <>
                              <p className="font-semibold text-gray-200">{deployment.target}</p>
                              {deployment.monitoring?.enabled && (
                                  <span className="text-xs text-green-400">Monitoring włączony</span>
                              )}
                          </>
                      ) : (
                          <p className="font-semibold text-gray-200">{deployment as string}</p>
                      )}
                  </div>
              </div>
          </div>
        </div>
      </div>
      {visualizingPlanFor && (
        <ResearchPlanVisualizer
          agent={visualizingPlanFor}
          onClose={() => setVisualizingPlanFor(null)}
        />
      )}
    </>
  );
};

export default SystemVisualizer;