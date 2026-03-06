import {
  Dialog,
  DialogTitle,
} from '@mui/material';
import ItemForm from '../ItemForm';
import type { ShoppingItem, Category } from '../../context/AppContext';

interface ItemDialogProps {
  open: boolean;
  mode: 'add' | 'edit';
  item: ShoppingItem | null;
  categories: Category[];
  onSave: (data: any) => void;
  onCancel: () => void;
  onDelete?: () => void;
  showHomeQuantity?: boolean;
}

export default function ItemDialog({
  open,
  mode,
  item,
  categories,
  onSave,
  onCancel,
  onDelete,
  showHomeQuantity,
}: ItemDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>
        {mode === 'add' ? 'Add Item' : 'Edit Item'}
      </DialogTitle>
      <ItemForm
        item={item}
        categories={categories}
        onSave={onSave}
        onCancel={onCancel}
        onDelete={onDelete}
        isEdit={mode === 'edit'}
        showHomeQuantity={showHomeQuantity}
      />
    </Dialog>
  );
}
