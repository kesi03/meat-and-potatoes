import { useState } from 'react';
import { Box, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import AdminView from '../components/AdminView';
import ItemForm from '../components/ItemForm';
import { useApp } from '../context/AppContext';
import type { Category, ShoppingItem } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import { AutoFixHigh } from '@mui/icons-material';

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
];

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

export default function AdminPage() {
  const { t } = useTranslation();
  const { categories, addCategory, updateCategory, deleteCategory, currency, setCurrency, language, setLanguage, firebaseConfig, setFirebaseConfig, shoppingLists, addItemToList, updateItemInList } = useApp();
  const [categoryDialog, setCategoryDialog] = useState({ 
    open: false, 
    mode: 'add' as 'add' | 'edit', 
    category: null as Category | null, 
    name: '', 
    description: '',
    translations: {} as Record<string, { name?: string; description?: string }>,
    editLanguage: 'en'
  });
  const [isTranslating, setIsTranslating] = useState(false);
  const [itemDialog, setItemDialog] = useState({ open: false, mode: 'add' as 'add' | 'edit', item: null as ShoppingItem | null });

  const standardList = shoppingLists.find(l => l.isStandard);

  const handleAddCategory = () => {
    setCategoryDialog({ open: true, mode: 'add', category: null, name: '', description: '', translations: {}, editLanguage: 'en' });
  };

  const handleEditCategory = (cat: Category) => {
    setCategoryDialog({ 
      open: true, 
      mode: 'edit', 
      category: cat, 
      name: cat.name, 
      description: cat.description,
      translations: cat.translations || {},
      editLanguage: 'en'
    });
  };

  const handleSaveCategory = () => {
    if (categoryDialog.name.trim()) {
      const categoryData = { 
        name: categoryDialog.name, 
        description: categoryDialog.description,
        translations: categoryDialog.translations
      };
      if (categoryDialog.mode === 'add') {
        addCategory(categoryData);
      } else if (categoryDialog.category) {
        updateCategory(categoryDialog.category.id, categoryData);
      }
      setCategoryDialog({ open: false, mode: 'add', category: null, name: '', description: '', translations: {}, editLanguage: 'en' });
    }
  };

  const handleTranslationChange = (langCode: string, field: 'name' | 'description', value: string) => {
    setCategoryDialog(prev => ({
      ...prev,
      translations: {
        ...prev.translations,
        [langCode]: {
          ...prev.translations[langCode],
          [field]: value
        }
      }
    }));
  };

  const handleAutoTranslate = async () => {
    if (!categoryDialog.name.trim()) return;
    
    setIsTranslating(true);
    const newTranslations: Record<string, { name?: string; description?: string }> = {};
    
    for (const lang of LANGUAGES) {
      if (lang.code === 'en') continue;
      const translatedName = await translateText(categoryDialog.name, lang.code);
      const translatedDesc = categoryDialog.description ? await translateText(categoryDialog.description, lang.code) : '';
      newTranslations[lang.code] = { name: translatedName, description: translatedDesc };
    }
    
    setCategoryDialog(prev => ({
      ...prev,
      translations: newTranslations
    }));
    setIsTranslating(false);
  };

  const handleDeleteCategory = (id: string) => {
    deleteCategory(id);
  };

  const handleEditStandardItem = (item: ShoppingItem) => {
    setItemDialog({ open: true, mode: 'edit', item });
  };

  const handleAddStandardItem = () => {
    setItemDialog({ open: true, mode: 'add', item: null });
  };

  const handleSaveItem = (data: any) => {
    if (standardList) {
      if (itemDialog.mode === 'add') {
        addItemToList(standardList.id, { ...data, id: `item-${Date.now()}` });
      } else if (itemDialog.item) {
        updateItemInList(standardList.id, itemDialog.item.id, data);
      }
    }
    setItemDialog({ open: false, mode: 'add', item: null });
  };

  return (
    <Box sx={{ pb: 10 }}>
      <AdminView
        categories={categories}
        onAddCategory={handleAddCategory}
        onEditCategory={handleEditCategory}
        onDeleteCategory={handleDeleteCategory}
        currency={currency}
        onCurrencyChange={setCurrency}
        language={language}
        onLanguageChange={setLanguage}
        firebaseConfig={firebaseConfig}
        onFirebaseConfigChange={setFirebaseConfig}
        standardList={standardList}
        onEditStandardItem={handleEditStandardItem}
        onAddStandardItem={handleAddStandardItem}
      />

      <Dialog open={categoryDialog.open} onClose={() => setCategoryDialog({ open: false, mode: 'add', category: null, name: '', description: '', translations: {}, editLanguage: 'en' })}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {categoryDialog.mode === 'add' ? t('addCategory') : t('editCategory')}
          <Button 
            startIcon={<AutoFixHigh />} 
            onClick={handleAutoTranslate} 
            disabled={isTranslating || !categoryDialog.name.trim()}
            size="small"
          >
            {isTranslating ? 'Translating...' : 'Auto-translate'}
          </Button>
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
            <InputLabel>Language</InputLabel>
            <Select
              value={categoryDialog.editLanguage || 'en'}
              label="Language"
              onChange={(e) => setCategoryDialog({ ...categoryDialog, editLanguage: e.target.value })}
            >
              {LANGUAGES.map(lang => (
                <MenuItem key={lang.code} value={lang.code}>{lang.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            autoFocus
            fullWidth
            label={t('categoryName')}
            value={categoryDialog.editLanguage === 'en' ? categoryDialog.name : (categoryDialog.translations[categoryDialog.editLanguage]?.name || '')}
            onChange={(e) => {
              if (categoryDialog.editLanguage === 'en') {
                setCategoryDialog({ ...categoryDialog, name: e.target.value });
              } else {
                handleTranslationChange(categoryDialog.editLanguage, 'name', e.target.value);
              }
            }}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label={t('description')}
            value={categoryDialog.editLanguage === 'en' ? categoryDialog.description : (categoryDialog.translations[categoryDialog.editLanguage]?.description || '')}
            onChange={(e) => {
              if (categoryDialog.editLanguage === 'en') {
                setCategoryDialog({ ...categoryDialog, description: e.target.value });
              } else {
                handleTranslationChange(categoryDialog.editLanguage, 'description', e.target.value);
              }
            }}
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryDialog({ open: false, mode: 'add', category: null, name: '', description: '', translations: {}, editLanguage: 'en' })}>{t('cancel')}</Button>
          <Button onClick={handleSaveCategory} variant="contained">{t('save')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={itemDialog.open} onClose={() => setItemDialog({ open: false, mode: 'add', item: null })} maxWidth="sm" fullWidth>
        <DialogTitle>{itemDialog.mode === 'add' ? 'Add Standard Item' : 'Edit Standard Item'}</DialogTitle>
        <ItemForm
          item={itemDialog.item}
          categories={categories}
          onSave={handleSaveItem}
          onCancel={() => setItemDialog({ open: false, mode: 'add', item: null })}
          isEdit={itemDialog.mode === 'edit'}
        />
      </Dialog>
    </Box>
  );
}
