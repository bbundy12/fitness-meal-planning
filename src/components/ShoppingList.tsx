import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Download, RefreshCw } from "lucide-react";
import { Badge } from "./ui/badge";

interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  checked: boolean;
}

interface ShoppingCategory {
  category: string;
  items: ShoppingItem[];
}

export function ShoppingList() {
  const [shoppingList, setShoppingList] = useState<ShoppingCategory[]>([
    {
      category: "Protein",
      items: [
        { id: "1", name: "Chicken Breast", quantity: "3 lbs", checked: false },
        { id: "2", name: "Salmon Fillets", quantity: "2 lbs", checked: false },
        { id: "3", name: "Ground Turkey", quantity: "1 lb", checked: false },
        { id: "4", name: "Eggs", quantity: "2 dozen", checked: false }
      ]
    },
    {
      category: "Produce",
      items: [
        { id: "5", name: "Sweet Potatoes", quantity: "5 lbs", checked: false },
        { id: "6", name: "Broccoli", quantity: "2 heads", checked: false },
        { id: "7", name: "Spinach", quantity: "1 bag", checked: false },
        { id: "8", name: "Bananas", quantity: "6", checked: false }
      ]
    },
    {
      category: "Grains & Carbs",
      items: [
        { id: "9", name: "Brown Rice", quantity: "2 lbs", checked: false },
        { id: "10", name: "Oats", quantity: "1 container", checked: false },
        { id: "11", name: "Whole Wheat Bread", quantity: "1 loaf", checked: false }
      ]
    },
    {
      category: "Dairy",
      items: [
        { id: "12", name: "Greek Yogurt", quantity: "32 oz", checked: false },
        { id: "13", name: "Cottage Cheese", quantity: "16 oz", checked: false },
        { id: "14", name: "Almond Milk", quantity: "1 half gallon", checked: false }
      ]
    },
    {
      category: "Pantry",
      items: [
        { id: "15", name: "Olive Oil", quantity: "1 bottle", checked: false },
        { id: "16", name: "Protein Powder", quantity: "1 container", checked: false },
        { id: "17", name: "Almonds", quantity: "1 bag", checked: false }
      ]
    }
  ]);

  const handleToggleItem = (categoryIndex: number, itemId: string) => {
    const newList = [...shoppingList];
    const item = newList[categoryIndex].items.find(i => i.id === itemId);
    if (item) {
      item.checked = !item.checked;
      setShoppingList(newList);
    }
  };

  const handleExportCSV = () => {
    let csv = "Category,Item,Quantity,Checked\n";
    shoppingList.forEach(category => {
      category.items.forEach(item => {
        csv += `${category.category},"${item.name}",${item.quantity},${item.checked ? 'Yes' : 'No'}\n`;
      });
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shopping-list.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const totalItems = shoppingList.reduce((acc, cat) => acc + cat.items.length, 0);
  const checkedItems = shoppingList.reduce((acc, cat) => 
    acc + cat.items.filter(item => item.checked).length, 0
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl">Shopping List</h2>
        <p className="text-slate-500">Generated from your weekly meal plan</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Regenerate
        </Button>
        <Button variant="outline" onClick={handleExportCSV}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
        <Button onClick={handlePrint} className="bg-rose-600 hover:bg-rose-700">
          Print List
        </Button>
      </div>

      {/* Progress */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-slate-900">Shopping Progress</div>
            <Badge variant="outline">{checkedItems} / {totalItems} items</Badge>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(checkedItems / totalItems) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Shopping List by Category */}
      <div className="space-y-4">
        {shoppingList.map((category, categoryIndex) => (
          <Card key={category.category}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{category.category}</span>
                <Badge variant="outline">
                  {category.items.filter(i => i.checked).length} / {category.items.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {category.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Checkbox
                      id={item.id}
                      checked={item.checked}
                      onCheckedChange={() => handleToggleItem(categoryIndex, item.id)}
                    />
                    <label
                      htmlFor={item.id}
                      className={`flex-1 cursor-pointer ${item.checked ? 'line-through text-slate-400' : 'text-slate-900'}`}
                    >
                      {item.name}
                    </label>
                    <div className={`${item.checked ? 'text-slate-400' : 'text-slate-600'}`}>
                      {item.quantity}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .space-y-4, .space-y-4 * {
            visibility: visible;
          }
          .space-y-4 {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          button {
            display: none;
          }
          
          /* Tighter spacing for print */
          .space-y-4 {
            gap: 0.25rem !important;
          }
          .space-y-3 {
            gap: 0.125rem !important;
          }
          .p-3 {
            padding: 0.25rem 0.5rem !important;
          }
          .pt-6 {
            padding-top: 0.5rem !important;
          }
          .space-y-6 {
            gap: 0.5rem !important;
          }
          
          /* Remove extra card spacing */
          .rounded-lg {
            border-radius: 0 !important;
          }
          .bg-slate-50 {
            background-color: transparent !important;
          }
          
          /* Reduce margins and padding */
          h2, h3, h4, h5, h6 {
            margin-top: 0.25rem !important;
            margin-bottom: 0.25rem !important;
          }
          
          /* Compact card headers */
          .CardHeader, [class*="CardHeader"] {
            padding: 0.25rem 0.5rem !important;
          }
          
          .CardContent, [class*="CardContent"] {
            padding: 0.25rem 0.5rem !important;
          }
          
          /* Hide progress card when printing */
          .bg-blue-50 {
            display: none !important;
          }
          
          /* Reduce line height */
          * {
            line-height: 1.2 !important;
          }
        }
      `}</style>
    </div>
  );
}