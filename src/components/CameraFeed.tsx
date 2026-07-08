import { useEffect, useRef } from 'react';
import './CameraFeed.css';

interface CameraFeedProps {
  isVisible: boolean;
  stream: MediaStream | null;
}

export function CameraFeed({ isVisible, stream }: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream && isVisible) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, isVisible]);

  if (!isVisible || !stream) {
    return null;
  }

  return (
    <div className="camera-feed-container">
      <video
        ref={videoRef}
        className="camera-feed-video"
        autoPlay
        playsInline
        muted
      />
      <div className="camera-feed-label">📷 Live Camera</div>
    </div>
  );
}
