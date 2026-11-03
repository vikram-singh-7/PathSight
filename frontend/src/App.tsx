import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import { Header } from './components/Header';
import { NavigationSidebar } from './components/NavigationSidebar';
import { CameraView } from './components/CameraView';
import { ObservationFeed } from './components/ObservationFeed';
import { CampusMapCanvas } from './components/CampusMapCanvas';
import { RoutePlanner } from './components/RoutePlanner';
import { SettingsPanel } from './components/SettingsPanel';

import { useCamera } from './hooks/useCamera';
import { useSpeech } from './hooks/useSpeech';
import { formatDetectionSpeech } from './utils/speechFormatter';
import {
  fetchBackendHealth,
  fetchModelStatus,
  fetchCampusNodes,
  fetchCampusEdges,
  calculateRoute,
  updateCampusObstacle,
  detectFrame,
} from './services/api';

import type {
  ActiveTab,
  UserSettings,
  CampusNode,
  CampusEdge,
  RouteResponse,
  DetectionItem,
  Observation,
} from './types';

export function App() {
  // Navigation tab & user settings
  const [activeTab, setActiveTab] = useState<ActiveTab>('assist');
  const [settings, setSettings] = useState<UserSettings>({
    textSize: 'standard',
    speechRate: 1.0,
    speechVolume: 1.0,
    contrastMode: 'dark-navy',
    soundEarcons: true,
    autoSpeakObservations: true,
    detectionThrottleFps: 2,
    confidenceThreshold: 0.35,
  });

  // Assistance active state
  const [isAssistanceActive, setIsAssistanceActive] = useState<boolean>(false);
  const [modelReady, setModelReady] = useState<boolean>(false);
  const [backendError, setBackendError] = useState<string | null>(null);

  // Vision state
  const [detections, setDetections] = useState<DetectionItem[]>([]);
  const [primaryHazard, setPrimaryHazard] = useState<string | null>(null);
  const [speechSummary, setSpeechSummary] = useState<string>('');
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [lastProcessingMs, setLastProcessingMs] = useState<number>(0);

  // Campus Graph & Navigation state
  const [campusNodes, setCampusNodes] = useState<CampusNode[]>([]);
  const [campusEdges, setCampusEdges] = useState<CampusEdge[]>([]);
  const [selectedSource, setSelectedSource] = useState<string>('gate_main');
  const [selectedDestination, setSelectedDestination] = useState<string>('central_library');
  const [accessibleOnly, setAccessibleOnly] = useState<boolean>(true);
  const [routeData, setRouteData] = useState<RouteResponse | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState<boolean>(false);

  // Active Navigation Session state
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [isNavPaused, setIsNavPaused] = useState<boolean>(false);
  const [confirmedStepIndex, setConfirmedStepIndex] = useState<number>(0);

  // Observations log
  const [observations, setObservations] = useState<Observation[]>([]);

  // Hooks
  const camera = useCamera();
  const speech = useSpeech({
    rate: settings.speechRate,
    volume: settings.speechVolume,
    cooldownMs: 4500,
  });

  // Throttled detection timer ref
  const detectionTimerRef = useRef<number | null>(null);
  const isDetectingRef = useRef<boolean>(false);
  const lastObsSignatureRef = useRef<string>('');
  const lastObsTimeRef = useRef<number>(0);

  // Add observation helper
  const addObservation = useCallback(
    (text: string, type: 'obstacle' | 'route' | 'info' | 'system', isHazard: boolean = false) => {
      const newObs: Observation = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date(),
        text,
        type,
        isHazard,
      };
      setObservations((prev) => [newObs, ...prev.slice(0, 30)]);
    },
    []
  );

  // Verify backend and model status
  const checkBackendStatus = useCallback(async () => {
    try {
      const [health, modelInfo] = await Promise.all([
        fetchBackendHealth(),
        fetchModelStatus(),
      ]);
      if (health.status === 'ok' && modelInfo.is_loaded) {
        setModelReady(true);
        setBackendError(null);
      } else {
        setModelReady(false);
        setBackendError(modelInfo.load_error || 'AI Vision model is initializing.');
      }

      // If campus data was not yet populated, fetch it
      setCampusNodes((currentNodes) => {
        if (currentNodes.length === 0) {
          fetchCampusNodes().then(setCampusNodes).catch(() => {});
          fetchCampusEdges().then(setCampusEdges).catch(() => {});
        }
        return currentNodes;
      });
    } catch (err: unknown) {
      setModelReady(false);
      setBackendError(
        err instanceof Error
          ? err.message
          : 'Unable to connect to FastAPI backend at port 8000.'
      );
    }
  }, []);

  // Initial load
  useEffect(() => {
    let isMounted = true;

    async function initStatus() {
      try {
        const [health, modelInfo] = await Promise.all([
          fetchBackendHealth(),
          fetchModelStatus(),
        ]);
        if (isMounted) {
          if (health.status === 'ok' && modelInfo.is_loaded) {
            setModelReady(true);
            setBackendError(null);
          } else {
            setModelReady(false);
            setBackendError(modelInfo.load_error || 'AI Vision model is initializing.');
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setModelReady(false);
          setBackendError(
            err instanceof Error
              ? err.message
              : 'Unable to connect to FastAPI backend at port 8000.'
          );
        }
      }
    }

    initStatus();

    async function loadCampusData() {
      try {
        const [nodes, edges] = await Promise.all([
          fetchCampusNodes(),
          fetchCampusEdges(),
        ]);
        if (isMounted) {
          setCampusNodes(nodes);
          setCampusEdges(edges);
          addObservation('Sample campus network loaded with 9 landmarks and connecting walkways.', 'system');
        }
      } catch {
        if (isMounted) {
          addObservation('Unable to load campus pathways from backend.', 'system', true);
        }
      }
    }
    loadCampusData();

    // Periodic model heartbeat check every 10s
    const hb = setInterval(checkBackendStatus, 10000);
    return () => {
      isMounted = false;
      clearInterval(hb);
    };
  }, [checkBackendStatus, addObservation]);

  // Toggle vision assistance handler
  const handleToggleAssistance = useCallback(async () => {
    if (isAssistanceActive) {
      setIsAssistanceActive(false);
      camera.stopCamera();
      if (detectionTimerRef.current) {
        window.clearInterval(detectionTimerRef.current);
        detectionTimerRef.current = null;
      }
      setDetections([]);
      setPrimaryHazard(null);
      setSpeechSummary('Vision assistance paused.');
      speech.speak('Vision assistance paused.');
      addObservation('Visual and voice assistance paused.', 'system');
    } else {
      setIsAssistanceActive(true);
      await camera.startCamera();
      speech.playEarcon('success');
      speech.speak('Vision assistance active. Scanning environment.');
      addObservation('Assistance started. Scanning camera view for objects & obstacles.', 'info');
    }
  }, [isAssistanceActive, camera, speech, addObservation]);

  // Refs to decouple detection loop from hook object re-instantiations
  const captureFrameRef = useRef(camera.captureFrame);
  const speakRef = useRef(speech.speak);

  useEffect(() => {
    captureFrameRef.current = camera.captureFrame;
    speakRef.current = speech.speak;
  });

  // Continuous frame capture loop when assistance is active
  useEffect(() => {
    if (!isAssistanceActive || camera.status !== 'active') {
      if (detectionTimerRef.current) {
        window.clearInterval(detectionTimerRef.current);
        detectionTimerRef.current = null;
      }
      return;
    }

    const intervalMs = Math.round(1000 / settings.detectionThrottleFps);

    detectionTimerRef.current = window.setInterval(async () => {
      if (isDetectingRef.current) return;

      const frame = captureFrameRef.current();
      if (!frame) return;

      try {
        isDetectingRef.current = true;
        setIsDetecting(true);

        const res = await detectFrame(frame, settings.confidenceThreshold);
        setDetections(res.detections);
        setPrimaryHazard(res.primary_hazard || null);
        setSpeechSummary(res.speech_summary);
        setLastProcessingMs(res.processing_ms);
        setBackendError(null);

        // Natural, debounced voice announcements from genuine detections
        const { speechText, isUrgent, sceneSignature } = formatDetectionSpeech(res.detections);
        const now = Date.now();

        // Speak & log if scene signature changed OR > 4.5 seconds have elapsed
        if (sceneSignature !== lastObsSignatureRef.current || now - lastObsTimeRef.current > 4500) {
          lastObsSignatureRef.current = sceneSignature;
          lastObsTimeRef.current = now;

          addObservation(speechText, 'obstacle', isUrgent);

          if (settings.autoSpeakObservations) {
            speakRef.current(speechText, isUrgent ? 'urgent' : 'normal');
          }
        }
      } catch (err: unknown) {
        setBackendError(
          err instanceof Error ? err.message : 'Error communicating with detection backend.'
        );
      } finally {
        isDetectingRef.current = false;
        setIsDetecting(false);
      }
    }, intervalMs);

    return () => {
      if (detectionTimerRef.current) {
        window.clearInterval(detectionTimerRef.current);
        detectionTimerRef.current = null;
      }
    };
  }, [
    isAssistanceActive,
    camera.status,
    settings.detectionThrottleFps,
    settings.confidenceThreshold,
    settings.autoSpeakObservations,
    addObservation,
  ]);

  // Handle route calculation
  const handleCalculateRoute = useCallback(async () => {
    if (!selectedSource || !selectedDestination) {
      addObservation('Please select both a start waypoint and destination.', 'route', true);
      return;
    }

    if (selectedSource === selectedDestination) {
      const msg = 'Starting point and destination are identical. You are already at this location.';
      speech.speak(msg);
      addObservation(msg, 'route');
      return;
    }

    setIsLoadingRoute(true);
    try {
      const result = await calculateRoute(selectedSource, selectedDestination, accessibleOnly);
      setRouteData(result);
      setConfirmedStepIndex(0);
      setIsNavigating(false);
      setIsNavPaused(false);

      if (result.success && result.steps.length > 0) {
        speech.playEarcon('turn');
        const announcement = `Route planned to ${result.steps[result.steps.length - 1].to_name}. Total distance is ${result.total_distance_meters} meters, approximately ${result.estimated_time_minutes} minutes walk. First step: ${result.steps[0].instructions}`;
        speech.speak(announcement);
        addObservation(announcement, 'route');
      } else if (result.warnings.length > 0) {
        speech.playEarcon('warning');
        speech.speak(result.warnings[0], 'urgent');
        addObservation(result.warnings[0], 'route', true);
      }
    } catch (err: unknown) {
      addObservation(
        err instanceof Error ? err.message : 'Error calculating campus route.',
        'route',
        true
      );
    } finally {
      setIsLoadingRoute(false);
    }
  }, [selectedSource, selectedDestination, accessibleOnly, speech, addObservation]);

  // Start Navigation Session
  const handleStartNavigation = useCallback(() => {
    if (!routeData || !routeData.success || routeData.steps.length === 0) return;

    setIsNavigating(true);
    setIsNavPaused(false);
    setConfirmedStepIndex(0);

    const firstStep = routeData.steps[0];
    const promptText = `Navigation session started. Proceed from ${firstStep.from_name} toward ${firstStep.to_name}. ${firstStep.instructions}`;
    speech.playEarcon('turn');
    speech.speak(promptText);
    addObservation(`Navigation started: ${firstStep.instructions}`, 'route');
  }, [routeData, speech, addObservation]);

  // Pause Navigation Guidance
  const handlePauseNavigation = useCallback(() => {
    setIsNavPaused(true);
    speech.speak('Navigation guidance paused.');
    addObservation('Navigation guidance paused by user.', 'system');
  }, [speech, addObservation]);

  // Resume Navigation Guidance
  const handleResumeNavigation = useCallback(() => {
    setIsNavPaused(false);
    if (routeData && routeData.steps[confirmedStepIndex]) {
      const step = routeData.steps[confirmedStepIndex];
      const resumeText = `Navigation resumed. Next waypoint is ${step.to_name}. ${step.instructions}`;
      speech.speak(resumeText);
      addObservation(`Navigation resumed: ${step.instructions}`, 'route');
    }
  }, [routeData, confirmedStepIndex, speech, addObservation]);

  // Manually Confirm Arrival at Waypoint
  const handleConfirmWaypointArrival = useCallback(() => {
    if (!routeData || !routeData.steps || routeData.steps.length === 0) return;

    const currentStep = routeData.steps[confirmedStepIndex];
    const totalSteps = routeData.steps.length;

    if (confirmedStepIndex < totalSteps - 1) {
      const nextIndex = confirmedStepIndex + 1;
      const nextStep = routeData.steps[nextIndex];

      setConfirmedStepIndex(nextIndex);
      speech.playEarcon('turn');

      const msg = `Arrival confirmed at ${currentStep.to_name}. Next waypoint is ${nextStep.to_name}. ${nextStep.instructions}`;
      speech.speak(msg);
      addObservation(`Waypoint reached: ${currentStep.to_name}. Next: ${nextStep.to_name}`, 'route');
    } else {
      // Arrived at final destination!
      setIsNavigating(false);
      speech.playEarcon('success');

      const arrivalMsg = `Arrival confirmed at ${currentStep.to_name}. You have reached your final destination. Navigation complete.`;
      speech.speak(arrivalMsg);
      addObservation(arrivalMsg, 'route');
    }
  }, [routeData, confirmedStepIndex, speech, addObservation]);

  // Repeat Current Instruction
  const handleRepeatInstruction = useCallback(() => {
    if (routeData && routeData.steps[confirmedStepIndex]) {
      const step = routeData.steps[confirmedStepIndex];
      speech.speak(step.instructions, 'repeat');
    }
  }, [routeData, confirmedStepIndex, speech]);

  // Reset Route
  const handleResetRoute = useCallback(() => {
    setIsNavigating(false);
    setIsNavPaused(false);
    setConfirmedStepIndex(0);
    setRouteData(null);
    speech.speak('Route reset.');
    addObservation('Campus route cleared.', 'system');
  }, [speech, addObservation]);

  // Handle dynamic obstacle reporting & rerouting
  const handleToggleObstacle = useCallback(
    async (edgeId: string, isBlocked: boolean) => {
      try {
        await updateCampusObstacle(edgeId, isBlocked, 'Maintenance / Temporary barrier');
        const updatedEdges = await fetchCampusEdges();
        setCampusEdges(updatedEdges);

        const notice = isBlocked
          ? `Hazard reported: Pathway ${edgeId} is now marked blocked.`
          : `Pathway ${edgeId} obstruction cleared.`;

        addObservation(notice, 'obstacle', isBlocked);
        speech.playEarcon(isBlocked ? 'warning' : 'success');

        if (selectedSource && selectedDestination && selectedSource !== selectedDestination) {
          const reroute = await calculateRoute(selectedSource, selectedDestination, accessibleOnly);
          setRouteData(reroute);
          setConfirmedStepIndex(0);

          if (reroute.success && reroute.steps.length > 0) {
            const reAnnounce = `Dynamic detour updated. Next waypoint is ${reroute.steps[0].to_name}. ${reroute.steps[0].instructions}`;
            speech.speak(reAnnounce, 'urgent');
            addObservation(reAnnounce, 'route');
          }
        }
      } catch (err: unknown) {
        addObservation(
          err instanceof Error ? err.message : 'Failed to update pathway obstacle.',
          'system',
          true
        );
      }
    },
    [selectedSource, selectedDestination, accessibleOnly, speech, addObservation]
  );

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if (e.altKey) {
        if (e.key === '1') {
          e.preventDefault();
          setActiveTab('assist');
        } else if (e.key === '2') {
          e.preventDefault();
          setActiveTab('navigate');
        } else if (e.key === '3') {
          e.preventDefault();
          setActiveTab('settings');
        }
      } else if ((e.key === 'm' || e.key === 'M') && e.target === document.body) {
        e.preventDefault();
        speech.toggleMute();
      }
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [speech]);

  const isHighContrast = settings.contrastMode === 'high-contrast-yellow';

  // Compute active waypoint IDs for map visualization
  const currentStep = routeData && routeData.steps[confirmedStepIndex];
  const currentConfirmedNodeId = isNavigating && currentStep ? currentStep.from_node : selectedSource;
  const nextTargetNodeId = isNavigating && currentStep ? currentStep.to_node : selectedDestination;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: isHighContrast ? '#000000' : '#070d18',
        color: isHighContrast ? '#facc15' : '#f8fafc',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: settings.textSize === 'xlarge' ? '19px' : settings.textSize === 'large' ? '17px' : '15px',
      }}
    >
      {/* 1. Top Header with Live System Statuses */}
      <Header
        isAssistanceActive={isAssistanceActive}
        cameraStatus={camera.status}
        modelReady={modelReady}
        voiceStatus={speech.voiceStatus}
        speechSupported={speech.speechSupported}
        contrastMode={settings.contrastMode}
        onToggleMute={speech.toggleMute}
        onToggleContrast={() =>
          setSettings((prev) => ({
            ...prev,
            contrastMode: prev.contrastMode === 'dark-navy' ? 'high-contrast-yellow' : 'dark-navy',
          }))
        }
      />

      {/* Main Responsive Body with Sidebar */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }} className="app-layout">
        {/* Desktop Compact Sidebar / Navigation */}
        <NavigationSidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          contrastMode={settings.contrastMode}
        />

        {/* Primary Main Workspace */}
        <main
          role="main"
          style={{
            flex: 1,
            padding: '16px 20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Tab 1: Assist & Vision (Primary Focus) */}
          <div
            style={{
              display: activeTab === 'assist' ? 'flex' : 'none',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <CameraView
              videoRef={camera.videoRef}
              cameraStatus={camera.status}
              errorMessage={camera.errorMessage}
              facingMode={camera.facingMode}
              videoDevices={camera.videoDevices}
              selectedDeviceId={camera.selectedDeviceId}
              isAssistanceActive={isAssistanceActive}
              detections={detections}
              primaryHazard={primaryHazard}
              speechSummary={speechSummary}
              isDetecting={isDetecting}
              modelReady={modelReady}
              backendError={backendError}
              lastProcessingMs={lastProcessingMs}
              voiceStatus={speech.voiceStatus}
              contrastMode={settings.contrastMode}
              onToggleAssistance={handleToggleAssistance}
              onToggleFacingMode={camera.toggleFacingMode}
              onSelectCamera={camera.selectCamera}
              onRetryBackend={checkBackendStatus}
              onToggleMute={speech.toggleMute}
              onTestVoice={speech.speakTest}
            />

            <ObservationFeed
              observations={observations}
              contrastMode={settings.contrastMode}
              onReplay={(text) => speech.speak(text, 'repeat')}
            />
          </div>

          {/* Tab 2: Campus Route (Navigate) */}
          <div
            style={{
              display: activeTab === 'navigate' ? 'flex' : 'none',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <RoutePlanner
              nodes={campusNodes}
              edges={campusEdges}
              selectedSource={selectedSource}
              selectedDestination={selectedDestination}
              routeData={routeData}
              accessibleOnly={accessibleOnly}
              isLoadingRoute={isLoadingRoute}
              isNavigating={isNavigating}
              isNavPaused={isNavPaused}
              confirmedStepIndex={confirmedStepIndex}
              contrastMode={settings.contrastMode}
              onSelectSource={setSelectedSource}
              onSelectDestination={setSelectedDestination}
              onToggleAccessibleOnly={setAccessibleOnly}
              onCalculateRoute={handleCalculateRoute}
              onStartNavigation={handleStartNavigation}
              onPauseNavigation={handlePauseNavigation}
              onResumeNavigation={handleResumeNavigation}
              onConfirmWaypointArrival={handleConfirmWaypointArrival}
              onRepeatInstruction={handleRepeatInstruction}
              onResetRoute={handleResetRoute}
              onToggleObstacle={handleToggleObstacle}
            />

            <CampusMapCanvas
              nodes={campusNodes}
              edges={campusEdges}
              selectedSource={selectedSource}
              selectedDestination={selectedDestination}
              activePath={routeData?.path || []}
              currentConfirmedNodeId={currentConfirmedNodeId}
              nextTargetNodeId={nextTargetNodeId}
              contrastMode={settings.contrastMode}
              onSelectNode={(id) => {
                if (isNavigating) return;
                if (!selectedSource || (selectedSource && selectedDestination)) {
                  setSelectedSource(id);
                  setSelectedDestination('');
                } else {
                  setSelectedDestination(id);
                }
              }}
            />
          </div>

          {/* Tab 3: Settings & Preferences */}
          <div
            style={{
              display: activeTab === 'settings' ? 'flex' : 'none',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <SettingsPanel
              settings={settings}
              contrastMode={settings.contrastMode}
              onUpdateSettings={(newOpts) => setSettings((p) => ({ ...p, ...newOpts }))}
              onTestVoice={speech.speakTest}
            />
          </div>
        </main>
      </div>

      {/* Accessible Footer with Status Info */}
      <footer
        style={{
          padding: '8px 20px',
          backgroundColor: isHighContrast ? '#000000' : '#0b1329',
          borderTop: isHighContrast ? '1px solid #facc15' : '1px solid #1e293b',
          fontSize: '0.75rem',
          color: isHighContrast ? '#facc15' : '#64748b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <span>
          PathSight AI — College Hackathon PS-15 · Built with React 19, TypeScript, and FastAPI
        </span>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>Alt+1: Assist</span>
          <span>Alt+2: Navigate</span>
          <span>Alt+3: Settings</span>
          <span>Space: Toggle Vision</span>
          <span>M: Mute</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
