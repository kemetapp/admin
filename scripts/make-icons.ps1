#requires -Version 5.1
<#
  make-icons.ps1 — يبني أيقونة كيميت والسبلاش من الصفر بـ GDI+.

  الفكرة: خرطوش زيتي/كريمي + حرف «ك» بخط Alexandria ExtraBold،
  بنفس هوية شعار التطبيق (Cartouche) لكن بصياغة مناسبة للأيقونة.

  التشغيل:  powershell -ExecutionPolicy Bypass -File scripts\make-icons.ps1
#>
Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'

$root   = Resolve-Path (Join-Path $PSScriptRoot '..')
$assets = Join-Path $root 'assets'
$fontPath = Join-Path $root 'node_modules\@expo-google-fonts\alexandria\800ExtraBold\Alexandria_800ExtraBold.ttf'

# ── ألوان الهوية ────────────────────────────────────────────────────
$oliveLight = [System.Drawing.ColorTranslator]::FromHtml('#5D6B33')
$oliveDeep  = [System.Drawing.ColorTranslator]::FromHtml('#3E4A20')
$olive      = [System.Drawing.ColorTranslator]::FromHtml('#4F5B2A')
$cream      = [System.Drawing.ColorTranslator]::FromHtml('#FBF6E8')
$creamWarm  = [System.Drawing.ColorTranslator]::FromHtml('#F7EDD4')
$creamInk   = [System.Drawing.ColorTranslator]::FromHtml('#F3E4BC')
$gold       = [System.Drawing.ColorTranslator]::FromHtml('#D9A24A')
$goldDeep   = [System.Drawing.ColorTranslator]::FromHtml('#B8862F')

function New-CartouchePath {
  param([double]$x, [double]$y, [double]$w, [double]$h)
  $rBot = $w * 0.24
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $p.AddArc([single]$x, [single]$y, [single]$w, [single]$w, 180, 180)
  $p.AddLine([single]($x + $w), [single]($y + $w / 2), [single]($x + $w), [single]($y + $h - $rBot))
  $p.AddArc([single]($x + $w - 2 * $rBot), [single]($y + $h - 2 * $rBot), [single](2 * $rBot), [single](2 * $rBot), 0, 90)
  $p.AddLine([single]($x + $w - $rBot), [single]($y + $h), [single]($x + $rBot), [single]($y + $h))
  $p.AddArc([single]$x, [single]($y + $h - 2 * $rBot), [single](2 * $rBot), [single](2 * $rBot), 90, 90)
  $p.AddLine([single]$x, [single]($y + $h - $rBot), [single]$x, [single]($y + $w / 2))
  $p.CloseFigure()
  return $p
}

function New-FontCollection {
  $pfc = New-Object System.Drawing.Text.PrivateFontCollection
  if (Test-Path $fontPath) {
    $pfc.AddFontFile($fontPath)
    return $pfc
  }
  throw "خط Alexandria مش موجود: $fontPath"
}

function Get-GradientBrush {
  param([System.Drawing.RectangleF]$rect, $c1, $c2, [single]$angle = 45)
  return New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $c1, $c2, $angle)
}

function Set-Quality {
  param([System.Drawing.Graphics]$g)
  $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.TextRenderingHint  = [System.Drawing.Text.TextRenderingHint]::AntiAlias
}

<#
  Draw-Mark — يرسم الخرطوش + الحرف + الشريط.
  letterDy: إزاحة رأسية بالبكسل لضبط تمركز الحرف بصريًا.
