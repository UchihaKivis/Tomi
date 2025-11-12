import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { SystemData, Agent, FlowLink } from '../types';
import jsYaml from 'js-yaml';
import { editAgentSystemWithPrompt } from '../services/geminiService';
import { 
    CpuChipIcon, DocumentDownloadIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, ChevronDownIcon,
    PaperAirplaneIcon, SquareIcon, ClipboardDocumentListIcon, DocumentMagnifyingGlassIcon, ShieldCheckIcon,
    Squares2X2Icon, ShareIcon, ArrowPathIcon, HandThumbUpIcon, ArrowsRightLeftIcon, DashedCircleIcon, FlagIcon,
    SparklesIcon
} from './Icons';
import ConfigPanel from './ConfigPanel';

const PALETTE_CONFIG = {
  core: {
    title: '🧩 Core',
    color: 'blue',
    items: [
      {
        role: 'start',
        title: 'Start',
        icon: FlagIcon,
        description: 'Rozpoczyna przepływ, definiując punkt wejścia i początkowe dane.',
        defaultData: { type: 'core', context: 'Dane wejściowe i parametry początkowe dla przepływu.', tools: [], tasks: ['zainicjuj_przepływ'] }
      },
      {
        role: 'agent',
        title: 'Agent',
        icon: PaperAirplaneIcon,
        description: 'Tworzy i uruchamia agenta (model AI) w przepływie, który wykonuje określone zadanie.',
        defaultData: { type: 'core', model: 'gemini-2.5-pro', context: 'Nowy agent AI.', tools: [], tasks: ['nowe_zadanie'] }
      },
      {
        role: 'end',
        title: 'End',
        icon: SquareIcon,
        description: 'Kończy działanie przepływu lub konkretnej ścieżki logicznej.',
        defaultData: { type: 'core', tools: [], tasks: [] }
      },
      {
        role: 'note',
        title: 'Note',
        icon: ClipboardDocumentListIcon,
        description: 'Dodaje notatkę lub komentarz opisowy w schemacie (nie wpływa na logikę).',
        defaultData: { type: 'core', context: 'To jest notatka.', tools: [], tasks: [] }
      }
    ]
  },
  tools: {
    title: '🛠️ Tools',
    color: 'yellow',
    items: [
      {
        role: 'file_search',
        title: 'File search',
        icon: DocumentMagnifyingGlassIcon,
        description: 'Wyszukuje dane lub dokumenty (np. w Drive, Slack, GitHub) w ramach przepływu.',
        defaultData: { type: 'tool', tools: ['google_drive_api'], tasks: ['znajdź_plik_z_danymi'] }
      },
      {
        role: 'guardrails',
        title: 'Guardrails',
        icon: ShieldCheckIcon,
        description: 'Definiuje zasady bezpieczeństwa i ograniczenia dla agentów (np. blokuje niepożądane odpowiedzi).',
        defaultData: { type: 'tool', tools: [], tasks: ['sprawdź_zgodność_z_polityką'] }
      },
      {
        role: 'mcp',
        title: 'MCP',
        icon: Squares2X2Icon,
        description: 'Umożliwia łączenie przepływu z zewnętrznymi kontekstami lub narzędziami (np. API, pluginami).',
        defaultData: { type: 'tool', tools: ['cloud_functions'], tasks: ['wywołaj_zewnętrzne_api'] }
      }
    ]
  },
  logic: {
    title: '🔁 Logic',
    color: 'orange',
    items: [
      {
        role: 'if_else',
        title: 'If / else',
        icon: ShareIcon,
        description: 'Warunkowe rozgałęzienie; pozwala wykonać różne akcje w zależności od wyniku testu logicznego.',
        defaultData: { type: 'logic', condition: 'zmienna == "wartość"', tools: [], tasks: [] }
      },
      {
        role: 'while',
        title: 'While',
        icon: ArrowPathIcon,
        description: 'Pętla powtarzająca blok czynności dopóki warunek jest spełniony.',
        defaultData: { type: 'logic', condition: 'licznik < 3', tools: [], tasks: [] }
      },
      {
        role: 'user_approval',
        title: 'User approval',
        icon: HandThumbUpIcon,
        description: 'Wstrzymuje wykonanie przepływu do czasu, aż użytkownik zatwierdzi lub odrzuci wynik/agenta.',
        defaultData: { type: 'logic', tools: [], tasks: [] }
      }
    ]
  },
  data: {
    title: '📊 Data',
    color: 'purple',
    items: [
      {
        role: 'transform',
        title: 'Transform',
        icon: ArrowsRightLeftIcon,
        description: 'Przetwarza lub przekształca dane (np. formatowanie tekstu, filtrowanie wyników).',
        defaultData: { type: 'data', tools: [], tasks: ['sformatuj_dane_wyjściowe'] }
      },
      {
        role: 'set_state',
        title: 'Set state',
        icon: DashedCircleIcon,
        description: 'Ustawia lub modyfikuje stan danych wewnątrz przepływu (np. zapis zmiennych).',
        defaultData: { type: 'data', tools: [], tasks: ['ustaw_zmienną_status'] }
      }
    ]
  }
};


