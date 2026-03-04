import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  Button,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Avatar,
  Typography,
} from '@mui/material';
import { Delete, MoveToInbox, PhotoCamera } from '@mui/icons-material';
import { LOCATIONS, CURRENCIES, CurrencyCode } from '../meat';
import type { ShoppingItem, InventoryItem, Category } from '../context/AppContext';
import { getCategoryName } from '../context/AppContext';
import { useTranslation } from 'react-i18next';

interface ItemFormProps {
  item?: ShoppingItem | InventoryItem | null;
  categories: Category[];
  onSave: (data: any) => void;
  onCancel?: () => void;
  onDelete?: () => void;
  onMoveToInventory?: () => void;
  isEdit?: boolean;
  showHomeQuantity?: boolean;
}

export default function ItemForm({
  item,
  categories,
  onSave,
  onCancel,
  onDelete,
  onMoveToInventory,
  isEdit,
  showHomeQuantity,
}: ItemFormProps) {
  const { t, i18n } = useTranslation();
  const invItem = item as InventoryItem | undefined;
  const [formData, setFormData] = useState({
    name: item?.name || '',
    category: item?.category || categories[0]?.name || '',
    quantity: item?.quantity || 1,
    cost: item?.cost || 0,
    description: item?.description || '',
    barcode: item?.barcode || '',
    nutritionalInfo: item?.nutritionalInfo || '',
    weightSize: item?.weightSize || '',
    bestByDate: item?.bestByDate || '',
    location: invItem?.location || 'Fridge',
    homeQuantity: invItem?.homeQuantity || 1,
    image: item?.image || '',
    ingredients: (item as any)?.ingredients || '',
    allergens: (item as any)?.allergens || '',
    labels: (item as any)?.labels || '',
    country: (item as any)?.country || '',
    nutriscore: (item as any)?.nutriscore || '',
  });

  const [capturedImage, setCapturedImage] = useState<string>(item?.image || '');
  const [showCamera, setShowCamera] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [cropArea, setCropArea] = useState({ x: 20, y: 20, width: 150, height: 150 });
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const scannedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      setShowCamera(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
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
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setIsDragging(true);
      setDragStart({ x, y });
      setCropArea({ x, y, width: 0, height: 0 });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    
    const newX = Math.min(x, dragStart.x);
    const newY = Math.min(y, dragStart.y);
    
    setCropArea({
      x: newX,
      y: newY,
      width: Math.abs(x - dragStart.x),
      height: Math.abs(y - dragStart.y)
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  useEffect(() => {
    if (showCamera && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [showCamera, stream]);

  const handleChange = (field: string) => (e: any) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleSubmit = () => {
    onSave({
      ...formData,
      image: capturedImage || formData.image,
      quantity: parseInt(String(formData.quantity)) || 1,
      cost: parseFloat(String(formData.cost)) || 0,
      homeQuantity: showHomeQuantity ? (parseInt(String(formData.homeQuantity)) || 1) : formData.homeQuantity,
    });
  };

  const getCurrencySymbol = () => {
    const c = CURRENCIES.find(c => c.code === 'GBP');
    return c?.symbol || '£';
  };

  const displayImage = capturedImage || formData.image;

  if (showCamera) {
    return (
      <>
        <DialogContent>
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
        </DialogContent>
      </>
    );
  }

  if (showCropper) {
    return (
      <>
        <DialogContent>
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
                  userSelect: 'none',
                  pointerEvents: 'none'
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
        </DialogContent>
      </>
    );
  }

  return (
    <>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
            {displayImage ? (
              <Avatar src={displayImage} sx={{ width: 100, height: 100 }} variant="rounded" />
            ) : (
              <Box sx={{ width: 100, height: 100, bgcolor: '#f0f0f0', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PhotoCamera sx={{ color: '#999' }} />
              </Box>
            )}
          </Box>
          
          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<PhotoCamera />}
              onClick={startCamera}
              fullWidth
            >
              Take Photo
            </Button>
            {displayImage && (
              <Button
                variant="outlined"
                onClick={() => setShowCropper(true)}
                fullWidth
              >
                Crop
              </Button>
            )}
          </Box>

          <TextField
            label="Item Name"
            value={formData.name}
            onChange={handleChange('name')}
            fullWidth
            required
          />
          <FormControl fullWidth>
            <InputLabel>{t('category')}</InputLabel>
            <Select value={formData.category || ''} onChange={handleChange('category')} label={t('category')}>
              {categories.map(cat => (
                <MenuItem key={cat.id} value={cat.name}>{getCategoryName(cat, i18n.language)}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Quantity"
              type="number"
              value={formData.quantity}
              onChange={handleChange('quantity')}
              fullWidth
              inputProps={{ min: 1 }}
            />
            <TextField
              label="Cost"
              type="number"
              value={formData.cost}
              onChange={handleChange('cost')}
              fullWidth
              InputProps={{ startAdornment: <InputAdornment position="start">{getCurrencySymbol()}</InputAdornment> }}
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Box>
          {showHomeQuantity && (
            <TextField
              label="Quantity at Home"
              type="number"
              value={formData.homeQuantity}
              onChange={handleChange('homeQuantity')}
              fullWidth
              inputProps={{ min: 0 }}
            />
          )}
          <FormControl fullWidth>
            <InputLabel>Location</InputLabel>
            <Select value={formData.location || 'Fridge'} onChange={handleChange('location')} label="Location">
              {LOCATIONS.map(loc => (
                <MenuItem key={loc} value={loc}>{loc}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Best By Date"
            type="date"
            value={formData.bestByDate}
            onChange={handleChange('bestByDate')}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Description"
            value={formData.description}
            onChange={handleChange('description')}
            fullWidth
            multiline
            rows={2}
          />
          <TextField
            label="Barcode"
            value={formData.barcode}
            onChange={handleChange('barcode')}
            fullWidth
          />
          <TextField
            label="Weight/Size"
            value={formData.weightSize}
            onChange={handleChange('weightSize')}
            fullWidth
          />
          <TextField
            label="Nutritional Information"
            value={formData.nutritionalInfo}
            onChange={handleChange('nutritionalInfo')}
            fullWidth
            multiline
            rows={3}
          />
          <TextField
            label="Ingredients"
            value={formData.ingredients}
            onChange={handleChange('ingredients')}
            fullWidth
            multiline
            rows={2}
          />
          <TextField
            label="Allergens"
            value={formData.allergens}
            onChange={handleChange('allergens')}
            fullWidth
          />
          <TextField
            label="Labels"
            value={formData.labels}
            onChange={handleChange('labels')}
            fullWidth
          />
          <TextField
            label="Country"
            value={formData.country}
            onChange={handleChange('country')}
            fullWidth
          />
          <TextField
            label="Nutri-Score"
            value={formData.nutriscore}
            onChange={handleChange('nutriscore')}
            fullWidth
          />
          <TextField
            label="Image URL"
            value={formData.image}
            onChange={handleChange('image')}
            fullWidth
            placeholder="https://example.com/image.jpg"
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        {onDelete && (
          <Button onClick={() => setDeleteConfirmOpen(true)} color="error" sx={{ mr: 'auto' }}>{t('delete')}</Button>
        )}
        {onMoveToInventory && (
          <Button onClick={onMoveToInventory} startIcon={<MoveToInbox />}>{t('toInventory')}</Button>
        )}
        <Button onClick={onCancel}>{t('cancel')}</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!formData.name.trim()}>
          {t('save')}
        </Button>
      </DialogActions>

      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>{t('confirmDelete') || 'Confirm Delete'}</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete "{formData.name}"?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>{t('cancel')}</Button>
          <Button 
            onClick={() => { 
              onDelete?.(); 
              setDeleteConfirmOpen(false); 
              onCancel?.(); 
            }} 
            color="error" 
            variant="contained"
          >
            {t('delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
