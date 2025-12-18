import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Button } from "./components/ui/button";
import { Dashboard } from "./components/Dashboard";
import { InBodyScanLog } from "./components/InBodyScanLog";
import { IngredientsDatabase } from "./components/IngredientsDatabase";
import { RecipeBuilder } from "./components/RecipeBuilder";
import { MealPlanner } from "./components/MealPlanner";
import { RecipeSelector } from "./components/RecipeSelector";
import { ShoppingList } from "./components/ShoppingList";
import { User, LayoutDashboard, Scale, Database, Utensils, Calendar, ShoppingCart } from "lucide-react";

export default function App() {
  const [currentUser, setCurrentUser] = useState<"Me" | "Mom">("Me");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [recipeSelectorContext, setRecipeSelectorContext] = useState<{
    day: string;
    mealType: string;
  } | null>(null);

  const handleNavigate = (section: string) => {
    setActiveTab(section);
  };

  const handleNavigateToRecipeSelector = (day: string, mealType: string) => {
    setRecipeSelectorContext({ day, mealType });
    setActiveTab("recipe-selector");
  };

  const handleSelectRecipe = (recipe: any) => {
    // In real app, this would update the meal plan
    console.log("Selected recipe:", recipe, "for", recipeSelectorContext);
    setActiveTab("planner");
    setRecipeSelectorContext(null);
  };

  const handleBackFromRecipeSelector = () => {
    setActiveTab("planner");
    setRecipeSelectorContext(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-8">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-rose-600 w-8 h-8 rounded flex items-center justify-center">
                <span className="text-white">T</span>
              </div>
              <h1 className="text-slate-900">TrofiTrak</h1>
            </div>

            {/* User Toggle */}
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
              <Button
                variant={currentUser === "Me" ? "default" : "ghost"}
                size="sm"
                onClick={() => setCurrentUser("Me")}
                className={currentUser === "Me" ? "bg-rose-600 hover:bg-rose-700" : ""}
              >
                <User className="mr-2 h-4 w-4" />
                Me
              </Button>
              <Button
                variant={currentUser === "Mom" ? "default" : "ghost"}
                size="sm"
                onClick={() => setCurrentUser("Mom")}
                className={currentUser === "Mom" ? "bg-rose-600 hover:bg-rose-700" : ""}
              >
                <User className="mr-2 h-4 w-4" />
                Mom
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Desktop Navigation */}
          <TabsList className="hidden md:flex bg-white border border-slate-200">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="inbody">InBody Scans</TabsTrigger>
            <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
            <TabsTrigger value="recipes">Recipes</TabsTrigger>
            <TabsTrigger value="planner">Meal Planner</TabsTrigger>
            <TabsTrigger value="shopping">Shopping List</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard currentUser={currentUser} onNavigate={handleNavigate} />
          </TabsContent>

          <TabsContent value="inbody">
            <InBodyScanLog currentUser={currentUser} />
          </TabsContent>

          <TabsContent value="ingredients">
            <IngredientsDatabase />
          </TabsContent>

          <TabsContent value="recipes">
            <RecipeBuilder />
          </TabsContent>

          <TabsContent value="planner">
            <MealPlanner
              onNavigateToRecipeSelector={handleNavigateToRecipeSelector}
            />
          </TabsContent>

          <TabsContent value="recipe-selector">
            <RecipeSelector
              context={recipeSelectorContext}
              onSelectRecipe={handleSelectRecipe}
              onBack={handleBackFromRecipeSelector}
            />
          </TabsContent>

          <TabsContent value="shopping">
            <ShoppingList />
          </TabsContent>
        </Tabs>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 safe-area-bottom z-50">
        <div className="grid grid-cols-6 h-16">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === "dashboard"
                ? "text-rose-600"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-xs">Home</span>
          </button>

          <button
            onClick={() => setActiveTab("inbody")}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === "inbody"
                ? "text-rose-600"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Scale className="h-5 w-5" />
            <span className="text-xs">Scans</span>
          </button>

          <button
            onClick={() => setActiveTab("ingredients")}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === "ingredients"
                ? "text-rose-600"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Database className="h-5 w-5" />
            <span className="text-xs">Items</span>
          </button>

          <button
            onClick={() => setActiveTab("recipes")}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === "recipes"
                ? "text-rose-600"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Utensils className="h-5 w-5" />
            <span className="text-xs">Recipes</span>
          </button>

          <button
            onClick={() => setActiveTab("planner")}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === "planner"
                ? "text-rose-600"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Calendar className="h-5 w-5" />
            <span className="text-xs">Plan</span>
          </button>

          <button
            onClick={() => setActiveTab("shopping")}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === "shopping"
                ? "text-rose-600"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="text-xs">Shop</span>
          </button>
        </div>
      </nav>
    </div>
  );
}