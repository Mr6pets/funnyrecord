@SETLOCAL
@IF NOT DEFINED NODE_PATH (
  @SET "NODE_PATH=C:\Users\Administrator\AppData\Roaming\npm\global\5\.pnpm\pnpm@10.15.0\node_modules\pnpm\bin\node_modules;C:\Users\Administrator\AppData\Roaming\npm\global\5\.pnpm\pnpm@10.15.0\node_modules\pnpm\node_modules;C:\Users\Administrator\AppData\Roaming\npm\global\5\.pnpm\pnpm@10.15.0\node_modules;C:\Users\Administrator\AppData\Roaming\npm\global\5\.pnpm\node_modules"
) ELSE (
  @SET "NODE_PATH=C:\Users\Administrator\AppData\Roaming\npm\global\5\.pnpm\pnpm@10.15.0\node_modules\pnpm\bin\node_modules;C:\Users\Administrator\AppData\Roaming\npm\global\5\.pnpm\pnpm@10.15.0\node_modules\pnpm\node_modules;C:\Users\Administrator\AppData\Roaming\npm\global\5\.pnpm\pnpm@10.15.0\node_modules;C:\Users\Administrator\AppData\Roaming\npm\global\5\.pnpm\node_modules;%NODE_PATH%"
)
@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe"  "C:\Users\Administrator\AppData\Roaming\npm\global\5\node_modules\pnpm\bin\pnpm.cjs" %*
) ELSE (
  @SET PATHEXT=%PATHEXT:;.JS;=;%
  node  "C:\Users\Administrator\AppData\Roaming\npm\global\5\node_modules\pnpm\bin\pnpm.cjs" %*
)
