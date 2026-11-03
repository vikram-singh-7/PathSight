import { useState, useRef, useCallback, useEffect } from 'react';

export type CameraStatus = 'idle' | 'requesting' | 'active' | 'denied' | 'error';
export type FacingMode = 'environment' | 'user';

export function useCamera() {
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<FacingMode>('environment');
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Enumerate connected video input devices (webcams, mobile front/back, phone cams)
  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return;
    }
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = allDevices.filter((d) => d.kind === 'videoinput');
      setVideoDevices(videoInputs);
    } catch {
      // Permission not granted yet or enumeration unavailable
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus('idle');
  }, []);

  const startStreamWithConstraints = useCallback(
    async (targetDeviceId: string | null, targetFacing: FacingMode) => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setStatus('error');
        setErrorMessage('Camera access is not supported by this browser environment.');
        return null;
      }

      // Stop existing tracks before opening new camera
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      const constraints: MediaStreamConstraints = {
        video: targetDeviceId
          ? {
              deviceId: { exact: targetDeviceId },
              width: { ideal: 640 },
              height: { ideal: 480 },
            }
          : {
              facingMode: { ideal: targetFacing },
              width: { ideal: 640 },
              height: { ideal: 480 },
            },
        audio: false,
      };

      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch {
          // Fallback to basic video constraint if ideal facingMode/deviceId fails
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch {
            // Play request interrupted or browser waiting for interaction
          }
        }

        setStatus('active');
        setErrorMessage(null);

        // Re-enumerate to get device labels now that permission has been granted
        refreshDevices();
        return stream;
      } catch (err: unknown) {
        if (
          err instanceof DOMException &&
          (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')
        ) {
          setStatus('denied');
          setErrorMessage('Camera permission was denied. Please allow camera access in browser settings.');
        } else {
          setStatus('error');
          setErrorMessage(
            err instanceof Error ? err.message : 'Unable to connect to camera device.'
          );
        }
        return null;
      }
    },
    [refreshDevices]
  );

  const startCamera = useCallback(async () => {
    if (streamRef.current && status === 'active') {
      return;
    }
    setStatus('requesting');
    setErrorMessage(null);
    await startStreamWithConstraints(selectedDeviceId, facingMode);
  }, [facingMode, selectedDeviceId, startStreamWithConstraints, status]);

  // Toggle between Rear Camera (Environment / World) and Front Camera (Selfie / User)
  const toggleFacingMode = useCallback(async () => {
    const nextFacing: FacingMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    setSelectedDeviceId(null); // clear fixed deviceId to respect facingMode

    // If camera is currently active, seamlessly switch live stream
    if (status === 'active' || streamRef.current) {
      await startStreamWithConstraints(null, nextFacing);
    }
  }, [facingMode, startStreamWithConstraints, status]);

  // Select a specific camera device from list (e.g. mobile back, front, USB, or virtual cam)
  const selectCamera = useCallback(
    async (deviceId: string) => {
      setSelectedDeviceId(deviceId);
      if (status === 'active' || streamRef.current) {
        await startStreamWithConstraints(deviceId, facingMode);
      }
    },
    [facingMode, startStreamWithConstraints, status]
  );

  // Keep video element synchronized if component remounts or tab switches
  useEffect(() => {
    if (videoRef.current && streamRef.current && status === 'active') {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => {});
      }
    }
  });

  // Initial device query and listener for hardware changes (USB cameras, phone plugged in)
  useEffect(() => {
    let isMounted = true;
    const fetchInputs = async () => {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (isMounted) {
          setVideoDevices(devices.filter((d) => d.kind === 'videoinput'));
        }
      } catch {
        // Ignored if permissions not granted yet
      }
    };

    fetchInputs();
    navigator.mediaDevices?.addEventListener('devicechange', fetchInputs);
    return () => {
      isMounted = false;
      navigator.mediaDevices?.removeEventListener('devicechange', fetchInputs);
    };
  }, []);

  // Capture current video frame as downscaled JPEG data URL for YOLO inference
  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || status !== 'active' || video.readyState < 2) {
      return null;
    }

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }

    const canvas = canvasRef.current;
    // Scale down to 480x360 for fast transmission and inference
    canvas.width = 480;
    canvas.height = 360;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    // Return compressed JPEG data URL
    return canvas.toDataURL('image/jpeg', 0.65);
  }, [status]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    videoRef,
    status,
    errorMessage,
    facingMode,
    videoDevices,
    selectedDeviceId,
    startCamera,
    stopCamera,
    toggleFacingMode,
    selectCamera,
    refreshDevices,
    captureFrame,
  };
}
