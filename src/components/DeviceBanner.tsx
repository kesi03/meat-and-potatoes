import { useEffect, useState } from 'react';
import { getDeviceInfo } from '../meat';
import { BarcodeScanner } from './BarCodeScanner';

export function DeviceBanner() {
  const [device, setDevice] = useState({ isIOS: false, isAndroid: false });

  useEffect(() => {
    setDevice(getDeviceInfo());
  }, []);

  if (device.isIOS) {
    return <div><BarcodeScanner onDetected={(code) => { console.log('Scanned:', code); alert(`Scanned: ${code}`); }} /></div>;
  }

  if (device.isAndroid) {
    return <div><BarcodeScanner onDetected={(code) => { console.log('Scanned:', code); alert(`Scanned: ${code}`); }} /></div>;
  }

  return <div>Desktop or unsupported device</div>;
}