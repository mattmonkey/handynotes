@echo off
echo  当前目录%~pd0

set pdir=tmp
FOR %%i in (%cd%) do  ( set filename=%%~ni)

IF NOT EXIST install.rdf echo 不是合法目录 & pause & exit

echo 清除工作...
IF EXIST %pdir%  RD %pdir% /S /Q

echo 创建临时目录...
MKDIR %pdir%


echo 复制目录和文件...
ROBOCOPY chrome %pdir%\chrome /E /XA:H /XD .svn
ROBOCOPY defaults %pdir%\defaults /E /XA:H /XD .svn
ROBOCOPY modules %pdir%\modules /E /XA:H /XD .svn
COPY chrome.manifest %pdir% 
COPY install.rdf %pdir% 
COPY LICENSE.txt %pdir%

echo xpi打包...
PUSHD %pdir%
REM 解析版本号
FOR /F "tokens=1,2 delims=^=" %%i  in ('findstr "em:version" install.rdf') do ( set version=%%j )
set xpifile=%filename%-%version:~1,-2%.xpi
"%JAVA_HOME%\bin\jar.exe" -cvfM %xpifile% .\
popd

copy %pdir%\%xpifile% .\ 
echo 清理工作 删除...
RD %pdir% /S /Q

  
echo XPI打包结束... & pause > nul
