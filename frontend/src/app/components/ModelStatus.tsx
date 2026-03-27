import { useEffect, useMemo, useState } from "react";
import { Activity, CheckCircle2, AlertCircle, Database, BrainCircuit } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { apiClient } from "../services/apiClient";

const API_BASE_URL = (import.meta as any).env.VITE_API_URL || "http://localhost:8000/api";

interface ModelReadyPayload {
  ready: boolean;
  database?: { ready: boolean; state: number };
  model?: {
    ready: boolean;
    artifactPath?: string;
    runnerPath?: string;
    pythonBinary?: string;
    reason?: string;
  };
}

export function ModelStatus() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState<ModelReadyPayload | null>(null);
  const [loanRows, setLoanRows] = useState<any[]>([]);

  useEffect(() => {
    void loadData();
    const interval = setInterval(() => {
      void loadData();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [readyRes, loansRes] = await Promise.all([
        fetch(`${API_BASE_URL}/health/ready`),
        apiClient.get(`${API_BASE_URL}/admin/my-loans`),
      ]);

      if (readyRes.ok) {
        const readyBody = await readyRes.json();
        setReady(readyBody);
      } else {
        setReady(null);
      }

      if (loansRes.ok) {
        const loansBody = await loansRes.json();
        setLoanRows(loansBody.loans || []);
      } else {
        setLoanRows([]);
      }
    } catch (error) {
      setReady(null);
      setLoanRows([]);
    } finally {
      setLoading(false);
    }
  };

  const telemetry = useMemo(() => {
    const scoring = { ml_model: 0, legacy_fallback: 0, unknown: 0 };
    const risk = { low: 0, medium: 0, high: 0, unknown: 0 };
    const modelVersionCount = new Map<string, number>();

    loanRows.forEach((loan) => {
      const source = String(loan?.features?.scoringSource || "unknown");
      if (source === "ml_model") scoring.ml_model += 1;
      else if (source === "legacy_fallback") scoring.legacy_fallback += 1;
      else scoring.unknown += 1;

      const riskLevel = String(loan?.aiAnalysis?.riskLevel || "unknown");
      if (riskLevel === "low") risk.low += 1;
      else if (riskLevel === "medium") risk.medium += 1;
      else if (riskLevel === "high") risk.high += 1;
      else risk.unknown += 1;

      const version = String(loan?.aiAnalysis?.modelVersion || "unknown");
      modelVersionCount.set(version, (modelVersionCount.get(version) || 0) + 1);
    });

    const modelVersions = Array.from(modelVersionCount.entries())
      .map(([version, count]) => ({ version, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalLoans: loanRows.length,
      scoring,
      risk,
      modelVersions,
      mlCoveragePct: loanRows.length > 0 ? Math.round((scoring.ml_model / loanRows.length) * 100) : 0,
    };
  }, [loanRows]);

  const modelHealthy = Boolean(ready?.model?.ready);
  const dbHealthy = Boolean(ready?.database?.ready);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white border-b border-slate-200 shadow-sm flex-shrink-0">
        <div className="w-full px-6 sm:px-8 md:px-10 lg:px-12">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <img src="/images/download.png" alt="Logo" className="w-8 h-8 object-contain" />
              <span className="font-bold text-lg sm:text-xl text-slate-900">CREDIT - Admin</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <button onClick={() => navigate("/admin")} className="text-slate-600 hover:text-slate-900 transition-colors">Dashboard</button>
              <button onClick={() => navigate("/admin/loans")} className="text-slate-600 hover:text-slate-900 transition-colors">Loans</button>
              <button onClick={() => navigate("/admin/reports")} className="text-slate-600 hover:text-slate-900 transition-colors">Audit Log</button>
              <button onClick={() => navigate("/admin/models")} className="text-slate-900 font-medium">Models</button>
            </nav>
            <Button
              onClick={() => logout()}
              variant="outline"
              className="border-blue-600 text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 font-semibold"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="w-full px-10 sm:px-12 md:px-16 lg:px-20 xl:px-24 py-8 flex-1 overflow-y-auto">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Model Status</h1>
            <p className="text-slate-600 text-sm mt-1">Live model/runtime telemetry from backend readiness and scored loans.</p>
          </div>
          <Button onClick={() => void loadData()} variant="outline" className="border-slate-300 text-slate-700">
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs uppercase text-slate-500 font-semibold">Model Runtime</p>
            <p className={`text-2xl font-bold mt-2 ${modelHealthy ? "text-green-600" : "text-red-500"}`}>
              {modelHealthy ? "Up" : "Down"}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs uppercase text-slate-500 font-semibold">Database</p>
            <p className={`text-2xl font-bold mt-2 ${dbHealthy ? "text-green-600" : "text-red-500"}`}>
              {dbHealthy ? "Up" : "Down"}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs uppercase text-slate-500 font-semibold">Loans Observed</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{telemetry.totalLoans}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs uppercase text-slate-500 font-semibold">ML Coverage</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">{telemetry.mlCoveragePct}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-700 uppercase mb-4 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4" />
              Scoring Source Distribution
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-600">ml_model</span><span className="font-semibold text-slate-900">{telemetry.scoring.ml_model}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">legacy_fallback</span><span className="font-semibold text-slate-900">{telemetry.scoring.legacy_fallback}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">unknown</span><span className="font-semibold text-slate-900">{telemetry.scoring.unknown}</span></div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-700 uppercase mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Risk Distribution (Scored Loans)
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-600">Low</span><span className="font-semibold text-green-600">{telemetry.risk.low}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Medium</span><span className="font-semibold text-amber-600">{telemetry.risk.medium}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">High</span><span className="font-semibold text-red-500">{telemetry.risk.high}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Unknown</span><span className="font-semibold text-slate-900">{telemetry.risk.unknown}</span></div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-700 uppercase mb-4 flex items-center gap-2">
            <Database className="w-4 h-4" />
            Runtime Artifacts
          </h3>
          {loading ? (
            <p className="text-slate-500 text-sm">Loading...</p>
          ) : ready ? (
            <div className="space-y-2 text-sm">
              <p><span className="text-slate-500">Model ready:</span> <span className={`font-semibold ${modelHealthy ? "text-green-600" : "text-red-500"}`}>{String(modelHealthy)}</span></p>
              <p><span className="text-slate-500">Python:</span> <span className="font-semibold text-slate-900">{ready.model?.pythonBinary || "N/A"}</span></p>
              <p><span className="text-slate-500">Artifact path:</span> <span className="font-semibold text-slate-900 break-all">{ready.model?.artifactPath || "N/A"}</span></p>
              <p><span className="text-slate-500">Runner path:</span> <span className="font-semibold text-slate-900 break-all">{ready.model?.runnerPath || "N/A"}</span></p>
              {!modelHealthy && ready.model?.reason && (
                <p><span className="text-slate-500">Reason:</span> <span className="font-semibold text-red-500">{ready.model.reason}</span></p>
              )}

              <div className="pt-4">
                <p className="text-slate-600 font-semibold mb-2">Model version usage in loans</p>
                <div className="space-y-1">
                  {telemetry.modelVersions.length === 0 && <p className="text-sm text-slate-500">No scored loans yet.</p>}
                  {telemetry.modelVersions.map((entry) => (
                    <div key={entry.version} className="flex justify-between text-sm">
                      <span className="text-slate-600">{entry.version}</span>
                      <span className="text-slate-900 font-semibold">{entry.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              Could not load model readiness.
            </div>
          )}

          {modelHealthy && dbHealthy && (
            <div className="mt-4 flex items-center gap-2 text-green-700 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              Backend and ML runtime are healthy.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
