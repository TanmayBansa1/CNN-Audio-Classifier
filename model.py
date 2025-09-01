from torch import nn
import torch

class ResidualBlock(nn.Module):
    def __init__(self, in_channels, out_channels, stride=1, bias=False):
        super().__init__()
        self.conv1 = nn.Conv2d(in_channels, out_channels, kernel_size=3, stride=stride, padding=1, bias=False)
        self.bn1 = nn.BatchNorm2d(out_channels)
        self.conv2 = nn.Conv2d(out_channels, out_channels, kernel_size=3, padding=1, bias=False)
        self.bn2 = nn.BatchNorm2d(out_channels)
        self.shortcut = nn.Sequential()
        self.use_shortcut = (stride != 1 or in_channels != out_channels)
        if self.use_shortcut:
            self.shortcut = nn.Sequential(
                nn.Conv2d(in_channels, out_channels, kernel_size=1, stride=stride, bias=False),
                nn.BatchNorm2d(out_channels)
            )
    def forward(self,x, fmap_dict=None, prefix=""):
        out = self.conv1(x)
        out = self.bn1(out)
        out = torch.relu(out)
        out = self.conv2(out)
        out = self.bn2(out)
        shortcut = self.shortcut(x) if self.use_shortcut else x
        out += shortcut
        if fmap_dict is not None:
            fmap_dict[prefix + ".conv"] = out
        out = torch.relu(out)
        if fmap_dict is not None:
            fmap_dict[prefix + ".relu"] = out

        return out

class AudioClassifier(nn.Module):
    def __init__(self, num_classes=50):
        super().__init__()
        self.layer1 = nn.Sequential(
            nn.Conv2d(1,64,7,2,3,bias=False),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(3,2,1),
        )
        self.layer2 = nn.ModuleList([ResidualBlock(64,64,1,bias=False) for _ in range(3)])
        self.layer3 = nn.ModuleList([ResidualBlock(64 if i == 0 else 128,128,stride=2 if i == 0 else 1,bias=False) for i in range(4)])
        self.layer4 = nn.ModuleList([ResidualBlock(128 if i == 0 else 256,256,stride=2 if i == 0 else 1,bias=False) for i in range(6)])
        self.layer5 = nn.ModuleList([ResidualBlock(256 if i == 0 else 512,512,stride=2 if i == 0 else 1,bias=False) for i in range(3)])
        self.avgpool = nn.AdaptiveAvgPool2d((1,1))
        self.dropout = nn.Dropout(0.5)
        self.fc = nn.Linear(512,num_classes)
    def forward(self,x, return_feature_maps=False):
        if not return_feature_maps:
            x = self.layer1(x)
            for block in self.layer2:
                x = block(x)
            for block in self.layer3:
                x = block(x)
            for block in self.layer4:
                x = block(x)
            for block in self.layer5:
                x = block(x)
            x = self.avgpool(x)
            x = x.view(x.size(0),-1)
            x = self.dropout(x)
            x = self.fc(x)
            return x
        else:
            feature_maps = {}
            x = self.layer1(x)
            feature_maps["layer1"] = x
            for i, block in enumerate(self.layer2):
                x = block(x, feature_maps, "layer2.block-" + str(i))
            feature_maps["layer2"] = x
            for i, block in enumerate(self.layer3):
                x = block(x, feature_maps, "layer3.block-" + str(i))
            feature_maps["layer3"] = x
            for i, block in enumerate(self.layer4):
                x = block(x, feature_maps, "layer4.block-" + str(i))
            feature_maps["layer4"] = x
            for i, block in enumerate(self.layer5):
                x = block(x, feature_maps, "layer5.block" + str(i))
            feature_maps["layer5"] = x
            x = self.avgpool(x)
            x = x.view(x.size(0), -1)
            x = self.dropout(x)
            x = self.fc(x)
            return x, feature_maps





