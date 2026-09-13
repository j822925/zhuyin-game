$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$iconRepo = Split-Path $PSScriptRoot -Parent
$iconDir = Join-Path $iconRepo 'assets/icons'
$iconSource = [System.Drawing.Image]::FromFile((Join-Path $iconDir 'bunny-master-v1.png'))
try {
 foreach ($entry in @(@{Size=180;Name='apple-touch-icon-v1.png'},@{Size=192;Name='icon-192-v1.png'},@{Size=512;Name='icon-512-v1.png'})) {
  $iconBitmap = [System.Drawing.Bitmap]::new($entry.Size,$entry.Size,[System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $iconGraphics = [System.Drawing.Graphics]::FromImage($iconBitmap)
  try {
   $iconGraphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#a4c58b'))
   $iconGraphics.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
   $iconGraphics.PixelOffsetMode=[System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
   $iconGraphics.DrawImage($iconSource,0,0,$entry.Size,$entry.Size)
   $iconBitmap.Save((Join-Path $iconDir $entry.Name),[System.Drawing.Imaging.ImageFormat]::Png)
  } finally { $iconGraphics.Dispose(); $iconBitmap.Dispose() }
 }
} finally { $iconSource.Dispose() }
