import React, { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { getSalaryHistory, downloadPayslip, downloadPayslipPdf, getApiBaseUrl } from '@/services/api';
import { SalaryRecord, SalaryStatus } from '@/types';
import { Download, FileText, AlertCircle, Eye, X } from 'lucide-react';

const SalaryHistory: React.FC = () => {
  const [history, setHistory] = useState<SalaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadingPayslip, setDownloadingPayslip] = useState<string | null>(null);
  const [viewingRecord, setViewingRecord] = useState<SalaryRecord | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Helper to extract month in YYYY-MM format
  const getMonthFromRecord = (record: SalaryRecord): string => {
    if (record.id.includes('-')) {
      return record.id;
    }
    const monthNum = new Date(`${record.month} 1, ${record.year}`).getMonth() + 1;
    return `${record.year}-${String(monthNum).padStart(2, '0')}`;
  };

  const handleViewReport = async (record: SalaryRecord) => {
    // Check if salary is on HOLD
    if (record.status === SalaryStatus.HOLD) {
      setPdfError('Salary is on HOLD. Please contact HR for more information.');
      return;
    }

    try {
      setLoadingPdf(true);
      setPdfError(null);
      setViewingRecord(record);

      const month = getMonthFromRecord(record);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      const apiUrl = getApiBaseUrl();
      const fullUrl = `${apiUrl}/employee/salary/pdf?month=${month}`;
      
      console.log('[SalaryHistory] Fetching PDF from:', fullUrl);

      const response = await fetch(fullUrl, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        method: 'GET',
      });

      if (response.status === 401) {
        localStorage.clear();
        window.location.href = '/login';
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to load PDF' }));
        throw new Error(error.message || error.error || 'Failed to load payslip');
      }

      // Check if response is JSON (error response)
      const contentType = response.headers.get('Content-Type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        if (errorData.status === 'HOLD') {
          throw new Error(`Salary is on HOLD. ${errorData.holdReason ? `Reason: ${errorData.holdReason}` : 'Please contact HR.'}`);
        }
        if (errorData.status === 'NOT_GENERATED' || errorData.status === 'NOT_FINALIZED') {
          throw new Error('Salary not finalized yet. Please contact HR.');
        }
        throw new Error(errorData.message || 'Failed to load payslip');
      }

      // Response is PDF - create blob URL
      const blob = await response.blob();
      
      // Check if blob is actually a PDF (not an error response)
      if (blob.type && !blob.type.includes('pdf') && blob.size < 100) {
        // Might be an error response, try to parse as text
        const text = await blob.text();
        try {
          const error = JSON.parse(text);
          throw new Error(error.message || error.error || 'Failed to load payslip');
        } catch {
          throw new Error('Invalid response from server');
        }
      }
      
      const url = URL.createObjectURL(blob);
      
      // Revoke previous URL if exists
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
      
      setPdfUrl(url);
    } catch (err) {
      console.error('Failed to load payslip:', err);
      
      // Handle network errors with better messages
      let errorMessage = 'Failed to load payslip';
      if (err instanceof Error) {
        if (err.name === 'TypeError' && err.message.includes('fetch')) {
          errorMessage = 'Network error: Unable to connect to server. Please check your connection and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setPdfError(errorMessage);
      setPdfUrl(null);
    } finally {
      setLoadingPdf(false);
    }
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getSalaryHistory();
        
        console.log('[SalaryHistory] Fetched data:', data);
        
        if (!data || data.length === 0) {
          setError('No salary records found. Salary history will appear here once your salary is finalized.');
          setHistory([]);
          return;
        }
        
        // Sort by year and month (latest first)
        const sortedData = [...data].sort((a, b) => {
          const dateA = new Date(`${a.month} 1, ${a.year}`);
          const dateB = new Date(`${b.month} 1, ${b.year}`);
          return dateB.getTime() - dateA.getTime();
        });
        
        setHistory(sortedData);
        
        // Auto-load latest salary report if available
        if (sortedData.length > 0) {
          const latestRecord = sortedData[0];
          if (latestRecord.status !== SalaryStatus.HOLD) {
            // Delay auto-load slightly to avoid blocking initial render
            setTimeout(() => {
              handleViewReport(latestRecord);
            }, 500);
          }
        }
      } catch (err) {
        console.error('Failed to fetch salary history:', err);
        setError(err instanceof Error ? err.message : 'Failed to load salary history');
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup PDF URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const handleCloseViewer = () => {
    setViewingRecord(null);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    setPdfError(null);
  };

  const handleDownload = async (record: SalaryRecord) => {
    // Check if salary is on HOLD - show message but don't block UI
    if (record.status === SalaryStatus.HOLD) {
      alert('Salary is on HOLD. Please contact HR for more information.');
      return;
    }

    try {
      setDownloading(record.id);
      const month = getMonthFromRecord(record);
      await downloadPayslip(month);
    } catch (err) {
      console.error('Failed to download payslip:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to download payslip';
      alert(errorMessage);
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadPayslip = async (record: SalaryRecord) => {
    // Check if salary is on HOLD - show message but don't block UI
    if (record.status === SalaryStatus.HOLD) {
      alert('Salary is on HOLD. Please contact HR for more information.');
      return;
    }

    try {
      setDownloadingPayslip(record.id);
      const month = getMonthFromRecord(record);
      await downloadPayslipPdf(month);
    } catch (err) {
      console.error('Failed to download payslip:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to download payslip';
      alert(errorMessage);
    } finally {
      setDownloadingPayslip(null);
    }
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Earnings Ledger</h1>
          {/* <p className="text-slate-400 font-semibold tracking-wide">Detailed audit of all historical disbursements.</p> */}
        </div>
        {/* <div className="flex space-x-3">
           <Button variant="secondary" size="md">
             <SlidersHorizontal size={18} className="mr-2" />
             Analytical View
           </Button>
           <Button variant="primary" size="md">
             Inquire Finance
           </Button>
        </div> */}
      </div>

      {error && (
        <div className="bg-rose-50/50 backdrop-blur-xl border border-rose-100 rounded-[2.5rem] p-6 flex items-center space-x-6 shadow-sm">
          <div className="p-4 bg-rose-500 rounded-3xl text-white shadow-xl shadow-rose-200">
            <AlertCircle size={24} strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-black text-rose-900 uppercase tracking-[0.1em] mb-1">Error Loading Data</h4>
            <p className="text-sm text-rose-700 font-semibold opacity-80">{error}</p>
          </div>
        </div>
      )}

      <Card className="!px-0 !py-0 border-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/40 backdrop-blur-md border-b border-slate-100">
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Billing Cycle</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Base Allocation</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Net Realized</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">State</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Report</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Payslip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-10 py-8">
                        <div className="h-5 bg-slate-100 rounded-xl w-full"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-10 py-12 text-center">
                    <p className="text-slate-400 font-semibold">No salary records found</p>
                  </td>
                </tr>
              ) : (
                history.map((record) => (
                  <tr key={record.id} className="hover:bg-indigo-50/30 transition-all group">
                    <td className="px-10 py-8">
                      <p className="text-lg font-black text-slate-900">{record.month} {record.year}</p>
                    </td>
                    <td className="px-10 py-8">
                      <p className="text-base font-bold text-slate-500">₹{Math.round(record.grossSalary).toLocaleString()}</p>
                    </td>
                    <td className="px-10 py-8">
                      <p className="text-xl font-black text-indigo-600">₹{Math.round(record.netSalary).toLocaleString()}</p>
                    </td>
                    <td className="px-10 py-8">
                      <Badge variant={record.status === SalaryStatus.PAID ? 'success' : 'danger'}>
                        {record.status}
                      </Badge>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => handleViewReport(record)}
                          disabled={record.status === SalaryStatus.HOLD || loadingPdf}
                          className={`inline-flex items-center text-xs font-black uppercase tracking-widest transition-all ${
                            record.status === SalaryStatus.HOLD 
                              ? 'text-slate-300 cursor-not-allowed' 
                              : loadingPdf
                              ? 'text-slate-400 cursor-wait'
                              : 'text-indigo-500 hover:text-indigo-700 hover:scale-105'
                          }`}
                        >
                          <Eye size={16} className="mr-2" />
                          {loadingPdf && viewingRecord?.id === record.id ? 'Loading...' : 'View'}
                        </button>
                        <button
                          onClick={() => handleDownload(record)}
                          disabled={record.status === SalaryStatus.HOLD || downloading === record.id}
                          className={`inline-flex items-center text-xs font-black uppercase tracking-widest transition-all ${
                            record.status === SalaryStatus.HOLD 
                              ? 'text-slate-300 cursor-not-allowed' 
                              : downloading === record.id
                              ? 'text-slate-400 cursor-wait'
                              : 'text-indigo-500 hover:text-indigo-700 hover:scale-105'
                          }`}
                        >
                          <Download size={16} className="mr-2" />
                          {downloading === record.id ? 'Downloading...' : 'Download'}
                        </button>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <button
                        onClick={() => handleDownloadPayslip(record)}
                        disabled={record.status === SalaryStatus.HOLD || downloadingPayslip === record.id}
                        className={`inline-flex items-center text-xs font-black uppercase tracking-widest transition-all ${
                          record.status === SalaryStatus.HOLD 
                            ? 'text-slate-300 cursor-not-allowed' 
                            : downloadingPayslip === record.id
                            ? 'text-slate-400 cursor-wait'
                            : 'text-indigo-500 hover:text-indigo-700 hover:scale-105'
                        }`}
                      >
                        <Download size={16} className="mr-2" />
                        {downloadingPayslip === record.id ? 'Downloading...' : 'Download'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Salary Report Viewer */}
      {(viewingRecord || pdfUrl || pdfError) && (
        <Card className="border-none">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-indigo-600 text-white rounded-3xl shadow-xl shadow-indigo-100">
                <FileText size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  {viewingRecord ? `${viewingRecord.month} ${viewingRecord.year} Salary Report` : 'Salary Report'}
                </h3>
                {viewingRecord && (
                  <p className="text-sm text-slate-500 font-semibold mt-1">
                    Net Salary: ₹{Math.round(viewingRecord.netSalary).toLocaleString()} • 
                    Gross Salary: ₹{Math.round(viewingRecord.grossSalary).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleCloseViewer}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              aria-label="Close viewer"
            >
              <X size={20} />
            </button>
          </div>

          {loadingPdf && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto"></div>
                <p className="text-slate-500 font-semibold">Loading salary report...</p>
              </div>
            </div>
          )}

          {pdfError && (
            <div className="bg-rose-50/50 backdrop-blur-xl border border-rose-100 rounded-[2.5rem] p-6 flex items-center space-x-6 shadow-sm">
              <div className="p-4 bg-rose-500 rounded-3xl text-white shadow-xl shadow-rose-200">
                <AlertCircle size={24} strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-black text-rose-900 uppercase tracking-[0.1em] mb-1">Error Loading Report</h4>
                <p className="text-sm text-rose-700 font-semibold opacity-80">{pdfError}</p>
              </div>
            </div>
          )}

          {pdfUrl && !loadingPdf && !pdfError && (
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
              <iframe
                src={pdfUrl}
                className="w-full"
                style={{ height: '800px', border: 'none' }}
                title={`Salary Report - ${viewingRecord?.month} ${viewingRecord?.year}`}
              />
            </div>
          )}
        </Card>
      )}

      {/* Latest Salary Report Section - Always visible if there's a latest record */}
      {history.length > 0 && !viewingRecord && (
        <Card className="border-none">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-indigo-600 text-white rounded-3xl shadow-xl shadow-indigo-100">
                <FileText size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Latest Salary Report</h3>
                <p className="text-sm text-slate-500 font-semibold mt-1">
                  {history[0].month} {history[0].year} • 
                  Net Salary: ₹{Math.round(history[0].netSalary).toLocaleString()}
                </p>
              </div>
            </div>
            {history[0].status !== SalaryStatus.HOLD && (
              <button
                onClick={() => handleViewReport(history[0])}
                disabled={loadingPdf}
                className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white text-sm font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Eye size={18} className="mr-2" />
                {loadingPdf ? 'Loading...' : 'View Report'}
              </button>
            )}
          </div>
          {history[0].status === SalaryStatus.HOLD && (
            <div className="bg-amber-50/50 backdrop-blur-xl border border-amber-100 rounded-[2.5rem] p-6">
              <p className="text-sm text-amber-700 font-semibold">
                Latest salary report is on HOLD. Please contact HR for more information.
              </p>
            </div>
          )}
        </Card>
      )}

      {/* <div className="bg-white/40 backdrop-blur-3xl border border-white rounded-[2.5rem] p-10 flex items-start space-x-8 shadow-sm">
        <div className="p-6 bg-indigo-600 text-white rounded-3xl shadow-xl shadow-indigo-100">
          <FileText size={32} strokeWidth={2.5} />
        </div>
        <div className="space-y-3">
          <h4 className="text-xl font-black text-slate-900 tracking-tight">Compliance & Policy Overview</h4>
          <p className="text-sm text-slate-500 font-bold leading-relaxed opacity-80 max-w-3xl">
            System generated earnings are disbursed on the final operational day of the cycle. 
            Discrepancy reports must be filed within a 48-hour analytical window post-disbursement.
          </p>
          <button className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline">Download Comprehensive Guide</button>
        </div>
      </div> */}
    </div>
  );
};

export default SalaryHistory;
