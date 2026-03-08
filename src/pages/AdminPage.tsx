import { useState } from 'react';
import { Box } from '@mui/material';
import AdminView from '../components/AdminView';
import { useApp } from '../context/AppContext';
import type { Category, ShoppingItem } from '../context/AppContext';
import { CategoryDialog, ItemDialog, getInitialCategoryDialogState, translateText } from '../components/dialogs';

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
  { code: 'kl', name: 'Greenland (Kalaallisut)' },
  { code: 'nl', name: 'Dutch' },
  { code: 'vl', name: 'Flemish' },
];

export default function AdminPage() {
  const { categories, addCategory, updateCategory, deleteCategory, currency, setCurrency, language, setLanguage, firebaseConfig, setFirebaseConfig, shoppingLists, addItemToList, updateItemInList } = useApp();
  const [categoryDialog, setCategoryDialog] = useState(getInitialCategoryDialogState());
  const [isTranslating, setIsTranslating] = useState(false);
  const [itemDialog, setItemDialog] = useState({ open: false, mode: 'add' as 'add' | 'edit', item: null as ShoppingItem | null });

  const standardList = shoppingLists.find(l => l.isStandard);

  const handleAddCategory = () => {
    setCategoryDialog({ ...getInitialCategoryDialogState(), open: true, mode: 'add' });
  };

  const handleEditCategory = (cat: Category) => {
    setCategoryDialog({ 
      ...getInitialCategoryDialogState(),
      open: true, 
      mode: 'edit', 
      category: cat, 
      name: cat.name, 
      description: cat.description,
      translations: cat.translations || {},
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
      setCategoryDialog(getInitialCategoryDialogState());
    }
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

      <CategoryDialog
        state={categoryDialog}
        onStateChange={setCategoryDialog}
        onSave={handleSaveCategory}
        onAutoTranslate={handleAutoTranslate}
        isTranslating={isTranslating}
      />

      <ItemDialog
        open={itemDialog.open}
        mode={itemDialog.mode}
        item={itemDialog.item}
        categories={categories}
        onSave={handleSaveItem}
        onCancel={() => setItemDialog({ open: false, mode: 'add', item: null })}
      />
    </Box>
  );
}
