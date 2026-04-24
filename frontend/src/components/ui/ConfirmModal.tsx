import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
}

export function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, isPending }: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={isPending ? undefined : onCancel}
      />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-[480px] overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-100">
        <div className="p-5 sm:p-6">
          <div className="flex gap-4">
            <div className="shrink-0 w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mt-0.5">
              <Trash2 size={20} strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <h3 className="text-[19px] font-bold text-gray-900 mb-1">{title}</h3>
              <div className="text-[15px] text-gray-500 leading-relaxed font-medium">
                {message}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="secondary"
              className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl px-6 py-2.5 font-bold text-sm shadow-sm"
              onClick={onCancel}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-6 py-2.5 font-bold text-sm shadow-sm"
              onClick={onConfirm}
              disabled={isPending}
              isLoading={isPending}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
