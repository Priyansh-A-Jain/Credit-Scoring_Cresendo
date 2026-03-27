import { CheckCircle, XCircle, AlertCircle, History } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { useState, useEffect } from "react";
import { apiClient } from "../services/apiClient";

const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000/api';

export function AuditLog() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs();
    
    const interval = setInterval(() => {
      fetchAuditLogs();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/admin/audit-logs`);
      
      if (response.ok) {
        const data = await response.json();
        const logs = (data.logs || []).map((log: any) => ({
          id: log._id,
          applicantName: log.applicantName || 'Unknown',
          eventType: log.eventType,
          description: log.description,
          timestamp: new Date(log.timestamp).toLocaleString('en-IN'),
          severity: log.severity || 'info',
          icon: log.severity === 'success' ? CheckCircle : log.severity === 'error' ? XCircle : AlertCircle
        }));
        setAuditLogs(logs);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventColor = (severity: string) => {
    switch (severity) {
      case "success":
        return "bg-green-500/10 border-green-500/20 text-green-300";
      case "error":
        return "bg-red-500/10 border-red-500/20 text-red-300";
      case "warning":
        return "bg-yellow-500/10 border-yellow-500/20 text-yellow-300";
      default:
        return "bg-gray-500/10 border-gray-500/20 text-gray-300";
    }
  };

  const getTextColor = (severity: string) => {
    switch (severity) {
      case "success":
        return "text-green-400";
      case "error":
        return "text-red-400";
      case "warning":
        return "text-yellow-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      <style>{`
        html {
          scrollbar-gutter: stable;
        }
      `}</style>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm flex-shrink-0">
        <div className="w-full px-6 sm:px-8 md:px-10 lg:px-12">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <img src="/images/download.png" alt="Barclays Logo" className="w-8 h-8 object-contain" />
              <span className="font-bold text-lg sm:text-xl text-slate-900">CREDIT - Admin</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <button onClick={() => navigate("/admin")} className="text-slate-600 hover:text-slate-900 transition-colors">Dashboard</button>
              {/* <button onClick={() => navigate("/admin/users")} className="text-slate-600 hover:text-slate-900 transition-colors">Users</button> */}
              <button onClick={() => navigate("/admin/loans")} className="text-slate-600 hover:text-slate-900 transition-colors">Loans</button>
              <button onClick={() => navigate("/admin/reports")} className="text-slate-900 font-medium hover:text-blue-600 transition-colors">Audit Log</button>
              <button onClick={() => navigate("/admin/models")} className="text-slate-600 hover:text-slate-900 transition-colors">Models</button>
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

      {/* Main Content */}
      <main className="w-full px-10 sm:px-12 md:px-16 lg:px-20 xl:px-24 py-8 flex-1 overflow-y-auto">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <History className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900">Audit Log</h1>
          </div>
          <p className="text-slate-600 text-sm">Track all application activities and administrative actions</p>
        </div>

        {/* Audit Log Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition-all duration-300 shadow-sm">
          <div className="overflow-y-auto max-h-[calc(100vh-280px)]">
            <div className="space-y-0">
              {auditLogs.map((log) => (
                <div key={log.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors duration-200">
                  <div className="px-8 py-5">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`flex-shrink-0 mt-1 ${getEventColor(log.severity)} p-2.5 rounded-lg border`}>
                        <log.icon className={`w-4 h-4 ${getTextColor(log.severity)}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-4 mb-2">
                          <div className="flex-1">
                            <p className="text-sm font-bold text-slate-900">{log.applicantName}</p>
                            <p className={`text-xs font-semibold mt-1.5 ${getTextColor(log.severity)}`}>
                              {log.eventType}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs text-slate-600 font-medium whitespace-nowrap">{log.timestamp}</p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{log.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Info */}
        {/* <div className="mt-6 text-center text-xs text-gray-400">
          <p>Total Audit Records: {auditLogs.length} • Last Updated: 2026-03-24 3:30 PM IST</p>
        </div> */}
      </main>
    </div>
  );
}
