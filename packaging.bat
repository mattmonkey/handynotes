@echo off
echo  ��ǰĿ¼%~pd0

set pdir=tmp
FOR %%i in (%cd%) do  ( set filename=%%~ni)

IF NOT EXIST install.rdf echo ���ǺϷ�Ŀ¼ & pause & exit

echo �������...
IF EXIST %pdir%  RD %pdir% /S /Q

echo ������ʱĿ¼...
MKDIR %pdir%


echo ����Ŀ¼���ļ�...
ROBOCOPY chrome %pdir%\chrome /E /XA:H /XD .svn
ROBOCOPY defaults %pdir%\defaults /E /XA:H /XD .svn
ROBOCOPY modules %pdir%\modules /E /XA:H /XD .svn
COPY chrome.manifest %pdir% 
COPY install.rdf %pdir% 
COPY LICENSE.txt %pdir%

echo xpi���...
PUSHD %pdir%
REM �����汾��
FOR /F "tokens=1,2 delims=^=" %%i  in ('findstr "em:version" install.rdf') do ( set version=%%j )
set xpifile=%filename%-%version:~1,-2%.xpi
"%JAVA_HOME%\bin\jar.exe" -cvfM %xpifile% .\
popd

copy %pdir%\%xpifile% .\ 
echo ������ ɾ��...
RD %pdir% /S /Q

  
echo XPI�������... & pause > nul