interface WorkflowEditorProps {
    systemData: SystemData;
    onUpdate: (data: SystemData) => void;
    onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
    isWorkflowFullscreen: boolean;
    setIsWorkflowFullscreen: (isFullscreen: boolean) => void;
}

const WorkflowEditor: React.FC<WorkflowEditorProps> = ({ systemData, onUpdate, onImport, isWorkflowFullscreen, setIsWorkflowFullscreen }) => {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const [draggingAgent, setDraggingAgent] = useState<{ agent: Agent, offset: { x: number, y: number } } | null>(null);
    const [connecting, setConnecting] = useState<{ from: string, fromPort: string, endX: number, endY: number } | null>(null);
    const canvasRef = useRef<HTMLDivElement>(null);
    const importInputRef = useRef<HTMLInputElement>(null);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [openPaletteSections, setOpenPaletteSections] = useState<Record<string, boolean>>({ core: true, tools: true, logic: true, data: true });
    
    // AI Editing State
    const [aiPrompt, setAiPrompt] = useState('');
    const [isAiEditing, setIsAiEditing] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);


    useEffect(() => {
        const initialAgents = systemData.system.agents.map((agent, index) => ({
            ...agent,
            type: agent.type || 'agent',
            description: agent.description || `Agent wykonujący rolę: ${agent.role}`,
            x: agent.x ?? (index % 4) * 320 + 100,
            y: agent.y ?? Math.floor(index / 4) * 220 + 100,
        }));
        setAgents(initialAgents);
    }, [systemData]);
    
    const handleAiEdit = async () => {
        if (!aiPrompt.trim()) return;

        setIsAiEditing(true);
        setAiError(null);
        
        // Remove x,y coordinates before sending to AI
        const systemDataForAI = {
            ...systemData,
            system: {
                ...systemData.system,
                agents: systemData.system.agents.map(({ x, y, ...rest }) => rest),
            },
        };

        try {
            const currentYaml = jsYaml.dump(systemDataForAI);
            const newYaml = await editAgentSystemWithPrompt(currentYaml, aiPrompt);
            const newSystemData = jsYaml.load(newYaml) as SystemData;
            
            if (typeof newSystemData === 'object' && newSystemData !== null && newSystemData.system) {
                onUpdate(newSystemData);
                setAiPrompt('');
            } else {
                throw new Error("AI zwróciło nieprawidłową strukturę YAML.");
            }

        } catch (e: any) {
            setAiError(e.message || "Wystąpił nieoczekiwany błąd podczas edycji AI.");
        } finally {
            setIsAiEditing(false);
        }
    };


    const updateSystemData = (updatedAgents: Agent[], updatedFlow?: FlowLink[]) => {
        const finalFlow = updatedFlow || (Array.isArray(systemData.system.flow) ? systemData.system.flow : []);
        onUpdate({
            ...systemData,
            system: {
                ...systemData.system,
                agents: updatedAgents.map(({...rest}) => rest), // Remove runtime properties
                flow: finalFlow,
            },
        });
    };

    const handleDragStartPalette = (e: React.DragEvent<HTMLDivElement>, item: (typeof PALETTE_CONFIG.core.items)[0]) => {
        e.dataTransfer.setData('application/json', JSON.stringify(item));
        e.dataTransfer.effectAllowed = 'copy';
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const canvasBounds = canvas.getBoundingClientRect();

        const itemTemplate = JSON.parse(e.dataTransfer.getData('application/json'));
        const newAgent: Agent = {
            name: `${itemTemplate.role}_${agents.length + 1}`,
            role: itemTemplate.role,
            description: itemTemplate.description,
            ...itemTemplate.defaultData,
            x: e.clientX - canvasBounds.left + canvas.scrollLeft,
            y: e.clientY - canvasBounds.top + canvas.scrollTop,
        };

        const updatedAgents = [...agents, newAgent];
        setAgents(updatedAgents);
        updateSystemData(updatedAgents);
    };

    const handleMouseDownAgent = (e: React.MouseEvent<HTMLDivElement>, agent: Agent) => {
        if ((e.target as HTMLElement).closest('button, .port')) return; // Ignore clicks on buttons or ports
        e.stopPropagation();
        const target = e.currentTarget;
        const rect = target.getBoundingClientRect();
        const offset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        setDraggingAgent({ agent, offset });
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const canvasBounds = canvas.getBoundingClientRect();

        if (draggingAgent) {
            const updatedAgents = agents.map(a =>
                a.name === draggingAgent.agent.name
                    ? { ...a, x: e.clientX - canvasBounds.left - draggingAgent.offset.x + canvas.scrollLeft, y: e.clientY - canvasBounds.top - draggingAgent.offset.y + canvas.scrollTop }
                    : a
            );
            setAgents(updatedAgents);
        }
        if (connecting) {
            setConnecting({
                ...connecting,
                endX: e.clientX - canvasBounds.left + canvas.scrollLeft,
                endY: e.clientY - canvasBounds.top + canvas.scrollTop,
            });
        }
    };
    
    const handleMouseUp = () => {
        if (draggingAgent) {
            updateSystemData(agents);
            setDraggingAgent(null);
        }
        if (connecting) {
            setConnecting(null);
        }
    };

    const handleStartConnection = (e: React.MouseEvent<HTMLDivElement>, agent: Agent, port: string, portY: number) => {
        e.stopPropagation();
        if (agent.x === undefined || agent.y === undefined) return;
        setConnecting({ from: agent.name, fromPort: port, endX: agent.x + 288, endY: agent.y + portY });
    };

    const handleFinishConnection = (e: React.MouseEvent<HTMLDivElement>, toAgentName: string) => {
        e.stopPropagation();
        if (!connecting || connecting.from === toAgentName) {
            setConnecting(null);
            return;
        }

        const flow = Array.isArray(systemData.system.flow) ? [...systemData.system.flow] : [];
        
        const newLink: FlowLink = { from: connecting.from, to: [toAgentName], port: connecting.fromPort, label: "Data" };
        
        let linkUpdated = false;
        const updatedFlow = flow.map(link => {
            if (link.from === newLink.from && link.port === newLink.port) {
                // Port already has a connection, overwrite it
                linkUpdated = true;
                return { ...link, to: [toAgentName] };
            }
            return link;
        });

        if (!linkUpdated) {
            updatedFlow.push(newLink);
        }

        updateSystemData(agents, updatedFlow);
        setConnecting(null);
    };
    
    const handleAgentUpdate = (updatedAgent: Agent) => {
        const updatedAgents = agents.map(a => a.name === selectedAgentId ? updatedAgent : a);
        setAgents(updatedAgents);
        updateSystemData(updatedAgents);
    };
    
    const handleDeleteAgent = (agentNameToDelete: string) => {
        const updatedAgents = agents.filter(a => a.name !== agentNameToDelete);
        const flow = Array.isArray(systemData.system.flow) ? systemData.system.flow : [];
        const updatedFlow = flow
            .map(link => ({
                ...link,
                to: link.to.filter(t => t !== agentNameToDelete),
            }))
            .filter(link => link.from !== agentNameToDelete && link.to.length > 0);
        
        setSelectedAgentId(null);
        setAgents(updatedAgents);
        updateSystemData(updatedAgents, updatedFlow);
    };
    
    const toggleNodeExpansion = (e: React.MouseEvent, agentName: string) => {
        e.stopPropagation();
        setExpandedNodes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(agentName)) {
                newSet.delete(agentName);
            } else {
                newSet.add(agentName);
            }
            return newSet;
        });
    };

    const togglePaletteSection = (section: string) => {
        setOpenPaletteSections(prev => ({...prev, [section]: !prev[section]}));
    };

    const nodeColorClasses = (type: Agent['type']) => {
        const colorMap = {
            core: 'bg-blue-900/50 border-blue-700',
            tool: 'bg-yellow-900/50 border-yellow-700',
            logic: 'bg-orange-900/50 border-orange-700',
            data: 'bg-purple-900/50 border-purple-700',
            agent: 'bg-gray-700 border-gray-600',
        };
        return colorMap[type] || colorMap.agent;
    };
    
    const iconColorClasses = (type: Agent['type']) => {
        const colorMap = {
            core: 'text-blue-400',
            tool: 'text-yellow-400',
            logic: 'text-orange-400',
            data: 'text-purple-400',
            agent: 'text-cyan-400',
        };
        return colorMap[type] || colorMap.agent;
    };
    
    const getPortY = (index: number, total: number) => 35 + (index * 20);

    return (
        <div className="h-full flex bg-gray-900/50">
            {/* Palette */}
            <aside className="w-64 bg-gray-800 p-2 border-r border-gray-700 flex-shrink-0 flex flex-col">
                 <h3 className="text-lg font-semibold text-white mb-4 px-2">Komponenty</h3>
                <div className="flex-grow space-y-2 overflow-y-auto">
                    {Object.entries(PALETTE_CONFIG).map(([key, section]) => (
                        <div key={key}>
                            <button onClick={() => togglePaletteSection(key)} className="w-full flex justify-between items-center text-left p-2 rounded-md hover:bg-gray-700/50">
                                <span className="font-semibold text-gray-300">{section.title}</span>
                                <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${openPaletteSections[key] ? '' : '-rotate-90'}`} />
                            </button>
                            {openPaletteSections[key] && (
                                <div className="pl-2 pt-2 space-y-2">
                                    {section.items.map((item) => {
                                        const ItemIcon = item.icon;
                                        return (
                                            <div
                                                key={item.role}
                                                draggable
                                                onDragStart={(e) => handleDragStartPalette(e, item)}
                                                className={`p-2 rounded-lg cursor-grab active:cursor-grabbing transition-colors ${nodeColorClasses(item.defaultData.type as Agent['type']).replace('border-', 'hover:border-')}`}
                                            >
                                                <div className="flex items-center">
                                                    <div className={`w-8 h-8 flex-shrink-0 mr-3 rounded-md flex items-center justify-center ${nodeColorClasses(item.defaultData.type as Agent['type'])}`}>
                                                         <ItemIcon className={`w-5 h-5 ${iconColorClasses(item.defaultData.type as Agent['type'])}`} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-200">{item.title}</p>
                                                    </div>
                                                </div>
                                                 <p className="text-xs text-gray-400 mt-1.5 ml-1">{item.description}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <div className="flex-shrink-0 p-2">
                    <input type="file" ref={importInputRef} onChange={onImport} accept=".yaml,.yml" style={{ display: 'none' }} />
                     <button
                        onClick={() => importInputRef.current?.click()}
                        className="w-full bg-cyan-800/80 hover:bg-cyan-700/80 text-cyan-200 font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center text-sm"
                    >
                        <DocumentDownloadIcon className="w-5 h-5 mr-2"/>
                        Importuj Szablon
                    </button>
                </div>
            </aside>

            {/* Canvas */}
            <main
                ref={canvasRef}
                className="flex-grow relative overflow-auto bg-gray-900"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
            >
                 <div className="absolute top-4 right-4 z-20">
                    <button
                        onClick={() => setIsWorkflowFullscreen(!isWorkflowFullscreen)}
                        className="p-2 bg-gray-700/50 hover:bg-gray-600/80 rounded-md text-gray-300 transition-colors"
                        title={isWorkflowFullscreen ? "Wyjdź z trybu pełnoekranowego" : "Tryb pełnoekranowy"}
                    >
                        {isWorkflowFullscreen ? <ArrowsPointingInIcon className="w-5 h-5" /> : <ArrowsPointingOutIcon className="w-5 h-5" />}
                    </button>
                </div>
                <div className="relative" style={{ width: 3000, height: 2000 }}>
                    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
                        {Array.isArray(systemData.system.flow) && systemData.system.flow.map(link => {
                            const fromAgent = agents.find(a => a.name === link.from);
                            return link.to.map(toName => {
                                const toAgent = agents.find(a => a.name === toName);
                                if (!fromAgent || !toAgent) return null;
                                
                                let startYOffset = 35; // default center
                                if (fromAgent.role === 'if_else') startYOffset = link.port === 'true' ? 30 : 50;
                                if (fromAgent.role === 'while') startYOffset = link.port === 'loop' ? 30 : 50;

                                const startX = (fromAgent.x ?? 0) + 288;
                                const startY = (fromAgent.y ?? 0) + startYOffset;
                                const endX = (toAgent.x ?? 0);
                                const endY = (toAgent.y ?? 0) + 35;
                                return (
                                    <path
                                        key={`${link.from}-${toName}-${link.port}`}
                                        d={`M${startX},${startY} C${startX + 50},${startY} ${endX - 50},${endY} ${endX},${endY}`}
                                        stroke="#4b5563"
                                        strokeWidth="2"
                                        fill="none"
                                    />
                                );
                            });
                        })}
                        {connecting && (() => {
                            const fromAgent = agents.find(a => a.name === connecting.from);
                            if (!fromAgent || fromAgent.x === undefined || fromAgent.y === undefined) return null;

                            let startYOffset = 35; // default
                            if (fromAgent.role === 'if_else') {
                                startYOffset = connecting.fromPort === 'true' ? 30 : 50;
                            } else if (fromAgent.role === 'while') {
                                startYOffset = connecting.fromPort === 'loop' ? 30 : 50;
                            }

                            const startX = fromAgent.x + 288;
                            const startY = fromAgent.y + startYOffset;

                            return (
                                <path
                                    d={`M${startX},${startY} C${startX + 50},${startY} ${connecting.endX - 50},${connecting.endY} ${connecting.endX},${connecting.endY}`}
                                    stroke="#22d3ee"
                                    strokeWidth="2"
                                    fill="none"
                                />
                            );
                        })()}
                    </svg>

                    {agents.map(agent => {
                        const isExpanded = expandedNodes.has(agent.name);
                        const baseType = agent.type === 'agent' ? 'core' : (agent.type || 'core');
                        const ItemIcon = Object.values(PALETTE_CONFIG).flatMap(s => s.items).find(i => i.role === agent.role)?.icon || CpuChipIcon;

                        return (
                            <div
                                key={agent.name}
                                className={`absolute w-72 p-3 rounded-lg shadow-lg cursor-move select-none z-10 border-2 transition-all duration-300 ${nodeColorClasses(baseType)} ${selectedAgentId === agent.name ? 'border-cyan-400' : ''}`}
                                style={{ left: agent.x, top: agent.y, minHeight: '70px' }}
                                onMouseDown={(e) => handleMouseDownAgent(e, agent)}
                                onClick={() => setSelectedAgentId(agent.name)}
                            >
                                <div className="flex items-center">
                                    <ItemIcon className={`w-5 h-5 mr-3 flex-shrink-0 ${iconColorClasses(baseType)}`} />
                                    <p className="font-bold text-white truncate flex-grow">{agent.name}</p>
                                     <button onClick={(e) => toggleNodeExpansion(e, agent.name)} className="ml-2 p-1 text-gray-400 hover:text-white">
                                        <ChevronDownIcon className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                     </button>
                                </div>
                                
                                {isExpanded && (
                                     <div className="mt-2 pt-2 border-t border-white/10">
                                        <p className="text-sm text-gray-300">{agent.description}</p>
                                    </div>
                                )}

                                <div className="port port-in absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gray-500 hover:bg-cyan-500 cursor-pointer z-20" onMouseUp={(e) => handleFinishConnection(e, agent.name)} />
                                
                                {agent.role === 'if_else' && (
                                    <>
                                        <div className="port port-out absolute -right-2 top-[30px] -translate-y-1/2 w-4 h-4 rounded-full bg-green-800 border-2 border-green-500 hover:bg-green-400 cursor-crosshair z-20 flex items-center justify-center text-xs text-green-200" onMouseDown={(e) => handleStartConnection(e, agent, 'true', 30)}>T</div>
                                        <div className="port port-out absolute -right-2 top-[50px] -translate-y-1/2 w-4 h-4 rounded-full bg-red-800 border-2 border-red-500 hover:bg-red-400 cursor-crosshair z-20 flex items-center justify-center text-xs text-red-200" onMouseDown={(e) => handleStartConnection(e, agent, 'false', 50)}>F</div>
                                    </>
                                )}
                                {agent.role === 'while' && (
                                    <>
                                        <div className="port port-out absolute -right-2 top-[30px] -translate-y-1/2 w-4 h-4 rounded-full bg-blue-800 border-2 border-blue-500 hover:bg-blue-400 cursor-crosshair z-20" onMouseDown={(e) => handleStartConnection(e, agent, 'loop', 30)} title="Loop Body" />
                                        <div className="port port-out absolute -right-2 top-[50px] -translate-y-1/2 w-4 h-4 rounded-full bg-gray-800 border-2 border-gray-500 hover:bg-gray-400 cursor-crosshair z-20" onMouseDown={(e) => handleStartConnection(e, agent, 'exit', 50)} title="Exit Loop" />
                                    </>
                                )}
                                {!['if_else', 'while', 'end'].includes(agent.role) && (
                                     <div className="port port-out absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gray-800 border-2 border-gray-500 hover:border-cyan-500 cursor-crosshair z-20" onMouseDown={(e) => handleStartConnection(e, agent, 'default', 35)} />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* AI Prompt Bar */}
                <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                    <div className="bg-gray-800/80 backdrop-blur-md border border-gray-700 rounded-lg shadow-2xl p-2 max-w-2xl mx-auto">
                        <div className="flex items-center">
                             <SparklesIcon className="w-5 h-5 mx-3 text-cyan-400 flex-shrink-0" />
                            <input
                                type="text"
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAiEdit()}
                                disabled={isAiEditing}
                                placeholder="Opisz zmiany, np. 'Dodaj agenta do raportowania i połącz go z...' "
                                className="flex-grow bg-transparent text-gray-200 placeholder-gray-500 focus:outline-none"
                            />
                            <button
                                onClick={handleAiEdit}
                                disabled={isAiEditing || !aiPrompt.trim()}
                                className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md transition-colors flex items-center"
                            >
                                {isAiEditing ? (
                                     <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <span>Wykonaj</span>
                                )}
                            </button>
                        </div>
                        {aiError && <p className="text-xs text-red-400 mt-2 pl-10">{aiError}</p>}
                    </div>
                </div>
            </main>

            {/* Config Panel */}
            {selectedAgentId && (
                 <ConfigPanel
                    agent={agents.find(a => a.name === selectedAgentId)!}
                    onUpdate={handleAgentUpdate}
                    onDelete={handleDeleteAgent}
                    onClose={() => setSelectedAgentId(null)}
                />
            )}
        </div>
    );
};

export default WorkflowEditor;