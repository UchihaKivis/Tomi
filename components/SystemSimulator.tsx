import React, { useRef, useEffect } from 'react';
import { CpuChipIcon, BeakerIcon, CheckCircleIcon, XCircleIcon, PlayIcon, ForwardIcon, StopIcon, InformationCircleIcon } from './Icons';
import type { SystemData, AgentStatus, SimulationLog } from '../types';

interface SystemSimulatorProps {
    parsedData: SystemData;
    agentStatuses: Record<string, AgentStatus>;
    simulationLogs: SimulationLog[];
    isSimulating: boolean;
    isWaitingForStep: boolean;
    onRun: (mode: 'run' | 'step') => void;
    onNextStep: () => void;
    onStop: () => void;
}

const StatusIndicator: React.FC<{ status: AgentStatus['status'] }> = ({ status }) => {
    switch (status) {
        case 'success':
            return <CheckCircleIcon className="w-5 h-5 text-green-400" />;
        case 'failed':
            return <XCircleIcon className="w-5 h-5 text-red-400" />;
        case 'running':
            return (
                <svg className="animate-spin h-5 w-5 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            );
        case 'skipped':
            return <InformationCircleIcon className="w-5 h-5 text-yellow-500" />;
        case 'pending':
        default:
             return <div className="w-5 h-5 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-gray-500"></div></div>;
    }
};

const SystemSimulator: React.FC<SystemSimulatorProps> = ({ 
    parsedData, 
    agentStatuses, 
    simulationLogs, 
    isSimulating,
    isWaitingForStep,
    onRun,
    onNextStep,
    onStop
}) => {
    const logContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [simulationLogs]);

    const agents = parsedData.system.agents || [];
    const hasStarted = simulationLogs.length > 0;

    const renderLogMessage = (log: SimulationLog) => {
        let message = log.message;
        if (log.durationMs) {
            message += ` (Czas: ${log.durationMs}ms)`;
        }
        return message;
    };

    const lastLog = simulationLogs[simulationLogs.length - 1];
    const userApprovalMessage = (isWaitingForStep && lastLog?.agentName && agentStatuses[lastLog.agentName]?.status === 'running' && lastLog.type === 'warning') ? lastLog.message : null;

    return (
        <div className="p-4 sm:p-6 bg-gray-900/50 h-full overflow-y-auto flex flex-col gap-6">
            <div className="flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-300">Symulator Systemu</h3>
                        <p className="text-sm text-gray-400">Sprawdź poprawność konfiguracji i logiki przepływu agentów.</p>
                    </div>
                     {isSimulating && (
                        <button 
                            onClick={onStop}
                            className="bg-red-600/80 hover:bg-red-500/80 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center text-sm"
                        >
                            <StopIcon className="w-5 h-5 mr-2"/>
                            Zatrzymaj
                        </button>
                     )}
                </div>
            </div>
            
            {!hasStarted && (
                 <div className="flex flex-col items-center justify-center text-center p-8 bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg flex-grow">
                    <BeakerIcon className="w-12 h-12 text-cyan-500 mb-4" />
                    <h4 className="text-lg font-semibold text-white">Gotowy do symulacji</h4>
                    <p className="text-gray-400 max-w-sm mb-6">Wybierz tryb symulacji, aby rozpocząć walidację systemu.</p>
                    <div className="flex gap-4">
                        <button
                            onClick={() => onRun('run')}
                            disabled={isSimulating}
                            className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 text-white font-bold py-2.5 px-6 rounded-lg transition-colors flex items-center"
                        >
                            <PlayIcon className="w-5 h-5 mr-2"/>
                            Uruchom Ciągłą
                        </button>
                        <button
                            onClick={() => onRun('step')}
                            disabled={isSimulating}
                            className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 text-white font-bold py-2.5 px-6 rounded-lg transition-colors flex items-center"
                        >
                            <ForwardIcon className="w-5 h-5 mr-2"/>
                            Rozpocznij Krokową
                        </button>
                    </div>
                </div>
            )}

            {hasStarted && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow min-h-0">
                    {/* Agent Statuses */}
                    <div className="flex flex-col gap-3 min-h-0">
                        <h4 className="font-semibold text-gray-300">Status Węzłów</h4>
                        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 space-y-3 overflow-y-auto">
                            {agents.map(agent => {
                                const statusInfo = agentStatuses[agent.name] || { status: 'pending' };
                                return (
                                    <div key={agent.name} className="bg-gray-700/50 p-3 rounded-md">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <CpuChipIcon className="w-5 h-5 mr-3 text-gray-400" />
                                                <div>
                                                    <p className="font-semibold text-white">{agent.name}</p>
                                                    <p className="text-xs text-gray-400">{agent.role}</p>
                                                </div>
                                            </div>
                                            <StatusIndicator status={statusInfo.status} />
                                        </div>
                                        {statusInfo.status === 'failed' && statusInfo.error && (
                                            <div className="mt-3 p-3 bg-red-900/40 border border-red-700/50 rounded-md">
                                                <p className="text-xs font-semibold text-red-300">Błąd: <span className="font-normal">{statusInfo.error}</span></p>
                                                {statusInfo.solution && <p className="mt-1 text-xs font-semibold text-cyan-300">Rozwiązanie: <span className="font-normal">{statusInfo.solution}</span></p>}
                                            </div>
                                        )}
                                        {statusInfo.status === 'skipped' && statusInfo.error && (
                                            <div className="mt-3 p-3 bg-yellow-900/40 border border-yellow-700/50 rounded-md">
                                                <p className="text-xs font-semibold text-yellow-300">{statusInfo.error}</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    {/* Simulation Logs */}
                    <div className="flex flex-col gap-3 min-h-0">
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-gray-300">Dziennik Zdarzeń</h4>
                            {isWaitingForStep && (
                                <button
                                    onClick={onNextStep}
                                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center text-sm animate-pulse"
                                >
                                    <ForwardIcon className="w-5 h-5 mr-2"/>
                                    {userApprovalMessage ? "Zatwierdź" : "Następny Krok"}
                                </button>
                            )}
                        </div>
                        <div ref={logContainerRef} className="bg-gray-800 p-3 rounded-lg border border-gray-700 font-mono text-xs text-gray-400 space-y-2 overflow-y-auto">
                             {userApprovalMessage && (
                                <div className="p-2 bg-cyan-900/50 border border-cyan-700 rounded-md text-cyan-300 text-center text-sm">
                                    {userApprovalMessage}
                                </div>
                            )}
                            {simulationLogs.map((log, index) => {
                                const colorClass = log.type === 'success' ? 'text-green-400' : log.type === 'error' ? 'text-red-400' : log.type === 'warning' ? 'text-yellow-400' : 'text-cyan-400';
                                return (
                                    <div key={index} className="flex">
                                        <span className="text-gray-500 mr-2 flex-shrink-0">[{new Date().toLocaleTimeString()}]</span>
                                        <span className={`mr-2 flex-shrink-0 ${colorClass}`}>[{log.agentName}]</span>
                                        <p className="whitespace-pre-wrap break-words">{renderLogMessage(log)}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SystemSimulator;
