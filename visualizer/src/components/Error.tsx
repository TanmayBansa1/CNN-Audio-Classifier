import { motion } from "framer-motion";
import type { AnalysisState } from "~/lib/types";

export default function Error({ analysisState }: { analysisState: AnalysisState }) {
    return (
      <div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="py-12 text-center"
        >
          <div className="relative mx-auto max-w-md">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-200/30 to-rose-200/30 blur-xl"></div>
            <div className="relative rounded-2xl border border-red-300/40 bg-white/70 p-6 shadow-lg backdrop-blur-xl">
              <div className="mb-3 flex items-center space-x-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-400">
                  <span className="text-sm text-white">!</span>
                </div>
                <h3 className="font-playfair text-lg font-medium text-red-700">
                  Analysis Failed
                </h3>
              </div>
              <p className="font-crimson text-sm text-red-600">
                {analysisState.error}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
}