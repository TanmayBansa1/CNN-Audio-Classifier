import torch
from model import AudioClassifier

m = AudioClassifier(num_classes=50)
total = sum(p.numel() for p in m.parameters() if p.requires_grad)
print(f"Trainable params: {total:,}")
for n, p in m.named_parameters():
    print(f"{n:50s} {p.numel():>10}")
