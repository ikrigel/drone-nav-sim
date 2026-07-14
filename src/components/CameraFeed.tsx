import { useEffect, useRef } from 'react';
import './CameraFeed.css';

interface CameraFeedProps {
  isVisible: boolean;
  stream: MediaStream | null;
  sizeMode: 'small' | 'fullscreen';
  onToggleSize: () => void;
}

export function CameraFeed({ isVisible, stream, sizeMode, onToggleSize }: CameraFeedProps) {
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
    <div className={`camera-feed-container ${sizeMode === 'fullscreen' ? 'fullscreen' : ''}`}>
      <video
        ref={videoRef}
        className="camera-feed-video"
        autoPlay
        playsInline
        muted
      />
      <div className="camera-feed-label">📷 Live Camera</div>
      <button
        className="camera-feed-size-toggle"
        onClick={onToggleSize}
        title={sizeMode === 'fullscreen' ? 'Shrink camera view' : 'Expand camera view'}
      >
        {sizeMode === 'fullscreen' ? '⤡' : '⤢'}
      </button>
    </div>
  );
}
