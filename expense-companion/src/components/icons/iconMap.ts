// Lista limitata di icone consigliate (stringhe corrispondenti ai nomi in lucide-react)
export const ICONS = [
  "Wallet",
  "CreditCard",
  "Coffee",
  "ShoppingCart",
  "Truck",
  "Home",
  "Gift",
  "PieChart",
  "Car",
  "Airplay",
] as const;
export type IconName = typeof ICONS[number];
