import { useEffect, useState } from 'react';
import { getDeviceInfo, lookupProduct } from '../meat';
import { Button, Dialog, DialogContent, IconButton } from '@mui/material';
import BarcodeReaderIcon from '@mui/icons-material/BarcodeReader';
import CloseIcon from '@mui/icons-material/Close';
import BarCodeApp from './BarCode';

export function DeviceBanner() {
    const [device, setDevice] = useState({ isIOS: false, isAndroid: false });
    const [dialogOpen, setDialogOpen] = useState(false);

    async function handleScan(barcode: string) {
        const product = await lookupProduct(barcode);
        console.log(product);
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
            <Button onClick={() => setDialogOpen(true)} startIcon={<BarcodeReaderIcon />}></Button>

            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <IconButton
                    onClick={() => setDialogOpen(false)}
                    sx={{ position: 'absolute', right: 8, top: 8 }}
                >
                    <CloseIcon />
                </IconButton>
                <DialogContent>
                    <BarCodeApp />
                </DialogContent>
            </Dialog>
        </>;
    }
    return <div>Desktop or unsupported device</div>;
}


