import { useState, useEffect } from "react";
import { 
  CreditCard, Calendar, AlertCircle, CheckCircle2, 
  Hourglass, Ban, Info, DollarSign, X, Shield
} from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { apiClient } from "../services/apiClient";

const TIMELINE_STAGES = [
  "Applied", "Under Review", "Approved", "Disbursed", "Ongoing", "Completed"
];

const getStatusStageIndex = (status: string) => {
  switch (status) {
    case "Approved": return 2;
    case "Ongoing": return 4;
    case "Completed": return 5;
    default: return 0; // Applied / Under Review
  }
};

export function MyLoansPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [filter, setFilter] = useState("All");
  const [selectedLoan, setSelectedLoan] = useState<any | null>(null);
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000/api';

  // Fetch loans from backend
  useEffect(() => {
    const fetchLoans = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔄 Fetching loans from backend...');
        const response = await apiClient.get(`${API_BASE_URL}/loan/my-loans`);

        console.log('📊 Response status:', response.status, response.statusText);

        if (!response.ok) {
          const errorBody = await response.text();
          console.error('❌ Backend error response:', errorBody);
          
          if (response.status === 500) {
            console.error('💥 Server error (500)');
            throw new Error('Backend server error');
          }
          
          throw new Error(`Failed to fetch loans (HTTP ${response.status})`);
        }

        const data = await response.json();
        console.log('✅ Response data:', JSON.stringify(data, null, 2));
        
        if (!data.loans) {
          console.warn('⚠️ No loans array in response');
        }

        // Map backend loans to frontend format
        const loansArray = Array.isArray(data.loans) ? data.loans : [];
        console.log(`📈 Total loans to display: ${loansArray.length}`);
        
        const formattedLoans = loansArray.map((loan: any) => {
          console.log(`  📝 Processing loan: ${loan._id} - Status: ${loan.status}`);
          return {
            id: loan._id,
            loanId: loan._id,
            amount: loan.requestedAmount,
            status: formatStatus(loan.status),
            loanType: loan.loanType,
            riskLevel: loan.aiAnalysis?.riskLevel || 'medium',
            interestRate: loan.aiAnalysis?.suggestedInterestRate || 12.5,
            eligibleAmount: loan.aiAnalysis?.eligibleAmount,
            creditScore: loan.aiAnalysis?.creditScore,
            applicationDate: loan.submittedAt ? new Date(loan.submittedAt).toLocaleDateString() : 'N/A',
            tenure: loan.requestedTenure,
            category: normalizeLoanType(loan.loanType),
            submittedAt: loan.submittedAt,
            backendStatus: loan.status,
            ...loan
          };
        });

        console.log(`✅ Successfully formatted ${formattedLoans.length} loans`);
        setLoans(formattedLoans);
      } catch (err) {
        console.error('❌ Error fetching loans:', err);
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch loans';
        setError(errorMsg);
        setLoans([]);
      } finally {
        setLoading(false);
      }
    };

    console.log('🚀 MyLoansPage useEffect triggered');
    
    // Fetch immediately on mount
    fetchLoans();

    // Set up 5-second refresh interval
    const interval = setInterval(() => {
      console.log('⏱️ 5-second auto-refresh triggered');
      fetchLoans();
    }, 5000);

    // Listen for visibility changes to refresh when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👁️ Page became visible, refreshing loans...');
        fetchLoans();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      console.log('🧹 Cleanup: removing interval and listener');
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [navigate, API_BASE_URL]);

  // Format backend status to frontend display format
  const formatStatus = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pending',
      'auto_approved': 'Approved',
      'under_review': 'Under Review',
      'auto_rejected': 'Rejected',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'accepted': 'Accepted',
      'declined': 'Declined',
      'disbursed': 'Disbursed',
      'closed': 'Closed'
    };
    return statusMap[status] || status;
  };

  // Normalize loan type for display
  const normalizeLoanType = (type: string): string => {
    const typeMap: { [key: string]: string } = {
      'personal': 'Personal',
      'home': 'Home',
      'auto': 'Auto',
      'education': 'Education',
      'business': 'Business',
      'credit_card': 'Credit Card'
    };
    return typeMap[type] || type;
  };

  // Fetch individual loan by ID
  const fetchLoanById = async (loanId: string) => {
    try {
      console.log(`🔍 Fetching loan details for ID: ${loanId}`);

      const response = await apiClient.get(`${API_BASE_URL}/loan/my-loans/${loanId}`);

      if (!response.ok) {
        console.error(`❌ Failed to fetch loan (${response.status})`);
        return null;
      }

      const data = await response.json();
      console.log(`✅ Loan details fetched:`, data.loan);

      return data.loan;
    } catch (err) {
      console.error('❌ Error fetching loan details:', err);
      return null;
    }
  };

  // Handle loan card click - fetch fresh details by ID
  const handleLoanClick = async (loan: any) => {
    console.log(`👆 Loan card clicked: ${loan.id}`);
    
    // First show the card data immediately for responsiveness
    setSelectedLoan(loan);
    
    // Then fetch fresh details by ID in background
    const freshLoan = await fetchLoanById(loan.id);
    if (freshLoan) {
      const formattedLoan = {
        id: freshLoan._id,
        loanId: freshLoan._id,
        amount: freshLoan.requestedAmount,
        status: formatStatus(freshLoan.status),
        loanType: freshLoan.loanType,
        riskLevel: freshLoan.aiAnalysis?.riskLevel || 'medium',
        interestRate: freshLoan.aiAnalysis?.suggestedInterestRate || 12.5,
        eligibleAmount: freshLoan.aiAnalysis?.eligibleAmount,
        creditScore: freshLoan.aiAnalysis?.creditScore,
        applicationDate: freshLoan.submittedAt ? new Date(freshLoan.submittedAt).toLocaleDateString() : 'N/A',
        tenure: freshLoan.requestedTenure,
        category: normalizeLoanType(freshLoan.loanType),
        submittedAt: freshLoan.submittedAt,
        backendStatus: freshLoan.status,
        ...freshLoan
      };
      // Update with fresh data
      setSelectedLoan(formattedLoan);
      console.log(`✅ Updated selected loan with fresh data`);
    }
  };

  const filteredLoans = filter === "All" 
    ? loans 
    : loans.filter(loan => loan.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved": return "bg-green-100 text-green-700 border-green-300";
      case "Rejected": return "bg-red-100 text-red-700 border-red-300";
      case "Ongoing": return "bg-blue-100 text-blue-700 border-blue-300";
      case "Completed": return "bg-slate-100 text-slate-700 border-slate-300";
      default: return "bg-amber-100 text-amber-700 border-amber-300";
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Low": return "text-green-600";
      case "Medium": return "text-amber-600";
      case "High": return "text-red-600";
      default: return "text-slate-600";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm flex-shrink-0 sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("https://github.com")}>
              <img src="/images/download.png" alt="Barclays Logo" className="w-6 h-6 object-contain" />
              <span className="font-serif font-bold text-xl text-slate-900 tracking-wide uppercase">CREDIT</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <button onClick={() => navigate("/apply-loan")} className="text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium">Apply For Loan</button>
              <button className="text-blue-600 font-semibold border-b-2 border-blue-600 pb-[2px] text-sm">My Loans</button>
            </nav>
            <Button
              onClick={() => {
                logout();
              }}
              variant="outline"
              className="border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 bg-white text-xs h-8 px-4 rounded-md"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1">
        
        {/* Sub Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white tracking-wide">Loan History Tracking</h1>
          <Button onClick={() => navigate("/apply-loan")} className="bg-[#00AEEF] hover:bg-[#009bcf] text-white font-bold rounded-md px-5 shadow-[0_0_15px_rgba(0,174,239,0.3)] text-xs h-9">
            Apply For Loan
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
          {["All", "Approved", "Ongoing", "Completed", "Rejected"].map((btn) => (
            <button
              key={btn}
              onClick={() => setFilter(btn)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all whitespace-nowrap ${
                filter === btn 
                  ? "bg-[#00AEEF] text-white border-[#00AEEF] shadow-[0_0_10px_rgba(0,174,239,0.3)]" 
                  : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
              }`}
            >
              {btn}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-slate-600 text-sm">Loading your loans...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Error loading loans</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredLoans.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center border border-slate-300">
              <Hourglass className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">No loans found</h3>
            <p className="text-slate-600 text-sm max-w-sm">You haven't applied for any {filter !== 'All' ? filter.toLowerCase() : ''} loans yet.</p>
            <Button onClick={() => navigate("/apply-loan")} className="bg-blue-600 hover:bg-blue-700 text-white mt-2">Apply Now</Button>
          </div>
        )}

        {/* Loans Grid */}
        {!loading && !error && filteredLoans.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLoans.map((loan) => (
            <div 
              key={loan.id} 
              onClick={() => handleLoanClick(loan)}
              className="bg-white border border-slate-300 rounded-2xl p-6 hover:shadow-md hover:border-blue-600 cursor-pointer transition-all duration-300 shadow-sm group flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs text-slate-600 tracking-wider">ID: {loan.id}</span>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">{loan.category} Loan</h3>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(loan.status)}`}>
                    {loan.status}
                  </span>
                </div>

                <div className="py-2">
                  <span className="text-xs text-slate-600 block">Loan Amount</span>
                  <span className="text-2xl font-black text-slate-900 tracking-tight">₹{loan.amount.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-200 flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Calendar className="w-3.5 h-3.5" />
                  {loan.applicationDate}
                </div>
                <div>
                  <span className="text-slate-600 mr-1">Risk:</span>
                  <span className={`font-bold ${getRiskColor(loan.riskLevel)}`}>{loan.riskLevel}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}

        {/* Details Modal / Sidebar overlay */}
        {selectedLoan && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-white h-full border-l border-slate-200 shadow-2xl p-6 md:p-8 overflow-y-auto flex flex-col animate-in slide-in-from-right duration-300">
              
              {/* Top Close */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-blue-600 tracking-wide uppercase">Loan Details</span>
                </div>
                <button onClick={() => setSelectedLoan(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-600 hover:text-slate-900" />
                </button>
              </div>

              <div className="flex-1 space-y-6 pt-6">
                
                {/* ID & Status */}
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">{selectedLoan.category}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Application ID: {selectedLoan.id}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(selectedLoan.status)}`}>
                    {selectedLoan.status}
                  </span>
                </div>

                {/* TIMELINE TIMELINE */}
                {selectedLoan.status !== "Rejected" && (
                  <div className="border border-slate-200 bg-gradient-to-br from-slate-50 to-white rounded-xl p-5 space-y-4">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Stage Timeline</h4>
                    <div className="relative pt-2">
                      <div className="absolute top-4 left-0 right-0 h-1 bg-slate-400 rounded-full" />
                      <div 
                        className="absolute top-4 left-0 h-1 bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)] rounded-full transition-all duration-1000" 
                        style={{ width: `${(getStatusStageIndex(selectedLoan.status) / (TIMELINE_STAGES.length - 1)) * 100}%` }}
                      />
                      <div className="flex justify-between relative z-10">
                        {TIMELINE_STAGES.map((stage, idx) => {
                          const currentStageIdx = getStatusStageIndex(selectedLoan.status);
                          const isCompleted = idx <= currentStageIdx;
                          const isCurrent = idx === currentStageIdx;

                          return (
                            <div key={idx} className="flex flex-col items-center">
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all shadow-sm ${
                                isCompleted 
                                  ? "bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]" 
                                  : "bg-white border-2 border-slate-300"
                              } ${isCurrent ? "ring-4 ring-blue-200" : ""}`} />
                              <span className={`text-[10px] mt-2 font-semibold ${isCurrent ? "text-blue-600" : isCompleted ? "text-slate-700" : "text-slate-400"}`}>
                                {stage}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Dynamic Configuration per Status */}
                
                {/* 1. ONGOING / APPROVED */}
                {(selectedLoan.status === "Ongoing" || selectedLoan.status === "Approved") && (
                  <>
                    <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-xl p-5 space-y-4">
                      {selectedLoan.status === "Ongoing" && (
                        <div>
                          <p className="text-xs text-slate-600 font-medium">Repayment Progress</p>
                          <div className="flex justify-between items-end mt-2">
                            <span className="text-lg font-bold text-slate-900">₹{selectedLoan.paidAmount.toLocaleString()} <span className="text-xs font-normal text-slate-500">paid</span></span>
                            <span className="text-sm font-bold text-blue-600">{Math.round((selectedLoan.paidAmount / selectedLoan.totalPayable) * 100)}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 rounded-full mt-2 overflow-hidden border border-slate-300">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-700" 
                              style={{ width: `${(selectedLoan.paidAmount / selectedLoan.totalPayable) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 text-sm divide-x divide-blue-300">
                        <div>
                          <p className="text-xs text-slate-600 font-medium">Loan Amount</p>
                          <p className="text-lg font-bold text-slate-900 mt-1">₹{selectedLoan.amount.toLocaleString()}</p>
                        </div>
                        <div className="pl-4">
                          <p className="text-xs text-slate-600 font-medium">Monthly EMI</p>
                          <p className="text-lg font-bold text-blue-600 mt-1">₹{selectedLoan.emi.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 bg-white border border-slate-200 rounded-xl p-5">
                      <div className="flex justify-between text-sm"><span className="text-slate-600 font-medium">Start Date</span><span className="text-slate-900 font-semibold">{selectedLoan.startDate || "-"}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-slate-600 font-medium">Tenure</span><span className="text-slate-900 font-semibold">{selectedLoan.tenure || "N/A"}</span></div>
                      <div className="flex justify-between text-sm border-t border-slate-200 pt-3"><span className="text-slate-600 font-medium">Interest Rate</span><span className="text-slate-900 font-semibold">{selectedLoan.interestRate}% p.a.</span></div>
                      <div className="flex justify-between text-sm"><span className="text-slate-600 font-medium">Total Payable</span><span className="text-slate-900 font-semibold">₹{selectedLoan.totalPayable.toLocaleString()}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-slate-600 font-medium">Remaining Balance</span><span className="text-slate-900 font-semibold">₹{selectedLoan.remainingAmount.toLocaleString()}</span></div>
                      <div className="flex justify-between text-sm border-t border-slate-200 pt-3"><span className="text-slate-600 font-medium">Next Due Date</span><span className="text-green-600 font-bold">{selectedLoan.nextDueDate}</span></div>
                      {selectedLoan.missedPayments > 0 && <div className="flex justify-between text-sm"><span className="text-slate-600 font-medium">Missed Payments</span><span className="text-red-600 font-bold">{selectedLoan.missedPayments} times</span></div>}
                    </div>

                    {selectedLoan.terms && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2"><Info className="w-4 h-4 text-blue-600" /> Terms & Conditions</h5>
                        <p className="text-xs text-slate-600 leading-relaxed">{selectedLoan.terms}</p>
                      </div>
                    )}

                    {selectedLoan.status === "Ongoing" && (
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-lg shadow-[0_4px_12px_rgba(37,99,235,0.3)] transition-all">
                        Pay Next EMI
                      </Button>
                    )}
                  </>
                )}

                {/* 2. REJECTED */}
                {selectedLoan.status === "Rejected" && (
                  <div className="space-y-6">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-4">
                      <Ban className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-base font-bold text-red-700">Application Rejected</h4>
                        <p className="text-sm text-slate-600 mt-1 leading-relaxed">Reason: {selectedLoan.rejectionReason}</p>
                      </div>
                    </div>
                    
                    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                      <div className="flex justify-between text-sm"><span className="text-slate-600 font-medium">Requested Amount</span><span className="text-slate-900 font-semibold">₹{selectedLoan.amount.toLocaleString()}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-slate-600 font-medium">Application Date</span><span className="text-slate-900 font-semibold">{selectedLoan.applicationDate}</span></div>
                    </div>

                    <Button onClick={() => navigate("/apply-loan")} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 rounded-lg transition-all">
                      Apply Again
                    </Button>
                  </div>
                )}

                {/* 3. COMPLETED */}
                {selectedLoan.status === "Completed" && (
                  <div className="space-y-6">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-start gap-4">
                      <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-base font-bold text-green-700">Loan Fully Repaid</h4>
                        <p className="text-sm text-slate-600 mt-1">This loan has been closed on absolute terms without any outstanding dues.</p>
                      </div>
                    </div>

                    <div className="space-y-3 bg-white border border-slate-200 rounded-xl p-5">
                      <div className="flex justify-between text-sm"><span className="text-slate-600 font-medium">Original Amount</span><span className="text-slate-900 font-semibold">₹{selectedLoan.amount.toLocaleString()}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-slate-600 font-medium">Interest Rate</span><span className="text-slate-900 font-semibold">{selectedLoan.interestRate}% p.a.</span></div>
                      <div className="flex justify-between text-sm"><span className="text-slate-600 font-medium">Start Date</span><span className="text-slate-900 font-semibold">{selectedLoan.startDate || "-"}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-slate-600 font-medium">Close Date</span><span className="text-slate-900 font-semibold">{selectedLoan.endDate || "-"}</span></div>
                      <div className="flex justify-between text-sm border-t border-slate-200 pt-3"><span className="text-slate-600 font-medium">Tenure</span><span className="text-slate-900 font-semibold">{selectedLoan.tenure || "N/A"}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-slate-600 font-medium">Total Magnitude Paid</span><span className="text-green-600 font-bold">₹{selectedLoan.totalPayable.toLocaleString()}</span></div>
                    </div>
                  </div>
                )}

              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
