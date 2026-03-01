# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - banner [ref=e4]:
      - generic [ref=e6]: Shop & Stock
    - main [ref=e7]:
      - generic [ref=e8]:
        - tablist [ref=e11]:
          - tab "Currency" [selected] [ref=e12] [cursor=pointer]
          - tab "Categories" [ref=e13] [cursor=pointer]
          - tab "Standard List" [ref=e14] [cursor=pointer]
        - generic [ref=e16]:
          - heading "Currency" [level=6] [ref=e17]
          - paragraph [ref=e18]: Select your preferred currency for displaying prices.
          - generic [ref=e20]:
            - combobox [active] [ref=e21] [cursor=pointer]: $ US Dollar (USD)
            - textbox: USD
            - img
            - group
    - tablist [ref=e25]:
      - tab "Lists" [ref=e26] [cursor=pointer]:
        - img [ref=e27]
        - text: Lists
      - tab "Inventory" [ref=e29] [cursor=pointer]:
        - img [ref=e30]
        - text: Inventory
      - tab "Admin" [selected] [ref=e32] [cursor=pointer]:
        - img [ref=e33]
        - text: Admin
  - listbox [ref=e39]:
    - option [ref=e40] [cursor=pointer]: £ British Pound (GBP)
    - option [selected] [ref=e41] [cursor=pointer]: $ US Dollar (USD)
    - option [ref=e42] [cursor=pointer]: € Euro (EUR)
    - option [ref=e43] [cursor=pointer]: kr Swedish Krona (SEK)
    - option [ref=e44] [cursor=pointer]: kr Norwegian Krone (NOK)
```