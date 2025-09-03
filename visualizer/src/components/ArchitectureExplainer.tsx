"use client";

import { motion } from "framer-motion";

export default function ArchitectureExplainer({ className = "" }: { className?: string }) {
  const items = [
    {
      title: "Mel-Spectrogram Input",
      desc: "We transform raw audio into a 2D time–frequency map that preserves perceptual pitch relationships.",
    },
    {
      title: "Convolutional Layer 1",
      desc: "Stacks of 2D convolutions extract local time–frequency patterns like onsets, harmonics, and textures.",
    },
    {
      title: "4 Convolutional Layers with 16 blocks",
      desc: "Skip connections stabilize training and help the model learn deeper, richer audio features.",
    },
    {
      title: "Global Average Pooling",
      desc: "Aggregation over time/frequency yields compact descriptors resilient to temporal shifts.",
    },
    {
      title: "Flatten + Dropout",
      desc: "Flatten the features and apply dropout to prevent overfitting.",
    },
    {
      title: "Final Linear Layer",
      desc: "Final classification layer maps features to probabilities over 50 ESC-50 classes.",
    },
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
        <h3 className="font-playfair bg-gradient-to-r from-rose-700 via-orange-600 to-amber-600 bg-clip-text text-2xl font-medium text-transparent">
          How the Model Works
        </h3>
        <p className="font-crimson mt-2 text-sm text-gray-600">
          A concise tour of the audio CNN pipeline powering the visualizer.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {items.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className="relative rounded-2xl border border-rose-200/50 bg-gradient-to-br from-rose-50/70 via-amber-50/70 to-orange-50/70 p-4"
            >
              <div className="mb-2 inline-flex items-center rounded-full border border-rose-300/40 bg-white/50 px-2 py-0.5 text-xs text-rose-700">
                Step {idx + 1}
              </div>
              <h4 className="font-playfair text-lg text-gray-800">{step.title}</h4>
              <p className="font-crimson mt-1 text-sm text-gray-600">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}


