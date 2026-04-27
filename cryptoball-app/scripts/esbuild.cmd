@echo off
setlocal
node "%~dp0..\node_modules\esbuild\bin\esbuild" %*
