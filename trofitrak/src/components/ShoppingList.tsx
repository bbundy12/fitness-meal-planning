"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Download, RefreshCw, Plus, X } from "lucide-react";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { trpc } from "@/lib/trpc";
import { getCurrentWeekStart } from "@/lib/week";

export function ShoppingList() {
  const [weekStartDate] = useState(() => getCurrentWeekStart());
  const [customItemName, setCustomItemName] = useState("");
  const [customItemQuantity, setCustomItemQuantity] = useState("");
  const [customItemUnit, setCustomItemUnit] = useState("");

  const utils = trpc.useUtils();

  // Fetch shopping list for current week
  const { data: shoppingData } = trpc.shopping.getWeekList.useQuery({
    weekStartDate,
  });

  // Mutations
  const toggleCheckedMutation = trpc.shopping.toggleChecked.useMutation({
    onMutate: async (variables) => {
      await utils.shopping.getWeekList.cancel({ weekStartDate });
      const prev = utils.shopping.getWeekList.getData({ weekStartDate });

      utils.shopping.getWeekList.setData({ weekStartDate }, (old) => {
        if (!old) return old;

        if (variables.ingredientId) {
          // Toggle generated item
          return {
            ...old,
            generated: old.generated.map((item) =>
              item.ingredientId === variables.ingredientId
                ? { ...item, checked: !item.checked }
                : item,
            ),
          };
        }
        if (variables.customItemId) {
          // Toggle custom item
          return {
            ...old,
            custom: old.custom.map((item) =>
              item.id === variables.customItemId
                ? { ...item, checked: !item.checked }
                : item,
            ),
          };
        }
        return old;
      });

      return { prev };
    },
    onError: (_err, _variables, context) => {
      if (context?.prev) {
        utils.shopping.getWeekList.setData({ weekStartDate }, context.prev);
      }
    },
    onSettled: () => {
      utils.shopping.getWeekList.invalidate({ weekStartDate });
    },
  });

  const addCustomItemMutation = trpc.shopping.addCustomItem.useMutation({
    onSuccess: () => {
      utils.shopping.getWeekList.invalidate({ weekStartDate });
      setCustomItemName("");
      setCustomItemQuantity("");
      setCustomItemUnit("");
    },
  });

  const removeCustomItemMutation = trpc.shopping.removeCustomItem.useMutation({
    onMutate: async (variables) => {
      await utils.shopping.getWeekList.cancel({ weekStartDate });
      const prev = utils.shopping.getWeekList.getData({ weekStartDate });

      utils.shopping.getWeekList.setData({ weekStartDate }, (old) => {
        if (!old) return old;
        return {
          ...old,
          custom: old.custom.filter(
            (item) => item.id !== variables.customItemId,
          ),
        };
      });

      return { prev };
    },
    onError: (_err, _variables, context) => {
      if (context?.prev) {
        utils.shopping.getWeekList.setData({ weekStartDate }, context.prev);
      }
    },
    onSettled: () => {
      utils.shopping.getWeekList.invalidate({ weekStartDate });
    },
  });

  const clearChecksMutation = trpc.shopping.clearChecks.useMutation({
    onSuccess: () => {
      utils.shopping.getWeekList.invalidate({ weekStartDate });
    },
  });

  const handleToggleGenerated = (ingredientId: string) => {
    toggleCheckedMutation.mutate({ weekStartDate, ingredientId });
  };

  const handleToggleCustom = (customItemId: string) => {
    toggleCheckedMutation.mutate({ weekStartDate, customItemId });
  };

  const handleAddCustomItem = () => {
    if (!customItemName.trim()) return;

    const quantity = customItemQuantity
      ? Number.parseFloat(customItemQuantity)
      : undefined;

    addCustomItemMutation.mutate({
      weekStartDate,
      name: customItemName.trim(),
      quantity,
      unit: customItemUnit.trim() || undefined,
    });
  };

  const handleRemoveCustomItem = (customItemId: string) => {
    removeCustomItemMutation.mutate({ customItemId });
  };

  const handleExportCSV = () => {
    if (!shoppingData) return;

    let csv = "Category,Item,Quantity,Checked\n";

    // Generated items
    shoppingData.generated.forEach((item) => {
      const quantities = item.amounts
        .map((a) => `${a.quantity} ${a.unit}`)
        .join(" + ");
      csv += `Generated,"${item.name}","${quantities}",${item.checked ? "Yes" : "No"}\n`;
    });

    // Custom items
    shoppingData.custom.forEach((item) => {
      const quantity =
        item.quantity && item.unit
          ? `${item.quantity} ${item.unit}`
          : item.quantity
            ? `${item.quantity}`
            : "";
      csv += `Custom,"${item.name}","${quantity}",${item.checked ? "Yes" : "No"}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shopping-list-${weekStartDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!shoppingData) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl">Shopping List</h2>
          <p className="text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  const totalItems = shoppingData.generated.length + shoppingData.custom.length;
  const checkedItems =
    shoppingData.generated.filter((i) => i.checked).length +
    shoppingData.custom.filter((i) => i.checked).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl">Shopping List</h2>
        <p className="text-slate-500">
          Generated from your weekly meal plan (week of {weekStartDate})
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() =>
            utils.shopping.getWeekList.invalidate({ weekStartDate })
          }
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
        <Button variant="outline" onClick={handleExportCSV}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
        <Button
          variant="outline"
          onClick={() => clearChecksMutation.mutate({ weekStartDate })}
        >
          Clear Checks
        </Button>
        <Button onClick={handlePrint} className="bg-rose-600 hover:bg-rose-700">
          Print List
        </Button>
      </div>

      {/* Progress */}
      {totalItems > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-slate-900">Shopping Progress</div>
              <Badge variant="outline">
                {checkedItems} / {totalItems} items
              </Badge>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{
                  width: `${totalItems > 0 ? (checkedItems / totalItems) * 100 : 0}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {totalItems === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-slate-400">
            <p>
              No items yet. Add recipes to your meal plan to generate a shopping
              list.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Shopping List - Generated Items */}
      {shoppingData.generated.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>From Your Meal Plan</span>
              <Badge variant="outline">
                {shoppingData.generated.filter((i) => i.checked).length} /{" "}
                {shoppingData.generated.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {shoppingData.generated.map((item) => (
                <div
                  key={item.ingredientId}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                >
                  <Checkbox
                    id={item.ingredientId}
                    checked={item.checked}
                    onCheckedChange={() =>
                      handleToggleGenerated(item.ingredientId)
                    }
                  />
                  <label
                    htmlFor={item.ingredientId}
                    className={`flex-1 cursor-pointer ${
                      item.checked
                        ? "line-through text-slate-400"
                        : "text-slate-900"
                    }`}
                  >
                    {item.name}
                  </label>
                  <div
                    className={`text-sm ${item.checked ? "text-slate-400" : "text-slate-600"}`}
                  >
                    {item.amounts
                      .map((a) => `${a.quantity} ${a.unit}`)
                      .join(" + ")}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shopping List - Custom Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Custom Items</span>
            {shoppingData.custom.length > 0 && (
              <Badge variant="outline">
                {shoppingData.custom.filter((i) => i.checked).length} /{" "}
                {shoppingData.custom.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Add custom item form */}
            <div className="flex gap-2 p-3 bg-blue-50 rounded-lg border-2 border-dashed border-blue-200">
              <Input
                placeholder="Item name"
                value={customItemName}
                onChange={(e) => setCustomItemName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddCustomItem();
                  }
                }}
              />
              <Input
                placeholder="Qty"
                type="number"
                step="0.01"
                className="w-24"
                value={customItemQuantity}
                onChange={(e) => setCustomItemQuantity(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddCustomItem();
                  }
                }}
              />
              <Input
                placeholder="Unit"
                className="w-24"
                value={customItemUnit}
                onChange={(e) => setCustomItemUnit(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddCustomItem();
                  }
                }}
              />
              <Button onClick={handleAddCustomItem} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Custom items list */}
            {shoppingData.custom.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">
                No custom items yet. Add items above that aren't in your meal
                plan.
              </p>
            ) : (
              shoppingData.custom.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                >
                  <Checkbox
                    id={item.id}
                    checked={item.checked}
                    onCheckedChange={() => handleToggleCustom(item.id)}
                  />
                  <label
                    htmlFor={item.id}
                    className={`flex-1 cursor-pointer ${
                      item.checked
                        ? "line-through text-slate-400"
                        : "text-slate-900"
                    }`}
                  >
                    {item.name}
                  </label>
                  <div
                    className={`text-sm ${item.checked ? "text-slate-400" : "text-slate-600"}`}
                  >
                    {item.quantity && item.unit
                      ? `${item.quantity} ${item.unit}`
                      : item.quantity
                        ? `${item.quantity}`
                        : ""}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCustomItem(item.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

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
