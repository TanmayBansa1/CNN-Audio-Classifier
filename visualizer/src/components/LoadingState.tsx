import { motion } from "framer-motion";
import type { AnalysisState } from "~/lib/types";

export default function LoadingState({ analysisState }: { analysisState: AnalysisState }) {
    return (
      <div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="py-16 text-center"
        >
          <div className="relative mx-auto max-w-md">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-rose-300/20 to-orange-300/20 blur-xl"></div>
            <div className="relative rounded-2xl border border-rose-200/50 bg-white/60 p-8 shadow-lg backdrop-blur-xl">
              <div className="flex flex-col items-center space-y-6">
                <div className="relative">
                  <div className="h-16 w-16 animate-spin rounded-full border-4 border-rose-200/40"></div>
                  <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-t-4 border-rose-500"></div>
                </div>
                <div className="text-center">
                  <h3 className="font-playfair mb-2 text-xl font-medium text-rose-800">
                    Analyzing Audio with SunoAI
                  </h3>
                  <p className="font-crimson text-sm text-gray-600 italic">
                    Processing neural network layers...
                  </p>
                </div>
                <div className="w-full space-y-2">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span className="font-crimson">Progress</span>
                    <span className="font-medium">
                      {Math.round(analysisState.progress)}%
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-orange-100/60">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-rose-400 via-orange-400 to-amber-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${analysisState.progress}%` }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
}