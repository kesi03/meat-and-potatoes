import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';

interface SaveToInventoryDialogProps {
  open: boolean;
  itemCount: number;
  onSave: () => void;
  onCancel: () => void;
}

export default function SaveToInventoryDialog({
  open,
  itemCount,
  onSave,
  onCancel,
}: SaveToInventoryDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CheckCircle color="success" />
        All Items Picked!
      </DialogTitle>
      <DialogContent>
        <Alert severity="success" sx={{ mb: 2 }}>
          All {itemCount} items in this list have been picked!
        </Alert>
        <Typography>
          Would you like to save these items to your inventory?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Continue Shopping</Button>
        <Button onClick={onSave} variant="contained" color="success">
          Save to Inventory
        </Button>
      </DialogActions>
    </Dialog>
  );
}
