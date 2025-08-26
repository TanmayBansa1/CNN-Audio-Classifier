import modal
import torch
from torch.utils.data import Dataset, DataLoader
from pathlib import Path
import pandas as pd
import torchaudio
import torch.nn as nn
import torchaudio.transforms as T
app = modal.App("Audio CNN classifier")

class ESC50Dataset(Dataset):
    def __init__(self, data_dir, metadata_file, split="train", transform=None):
        self.data_dir = Path(data_dir)
        self.metadata = pd.read_csv(metadata_file)
        self.split = split
        self.transform = transform

        if(split == "train"):
            self.metadata = self.metadata[self.metadata["fold"] != 5]
        elif(split == "val"):
            self.metadata = self.metadata[self.metadata["fold"] == 5]
        else:
            raise ValueError(f"Invalid split: {split}")

        self.classes = sorted(self.metadata["category"].unique())
        self.class_to_idx = {cls: idx for idx, cls in enumerate(self.classes)}
        self.metadata["label"] = self.metadata["category"].map(self.class_to_idx)
        
    def __len__(self):
        return len(self.metadata)

    def __getitem__(self, idx):
        row = self.metadata.iloc[idx]
        audio_path = self.data_dir / "audio" / row["filename"]
        waveform, sample_rate = torchaudio.load(audio_path)

        if(waveform.shape[0] > 1):
            waveform = torch.mean(waveform, dim=0, keepdim=True)
        
        if(self.transform):
            spectogram = self.transform(waveform)
        else:
            spectogram = waveform
        
        return spectogram, row["label"]


image = modal.Image.debian_slim().pip_install_from_requirements("requirements.txt").apt_install("ffmpeg", "libsndfile1", "wget", "unzip").run_commands("cd /tmp && wget https://github.com/karolpiczak/ESC-50/archive/master.zip -O ESC-50.zip","cd /tmp && unzip ESC-50.zip", "mkdir -p /opt/ESC-50", "cp -r /tmp/ESC-50-master/* /opt/ESC-50/", "rm -rf /tmp/ESC-50.zip /tmp/ESC-50-master").add_local_python_source("model")

volume = modal.Volume.from_name("ESC-50", create_if_missing=True)
model_volume = modal.Volume.from_name("model-volume", create_if_missing=True)

@app.function(image=image, gpu="A10G", volumes={"/data": volume, "/models": model_volume}, timeout=60*60*3)
def train():
    esc50_dir = Path("/opt/ESC-50")

    train_transform = nn.Sequential(
        T.MelSpectrogram(
            sample_rate=22050,
            n_fft=1024,
            hop_length=512,
            n_mels=128,
            f_min=0,
            f_max=11025
        ),
        T.AmplitudeToDB(),
        T.FrequencyMasking(freq_mask_param=30),
        T.TimeMasking(time_mask_param=80)
    )
    val_transform = nn.Sequential(
        T.MelSpectrogram(
            sample_rate=22050,
            n_fft=1024,
            hop_length=512,
            n_mels=128,
            f_min=0,
            f_max=11025
        ),
        T.AmplitudeToDB()
    )

    train_dataset = ESC50Dataset(data_dir=esc50_dir,metadata_file=esc50_dir/"meta"/"esc50.csv",split="train",transform=train_transform)
    val_dataset = ESC50Dataset(data_dir=esc50_dir,metadata_file=esc50_dir/"meta"/"esc50.csv",split="val",transform=val_transform)

    print(f"Train dataset size: {len(train_dataset)}")
    print(f"Validation dataset size: {len(val_dataset)}")

    return 0

@app.local_entrypoint()
def main():
    print("the square is", train.remote())
