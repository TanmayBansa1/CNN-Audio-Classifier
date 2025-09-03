'use client'
import { motion } from "framer-motion";
import HeroModel from "./HeroModel";

export default function Hero() {
    return (
      <div>
        {/* Hero Section */}
        <div className="mb-16">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left Column - Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-left"
            >
              <div className="mb-6 inline-flex items-center rounded-full border border-rose-300/40 bg-gradient-to-r from-rose-200/40 to-orange-200/40 px-4 py-2 backdrop-blur-sm">
                <span className="font-crimson text-sm text-rose-700">
                  🎵 AI-Powered Audio Analysis
                </span>
              </div>
              <h2 className="font-playfair mb-6 text-4xl leading-tight font-medium md:text-5xl xl:text-6xl">
                <span className="bg-gradient-to-r from-rose-800 via-orange-700 to-amber-700 bg-clip-text text-transparent">
                  Don&apos;t just hear it
                </span>
                <br />
                <span className="bg-gradient-to-r from-orange-700 via-rose-700 to-pink-700 bg-clip-text text-transparent italic">
                  Listen to It!
                </span>
              </h2>

              <p className="font-crimson mb-8 max-w-2xl text-lg leading-relaxed text-gray-700 md:text-xl">
                Upload your audio file to witness{" "}
                <span className="bg-gradient-to-r from-rose-600 to-orange-600 bg-clip-text font-semibold text-transparent italic">
                  real-time CNN feature maps
                </span>
                , interactive spectrograms, and intelligent classification
                results from our refined{" "}
                <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text font-semibold text-transparent italic">
                  ResNet-based audio classifier
                </span>
                .
              </p>

              <div className="flex flex-wrap gap-6 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></div>
                  <span className="font-crimson">Real-time Processing</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-rose-500 delay-200"></div>
                  <span className="font-crimson">CNN Visualization</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-orange-500 delay-400"></div>
                  <span className="font-crimson">50 Audio Classes</span>
                </div>
              </div>
            </motion.div>

            {/* Right Column - 3D Model */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              className="h-[400px] w-full md:h-[500px] lg:h-[600px]"
            >
              <HeroModel />
            </motion.div>
          </div>
        </div>
      </div>
    );
}