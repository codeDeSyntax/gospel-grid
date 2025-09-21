import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, X } from "lucide-react";

interface PresetSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (presetName: string) => void;
  selectedWindowsCount: number;
}

export const PresetSaveModal: React.FC<PresetSaveModalProps> = ({
  isOpen,
  onClose,
  onSave,
  selectedWindowsCount,
}) => {
  const [presetName, setPresetName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!presetName.trim()) return;

    setIsLoading(true);
    try {
      await onSave(presetName.trim());
      setPresetName("");
      onClose();
    } catch (error) {
      console.error("Failed to save preset:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setPresetName("");
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-950/20 backdrop-blur-sm"
          />

          {/* Browser-style search bar with cosmic theme */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.15 }}
            className="absolute top-16 right-8 backdrop-blur-md bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 border border-slate-600/50 rounded-full shadow-lg shadow-blue-500/10 flex items-center overflow-hidden"
          >
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter preset name"
              className="px-4 py-2 text-sm border-none outline-none bg-transparent text-white placeholder-slate-400 min-w-[240px]"
              disabled={isLoading}
              autoFocus
              spellCheck={false}
            />
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="px-3 py-2 hover:bg-slate-700/50 border-l border-slate-600/50 transition-all disabled:opacity-50"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
