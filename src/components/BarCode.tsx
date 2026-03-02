import { useState, useRef, useCallback } from 'react';
import BarcodeScannerComponent from 'react-qr-barcode-scanner';
import toast, { Toaster } from 'react-hot-toast';

import './App.css';

function BarCode() {
  const [currentData, setCurrentData] = useState<string>('No result');
  const [scanHistory, setScanHistory] = useState<string[]>([]);

  // Stable audio instance
//   const beepRef = useRef<HTMLAudioElement | null>(null);
//   if (!beepRef.current) {
//     beepRef.current = new Audio('/beep.mp3');
//   }

  // Accept the library's private type as unknown
  const handleScan = useCallback(
    (err: unknown, result?: unknown) => {
      // Runtime narrowing because the library hides its type
      const r = result as { text?: string } | undefined;

      if (r?.text) {
        const text = r.text;

        setCurrentData(text);
        setScanHistory(prev => [...prev, text]);

        //beepRef.current?.play().catch(() => {});

        toast.success(`Product scanned: ${text}`);
      }
    },
    []
  );

  return (
    <div className="box">
      <Toaster position="top-right" reverseOrder={false} />

      <div className="title">Scanner</div>

      <div className="scan">
        <BarcodeScannerComponent
          width={500}
          height={500}
          onUpdate={handleScan}
          delay={1500}
        />
      </div>

      <p>Scanned Data: {currentData}</p>

      <h2>Scan History</h2>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Scanned Result</th>
          </tr>
        </thead>
        <tbody>
          {scanHistory.map((result, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{result}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default BarCode;