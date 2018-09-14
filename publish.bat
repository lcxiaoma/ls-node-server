@echo off

if not exist "./publish" md "./publish"
if not exist "./publish/server" md "./publish/server"
rem set publish_data = "2-21-2017"
rem set nian=2017
rem set yue=2
rem set ri=21
rem /d:%yue%-%ri%-%nian%
if exist .\publish\server xcopy  .\server  .\publish\server\  /s/e/y

rem clean unuse
del .\publish\server\vscproject.bat
del /f /s /q .\publish\server\logs\*.log
rmdir /s/q .\publish\server\tests
rmdir /s/q .\publish\server\.vscode

rem package
rem need modified date
7z a -ttar .\publish\publish_20170711.02.tar .\publish\server
rem delete cache
rmdir /s/q .\publish\server
pause