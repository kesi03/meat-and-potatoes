import { useEffect, useState, useRef } from 'react';
import { getDeviceInfo, lookupProduct, generateId, CurrencyCode, getCurrencyByCode } from '../meat';
import { Button, Dialog, DialogContent, DialogActions, Box, Typography, Avatar, TextField, FormControl, InputLabel, Select, MenuItem, InputAdornment, IconButton } from '@mui/material';
import BarcodeReaderIcon from '@mui/icons-material/BarcodeReader';
import CloseIcon from '@mui/icons-material/Close';
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
    const scannedRef = useRef(false);

    useEffect(() => {
        if (!dialogOpen) {
            setScannedProduct(null);
            setItemName('');
            setItemCategory('');
            setItemQuantity(1);
            setItemCost(0);
            setBestByDate('');
            scannedRef.current = false;
        }
    }, [dialogOpen]);

    const handleProductFound = (product: ScannedProduct) => {
        setScannedProduct(product);
        setItemName(product.name || '');
        setItemCategory(product.categories?.split(',')[0]?.trim() || '');
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
            image: scannedProduct?.image || '',
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
                        <BarCodeApp 
                            onProductFound={handleProductFound} 
                            autoStop={true}
                            scannedRef={scannedRef}
                        />
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                            {scannedProduct.image && (
                                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                    <Avatar src={scannedProduct.image} sx={{ width: 100, height: 100 }} />
                                </Box>
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
                    {scannedProduct && (
                        <Button onClick={handleSave} variant="contained">
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

