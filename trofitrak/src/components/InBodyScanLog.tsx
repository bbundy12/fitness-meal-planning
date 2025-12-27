"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Trash2 } from "lucide-react";
import { Badge } from "./ui/badge";
import { trpc } from "@/lib/trpc";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Calculated values interface
interface CalculatedMetrics {
  fatMassLbs: number;
  leanMassLbs: number;
  smmLbs: number;
}

// Progress deltas interface
interface ProgressDeltas {
  weightChange: number;
  fatMassChange: number;
  leanMassChange: number;
  smmChange: number;
}

export function InBodyScanLog() {
  const [showForm, setShowForm] = useState(false);
  const [weightLbs, setWeightLbs] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [muscleMass, setMuscleMass] = useState("");
  const [notes, setNotes] = useState("");

  // tRPC queries
  const scansQuery = trpc.inbody.list.useQuery({});
  const utils = trpc.useUtils();

  // tRPC mutations
  const createMutation = trpc.inbody.create.useMutation({
    onSuccess: () => {
      utils.inbody.list.invalidate();
      utils.inbody.latest.invalidate();
    },
  });

  const deleteMutation = trpc.inbody.delete.useMutation({
    onSuccess: () => {
      utils.inbody.list.invalidate();
      utils.inbody.latest.invalidate();
    },
  });

  const scans = scansQuery.data ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lbs = Number.parseFloat(weightLbs);
    const bf = Number.parseFloat(bodyFat);
    const smm = Number.parseFloat(muscleMass);

    createMutation.mutate({
      scanDate: new Date().toISOString().split("T")[0],
      weightLbs: lbs,
      bodyFatPercent: bf,
      skeletalMuscleMassKg: smm,
      notes: notes || undefined,
    });

    setWeightLbs("");
    setBodyFat("");
    setMuscleMass("");
    setNotes("");
    setShowForm(false);
  };

  // Calculate metrics for a scan
  const calculateMetrics = (scan: {
    weightLbs: number;
    bodyFatPercent: number;
    skeletalMuscleMassKg: number;
  }): CalculatedMetrics => {
    // Fat Mass = Body Weight × (Body Fat % / 100)
    const fatMassLbs = scan.weightLbs * (scan.bodyFatPercent / 100);

    // Lean Mass = Body Weight - Fat Mass
    const leanMassLbs = scan.weightLbs - fatMassLbs;

    // Skeletal Muscle Mass in lbs (convert from kg)
    const smmLbs = scan.skeletalMuscleMassKg * 2.20462;

    return {
      fatMassLbs: Math.round(fatMassLbs * 10) / 10,
      leanMassLbs: Math.round(leanMassLbs * 10) / 10,
      smmLbs: Math.round(smmLbs * 10) / 10,
    };
  };

  // Calculate progress deltas between two scans
  const calculateProgress = (
    current: {
      weightLbs: number;
      bodyFatPercent: number;
      skeletalMuscleMassKg: number;
    },
    previous: {
      weightLbs: number;
      bodyFatPercent: number;
      skeletalMuscleMassKg: number;
    }
  ): ProgressDeltas => {
    const currentMetrics = calculateMetrics(current);
    const previousMetrics = calculateMetrics(previous);

    return {
      weightChange: Math.round((current.weightLbs - previous.weightLbs) * 10) / 10,
      fatMassChange: Math.round((currentMetrics.fatMassLbs - previousMetrics.fatMassLbs) * 10) / 10,
      leanMassChange:
        Math.round((currentMetrics.leanMassLbs - previousMetrics.leanMassLbs) * 10) / 10,
      smmChange: Math.round((currentMetrics.smmLbs - previousMetrics.smmLbs) * 10) / 10,
    };
  };

  // Get latest progress (most recent vs previous scan)
  const latestProgress =
    scans.length >= 2 ? calculateProgress(scans[scans.length - 1], scans[scans.length - 2]) : null;

  const handleDeleteScan = (id: string) => {
    if (window.confirm("Are you sure you want to delete this scan?")) {
      deleteMutation.mutate({ id });
    }
  };

  // Prepare chart data (reverse order for chronological display)
  const chartData = [...scans].reverse().map((scan) => {
    const metrics = calculateMetrics(scan);
    return {
      date: new Date(scan.scanDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      weight: scan.weightLbs,
      bodyFat: scan.bodyFatPercent,
      muscleMass: metrics.smmLbs,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl">InBody Scan Log</h2>
        <p className="text-slate-500">Track your body composition over time</p>
      </div>

      {/* Progress Summary Card */}
      {latestProgress && scans.length >= 2 && (
        <Card className="bg-rose-50 border-rose-200">
          <CardHeader>
            <CardTitle>Latest Progress</CardTitle>
            <p className="text-slate-500">
              Changes from {new Date(scans[scans.length - 2].scanDate).toLocaleDateString()} to{" "}
              {new Date(scans[scans.length - 1].scanDate).toLocaleDateString()}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-slate-500">Weight Change</p>
                <div className="flex items-center gap-2">
                  <div className="text-slate-900">
                    {latestProgress.weightChange > 0 ? "+" : ""}
                    {latestProgress.weightChange} lbs
                  </div>
                  {latestProgress.weightChange < 0 ? (
                    <Badge className="bg-green-100 text-green-800">↓</Badge>
                  ) : latestProgress.weightChange > 0 ? (
                    <Badge className="bg-rose-100 text-rose-800">↑</Badge>
                  ) : (
                    <Badge className="bg-slate-100 text-slate-800">→</Badge>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-slate-500">Fat Mass Change</p>
                <div className="flex items-center gap-2">
                  <div className="text-slate-900">
                    {latestProgress.fatMassChange > 0 ? "+" : ""}
                    {latestProgress.fatMassChange} lbs
                  </div>
                  {latestProgress.fatMassChange < 0 ? (
                    <Badge className="bg-green-100 text-green-800">↓ Good</Badge>
                  ) : latestProgress.fatMassChange > 0 ? (
                    <Badge className="bg-rose-100 text-rose-800">↑</Badge>
                  ) : (
                    <Badge className="bg-slate-100 text-slate-800">→</Badge>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-slate-500">Lean Mass Change</p>
                <div className="flex items-center gap-2">
                  <div className="text-slate-900">
                    {latestProgress.leanMassChange > 0 ? "+" : ""}
                    {latestProgress.leanMassChange} lbs
                  </div>
                  {latestProgress.leanMassChange > 0 ? (
                    <Badge className="bg-green-100 text-green-800">↑ Good</Badge>
                  ) : latestProgress.leanMassChange < 0 ? (
                    <Badge className="bg-rose-100 text-rose-800">↓</Badge>
                  ) : (
                    <Badge className="bg-slate-100 text-slate-800">→</Badge>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-slate-500">Muscle Mass Change</p>
                <div className="flex items-center gap-2">
                  <div className="text-slate-900">
                    {latestProgress.smmChange > 0 ? "+" : ""}
                    {latestProgress.smmChange} lbs
                  </div>
                  {latestProgress.smmChange > 0 ? (
                    <Badge className="bg-green-100 text-green-800">↑ Good</Badge>
                  ) : latestProgress.smmChange < 0 ? (
                    <Badge className="bg-rose-100 text-rose-800">↓</Badge>
                  ) : (
                    <Badge className="bg-slate-100 text-slate-800">→</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Section */}
      {chartData.length >= 2 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Weight Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Weight Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} domain={["dataMin - 5", "dataMax + 5"]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#e11d48"
                    strokeWidth={2}
                    name="Weight (lbs)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Body Fat Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Body Fat %</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} domain={["dataMin - 2", "dataMax + 2"]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="bodyFat"
                    stroke="#f97316"
                    strokeWidth={2}
                    name="Body Fat %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Muscle Mass Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Skeletal Muscle Mass</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} domain={["dataMin - 5", "dataMax + 5"]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="muscleMass"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="SMM (lbs)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      <Button onClick={() => setShowForm(!showForm)} className="bg-rose-600 hover:bg-rose-700">
        {showForm ? "Cancel" : "Add New Scan"}
      </Button>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New InBody Scan</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (lbs)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={weightLbs}
                    onChange={(e) => setWeightLbs(e.target.value)}
                    placeholder="165.5"
                    required
                  />
                  {weightLbs && (
                    <p className="text-slate-500">
                      ≈ {(Number.parseFloat(weightLbs) * 0.453592).toFixed(1)} kg
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bodyFat">Body Fat %</Label>
                  <Input
                    id="bodyFat"
                    type="number"
                    step="0.1"
                    value={bodyFat}
                    onChange={(e) => setBodyFat(e.target.value)}
                    placeholder="18.5"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="muscle">Skeletal Muscle Mass (kg)</Label>
                  <Input
                    id="muscle"
                    type="number"
                    step="0.1"
                    value={muscleMass}
                    onChange={(e) => setMuscleMass(e.target.value)}
                    placeholder="72.3"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="How are you feeling? Any observations?"
                  rows={3}
                />
              </div>

              <Button type="submit" className="bg-rose-600 hover:bg-rose-700">
                Save Scan
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle>Scan History</CardTitle>
        </CardHeader>
        <CardContent>
          {scansQuery.isLoading ? (
            <p className="text-slate-500">Loading scans...</p>
          ) : scans.length === 0 ? (
            <p className="text-slate-500">
              No scans yet. Add your first scan to start tracking progress!
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Body Fat %</TableHead>
                    <TableHead>Fat Mass</TableHead>
                    <TableHead>Lean Mass</TableHead>
                    <TableHead>SMM (kg)</TableHead>
                    <TableHead>Changes</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...scans].reverse().map((scan, index) => {
                    const reversedIndex = scans.length - 1 - index;
                    const prevScan = scans[reversedIndex - 1];
                    const metrics = calculateMetrics(scan);
                    const progress = prevScan ? calculateProgress(scan, prevScan) : null;

                    return (
                      <TableRow key={scan.id}>
                        <TableCell>
                          <div>{new Date(scan.scanDate).toLocaleDateString()}</div>
                        </TableCell>
                        <TableCell>
                          <div>{scan.weightLbs} lbs</div>
                          <div className="text-slate-500">
                            ({(scan.weightLbs * 0.453592).toFixed(1)} kg)
                          </div>
                          {progress && (
                            <div className="text-slate-600">
                              {progress.weightChange > 0 ? "+" : ""}
                              {progress.weightChange} lbs
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>{scan.bodyFatPercent}%</div>
                        </TableCell>
                        <TableCell>
                          <div>{metrics.fatMassLbs} lbs</div>
                          {progress && (
                            <div
                              className={
                                progress.fatMassChange < 0
                                  ? "text-green-600"
                                  : progress.fatMassChange > 0
                                  ? "text-rose-600"
                                  : "text-slate-600"
                              }
                            >
                              {progress.fatMassChange > 0 ? "+" : ""}
                              {progress.fatMassChange} lbs
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>{metrics.leanMassLbs} lbs</div>
                          {progress && (
                            <div
                              className={
                                progress.leanMassChange > 0
                                  ? "text-green-600"
                                  : progress.leanMassChange < 0
                                  ? "text-rose-600"
                                  : "text-slate-600"
                              }
                            >
                              {progress.leanMassChange > 0 ? "+" : ""}
                              {progress.leanMassChange} lbs
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>{scan.skeletalMuscleMassKg} kg</div>
                          <div className="text-slate-500">({metrics.smmLbs} lbs)</div>
                          {progress && (
                            <div
                              className={
                                progress.smmChange > 0
                                  ? "text-green-600"
                                  : progress.smmChange < 0
                                  ? "text-rose-600"
                                  : "text-slate-600"
                              }
                            >
                              {progress.smmChange > 0 ? "+" : ""}
                              {progress.smmChange} lbs
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {progress && (
                            <div className="flex flex-col gap-1">
                              {progress.fatMassChange < 0 && progress.leanMassChange > 0 && (
                                <Badge className="bg-green-100 text-green-800">Recomp ✓</Badge>
                              )}
                              {progress.weightChange < 0 && progress.leanMassChange >= 0 && (
                                <Badge className="bg-green-100 text-green-800">Cutting ✓</Badge>
                              )}
                              {progress.leanMassChange > 0 && progress.weightChange > 0 && (
                                <Badge className="bg-blue-100 text-blue-800">Bulking</Badge>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-500">{scan.notes || "—"}</TableCell>
                        <TableCell>
                          <Button
                            onClick={() => handleDeleteScan(scan.id)}
                            className="bg-rose-600 hover:bg-rose-700 text-white"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
