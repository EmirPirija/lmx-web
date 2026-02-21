"use client";

import { formatDateMonthYear, t } from "@/utils";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CurrentLanguageData } from "@/redux/reducer/languageSlice";
import NoData from "@/components/EmptyStates/NoData";
import TransactionSkeleton from "@/components/Skeletons/TransactionSkeleton";
import { paymentTransactionApi } from "@/utils/api";
import { toast } from "@/utils/toastBs";
import Pagination from "@/components/Common/Pagination";
import UploadReceiptModal from "./UploadReceiptModal";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import {
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Upload,
  CreditCard,
  Receipt,
  Calendar,
  Hash,
  ChevronRight,
  Loader2,
} from "@/components/Common/UnifiedIconPack";

// ============================================
// COMPONENTS
// ============================================

function StatusBadge({ status }) {
  const configs = {
    succeed: { icon: CheckCircle, text: "Završeno", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    pending: { icon: Clock, text: "Na čekanju", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    failed: { icon: XCircle, text: "Neuspješno", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    "under review": { icon: AlertCircle, text: "Na pregledu", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  };

  const config = configs[status] || { icon: AlertCircle, text: status, color: "bg-slate-100 text-slate-700" };
  const Icon = config.icon;

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold", config.color)}>
      <Icon size={14} />
      {config.text}
    </span>
  );
}

function TransactionCard({ transaction, onUploadReceipt }) {
  const isPending = transaction?.payment_status === "pending" && transaction?.payment_gateway === "BankTransfer";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 p-5 hover:border-primary/30 transition-all"
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Icon */}
        <div className="shrink-0 hidden lg:flex">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Receipt size={24} className="text-white" />
          </div>
        </div>

        {/* Main Info */}
        <div className="flex-1 min-w-0 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
              <Hash size={12} />
              ID
            </div>
            <div className="font-bold text-slate-900 dark:text-white">#{transaction?.id}</div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
              <CreditCard size={12} />
              {"Način plaćanja"}
            </div>
            <div className="font-semibold text-slate-700 dark:text-slate-300">{transaction?.payment_gateway}</div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
              <Calendar size={12} />
              {"Datum"}
            </div>
            <div className="font-semibold text-slate-700 dark:text-slate-300">
              {formatDateMonthYear(transaction?.created_at)}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{"Cijena"}</div>
            <div className="text-lg font-black text-slate-900 dark:text-white">{transaction?.amount}</div>
          </div>
        </div>

        {/* Status / Action */}
        <div className="shrink-0 flex items-center justify-between lg:justify-end gap-3">
          {isPending ? (
            <Button
              onClick={() => onUploadReceipt(transaction?.id)}
              className="gap-2 bg-gradient-to-r from-primary to-orange-500 hover:opacity-90 rounded-xl"
            >
              <Upload size={16} />
              {"Otpremi potvrdu"}
            </Button>
          ) : (
            <StatusBadge status={transaction?.payment_status} />
          )}
        </div>
      </div>

      {/* Transaction ID */}
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 dark:text-slate-400">{"ID transakcije"}</span>
          <span className="font-mono text-slate-700 dark:text-slate-300">{transaction?.order_id}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

const Transactions = () => {
  const CurrentLanguage = useSelector(CurrentLanguageData);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(null);
  const [transactionId, setTransactionId] = useState("");
  const [IsUploadRecipt, setIsUploadRecipt] = useState(false);

  const handleUploadReceipt = (id) => {
    setTransactionId(id);
    setIsUploadRecipt(true);
  };

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const res = await paymentTransactionApi.transaction({ page: currentPage });
      setTotalPages(res.data.data.last_page);
      setCurrentPage(res.data.data.current_page);
      if (res?.data?.error === false) {
        setTransactions(res?.data?.data?.data);
      } else {
        toast.error(res?.data?.message);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    fetchTransactions();
  }, [currentPage]);

  // Loading state
  if (isLoading) {
    return <TransactionSkeleton count={4} />;
  }

  // Empty state
  if (!transactions || transactions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="py-16"
      >
        <NoData name={"Transakcije"} />
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Transactions List */}
      <div className="space-y-4">
        {transactions.map((transaction, index) => (
          <TransactionCard
            key={transaction?.id}
            transaction={transaction}
            onUploadReceipt={handleUploadReceipt}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Upload Receipt Modal */}
      <UploadReceiptModal
        key={IsUploadRecipt}
        IsUploadRecipt={IsUploadRecipt}
        setIsUploadRecipt={setIsUploadRecipt}
        transactionId={transactionId}
        setData={setTransactions}
      />
    </div>
  );
};

export default Transactions;
