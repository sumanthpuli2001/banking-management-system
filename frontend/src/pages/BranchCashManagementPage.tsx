import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { ApiResponse } from '../types/auth';
import { Pagination } from '../components/common/Pagination';
import {
  Landmark,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Search,
  RefreshCw,
  Truck,
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight,
  Users,
  Building,
  PlusCircle,
  FileText,
  Lock,
  Unlock,
  CheckCircle2,
  DollarSign
} from 'lucide-react';

interface BranchCashPositionItem {
  branchId: number;
  branchCode: string;
  branchName: string;
  vaultCashBalance: number;
  activeDrawersCount: number;
  totalDrawersCashBalance: number;
  totalBranchCash: number;
  todayReceipts: number;
  todayPayments: number;
  netIntradayMovement: number;
  inTransitIncoming: number;
  inTransitOutgoing: number;
}

interface TellerCashDrawerItem {
  id: number;
  drawerCode: string;
  branchId: number;
  branchName: string;
  cashierUserId?: number;
  cashierUsername: string;
  cashierFullName: string;
  status: 'OPEN' | 'CLOSED' | 'LOCKED';
  openingBalance: number;
  cashReceipts: number;
  cashPayments: number;
  currentBalance: number;
  openedAt: string;
  closedAt?: string;
}

interface CashShortageExcessItem {
  id: number;
  incidentNumber: string;
  branchName: string;
  drawerCode: string;
  cashierUsername: string;
  incidentType: 'SHORTAGE' | 'EXCESS';
  expectedAmount: number;
  physicalAmount: number;
  varianceAmount: number;
  status: 'REPORTED' | 'UNDER_INVESTIGATION' | 'RESOLVED' | 'WRITTEN_OFF';
  investigationNotes?: string;
  resolvedByUsername?: string;
  reportedAt: string;
  resolvedAt?: string;
}

interface InterBranchTransferItem {
  id: number;
  transferNumber: string;
  sourceBranchId: number;
  sourceBranchName: string;
  destinationBranchId: number;
  destinationBranchName: string;
  amount: number;
  status: 'DISPATCHED_IN_TRANSIT' | 'RECEIVED_SETTLED' | 'REJECTED';
  transitCarrier: string;
  securitySealNumber: string;
  dispatchingOfficerUsername: string;
  receivingOfficerUsername?: string;
  dispatchRemarks?: string;
  receiptRemarks?: string;
  dispatchedAt: string;
  receivedAt?: string;
}

const FALLBACK_POSITIONS: BranchCashPositionItem[] = [
  { branchId: 1, branchCode: 'BLR-001', branchName: 'Bangalore MG Road Central', vaultCashBalance: 25000000, activeDrawersCount: 2, totalDrawersCashBalance: 850000, totalBranchCash: 25850000, todayReceipts: 420000, todayPayments: 180000, netIntradayMovement: 240000, inTransitIncoming: 0, inTransitOutgoing: 0 },
  { branchId: 2, branchCode: 'MUM-001', branchName: 'Mumbai Fort Financial District', vaultCashBalance: 35000000, activeDrawersCount: 3, totalDrawersCashBalance: 1200000, totalBranchCash: 36200000, todayReceipts: 650000, todayPayments: 310000, netIntradayMovement: 340000, inTransitIncoming: 0, inTransitOutgoing: 0 },
  { branchId: 3, branchCode: 'DEL-001', branchName: 'Delhi Connaught Place', vaultCashBalance: 30000000, activeDrawersCount: 2, totalDrawersCashBalance: 750000, totalBranchCash: 30750000, todayReceipts: 510000, todayPayments: 220000, netIntradayMovement: 290000, inTransitIncoming: 0, inTransitOutgoing: 0 },
  { branchId: 4, branchCode: 'HYD-001', branchName: 'Hyderabad Financial District', vaultCashBalance: 20000000, activeDrawersCount: 1, totalDrawersCashBalance: 400000, totalBranchCash: 20400000, todayReceipts: 310000, todayPayments: 150000, netIntradayMovement: 160000, inTransitIncoming: 0, inTransitOutgoing: 0 },
  { branchId: 5, branchCode: 'PUN-001', branchName: 'Pune Hinjewadi Corporate', vaultCashBalance: 18000000, activeDrawersCount: 1, totalDrawersCashBalance: 350000, totalBranchCash: 18350000, todayReceipts: 280000, todayPayments: 110000, netIntradayMovement: 170000, inTransitIncoming: 0, inTransitOutgoing: 0 },
];

