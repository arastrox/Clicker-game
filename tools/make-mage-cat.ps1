# Genera los frames de la Hechicera: gata cuadrúpeda + sombrero de bruja
# anclado a la cabeza (40% frontal del bbox, mira a la izquierda).
Add-Type -AssemblyName System.Drawing
$out = 'C:\Proyects\Clicker-game\public\assets\sprites\frames'
$pad = 18

function Draw-Hat($g, [int]$cx, [int]$topY) {
  $body = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 94, 58, 140))
  $dark = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 56, 30, 92))
  $band = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 255, 122, 217))
  $gold = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 255, 213, 79))
  $bottom = $topY + 6
  $g.FillRectangle($dark, $cx - 13, $bottom - 4, 26, 4)
  $g.FillRectangle($body, $cx - 11, $bottom - 5, 22, 2)
  $g.FillRectangle($band, $cx - 8, $bottom - 9, 16, 5)
  $g.FillRectangle($gold, $cx - 2, $bottom - 9, 4, 5)
  $g.FillRectangle($body, $cx - 8, $bottom - 13, 15, 4)
  $g.FillRectangle($body, $cx - 6, $bottom - 17, 11, 4)
  $g.FillRectangle($body, $cx - 3, $bottom - 21, 7, 4)
  $g.FillRectangle($dark, $cx + 1, $bottom - 24, 4, 4)
  foreach ($b in @($body, $dark, $band, $gold)) { $b.Dispose() }
}

foreach ($kind in @('idle', 'run')) {
  for ($i = 0; $i -lt 6; $i++) {
    $src = New-Object System.Drawing.Bitmap("$out\cat_rogue_${kind}_anim_f$i.png")
    $w = $src.Width; $h = $src.Height
    $minX = $w; $maxX = 0
    for ($y = 0; $y -lt $h; $y++) {
      for ($x = 0; $x -lt $w; $x++) {
        if ($src.GetPixel($x, $y).A -gt 10) {
          if ($x -lt $minX) { $minX = $x }
          if ($x -gt $maxX) { $maxX = $x }
        }
      }
    }
    $headEnd = $minX + [int](($maxX - $minX) * 0.4)
    $headTop = $h; $sumX = 0; $n = 0
    for ($y = 0; $y -lt $h; $y++) {
      for ($x = $minX; $x -le $headEnd; $x++) {
        if ($src.GetPixel($x, $y).A -gt 10) {
          if ($y -lt $headTop) { $headTop = $y }
          if ($y -le $headTop + 3) { $sumX += $x; $n++ }
        }
      }
    }
    $cx = if ($n -gt 0) { [int]($sumX / $n) } else { $minX + 8 }
    $dst = New-Object System.Drawing.Bitmap($w, ($h + $pad))
    $g = [System.Drawing.Graphics]::FromImage($dst)
    $g.DrawImage($src, 0, $pad, $w, $h)
    Draw-Hat $g $cx ($headTop + $pad)
    $g.Dispose(); $src.Dispose()
    $dst.Save("$out\cat_mage_${kind}_anim_f$i.png")
    $dst.Dispose()
  }
}
Write-Output "mage frames listos: $((Get-ChildItem $out -Filter 'cat_mage_*').Count)"
