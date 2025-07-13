import React, { useState } from 'react';
import { PipelineData } from '../types';
import { Code, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

interface JsonPreviewProps {
  data: PipelineData;
}

export const JsonPreview: React.FC<JsonPreviewProps> = ({ data }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const jsonString = JSON.stringify(data, null, 2);
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Code className="w-4 h-4 text-gray-600" />
          </div>
          <div>
            <span className="font-semibold text-gray-800">JSON Structure</span>
            <p className="text-xs text-gray-500">Pipeline data representation</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isExpanded && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopy();
              }}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              title="Copy JSON"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </div>
      </div>
      
      {isExpanded && (
        <div className="border-t border-gray-200">
          <div className="relative">
            <pre className="text-xs text-gray-700 p-4 bg-gray-50 overflow-auto max-h-80 font-mono leading-relaxed">
              {jsonString}
            </pre>
            {copied && (
              <div className="absolute top-2 right-2 bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                Copied!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};