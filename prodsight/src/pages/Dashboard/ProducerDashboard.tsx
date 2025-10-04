import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckSquare,
  DollarSign,
  FileText,
  TrendingUp,
  Users,
  Calendar,
} from 'lucide-react';
import { KPICard } from '../../components/dashboard/KPICard';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { Task, Budget, Script, User } from '../../api/endpoints';

interface ProducerDashboardProps {
  user: User;
  tasks: Task[];
  budget: Budget | null;
  script: Script | null;
}

export const ProducerDashboard: React.FC<ProducerDashboardProps> = ({
  tasks,
  budget,
  script,
}) => {
  const completedTasks = tasks.filter(task => task.status === 'done').length;
  const totalTasks = tasks.length;
  const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const budgetUtilization = budget ? (budget.spent / budget.total) * 100 : 0;
  const isOverBudget = budget ? budget.spent > budget.total : false;

  const vfxScenes = script?.vfxScenes || 0;
  const totalScenes = script?.totalScenes || 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Task Completion"
          value={`${completedTasks}/${totalTasks}`}
          subtitle={`${Math.round(taskCompletionRate)}% complete`}
          icon={CheckSquare}
          color="green"
          trend={{ value: 12, isPositive: true }}
        />
        
        <KPICard
          title="Budget Status"
          value={budget ? formatCurrency(budget.remaining) : '$0'}
          subtitle={`${Math.round(budgetUtilization)}% utilized`}
          icon={DollarSign}
          color={isOverBudget ? 'red' : budgetUtilization > 80 ? 'yellow' : 'green'}
          trend={{ value: -5, isPositive: false }}
        />
        
        <KPICard
          title="Script Progress"
          value={`${totalScenes} scenes`}
          subtitle={`${vfxScenes} VFX scenes`}
          icon={FileText}
          color="blue"
        />
        
        <KPICard
          title="Overall Progress"
          value={`${Math.round((taskCompletionRate + (100 - budgetUtilization)) / 2)}%`}
          subtitle="Project completion"
          icon={TrendingUp}
          color="purple"
          trend={{ value: 8, isPositive: true }}
        />
      </div>

      {/* Charts and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Breakdown */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Budget Breakdown
          </h3>
          {budget && (
            <div className="space-y-4">
              {budget.categories.map((category, index) => {
                const utilization = category.budgeted > 0 ? (category.spent / category.budgeted) * 100 : 0;
                return (
                  <div key={category.name} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {category.name}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {formatCurrency(category.spent)} / {formatCurrency(category.budgeted)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(utilization, 100)}%` }}
                        transition={{ delay: 0.3 + index * 0.1, duration: 0.8 }}
                        className={`h-2 rounded-full ${
                          utilization > 100
                            ? 'bg-red-500'
                            : utilization > 80
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Recent Tasks */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Recent Tasks
          </h3>
          <div className="space-y-3">
            {tasks.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {task.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {task.assignee} • Due {new Date(task.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    task.status === 'done'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      : task.status === 'in_progress'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {task.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Team Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Team Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {tasks.filter(t => t.status === 'in_progress').length}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Active Tasks</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <Calendar className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {tasks.filter(t => new Date(t.dueDate) < new Date()).length}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Overdue Tasks</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <TrendingUp className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {Math.round(taskCompletionRate)}%
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Completion Rate</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
