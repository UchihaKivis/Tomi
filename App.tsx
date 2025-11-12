import React, { useState, useCallback, useEffect, useRef } from 'react';
import Header from './components/Header';
import PromptInput from './components/PromptInput';
import YamlOutput from './components/YamlOutput';
import SystemVisualizer from './components/SystemVisualizer';
import SystemSimulator from './components/SystemSimulator';
import VersionHistory from './components/VersionHistory';
import WorkflowEditor from './components/WorkflowEditor';
import { generateAgentSystemConfig, TEMPLATES } from './services/geminiService';
import { runSimulation } from './services/simulationService';
import type { SystemData, AgentStatus, SimulationLog, Version, DataFlowMetric, SimulationUpdate } from './types';
import jsYaml from 'js-yaml';

type Tab = 'editor' | 'workflow' | 'visualizer' | 'simulator' | 'history';

function App() {
  const [prompt, setPrompt] = useState<string>(TEMPLATES[0].prompt);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(TEMPLATES[0].id);
  const [yamlOutput, setYamlOutput] = useState<string>('');
  const [parsedYaml, setParsedYaml] = useState<SystemData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('editor');

  // Simulation state
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatus>>({});
  const [simulationLogs, setSimulationLogs] = useState<SimulationLog[]>([]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [dataFlowMetrics, setDataFlowMetrics] = useState<Record<string, DataFlowMetric>>({});
  const [isWaitingForStep, setIsWaitingForStep] = useState<boolean>(false);
  const simulationGeneratorRef = useRef<AsyncGenerator<SimulationUpdate> | null>(null);


  // Version history state
  const [versionHistory, setVersionHistory] = useState<Version[]>([]);
  const versionCounter = useRef(0);

  // Workflow fullscreen state
  const [isWorkflowFullscreen, setIsWorkflowFullscreen] = useState<boolean>(false);


  useEffect(() => {
    // Initialize with a default template
    handleTemplateSelect(TEMPLATES[0].id);
  }, []);

  const handleStopSimulation = useCallback(() => {
    setIsSimulating(false);
    setIsWaitingForStep(false);
    setAgentStatuses({});
    setSimulationLogs([]);
    setDataFlowMetrics({});
    if (simulationGeneratorRef.current?.return) {
        // FIX: Explicitly pass undefined to the generator's return method to satisfy stricter TypeScript checks.
        simulationGeneratorRef.current.return(undefined);
    }
    simulationGeneratorRef.current = null;
  }, []);
  
  const handleUpdateSystem = useCallback((newSystemData: SystemData) => {
    try {
      const newYaml = jsYaml.dump(newSystemData);
      setParsedYaml(newSystemData);
      setYamlOutput(newYaml);
      setError(null);
    } catch (e: any) {
       setError(`Błąd konwersji do YAML: ${e.message}`);
    }
  }, []);
  
  const handleImportTemplate = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setYamlOutput(content);
        setActiveTab('workflow');
      };
      reader.readAsText(file);
    }
  }, []);

  useEffect(() => {
    if (yamlOutput) {
      try {
        const parsed = jsYaml.load(yamlOutput) as SystemData;
        if (typeof parsed === 'object' && parsed !== null && parsed.system) {
           setParsedYaml(parsed);
           setError(null);
           if (!isSimulating) {
            // Reset simulation state when new YAML is generated
            handleStopSimulation();
           }
        } else {
           throw new Error('Invalid YAML structure. Missing "system" root key.');
        }
      } catch (e: any) {
        setError(`Błąd parsowania YAML: ${e.message}`);
        setParsedYaml(null);
      }
    } else {
      setParsedYaml(null);
    }
  }, [yamlOutput, isSimulating, handleStopSimulation]);

  const handleTemplateSelect = (templateId: string) => {
    const template = TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplateId(template.id);
      setPrompt(template.prompt);
    }
  };

  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setYamlOutput('');
    setActiveTab('editor');

    try {
      const result = await generateAgentSystemConfig(prompt, selectedTemplateId);
      setYamlOutput(result);

      // Add to version history
      versionCounter.current += 1;
      const newVersion: Version = {
        id: `v${versionCounter.current}`,
        yaml: result,
        timestamp: new Date().toISOString(),
        prompt,
        templateId: selectedTemplateId,
      };
      setVersionHistory(prev => [newVersion, ...prev]);

    } catch (e: any) {
      setError(e.message || "Wystąpił nieoczekiwany błąd.");
    } finally {
      setIsLoading(false);
    }
  }, [prompt, selectedTemplateId]);
  
  const processSimulationUpdate = useCallback((update: SimulationUpdate) => {
    if (update.log) {
        setSimulationLogs(prev => [...prev, update.log!]);
    }
    if (update.statusUpdate) {
        const { agentName, ...status } = update.statusUpdate;
        setAgentStatuses(prev => ({ ...prev, [agentName]: status }));
    }
    if (update.dataFlowUpdate) {
        const { from, to, packetCount, totalSizeKB } = update.dataFlowUpdate;
        const key = `${from}->${to}`;
        setDataFlowMetrics(prev => {
            const existing = prev[key] || { from, to, packetCount: 0, totalSizeKB: 0 };
            return {
                ...prev,
                [key]: {
                    ...existing,
                    packetCount: existing.packetCount + packetCount,
                    totalSizeKB: existing.totalSizeKB + totalSizeKB,
                }
            };
        });
    }
    if (update.waitForStep) {
        setIsWaitingForStep(true);
    }
  }, []);

  const handleNextStep = useCallback(async () => {
    if (!simulationGeneratorRef.current) return;
    
    setIsWaitingForStep(false);

    const { value, done } = await simulationGeneratorRef.current.next();

    if (value) {
        processSimulationUpdate(value);
    }

    if (done) {
        setIsSimulating(false);
        simulationGeneratorRef.current = null;
    }
  }, [processSimulationUpdate]);


  const handleRunSimulation = useCallback(async (mode: 'run' | 'step') => {
    if (!parsedYaml) return;

    handleStopSimulation(); // Reset previous state
    setIsSimulating(true);

    simulationGeneratorRef.current = runSimulation(parsedYaml, mode === 'step');
    
    if (mode === 'run') {
        try {
            for await (const update of simulationGeneratorRef.current) {
                processSimulationUpdate(update);
            }
        } catch (e: any) {
            setSimulationLogs(prev => [...prev, {type: 'error', message: `Błąd symulatora: ${e.message}`, agentName: 'System'}]);
        } finally {
            setIsSimulating(false);
            simulationGeneratorRef.current = null;
        }
    } else { // mode === 'step'
        handleNextStep();
    }
  }, [parsedYaml, handleNextStep, handleStopSimulation, processSimulationUpdate]);

  const handleViewVersion = useCallback((yaml: string) => {
    setYamlOutput(yaml);
    setActiveTab('editor');
  }, []);

  const handleRestoreVersion = useCallback((version: Version) => {
    setPrompt(version.prompt);
    setSelectedTemplateId(version.templateId);
    setYamlOutput(version.yaml);
    setActiveTab('editor');
  }, []);

  const TabButton: React.FC<{tabId: Tab; currentTab: Tab; children: React.ReactNode; disabled?: boolean;}> = ({ tabId, currentTab, children, disabled }) => (
    <button
      onClick={() => !disabled && setActiveTab(tabId)}
      disabled={disabled}
      className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
        currentTab === tabId
          ? 'bg-gray-800 text-cyan-400 border-b-2 border-cyan-400'
          : 'text-gray-400 hover:text-white hover:bg-gray-700/50 disabled:text-gray-600 disabled:hover:bg-transparent'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="bg-gray-900 text-gray-200 min-h-screen font-sans flex flex-col">
      <div className={isWorkflowFullscreen && activeTab === 'workflow' ? 'hidden' : ''}>
        <Header />
      </div>
      <main className={`flex-grow grid ${isWorkflowFullscreen && activeTab === 'workflow' ? 'grid-cols-1 p-0' : 'grid-cols-1 lg:grid-cols-2 gap-4 p-4'}`}>
        <div className={isWorkflowFullscreen && activeTab === 'workflow' ? 'hidden' : 'h-[calc(100vh-100px)]'}>
            <PromptInput
                prompt={prompt}
                setPrompt={setPrompt}
                onGenerate={handleGenerate}
                isLoading={isLoading}
                templates={TEMPLATES}
                selectedTemplateId={selectedTemplateId}
                onTemplateSelect={handleTemplateSelect}
            />
        </div>
        <div className={`flex flex-col bg-gray-800/50 border border-gray-700 ${isWorkflowFullscreen && activeTab === 'workflow' ? 'h-screen rounded-none border-none' : 'h-[calc(100vh-100px)] rounded-lg'}`}>
           <div className={`flex-shrink-0 border-b border-gray-700 px-2 ${isWorkflowFullscreen && activeTab === 'workflow' ? 'hidden' : ''}`}>
            <nav className="flex space-x-2">
                <TabButton tabId="editor" currentTab={activeTab}>Edytor YAML</TabButton>
                <TabButton tabId="workflow" currentTab={activeTab} disabled={!parsedYaml}>Kreator Wizualny</TabButton>
                <TabButton tabId="visualizer" currentTab={activeTab} disabled={!parsedYaml}>Wizualizacja</TabButton>
                <TabButton tabId="simulator" currentTab={activeTab} disabled={!parsedYaml}>Symulator</TabButton>
                <TabButton tabId="history" currentTab={activeTab} disabled={versionHistory.length === 0}>Historia</TabButton>
            </nav>
          </div>
          <div className="flex-grow overflow-hidden">
             {activeTab === 'editor' && <YamlOutput yamlOutput={yamlOutput} isLoading={isLoading} error={error} />}
             {activeTab === 'workflow' && parsedYaml && (
                <WorkflowEditor
                    systemData={parsedYaml}
                    onUpdate={handleUpdateSystem}
                    onImport={handleImportTemplate}
                    isWorkflowFullscreen={isWorkflowFullscreen}
                    setIsWorkflowFullscreen={setIsWorkflowFullscreen}
                />
             )}
             {activeTab === 'visualizer' && parsedYaml && <SystemVisualizer parsedYaml={parsedYaml} agentStatuses={agentStatuses} dataFlowMetrics={dataFlowMetrics} />}
             {activeTab === 'simulator' && parsedYaml && (
                <SystemSimulator 
                    parsedData={parsedYaml} 
                    agentStatuses={agentStatuses} 
                    simulationLogs={simulationLogs} 
                    isSimulating={isSimulating}
                    isWaitingForStep={isWaitingForStep}
                    onRun={handleRunSimulation}
                    onNextStep={handleNextStep}
                    onStop={handleStopSimulation}
                />
             )}
             {activeTab === 'history' && (
                <VersionHistory 
                    history={versionHistory}
                    onView={handleViewVersion}
                    onRestore={handleRestoreVersion}
                />
             )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;