import { useState, /*useRef,*/ useCallback } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import toast, { Toaster } from 'react-hot-toast';
import { lookupProduct } from '../meat';

interface ProductInfo {
  name: string;
  brand: string;
  image: string;
  quantity: string;
  categories: string;
}

function BarCode() {
  const [currentData, setCurrentData] = useState<string>('No result');
  const [scanHistory, setScanHistory] = useState<string[]>([]);
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);

//   // Stable audio instance
//   const beepRef = useRef<HTMLAudioElement | null>(null);
//   if (!beepRef.current) {
//     beepRef.current = new Audio('/beep.mp3');
//   }

  const handleScan = useCallback(async (results: { rawValue: string }[]) => {
    if (!results || results.length === 0) return;
    
    const value = results[0].rawValue;
    setCurrentData(value);
    setScanHistory(prev => [...prev, value]);

    console.log('Scanned:', value);

    const product = await lookupProduct(value);
    if (product) {
      setProductInfo(product);
      toast.success(`Found: ${product.name}`);
    } else {
      setProductInfo(null);
      toast.error('Product not found');
    }
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

      {productInfo && (
        <div className="product-info">
          {productInfo.image && (
            <img src={productInfo.image} alt={productInfo.name} />
          )}
          <p><strong>Name:</strong> {productInfo.name}</p>
          {productInfo.brand && <p><strong>Brand:</strong> {productInfo.brand}</p>}
          {productInfo.quantity && <p><strong>Quantity:</strong> {productInfo.quantity}</p>}
          {productInfo.categories && <p><strong>Categories:</strong> {productInfo.categories}</p>}
        </div>
      )}

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