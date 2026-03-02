import { useState, /*useRef,*/ useCallback } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import toast, { Toaster } from 'react-hot-toast';

function BarCode() {
  const [currentData, setCurrentData] = useState<string>('No result');
  const [scanHistory, setScanHistory] = useState<string[]>([]);

//   // Stable audio instance
//   const beepRef = useRef<HTMLAudioElement | null>(null);
//   if (!beepRef.current) {
//     beepRef.current = new Audio('/beep.mp3');
//   }

  const handleScan = useCallback((results: { rawValue: string }[]) => {
    if (!results || results.length === 0) return;
    
    const value = results[0].rawValue;
    setCurrentData(value);
    setScanHistory(prev => [...prev, value]);

    // beepRef.current?.play().catch(() => {});

    console.log('Scanned:', value);

    // toast.success(`Product scanned: ${value}`);
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error(error.message);
  }, []);

  return (
    <div className="box">
      <Toaster position="top-right" />

      <div className="title">Scanner</div>

      <div className="scan">
        <Scanner
          onScan={handleScan}
          onError={(error) => handleError(error as Error)}
          constraints={{ facingMode: 'environment' }}
          styles={{
            container: { width: 200, height: 200 },
            video: { width: '100%', height: '100%' }
          }}
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