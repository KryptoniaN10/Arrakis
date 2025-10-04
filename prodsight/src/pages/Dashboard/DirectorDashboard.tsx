import React from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Video,
  CheckCircle,
  Clock,
  Users,
  Zap,
} from 'lucide-react';
import { KPICard } from '../../components/dashboard/KPICard';
import { Task, Budget, Script, User } from '../../api/endpoints';

interface DirectorDashboardProps {
  user: User;
  tasks: Task[];
  budget: Budget | null;
  script: Script | null;
}

export const DirectorDashboard: React.FC<DirectorDashboardProps> = ({
  tasks,
  script,
}) => {
  const approvedScenes = script?.scenes.filter(scene => scene.status === 'approved').length || 0;
  const totalScenes = script?.totalScenes || 0;
  const vfxScenes = script?.vfxScenes || 0;
  const totalDuration = script?.totalEstimatedDuration || 0;

  const directorTasks = tasks.filter(task => task.category === 'Script' || task.assignee.includes('Director'));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Script Progress"
          value={`${approvedScenes}/${totalScenes}`}
          subtitle="Scenes approved"
          icon={FileText}
          color="blue"
          trend={{ value: 15, isPositive: true }}
        />
        
        <KPICard
          title="Total Runtime"
          value={`${totalDuration}min`}
          subtitle="Estimated duration"
          icon={Clock}
          color="green"
        />
        
        <KPICard
          title="VFX Scenes"
          value={vfxScenes}
          subtitle={`${Math.round((vfxScenes / Math.max(totalScenes, 1)) * 100)}% of total`}
          icon={Zap}
          color="purple"
        />
        
        <KPICard
          title="Director Tasks"
          value={directorTasks.length}
          subtitle={`${directorTasks.filter(t => t.status === 'done').length} completed`}
          icon={CheckCircle}
          color="yellow"
        />
      </div>

      {/* Script Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Scene Status Breakdown
          </h3>
          {script && (
            <div className="space-y-4">
              {['approved', 'in_review', 'draft'].map((status, index) => {
                const count = script.scenes.filter(scene => scene.status === status).length;
                const percentage = totalScenes > 0 ? (count / totalScenes) * 100 : 0;
                
                return (
                  <div key={status} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">
                        {status.replace('_', ' ')}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {count} scenes ({Math.round(percentage)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: 0.3 + index * 0.1, duration: 0.8 }}
                        className={`h-2 rounded-full ${
                          status === 'approved'
                            ? 'bg-green-500'
                            : status === 'in_review'
                            ? 'bg-yellow-500'
                            : 'bg-gray-400'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Recent Scenes */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Recent Scenes
          </h3>
          <div className="space-y-3">
            {script?.scenes.slice(0, 5).map((scene) => (
              <div key={scene.id} className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Scene {scene.number}
                    </span>
                    {scene.vfx && (
                      <Zap className="h-3 w-3 text-purple-500" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                    {scene.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {scene.location} • {scene.estimatedDuration}min
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    scene.status === 'approved'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      : scene.status === 'in_review'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {scene.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Characters and Locations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Production Elements
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Characters ({script?.characters.length || 0})
            </h4>
            <div className="flex flex-wrap gap-2">
              {script?.characters.slice(0, 8).map((character) => (
                <span
                  key={character}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full"
                >
                  {character}
                </span>
              ))}
              {(script?.characters.length || 0) > 8 && (
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded-full">
                  +{(script?.characters.length || 0) - 8} more
                </span>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
              <Video className="h-4 w-4 mr-2" />
              Locations ({script?.locations.length || 0})
            </h4>
            <div className="flex flex-wrap gap-2">
              {script?.locations.slice(0, 6).map((location) => (
                <span
                  key={location}
                  className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full"
                >
                  {location}
                </span>
              ))}
              {(script?.locations.length || 0) > 6 && (
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded-full">
                  +{(script?.locations.length || 0) - 6} more
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
