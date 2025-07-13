import React from 'react';
import { ValidationResult } from '../types';
import { CheckCircle, XCircle, AlertTriangle, Activity, GitBranch } from 'lucide-react';

interface StatusPanelProps {
  validation: ValidationResult;
  nodeCount: number;
  edgeCount: number;
}

export const StatusPanel: React.FC<StatusPanelProps> = ({
  validation,
  nodeCount,
  edgeCount,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className={`px-4 py-3 ${validation.isValid ? 'bg-green-50 border-b border-green-200' : 'bg-red-50 border-b border-red-200'}`}>
        <div className="flex items-center gap-3">
          {validation.isValid ? (
            <CheckCircle className="w-6 h-6 text-green-600" />
          ) : (
            <XCircle className="w-6 h-6 text-red-600" />
          )}
          <div>
            <h3 className={`font-bold text-lg ${validation.isValid ? 'text-green-800' : 'text-red-800'}`}>
              {validation.isValid ? 'Valid DAG' : 'Invalid Pipeline'}
            </h3>
            <p className={`text-sm ${validation.isValid ? 'text-green-600' : 'text-red-600'}`}>
              {validation.isValid ? 'Ready for execution' : 'Issues need to be resolved'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <Activity className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-2xl font-bold text-blue-800">{nodeCount}</div>
              <div className="text-sm text-blue-600">Nodes</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
            <GitBranch className="w-5 h-5 text-purple-600" />
            <div>
              <div className="text-2xl font-bold text-purple-800">{edgeCount}</div>
              <div className="text-sm text-purple-600">Connections</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Validation Errors */}
      {validation.errors.length > 0 && (
        <div className="px-4 pb-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="font-semibold text-red-800 text-sm">Issues Found:</span>
            </div>
            <ul className="space-y-1">
              {validation.errors.map((error, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-red-700">
                  <span className="text-red-400 mt-1 text-xs">●</span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Success Message */}
      {validation.isValid && nodeCount > 0 && (
        <div className="px-4 pb-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-800 font-medium">
                Pipeline is ready for deployment!
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};