export const BranchCashManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'POSITIONS' | 'DRAWERS' | 'VARIANCES' | 'TRANSFERS'>('POSITIONS');
  const [loading, setLoading] = useState<boolean>(false);

  // Tab 1: Positions
  const [positions, setPositions] = useState<BranchCashPositionItem[]>(FALLBACK_POSITIONS);

  // Tab 2: Drawers
  const [drawers, setDrawers] = useState<TellerCashDrawerItem[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number>(1);
  const [showOpenDrawerModal, setShowOpenDrawerModal] = useState<boolean>(false);
  const [newDrawerCode, setNewDrawerCode] = useState<string>('DRW-BLR-01');
  const [newDrawerCashierId, setNewDrawerCashierId] = useState<number>(6);
  const [newDrawerInitialCash, setNewDrawerInitialCash] = useState<number>(500000);
  const [openDrawerError, setOpenDrawerError] = useState<string>('');

  // Handover Modal
  const [handoverDrawer, setHandoverDrawer] = useState<TellerCashDrawerItem | null>(null);
  const [handoverPhysicalCount, setHandoverPhysicalCount] = useState<number>(500000);
  const [handoverRemarks, setHandoverRemarks] = useState<string>('');
  const [isVaultReturn, setIsVaultReturn] = useState<boolean>(true);
  const [handoverSubmitting, setHandoverSubmitting] = useState<boolean>(false);
  const [handoverResult, setHandoverResult] = useState<string>('');

  // Tab 3: Variances
  const [variances, setVariances] = useState<CashShortageExcessItem[]>([]);
  const [variancePage, setVariancePage] = useState<number>(1);
  const [variancePageSize, setVariancePageSize] = useState<number>(10);

  // Tab 4: Transfers
  const [transfers, setTransfers] = useState<InterBranchTransferItem[]>([]);
  const [transferPage, setTransferPage] = useState<number>(1);
  const [transferPageSize, setTransferPageSize] = useState<number>(10);
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [sourceBranchId, setSourceBranchId] = useState<number>(1);
  const [destBranchId, setDestBranchId] = useState<number>(2);
  const [transferAmount, setTransferAmount] = useState<number>(1000000);
  const [transitCarrier, setTransitCarrier] = useState<string>('Secure Armored Logistics Ltd');
  const [securitySealNumber, setSecuritySealNumber] = useState<string>('SEAL-789124');
  const [dispatchRemarks, setDispatchRemarks] = useState<string>('Routine liquidity rebalancing transfer');
  const [transferError, setTransferError] = useState<string>('');

  useEffect(() => {
    fetchPositions();
    fetchDrawers(selectedBranchId);
    fetchVariances();
    fetchTransfers();
  }, [selectedBranchId]);

  const fetchPositions = async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<BranchCashPositionItem[]>>('/branch-cash/positions');
      if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setPositions(res.data.data);
      }
    } catch {
      // Keep robust fallback
    } finally {
      setLoading(false);
    }
  };

  const fetchDrawers = async (branchId: number) => {
    try {
      const res = await api.get<ApiResponse<TellerCashDrawerItem[]>>(`/branch-cash/drawers?branchId=${branchId}`);
      if (res.data?.success && Array.isArray(res.data.data)) {
        setDrawers(res.data.data);
      }
    } catch {
      // Keep empty or simulated
    }
  };

  const fetchVariances = async () => {
    try {
      const res = await api.get<ApiResponse<{ content: CashShortageExcessItem[] }>>('/branch-cash/variances?size=50');
      if (res.data?.success && res.data.data?.content) {
        setVariances(res.data.data.content);
      }
    } catch {
      // Keep empty
    }
  };

  const fetchTransfers = async () => {
    try {
      const res = await api.get<ApiResponse<{ content: InterBranchTransferItem[] }>>('/branch-cash/transfers?size=50');
      if (res.data?.success && res.data.data?.content) {
        setTransfers(res.data.data.content);
      }
    } catch {
      // Keep empty
    }
  };

  const handleOpenDrawerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOpenDrawerError('');
    try {
      const res = await api.post<ApiResponse<TellerCashDrawerItem>>('/branch-cash/drawers/open', {
        branchId: selectedBranchId,
        cashierUserId: newDrawerCashierId,
        drawerCode: newDrawerCode,
        initialVaultCashAmount: newDrawerInitialCash,
      });
      if (res.data?.success) {
        setShowOpenDrawerModal(false);
        fetchDrawers(selectedBranchId);
        fetchPositions();
      } else {
        setOpenDrawerError(res.data?.message || 'Failed to open teller drawer');
      }
    } catch (err: any) {
      setOpenDrawerError(err.response?.data?.message || 'Error opening teller drawer');
    }
  };

  const handleHandoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoverDrawer) return;
    setHandoverSubmitting(true);
    setHandoverResult('');
    try {
      const res = await api.post<ApiResponse<CashShortageExcessItem>>('/branch-cash/drawers/handover', {
        drawerId: handoverDrawer.id,
        isVaultReturn: isVaultReturn,
        physicalCountAmount: handoverPhysicalCount,
        handoverRemarks: handoverRemarks,
      });
      if (res.data?.success) {
        setHandoverResult(res.data.message || 'Handover completed successfully');
        setHandoverDrawer(null);
        fetchDrawers(selectedBranchId);
        fetchPositions();
        fetchVariances();
      } else {
        setHandoverResult(res.data?.message || 'Handover failed');
      }
    } catch (err: any) {
      setHandoverResult(err.response?.data?.message || 'Error executing handover');
    } finally {
      setHandoverSubmitting(false);
    }
  };

  const handleInitiateTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError('');
    try {
      const res = await api.post<ApiResponse<InterBranchTransferItem>>('/branch-cash/transfers/initiate', {
        sourceBranchId,
        destinationBranchId: destBranchId,
        amount: transferAmount,
        transitCarrier,
        securitySealNumber,
        dispatchRemarks,
      });
      if (res.data?.success) {
        setShowTransferModal(false);
        fetchTransfers();
        fetchPositions();
      } else {
        setTransferError(res.data?.message || 'Failed to dispatch inter-branch cash transit');
      }
    } catch (err: any) {
      setTransferError(err.response?.data?.message || 'Error dispatching cash transit');
    }
  };

  const handleReceiveTransfer = async (transferId: number) => {
    try {
      const res = await api.post<ApiResponse<InterBranchTransferItem>>(
        `/branch-cash/transfers/${transferId}/receive?receiptRemarks=Armored+delivery+verified.+Seals+inspected+and+cash+vaulted`
      );
      if (res.data?.success) {
        fetchTransfers();
        fetchPositions();
      }
    } catch {
      // Refresh
    }
  };

  const formatDate = (dateVal?: any) => {
    if (!dateVal) return 'Recent';
    try {
      if (Array.isArray(dateVal)) {
        const [y, m, d, h = 0, min = 0] = dateVal;
        const dt = new Date(y, m - 1, d, h, min);
        return isNaN(dt.getTime()) ? 'Recent' : dt.toLocaleString('en-IN');
      }
      const dt = new Date(dateVal);
      return isNaN(dt.getTime()) ? 'Recent' : dt.toLocaleString('en-IN');
    } catch {
      return 'Recent';
    }
  };

  const totalNetworkCash = positions.reduce((s, p) => s + (p.totalBranchCash || 0), 0);
  const totalVaultCash = positions.reduce((s, p) => s + (p.vaultCashBalance || 0), 0);
  const totalTellersCash = positions.reduce((s, p) => s + (p.totalDrawersCashBalance || 0), 0);
  const totalIntradayInflow = positions.reduce((s, p) => s + (p.todayReceipts || 0), 0);

  const paginatedVariances = variances.slice(
    (variancePage - 1) * variancePageSize,
    variancePage * variancePageSize
  );

  const paginatedTransfers = transfers.slice(
    (transferPage - 1) * transferPageSize,
    transferPage * transferPageSize
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
            <span>Branch Operations & Treasury</span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold">Cash Management & Inter-Branch Settlement</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-1 flex items-center gap-3">
            <Landmark className="h-7 w-7 text-emerald-600 shrink-0" />
            Branch Cash Management & Inter-Branch Clearing
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time branch vault monitoring, controlled teller cash drawers, shift handover verification, and armored transit Due-To/Due-From clearing.
          </p>
        </div>

        <button
          onClick={() => {
            fetchPositions();
            fetchDrawers(selectedBranchId);
            fetchVariances();
            fetchTransfers();
          }}
          className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-2 border border-slate-200 shadow-sm transition-all self-start sm:self-auto"
        >
          <RefreshCw className="h-4 w-4 text-emerald-600" /> Refresh Cash Positions
        </button>
      </div>

      {/* Summary KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Total Branch Cash</p>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1 font-sans">
            ₹{totalNetworkCash.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-emerald-600 font-medium">Vaults + Teller Tills across network</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Main Vaults Liquidity</p>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1 font-sans">
            ₹{totalVaultCash.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-slate-500 font-medium">High-security currency vaults</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Active Teller Tills Cash</p>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1 font-sans">
            ₹{totalTellersCash.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-emerald-600 font-medium">Allocated to teller counters</span>
        </div>
        <div className="bg-emerald-900 text-white p-4 rounded-2xl shadow-sm border border-emerald-800">
          <p className="text-[10px] font-bold text-emerald-300 uppercase font-mono">Today's Counter Receipts</p>
          <p className="text-lg font-black text-white mt-1 font-sans flex items-center gap-1.5">
            +₹{totalIntradayInflow.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-emerald-200">Deposits received today</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('POSITIONS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'POSITIONS'
              ? 'bg-emerald-800 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building className="h-4 w-4" /> Branch Cash Positions ({positions.length})
        </button>
        <button
          onClick={() => setActiveTab('DRAWERS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'DRAWERS'
              ? 'bg-emerald-800 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="h-4 w-4" /> Teller Cash Drawers ({drawers.length})
        </button>
        <button
          onClick={() => setActiveTab('VARIANCES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'VARIANCES'
              ? 'bg-emerald-800 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="h-4 w-4" /> Shortage & Excess Logs ({variances.length})
        </button>
        <button
          onClick={() => setActiveTab('TRANSFERS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'TRANSFERS'
              ? 'bg-emerald-800 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Truck className="h-4 w-4" /> Inter-Branch Cash Transit ({transfers.length})
        </button>
      </div>

      {/* TAB 1: BRANCH CASH POSITIONS */}
      {activeTab === 'POSITIONS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-slate-700 uppercase">
                Consolidated Branch Cash Position & Liquidity Matrix
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Total Network Cash: <strong>₹{totalNetworkCash.toLocaleString('en-IN')}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-slate-50/40 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider">
                    <th className="px-5 py-3.5 font-bold font-sans">Branch Node</th>
                    <th className="px-5 py-3.5 font-bold text-right">Vault Cash (₹)</th>
                    <th className="px-5 py-3.5 font-bold text-center">Active Tills</th>
                    <th className="px-5 py-3.5 font-bold text-right">Tellers Cash (₹)</th>
                    <th className="px-5 py-3.5 font-bold text-right">Total Branch Cash (₹)</th>
                    <th className="px-5 py-3.5 font-bold text-right">Today Inflows (₹)</th>
                    <th className="px-5 py-3.5 font-bold text-right">Today Payouts (₹)</th>
                    <th className="px-5 py-3.5 font-bold text-right">Net Intraday (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {positions.map((p) => (
                    <tr key={p.branchId} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900 font-sans">{p.branchName}</div>
                        <div className="text-[11px] text-slate-400">{p.branchCode}</div>
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-slate-900">
                        ₹{Number(p.vaultCashBalance).toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {p.activeDrawersCount} Open
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-slate-800">
                        ₹{Number(p.totalDrawersCashBalance).toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3.5 text-right font-black text-emerald-800">
                        ₹{Number(p.totalBranchCash).toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-emerald-700">
                        +₹{Number(p.todayReceipts).toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-rose-700">
                        -₹{Number(p.todayPayments).toLocaleString('en-IN')}
                      </td>
                      <td className={`px-5 py-3.5 text-right font-bold ${p.netIntradayMovement >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {p.netIntradayMovement >= 0 ? '+' : ''}₹{Number(p.netIntradayMovement).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TELLER CASH DRAWERS */}
      {activeTab === 'DRAWERS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-bold text-slate-600 font-mono">Select Branch:</span>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none"
              >
                {positions.map((b) => (
                  <option key={b.branchId} value={b.branchId}>
                    {b.branchName} ({b.branchCode})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setShowOpenDrawerModal(true);
                setOpenDrawerError('');
              }}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
            >
              <PlusCircle className="h-4 w-4" /> Open Teller Cash Drawer
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider">
                    <th className="px-5 py-3.5 font-bold">Drawer Code</th>
                    <th className="px-5 py-3.5 font-bold font-sans">Assigned Cashier</th>
                    <th className="px-5 py-3.5 font-bold text-right">Opening Cash (₹)</th>
                    <th className="px-5 py-3.5 font-bold text-right">Receipts (₹)</th>
                    <th className="px-5 py-3.5 font-bold text-right">Payments (₹)</th>
                    <th className="px-5 py-3.5 font-bold text-right">Current Till Balance (₹)</th>
                    <th className="px-5 py-3.5 font-bold text-center">Status</th>
                    <th className="px-5 py-3.5 font-bold text-right font-sans">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {drawers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-8 text-center text-slate-400 italic font-sans">
                        No active teller drawers open for this branch. Click "Open Teller Cash Drawer" to assign starting vault cash to a teller counter.
                      </td>
                    </tr>
                  ) : (
                    drawers.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/60 transition">
                        <td className="px-5 py-3.5 font-bold text-emerald-800">{d.drawerCode}</td>
                        <td className="px-5 py-3.5 font-sans">
                          <div className="font-bold text-slate-900">{d.cashierFullName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">@{d.cashierUsername}</div>
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold">
                          ₹{Number(d.openingBalance).toLocaleString('en-IN')}
                        </td>
                        <td className="px-5 py-3.5 text-right text-emerald-700 font-bold">
                          +₹{Number(d.cashReceipts).toLocaleString('en-IN')}
                        </td>
                        <td className="px-5 py-3.5 text-right text-rose-700 font-bold">
                          -₹{Number(d.cashPayments).toLocaleString('en-IN')}
                        </td>
                        <td className="px-5 py-3.5 text-right font-black text-slate-900 text-sm">
                          ₹{Number(d.currentBalance).toLocaleString('en-IN')}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              d.status === 'OPEN'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {d.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right font-sans">
                          {d.status === 'OPEN' && (
                            <button
                              onClick={() => {
                                setHandoverDrawer(d);
                                setHandoverPhysicalCount(d.currentBalance);
                                setHandoverRemarks('End of shift cash verified and returned to vault.');
                              }}
                              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                            >
                              Handover / Close Till
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SHORTAGE & EXCESS LOG */}
      {activeTab === 'VARIANCES' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-slate-700 uppercase">
                Teller Cash Discrepancy & Shortage/Excess Audit Log
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Total Incident Records: <strong>{variances.length}</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-slate-50/40 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider">
                    <th className="px-5 py-3.5 font-bold">Incident #</th>
                    <th className="px-5 py-3.5 font-bold font-sans">Branch & Till</th>
                    <th className="px-5 py-3.5 font-bold">Cashier</th>
                    <th className="px-5 py-3.5 font-bold text-center">Type</th>
                    <th className="px-5 py-3.5 font-bold text-right">Expected (₹)</th>
                    <th className="px-5 py-3.5 font-bold text-right">Physical (₹)</th>
                    <th className="px-5 py-3.5 font-bold text-right">Variance (₹)</th>
                    <th className="px-5 py-3.5 font-bold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedVariances.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-8 text-center text-slate-400 italic font-sans">
                        No cash shortages or excess incidents reported. All teller handovers and vault returns match physical counts with zero discrepancy.
                      </td>
                    </tr>
                  ) : (
                    paginatedVariances.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/60 transition">
                        <td className="px-5 py-3.5 font-bold text-emerald-800">{v.incidentNumber}</td>
                        <td className="px-5 py-3.5 font-sans">
                          <div className="font-bold text-slate-900">{v.branchName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{v.drawerCode}</div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-700">@{v.cashierUsername}</td>
                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              v.incidentType === 'SHORTAGE'
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {v.incidentType}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold">
                          ₹{Number(v.expectedAmount).toLocaleString('en-IN')}
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold">
                          ₹{Number(v.physicalAmount).toLocaleString('en-IN')}
                        </td>
                        <td className="px-5 py-3.5 text-right font-black text-rose-700">
                          ₹{Number(v.varianceAmount).toLocaleString('en-IN')}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            {v.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={variancePage}
              totalItems={variances.length}
              pageSize={variancePageSize}
              onPageChange={setVariancePage}
              onPageSizeChange={setVariancePageSize}
            />
          </div>
        </div>
      )}

      {/* TAB 4: INTER-BRANCH CASH TRANSIT */}
      {activeTab === 'TRANSFERS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Armored Cash Transit & Inter-Branch Clearing (Due-To / Due-From)</h3>
              <p className="text-xs text-slate-500">
                Automated accounting entries posted: Source branch posts Due-From clearing; receiving branch settles vault cash upon physical delivery.
              </p>
            </div>

            <button
              onClick={() => {
                setShowTransferModal(true);
                setTransferError('');
              }}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
            >
              <Truck className="h-4 w-4" /> Dispatch Armored Cash Transit
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider">
                    <th className="px-5 py-3.5 font-bold">Transfer Ref</th>
                    <th className="px-5 py-3.5 font-bold font-sans">Source Branch</th>
                    <th className="px-5 py-3.5 font-bold font-sans">Destination Branch</th>
                    <th className="px-5 py-3.5 font-bold text-right">Transfer Amount (₹)</th>
                    <th className="px-5 py-3.5 font-bold">Armored Carrier & Seal</th>
                    <th className="px-5 py-3.5 font-bold text-center">Status</th>
                    <th className="px-5 py-3.5 font-bold text-right font-sans">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedTransfers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-slate-400 italic font-sans">
                        No inter-branch cash transit shipments recorded yet. Click "Dispatch Armored Cash Transit" to initiate a secure branch rebalancing transfer.
                      </td>
                    </tr>
                  ) : (
                    paginatedTransfers.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/60 transition">
                        <td className="px-5 py-3.5 font-bold text-emerald-800">{t.transferNumber}</td>
                        <td className="px-5 py-3.5 font-sans font-medium text-slate-900">{t.sourceBranchName}</td>
                        <td className="px-5 py-3.5 font-sans font-medium text-slate-900">{t.destinationBranchName}</td>
                        <td className="px-5 py-3.5 text-right font-black text-slate-900 text-sm">
                          ₹{Number(t.amount).toLocaleString('en-IN')}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">
                          <div>{t.transitCarrier}</div>
                          <div className="text-[10px] text-emerald-700 font-bold">{t.securitySealNumber}</div>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              t.status === 'RECEIVED_SETTLED'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-blue-50 text-blue-800 border-blue-200'
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right font-sans">
                          {t.status === 'DISPATCHED_IN_TRANSIT' && (
                            <button
                              onClick={() => handleReceiveTransfer(t.id)}
                              className="px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                            >
                              Confirm Receipt & Settle
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={transferPage}
              totalItems={transfers.length}
              pageSize={transferPageSize}
              onPageChange={setTransferPage}
              onPageSizeChange={setTransferPageSize}
            />
          </div>
        </div>
      )}

      {/* OPEN DRAWER MODAL */}
      {showOpenDrawerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200">
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Unlock className="h-5 w-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-sm">Open Teller Cash Drawer</h3>
              </div>
              <button onClick={() => setShowOpenDrawerModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleOpenDrawerSubmit} className="p-6 space-y-4 text-xs">
              {openDrawerError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-semibold">
                  {openDrawerError}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase font-mono mb-1">
                  Drawer Code
                </label>
                <input
                  type="text"
                  value={newDrawerCode}
                  onChange={(e) => setNewDrawerCode(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase font-mono mb-1">
                  Initial Starting Cash Allocated from Vault (₹)
                </label>
                <input
                  type="number"
                  value={newDrawerInitialCash}
                  onChange={(e) => setNewDrawerInitialCash(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-sm text-emerald-800"
                  required
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowOpenDrawerModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition"
                >
                  Confirm & Open Till
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HANDOVER MODAL */}
      {handoverDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200">
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-sm">Teller Daily Handover & Vault Return</h3>
              </div>
              <button onClick={() => setHandoverDrawer(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleHandoverSubmit} className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Drawer:</span>
                  <span className="font-bold text-slate-900">{handoverDrawer.drawerCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">System Expected:</span>
                  <span className="font-black text-emerald-800 text-sm">₹{Number(handoverDrawer.currentBalance).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase font-mono mb-1">
                  Cashier Physical Currency Count (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  value={handoverPhysicalCount}
                  onChange={(e) => setHandoverPhysicalCount(Number(e.target.value))}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono font-bold text-sm"
                  required
                />
              </div>

              {(() => {
                const diff = handoverPhysicalCount - handoverDrawer.currentBalance;
                return (
                  <div className={`p-3 rounded-xl border font-mono text-xs ${diff === 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                    Difference: {diff === 0 ? '₹0.00 (EXACT MATCH)' : `₹${diff.toLocaleString('en-IN')} (${diff < 0 ? 'SHORTAGE' : 'EXCESS'})`}
                  </div>
                );
              })()}

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase font-mono mb-1">
                  Handover Narration
                </label>
                <input
                  type="text"
                  value={handoverRemarks}
                  onChange={(e) => setHandoverRemarks(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setHandoverDrawer(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={handoverSubmitting}
                  className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {handoverSubmitting ? 'Recording Handover...' : 'Confirm Handover & Return to Vault'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISPATCH TRANSFER MODAL */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200">
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-sm">Dispatch Inter-Branch Cash Shipment</h3>
              </div>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleInitiateTransferSubmit} className="p-6 space-y-4 text-xs font-sans">
              {transferError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-semibold">
                  {transferError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase font-mono mb-1">
                    Dispatching Branch
                  </label>
                  <select
                    value={sourceBranchId}
                    onChange={(e) => setSourceBranchId(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    {positions.map((b) => (
                      <option key={b.branchId} value={b.branchId}>{b.branchName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase font-mono mb-1">
                    Receiving Branch
                  </label>
                  <select
                    value={destBranchId}
                    onChange={(e) => setDestBranchId(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    {positions.filter(b => b.branchId !== sourceBranchId).map((b) => (
                      <option key={b.branchId} value={b.branchId}>{b.branchName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase font-mono mb-1">
                  Cash Shipment Value (₹)
                </label>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black text-sm text-emerald-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase font-mono mb-1">
                    Armored Transit Carrier
                  </label>
                  <input
                    type="text"
                    value={transitCarrier}
                    onChange={(e) => setTransitCarrier(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase font-mono mb-1">
                    Security Seal Number
                  </label>
                  <input
                    type="text"
                    value={securitySealNumber}
                    onChange={(e) => setSecuritySealNumber(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase font-mono mb-1">
                  Dispatch Remarks & Rebalancing Memo
                </label>
                <input
                  type="text"
                  value={dispatchRemarks}
                  onChange={(e) => setDispatchRemarks(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px]">
                <strong>Due-To / Due-From Rule:</strong> Initiating this dispatch immediately deducts the vault of the dispatching branch and creates a Due-From clearing entry against Account 1030-INTER-BRANCH-CLEARING until the receiving branch signs off.
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition"
                >
                  Dispatch Shipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default BranchCashManagementPage;
