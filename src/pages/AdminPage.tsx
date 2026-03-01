import { useState } from 'react';
import { Box, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button } from '@mui/material';
import AdminView from '../components/AdminView';
import ItemForm from '../components/ItemForm';
import { useApp } from '../context/AppContext';
import type { Category, ShoppingItem } from '../context/AppContext';
import { useTranslation } from 'react-i18next';

export default function AdminPage() {
  const { t } = useTranslation();
  const { categories, addCategory, updateCategory, deleteCategory, currency, setCurrency, language, setLanguage, shoppingLists, addItemToList, updateItemInList } = useApp();
  const [categoryDialog, setCategoryDialog] = useState({ open: false, mode: 'add' as 'add' | 'edit', category: null as Category | null, name: '', description: '' });
  const [itemDialog, setItemDialog] = useState({ open: false, mode: 'add' as 'add' | 'edit', item: null as ShoppingItem | null });

  const standardList = shoppingLists.find(l => l.isStandard);

  const handleAddCategory = () => {
    setCategoryDialog({ open: true, mode: 'add', category: null, name: '', description: '' });
  };

  const handleEditCategory = (cat: Category) => {
    setCategoryDialog({ open: true, mode: 'edit', category: cat, name: cat.name, description: cat.description });
  };

  const handleSaveCategory = () => {
    if (categoryDialog.name.trim()) {
      if (categoryDialog.mode === 'add') {
        addCategory({ name: categoryDialog.name, description: categoryDialog.description });
      } else if (categoryDialog.category) {
        updateCategory(categoryDialog.category.id, { name: categoryDialog.name, description: categoryDialog.description });
      }
      setCategoryDialog({ open: false, mode: 'add', category: null, name: '', description: '' });
    }
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
        standardList={standardList}
        onEditStandardItem={handleEditStandardItem}
        onAddStandardItem={handleAddStandardItem}
      />

      <Dialog open={categoryDialog.open} onClose={() => setCategoryDialog({ open: false, mode: 'add', category: null, name: '', description: '' })}>
        <DialogTitle>{categoryDialog.mode === 'add' ? t('addCategory') : t('editCategory')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label={t('categoryName')}
            value={categoryDialog.name}
            onChange={(e) => setCategoryDialog({ ...categoryDialog, name: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            label={t('description')}
            value={categoryDialog.description}
            onChange={(e) => setCategoryDialog({ ...categoryDialog, description: e.target.value })}
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryDialog({ open: false, mode: 'add', category: null, name: '', description: '' })}>{t('cancel')}</Button>
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
