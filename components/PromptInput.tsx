
import React from 'react';

interface Template {
  id: string;
  title: string;
  prompt: string;
}

interface PromptInputProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  templates: Template[];
  selectedTemplateId: string;
  onTemplateSelect: (templateId: string) => void;
}

const PromptInput: React.FC<PromptInputProps> = ({ prompt, setPrompt, onGenerate, isLoading, templates, selectedTemplateId, onTemplateSelect }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <label htmlFor="template-select" className="block text-sm font-semibold text-gray-400 mb-2">Wybierz szablon systemu:</label>
        <div className="relative">
            <select
              id="template-select"
              value={selectedTemplateId}
              onChange={(e) => onTemplateSelect(e.target.value)}
              disabled={isLoading}
              className="w-full bg-gray-700 border border-gray-600 text-white py-2.5 px-3 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none appearance-none"
            >
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.title}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
        </div>
      </div>
      <div className="flex flex-col flex-grow bg-gray-800 rounded-lg border border-gray-700 shadow-lg">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Opisz cel systemu agentowego, który chcesz zbudować..."
          className="w-full flex-grow p-4 bg-transparent text-gray-300 placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:outline-none rounded-t-lg resize-none"
          rows={10}
          disabled={isLoading}
        />
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={onGenerate}
            disabled={isLoading || !prompt.trim()}
            className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out flex items-center justify-center shadow-md hover:shadow-lg disabled:shadow-none"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generowanie...
              </>
            ) : (
              'Generuj Konfigurację'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptInput;
