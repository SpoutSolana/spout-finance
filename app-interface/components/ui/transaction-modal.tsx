import React from "react";
import { createPortal } from "react-dom";
import { CheckCircle, Loader2, X } from "lucide-react";
import { Button } from "./button";
import Image from "next/image";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: "waiting" | "completed" | "failed";
  transactionType: "buy" | "sell";
  tokenSymbol: string;
  amount: string;
  receivedAmount: string;
  error?: string;
}

export default function TransactionModal({
  isOpen,
  onClose,
  status,
  transactionType,
  tokenSymbol,
  amount,
  receivedAmount,
  error,
}: TransactionModalProps) {
  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-none p-6 w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {status === "waiting" ? "Review swap" : "Transaction Status"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="text-center">
          {status === "waiting" && (
            <>
              <div className="mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Processing Transaction
                </h3>
                <p className="text-gray-600 text-sm">
                  Please wait while your transaction is being processed...
                </p>
              </div>

              {/* Transaction Details */}
              <div className="bg-gray-50 rounded-none p-4 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {transactionType === "buy" ? (
                      <Image
                        src="/USD.png"
                        alt="USDC"
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    ) : (
                      <Image
                        src="/SLQD.png"
                        alt={`S${tokenSymbol}`}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    )}
                    <span className="text-gray-700">
                      {transactionType === "buy"
                        ? amount
                        : `${amount} S${tokenSymbol}`}
                    </span>
                  </div>
                  <span className="text-gray-400">→</span>
                  <div className="flex items-center gap-2">
                    {transactionType === "buy" ? (
                      <Image
                        src="/SLQD.png"
                        alt={`S${tokenSymbol}`}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    ) : (
                      <Image
                        src="/USD.png"
                        alt="USDC"
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    )}
                    <span className="text-gray-700">
                      {transactionType === "buy"
                        ? `${receivedAmount} S${tokenSymbol}`
                        : `${receivedAmount} USDC`}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {status === "completed" && (
            <>
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Transaction Completed
                </h3>
                <p className="text-gray-600 text-sm">
                  Your transaction has been successfully processed
                </p>
              </div>

              {/* Transaction Details */}
              <div className="bg-gray-50 rounded-none p-4 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {transactionType === "buy" ? (
                      <Image
                        src="/USD.png"
                        alt="USDC"
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    ) : (
                      <Image
                        src="/SLQD.png"
                        alt={`S${tokenSymbol}`}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    )}
                    <span className="text-gray-700">
                      {transactionType === "buy"
                        ? amount
                        : `${amount} S${tokenSymbol}`}
                    </span>
                  </div>
                  <span className="text-gray-400">→</span>
                  <div className="flex items-center gap-2">
                    {transactionType === "buy" ? (
                      <Image
                        src="/SLQD.png"
                        alt={`S${tokenSymbol}`}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    ) : (
                      <Image
                        src="/USD.png"
                        alt="USDC"
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    )}
                    <span className="text-gray-700">
                      {transactionType === "buy"
                        ? `${receivedAmount} S${tokenSymbol}`
                        : `${receivedAmount} USDC`}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {status === "failed" && (
            <>
              <div className="mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Transaction Failed
                </h3>
                <p className="text-gray-600 text-sm">
                  {error || "Transaction timed out. Please try again."}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Action Button */}
        <div className="flex gap-3">
          {status === "completed" && (
            <Button
              onClick={onClose}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              Close
            </Button>
          )}
          {status === "failed" && (
            <>
              <Button onClick={onClose} variant="outline" className="flex-1">
                Close
              </Button>
              <Button
                onClick={() => window.location.reload()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Try Again
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // Use portal to render at document body level
  if (typeof window !== "undefined") {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}
