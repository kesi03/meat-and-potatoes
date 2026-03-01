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

    let detector: BarcodeDetector | null = null;
    let animationFrame: number;
    let zxingReader: BrowserMultiFormatReader | null = null;
    let usingZXing = false;

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
          "itf",
          "codabar",
          "qr_code"
        ]
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
      await videoRef.current.play();
    }

    await new Promise(r => setTimeout(r, 600)); // autofocus

    async function tick() {
      if (!usingZXing && detector && videoRef.current) {
        try {
          const results = await detector.detect(videoRef.current);
          if (results.length > 0) {
            onDetected(results[0].rawValue);
            stopScanner();
            return;
          }
        } catch (err) {
          console.error("Detector error:", err);
        }
      }

      animationFrame = requestAnimationFrame(tick);
    }

    tick();

    setTimeout(() => {
      if (!usingZXing) {
        usingZXing = true;
        zxingReader = new BrowserMultiFormatReader();
        zxingReader.decodeFromVideoDevice(
          null,
          videoRef.current!,
          (result, err) => {
            if (result) {
              onDetected(result.getText());
              stopScanner();
            }
          }
        );
      }
    }, 2000);

    function stopScanner() {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      cancelAnimationFrame(animationFrame);
      if (zxingReader) zxingReader.reset();
    }

    return () => stopScanner();
  }

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [stream]);

  return (
    <div style={{ width: "100%", textAlign: "center" }}>
      {!started && (
        <button
          onClick={startScanner}
          style={{ padding: "12px 20px", fontSize: "16px", marginBottom: "12px" }}
        >
          Start Scanning
        </button>
      )}

      <video
        ref={videoRef}
        style={{
          width: "100%",
          height: "100%",
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