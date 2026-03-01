import { useEffect, useRef, useState } from 'react';

type Props = {
  onDetected: (value: string) => void;
};

declare class BarcodeDetector {
  constructor(options?: { formats?: string[] });
  detect(image: ImageBitmapSource): Promise<Array<{ rawValue: string }>>;
}

export function BarcodeScanner({ onDetected }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    let detector: BarcodeDetector | null = null;
    let animationFrame: number;

    async function start() {
      const supported = 'BarcodeDetector' in window;

      if (supported) {
        detector = new BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'qr_code']
        });
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      async function tick() {
        if (detector && videoRef.current) {
          const results = await detector.detect(videoRef.current);
          if (results.length > 0) {
            onDetected(results[0].rawValue);
            stop();
            return;
          }
        }
        animationFrame = requestAnimationFrame(tick);
      }

      tick();
    }

    function stop() {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      cancelAnimationFrame(animationFrame);
    }

    start();

    return () => stop();
  }, [onDetected]);

  return (
    <video
      ref={videoRef}
      style={{ width: '100%', height: 'auto' }}
      playsInline
      muted
    />
  );
}