#>
function Draw-Mark {
  param(
    [System.Drawing.Graphics]$g,
    [double]$cx,
    [double]$top,
    [double]$w,
    [System.Drawing.FontFamily]$family,
    [bool]$solidCartouche,
    $cartoucheFill1,
    $cartoucheFill2,
    $borderColor,
    $letterColor,
    $barColor,
    [double]$letterDy = 0,
    [bool]$outlineOnly = $false,
    [double]$strokeRatio = 0.020
  )

  $h  = $w * 1.18
  $x  = $cx - $w / 2
  $path = New-CartouchePath -x $x -y $top -w $w -h $h

  if ($outlineOnly) {
    $pen = New-Object System.Drawing.Pen($borderColor, [single]($w * $strokeRatio))
    $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $g.DrawPath($pen, $path)
    $pen.Dispose()
  } else {
    if ($solidCartouche) {
      $fill = New-Object System.Drawing.SolidBrush($cartoucheFill1)
      $g.FillPath($fill, $path)
      $fill.Dispose()
    } else {
      $rect = New-Object System.Drawing.RectangleF([single]$x, [single]$top, [single]$w, [single]$h)
      $fill = Get-GradientBrush -rect $rect -c1 $cartoucheFill1 -c2 $cartoucheFill2 -angle 55
      $g.FillPath($fill, $path)
      $fill.Dispose()
    }
    $pen = New-Object System.Drawing.Pen($borderColor, [single]($w * $strokeRatio))
    $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $g.DrawPath($pen, $path)
    $pen.Dispose()
  }

  # الحرف
  $font = New-Object System.Drawing.Font($family, [single]($w * 0.56), [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $sf = New-Object System.Drawing.StringFormat
  $sf.Alignment     = [System.Drawing.StringAlignment]::Center
  $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
  $sf.FormatFlags   = [System.Drawing.StringFormatFlags]::NoClip
  $rectText = New-Object System.Drawing.RectangleF([single]$x, [single]($top + $letterDy), [single]$w, [single]$h)
  $letterBrush = New-Object System.Drawing.SolidBrush($letterColor)
  $g.DrawString([string][char]0x0643, $font, $letterBrush, $rectText, $sf)
  $letterBrush.Dispose()
  $sf.Dispose()
  $font.Dispose()

  # الشريط تحت الخرطوش
  $barW = $w * 0.72
  $barH = [Math]::Max(3, $w * 0.046)
  $barX = $cx - $barW / 2
  $barY = $top + $h + $w * 0.055
  $barPath = New-Object System.Drawing.Drawing2D.GraphicsPath
  $barPath.AddArc([single]$barX, [single]$barY, [single]$barH, [single]$barH, 90, 180)
  $barPath.AddArc([single]($barX + $barW - $barH), [single]$barY, [single]$barH, [single]$barH, 270, 180)
  $barPath.CloseFigure()
  $barBrush = New-Object System.Drawing.SolidBrush($barColor)
  $g.FillPath($barBrush, $barPath)
  $barBrush.Dispose()
  $barPath.Dispose()
  $path.Dispose()
}

function Save-Bitmap {
  param([System.Drawing.Bitmap]$bmp, [string]$name)
  $out = Join-Path $assets $name
  $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host ("  ok {0}" -f $name)
}

# ── قياس موضع حبر الحرف (لمعايرة التمركز الرأسي) ─────────────────────
function Get-InkBounds {
  param([System.Drawing.Bitmap]$bmp, [System.Drawing.Rectangle]$area, $inkColor, [int]$tol = 46)
  $minX = [int]::MaxValue; $minY = [int]::MaxValue; $maxX = -1; $maxY = -1; $count = 0
  for ($y = $area.Top; $y -lt $area.Bottom; $y++) {
    for ($x = $area.Left; $x -lt $area.Right; $x++) {
      $c = $bmp.GetPixel($x, $y)
      if ($c.A -lt 128) { continue }
      if ([Math]::Abs($c.R - $inkColor.R) -le $tol -and
          [Math]::Abs($c.G - $inkColor.G) -le $tol -and
          [Math]::Abs($c.B - $inkColor.B) -le $tol) {
        if ($x -lt $minX) { $minX = $x }
        if ($x -gt $maxX) { $maxX = $x }
        if ($y -lt $minY) { $minY = $y }
        if ($y -gt $maxY) { $maxY = $y }
        $count++
      }
    }
  }
  if ($count -eq 0) { return $null }
  return [pscustomobject]@{
    MinX = $minX; MinY = $minY; MaxX = $maxX; MaxY = $maxY
    Width = ($maxX - $minX + 1); Height = ($maxY - $minY + 1); Count = $count
  }
}

$pfc = New-FontCollection
$family = $pfc.Families[0]
Write-Host ("Font: {0}" -f $family.Name)

# ── معايرة موضع الحرف: نرسم الحرف لوحده على خلفية شفافة ────────────
$probeSize = 1024
$probeBmp = New-Object System.Drawing.Bitmap($probeSize, $probeSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$probeG = [System.Drawing.Graphics]::FromImage($probeBmp)
Set-Quality $probeG
$probeG.Clear([System.Drawing.Color]::Transparent)

$probeFontPx = 400.0
$probeFont = New-Object System.Drawing.Font($family, [single]$probeFontPx, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$probeSf = New-Object System.Drawing.StringFormat
$probeSf.Alignment = [System.Drawing.StringAlignment]::Center
$probeSf.LineAlignment = [System.Drawing.StringAlignment]::Center
$probeSf.FormatFlags = [System.Drawing.StringFormatFlags]::NoClip
$probeRect = New-Object System.Drawing.RectangleF(0, 0, $probeSize, $probeSize)
$probeBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::Black)
$probeG.DrawString([string][char]0x0643, $probeFont, $probeBrush, $probeRect, $probeSf)
$probeBrush.Dispose()
$probeG.Dispose()

$ink = Get-InkBounds -bmp $probeBmp -area (New-Object System.Drawing.Rectangle(0, 0, $probeSize, $probeSize)) -inkColor ([System.Drawing.Color]::Black) -tol 90
if ($null -eq $ink) { throw 'Letter glyph did not render - font problem' }

$inkCenterX = ($ink.MinX + $ink.MaxX) / 2
$inkCenterY = ($ink.MinY + $ink.MaxY) / 2
$offsetY = ($probeSize / 2) - $inkCenterY
$offsetX = ($probeSize / 2) - $inkCenterX
$kY = $offsetY / $probeFontPx          # إزاحة رأسية لكل 1px خط
$inkAspect = $ink.Width / $ink.Height
$coverage = 100 * $ink.Count / ($ink.Width * $ink.Height)

Write-Host ("Glyph ink: {0}x{1}px (aspect {2:0.00}) - coverage {3:0}% - offsetX {4:0.0}px @ {5}px font" -f `
  $ink.Width, $ink.Height, $inkAspect, $coverage, $offsetX, $probeFontPx)

if ($coverage -lt 22) { throw ("Glyph looks like a tofu box (coverage {0}%)" -f $coverage) }
if ($inkAspect -lt 0.45 -or $inkAspect -gt 1.9) { throw ("Unexpected glyph aspect {0}" -f $inkAspect) }

$probeBmp.Dispose()
$letterScale = 0.56   # حجم الخط = 56% من عرض الخرطوش

# ── 1) أيقونة 1024 — تمريرة معايرة ثم تمريرة نهائية ─────────────────
$size = 1024
$markW = 520
$markTop = 178
$markH = $markW * 1.18

function New-IconBitmap {
  param([double]$letterDy)
  $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  Set-Quality $g

  $bgRect = New-Object System.Drawing.RectangleF(0, 0, $size, $size)
  $bg = Get-GradientBrush -rect $bgRect -c1 $oliveLight -c2 $oliveDeep -angle 45
  $g.FillRectangle($bg, $bgRect)
  $bg.Dispose()

  # هالة شمس خفيفة
  $haloPath = New-Object System.Drawing.Drawing2D.GraphicsPath
  $haloPath.AddEllipse(512 - 430, 512 - 430, 860, 860)
  $halo = New-Object System.Drawing.Drawing2D.PathGradientBrush($haloPath)
  $halo.CenterColor = [System.Drawing.Color]::FromArgb(46, 122, 138, 74)
  $halo.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 122, 138, 74))
  $g.FillPath($halo, $haloPath)
  $halo.Dispose()
  $haloPath.Dispose()

  Draw-Mark -g $g -cx 512 -top $markTop -w $markW -family $family `
    -solidCartouche $true -cartoucheFill1 $creamWarm -cartoucheFill2 $creamWarm `
    -borderColor $gold -letterColor $oliveDeep -barColor $gold -letterDy $letterDy

  $g.Dispose()
  return $bmp
}

$letterRatio = $kY * $letterScale   # إزاحة رأسية لكل 1px من عرض الخرطوش

Write-Host 'Writing icons...'
$icon = New-IconBitmap -letterDy ($letterRatio * $markW)
Save-Bitmap $icon 'icon.png'

# ── 2) خلفية الأيقونة التكيفية 512 ─────────────────────────────────
$bmp = New-Object System.Drawing.Bitmap(512, 512, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
Set-Quality $g
$r = New-Object System.Drawing.RectangleF(0, 0, 512, 512)
$b = Get-GradientBrush -rect $r -c1 $oliveLight -c2 $oliveDeep -angle 45
$g.FillRectangle($b, $r)
$b.Dispose()
$g.Dispose()
Save-Bitmap $bmp 'android-icon-background.png'

# ── 3) مقدمة الأيقونة التكيفية 512 (شفافة) ────────────────────────
$bmp = New-Object System.Drawing.Bitmap(512, 512, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
Set-Quality $g
$g.Clear([System.Drawing.Color]::Transparent)
$fw = 300
$ftop = (512 - ($fw * 1.18 + $fw * 0.101)) / 2
Draw-Mark -g $g -cx 256 -top $ftop -w $fw -family $family `
  -solidCartouche $true -cartoucheFill1 $creamWarm -cartoucheFill2 $creamWarm `
  -borderColor $gold -letterColor $oliveDeep -barColor $gold -letterDy ($letterRatio * $fw)
$g.Dispose()
Save-Bitmap $bmp 'android-icon-foreground.png'

# ── 4) الأيقونة الأحادية 432 (شفافة، بيضاء) ────────────────────────
$bmp = New-Object System.Drawing.Bitmap(432, 432, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
Set-Quality $g
$g.Clear([System.Drawing.Color]::Transparent)
$mw = 250
$mtop = (432 - ($mw * 1.18 + $mw * 0.101)) / 2
Draw-Mark -g $g -cx 216 -top $mtop -w $mw -family $family `
  -solidCartouche $false -cartoucheFill1 ([System.Drawing.Color]::Transparent) -cartoucheFill2 ([System.Drawing.Color]::Transparent) `
  -borderColor ([System.Drawing.Color]::White) -letterColor ([System.Drawing.Color]::White) -barColor ([System.Drawing.Color]::White) `
  -letterDy ($letterRatio * $mw) -outlineOnly $true -strokeRatio 0.030
$g.Dispose()
Save-Bitmap $bmp 'android-icon-monochrome.png'

# ── 5) السبلاش 1024 (كريمي، بألوان الهوية الأصلية) ─────────────────
$bmp = New-Object System.Drawing.Bitmap(1024, 1024, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
Set-Quality $g
$g.Clear($cream)
$sw = 720
$stop = (1024 - ($sw * 1.18 + $sw * 0.101)) / 2
Draw-Mark -g $g -cx 512 -top $stop -w $sw -family $family `
  -solidCartouche $false -cartoucheFill1 $oliveLight -cartoucheFill2 $oliveDeep `
  -borderColor $gold -letterColor $creamInk -barColor $gold -letterDy ($letterRatio * $sw)
$g.Dispose()
Save-Bitmap $bmp 'splash-icon.png'

# ── 6) فافيكون 48 — تصغير الأيقونة ─────────────────────────────────
$src = [System.Drawing.Image]::FromFile((Join-Path $assets 'icon.png'))
$fav = New-Object System.Drawing.Bitmap(48, 48, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$fg = [System.Drawing.Graphics]::FromImage($fav)
$fg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$fg.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$fg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$fg.DrawImage($src, 0, 0, 48, 48)
$fg.Dispose()
$src.Dispose()
Save-Bitmap $fav 'favicon.png'

$pfc.Dispose()
Write-Host ''
Write-Host ("Done. letter offset = {0:0.0}px per {1}px cartouche width (ratio {2:0.0000})" -f ($letterRatio * $markW), $markW, $letterRatio)
