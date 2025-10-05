import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Clock,
  Users,
  Camera,
  Zap,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit,
  Download,
  AlertTriangle,
  CheckCircle,
  Bot,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { type ScheduleConstraints, type OptimizedSchedule } from '../../api/endpoints';

interface Scene {
  id: string;
  number: number;
  title: string;
  description: string;
  location: string;
  estimatedDuration: number;
  characters: string[];
  props: string[];
  vfx: boolean;
  status: 'scheduled' | 'in_progress' | 'completed' | 'delayed';
}

interface ScheduleEvent {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  location: string;
  scenes: Scene[];
  cast: string[];
  crew: string[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
}

interface LocationCluster {
  location: string;
  scenes: Scene[];
  estimatedDays: number;
  priority: number;
}

export const Scheduling: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [, setSelectedDate] = useState<Date | null>(null);
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [locationClusters, setLocationClusters] = useState<LocationCluster[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showAIScheduleModal, setShowAIScheduleModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);
  const [optimizedSchedule, setOptimizedSchedule] = useState<OptimizedSchedule | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editableEvent, setEditableEvent] = useState<ScheduleEvent | null>(null);

  useEffect(() => {
    setScenes([]);
    setLocationClusters([]);
  }, []);


  const generateAISchedule = async () => {
    setIsGeneratingSchedule(true);
    setScheduleError(null);
    
    try {
      // Create schedule constraints based on current data
      const constraints: ScheduleConstraints = {
        actor_constraints: {
          // Example constraints - could be made configurable
          'Maya': {
            max_consecutive_days: 3,
            preferred_call_times: ['09:00', '10:00']
          },
          'Rahul': {
            available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
          }
        },
        location_preferences: {
          'Radio Station': {
            setup_time_hours: 2,
            weather_dependent: false
          },
          'Beach - Kochi': {
            weather_dependent: true,
            setup_time_hours: 1
          }
        }
      };

      // Call the Gemini AI scheduling API directly for debugging
      console.log('🚀 Calling Gemini API with constraints:', constraints);
      
      const response = await fetch('http://localhost:5000/api/ai/generate_gemini_schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(constraints)
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log('📊 Full API Response:', responseData);
      
      // Check if response has the expected structure
      if (!responseData || typeof responseData !== 'object') {
        throw new Error('Invalid response format from server');
      }
      
      if (responseData.status === 'success' || responseData.status === 'warning') {
        const scheduleData = responseData.schedule_data;
        
        if (scheduleData && scheduleData.daily_schedules) {
          setOptimizedSchedule(scheduleData);
          
          // Convert the optimized schedule to calendar events
          const events: ScheduleEvent[] = [];
          let currentScheduleDate = new Date();
          currentScheduleDate.setDate(currentScheduleDate.getDate() + 1); // Start tomorrow

          scheduleData.daily_schedules.forEach((daySchedule: any, dayIndex: number) => {
            const dayScenes = (daySchedule.scenes || []).map((scene: any) => ({
              id: (scene.scene_number || dayIndex).toString(),
              number: scene.scene_number || dayIndex,
              title: scene.scene_name || scene.scene_title || `Scene ${scene.scene_number || dayIndex}`,
              description: `${scene.location || 'Unknown Location'} - ${scene.time_of_day || 'Unknown Time'}`,
              location: scene.location || 'Unknown Location',
              estimatedDuration: Math.ceil((scene.duration || scene.estimated_duration_minutes || 60) / 60), // Convert to hours
              characters: scene.actors || scene.actors_needed || [],
              props: [],
              vfx: false,
              status: 'scheduled' as const
            }));

            const event: ScheduleEvent = {
              id: `ai-event-${dayIndex}`,
              date: new Date(currentScheduleDate),
              startTime: (daySchedule.scenes && daySchedule.scenes[0]?.call_time) || '09:00',
              endTime: (daySchedule.scenes && daySchedule.scenes[daySchedule.scenes.length - 1]?.estimated_wrap) || '18:00',
              location: daySchedule.location_focus || 'Unknown Location',
              scenes: dayScenes,
              cast: daySchedule.daily_summary?.primary_actors || [],
              crew: ['Director', 'DOP', 'Sound Engineer', 'Assistant Director'],
              status: 'scheduled',
              notes: `AI-optimized schedule: ${(daySchedule.scenes || []).length} scenes, ${daySchedule.daily_summary?.total_duration_minutes || 'Unknown'} minutes total`
            };

            events.push(event);
            currentScheduleDate.setDate(currentScheduleDate.getDate() + 1);
          });

          setScheduleEvents(events);
          
          // Show success message
          if (responseData.status === 'warning') {
            setScheduleError(`Schedule generated with fallback: ${responseData.message}`);
          }
        } else {
          // API succeeded but no valid schedule data
          setScheduleError('Schedule generated but data format is invalid. Using fallback.');
          console.warn('Schedule data missing or invalid:', scheduleData);
          
          // Use fallback scheduling
          throw new Error('Invalid schedule data structure');
        }
      } else {
        setScheduleError(responseData.message || 'Failed to generate schedule');
      }
    } catch (error: any) {
      console.error('Schedule generation error:', error);
      setScheduleError(error.message || 'Network error: Unable to connect to scheduling service');
      
      // No fallback - show error message to user
      console.log('No fallback schedule available - user should see error message');
    } finally {
      setIsGeneratingSchedule(false);
      setShowAIScheduleModal(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getEventsForDate = (date: Date) => {
    return scheduleEvents.filter(event => 
      new Date(event.date).toDateString() === date.toDateString()
    );
  };

  // Returns a stable Day N label based on chronological order of scheduled dates
  const getShootDayLabel = (date: any) => {
    const uniqueDates = Array.from(new Set(scheduleEvents.map(e => new Date(e.date).toDateString())));
    uniqueDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const index = uniqueDates.indexOf(new Date(date).toDateString());
    return index >= 0 ? `Day ${index + 1}` : '';
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clickedDate);
    const events = getEventsForDate(clickedDate);
    if (events.length > 0) {
      setSelectedEvent(events[0]);
      setShowEventModal(true);
      setIsEditing(false);
      setEditableEvent(null);
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const events = getEventsForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();
      const hasEvents = events.length > 0;

      days.push(
        <div
          key={day}
          onClick={() => handleDateClick(day)}
          className={`h-24 border border-gray-200 dark:border-gray-700 p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
            isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''
          }`}
        >
          <div className={`text-sm font-medium ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}`}>
            {day}
          </div>
          {hasEvents && (
            <div className="mt-1 space-y-1">
              {events.slice(0, 2).map((event, index) => (
                <div
                  key={index}
                  className={`text-xs px-2 py-1 rounded truncate ${
                    event.status === 'completed' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : event.status === 'in_progress'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      : event.status === 'cancelled'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                  }`}
                >
                  {getShootDayLabel(new Date(event.date)) || event.location}
                </div>
              ))}
              {events.length > 2 && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  +{events.length - 2} more
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            AI-Powered Scheduling
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Intelligent shoot scheduling with location clustering
          </p>
          {scheduleError && (
            <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mr-2" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">{scheduleError}</p>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => setShowAIScheduleModal(true)}
            disabled={isGeneratingSchedule}
          >
            <Bot className="h-4 w-4 mr-2" />
            {isGeneratingSchedule ? 'Generating...' : 'AI Schedule'}
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>
      </div>

      {/* AI Schedule Summary */}
      {optimizedSchedule && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <Bot className="h-5 w-5 mr-2 text-blue-500" />
              AI-Optimized Schedule
            </h2>
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-full text-sm font-medium">
              {optimizedSchedule.total_shooting_days} Days
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{optimizedSchedule.scheduling_strategy}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {optimizedSchedule.daily_schedules.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Shooting Days</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {Object.keys(optimizedSchedule.actor_schedules).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Actors Scheduled</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {Object.keys(optimizedSchedule.location_schedule).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Locations</div>
            </div>
          </div>
          {optimizedSchedule.optimization_benefits.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Key Benefits:</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                {optimizedSchedule.optimization_benefits.slice(0, 3).map((benefit, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Location Clusters Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locationClusters.map((cluster, index) => (
          <motion.div
            key={cluster.location}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                {cluster.location}
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {cluster.estimatedDays} day{cluster.estimatedDays !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Camera className="h-4 w-4 mr-2" />
                {cluster.scenes.length} scene{cluster.scenes.length !== 1 ? 's' : ''}
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Clock className="h-4 w-4 mr-2" />
                {cluster.scenes.reduce((total, scene) => total + scene.estimatedDuration, 0)} hours total
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Calendar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Calendar Header */}
          <div className="grid grid-cols-7 gap-0 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-0 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            {renderCalendar()}
          </div>
        </div>
      </div>

      {/* AI Schedule Generation Modal */}
      <Modal
        isOpen={showAIScheduleModal}
        onClose={() => setShowAIScheduleModal(false)}
        title="AI-Powered Schedule Generation"
        size="lg"
      >
        <div className="space-y-6">
          <div className="text-center">
            <Bot className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Intelligent Scheduling Algorithm
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Our AI will analyze your scenes and create an optimized shooting schedule based on:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Location Clustering</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Group scenes by location to minimize travel time and costs
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Time Optimization</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Optimize shooting order based on scene duration and complexity
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Users className="h-5 w-5 text-purple-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Cast Availability</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Consider actor schedules and availability constraints
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Zap className="h-5 w-5 text-orange-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">VFX Priority</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Schedule VFX scenes early for post-production planning
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Current Analysis:</h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• {scenes.length} scenes across {locationClusters.length} locations</li>
              <li>• Estimated {locationClusters.reduce((total, cluster) => total + cluster.estimatedDays, 0)} shooting days</li>
              <li>• {scenes.filter(scene => scene.vfx).length} VFX scenes requiring early completion</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => setShowAIScheduleModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={generateAISchedule}
              loading={isGeneratingSchedule}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Generate Schedule
            </Button>
          </div>
        </div>
      </Modal>

      {/* Event Details Modal */}
      <Modal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        title="Shooting Schedule Details"
        size="lg"
      >
        {selectedEvent && (
          <div className="space-y-6">
            {/* Read-only details or Edit form */}
            {!isEditing && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Date & Time</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {new Date(selectedEvent.date).toLocaleDateString()} | {selectedEvent.startTime} - {selectedEvent.endTime}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Location</h4>
                    <p className="text-gray-600 dark:text-gray-400 flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {selectedEvent.location}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Scenes to Shoot</h4>
                  <div className="space-y-2">
                    {selectedEvent.scenes.map(scene => (
                      <div key={scene.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            Scene {scene.number}: {scene.title}
                          </span>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{scene.description}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {scene.estimatedDuration}h
                          </span>
                          {scene.vfx && <Zap className="h-4 w-4 text-purple-500" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Cast Required</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedEvent.cast.map(actor => (
                        <span key={actor} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-full text-sm">
                          {actor}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Crew Required</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedEvent.crew.map(member => (
                        <span key={member} className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-full text-sm">
                          {member}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {selectedEvent.notes && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Notes</h4>
                    <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      {selectedEvent.notes}
                    </p>
                  </div>
                )}
              </>
            )}

            {isEditing && editableEvent && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                    <input
                      type="date"
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                      value={new Date(editableEvent.date).toISOString().split('T')[0]}
                      onChange={(e) => setEditableEvent({ ...editableEvent, date: new Date(e.target.value) })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time</label>
                      <input
                        type="time"
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                        value={editableEvent.startTime}
                        onChange={(e) => setEditableEvent({ ...editableEvent, startTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time</label>
                      <input
                        type="time"
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                        value={editableEvent.endTime}
                        onChange={(e) => setEditableEvent({ ...editableEvent, endTime: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                      value={editableEvent.location}
                      onChange={(e) => setEditableEvent({ ...editableEvent, location: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    <select
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                      value={editableEvent.status}
                      onChange={(e) => setEditableEvent({ ...editableEvent, status: e.target.value as ScheduleEvent['status'] })}
                    >
                      <option value="scheduled">scheduled</option>
                      <option value="in_progress">in_progress</option>
                      <option value="completed">completed</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                  <textarea
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                    rows={3}
                    value={editableEvent.notes || ''}
                    onChange={(e) => setEditableEvent({ ...editableEvent, notes: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cast (comma separated)</label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                      value={editableEvent.cast.join(', ')}
                      onChange={(e) => setEditableEvent({ ...editableEvent, cast: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Crew (comma separated)</label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                      value={editableEvent.crew.join(', ')}
                      onChange={(e) => setEditableEvent({ ...editableEvent, crew: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                    />
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Scenes</h4>
                  <div className="space-y-2">
                    {editableEvent.scenes.map((scene, idx) => (
                      <div key={scene.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                            <input
                              type="text"
                              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                              value={scene.title}
                              onChange={(e) => {
                                const scenes = [...editableEvent.scenes];
                                scenes[idx] = { ...scenes[idx], title: e.target.value };
                                setEditableEvent({ ...editableEvent, scenes });
                              }}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                            <input
                              type="text"
                              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                              value={scene.location}
                              onChange={(e) => {
                                const scenes = [...editableEvent.scenes];
                                scenes[idx] = { ...scenes[idx], location: e.target.value };
                                setEditableEvent({ ...editableEvent, scenes });
                              }}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estimated Duration (h)</label>
                            <input
                              type="number"
                              min={0}
                              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                              value={scene.estimatedDuration}
                              onChange={(e) => {
                                const scenes = [...editableEvent.scenes];
                                const val = Number(e.target.value);
                                scenes[idx] = { ...scenes[idx], estimatedDuration: isNaN(val) ? scenes[idx].estimatedDuration : val };
                                setEditableEvent({ ...editableEvent, scenes });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              {!isEditing && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditableEvent(JSON.parse(JSON.stringify(selectedEvent)) as ScheduleEvent);
                    setIsEditing(true);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Schedule
                </Button>
              )}
              {isEditing && editableEvent && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setIsEditing(false);
                      setEditableEvent(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      // Persist changes locally
                      const updated = editableEvent;
                      setScheduleEvents(prev => prev.map(ev => ev.id === updated.id ? updated : ev));
                      setSelectedEvent(updated);
                      setIsEditing(false);
                      setEditableEvent(null);
                    }}
                  >
                    Save Changes
                  </Button>
                </>
              )}
              {!isEditing && (
                <Button
                  onClick={async () => {
                    if (!selectedEvent) return;
                    try {
                      const payload = {
                        ...selectedEvent,
                        date: new Date(selectedEvent.date).toISOString()
                      } as any;
                      const res = await fetch('http://localhost:5000/api/ai/generate_call_sheet?format=text', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                      });
                      const text = await res.text();
                      if (res.ok) {
                        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `call_sheet_${new Date(selectedEvent.date).toISOString().split('T')[0]}.txt`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        URL.revokeObjectURL(url);
                      } else {
                        console.error('Failed to generate call sheet', text);
                      }
                    } catch (e) {
                      console.error('Call sheet generation error', e);
                    }
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Generate Call Sheet
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
