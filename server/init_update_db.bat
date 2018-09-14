echo off
set CONFIG=%~dp0\config\config.my

set DB_INIT_MAIN_JS=%~dp0\sql\db_init_and_update.js


node.exe %DB_INIT_MAIN_JS% %CONFIG%

rem COLOR 0A
rem CLS

echo init database and update complete!......

pause