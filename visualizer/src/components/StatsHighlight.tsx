"use client";

import { motion } from "framer-motion";

export default function StatsHighlight({ className = "" }: { className?: string }) {
  const stats = [
    { label: "Classes", value: "50", sub: "ESC-50" },
    { label: "Latency", value: "~3.2s", sub: "on 30s clip" },
    { label: "Params", value: "21.3M", sub: "convolutional neural network" },
    { label: "Accuracy", value: "88%", sub: "val set" },
  ];

  return (
    <div className={className}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
        className="rounded-3xl border border-orange-200/50 bg-white/50 p-6 shadow-xl backdrop-blur"
      >
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((s, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className="rounded-2xl border border-rose-200/50 bg-gradient-to-br from-rose-50/70 via-amber-50/70 to-orange-50/70 p-4 text-center"
            >
              <div className="font-playfair text-3xl text-rose-700">{s.value}</div>
              <div className="font-crimson text-sm text-gray-600">{s.label}</div>
              <div className="font-crimson text-xs text-gray-500">{s.sub}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}


