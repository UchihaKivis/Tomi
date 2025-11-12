import React from 'react';
import { CubeTransparentIcon } from './Icons';

const Header: React.FC = () => {
  return (
    <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex items-center">
        <CubeTransparentIcon className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-400 mr-3" />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wider">
            AI Agent System Designer
          </h1>
          <p className="text-xs sm:text-sm text-gray-400">
            Tworzenie systemów agentowych AI w oparciu o Vertex AI bez pisania kodu.
          </p>
        </div>
      </div>
    </header>
  );
};

export default Header;