import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";

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

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    let detector: BarcodeDetector | null = null;
    let animationFrame: number;

    if (!isIOS && "BarcodeDetector" in window) {
      detector = new BarcodeDetector({
        formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "qr_code"]
      });
    }

    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    });

    setStream(mediaStream);

    if (videoRef.current) {
      videoRef.current.srcObject = mediaStream;
      // Only call play() once
      videoRef.current.play().catch(() => {});
    }

    // iPhone → use ZXing
    if (isIOS) {
      const reader = new BrowserMultiFormatReader();
      reader.decodeFromVideoDevice(null, videoRef.current!, (result) => {
        if (result) {
          onDetected(result.getText());
          reader.reset();
          stopScanner();
        }
      });
      return;
    }

    // Android → use BarcodeDetector
    async function tick() {
      if (detector && videoRef.current) {
        const results = await detector.detect(videoRef.current);
        if (results.length > 0) {
          onDetected(results[0].rawValue);
          stopScanner();
          return;
        }
      }
      animationFrame = requestAnimationFrame(tick);
    }

    tick();

    function stopScanner() {
      if (stream) stream.getTracks().forEach(t => t.stop());
      cancelAnimationFrame(animationFrame);
    }
  }

  return (
    <div>
      {!started && (
        <button onClick={startScanner}>Start scanning</button>
      )}

      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        style={{ width: "100%", height: "auto", objectFit: "cover" }}
      />
    </div>
  );
}