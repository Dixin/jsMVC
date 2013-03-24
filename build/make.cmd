@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe"  "%~dp0\build.node.js" %*
) ELSE (
  node  "%~dp0\build.node.js" %*
)
