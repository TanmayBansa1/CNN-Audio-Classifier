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
      'audio/*': ['.wav']
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
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {!selectedFile ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative"
          >
            <div
              {...getRootProps()}
              className={`
                relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
                transition-all duration-300 ease-in-out
                ${isDragActive 
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/20' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                }
                ${isLoading ? 'pointer-events-none opacity-50' : ''}
              `}
            >
              <input {...getInputProps()} />
              
              <motion.div
                animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
                className="space-y-4"
              >
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {isDragActive ? 'Drop your audio file here' : 'Upload Audio File'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Drag and drop or click to select
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    Supports WAV(max 50MB)
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <FileAudio className="w-6 h-6 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                    {selectedFile.name}
                  </h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>{formatFileSize(selectedFile.size)}</span>
                    {selectedFile.duration && (
                      <span>{selectedFile.duration.toFixed(1)}s</span>
                    )}
                  </div>
                </div>
              </div>
              
              <button
                onClick={removeFile}
                disabled={isLoading}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {uploadError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <div className="flex items-center space-x-2 text-red-700 dark:text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-medium">{uploadError}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

