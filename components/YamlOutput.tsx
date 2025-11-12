import React, { useState, useEffect } from 'react';
import { DocumentDuplicateIcon, CheckIcon, ExclamationTriangleIcon } from './Icons';

interface YamlOutputProps {
  yamlOutput: string;
  isLoading: boolean;
  error: string | null;
}

const YamlOutput: React.FC<YamlOutputProps> = ({ yamlOutput, isLoading, error }) => {
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => setIsCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  const handleCopy = () => {
    if (yamlOutput) {
      navigator.clipboard.writeText(yamlOutput);
      setIsCopied(true);
    }
  };

  const hasContent = !isLoading && !error && yamlOutput;

  return (
    <div className="h-full flex flex-col relative bg-gray-800">
      {hasContent && (
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 bg-gray-700 hover:bg-gray-600 text-gray-300 p-2 rounded-lg transition-colors"
          title="Kopiuj do schowka"
        >
          {isCopied ? (
            <CheckIcon className="w-5 h-5 text-green-400" />
          ) : (
            <DocumentDuplicateIcon className="w-5 h-5" />
          )}
        </button>
      )}

      <div className="w-full flex-grow overflow-auto p-4 font-mono text-sm text-gray-300">
        {isLoading && (
          <div className="flex items-center justify-center h-full text-gray-400">
            <svg className="animate-spin mr-3 h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Generowanie konfiguracji...</span>
          </div>
        )}
        {error && (
          <div className="flex flex-col items-center justify-center h-full text-red-400 text-center">
            <ExclamationTriangleIcon className="w-12 h-12 mb-4"/>
            <p className="font-semibold text-lg">Wystąpił błąd</p>
            <p className="text-sm text-red-300 max-w-md">{error}</p>
          </div>
        )}
        {!isLoading && !error && !yamlOutput && (
            <div className="flex items-center justify-center h-full text-gray-500">
                <p>Wygenerowana konfiguracja YAML pojawi się tutaj.</p>
            </div>
        )}
        {yamlOutput && (
          <pre>
            <code>{yamlOutput}</code>
          </pre>
        )}
      </div>
    </div>
  );
};

export default YamlOutput;
