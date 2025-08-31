import modal
import torch
import torch.optim as optim
from torch.optim.lr_scheduler import OneCycleLR
from torch.utils.data import Dataset, DataLoader
from pathlib import Path
import pandas as pd
import torchaudio
import torch.nn as nn
import torchaudio.transforms as T
from tqdm import tqdm
from model import AudioClassifier
import numpy as np
from torch.utils.tensorboard import SummaryWriter

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


image = modal.Image.debian_slim().pip_install_from_requirements("requirements.txt").apt_install("ffmpeg", "libsndfile1", "wget", "unzip").add_local_python_source("model")

volume = modal.Volume.from_name("ESC-50", create_if_missing=True)
model_volume = modal.Volume.from_name("model-volume", create_if_missing=True)

def mixup_audios(x,y): #features and labels
    lam = np.random.beta(0.2,0.2)
    batch_size = x.size(0)

    idx = torch.randperm(batch_size).to(x.device)

    mixed_x = lam * x + (1-lam) * x[idx, :]
    y_a, y_b = y, y[idx]

    return mixed_x, y_a, y_b, lam, None

def mixup_loss(criterion,prediction,y_a,y_b,lam):
    return lam * criterion(prediction,y_a) + (1-lam) * criterion(prediction,y_b)

@app.function(image=image, gpu="A10G", volumes={"/opt/ESC-50": volume, "/models": model_volume}, timeout=60*60*3)
def train():
    from datetime import datetime
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_dir = f"/models/tensorboard_logs/run_{timestamp}"
    writer = SummaryWriter(log_dir)
    print(f"TensorBoard logs will be written to: {log_dir}")


    import subprocess

    esc50_dir = Path("/opt/ESC-50")
    esc50_audio_dir = esc50_dir / "audio"

    if not esc50_audio_dir.exists():
        print("ESC-50 data not found in volume. Downloading...")
        esc50_dir.mkdir(parents=True, exist_ok=True)

        tmp_dir = Path("/tmp/ESC-50-download")
        tmp_dir.mkdir(parents=True, exist_ok=True)
        zip_path = tmp_dir / "ESC-50.zip"
        
        print("Downloading ESC-50.zip...")
        subprocess.run(["wget", "https://github.com/karolpiczak/ESC-50/archive/master.zip", "-O", str(zip_path)], check=True)
        print("Unzipping ESC-50.zip...")
        subprocess.run(["unzip", str(zip_path), "-d", str(tmp_dir)], check=True)
        
        print(f"Moving data from {tmp_dir / 'ESC-50-master'} to {esc50_dir}")

        subprocess.run(["cp", "-r", str(tmp_dir / "ESC-50-master") + "/.", str(esc50_dir)], check=True)
        subprocess.run(["rm", "-rf", str(tmp_dir)], check=True)
        print("ESC-50 data prepared in volume.")
    else:
        print("ESC-50 data already exists in volume.")

    train_transform = nn.Sequential(
        T.MelSpectrogram(
            sample_rate=44100,
            n_fft=2048,
            hop_length=512,
            n_mels=128,
            f_min=0,
            f_max=22050
        ),
        T.AmplitudeToDB(),
        T.FrequencyMasking(freq_mask_param=30),
        T.TimeMasking(time_mask_param=80)
    )
    val_transform = nn.Sequential(
        T.MelSpectrogram(
            sample_rate=44100,
            n_fft=2048,
            hop_length=512,
            n_mels=128,
            f_min=0,
            f_max=22050
        ),
        T.AmplitudeToDB()
    )

    train_dataset = ESC50Dataset(data_dir=esc50_dir,metadata_file=esc50_dir/"meta"/"esc50.csv",split="train",transform=train_transform)
    val_dataset = ESC50Dataset(data_dir=esc50_dir,metadata_file=esc50_dir/"meta"/"esc50.csv",split="val",transform=val_transform)

    print(f"Train dataset size: {len(train_dataset)}")
    print(f"Validation dataset size: {len(val_dataset)}")

    train_loader = DataLoader(train_dataset,batch_size=32,shuffle=True)
    val_loader = DataLoader(val_dataset,batch_size=32,shuffle=False)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    model = AudioClassifier(num_classes=len(train_dataset.classes))
    model.to(device)

    num_epochs = 100
    criterion = nn.CrossEntropyLoss(label_smoothing=0.1) #loss function
    optimizer = optim.AdamW(model.parameters(), lr=0.0005, weight_decay=0.01)
    scheduler = OneCycleLR(
        optimizer,
        max_lr=0.002,
        epochs=num_epochs,
        steps_per_epoch=len(train_loader),
        pct_start=0.1
    )

    best_accuracy = 0.0
    print(f"Training started on {device}")

    for epoch in range(num_epochs):
        model.train()
        epoch_loss = 0.0

        progress_bar = tqdm(train_loader,desc=f"Epoch {epoch+1}/{num_epochs}")
        for data,target in progress_bar:
            data,target = data.to(device),target.to(device) #spectograms and labels
            if np.random.random() > 0.7:
                data,target_a,target_b,mixup_lam,_ = mixup_audios(data,target)
                output = model(data)
                loss = mixup_loss(criterion,output,target_a,target_b,mixup_lam)
            else:
                output = model(data)
                loss = criterion(output,target)
            
            optimizer.zero_grad() #erase all gradients from previous batch
            loss.backward()
            optimizer.step()
            scheduler.step()

            epoch_loss += loss.item()
            progress_bar.set_postfix({"Loss": f'{loss.item():.4f}'})

        avg_epoch_loss = epoch_loss / len(train_loader)
        writer.add_scalar("Loss/train",avg_epoch_loss,epoch)
        writer.add_scalar("Learning_rate",optimizer.param_groups[0]["lr"],epoch)
        
        # validation after each epoch

        model.eval()
        correct = 0
        total = 0
        val_loss = 0.0

        with torch.no_grad():
            for data,target in val_loader:
                data,target = data.to(device),target.to(device)
                output = model(data)
                loss = criterion(output,target)
                val_loss += loss.item()

                _,predicted = torch.max(output.data,1)
                total += target.size(0)
                correct += (predicted == target).sum().item()

        accuracy = 100 * correct / total
        avg_val_loss = val_loss / len(val_loader)

        writer.add_scalar("Loss/val", avg_val_loss, epoch)
        writer.add_scalar("Accuracy/val", accuracy, epoch)
        print(f"Epoch {epoch+1}/{num_epochs}, Loss: {avg_epoch_loss:.4f}, Validation Loss: {avg_val_loss:.4f}, Accuracy: {accuracy:.2f}%")

        if accuracy > best_accuracy:
            best_accuracy = accuracy
            torch.save({
                "model_state_dict": model.state_dict(),
                "epoch": epoch,
                "classes": train_dataset.classes,
                "accuracy": accuracy,
            },"/models/best_model.pth")
            print("New Model saved",accuracy)
    
    writer.close()
    print(f"Training completed: Best accuracy: {best_accuracy:.2f}%")
                
    return 0

@app.local_entrypoint()
def main():
    print("starting training", train.remote())
