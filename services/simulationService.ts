import type { SystemData, Agent, SimulationUpdate, FlowLink } from '../types';

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

const RETRIEVAL_TOOLS = ['vertex_ai_search', 'google_custom_search_api', 'bigquery_connector', 'google_drive_api', 'file_search'];
const ANALYSIS_TOOLS = ['bigquery_connector', 'vertex_ai_embeddings', 'langchain_vertex', 'vertex_ai_natural_language_api'];
const OUTPUT_TOOLS = ['google_docs_api', 'google_slides_api', 'cloud_storage_uploader', 'google_sheets_api'];

const TOOL_LATENCY_MS: Record<string, [number, number]> = {
    'bigquery_connector': [800, 2000],
    'vertex_ai_search': [600, 1500],
    'cloud_functions': [200, 500],
    'google_docs_api': [400, 900],
    'google_slides_api': [500, 1200],
    'vertex_ai_embeddings': [700, 1800],
    'default': [150, 400],
};

const calculateAgentLatency = (agent: Agent): number => {
    if (agent.type !== 'core' && agent.type !== 'agent') return 100; // Logic/data nodes are faster
    if (!agent.tools?.length) return TOOL_LATENCY_MS['default'][0];

    return agent.tools.reduce((totalLatency, tool) => {
        const toolName = typeof tool === 'string' ? tool : tool.name;
        const [min, max] = TOOL_LATENCY_MS[toolName] || TOOL_LATENCY_MS['default'];
        return totalLatency + (Math.random() * (max - min) + min);
    }, 0);
};


interface ValidationResult {
    isValid: boolean;
    error?: string;
    solution?: string;
}

function validateAgent(agent: Agent): ValidationResult {
    // Logic, data and some core nodes don't need tools/tasks
    const nonValidatedRoles = ['if_else', 'while', 'user_approval', 'end', 'note', 'set_state', 'guardrails', 'start'];
    if (nonValidatedRoles.includes(agent.role)) {
        return { isValid: true };
    }

    if (!agent.tools || agent.tools.length === 0) {
        return {
            isValid: false,
            error: `Agent "${agent.name}" nie ma zdefiniowanych żadnych narzędzi.`,
            solution: `Dodaj co najmniej jedno narzędzie do klucza 'tools' w definicji agenta, np. 'vertex_ai_search'.`
        };
    }

    if (!agent.tasks || agent.tasks.length === 0) {
        return {
            isValid: false,
            error: `Agent "${agent.name}" nie ma zdefiniowanych żadnych zadań.`,
            solution: `Zdefiniuj co najmniej jedno zadanie w kluczu 'tasks', aby określić, co agent ma robić.`
        };
    }

    const agentTools = agent.tools.map(t => typeof t === 'string' ? t : t.name);

    if (agent.role.includes('retriever') && !agentTools.some(t => RETRIEVAL_TOOLS.includes(t))) {
        return {
            isValid: false,
            error: `Agent "${agent.name}" z rolą '${agent.role}' nie posiada żadnych narzędzi do pozyskiwania danych.`,
            solution: `Dodaj narzędzie takie jak 'vertex_ai_search' lub 'bigquery_connector', aby agent mógł wykonywać swoje zadania.`
        };
    }
    
    if (agent.role.includes('analy') && !agentTools.some(t => ANALYSIS_TOOLS.includes(t))) {
        return {
            isValid: false,
            error: `Agent "${agent.name}" z rolą '${agent.role}' nie posiada żadnych narzędzi analitycznych.`,
            solution: `Dodaj narzędzie takie jak 'vertex_ai_embeddings' lub 'langchain_vertex' do analizy danych.`
        };
    }

    if (agent.role.includes('summarizer') && !agentTools.some(t => OUTPUT_TOOLS.includes(t))) {
        return {
            isValid: false,
            error: `Agent "${agent.name}" z rolą '${agent.role}' nie posiada żadnych narzędzi do generowania wyników.`,
            solution: `Dodaj narzędzie takie jak 'google_docs_api' lub 'google_slides_api', aby agent mógł tworzyć raporty.`
        };
    }

    return { isValid: true };
}


