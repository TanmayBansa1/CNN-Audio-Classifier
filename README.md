## Audio CNN Classifier with Modal Inference and Visualizer

A complete pipeline for environmental sound classification on ESC-50 using a ResNet-style CNN. The project includes:

- Training on ESC-50 with data augmentation and MixUp
- GPU-accelerated inference served via Modal with a FastAPI endpoint
- Next.js visual dashboards to explore predictions, spectrograms, and intermediate feature maps


### Repository layout

```
audio-cnn/
  main.py           # Modal FastAPI inference service
  model.py          # Residual CNN model (ResNet-style)
  train.py          # Modal training job for ESC-50
  requirements.txt  # Python dependencies
  frontend/         # Simple UI demo (Next.js)
  visualizer/       # Rich feature map & spectrogram visualizer (Next.js)
```


## Model architecture

The classifier is a residual CNN operating on log-mel spectrograms.

- Preprocessing (PyTorch Audio):
  - MelSpectrogram: sample_rate=44100, n_fft=2048, hop_length=512, n_mels=128, f_min=0, f_max=22050
  - AmplitudeToDB to convert magnitudes to decibels

- Backbone (`model.py`):
  - `ResidualBlock`: two 3x3 convs with BatchNorm and ReLU; identity or 1x1 projection for downsampling
  - Stem: 7x7 conv stride 2 → BatchNorm → ReLU → 3x3 max-pool
  - Stages:
    - `layer2`: 3× residual blocks, 64 channels
    - `layer3`: 4× residual blocks, first block downsamples to 128 channels
    - `layer4`: 6× residual blocks, first block downsamples to 256 channels
    - `layer5`: 3× residual blocks, first block downsamples to 512 channels
  - Head: AdaptiveAvgPool2d(1,1) → Dropout(0.5) → Linear to `num_classes`

- Feature maps for visualization: when `forward(..., return_feature_maps=True)` the model returns the logits and a dictionary of intermediate activations collected across layers and blocks.


## Training (ESC-50 on Modal)

Defined in `train.py` as a Modal function running on GPU.

- Dataset: ESC-50 automatically downloaded into a persistent Modal Volume on first run
- Splits: `fold != 5` for train, `fold == 5` for validation
- Augmentations:
  - FrequencyMasking and TimeMasking on log-mel spectrograms
  - MixUp (Beta(0.2, 0.2)) applied probabilistically
- Optimization:
  - AdamW (lr=5e-4, weight_decay=0.01); `OneCycleLR` (max_lr=2e-3)
  - Loss: CrossEntropy with label smoothing 0.1
  - Batch size: 32; Epochs: 100
- Logging: TensorBoard written to `/models/tensorboard_logs/...`
- Checkpointing: Best model saved to `/models/best_model.pth` with classes and metadata

Run training locally via Modal (requires Modal CLI):

```bash
modal run train.py::main
```

Notes:
- Volumes used: `ESC-50` for dataset, `model-volume` for checkpoints/logs
- GPU: A10G (configured in the function decorator)


## Inference service (Modal + FastAPI)

Defined in `main.py` as a Modal class with a FastAPI endpoint.

- Container image installs `requirements.txt` and system deps (e.g., `libsndfile1`) and loads the `model.py` source
- Model weights are read from Modal Volume `/models/best_model.pth`
- Audio processing mirrors training preprocessing: mono, resample to 44.1 kHz, log-mel spectrogram, then inference
- Endpoint aggregates feature maps across channels for compact visualization payloads

Local dev via Modal:

```bash
# Serve the FastAPI endpoint locally through Modal
modal serve main.py

# Or run the local entrypoint to test with a bundled WAV file
modal run main.py::main
```

Deploy (production):

```bash
modal deploy main.py
```


### API contract

- URL: `POST /evaluate`
- Request body:

```json
{ "audio_data": "<base64-encoded WAV bytes>" }
```

- Response body (shape summarized):

```json
{
  "predictions": [ { "class": "string", "confidence": 0.0 } ],
  "visualization": { "<layer-name>": { "shape": [H, W], "values": [[...], ...] } },
  "input_spectogram": { "shape": [128, T], "values": [[...], ...] },
  "waveform": { "values": [...], "sample_rate": 44100, "duration": 5.0 }
}
```


## Visual dashboards (Next.js)

There are two Next.js apps:

1) `visualizer/` — rich exploration of feature maps, spectrograms, and predictions. Uses:
   - `src/lib/api.ts`: reads `NEXT_PUBLIC_MODAL_ENDPOINT` to call the Modal endpoint; falls back to `/api/evaluate` if not set.

2) `frontend/` — a simpler UI demo built with shadcn/ui primitives.

Common prerequisites:
- Node.js 18+ and pnpm (see `packageManager` field)

Install and run (from each app directory):

```bash
pnpm install
pnpm dev
```

For `visualizer`, create `.env.local` with the FULL evaluate endpoint URL from Modal:

```bash
NEXT_PUBLIC_MODAL_ENDPOINT=<FULL_EVALUATE_ENDPOINT_URL_FROM_MODAL>
# e.g. run `modal serve main.py` and copy the URL shown for Main.evaluate
```

Then open the local dev URL (usually `http://localhost:3000`). Upload a WAV file to see predictions, waveform, input spectrogram, and intermediate feature maps.


## Local Python usage (without UI)

Quick test with the sample WAV files included in the repo using the local entrypoint:

```bash
modal run main.py::main
```

This prints the top-3 predictions and basic waveform info after sending an example audio file to the served endpoint.


## Requirements

- Python: 3.10+
- Core Python packages: see `requirements.txt` (torch, torchaudio, librosa, pandas, numpy, tensorboard, fastapi, tqdm)
- Modal CLI installed and configured with access to a GPU workspace
- System deps for audio I/O are handled inside the Modal image (`libsndfile1`, `ffmpeg` for training)


## Troubleshooting

- No model weights found: Ensure training completed and `/models/best_model.pth` exists in the `model-volume`. Rerun training if needed.
- Endpoint returns 500: Verify the Modal app is running/served and that `NEXT_PUBLIC_MODAL_ENDPOINT` points to the correct `/evaluate` URL.
- CUDA not available: The service and training jobs automatically select CUDA if available; otherwise they run on CPU (slower). The Modal function decorators request an A10G GPU.


## Acknowledgements

- ESC-50 dataset: Piczak, K. J. ESC: Dataset for Environmental Sound Classification. In Proceedings of the 23rd ACM International Conference on Multimedia (2015).


