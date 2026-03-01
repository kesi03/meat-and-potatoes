import { useState } from 'react';
import {
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import { Delete, MoveToInbox } from '@mui/icons-material';
import { LOCATIONS, CURRENCIES, CurrencyCode } from '../meat';
import type { ShoppingItem, Category } from '../context/AppContext';
import { useTranslation } from 'react-i18next';

interface ItemFormProps {
  item?: ShoppingItem | null;
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
  const { t } = useTranslation();
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
    location: item?.location || 'Fridge',
    homeQuantity: item?.homeQuantity || 1,
  });

  const handleChange = (field: string) => (e: any) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleSubmit = () => {
    onSave({
      ...formData,
      quantity: parseInt(formData.quantity) || 1,
      cost: parseFloat(formData.cost) || 0,
      homeQuantity: showHomeQuantity ? (parseInt(formData.homeQuantity) || 1) : formData.homeQuantity,
    });
  };

  const getCurrencySymbol = () => {
    const c = CURRENCIES.find(c => c.code === 'GBP');
    return c?.symbol || '£';
  };

  return (
    <>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Item Name"
            value={formData.name}
            onChange={handleChange('name')}
            fullWidth
            required
          />
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select value={formData.category || ''} onChange={handleChange('category')} label="Category">
              {categories.map(cat => (
                <MenuItem key={cat.id} value={cat.name}>{cat.name}</MenuItem>
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
            rows={2}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        {onDelete && (
          <Button onClick={onDelete} color="error" sx={{ mr: 'auto' }}>{t('delete')}</Button>
        )}
        {onMoveToInventory && (
          <Button onClick={onMoveToInventory} startIcon={<MoveToInbox />}>{t('toInventory')}</Button>
        )}
        <Button onClick={onCancel}>{t('cancel')}</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!formData.name.trim()}>
          {t('save')}
        </Button>
      </DialogActions>
    </>
  );
}
