

import React, { useEffect, useRef } from 'react';
// FIX: Corrected import path to be relative.
import { CpuChipIcon, XMarkIcon, ArrowLongRightIcon } from './Icons';
// FIX: Corrected import path to be relative.
import type { Agent } from '../types';

interface ResearchPlanVisualizerProps {
  agent: Agent;
  onClose: () => void;
}

const ResearchPlanVisualizer: React.FC<ResearchPlanVisualizerProps> = ({ agent, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && event.target === modalRef.current) {
        onClose();
    }
  };

  return (
    <div
      ref={modalRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="plan-visualizer-title"
    >
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center">
            <CpuChipIcon className="w-6 h-6 mr-3 text-cyan-400" />
            <div>
                <h2 id="plan-visualizer-title" className="text-lg font-bold text-white">
                Plan Badawczy
                </h2>
                <p className="text-sm text-gray-400">Agent: {agent.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
            aria-label="Zamknij wizualizator planu"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>

        <main className="p-6 overflow-y-auto">
            <p className="text-sm text-gray-400 mb-6">Poniższy diagram przedstawia sekwencję zadań wykonywanych przez agenta w celu realizacji jego celów.</p>
            <ul className="space-y-4" role="list" aria-label={`Sekwencja zadań dla agenta ${agent.name}`}>
                {agent.tasks.map((task, index) => (
                    <li key={index} role="listitem" className="flex flex-col items-center">
                        <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 flex items-center w-full shadow-md">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-600 text-white font-bold text-sm mr-4 flex-shrink-0">
                                {index + 1}
                            </span>
                            <p className="text-gray-300">{task.replace(/{user_topic}/g, '...')}</p>
                        </div>
                        {index < agent.tasks.length - 1 && (
                            <ArrowLongRightIcon className="w-8 h-8 text-gray-600 my-2 rotate-90" aria-hidden="true" />
                        )}
                    </li>
                ))}
            </ul>
        </main>
      </div>
    </div>
  );
};

export default ResearchPlanVisualizer;