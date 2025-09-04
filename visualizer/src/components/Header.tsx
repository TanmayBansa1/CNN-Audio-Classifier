import { motion } from "framer-motion";
import Image from "next/image";

export default function Header() {
    return (
      <div>
        <header className="relative z-10 border-b border-orange-200/30 bg-white/40 shadow-sm backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="flex items-center space-x-4"
              >
                <div className="relative">
                  <div className="absolute inset-0 animate-pulse rounded-2xl bg-gradient-to-r from-rose-300 to-orange-400 opacity-60 blur-lg"></div>
                  <div className="relative rounded-2xl bg-gradient-to-br from-rose-400 to-orange-400 p-1 shadow-lg">
                    <Image
                      src="/logo.png"
                      alt="SunoAI"
                      width={56}
                      height={56}
                      className="rounded-xl"
                      priority
                    />
                  </div>
                </div>
                <div>
                  <h1 className="font-playfair bg-gradient-to-r from-rose-700 via-orange-600 to-amber-600 bg-clip-text text-2xl font-medium text-transparent">
                    SunoAI
                  </h1>
                  <p className="font-crimson text-sm text-rose-600/70 italic">
                    Audio CNN Visualizer
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                className="text-right"
              >
                <a href="https://github.com/karolpiczak/ESC-50/tree/master/audio" target="_blank" rel="noopener noreferrer">
                  <div className="rounded-xl border border-orange-200/50 bg-white/60 px-4 py-2 shadow-sm backdrop-blur-sm">
                    <p className="text-xs font-medium text-orange-700">
                      50 Audio Classes
                    </p>
                    <p className="text-xs text-rose-600/60">ESC-50 Dataset</p>
                  </div>
                </a>
              </motion.div>
            </div>
          </div>
        </header>
      </div>
    );
}