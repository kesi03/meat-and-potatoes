import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

interface ConfirmDeleteDialogProps {
  open: boolean;
  itemName?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDeleteDialog({
  open,
  itemName,
  onConfirm,
  onCancel,
}: ConfirmDeleteDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>{t('confirmDelete') || 'Confirm Delete'}</DialogTitle>
      <DialogContent>
        <Typography>
          {t('confirmDeleteMessage', {
            defaultValue: 'Are you sure you want to delete "{{name}}"?',
            name: itemName,
          })}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{t('cancel')}</Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          {t('delete')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
