"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Plus, BookOpen, Calendar, ShoppingCart, Edit2, Check, X, Activity } from "lucide-react";
import { useState } from "react";
import { DEFAULT_USER } from "@/lib/default-user";
import { trpc } from "@/lib/trpc";

interface DashboardProps {
  onNavigate: (section: string) => void;
}

type MacroGoals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export function Dashboard({ onNavigate }: DashboardProps) {
  const [goals, setGoals] = useState<MacroGoals>({ ...DEFAULT_USER.goals });

  const [isEditing, setIsEditing] = useState(false);
  const [editCalories, setEditCalories] = useState("");
  const [editProtein, setEditProtein] = useState("");
  const [editCarbs, setEditCarbs] = useState("");
  const [editFat, setEditFat] = useState("");

  // Fetch latest InBody scan
  const latestScanQuery = trpc.inbody.latest.useQuery();
  const latestScan = latestScanQuery.data;

  const data = goals;

  const handleStartEdit = () => {
    setEditCalories(data.calories.toString());
    setEditProtein(data.protein.toString());
    setEditCarbs(data.carbs.toString());
    setEditFat(data.fat.toString());
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    setGoals({
      calories: parseInt(editCalories, 10) || data.calories,
      protein: parseInt(editProtein, 10) || data.protein,
      carbs: parseInt(editCarbs, 10) || data.carbs,
      fat: parseInt(editFat, 10) || data.fat,
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl">Dashboard</h2>
        <p className="text-slate-500">Welcome back! Here are your daily macro goals.</p>
      </div>

      {/* Daily Macro Goals */}
      <Card className="bg-rose-50 border-rose-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Daily Macro Goals</CardTitle>
            {!isEditing ? (
              <Button variant="outline" size="sm" onClick={handleStartEdit}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Goals
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveEdit}
                  className="bg-rose-600 text-white hover:bg-rose-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!isEditing ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-slate-500">Daily Calories</p>
                <div className="text-slate-900">{data.calories} kcal</div>
              </div>
              <div>
                <p className="text-slate-500">Protein</p>
                <div className="text-slate-900">{data.protein}g</div>
              </div>
              <div>
                <p className="text-slate-500">Carbs</p>
                <div className="text-slate-900">{data.carbs}g</div>
              </div>
              <div>
                <p className="text-slate-500">Fat</p>
                <div className="text-slate-900">{data.fat}g</div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-calories">Daily Calories</Label>
                <Input
                  id="edit-calories"
                  type="number"
                  value={editCalories}
                  onChange={(e) => setEditCalories(e.target.value)}
                  placeholder="e.g., 2250"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-protein">Protein (g)</Label>
                <Input
                  id="edit-protein"
                  type="number"
                  value={editProtein}
                  onChange={(e) => setEditProtein(e.target.value)}
                  placeholder="e.g., 169"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-carbs">Carbs (g)</Label>
                <Input
                  id="edit-carbs"
                  type="number"
                  value={editCarbs}
                  onChange={(e) => setEditCarbs(e.target.value)}
                  placeholder="e.g., 225"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-fat">Fat (g)</Label>
                <Input
                  id="edit-fat"
                  type="number"
                  value={editFat}
                  onChange={(e) => setEditFat(e.target.value)}
                  placeholder="e.g., 75"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* InBody Scan Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-rose-600" />
            Latest InBody Scan
          </CardTitle>
        </CardHeader>
        <CardContent>
          {latestScanQuery.isLoading ? (
            <p className="text-slate-500">Loading...</p>
          ) : latestScan ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-slate-500">Scan Date</p>
                  <div className="text-slate-900">
                    {new Date(latestScan.scanDate).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <p className="text-slate-500">Weight</p>
                  <div className="text-slate-900">{latestScan.weightLbs} lbs</div>
                </div>
                <div>
                  <p className="text-slate-500">Body Fat %</p>
                  <div className="text-slate-900">{latestScan.bodyFatPercent}%</div>
                </div>
                <div>
                  <p className="text-slate-500">Skeletal Muscle</p>
                  <div className="text-slate-900">{latestScan.skeletalMuscleMassKg} kg</div>
                </div>
              </div>
              <Button
                onClick={() => onNavigate("inbody")}
                className="bg-rose-600 hover:bg-rose-700"
              >
                View All Scans
              </Button>
            </div>
          ) : (
            <>
              <p className="text-slate-500 mb-4">Track your body composition changes over time.</p>
              <Button
                onClick={() => onNavigate("inbody")}
                className="bg-rose-600 hover:bg-rose-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add First Scan
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div>
        <h3 className="mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            className="cursor-pointer hover:bg-slate-50 transition-colors"
            onClick={() => onNavigate("recipes")}
          >
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <div className="text-slate-900">Recipes</div>
                <p className="text-slate-500">Build and manage recipes</p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:bg-slate-50 transition-colors"
            onClick={() => onNavigate("planner")}
          >
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-slate-900">Meal Plans</div>
                <p className="text-slate-500">Plan your weekly meals</p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:bg-slate-50 transition-colors"
            onClick={() => onNavigate("shopping")}
          >
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-slate-900">Shopping List</div>
                <p className="text-slate-500">Generate grocery lists</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
