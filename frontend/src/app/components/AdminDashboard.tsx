import { CreditCard, DollarSign, Activity, CheckCircle, XCircle, Clock, X, FileText } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { apiClient } from "../services/apiClient";

const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000/api';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [adminLoanType, setAdminLoanType] = useState<string>("");
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loanTypeLabels: {[key: string]: string} = {
    'personal': 'Personal Loan',
    'home': 'Home Loan',
    'education': 'Education Loan',
    'auto': 'Automobile Loan',
    'business': 'Business Loan',
    'credit_card': 'Credit Card'
  };

  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 5000); // Refresh every 5 seconds
    
    // Listen for loan status changes
    const handleLoanStatusChange = () => {
      console.log('🔄 Loan status changed, refreshing dashboard...');
      fetchDashboardData();
    };
    
    window.addEventListener('loanStatusChanged', handleLoanStatusChange);
    
    fetchDashboardData(); // Fetch on mount
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('loanStatusChanged', handleLoanStatusChange);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/admin/dashboard`);
      
      if (response.ok) {
        const data = await response.json();
        setAdminLoanType(data.adminLoanType);
        setDashboardData(data.metrics);
        console.log('Dashboard data loaded:', data);
      } else {
        console.error('Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const keyMetrics = dashboardData ? [
    { title: "Total Applications", value: dashboardData.totalApplications?.toString() || "0", icon: CreditCard, color: "from-blue-500 to-blue-600", bgColor: "bg-blue-500/10", iconColor: "text-blue-400" },
    { title: "Approved", value: dashboardData.approvedLoans?.toString() || "0", icon: CheckCircle, color: "from-green-500 to-green-600", bgColor: "bg-green-500/10", iconColor: "text-green-400" },
    { title: "Rejected", value: dashboardData.rejectedLoans?.toString() || "0", icon: XCircle, color: "from-red-500 to-red-600", bgColor: "bg-red-500/10", iconColor: "text-red-400" },
    { title: "Pending", value: dashboardData.pendingLoans?.toString() || "0", icon: Clock, color: "from-yellow-500 to-yellow-600", bgColor: "bg-yellow-500/10", iconColor: "text-yellow-400" },
  ] : [];

  const financialMetrics = dashboardData ? [
    { 
      title: "Total Disbursed", 
      value: `₹ ${dashboardData.totalDisbursed ? (dashboardData.totalDisbursed / 100000).toFixed(1) : "0"}L`, 
      icon: DollarSign, 
      color: "from-indigo-500 to-indigo-600", 
      bgColor: "bg-indigo-500/10", 
      iconColor: "text-indigo-400"
    },
    { 
      title: "Active Loans", 
      value: dashboardData.activeLoans?.toString() || "0", 
      icon: Activity, 
      color: "from-purple-500 to-purple-600", 
      bgColor: "bg-purple-500/10", 
      iconColor: "text-purple-400"
    },
  ] : [];

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      <style>{`
        html {
          scrollbar-gutter: stable;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .modal-backdrop {
          animation: fadeIn 0.3s ease-out;
        }
        .modal-content {
          animation: slideUp 0.4s ease-out;
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
              <button onClick={() => navigate("/admin")} className="text-slate-900 font-medium hover:text-blue-600 transition-colors">Dashboard</button>
              {/* <button onClick={() => navigate("/admin/users")} className="text-slate-600 hover:text-slate-900 transition-colors">Users</button> */}
              <button onClick={() => navigate("/admin/loans")} className="text-slate-600 hover:text-slate-900 transition-colors">Loans</button>
              <button onClick={() => navigate("/admin/reports")} className="text-slate-600 hover:text-slate-900 transition-colors">Audit Log</button>
              <button onClick={() => navigate("/admin/models")} className="text-slate-600 hover:text-slate-900 transition-colors">Models</button>
            </nav>
            <Button
              onClick={() => {
                logout();
              }}
              variant="outline"
              className="border-blue-600 text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 font-semibold"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-6 sm:px-8 md:px-12 lg:px-16 py-10 flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <div className="flex items-end justify-between mb-3">
              <div>
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
                {adminLoanType && <p className="text-blue-600 font-medium text-sm mt-2">Managing: {loanTypeLabels[adminLoanType] || adminLoanType}</p>}
              </div>
              {loading && <p className="text-slate-500 text-sm">Updating...</p>}
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">Real-time overview of your loan application portfolio</p>
          </div>

          {/* Key Metrics Section */}
          <div className="mb-12">
            <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-widest mb-5 pl-1">Application Status</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {keyMetrics.map((stat, index) => (
                <div
                  key={index}
                  className="group relative bg-white border border-slate-200 rounded-lg p-6 hover:border-slate-300 hover:shadow-sm transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">{stat.title}</p>
                      <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                    </div>
                    <div className={`${stat.bgColor} p-2.5 rounded-md`}>
                      <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Metrics Section */}
          <div>
            <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-widest mb-5 pl-1">Financial Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {financialMetrics.map((stat, index) => (
                <div
                  key={index}
                  className="group relative bg-white border border-slate-200 rounded-lg p-6 hover:border-slate-300 hover:shadow-sm transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">{stat.title}</p>
                      <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                    </div>
                    <div className={`${stat.bgColor} p-3 rounded-md`}>
                      <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Application Details Modal */}

    </div>
  );
}
