import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { AutoFixHigh } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import type { Category } from '../../context/AppContext';

export const translateText = async (text: string, targetLang: string): Promise<string> => {
  if (!text || targetLang === 'en') return text;
  
  try {
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.responseData && data.responseData.translatedText) {
        return data.responseData.translatedText;
      }
    }
  } catch (error) {
    console.error('Translation error:', error);
  }
  return text;
};

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'cy', name: 'Welsh' },
  { code: 'gd', name: 'Scottish Gaelic' },
  { code: 'sv', name: 'Swedish' },
  { code: 'fi', name: 'Finnish' },
  { code: 'ga', name: 'Irish Gaelic' },
  { code: 'da', name: 'Danish' },
  { code: 'no', name: 'Norwegian' },
  { code: 'fo', name: 'Faroese' },
  { code: 'is', name: 'Icelandic' },
  { code: 'gv', name: 'Manx' },
  { code: 'kw', name: 'Cornish' },
  { code: 'se', name: 'Sami' },
  { code: 'kl', name: 'Greenland (Kalaallisut)' }
];

export interface CategoryDialogState {
  open: boolean;
  mode: 'add' | 'edit';
  category: Category | null;
  name: string;
  description: string;
  translations: Record<string, { name?: string; description?: string }>;
  editLanguage: string;
}

interface CategoryDialogProps {
  state: CategoryDialogState;
  onStateChange: (state: CategoryDialogState) => void;
  onSave: () => void;
  onAutoTranslate: () => void;
  isTranslating: boolean;
}

export function getInitialCategoryDialogState(): CategoryDialogState {
  return {
    open: false,
    mode: 'add',
    category: null,
    name: '',
    description: '',
    translations: {},
    editLanguage: 'en',
  };
}

export default function CategoryDialog({
  state,
  onStateChange,
  onSave,
  onAutoTranslate,
  isTranslating,
}: CategoryDialogProps) {
  const { t } = useTranslation();

  const handleClose = () => {
    onStateChange(getInitialCategoryDialogState());
  };

  return (
    <Dialog open={state.open} onClose={handleClose}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {state.mode === 'add' ? t('addCategory') : t('editCategory')}
        <Button
          startIcon={<AutoFixHigh />}
          onClick={onAutoTranslate}
          disabled={isTranslating || !state.name.trim()}
          size="small"
        >
          {isTranslating ? 'Translating...' : 'Auto-translate'}
        </Button>
      </DialogTitle>
      <DialogContent>
        <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
          <InputLabel>Language</InputLabel>
          <Select
            value={state.editLanguage || 'en'}
            label="Language"
            onChange={(e) => onStateChange({ ...state, editLanguage: e.target.value })}
            data-testid="category-language-select"
          >
            {LANGUAGES.map((lang) => (
              <MenuItem key={lang.code} value={lang.code}>
                {lang.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          autoFocus
          fullWidth
          label={t('categoryName')}
          data-testid="category-name-input"
          value={
            state.editLanguage === 'en'
              ? state.name
              : state.translations[state.editLanguage]?.name || ''
          }
          onChange={(e) => {
            if (state.editLanguage === 'en') {
              onStateChange({ ...state, name: e.target.value });
            } else {
              onStateChange({
                ...state,
                translations: {
                  ...state.translations,
                  [state.editLanguage]: {
                    ...state.translations[state.editLanguage],
                    name: e.target.value,
                  },
                },
              });
            }
          }}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label={t('description')}
          data-testid="category-description-input"
          value={
            state.editLanguage === 'en'
              ? state.description
              : state.translations[state.editLanguage]?.description || ''
          }
          onChange={(e) => {
            if (state.editLanguage === 'en') {
              onStateChange({ ...state, description: e.target.value });
            } else {
              onStateChange({
                ...state,
                translations: {
                  ...state.translations,
                  [state.editLanguage]: {
                    ...state.translations[state.editLanguage],
                    description: e.target.value,
                  },
                },
              });
            }
          }}
          multiline
          rows={2}
        />
      </DialogContent>
      <DialogActions>
        <Button
          data-testid="category-cancel-button"
          onClick={handleClose}
        >
          {t('cancel')}
        </Button>
        <Button
          data-testid="category-save-button"
          onClick={onSave}
          variant="contained"
        >
          {t('save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
