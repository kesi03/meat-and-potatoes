# Shopping List & Inventory App Specification

## 1. Project Overview
- **Project Name**: Shopping List & Inventory App
- **Type**: React Web Application with Material UI
- **Core Functionality**: Combined shopping list manager and home inventory tracker with expiration monitoring
- **Target Users**: Households managing grocery shopping and tracking food/home items

## 2. UI/UX Specification

### Layout Structure
- **Navigation**: Left sidebar drawer with list management and inventory access
- **Main Content**: Right side showing selected list or inventory
- **Responsive**: Drawer collapses to hamburger menu on mobile
- **Tabs**: Switch between Shopping Lists and Inventory views

### Visual Design
- **Color Palette**:
  - Primary: `#2E7D32` (Forest Green)
  - Secondary: `#FF8F00` (Amber)
  - Background: `#FAFAFA`
  - Surface: `#FFFFFF`
  - Error/Warning: `#D32F2F` (expired), `#F57C00` (expiring soon)
  - Success: `#388E3C` (fresh)
- **Typography**: Roboto, 400/600 weights
- **Spacing**: 8px base unit

### Components
1. **AppBar**: Title, view toggle (Shopping/Inventory)
2. **Drawer**: 
   - Shopping Lists section
   - "Standard List" (common items)
   - "Add New List" button
3. **Shopping List View**:
   - List name header
   - Add item FAB
   - Item cards with category, quantity, cost
   - Category filter chips
4. **Inventory View**:
   - All items grouped by category
   - "At Home" quantity tracking
   - Best by date with visual indicators
   - Expiring soon / Expired sections
5. **Item Dialog**: All fields including bestByDate

### Categories (Admin)
- Users can add, edit, delete custom categories
- Each category has: name, description
- Default categories provided initially
- Categories used for both shopping and inventory organization

## 3. Functionality Specification

### Core Features

#### Shopping Lists
- Create, rename, delete shopping lists
- Standard List with common items (bread, milk, butter, eggs, cheese, etc.)
- Add items with: name, category, quantity, cost, description, barcode, nutritional info, weight/size, bestByDate
- Edit/delete items
- Filter by category
- Move items to inventory (when purchased)

#### Inventory (Home Stock)
- Track what you have at home
- Each item has: name, category, quantity at home, bestByDate, location (fridge, pantry, freezer, etc.)
- **Expiration Function**: `getExpirationStatus(item)` returns:
  - `"expired"` - past best by date
  - `"expiring-soon"` - within 3 days of best by date
  - `"fresh"` - more than 3 days until best by date
- Visual indicators: red for expired, orange for expiring soon, green for fresh
- Sort/filter by expiration status

#### Data Model
```javascript
Item {
  id: string,
  name: string,
  category: string,
  quantity: number,
  cost: number,
  description: string,
  barcode: string,
  nutritionalInfo: string,
  weightSize: string,
  bestByDate: string | null, // ISO date
  location: string // fridge, pantry, freezer, etc.
}

ShoppingList {
  id: string,
  name: string,
  items: Item[]
}

InventoryItem extends Item {
  homeQuantity: number
}
```

### Persistence
- All data in localStorage

## 4. Acceptance Criteria
- [ ] App loads without errors
- [ ] Can create multiple shopping lists
- [ ] Standard list with default items
- [ ] Can add items with bestByDate
- [ ] Expiration status function works correctly
- [ ] Inventory tracks home items
- [ ] Visual indicators for expiration status
- [ ] Can move items from shopping list to inventory
- [ ] Data persists after refresh
- [ ] Responsive design
