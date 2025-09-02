import { motion } from "framer-motion";
import { User2Icon } from "lucide-react";


export default function Footer() {
    return (
        <div>

      {/* Footer */}
      <footer className="relative mt-16 py-8 border-t border-white/10">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            {/* Main Text */}
            <div className="text-center">
              <p className="text-lg font-playfair font-medium bg-gradient-to-r from-gray-700 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                Designed & Developed by{' '}
                <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Tanmay Bansal
                </span>
              </p>
              <p className="text-sm font-crimson text-gray-500 mt-1">
                Audio Classification with Deep Learning
              </p>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-6">
              <motion.a
                href="https://github.com/TanmayBansa1"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="group relative"
                >
                <div className="absolute inset-0 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full blur-lg opacity-0 group-hover:opacity-60 transition-opacity duration-300"></div>
                <div className="relative w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 group-hover:bg-white/30 transition-all duration-300">
                  <svg className="w-5 h-5 text-gray-700 group-hover:text-gray-900 transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </div>
              </motion.a>

              <motion.a
                href="https://x.com/K_A_I11"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="group relative"
                >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full blur-lg opacity-0 group-hover:opacity-60 transition-opacity duration-300"></div>
                <div className="relative w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 group-hover:bg-white/30 transition-all duration-300">
                  <svg className="w-5 h-5 text-blue-600 group-hover:text-blue-800 transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
              </motion.a>
              <motion.a
                href="https://tanmay.space"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="group relative"
                >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full blur-lg opacity-0 group-hover:opacity-60 transition-opacity duration-300"></div>
                <div className="relative w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 group-hover:bg-white/30 transition-all duration-300">
                <User2Icon />
                </div>
              </motion.a>
            </div>

            {/* Copyright */}
            <div className="text-xs font-crimson text-gray-400 text-center">
              <p>© 2025 Tanmay Bansal. Built with Next.js, PyTorch & Modal.</p>
            </div>
          </div>
        </div>
      </footer>
                  </div>
    )
}