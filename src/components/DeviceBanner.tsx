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
    const [showCamera, setShowCamera] = useState(false);
    const [showCropper, setShowCropper] = useState(false);
    const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 100, height: 100 });
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
    const scannedRef = useRef(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setShowCamera(false);
    };

    const startCamera = async () => {
        console.log('Take photo button clicked');
        try {
            console.log('Requesting camera access...');
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            console.log('Camera stream obtained');
            setStream(mediaStream);
            setShowCamera(true);
        } catch (err) {
            console.error('Error accessing camera:', err);
            alert('Camera not available. Using file upload instead.');
            fileInputRef.current?.click();
        }
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
                setShowCropper(true);
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCapturedImage(reader.result as string);
                setShowCropper(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const applyCrop = () => {
        if (!imageRef.current || !containerRef.current) return;
        
        const img = imageRef.current;
        const container = containerRef.current;
        const scaleX = img.naturalWidth / container.clientWidth;
        const scaleY = img.naturalHeight / container.clientHeight;
        
        const canvas = document.createElement('canvas');
        canvas.width = cropArea.width * scaleX;
        canvas.height = cropArea.height * scaleY;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(
                img,
                cropArea.x * scaleX,
                cropArea.y * scaleY,
                cropArea.width * scaleX,
                cropArea.height * scaleY,
                0,
                0,
                canvas.width,
                canvas.height
            );
            setCapturedImage(canvas.toDataURL('image/jpeg'));
        }
        setShowCropper(false);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
            setIsDragging(true);
            setDragStart({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const newWidth = Math.max(50, Math.min(x - dragStart.x + cropArea.width, containerRef.current.clientWidth - cropArea.x));
        const newHeight = Math.max(50, Math.min(y - dragStart.y + cropArea.height, containerRef.current.clientHeight - cropArea.y));
        
        setCropArea(prev => ({
            ...prev,
            width: newWidth,
            height: newHeight
        }));
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (!dialogOpen) {
            setScannedProduct(null);
            setItemName('');
            setItemCategory('');
            setItemQuantity(1);
            setItemCost(0);
            setBestByDate('');
            setCapturedImage('');
            setShowCropper(false);
            scannedRef.current = false;
            stopCamera();
        }
    }, [dialogOpen]);

    useEffect(() => {
        if (showCamera && stream) {
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            }, 100);
        }
    }, [showCamera, stream]);

    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

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
                    ) : showCamera ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <video 
                                ref={videoRef} 
                                autoPlay 
                                playsInline
                                style={{ width: '100%', borderRadius: 8 }}
                            />
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button 
                                    variant="outlined" 
                                    onClick={stopCamera}
                                    fullWidth
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    variant="contained" 
                                    onClick={capturePhoto}
                                    fullWidth
                                >
                                    Capture
                                </Button>
                            </Box>
                        </Box>
                    ) : showCropper ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Typography variant="h6" textAlign="center">Crop Image</Typography>
                            <Box 
                                ref={containerRef}
                                sx={{ 
                                    position: 'relative', 
                                    width: '100%', 
                                    maxHeight: 300, 
                                    overflow: 'hidden',
                                    cursor: 'crosshair',
                                    borderRadius: 1,
                                    bgcolor: '#f0f0f0'
                                }}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                            >
                                <img
                                    ref={imageRef}
                                    src={capturedImage}
                                    alt="Crop"
                                    style={{ 
                                        width: '100%', 
                                        display: 'block',
                                        userSelect: 'none'
                                    }}
                                    onLoad={(e) => {
                                        const img = e.currentTarget;
                                        setImageSize({ width: img.clientWidth, height: img.clientHeight });
                                        setCropArea({ 
                                            x: 0, 
                                            y: 0, 
                                            width: img.clientWidth, 
                                            height: img.clientHeight 
                                        });
                                    }}
                                />
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        border: '2px dashed white',
                                        bgcolor: 'rgba(0,0,0,0.3)',
                                        left: cropArea.x,
                                        top: cropArea.y,
                                        width: cropArea.width,
                                        height: cropArea.height,
                                        pointerEvents: 'none'
                                    }}
                                />
                            </Box>
                            <Typography variant="caption" textAlign="center">
                                Drag to select area
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button 
                                    variant="outlined" 
                                    onClick={() => setShowCropper(false)}
                                    fullWidth
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    variant="contained" 
                                    onClick={applyCrop}
                                    fullWidth
                                >
                                    Apply Crop
                                </Button>
                            </Box>
                        </Box>
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
                                onClick={startCamera}
                                fullWidth
                            >
                                {capturedImage ? 'Change Photo' : 'Take Photo'}
                            </Button>
                            {capturedImage && (
                                <Button
                                    variant="outlined"
                                    onClick={() => setShowCropper(true)}
                                    fullWidth
                                >
                                    Crop Image
                                </Button>
                            )}
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
                    {scannedProduct !== null && !showCamera && (
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
