import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

interface ListDialogProps {
  open: boolean;
  name: string;
  copyFromStandard: boolean;
  onNameChange: (name: string) => void;
  onCopyFromStandardChange: (copy: boolean) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function ListDialog({
  open,
  name,
  copyFromStandard,
  onNameChange,
  onCopyFromStandardChange,
  onSave,
  onCancel,
}: ListDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle data-testid="dialog-title">{t('newShoppingList')}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          label="List Name"
          data-testid="list-name-input"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && onSave()}
          sx={{ mb: 2 }}
        />
        <FormControlLabel
          control={
            <Checkbox
              data-testid="copy-from-standard-checkbox"
              checked={copyFromStandard}
              onChange={(e) => onCopyFromStandardChange(e.target.checked)}
            />
          }
          label={t('copyFromStandard')}
        />
      </DialogContent>
      <DialogActions>
        <Button data-testid="cancel-button" onClick={onCancel}>
          {t('cancel')}
        </Button>
        <Button data-testid="create-button" onClick={onSave} variant="contained">
          {t('create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
