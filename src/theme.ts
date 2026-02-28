import { createTheme } from '@mui/material/styles';
import { 
  CATEGORIES, 
  LOCATIONS, 
  STANDARD_ITEMS, 
  generateId, 
  getExpirationStatus, 
  getDaysUntilExpiration 
} from './meat';

export { 
  CATEGORIES, 
  LOCATIONS, 
  STANDARD_ITEMS, 
  generateId, 
  getExpirationStatus, 
  getDaysUntilExpiration };

export type { ExpirationStatus, StandardItem } from './meat';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2E7D32',
    },
    secondary: {
      main: '#FF8F00',
    },
    background: {
      default: '#FAFAFA',
      paper: '#FFFFFF',
    },
    error: {
      main: '#D32F2F',
    },
    warning: {
      main: '#F57C00',
    },
    success: {
      main: '#388E3C',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          transition: 'box-shadow 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          },
        },
      },
    },
  },
});

export default theme;
