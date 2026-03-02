import { useEffect, useState } from 'react';
import { getDeviceInfo, lookupProduct } from '../meat';
import { BarcodeScanner } from './BarCodeScanner';
import { Button } from '@mui/material';
import BarcodeReaderIcon from '@mui/icons-material/BarcodeReader';

export function DeviceBanner() {
    const [device, setDevice] = useState({ isIOS: false, isAndroid: false });
    async function handleScan(barcode: string) {
        const product = await lookupProduct(barcode);
        console.log(product);
    }

    const [active, setActive] = useState(false);

    async function startScanner() {
        setActive(true);
    }

    async function onDetected(code: string) {
        console.log('Scanned:', code);
        alert(`Scanned: ${code}`);
        await handleScan(code);
    }


    useEffect(() => {
        setDevice(getDeviceInfo());
    }, []);

    if (device.isIOS || device.isAndroid) {
        return <>
            {!active && (
                <Button onClick={() => setActive(true)} startIcon={<BarcodeReaderIcon />}></Button>
            )}

            {active && <BarcodeScanner onDetected={onDetected} />}
        </>;
    }
    return <div>Desktop or unsupported device</div>;
}


