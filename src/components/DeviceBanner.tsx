import { useEffect, useState } from 'react';
import { getDeviceInfo, lookupProduct } from '../meat';
import { BarcodeScanner } from './BarCodeScanner';

export function DeviceBanner() {
    const [device, setDevice] = useState({ isIOS: false, isAndroid: false });
    async function handleScan(barcode: string) {
        const product = await lookupProduct(barcode);
        console.log(product);
    }



    useEffect(() => {
        setDevice(getDeviceInfo());
    }, []);

    if (device.isIOS) {
        return <div><BarcodeScanner onDetected={(code) => { console.log('Scanned:', code); alert(`Scanned: ${code}`); handleScan(code); }} /></div>;
    }

    if (device.isAndroid) {
        return <div><BarcodeScanner onDetected={(code) => { console.log('Scanned:', code); alert(`Scanned: ${code}`); handleScan(code); }} /></div>;
    }

    return <div>Desktop or unsupported device</div>;
}


