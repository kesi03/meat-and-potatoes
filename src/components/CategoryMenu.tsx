import * as React from 'react';
import { styled, alpha } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Menu, { MenuProps } from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Category } from '../context/AppContext';
import { set } from 'firebase/database';


export interface CategoryMenuProps {
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
  categories: Category[];
  t: (key: string) => string;
  i18n: { language: string };
  getCategoryName: (cat: Category, lang: string) => string;
}

export function CategoryMenu({
  categoryFilter,
  setCategoryFilter,
  categories,
  t,
  i18n,
  getCategoryName,
}: CategoryMenuProps) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [currentLabel,setLabel] = React.useState<string>(t('all'));

  const handleClick = (event: React.MouseEvent<HTMLElement>): void => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (): void => {
    setAnchorEl(null);
  };

  const getCategory= (categoryName: string): Category | null => {
    const category = categories.find(cat => cat.name === categoryName);
    return category || null;
  }

  const handleSelect = (name: string): void => {
    const category= getCategory(name);
    if(!category){
      setLabel(t('all'));
      setCategoryFilter('');
      handleClose();
      return;
    }
    setLabel(category ? getCategoryName(category, i18n.language) : t('all'));
    setCategoryFilter(category.name);
    handleClose();
  };

  

  //
  // Styled Menu with white text + dark green background
  //
  const StyledMenu = styled((props: MenuProps) => (
    <Menu
      elevation={0}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      {...props}
    />
  ))(({ theme }) => ({
    '& .MuiPaper-root': {
      borderRadius: 6,
      marginTop: theme.spacing(1),
      minWidth: 180,
      backgroundColor: '#044a24',
      color: '#ffffff',
      boxShadow:
        'rgba(0, 0, 0, 0.2) 0px 4px 12px',
      '& .MuiMenuItem-root': {
        fontSize: '0.98rem',
        color: '#ffffff',
        '&:hover': {
          backgroundColor: alpha('#ffffff', 0.15),
        },
        '&:active': {
          backgroundColor: alpha('#ffffff', 0.25),
        },
      },
    },
  }));

  return (
    <>
      <Button
        variant="contained"
        size="small"
        onClick={handleClick}
        endIcon={<KeyboardArrowDownIcon />}
        sx={{
          fontSize: '0.98rem',
          textTransform: 'none',
          backgroundColor: '#044a24',
          color: 'white',
          '&:hover': {
            backgroundColor: '#066b33',
          },
        }}
      >
        {currentLabel}
      </Button>

      <StyledMenu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        <MenuItem onClick={() => handleSelect('')}>
          {t('all')}
        </MenuItem>

        {categories.map((cat) => (
          <MenuItem
            key={cat.id}
            onClick={() => handleSelect(cat.name)}
          >
            {getCategoryName(cat, i18n.language)}
          </MenuItem>
        ))}
      </StyledMenu>
    </>
  );
}