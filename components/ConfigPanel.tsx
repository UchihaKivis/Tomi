import React, { useState, useEffect } from 'react';
import type { Agent, Tool } from '../types';
import { XMarkIcon, TrashIcon } from './Icons';

interface ConfigPanelProps {
    agent: Agent;
    onUpdate: (agent: Agent) => void;
    onDelete: (agentName: string) => void;
    onClose: () => void;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ agent, onUpdate, onDelete, onClose }) => {
    const [localAgent, setLocalAgent] = useState(agent);

    useEffect(() => {
        setLocalAgent(agent);
    }, [agent]);

    const handleFieldChange = (field: keyof Agent, value: any) => {
        const updatedAgent = { ...localAgent, [field]: value };
        setLocalAgent(updatedAgent);
        onUpdate(updatedAgent);
    };

    const handleListChange = (listName: 'tasks' | 'tools', index: number, value: string) => {
        const list = [...(localAgent[listName] as any[])];
        
        if (listName === 'tasks') {
             list[index] = value;
        }
        else if (listName === 'tools') {
            const currentItem = list[index];
            if (typeof currentItem === 'string') {
                list[index] = value;
            } else if (typeof currentItem === 'object' && currentItem.name !== undefined) {
                list[index] = { ...currentItem, name: value };
            }
        }
        
        handleFieldChange(listName, list);
    };

    const addListItem = (listName: 'tasks' | 'tools') => {
        const list = [...(localAgent[listName] as any[])];
        const newItem = listName === 'tasks' ? 'new_task' : { name: 'new_tool', params: {} };
        handleFieldChange(listName, [...list, newItem]);
    };

    const removeListItem = (listName: 'tasks' | 'tools', index: number) => {
        const list = [...(localAgent[listName] as any[])];
        list.splice(index, 1);
        handleFieldChange(listName, list);
    };
    
    const showModel = agent.type === 'core' && agent.role === 'agent';
    const showContext = agent.role === 'agent' || agent.role === 'note' || agent.role === 'start';
    const showTasks = !['if_else', 'while', 'user_approval', 'end', 'note', 'guardrails', 'mcp'].includes(agent.role);
    const showTools = !['if_else', 'while', 'user_approval', 'end', 'note', 'set_state', 'transform', 'start'].includes(agent.role);
    const showCondition = agent.role === 'if_else' || agent.role === 'while';

    return (
        <aside className="w-80 bg-gray-800 p-4 border-l border-gray-700 flex-shrink-0 flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Konfiguracja Węzła</h3>
                <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
                    <XMarkIcon className="w-5 h-5" />
                </button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-2 flex-grow">
                <div>
                    <label className="block text-sm font-medium text-gray-400">Nazwa (ID)</label>
                    <input type="text" value={localAgent.name} onChange={e => handleFieldChange('name', e.target.value)} className="mt-1 w-full bg-gray-700 border border-gray-600 text-white py-2 px-3 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400">Rola</label>
                    <input type="text" value={localAgent.role} readOnly className="mt-1 w-full bg-gray-900 border border-gray-700 text-gray-400 py-2 px-3 rounded-md cursor-not-allowed" />
                </div>
                 {showModel && (
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Model</label>
                        <input type="text" value={localAgent.model} onChange={e => handleFieldChange('model', e.target.value)} className="mt-1 w-full bg-gray-700 border border-gray-600 text-white py-2 px-3 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none" />
                    </div>
                )}
                 {showCondition && (
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Warunek</label>
                        <input type="text" value={localAgent.condition} onChange={e => handleFieldChange('condition', e.target.value)} placeholder="np. zmienna == 'wartość'" className="mt-1 w-full bg-gray-700 border border-gray-600 text-white py-2 px-3 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none" />
                    </div>
                )}
                {showContext && (
                    <div>
                        <label className="block text-sm font-medium text-gray-400">{agent.role === 'note' ? 'Treść Notatki' : 'Kontekst'}</label>
                        <textarea value={localAgent.context} onChange={e => handleFieldChange('context', e.target.value)} rows={4} className="mt-1 w-full bg-gray-700 border border-gray-600 text-white py-2 px-3 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-none" />
                    </div>
                )}

                {showTasks && (
                    <div>
                        <h4 className="text-md font-semibold text-gray-300 mb-2">Zadania</h4>
                        <div className="space-y-2">
                            {localAgent.tasks.map((task, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <input type="text" value={task} onChange={e => handleListChange('tasks', index, e.target.value)} className="flex-grow bg-gray-700/80 border border-gray-600 text-white py-1 px-2 rounded-md focus:ring-1 focus:ring-cyan-500 focus:outline-none" />
                                    <button onClick={() => removeListItem('tasks', index)} className="p-1 text-gray-400 hover:text-red-400"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => addListItem('tasks')} className="mt-2 text-xs text-cyan-400 hover:text-cyan-300">+ Dodaj zadanie</button>
                    </div>
                )}
                
                {showTools && (
                    <div>
                        <h4 className="text-md font-semibold text-gray-300 mb-2">Narzędzia</h4>
                        <div className="space-y-2">
                            {localAgent.tools.map((tool, index) => {
                                const toolName = typeof tool === 'string' ? tool : tool.name;
                                return (
                                    <div key={index} className="flex items-center gap-2">
                                        <input type="text" value={toolName} onChange={e => handleListChange('tools', index, e.target.value)} className="flex-grow bg-gray-700/80 border border-gray-600 text-white py-1 px-2 rounded-md focus:ring-1 focus:ring-cyan-500 focus:outline-none" />
                                        <button onClick={() => removeListItem('tools', index)} className="p-1 text-gray-400 hover:text-red-400"><TrashIcon className="w-4 h-4"/></button>
                                    </div>
                                );
                            })}
                        </div>
                        <button onClick={() => addListItem('tools')} className="mt-2 text-xs text-cyan-400 hover:text-cyan-300">+ Dodaj narzędzie</button>
                    </div>
                )}
            </div>

            <div className="mt-auto pt-4">
                 <button 
                    onClick={() => onDelete(agent.name)}
                    className="w-full bg-red-600/80 hover:bg-red-500/80 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center text-sm"
                >
                    <TrashIcon className="w-5 h-5 mr-2"/>
                    Usuń Węzeł
                </button>
            </div>
        </aside>
    );
};

export default ConfigPanel;