// Audio processing utilities

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export function validateAudioFile(file: File): { isValid: boolean; error?: string } {
  const allowedTypes = [
    'audio/wav', 
    'audio/mpeg', 
    'audio/mp4', 
    'audio/flac',
    'audio/x-wav',
    'audio/x-flac'
  ];
  
  if (!allowedTypes.includes(file.type) && !(/\.(wav|mp3|m4a|flac)$/i.exec(file.name))) {
    return {
      isValid: false,
      error: 'Please upload a valid audio file (WAV, MP3, M4A, FLAC)'
    };
  }
  
  // Check file size (50MB limit)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size must be less than 50MB'
    };
  }
  
  return { isValid: true };
}

export async function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const url = URL.createObjectURL(file);
    
    audio.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(url);
      resolve(audio.duration);
    });
    
    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load audio metadata'));
    });
    
    audio.src = url;
  });
}

export function downsampleArray(array: number[], targetLength: number): number[] {
  if (array.length <= targetLength) return array;
  
  const blockSize = array.length / targetLength;
  const result: number[] = [];
  
  for (let i = 0; i < targetLength; i++) {
    const start = Math.floor(i * blockSize);
    const end = Math.floor((i + 1) * blockSize);
    
    let sum = 0;
    let count = 0;
    
    for (let j = start; j < end; j++) {
      sum += Math.abs(array[j] ?? 0);
      count++;
    }
    
    result.push(count > 0 ? sum / count : 0);
  }
  
  return result;
}

