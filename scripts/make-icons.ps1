param([string]$Out, [string]$Letter = 'K')

# Draws the app icons: the orange brand square with the white letter.
Add-Type -AssemblyName System.Drawing

function New-Icon([int]$Size, [string]$Name, [bool]$FullBleed) {
  $bitmap = New-Object System.Drawing.Bitmap $Size, $Size
  $g = [System.Drawing.Graphics]::FromImage($bitmap)
  $g.SmoothingMode = 'AntiAlias'
  $g.TextRenderingHint = 'AntiAliasGridFit'
  $g.Clear([System.Drawing.Color]::Transparent)

  $orange = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(193, 68, 14))

  if ($FullBleed) {
    $g.FillRectangle($orange, 0, 0, $Size, $Size)
  } else {
    $r = [int]($Size * 0.22)
    $d = $r * 2
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc(0, 0, $d, $d, 180, 90)
    $path.AddArc($Size - $d, 0, $d, $d, 270, 90)
    $path.AddArc($Size - $d, $Size - $d, $d, $d, 0, 90)
    $path.AddArc(0, $Size - $d, $d, $d, 90, 90)
    $path.CloseFigure()
    $g.FillPath($orange, $path)
  }

  # Smaller on the full-bleed icon, so the letter stays inside the part a phone never crops.
  $scale = 0.56
  if ($FullBleed) { $scale = 0.42 }

  $font = New-Object System.Drawing.Font('Georgia', ($Size * $scale), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = 'Center'
  $format.LineAlignment = 'Center'
  $box = New-Object System.Drawing.RectangleF 0, ($Size * 0.02), $Size, $Size
  $g.DrawString($Letter, $font, [System.Drawing.Brushes]::White, $box, $format)

  $g.Dispose()
  $bitmap.Save((Join-Path $Out $Name), [System.Drawing.Imaging.ImageFormat]::Png)
  $bitmap.Dispose()
  "made $Name"
}

New-Icon 192 'icon-192.png' $false
New-Icon 512 'icon-512.png' $false
New-Icon 512 'icon-maskable-512.png' $true
New-Icon 180 'apple-touch-icon.png' $true
