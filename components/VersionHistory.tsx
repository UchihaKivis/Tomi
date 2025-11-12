import React from 'react';
import { ClockIcon, EyeIcon, ArrowPathIcon } from './Icons';
import type { Version } from '../types';

interface VersionHistoryProps {
    history: Version[];
    onView: (yaml: string) => void;
    onRestore: (version: Version) => void;
}

const VersionHistory: React.FC<VersionHistoryProps> = ({ history, onView, onRestore }) => {

    const formatTimestamp = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleString('pl-PL');
    }

    if (history.length === 0) {
        return (
            <div className="p-4 text-center text-gray-400 h-full flex items-center justify-center">
                <p>Brak zapisanych wersji.</p>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 bg-gray-900/50 h-full overflow-y-auto">
            <div className="space-y-4">
                 {history.map(version => (
                    <div key={version.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-white">Wersja {version.id}</p>
                            <div className="flex items-center text-xs text-gray-400 mt-1">
                                <ClockIcon className="w-4 h-4 mr-1.5" />
                                <span>{formatTimestamp(version.timestamp)}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => onView(version.yaml)}
                                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
                                title="Podgląd"
                            >
                                <EyeIcon className="w-5 h-5 text-gray-300" />
                            </button>
                             <button 
                                onClick={() => onRestore(version)}
                                className="p-2 bg-cyan-800/80 hover:bg-cyan-700/80 rounded-md transition-colors"
                                title="Przywróć"
                            >
                                <ArrowPathIcon className="w-5 h-5 text-cyan-300" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VersionHistory;
