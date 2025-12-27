"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Plus, Search, Database, Edit2, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { trpc } from "@/lib/trpc";

export function IngredientsDatabase() {
  const utils = trpc.useUtils();
  const { data: ingredients = [], isLoading } = trpc.ingredient.list.useQuery();
  const createMutation = trpc.ingredient.create.useMutation({
    onSuccess: () => {
      utils.ingredient.list.invalidate();
    },
  });
  const deleteMutation = trpc.ingredient.delete.useMutation({
    onSuccess: () => {
      utils.ingredient.list.invalidate();
    },
  });

  // USDA tRPC queries
  const [usdaQuery, setUsdaQuery] = useState("");
  const [enabledUsdaSearch, setEnabledUsdaSearch] = useState(false);
  const usdaSearchQuery = trpc.ingredient.searchExternal.useQuery(
    { query: usdaQuery },
    { enabled: enabledUsdaSearch && usdaQuery.length >= 2 },
  );
  const importMutation = trpc.ingredient.importExternal.useMutation({
    onSuccess: () => {
      utils.ingredient.list.invalidate();
      setEnabledUsdaSearch(false);
      setApiSearchQuery("");
    },
  });

  // Form states for manual entry
  const [manualName, setManualName] = useState("");
  const [manualServing, setManualServing] = useState("");
  const [manualCalories, setManualCalories] = useState("");
  const [manualProtein, setManualProtein] = useState("");
  const [manualCarbs, setManualCarbs] = useState("");
  const [manualFat, setManualFat] = useState("");

  // USDA API search states
  const [apiSearchQuery, setApiSearchQuery] = useState("");
  const [apiError, setApiError] = useState("");

  // Filter state
  const [searchFilter, setSearchFilter] = useState("");

  // Handle manual ingredient addition
  const handleAddManualIngredient = () => {
    if (!manualName.trim() || !manualServing.trim()) return;

    const servingSizeNum = parseFloat(manualServing) || 100;

    createMutation.mutate({
      name: manualName,
      servingSize: servingSizeNum,
      servingUnit: "g",
      gramsPerServing: servingSizeNum,
      calories: parseFloat(manualCalories) || 0,
      protein: parseFloat(manualProtein) || 0,
      carbs: parseFloat(manualCarbs) || 0,
      fat: parseFloat(manualFat) || 0,
      source: "MANUAL",
      sourceId: null,
    });

    // Reset form
    setManualName("");
    setManualServing("");
    setManualCalories("");
    setManualProtein("");
    setManualCarbs("");
    setManualFat("");
  };

  // USDA API search - now using tRPC
  const handleUSDASearch = () => {
    if (!apiSearchQuery.trim() || apiSearchQuery.length < 2) return;
    setApiError("");
    setUsdaQuery(apiSearchQuery);
    setEnabledUsdaSearch(true);
  };

  // Add ingredient from USDA results to database - now using tRPC
  const handleAddFromUSDA = (fdcId: number) => {
    importMutation.mutate({ fdcId });
  };

  // Delete ingredient
  const handleDeleteIngredient = (id: string) => {
    deleteMutation.mutate({ id });
  };

  // Filter ingredients
  const filteredIngredients = ingredients.filter((ing: { name: string }) =>
    ing.name.toLowerCase().includes(searchFilter.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl">Ingredients Database</h2>
        <p className="text-slate-500">
          Manage your custom ingredients and search USDA API
        </p>
      </div>

      <Tabs defaultValue="browse" className="space-y-4">
        <TabsList className="bg-white border border-slate-200">
          <TabsTrigger value="browse">
            <Database className="h-4 w-4 mr-2" />
            Browse Database
          </TabsTrigger>
          <TabsTrigger value="manual">
            <Plus className="h-4 w-4 mr-2" />
            Add Manual
          </TabsTrigger>
          <TabsTrigger value="usda">
            <Search className="h-4 w-4 mr-2" />
            USDA API
          </TabsTrigger>
        </TabsList>

        {/* Browse Database Tab */}
        <TabsContent value="browse" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>My Ingredients ({filteredIngredients.length})</span>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search ingredients..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-64"
                  />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {isLoading ? (
                  <div className="text-center py-8 text-slate-500">
                    Loading...
                  </div>
                ) : filteredIngredients.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    {searchFilter
                      ? "No ingredients found"
                      : "No ingredients yet. Add some using the tabs above."}
                  </div>
                ) : (
                  filteredIngredients.map(
                    (ingredient: (typeof ingredients)[0]) => (
                      <div
                        key={ingredient.id}
                        className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="text-slate-900">
                              {ingredient.name}
                            </div>
                            <Badge
                              variant={
                                ingredient.source === "USDA"
                                  ? "default"
                                  : "outline"
                              }
                            >
                              {ingredient.source}
                            </Badge>
                          </div>
                          <div className="text-slate-500 mt-1">
                            {ingredient.servingSize} {ingredient.servingUnit}
                          </div>
                          <div className="flex gap-4 mt-2 text-slate-600">
                            <span>{ingredient.calories} cal</span>
                            <span>P: {ingredient.protein}g</span>
                            <span>C: {ingredient.carbs}g</span>
                            <span>F: {ingredient.fat}g</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleDeleteIngredient(ingredient.id)
                            }
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ),
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manual Entry Tab */}
        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <CardTitle>Add Custom Ingredient</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manual-name">Ingredient Name *</Label>
                  <Input
                    id="manual-name"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="e.g., Brown Rice (cooked)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-serving">Serving Size (grams) *</Label>
                  <Input
                    id="manual-serving"
                    type="number"
                    step="1"
                    value={manualServing}
                    onChange={(e) => setManualServing(e.target.value)}
                    placeholder="e.g., 100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manual-calories">Calories</Label>
                  <Input
                    id="manual-calories"
                    type="number"
                    step="0.1"
                    value={manualCalories}
                    onChange={(e) => setManualCalories(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-protein">Protein (g)</Label>
                  <Input
                    id="manual-protein"
                    type="number"
                    step="0.1"
                    value={manualProtein}
                    onChange={(e) => setManualProtein(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-carbs">Carbs (g)</Label>
                  <Input
                    id="manual-carbs"
                    type="number"
                    step="0.1"
                    value={manualCarbs}
                    onChange={(e) => setManualCarbs(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-fat">Fat (g)</Label>
                  <Input
                    id="manual-fat"
                    type="number"
                    step="0.1"
                    value={manualFat}
                    onChange={(e) => setManualFat(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <Button
                onClick={handleAddManualIngredient}
                className="bg-rose-600 hover:bg-rose-700"
                disabled={!manualName.trim() || !manualServing.trim()}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add to Database
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* USDA API Tab */}
        <TabsContent value="usda" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search USDA Database</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-search">Search for Food</Label>
                <div className="flex gap-2">
                  <Input
                    id="api-search"
                    value={apiSearchQuery}
                    onChange={(e) => setApiSearchQuery(e.target.value)}
                    placeholder="e.g., 1 cup white rice, 6 oz chicken breast"
                    onKeyDown={(e) => e.key === "Enter" && handleUSDASearch()}
                  />
                  <Button
                    onClick={handleUSDASearch}
                    className="bg-rose-600 hover:bg-rose-700"
                    disabled={
                      usdaSearchQuery.isLoading || !apiSearchQuery.trim()
                    }
                  >
                    <Search className="h-4 w-4 mr-2" />
                    {usdaSearchQuery.isLoading ? "Searching..." : "Search"}
                  </Button>
                </div>
                <p className="text-slate-500">
                  Search USDA FoodData Central for nutritional information.
                </p>
              </div>

              {/* API Configuration Notice */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-green-900">
                  ✓ USDA FoodData Central API Configured
                </div>
                <p className="text-green-700 mt-1">
                  Your API key is ready to use. Search for foods from the
                  comprehensive USDA database.
                </p>
                <p className="text-green-600 mt-2">
                  Learn more at{" "}
                  <a
                    href="https://fdc.nal.usda.gov/api-guide.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    USDA FoodData Central
                  </a>
                </p>
              </div>

              {/* Error Display */}
              {(apiError || usdaSearchQuery.error) && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-red-900">Error</div>
                  <p className="text-red-700 mt-1">
                    {apiError || usdaSearchQuery.error?.message}
                  </p>
                </div>
              )}

              {/* Search Results */}
              {usdaSearchQuery.data && usdaSearchQuery.data.length > 0 && (
                <div className="space-y-2">
                  <Label>
                    Search Results ({usdaSearchQuery.data.length} items)
                  </Label>
                  {usdaSearchQuery.data.map((result) => (
                    <div
                      key={result.fdcId}
                      className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-slate-50"
                    >
                      <div>
                        <div className="text-slate-900">
                          {result.description}
                        </div>
                        {result.brandOwner && (
                          <div className="text-slate-500 mt-1">
                            {result.brandOwner}
                          </div>
                        )}
                        <div className="text-slate-500 mt-1">
                          Per 100g serving (USDA standard)
                        </div>
                      </div>
                      <Button
                        onClick={() => handleAddFromUSDA(result.fdcId)}
                        className="bg-rose-600 hover:bg-rose-700"
                        disabled={importMutation.isPending}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {importMutation.isPending ? "Importing..." : "Import"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* No results message */}
              {usdaSearchQuery.data && usdaSearchQuery.data.length === 0 && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center text-slate-500">
                  No results found. Try a different search term.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
