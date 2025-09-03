'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileAudio, X, AlertCircle } from 'lucide-react';
import type { AudioFile } from '~/lib/types';
import { validateAudioFile, formatFileSize, getAudioDuration } from '~/lib/audio-utils';

interface FileUploadProps {
  onFileSelect: (file: AudioFile) => void;
  isLoading?: boolean;
}

export function FileUpload({ onFileSelect, isLoading }: FileUploadProps) {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<AudioFile | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploadError(null);
    
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    const validation = validateAudioFile(file!);
    
    if (!validation.isValid) {
      setUploadError(validation.error ?? 'Invalid file');
      return;
    }

    try {
      const duration = await getAudioDuration(file!);
      const audioFile: AudioFile = {
        file: file!,
        url: URL.createObjectURL(file!),
        name: file!.name,
        size: file!.size,
        duration,
      };
      
      setSelectedFile(audioFile);
      onFileSelect(audioFile);
    } catch (error) {
      setUploadError('Failed to process audio file');
      console.error('Error processing file:', error);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDrop as (acceptedFiles: File[]) => void,
    accept: {
      'audio/*': ['.wav', '.mp3', '.m4a', '.flac']
    },
    multiple: false,
    disabled: isLoading,
  });

  const removeFile = useCallback(() => {
    if (selectedFile) {
      URL.revokeObjectURL(selectedFile.url);
      setSelectedFile(null);
    }
  }, [selectedFile]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <AnimatePresence mode="wait">
        {!selectedFile ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative group"
          >
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-rose-200/30 via-orange-200/30 to-amber-200/30 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
            
            <div
              {...getRootProps()}
              className={`
                relative border-2 border-dashed rounded-3xl p-16 text-center cursor-pointer overflow-hidden
                transition-all duration-500 ease-out backdrop-blur-xl
                ${isDragActive 
                  ? 'border-rose-400 bg-gradient-to-br from-rose-200/20 via-orange-200/20 to-amber-200/20 scale-105 shadow-2xl' 
                  : 'border-orange-300/50 bg-white/40 hover:border-rose-400/60 hover:bg-white/60 hover:shadow-xl'
                }
                ${isLoading ? 'pointer-events-none opacity-50' : ''}
              `}
            >
              <input {...getInputProps()} />
              
              {/* Background Animation */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-10 left-10 w-20 h-20 bg-rose-300/30 rounded-full animate-float"></div>
                <div className="absolute bottom-10 right-10 w-16 h-16 bg-orange-300/30 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
                <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-amber-300/30 rounded-full animate-float" style={{ animationDelay: '4s' }}></div>
              </div>
              
              <motion.div
                animate={isDragActive ? { scale: 1.1, y: -10 } : { scale: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="relative z-10 space-y-8"
              >
                <motion.div 
                  className="mx-auto w-20 h-20 relative"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-rose-400 via-orange-400 to-amber-400 rounded-2xl blur-lg opacity-60 animate-pulse"></div>
                  <div className="relative w-full h-full bg-gradient-to-br from-rose-400 via-orange-400 to-amber-400 rounded-2xl flex items-center justify-center shadow-xl border border-white/30">
                    <Upload className="w-10 h-10 text-white" />
                  </div>
                </motion.div>
                
                <div className="space-y-4">
                  <motion.h3 
                    className="text-2xl font-playfair font-medium mb-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <span className="bg-gradient-to-r from-rose-700 via-orange-700 to-amber-700 bg-clip-text text-transparent">
                      {isDragActive ? 'Drop your audio file here!' : 'Upload Your Audio File'}
                    </span>
                  </motion.h3>
                  
                  <motion.p 
                    className="text-lg text-gray-600 font-crimson italic"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    Drag and drop or click to select your audio masterpiece
                  </motion.p>
                  
                  <motion.div 
                    className="flex flex-wrap justify-center gap-3 mt-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {['.WAV', '.MP3', '.M4A', '.FLAC'].map((format, i) => (
                      <span 
                        key={format}
                        className="px-3 py-1 bg-white/50 backdrop-blur-sm rounded-full text-sm font-crimson text-orange-700 border border-orange-200/60"
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        {format}
                      </span>
                    ))}
                  </motion.div>
                  
                  <motion.p 
                    className="text-sm text-gray-500 font-crimson mt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    Maximum file size: 10MB
                  </motion.p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative group"
          >
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-300/30 via-teal-300/30 to-cyan-300/30 rounded-3xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-500"></div>
            
            <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl border border-emerald-300/40 p-8 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6 flex-1 min-w-0">
                  <motion.div 
                    className="relative w-16 h-16"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-2xl blur-lg opacity-60 animate-pulse"></div>
                    <div className="relative w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg border border-white/30">
                      <FileAudio className="w-7 h-7 text-white" />
                    </div>
                  </motion.div>
                  
                  <div className="flex-1 min-w-0 space-y-2">
                    <h4 className="text-xl font-playfair font-medium text-gray-800 truncate">
                      {selectedFile.name}
                    </h4>
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-sm font-crimson text-emerald-700">{formatFileSize(selectedFile.size)}</span>
                      </div>
                      {selectedFile.duration && (
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-200"></div>
                          <span className="text-sm font-crimson text-teal-700">{selectedFile.duration.toFixed(1)}s</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-400"></div>
                        <span className="text-sm font-crimson text-rose-700">Ready for analysis</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <motion.button
                  onClick={removeFile}
                  disabled={isLoading}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative p-3 text-gray-500 hover:text-red-500 transition-all duration-300 disabled:opacity-50 group"
                >
                  <div className="absolute inset-0 bg-red-400/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <X className="relative w-6 h-6" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {uploadError && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mt-6 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-2xl blur-xl opacity-75"></div>
            <div className="relative bg-red-900/20 backdrop-blur-xl border border-red-500/30 rounded-2xl p-6">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-poppins font-semibold text-red-200 mb-1">Upload Error</h4>
                  <span className="text-sm text-red-300">{uploadError}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

