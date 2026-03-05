import torch
import torch.nn as nn
import sys
import ultralytics.nn.tasks as tasks

class EfficientChannelAttention(nn.Module):
    """Efficient Channel Attention without dimensionality reduction"""
    def __init__(self, channels):
        super().__init__()
        # Use 1D convolution for efficiency
        self.avg_pool = nn.AdaptiveAvgPool2d(1)
        self.conv = nn.Conv1d(1, 1, kernel_size=3, padding=1, bias=False)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        b, c, _, _ = x.size()
        y = self.avg_pool(x).view(b, 1, c)
        y = self.conv(y).view(b, c, 1, 1)
        return x * self.sigmoid(y)

class SpatialAttention(nn.Module):
    """Spatial attention mechanism"""
    def __init__(self, kernel_size=7):
        super().__init__()
        self.conv = nn.Conv2d(2, 1, kernel_size, padding=kernel_size//2, bias=False)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        avg_out = torch.mean(x, dim=1, keepdim=True)
        max_out, _ = torch.max(x, dim=1, keepdim=True)
        attention = torch.cat([avg_out, max_out], dim=1)
        attention = self.conv(attention)
        return x * self.sigmoid(attention)

class OptimizedResidualBlock(nn.Module):
    """Optimized residual block with Dual Attention"""
    def __init__(self, c1=None, c2=None):
        super().__init__()
        if c1 is None:
            self.block = None
            self.channel_attn = None
            self.spatial_attn = None
            self.channels = None
        else:
            if c2 is None:
                c2 = c1
            assert c1 == c2, f"OptimizedResidualBlock requires c1==c2, got c1={c1}, c2={c2}"
            self.channels = c1
            self._build_block(c1)
    
    def _build_block(self, c1):
        expansion = 2
        hidden_dim = c1 * expansion
        
        self.block = nn.Sequential(
            nn.Conv2d(c1, hidden_dim, 1, 1, 0, bias=False),
            nn.BatchNorm2d(hidden_dim),
            nn.SiLU(),
            nn.Conv2d(hidden_dim, hidden_dim, 5, 1, 2, groups=hidden_dim, bias=False),
            nn.BatchNorm2d(hidden_dim),
            nn.SiLU(),
            nn.Conv2d(hidden_dim, c1, 1, 1, 0, bias=False),
            nn.BatchNorm2d(c1),
        )
        self.channel_attn = EfficientChannelAttention(c1)
        self.spatial_attn = SpatialAttention(kernel_size=7)

    def forward(self, x):
        if self.block is None:
            c1 = x.shape[1]
            self.channels = c1
            self._build_block(c1)
        
        identity = x
        out = self.block(x)
        out = self.channel_attn(out)
        out = self.spatial_attn(out)
        return identity + out

def register_custom_modules():
    """Register custom modules with Ultralytics."""
    current_module = sys.modules[__name__]
    setattr(tasks, 'OptimizedResidualBlock', OptimizedResidualBlock)
    setattr(tasks, 'EfficientChannelAttention', EfficientChannelAttention)
    setattr(tasks, 'SpatialAttention', SpatialAttention)
    
    # Also register in the current module's namespace where ultralytics might look
    setattr(current_module, 'OptimizedResidualBlock', OptimizedResidualBlock)
    setattr(current_module, 'EfficientChannelAttention', EfficientChannelAttention)
    setattr(current_module, 'SpatialAttention', SpatialAttention)
    print("✅ Custom layers registered with Ultralytics.")
