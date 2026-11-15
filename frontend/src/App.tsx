import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { MainLayout } from './layouts/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { HeadOfficeDashboardPage } from './pages/HeadOfficeDashboardPage';
import { BranchManagementPage } from './pages/BranchManagementPage';
import { EmployeeManagementPage } from './pages/EmployeeManagementPage';
import { CustomerManagementPage } from './pages/CustomerManagementPage';
import { BankAccountManagementPage } from './pages/BankAccountManagementPage';
import { CashierDeskPage } from './pages/CashierDeskPage';
import { BranchCashManagementPage } from './pages/BranchCashManagementPage';
import { FundTransferPage } from './pages/FundTransferPage';
import { LoanDeskPage } from './pages/LoanDeskPage';
import { TermDepositPage } from './pages/TermDepositPage';
import { ApprovalCenterPage } from './pages/ApprovalCenterPage';
import { AuditCompliancePage } from './pages/AuditCompliancePage';
import { AccountingGeneralLedgerPage } from './pages/AccountingGeneralLedgerPage';
import { TransactionReconciliationPage } from './pages/TransactionReconciliationPage';
import { RegulatoryLiquidityPage } from './pages/RegulatoryLiquidityPage';
import { ComplianceAmlPage } from './pages/ComplianceAmlPage';
import { CustomerPortalPage } from './pages/CustomerPortalPage';
import { PlaceholderModulePage } from './pages/PlaceholderModulePage';

const RootRedirect: React.FC = () => {
  const { user } = useAuth();
  if (user?.roles?.includes('CUSTOMER')) {
    return <Navigate to="/customer-portal" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Authenticated Routes with Banking Layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<RootRedirect />} />
              <Route path="/dashboard" element={<HeadOfficeDashboardPage />} />
              <Route path="/customer-portal" element={<CustomerPortalPage />} />

              {/* Organization Modules */}
              <Route path="/branches" element={<BranchManagementPage />} />
              <Route
                path="/branches/comparison"
                element={
                  <PlaceholderModulePage
                    moduleName="Branch Performance Analytics"
                    description="Cross-branch comparative benchmarking for deposits, advances, and audit compliance."
                    targetPhase="PHASE 2"
                    keyFeatures={[
                      'Deposit-to-Advance ratio comparison charts',
                      'Non-Performing Asset (NPA) percentages by branch',
                      'Counter transaction velocity benchmarks',
                      'Regional compliance audit scorecard ratings',
                    ]}
                  />
                }
              />
              <Route path="/employees" element={<EmployeeManagementPage />} />

              {/* Customer & Account Modules */}
              <Route path="/customers" element={<CustomerManagementPage />} />
              <Route path="/accounts" element={<BankAccountManagementPage />} />

              {/* Counter Transactions & Cash Management */}
              <Route path="/cashier" element={<BranchCashManagementPage />} />
              <Route path="/branch-cash" element={<BranchCashManagementPage />} />
              <Route path="/deposits" element={<CashierDeskPage />} />
              <Route path="/withdrawals" element={<CashierDeskPage />} />
              <Route path="/transfers" element={<FundTransferPage />} />

              {/* Credit & Treasury */}
              <Route path="/loans" element={<LoanDeskPage />} />
              <Route path="/deposits/term" element={<TermDepositPage />} />

              {/* Governance, Accounting & Audit */}
              <Route path="/regulatory" element={<RegulatoryLiquidityPage />} />
              <Route path="/liquidity" element={<RegulatoryLiquidityPage />} />
              <Route path="/accounting" element={<AccountingGeneralLedgerPage />} />
              <Route path="/reconciliation" element={<TransactionReconciliationPage />} />
              <Route path="/approvals" element={<ApprovalCenterPage />} />
              <Route path="/compliance" element={<ComplianceAmlPage />} />
              <Route path="/aml" element={<ComplianceAmlPage />} />
              <Route path="/audit" element={<AuditCompliancePage />} />
              <Route
                path="/settings"
                element={
                  <PlaceholderModulePage
                    moduleName="Core Institutional Parameters"
                    description="System-wide security limits, interest rates, and banking business rules."
                    targetPhase="PHASE 7"
                    keyFeatures={[
                      'Statutory CRR & SLR reserve ratio calibration',
                      'Default savings & loan base lending rates (MCLR)',
                      'Maker-checker threshold amount configuration',
                      'Security password complexity and session expiry policies',
                    ]}
                  />
                }
              />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
