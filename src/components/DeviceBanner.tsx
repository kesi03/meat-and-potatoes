import { useEffect, useState, useRef } from 'react';
import { getDeviceInfo, lookupProduct, generateId, CurrencyCode, getCurrencyByCode } from '../meat';
import { Button, Dialog, DialogContent, DialogActions, Box, Typography, Avatar, TextField, FormControl, InputLabel, Select, MenuItem, InputAdornment, IconButton } from '@mui/material';
import BarcodeReaderIcon from '@mui/icons-material/BarcodeReader';
import CloseIcon from '@mui/icons-material/Close';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import BarCodeApp from './BarCode';
import type { ShoppingItem, Category } from '../context/AppContext';

interface ScannedProduct {
    name: string;
    brand?: string;
    image?: string;
    quantity?: string;
    categories?: string;
    barcode: string;
}

interface DeviceBannerProps {
    listId: string;
    addItemToList: (listId: string, item: Omit<ShoppingItem, 'id'>) => void;
    categories: Category[];
    currency: CurrencyCode;
    forceShow?: boolean;
}

export function DeviceBanner({ listId, addItemToList, categories, currency, forceShow = false }: DeviceBannerProps) {
    const currencySymbol = getCurrencyByCode(currency)?.symbol || '$';
    const device = getDeviceInfo();
    const showScanner = forceShow || device.isIOS || device.isAndroid;
    const [dialogOpen, setDialogOpen] = useState(false);
    const [scannedProduct, setScannedProduct] = useState<ScannedProduct | null>(null);
    const [itemName, setItemName] = useState('');
    const [itemCategory, setItemCategory] = useState('');
    const [itemQuantity, setItemQuantity] = useState(1);
    const [itemCost, setItemCost] = useState(0);
    const [bestByDate, setBestByDate] = useState('');
    const [capturedImage, setCapturedImage] = useState<string>('');
    const scannedRef = useRef(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!dialogOpen) {
            setScannedProduct(null);
            setItemName('');
            setItemCategory('');
            setItemQuantity(1);
            setItemCost(0);
            setBestByDate('');
            setCapturedImage('');
            scannedRef.current = false;
        }
    }, [dialogOpen]);

    const videoRef = useRef<HTMLVideoElement>(null);
    const [showCamera, setShowCamera] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            setStream(mediaStream);
            setShowCamera(true);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error('Error accessing camera:', err);
            fileInputRef.current?.click();
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setShowCamera(false);
    };

    const capturePhoto = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0);
                const dataUrl = canvas.toDataURL('image/jpeg');
                setCapturedImage(dataUrl);
                stopCamera();
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCapturedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleProductFound = (product: ScannedProduct) => {
        setScannedProduct(product);
        setItemName(product.name || '');
        setItemCategory(product.categories?.split(',')[0]?.trim() || '');
        setItemQuantity(1);
        setItemCost(0);
        scannedRef.current = true;
    };

    const handleProductNotFound = (barcode: string) => {
        setScannedProduct({ name: '', barcode });
        setItemName('');
        setItemCategory('');
        setItemQuantity(1);
        setItemCost(0);
        scannedRef.current = true;
    };

    const handleSave = () => {
        if (!itemName.trim()) return;

        const newItem: Omit<ShoppingItem, 'id'> = {
            name: itemName,
            category: itemCategory || 'Uncategorized',
            quantity: itemQuantity,
            cost: itemCost,
            description: scannedProduct?.brand || '',
            barcode: scannedProduct?.barcode || '',
            nutritionalInfo: '',
            weightSize: scannedProduct?.quantity || '',
            bestByDate: bestByDate || null,
            image: capturedImage || scannedProduct?.image || '',
        };

        addItemToList(listId, newItem);
        setDialogOpen(false);
    };

    if (showScanner) {
        return (
            <>
                <IconButton onClick={() => setDialogOpen(true)} sx={{ color: 'white' }}>
                    <BarcodeReaderIcon />
                </IconButton>

                <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogContent>
                    {!scannedProduct ? (
                        <>
                            <BarCodeApp 
                                onProductFound={handleProductFound} 
                                onProductNotFound={handleProductNotFound}
                                autoStop={true}
                                scannedRef={scannedRef}
                            />
                            <Button 
                                variant="outlined" 
                                onClick={() => handleProductNotFound('')}
                                fullWidth
                                sx={{ mt: 2 }}
                            >
                                Enter Manually
                            </Button>
                        </>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                                {capturedImage ? (
                                    <Avatar src={capturedImage} sx={{ width: 100, height: 100 }} />
                                ) : scannedProduct?.image ? (
                                    <Avatar src={scannedProduct.image} sx={{ width: 100, height: 100 }} />
                                ) : null}
                            </Box>
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                            />
                            <Button
                                variant="outlined"
                                startIcon={<PhotoCameraIcon />}
                                onClick={handleTakePhoto}
                                fullWidth
                            >
                                {capturedImage ? 'Retake Photo' : 'Take Photo'}
                            </Button>
                            <Typography variant="h6" textAlign="center">{scannedProduct.name}</Typography>
                            {scannedProduct.brand && <Typography variant="body2" color="text.secondary" textAlign="center">{scannedProduct.brand}</Typography>}
                            {scannedProduct.quantity && <Typography variant="body2" color="text.secondary" textAlign="center">{scannedProduct.quantity}</Typography>}
                            
                            <TextField
                                label="Name"
                                value={itemName}
                                onChange={(e) => setItemName(e.target.value)}
                                fullWidth
                            />
                            <FormControl fullWidth>
                                <InputLabel>Category</InputLabel>
                                <Select
                                    value={itemCategory}
                                    label="Category"
                                    onChange={(e) => setItemCategory(e.target.value)}
                                >
                                    {categories.map((cat) => (
                                        <MenuItem key={cat.id} value={cat.name}>
                                            {cat.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <TextField
                                label="Quantity"
                                type="number"
                                value={itemQuantity}
                                onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                                fullWidth
                            />
                            <TextField
                                label="Cost"
                                type="number"
                                value={itemCost}
                                onChange={(e) => setItemCost(parseFloat(e.target.value) || 0)}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment>,
                                }}
                                fullWidth
                            />
                            <TextField
                                label="Best Before"
                                type="date"
                                value={bestByDate}
                                onChange={(e) => setBestByDate(e.target.value)}
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)} startIcon={<CloseIcon />}>
                        Close
                    </Button>
                    {scannedProduct !== null && (
                        <Button onClick={handleSave} variant="contained" disabled={!itemName.trim()}>
                            Save
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </>
    );
    }
    return <div></div>;
}

