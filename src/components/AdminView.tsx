import { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  FormControl,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Avatar,
} from '@mui/material';
import { Add, Edit, Delete, Store } from '@mui/icons-material';
import { CURRENCIES, formatCurrency, CurrencyCode } from '../meat';
import type { Category, ShoppingList } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import GB from 'country-flag-icons/react/3x2/GB';
import GBWLS from 'country-flag-icons/react/3x2/GB-WLS';
import GBSCT from 'country-flag-icons/react/3x2/GB-SCT';
import SE from 'country-flag-icons/react/3x2/SE';
import FI from 'country-flag-icons/react/3x2/FI';
import IE from 'country-flag-icons/react/3x2/IE';
import DK from 'country-flag-icons/react/3x2/DK';
import NO from 'country-flag-icons/react/3x2/NO';
import FO from 'country-flag-icons/react/3x2/FO';
import IS from 'country-flag-icons/react/3x2/IS';
import IM from 'country-flag-icons/react/3x2/IM';
import CornishFlag from '../flags/CornishFlag.svg';

const LANGUAGES = [
  { code: 'en', name: 'English', Flag: GB },
  { code: 'cy', name: 'Welsh', Flag: GBWLS },
  { code: 'gd', name: 'Scottish Gaelic', Flag: GBSCT },
  { code: 'sv', name: 'Swedish', Flag: SE },
  { code: 'fi', name: 'Finnish', Flag: FI },
  { code: 'ga', name: 'Irish Gaelic', Flag: IE },
  { code: 'da', name: 'Danish', Flag: DK },
  { code: 'no', name: 'Norwegian', Flag: NO },
  { code: 'fo', name: 'Faroese', Flag: FO },
  { code: 'is', name: 'Icelandic', Flag: IS },
  { code: 'kw', name: 'Cornish', Flag: CornishFlag },
];

interface AdminViewProps {
  categories: Category[];
  onAddCategory: () => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
  currency: CurrencyCode;
  onCurrencyChange: (currency: CurrencyCode) => void;
  language: string;
  onLanguageChange: (language: string) => void;
  standardList?: ShoppingList;
  onEditStandardItem: (item: any) => void;
  onAddStandardItem: () => void;
}

export default function AdminView({
  categories,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  currency,
  onCurrencyChange,
  language,
  onLanguageChange,
  standardList,
  onEditStandardItem,
  onAddStandardItem,
}: AdminViewProps) {
  const { t } = useTranslation();
  const [adminTab, setAdminTab] = useState(0);

  return (
    <Box>
      <Tabs 
        value={adminTab} 
        onChange={(e, v) => setAdminTab(v)}
        sx={{ mb: 3 }}
      >
        <Tab label={t('localeSettings')} />
        <Tab label={t('category')} />
        <Tab label={t('standardList')} />
      </Tabs>

      {adminTab === 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>{t('localeSettings')}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('selectLocale')}
          </Typography>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>{t('currency')}</Typography>
            <Select
              value={currency || 'GBP'}
              onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
            >
              {CURRENCIES.map(c => (
                <MenuItem key={c.code} value={c.code}>
                  {c.symbol} {c.name} ({c.code})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>{t('language')}</Typography>
            <Select
              value={language || 'en'}
              onChange={(e) => onLanguageChange(e.target.value)}
            >
              {LANGUAGES.map(lang => (
                <MenuItem key={lang.code} value={lang.code}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {typeof lang.Flag === 'string' ? (
                      <img src={lang.Flag} alt={lang.name} style={{ width: 24, height: 16, borderRadius: 2 }} />
                    ) : (
                      <lang.Flag style={{ width: 24, height: 16, borderRadius: 2 }} />
                    )}
                    {lang.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {adminTab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6">{t('category')}</Typography>
            <Button variant="contained" size="small" startIcon={<Add />} onClick={onAddCategory}>
              {t('addCategory')}
            </Button>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('manageCategories')}
          </Typography>
          <List>
            {categories.map(cat => (
              <ListItem
                key={cat.id}
                sx={{ bgcolor: 'background.paper', mb: 1, borderRadius: 1 }}
                secondaryAction={
                  <Box>
                    <IconButton onClick={() => onEditCategory(cat)}><Edit /></IconButton>
                    <IconButton onClick={() => onDeleteCategory(cat.id)}><Delete /></IconButton>
                  </Box>
                }
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.light' }}><Store /></Avatar>
                </ListItemAvatar>
                <ListItemText primary={cat.name} secondary={cat.description} />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {adminTab === 2 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6">{t('standardList')}</Typography>
            <Button variant="contained" size="small" startIcon={<Add />} onClick={onAddStandardItem}>
              {t('addItem')}
            </Button>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('defaultItems')}
          </Typography>
          {standardList && (
            <List>
              {standardList.items.map(item => (
                <ListItem
                  key={item.id}
                  sx={{ bgcolor: 'background.paper', mb: 1, borderRadius: 1 }}
                  secondaryAction={
                    <IconButton onClick={() => onEditStandardItem(item)}><Edit /></IconButton>
                  }
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.light' }}>{item.name[0]}</Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={item.name} 
                    secondary={`${item.category} - ${formatCurrency(item.cost, currency)}`} 
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      )}
    </Box>
  );
}
