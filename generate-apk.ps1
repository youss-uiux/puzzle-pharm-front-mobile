# Script pour générer l'APK localement ou via EAS

Write-Host "Choisissez la méthode de génération :" -ForegroundColor Cyan
Write-Host "1. Via EAS Build (Cloud - Recommandé)"
Write-Host "2. Localement (Nécessite Android Studio/SDK installé)"

$choice = Read-Host "Votre choix (1 ou 2)"

if ($choice -eq "1") {
    Write-Host "Lancement du build EAS (profil preview)..." -ForegroundColor Yellow
    eas build --platform android --profile preview
} elseif ($choice -eq "2") {
    Write-Host "Lancement du build local..." -ForegroundColor Yellow
    npx expo run:android --variant release
} else {
    Write-Host "Choix invalide." -ForegroundColor Red
}