export async function* runSimulation(data: SystemData, stepByStep = false): AsyncGenerator<SimulationUpdate> {
    const { agents, flow: flowLinks } = data.system;
    if (!Array.isArray(flowLinks)) {
        yield { log: { type: 'error', message: 'Nieprawidłowy format przepływu. Oczekiwano tablicy.', agentName: 'System' } };
        return;
    }

    const agentMap = new Map(agents.map(a => [a.name, a]));
    const inDegree: Map<string, number> = new Map(agents.map(a => [a.name, 0]));

    flowLinks.forEach(link => {
        link.to.forEach(toAgent => {
            inDegree.set(toAgent, (inDegree.get(toAgent) || 0) + 1);
        });
    });

    const executionQueue: string[] = agents.filter(agent => inDegree.get(agent.name) === 0).map(a => a.name);
    const failedAgents = new Set<string>();
    const simulationState: Record<string, any> = {};
    const whileLoopCounters: Record<string, number> = {};

    yield { log: { type: 'info', message: 'Rozpoczynanie symulacji systemu...', agentName: 'System' } };
    await sleep(200);

    while (executionQueue.length > 0) {
        const agentName = executionQueue.shift()!;
        const agent = agentMap.get(agentName);

        if (!agent || failedAgents.has(agentName)) continue;
        
        yield { log: { type: 'info', message: `Uruchamianie węzła...`, agentName } };
        yield { statusUpdate: { agentName, status: 'running' } };
        
        const startTime = performance.now();
        const latency = calculateAgentLatency(agent);
        await sleep(latency);
        const duration = Math.round(performance.now() - startTime);

        let validation = validateAgent(agent);
        let nextNodes: string[] = [];

        // Node-specific logic
        switch (agent.role) {
            case 'note':
                yield { log: { type: 'info', message: 'Pominięto notatkę.', agentName } };
                nextNodes = flowLinks.filter(l => l.from === agentName).flatMap(l => l.to);
                break;
            case 'end':
                yield { log: { type: 'success', message: 'Ścieżka przepływu zakończona.', agentName } };
                break; // No next nodes
             case 'if_else':
                const conditionResult = Math.random() > 0.5; // Simulate condition evaluation
                const port = conditionResult ? 'true' : 'false';
                yield { log: { type: 'info', message: `Warunek '${agent.condition || 'default'}' zwrócił: ${port}.`, agentName } };
                nextNodes = flowLinks.filter(l => l.from === agentName && l.port === port).flatMap(l => l.to);
                break;
            case 'while':
                whileLoopCounters[agentName] = (whileLoopCounters[agentName] || 0) + 1;
                const loopCount = whileLoopCounters[agentName];
                const maxLoops = 3; // Simulate max 3 loops
                if (loopCount <= maxLoops) {
                    yield { log: { type: 'info', message: `Pętla (iteracja ${loopCount}/${maxLoops}).`, agentName } };
                    const loopBodyNodes = flowLinks.filter(l => l.from === agentName && l.port === 'loop').flatMap(l => l.to);
                    // Add the while node itself back to the queue to re-evaluate
                    executionQueue.push(...loopBodyNodes, agentName);
                } else {
                    yield { log: { type: 'info', message: 'Zakończono pętlę (osiągnięto limit iteracji).', agentName } };
                    nextNodes = flowLinks.filter(l => l.from === agentName && l.port === 'exit').flatMap(l => l.to);
                }
                break;
            case 'user_approval':
                 yield { log: { type: 'warning', message: 'Oczekiwanie na zatwierdzenie przez użytkownika...', agentName } };
                if (stepByStep) {
                    yield { waitForStep: { agentName, message: 'Oczekiwanie na zatwierdzenie...' } };
                }
                nextNodes = flowLinks.filter(l => l.from === agentName).flatMap(l => l.to);
                break;
            case 'set_state':
                simulationState['status'] = 'sukces'; // Simulate setting state
                yield { log: { type: 'info', message: `Ustawiono stan: status = 'sukces'.`, agentName } };
                nextNodes = flowLinks.filter(l => l.from === agentName).flatMap(l => l.to);
                break;
            case 'guardrails':
                if (simulationState['status'] === 'sukces') {
                    yield { log: { type: 'success', message: 'Walidacja Guardrails zakończona pomyślnie.', agentName } };
                } else {
                    validation = { isValid: false, error: 'Warunek Guardrails niespełniony.', solution: 'Upewnij się, że poprzedzający węzeł "set_state" ustawił wymagany stan.' };
                }
                nextNodes = flowLinks.filter(l => l.from === agentName).flatMap(l => l.to);
                break;
            default: // Standard agent
                if (validation.isValid) {
                    yield { log: { type: 'success', message: `Agent przeszedł walidację pomyślnie.`, agentName, durationMs: duration } };
                }
                nextNodes = flowLinks.filter(l => l.from === agentName).flatMap(l => l.to);
                break;
        }

        if (!validation.isValid) {
            failedAgents.add(agentName);
            yield { log: { type: 'error', message: `Błąd walidacji: ${validation.error}`, agentName } };
            yield { log: { type: 'info', message: `Sugerowane rozwiązanie: ${validation.solution}`, agentName } };
            yield { statusUpdate: { agentName, status: 'failed', error: validation.error, solution: validation.solution } };
        } else {
            yield { statusUpdate: { agentName, status: 'success' } };
            
            // Add next nodes to the queue and simulate data transfer
            for (const nextNodeName of nextNodes) {
                if (!failedAgents.has(nextNodeName)) {
                     const dataSize = Math.random() * 20 + 5;
                     yield {
                        dataFlowUpdate: { from: agentName, to: nextNodeName, packetCount: 1, totalSizeKB: dataSize }
                    };
                    executionQueue.push(nextNodeName);
                }
            }
        }
        
        if (stepByStep && agent.role !== 'user_approval' && executionQueue.length > 0) {
            yield { waitForStep: { agentName } };
        }
    }
    
    // Mark remaining agents as skipped if their predecessors failed
    // FIX: Replaced `forEach` with a `for...of` loop to allow `yield` within the loop body.
    for (const agent of agents) {
        if (!agentMap.get(agent.name)) continue;
        const links = flowLinks.filter(l => l.to.includes(agent.name));
        const predecessors = links.map(l => l.from);
        if (predecessors.some(p => failedAgents.has(p)) && !failedAgents.has(agent.name)) {
            failedAgents.add(agent.name); // Add to failed to stop propagation
            yield { statusUpdate: { agentName: agent.name, status: 'skipped', error: 'Pominięto, ponieważ poprzedni węzeł zakończył się błędem.' } };
        }
    }

    const total = agents.length;
    const failedCount = failedAgents.size;
    const successCount = agents.filter(a => !failedAgents.has(a.name)).length;
    
    if (failedCount > 0) {
        yield { log: { type: 'error', message: `Symulacja zakończona. Sukces: ${successCount}/${total}. Błędy/Pominięte: ${failedCount}/${total}.`, agentName: 'System' } };
    } else {
        yield { log: { type: 'success', message: `Symulacja zakończona pomyślnie. Wszystkie węzły (${total}/${total}) zostały przetworzone.`, agentName: 'System' } };
    }
}