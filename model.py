from torch import nn
import torch

class ResidualBlock(nn.Module):
    def __init__(self, in_channels, out_channels, stride=1, bias=False):
        super().__init__()
        self.conv1 = nn.Conv2d(in_channels, out_channels, kernel_size=3, stride=stride, padding=1, bias=False)
        self.bn1 = nn.BatchNorm2d(out_channels)
        self.conv2 = nn.Conv2d(out_channels, out_channels, kernel_size=3, stride=stride, padding=1, bias=False)
        self.bn2 = nn.BatchNorm2d(out_channels)
        self.shortcut = nn.Sequential()
        self.use_shortcut = (stride != 1 or in_channels != out_channels)
        if self.use_shortcut:
            self.shortcut = nn.Sequential(
                nn.Conv2d(in_channels, out_channels, kernel_size=1, stride=stride, bias=False),
                nn.BatchNorm2d(out_channels)
            )
    def forward(self,x):
        out = self.conv1(x)
        out = self.bn1(out)
        out = torch.relu(out)
        out = self.conv2(out)
        out = self.bn2(out)
        shortcut = self.shortcut(x) if self.use_shortcut else x
        out += shortcut
        out = torch.relu(out)
        return out

class AudioClassifier(nn.Module):
    super().__init__()
    def __init__(self, num_classes=50):
        self.layer1 = nn.Sequential(
            nn.Conv2d(1,64,7,2,3,bias=False),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(3,2,1),
        )
        self.layer2 = nn.ModuleList([ResidualBlock(64,64,1,False) for _ in range(3)])
        self.layer3 = nn.ModuleList([ResidualBlock(64 if i == 0 else 128,128,1,False) for i in range(4)])
        self.layer4 = nn.ModuleList([ResidualBlock(128 if i == 0 else 256,256,1,False) for i in range(6)])
        self.layer5 = nn.ModuleList([ResidualBlock(256 if i == 0 else 512,512,1,False) for i in range(3)])
        self.avgpool = nn.AdaptiveAvgPool2d((1,1))
        self.dropout = nn.Dropout(0.5)
        self.fc = nn.Linear(512,num_classes)
    def forward(self,x):
        x = self.layer1(x)
        for layer in self.layer2:
            x = layer(x)
        for layer in self.layer3:
            x = layer(x)
        for layer in self.layer4:
            x = layer(x)
        for layer in self.layer5:
            x = layer(x)
        x = self.avgpool(x)
        x = x.view(x.size(0),-1)
        x = self.dropout(x)
        x = self.fc(x)
        return x





