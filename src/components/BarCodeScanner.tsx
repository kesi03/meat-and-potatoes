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
  const [started, setStarted] = useState(false);

  async function startScanner() {
    if (started) return;
    setStarted(true);

    let detector: BarcodeDetector | null = null;
    let animationFrame: number;

    const supported = "BarcodeDetector" in window;

    if (supported) {
      detector = new BarcodeDetector({
        formats: [
          "ean_13",
          "ean_8",
          "upc_a",
          "upc_e",
          "code_128",
          "code_39",
          "qr_code",
          "itf",
          "codabar",
          "data_matrix"
        ]
      });
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      async function tick() {
        if (detector && videoRef.current) {
          try {
            const results = await detector.detect(videoRef.current);
            if (results.length > 0) {
              onDetected(results[0].rawValue);
              stopScanner();
              return;
            }
          } catch (err) {
            console.error("Barcode detection error:", err);
          }
        }

        animationFrame = requestAnimationFrame(tick);
      }

      tick();
    } catch (err) {
      console.error("Camera error:", err);
    }

    function stopScanner() {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      cancelAnimationFrame(animationFrame);
    }

    return () => stopScanner();
  }

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [stream]);

  return (
    <div style={{ width: "100%", textAlign: "center" }}>
      {!started && (
        <button
          onClick={startScanner}
          style={{
            padding: "12px 20px",
            fontSize: "16px",
            marginBottom: "12px"
          }}
        >
          Start Scanning
        </button>
      )}

      <video
        ref={videoRef}
        style={{
          width: "100%",
          height: "auto",
          objectFit: "cover",
          borderRadius: "8px"
        }}
        playsInline
        muted
        autoPlay
      />
    </div>
  );
}