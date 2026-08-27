; ============================================================
;  J.A.R.V.I.S. - Instalador (NSIS)
;  Gera: JARVIS-Setup.exe com atalhos e desinstalador.
;  Requer NSIS (https://nsis.sourceforge.io) e o jarvis.exe do build.
; ============================================================

!include "MUI2.nsh"
!include "x64.nsh"

Name "JARVIS"
OutFile "dist\JARVIS-Setup.exe"
InstallDir "$PROGRAMFILES64\JARVIS"
InstallDirRegKey HKLM "Software\JARVIS" "InstallDir"
RequestExecutionLevel admin
Icon "assets\icon.ico"
UninstallIcon "assets\icon.ico"

!define MUI_ICON "assets\icon.ico"
!define MUI_UNICON "assets\icon.ico"
!define MUI_ABORTWARNING

; ----- Páginas -----
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

; ----- Idiomas -----
!insertmacro MUI_LANGUAGE "Portuguese"
!insertmacro MUI_LANGUAGE "English"

; ----- Seção padrão -----
Section "JARVIS Principal" SEC01
  SetOutPath "$INSTDIR"

  ; Copia o executável e os assets
  File "dist\jarvis.exe"
  File /oname=icon.ico "assets\icon.ico"

  ; Cria o atalho no Menu Iniciar
  CreateDirectory "$SMPROGRAMS\JARVIS"
  CreateShortCut "$SMPROGRAMS\JARVIS\JARVIS.lnk" "$INSTDIR\jarvis.exe" "" "$INSTDIR\jarvis.exe" 0
  ; Cria o atalho no Desktop
  CreateShortCut "$DESKTOP\JARVIS.lnk" "$INSTDIR\jarvis.exe" "" "$INSTDIR\jarvis.exe" 0

  ; Registra desinstalador
  WriteUninstaller "$INSTDIR\uninstall.exe"

  ; Registra no Add/Remove Programs
  WriteRegStr HKLM "Software\JARVIS" "InstallDir" "$INSTDIR"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\JARVIS" "DisplayName" "JARVIS"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\JARVIS" "DisplayIcon" "$INSTDIR\jarvis.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\JARVIS" "UninstallString" "$INSTDIR\uninstall.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\JARVIS" "Publisher" "Tony Stark"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\JARVIS" "DisplayVersion" "1.0.0"
SectionEnd

; ----- Seção de desinstalação -----
Section "Uninstall"
  ; Remove arquivos
  Delete "$INSTDIR\jarvis.exe"
  Delete "$INSTDIR\icon.ico"
  Delete "$INSTDIR\uninstall.exe"
  RMDir "$INSTDIR"

  ; Remove atalhos
  Delete "$SMPROGRAMS\JARVIS\JARVIS.lnk"
  RMDir "$SMPROGRAMS\JARVIS"
  Delete "$DESKTOP\JARVIS.lnk"

  ; Remove registros
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\JARVIS"
  DeleteRegKey HKLM "Software\JARVIS"
SectionEnd
