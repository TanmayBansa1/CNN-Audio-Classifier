"use client";

import { motion } from "framer-motion";

export default function CTA({ onClick, className = "" }: { onClick?: () => void; className?: string }) {
  return (
    <div className={className}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl border border-rose-200/60 bg-gradient-to-r from-rose-100/80 via-amber-100/80 to-orange-100/80 p-6 shadow-xl backdrop-blur"
      >
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-rose-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-orange-300/30 blur-3xl" />
        <div className="relative flex flex-col items-center justify-center">
          <h3 className="font-playfair text-2xl text-rose-700">Ready to hear what the model hears?</h3>
          <p className="font-crimson mt-1 text-sm text-gray-600">Upload an audio clip and explore spectrograms, feature maps, and predictions.</p>
          <div className="mt-4">
            <button
              onClick={onClick}
              className="rounded-xl border border-orange-300/60 bg-gradient-to-r from-rose-400 to-orange-400 px-4 py-2 font-crimson text-white shadow hover:opacity-95"
            >
              Try it now
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}


