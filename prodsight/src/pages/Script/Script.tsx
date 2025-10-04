import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Upload,
  Zap,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  Users,
  MapPin,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { RoleGuard } from '../../components/auth/RoleGuard';
import { useScript } from '../../hooks/useScript';
import { useAI } from '../../hooks/useAI';
import { formatDate, getStatusColor } from '../../utils/formatters';

export const Script: React.FC = () => {
  const { script, loading, updateScene } = useScript();
  const { breakdownScript, loading: aiLoading } = useAI();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [scriptText, setScriptText] = useState('');
  const [breakdown, setBreakdown] = useState<any>(null);

  const handleScriptUpload = async () => {
    if (scriptText.trim()) {
      const result = await breakdownScript(scriptText);
      if (result) {
        setBreakdown(result);
        setShowUploadModal(false);
        setShowBreakdownModal(true);
      }
    }
  };

  const handleSceneStatusUpdate = async (sceneId: string, status: string) => {
    await updateScene(sceneId, { status });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <RoleGuard permissions={['manage_script', 'ai_breakdown']}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Script Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Upload and analyze scripts with AI-powered breakdown
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowUploadModal(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Script
            </Button>
            <Button>
              <Zap className="h-4 w-4 mr-2" />
              AI Breakdown
            </Button>
          </div>
        </div>

        {/* Script Overview */}
        {script && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card p-6 text-center">
              <FileText className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {script.totalScenes}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Scenes</p>
            </div>
            
            <div className="card p-6 text-center">
              <Clock className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {script.totalEstimatedDuration}m
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Runtime</p>
            </div>
            
            <div className="card p-6 text-center">
              <Zap className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {script.vfxScenes}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">VFX Scenes</p>
            </div>
            
            <div className="card p-6 text-center">
              <MapPin className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {script.locations.length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Locations</p>
            </div>
          </div>
        )}

        {/* Scenes Table */}
        {script && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Scene Breakdown
              </h3>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Scene</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Description</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Location</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Duration</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">VFX</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {script.scenes.map((scene) => (
                    <tr key={scene.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                        {scene.number}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400 max-w-xs">
                        <div className="truncate" title={scene.description}>
                          {scene.description}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {scene.location}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {scene.estimatedDuration}m
                      </td>
                      <td className="py-3 px-4">
                        {scene.vfx ? (
                          <Zap className="h-4 w-4 text-purple-500" />
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(scene.status)}`}>
                          {scene.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          {scene.status !== 'approved' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSceneStatusUpdate(scene.id, 'approved')}
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Characters and Locations */}
        {script && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="card p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Characters ({script.characters.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {script.characters.map((character) => (
                  <span
                    key={character}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full"
                  >
                    {character}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="card p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Locations ({script.locations.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {script.locations.map((location) => (
                  <span
                    key={location}
                    className="px-3 py-1 text-sm bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full"
                  >
                    {location}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* Upload Script Modal */}
        <Modal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          title="Upload Script"
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Script Content
              </label>
              <textarea
                value={scriptText}
                onChange={(e) => setScriptText(e.target.value)}
                rows={12}
                className="input-field resize-none"
                placeholder="Paste your script content here or upload a file..."
              />
            </div>
            
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Or drag and drop a script file
              </p>
              <Button variant="secondary" size="sm">
                Choose File
              </Button>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="secondary"
                onClick={() => setShowUploadModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleScriptUpload}
                loading={aiLoading}
                disabled={!scriptText.trim()}
              >
                <Zap className="h-4 w-4 mr-2" />
                Analyze with AI
              </Button>
            </div>
          </div>
        </Modal>

        {/* AI Breakdown Results Modal */}
        <Modal
          isOpen={showBreakdownModal}
          onClose={() => setShowBreakdownModal(false)}
          title="AI Script Breakdown Results"
          size="xl"
        >
          {breakdown && (
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {breakdown.summary.totalScenes}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">Scenes</p>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {breakdown.summary.totalDuration}m
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">Duration</p>
                </div>
                <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    {breakdown.summary.vfxScenes}
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400">VFX Scenes</p>
                </div>
                <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">
                    {breakdown.summary.locations.length}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400">Locations</p>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Detected Scenes
                </h4>
                <div className="space-y-3">
                  {breakdown.scenes.map((scene: any, index: number) => (
                    <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            Scene {scene.number}
                          </span>
                          {scene.vfx && <Zap className="h-4 w-4 text-purple-500" />}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {scene.estimatedDuration}min
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {scene.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>{scene.location}</span>
                        <span>{scene.timeOfDay}</span>
                        <span>{scene.characters.length} characters</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="secondary" onClick={() => setShowBreakdownModal(false)}>
                  Close
                </Button>
                <Button>
                  Save Breakdown
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </motion.div>
    </RoleGuard>
  );
};
