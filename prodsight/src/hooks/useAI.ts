import { useState } from 'react';
import { 
  aiService, 
  ScriptBreakdownResult, 
  BudgetForecast, 
  TaskAssignmentSuggestion, 
  ConflictResolution, 
  ProductionReport 
} from '../api/aiMock';
import { useNotification } from '../providers/NotificationProvider';

interface UseAIReturn {
  loading: boolean;
  error: string | null;
  breakdownScript: (scriptText: string) => Promise<ScriptBreakdownResult | null>;
  forecastBudget: (budgetData: any) => Promise<BudgetForecast | null>;
  suggestTaskAssignments: (tasks: any[], users: any[]) => Promise<TaskAssignmentSuggestion[] | null>;
  detectConflicts: (tasks: any[], schedule: any) => Promise<ConflictResolution | null>;
  generateReport: (projectData: any) => Promise<ProductionReport | null>;
  clearError: () => void;
}

export const useAI = (): UseAIReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError, showLoading, dismiss } = useNotification();

  const handleAIOperation = async <T>(
    operation: () => Promise<T>,
    loadingMessage: string,
    successMessage: string
  ): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const toastId = showLoading(loadingMessage);
      
      const result = await operation();
      
      dismiss(toastId);
      showSuccess(successMessage);
      
      return result;
    } catch (err: any) {
      setError(err.message || 'AI operation failed');
      showError(err.message || 'AI operation failed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const breakdownScript = async (scriptText: string): Promise<ScriptBreakdownResult | null> => {
    return handleAIOperation(
      () => aiService.breakdownScript(scriptText),
      'Analyzing script with AI...',
      'Script breakdown completed successfully'
    );
  };

  const forecastBudget = async (budgetData: any): Promise<BudgetForecast | null> => {
    return handleAIOperation(
      () => aiService.forecastBudget(budgetData),
      'Generating budget forecast...',
      'Budget forecast generated successfully'
    );
  };

  const suggestTaskAssignments = async (
    tasks: any[], 
    users: any[]
  ): Promise<TaskAssignmentSuggestion[] | null> => {
    return handleAIOperation(
      () => aiService.suggestTaskAssignments(tasks, users),
      'Analyzing optimal task assignments...',
      'Task assignment suggestions generated'
    );
  };

  const detectConflicts = async (
    tasks: any[], 
    schedule: any
  ): Promise<ConflictResolution | null> => {
    return handleAIOperation(
      () => aiService.detectConflicts(tasks, schedule),
      'Detecting potential conflicts...',
      'Conflict analysis completed'
    );
  };

  const generateReport = async (projectData: any): Promise<ProductionReport | null> => {
    return handleAIOperation(
      () => aiService.generateReport(projectData),
      'Generating production report...',
      'Production report generated successfully'
    );
  };

  const clearError = () => {
    setError(null);
  };

  return {
    loading,
    error,
    breakdownScript,
    forecastBudget,
    suggestTaskAssignments,
    detectConflicts,
    generateReport,
    clearError,
  };
};
