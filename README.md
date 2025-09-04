# Audio CNN Classifier with Modal Inference and Interactive Visualizer

A complete end-to-end pipeline for environmental sound classification using a ResNet-style CNN architecture. The project features real-time audio analysis with beautiful interactive visualizations of model predictions and feature maps.

## 🎯 Features

- **Deep Learning Model**: ResNet-style CNN trained on ESC-50 dataset (50 environmental sound classes)
- **GPU-Accelerated Inference**: Modal.com FastAPI service with automatic scaling
- **Interactive Visualizer**: Next.js web app with 3D model visualization, spectrograms, and feature maps
- **Real-time Analysis**: Upload audio files and see predictions instantly with confidence scores
- **Feature Map Exploration**: Visualize intermediate CNN activations across all layers

## 🏗️ Project Structure

```
audio-cnn/
├── main.py              # Modal FastAPI inference service
├── model.py             # ResNet-style CNN architecture
├── train.py             # Modal training pipeline for ESC-50
├── requirements.txt     # Python dependencies
├── DEPLOYMENT.md        # Deployment guide
├── theory.excalidraw    # Model architecture diagram
├── visualizer/          # Interactive Next.js visualizer
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── lib/         # Utilities and API client
│   │   └── app/         # Next.js app router
│   └── package.json
└── *.wav               # Sample audio files for testing
```

## 🧠 Model Architecture

### Preprocessing Pipeline
- **MelSpectrogram**: 44.1kHz sample rate, 2048 FFT, 512 hop length, 128 mel bins
- **AmplitudeToDB**: Convert magnitude spectrograms to decibel scale
- **Normalization**: Channel-wise normalization for training stability

### CNN Architecture (`model.py`)
- **Stem**: 7×7 conv (stride 2) → BatchNorm → ReLU → 3×3 MaxPool
- **Residual Stages**:
  - `layer2`: 3× ResidualBlocks (64 channels)
  - `layer3`: 4× ResidualBlocks (128 channels, first block downsamples)
  - `layer4`: 6× ResidualBlocks (256 channels, first block downsamples)
  - `layer5`: 3× ResidualBlocks (512 channels, first block downsamples)
- **Classification Head**: AdaptiveAvgPool2d → Dropout(0.5) → Linear(512 → 50 classes)

### Residual Blocks
- Two 3×3 convolutions with BatchNorm and ReLU activations
- Skip connections with 1×1 projection when dimensions change
- Feature map extraction capability for visualization

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+ with pnpm
- Modal CLI account with GPU access

### 1. Training the Model

```bash
# Install Modal CLI and authenticate
pip install modal
modal auth set

# Run training on Modal (ESC-50 dataset auto-downloaded)
modal run train.py::main
```

**Training Features**:
- Automatic ESC-50 dataset download and caching
- Data augmentation: FrequencyMasking, TimeMasking, MixUp
- AdamW optimizer with OneCycleLR scheduling
- TensorBoard logging and model checkpointing
- Validation on fold 5 (standard ESC-50 split)

### 2. Deploy Inference Service

```bash
# Deploy to Modal (production)
modal deploy main.py

# Or serve locally for development
modal serve main.py
```

### 3. Run Interactive Visualizer

```bash
cd visualizer
pnpm install

# Create environment file
echo "NEXT_PUBLIC_MODAL_ENDPOINT=YOUR_MODAL_ENDPOINT_URL" > .env.local

# Start development server
pnpm dev
```

Open `http://localhost:3000` and upload audio files to explore predictions and visualizations!

## 🎵 Using the Visualizer

### Audio Upload
- Drag & drop audio files (WAV, MP3, etc.)
- Real-time format conversion and preprocessing
- Automatic resampling to 44.1kHz

### Visualizations
1. **Waveform Display**: Interactive audio player with waveform
2. **Mel-Spectrogram**: Input features fed to the model
3. **Predictions**: Top-3 class predictions with confidence scores
4. **Feature Maps**: Layer-by-layer CNN activations with heatmaps
5. **3D Architecture**: Interactive 3D model visualization

### Feature Map Explorer
- Navigate through all CNN layers (layer1 → layer5)
- Individual residual block activations
- Channel-averaged heatmaps for intuitive understanding
- Hover tooltips with activation statistics

## 🔧 API Reference

### Inference Endpoint
**POST** `/evaluate`

```json
// Request
{
  "audio_data": "base64_encoded_audio_bytes"
}

// Response
{
  "predictions": [
    {"class": "dog_bark", "confidence": 0.892},
    {"class": "cat_meow", "confidence": 0.067},
    {"class": "bird_singing", "confidence": 0.023}
  ],
  "visualization": {
    "layer1": {"shape": [64, 64], "values": [[...]]},
    "layer2": {"shape": [32, 32], "values": [[...]]},
    // ... more layers
  },
  "input_spectogram": {
    "shape": [128, 216], 
    "values": [[...]]
  },
  "waveform": {
    "values": [...],
    "sample_rate": 44100,
    "duration": 5.0
  }
}
```

## 📊 Model Performance

- **Dataset**: ESC-50 (Environmental Sound Classification)
- **Classes**: 50 environmental sound categories
- **Training**: 1600 samples (folds 1-4)
- **Validation**: 400 samples (fold 5)
- **Architecture**: ResNet-inspired CNN with ~11M parameters

## 🛠️ Development

### Local Testing
```bash
# Test with sample audio file
modal run main.py::main

# This will process a sample WAV and show predictions
```

### Training Configuration
Key hyperparameters in `train.py`:
- Batch size: 32
- Learning rate: 5e-4 (AdamW) with OneCycleLR (max 2e-3)
- Weight decay: 0.01
- Label smoothing: 0.1
- Epochs: 100
- MixUp: Beta(0.2, 0.2)

### Visualizer Development
```bash
cd visualizer

# Development with hot reload
pnpm dev

# Type checking
pnpm typecheck

# Linting and formatting
pnpm lint
pnpm format:write

# Production build
pnpm build
```

## 🌐 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Modal (Backend)
- Automatic GPU scaling (A10G)
- Persistent model storage
- FastAPI with OpenAPI docs

### Vercel/Netlify (Frontend)
```bash
cd visualizer
pnpm build
# Deploy build output to your platform
```

## 🔍 Technical Details

### Audio Processing
- Supports multiple formats (WAV, MP3, FLAC, etc.)
- Automatic mono conversion
- Librosa-based resampling
- Base64 encoding for API transport

### Visualization Pipeline
- WebGL-accelerated heatmaps
- D3.js for interactive charts
- React Three Fiber for 3D visualizations
- Responsive design for all screen sizes

### Performance Optimization
- Model served on GPU with batch processing
- Efficient feature map aggregation
- Client-side audio preprocessing
- Lazy loading of visualization components

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgements

- **ESC-50 Dataset**: Piczak, K. J. "ESC: Dataset for Environmental Sound Classification" (2015)
- **Modal**: GPU infrastructure and deployment platform
- **PyTorch**: Deep learning framework
- **Next.js**: React framework for the visualizer
- **Three.js**: 3D graphics library for model visualization

## 📈 Future Enhancements

- [ ] Real-time audio streaming support
- [ ] Custom dataset training interface
- [ ] Model architecture comparison tools
- [ ] Export feature maps and predictions
- [ ] Mobile app with React Native
- [ ] Additional visualization techniques (t-SNE, UMAP)

---

**Ready to explore audio AI?** Upload your first audio file and dive into the fascinating world of deep learning feature representations! 🎤✨