import { useState, useEffect } from "react";
import { Search, X, CreditCard, FileText } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { apiClient } from "../services/apiClient";

const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000/api';

export function AdminLoanApplications() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [selectedLoan, setSelectedLoan] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [approvalData, setApprovalData] = useState({
    approvedAmount: 0,
    interestRate: 12.5,
    tenure: 60,
    notes: ''
  });
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [explainability, setExplainability] = useState<any | null>(null);
  const [explainabilityLoading, setExplainabilityLoading] = useState(false);

  useEffect(() => {
    fetchLoans();
    
    const interval = setInterval(() => {
      fetchLoans();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchLoans = async () => {
    try {
      console.log('🔄 [Admin] Fetching loans from backend...');
      const response = await apiClient.get(`${API_BASE_URL}/admin/my-loans`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ [Admin] Fetched ${data.loans?.length || 0} loans`);
        const loansData = (data.loans || data.data?.loans || []).map((loan: any, index: number) => {
          // Extract user details from populated userId field
          const userDetails = loan.userId || {};
          const userName = userDetails.fullName || userDetails.name || 'Unknown User';
          const userPhone = userDetails.phone || 'N/A';
          const userEmail = userDetails.email || 'N/A';
          const creditScore = userDetails.creditScore || 'N/A';
          
          return {
            id: loan._id,
            name: userName,
            phone: userPhone,
            email: userEmail,
            creditScore: creditScore,
            userId: userDetails._id,
            category: loan.loanType,
            loanAmount: loan.requestedAmount,
            tenure: loan.requestedTenure,
            status: loan.status,
            riskLevel: ((loan.aiAnalysis?.riskLevel || 'unknown') as string).charAt(0).toUpperCase() + ((loan.aiAnalysis?.riskLevel || 'unknown') as string).slice(1),
            riskScore: loan.aiAnalysis?.creditScore || 600,
            defaultProb: loan.features?.probabilityOfDefault ?? 0,
            interest: loan.aiAnalysis?.suggestedInterestRate ?? 0,
            decidedAmount: loan.aiAnalysis?.eligibleAmount ?? 0,
            decision: loan.features?.decision === 'Approve' ? 'APPROVE' : loan.features?.decision === 'Reject' ? 'REJECT' : 'REVIEW',
            isUserSubmitted: true,
            location: 'India',
            purpose: loan.purpose,
            rawLoan: loan,
            customDetails: {
              "Loan Type": loan.loanType,
              "Amount": `₹${(loan.requestedAmount / 100000).toFixed(1)}L`,
              "Tenure": `${loan.requestedTenure} months`,
              "Purpose": loan.purpose,
              "Eligible Amount": `₹${(loan.aiAnalysis?.eligibleAmount / 100000).toFixed(1)}L`,
              "Suggested Rate": `${loan.aiAnalysis?.suggestedInterestRate}% p.a.`,
              "Decision": loan.features?.decision || 'Hold',
              "Default Probability": loan.features?.probabilityOfDefault != null ? `${(loan.features.probabilityOfDefault * 100).toFixed(1)}%` : 'N/A',
              "Pre-screen": loan.features?.preScreenStatus || 'N/A',
              "Decision Reason": loan.features?.decisionReason || 'N/A'
            }
          };
        });
        setLoans(loansData);
        console.log(`📊 [Admin] Formatted ${loansData.length} loans`);
      }
    } catch (error) {
      console.error('❌ [Admin] Error fetching loans:', error);
      setLoans([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch individual loan by ID (fresh data)
  const fetchLoanById = async (loanId: string) => {
    try {
      console.log(`🔍 [Admin] Fetching loan details for ID: ${loanId}`);

      // Prefer admin-scoped endpoint; fallback to user route for backward compatibility.
      let response = await apiClient.get(`${API_BASE_URL}/admin/my-loans/${loanId}`);

      if (!response.ok && (response.status === 404 || response.status === 405)) {
        console.warn(`⚠️ [Admin] Admin loan-by-id endpoint unavailable, falling back to user route (${response.status})`);
        response = await apiClient.get(`${API_BASE_URL}/loan/my-loans/${loanId}`);
      }

      if (!response.ok) {
        console.error(`❌ [Admin] Failed to fetch loan (${response.status})`);
        return null;
      }

      const data = await response.json();
      console.log(`✅ [Admin] Loan details fetched`, data.loan);

      return data.loan;
    } catch (err) {
      console.error('❌ [Admin] Error fetching loan details:', err);
      return null;
    }
  };

  const fetchExplainability = async (loanId: string) => {
    try {
      setExplainabilityLoading(true);
      const response = await apiClient.get(`${API_BASE_URL}/admin/loans/${loanId}/explainability`);
      if (!response.ok) {
        setExplainability(null);
        return;
      }
      const data = await response.json();
      setExplainability(data.explainability || null);
    } catch (error) {
      setExplainability(null);
    } finally {
      setExplainabilityLoading(false);
    }
  };

  // Handle loan row click - fetch fresh details by ID
  const handleLoanClick = async (index: number, loanId: string) => {
    console.log(`👆 [Admin] Loan row clicked: ${loanId} (index: ${index})`);
    
    // Immediately select the loan for UI responsiveness
    setSelectedLoan(index);
    setExplainability(null);
    void fetchExplainability(loanId);
    
    // Fetch fresh details by ID in background
    const freshLoan = await fetchLoanById(loanId);
    if (freshLoan) {
      // Update the loan in the list with fresh data
      const userDetails = freshLoan.userId || {};
      const updatedLoan = {
        id: freshLoan._id,
        name: userDetails.fullName || userDetails.name || 'Unknown User',
        phone: userDetails.phone || 'N/A',
        email: userDetails.email || 'N/A',
        creditScore: userDetails.creditScore || 'N/A',
        userId: userDetails._id,
        category: freshLoan.loanType,
        loanAmount: freshLoan.requestedAmount,
        tenure: freshLoan.requestedTenure,
        status: freshLoan.status,
        riskLevel: ((freshLoan.aiAnalysis?.riskLevel || 'unknown') as string).charAt(0).toUpperCase() + ((freshLoan.aiAnalysis?.riskLevel || 'unknown') as string).slice(1),
        riskScore: freshLoan.aiAnalysis?.creditScore || 600,
        defaultProb: freshLoan.features?.probabilityOfDefault ?? 0,
        interest: freshLoan.aiAnalysis?.suggestedInterestRate ?? 0,
        decidedAmount: freshLoan.aiAnalysis?.eligibleAmount ?? 0,
        decision: freshLoan.features?.decision === 'Approve' ? 'APPROVE' : freshLoan.features?.decision === 'Reject' ? 'REJECT' : 'REVIEW',
        isUserSubmitted: true,
        location: 'India',
        purpose: freshLoan.purpose,
        rawLoan: freshLoan,
        customDetails: {
          "Loan Type": freshLoan.loanType,
          "Amount": `₹${(freshLoan.requestedAmount / 100000).toFixed(1)}L`,
          "Tenure": `${freshLoan.requestedTenure} months`,
          "Purpose": freshLoan.purpose,
          "Eligible Amount": `₹${(freshLoan.aiAnalysis?.eligibleAmount / 100000).toFixed(1)}L`,
          "Suggested Rate": `${freshLoan.aiAnalysis?.suggestedInterestRate}% p.a.`,
          "Decision": freshLoan.features?.decision || 'Hold',
          "Default Probability": freshLoan.features?.probabilityOfDefault != null ? `${(freshLoan.features.probabilityOfDefault * 100).toFixed(1)}%` : 'N/A',
          "Pre-screen": freshLoan.features?.preScreenStatus || 'N/A',
          "Decision Reason": freshLoan.features?.decisionReason || 'N/A'
        }
      };
      
      // Update loan in list
      const updatedLoans = [...loans];
      updatedLoans[index] = updatedLoan;
      setLoans(updatedLoans);
      console.log(`✅ [Admin] Updated loan with fresh data`);
    }
  };

  const filteredApplications = filterStatus === "All"
    ? loans.filter(app =>
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
    : loans.filter(app => {
      const statusMap: {[key: string]: string} = {
        'Pending': 'under_review',
        'Approved': 'approved',
        'Rejected': 'rejected'
      };
      return statusMap[filterStatus] === app.status &&
        (app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.category.toLowerCase().includes(searchTerm.toLowerCase()))
    });

  const loan = selectedLoan !== null ? loans[selectedLoan] : null;

  const getStatusCount = (status: string) => {
    const statusMap: {[key: string]: string} = {
      'All': '',
      'Pending': 'under_review',
      'Approved': 'approved',
      'Rejected': 'rejected'
    };
    
    if (status === "All") return loans.length;
    const targetStatus = statusMap[status];
    return loans.filter(app => app.status === targetStatus).length;
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Low":
        return "text-green-400";
      case "Medium":
        return "text-yellow-400";
      case "High":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case "APPROVE":
        return "text-green-400 font-bold text-2xl";
      case "REJECT":
        return "text-red-400 font-bold text-2xl";
      case "REVIEW":
        return "text-yellow-400 font-bold text-2xl";
      default:
        return "text-gray-400 font-bold text-2xl";
    }
  };

  const handleApprove = () => {
    if (selectedLoan !== null && loans[selectedLoan]) {
      const loanAmount = loans[selectedLoan].loanAmount;
      setApprovalData({
        approvedAmount: loanAmount,
        interestRate: loans[selectedLoan].rawLoan?.aiAnalysis?.suggestedInterestRate || 12.5,
        tenure: loans[selectedLoan].tenure || 60,
        notes: ''
      });
      setApprovalModalOpen(true);
    }
  };

  const handleReject = () => {
    if (selectedLoan !== null) {
      setRejectionReason('');
      setRejectionModalOpen(true);
    }
  };

  const submitApproval = async () => {
    if (selectedLoan === null) return;
    
    const loanId = loans[selectedLoan].id;
    setActionLoading(true);
    
    try {
      const response = await apiClient.patch(`${API_BASE_URL}/admin/loans/${loanId}/approve`, approvalData);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Loan approved:', data);
        setApprovalModalOpen(false);
        // Refresh loan list
        await fetchLoans();
        setSelectedLoan(null);
        // Also refresh dashboard data
        window.dispatchEvent(new Event('loanStatusChanged'));
      } else {
        const error = await response.json();
        alert(`Error approving loan: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error approving loan:', error);
      alert('Error approving loan. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const submitRejection = async () => {
    if (selectedLoan === null) return;
    
    const loanId = loans[selectedLoan].id;
    setActionLoading(true);
    
    try {
      const response = await apiClient.patch(`${API_BASE_URL}/admin/loans/${loanId}/reject`, { rejectionReason });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Loan rejected:', data);
        setRejectionModalOpen(false);
        // Refresh loan list
        await fetchLoans();
        setSelectedLoan(null);
        // Also refresh dashboard data
        window.dispatchEvent(new Event('loanStatusChanged'));
      } else {
        const error = await response.json();
        alert(`Error rejecting loan: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error rejecting loan:', error);
      alert('Error rejecting loan. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      <style>{`
        html {
          scrollbar-gutter: stable;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Modern Glassmorphic Header */}
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
              <button onClick={() => navigate("/admin/loans")} className="text-slate-900 font-medium hover:text-blue-600 transition-colors">Loans</button>
              <button onClick={() => navigate("/admin/reports")} className="text-slate-600 hover:text-slate-900 transition-colors">Audit Log</button>
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
      <main className="flex-1 flex overflow-hidden max-w-full">
        {/* Left Panel - Loans Table */}
        <div className={`transition-all duration-300 border-r border-slate-200 overflow-hidden flex flex-col min-w-0 ${selectedLoan !== null ? 'w-full lg:w-3/5' : 'w-full'}`}>
          <div className="p-8 space-y-6 flex flex-col h-full overflow-hidden">
            {/* Header with Title and Search */}
            <div className="flex justify-between items-center gap-6 flex-shrink-0">
              <h1 className="text-3xl font-bold text-slate-900 flex-shrink-0">Loan Applications</h1>
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-600" />
                <input
                  type="text"
                  placeholder="Search by name or ID"
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Filter Tabs - Single Row */}
            <div className="flex gap-3 items-center flex-wrap flex-shrink-0">
              {["All", "Pending", "Approved", "Rejected"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${filterStatus === status
                      ? "bg-blue-500 text-white"
                      : "bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10"
                    }`}
                >
                  {status} ({getStatusCount(status)})
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto hide-scrollbar bg-white border border-slate-200 rounded-2xl relative">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-20 bg-slate-50 shadow-sm border-b border-slate-200">
                  <tr>
                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-700 uppercase whitespace-nowrap">User</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-700 uppercase whitespace-nowrap">Category</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-700 uppercase whitespace-nowrap">Loan Amount</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-700 uppercase whitespace-nowrap">Tenure</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-700 uppercase whitespace-nowrap">EMI</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-700 uppercase whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredApplications.map((loanApp, idx) => (
                    <tr
                      key={loanApp.id}
                      onClick={() => handleLoanClick(loans.findIndex(l => l.id === loanApp.id), loanApp.id)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-200"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-xs">{loanApp.name.charAt(0)}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">{loanApp.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600 whitespace-nowrap">{loanApp.category}</td>
                      <td className="py-4 px-6 text-sm font-semibold text-slate-900 whitespace-nowrap">
                        {loanApp.loanAmount ? `₹${(loanApp.loanAmount / 1000).toFixed(0)},000` : "₹0"}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600 whitespace-nowrap">{loanApp.tenure || "0"} months</td>
                      <td className="py-4 px-6 text-sm font-semibold text-slate-900 whitespace-nowrap">
                        {loanApp.rawLoan?.aiAnalysis?.suggestedInterestRate 
                          ? `₹${Math.round((loanApp.loanAmount * (loanApp.rawLoan.aiAnalysis.suggestedInterestRate / 100 / 12)) / (1 - Math.pow(1 + (loanApp.rawLoan.aiAnalysis.suggestedInterestRate / 100 / 12), -loanApp.tenure)))}` 
                          : "₹0"}
                      </td>
                      <td className="py-4 px-6 text-sm whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded text-xs font-bold ${
                          loanApp.status === 'approved'
                            ? 'bg-green-500/20 text-green-400'
                            : loanApp.status === 'under_review'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : loanApp.status === 'rejected'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {loanApp.status === 'under_review' ? 'Pending' : 
                           loanApp.status === 'approved' ? 'Approved' :
                           loanApp.status === 'rejected' ? 'Rejected' :
                           loanApp.status.charAt(0).toUpperCase() + loanApp.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Panel - Loan Details (Conditional) */}
        {loan && selectedLoan !== null && (
          <div className="hidden lg:flex lg:w-2/5 flex-col bg-white border-l border-slate-200 hide-scrollbar overflow-y-auto max-h-screen min-w-0">
            <div className="p-4 space-y-3 flex-1 w-full overflow-x-hidden">
              {/* Close Button */}
              <div className="flex justify-end mb-2 sticky top-0 z-20\">
                <button onClick={() => setSelectedLoan(null)} className="text-slate-600 hover:text-slate-900 transition-colors p-2 flex-shrink-0">
                  <X className="w-5 h-5\" />
                </button>
              </div>

              {/* User Profile - Compact */}
              <div className="py-1">
                <h2 className="text-3xl font-bold text-slate-900">{loan.name}</h2>
                <div className="flex justify-between text-base font-semibold text-slate-700 mt-2">
                  <span>{loan.category}</span>
                  <span>📍 {loan.location}</span>
                </div>
                
                {/* User Contact Details */}
                <div className="mt-4 bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">📧 Email:</span>
                    <span className="text-slate-900 font-medium">{loan.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">📱 Phone:</span>
                    <span className="text-slate-900 font-medium">{loan.phone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">💳 Credit Score:</span>
                    <span className="text-slate-900 font-bold text-lg">{loan.creditScore}</span>
                  </div>
                </div>
              </div>

              {/* Risk Score */}
              <div className="flex items-center gap-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div>
                  <p className="text-4xl font-bold text-blue-600">{loan.riskScore}</p>
                </div>
                <div>
                  <p className={`text-sm font-semibold ${getRiskColor(loan.riskLevel)}`}>
                    {loan.riskLevel} Risk
                  </p>
                  <p className="text-xs text-slate-600">Default: {(loan.defaultProb * 100).toFixed(1)}%</p>
                </div>
              </div>

              {/* Loan Details */}
              <div className="bg-white rounded-lg p-3 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 uppercase mb-3">Loan Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Requested Amount</span>
                    <span className="text-slate-900 font-semibold">₹{loan.loanAmount?.toLocaleString() || "0"}</span>
                  </div>
                  {loan.decision !== "REJECT" && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Suggested Amount</span>
                        <span className="text-green-600 font-semibold">₹{loan.decidedAmount?.toLocaleString() || "0"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Interest Rate (p.a.)</span>
                        <span className="text-amber-600 font-semibold">{loan.interest}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Loan Tenure</span>
                        <span className="text-slate-900 font-semibold">{loan.tenure} months</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Explainability */}
              <div className="bg-white rounded-lg p-3 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 uppercase mb-3">Model Explainability</h3>
                {explainabilityLoading ? (
                  <p className="text-sm text-slate-500">Loading explainability...</p>
                ) : explainability ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Model Version</span>
                      <span className="text-slate-900 font-semibold">{explainability.modelVersion || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Probability of Default</span>
                      <span className="text-slate-900 font-semibold">{explainability.probabilityOfDefault != null ? `${(Number(explainability.probabilityOfDefault) * 100).toFixed(1)}%` : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Risk Level</span>
                      <span className="text-slate-900 font-semibold">{explainability.riskLevel || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Scoring Source</span>
                      <span className="text-slate-900 font-semibold">{loan.rawLoan?.features?.scoringSource || explainability?.decisionSummary?.scoringSource || 'N/A'}</span>
                    </div>
                    {Array.isArray(explainability.explanationSummary) && explainability.explanationSummary.length > 0 && (
                      <div className="pt-2 border-t border-slate-200">
                        <p className="text-xs font-semibold text-slate-700 mb-2 uppercase">Reasoning</p>
                        <ul className="space-y-1 text-xs text-slate-600 list-disc list-inside">
                          {explainability.explanationSummary.map((item: string, idx: number) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Explainability is unavailable for this loan.</p>
                )}
              </div>
                           {/* User Application Data */}
              {loan.isUserSubmitted ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h3 className="text-sm font-bold text-blue-900 uppercase mb-3 text-center">Submitted Application Details</h3>
                  <div className="space-y-3 text-sm">
                    {loan.customDetails && Object.entries(loan.customDetails).map(([key, val], idx) => (
                      <div key={idx} className="flex justify-between border-b border-blue-200 pb-2">
                        <span className="text-slate-600 font-medium">{key}</span>
                        <span className="text-slate-900 font-bold text-right pl-4">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900 uppercase mb-3">Eligibility Profile</h3>
                  <div className="space-y-2 text-sm text-center text-slate-600 italic py-4">
                    Mock applicant data structure shown.
                  </div>
                </div>
              )}

              {/* Uploaded Documents */}
              {loan.submittedDocs && loan.submittedDocs.length > 0 && (
                <div className="bg-[#1e1e2d] rounded-lg p-3 border border-white/10 mt-3 pt-4">
                  <h3 className="text-sm font-bold text-emerald-400 uppercase mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Attached Documents
                  </h3>
                  <div className="space-y-2">
                    {loan.submittedDocs.map((doc: string, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-sm bg-black/40 p-2.5 rounded border border-white/5 hover:border-emerald-500/30 transition-colors group">
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-gray-500 group-hover:text-emerald-400" />
                          <span className="text-gray-200 truncate w-[160px] font-medium">{doc}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // In a real app this opens a modal or new tab, here we alert
                            alert(`Opening document viewer for: ${doc}`);
                          }}
                          className="h-7 text-xs border-emerald-500/40 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all bg-emerald-500/10 px-3"
                        >
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}           



              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button onClick={handleApprove} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 text-sm">
                  Approve
                </Button>
                <Button onClick={handleReject} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 text-sm">
                  Reject
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Approval Modal */}
      {approvalModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Approve Loan</h2>
              <button onClick={() => setApprovalModalOpen(false)} className="text-slate-600 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {loan && (
              <div className="text-sm text-slate-600 mb-4">
                <p><span className="font-semibold">Applicant:</span> {loan.name}</p>
                <p><span className="font-semibold">Requested Amount:</span> ₹{(loan.loanAmount / 100000).toFixed(1)}L</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Approved Amount (₹)</label>
                <input
                  type="number"
                  value={approvalData.approvedAmount}
                  onChange={(e) => setApprovalData({...approvalData, approvedAmount: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Interest Rate (% p.a.)</label>
                <input
                  type="number"
                  step="0.1"
                  value={approvalData.interestRate}
                  onChange={(e) => setApprovalData({...approvalData, interestRate: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tenure (months)</label>
                <input
                  type="number"
                  value={approvalData.tenure}
                  onChange={(e) => setApprovalData({...approvalData, tenure: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={approvalData.notes}
                  onChange={(e) => setApprovalData({...approvalData, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                onClick={() => setApprovalModalOpen(false)}
                variant="outline"
                className="border-slate-200 text-slate-700 hover:bg-slate-50"
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={submitApproval}
                className="bg-green-500 hover:bg-green-600 text-white"
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : 'Confirm Approval'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectionModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Reject Loan</h2>
              <button onClick={() => setRejectionModalOpen(false)} className="text-slate-600 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {loan && (
              <div className="text-sm text-slate-600 mb-4">
                <p><span className="font-semibold">Applicant:</span> {loan.name}</p>
                <p><span className="font-semibold">Loan Type:</span> {loan.category}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Rejection Reason</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide a reason for rejection..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                rows={4}
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                onClick={() => setRejectionModalOpen(false)}
                variant="outline"
                className="border-slate-200 text-slate-700 hover:bg-slate-50"
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={submitRejection}
                className="bg-red-500 hover:bg-red-600 text-white"
                disabled={actionLoading || !rejectionReason.trim()}
              >
                {actionLoading ? 'Processing...' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
