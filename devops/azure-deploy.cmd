@if "%SCM_TRACE_LEVEL%" NEQ "4" @echo off

REM ----------------------
REM KUDU Deployment Script
REM Version: 1.0.17
REM ----------------------

REM Prerequisites
REM -------------

REM Verify node.js installed
where node 2>nul >nul
IF %ERRORLEVEL% NEQ 0 (
  echo Missing node.js executable, please install node.js, if already installed make sure it can be reached from current environment.
  goto error
)

REM Setup
REM -----

setlocal enabledelayedexpansion

SET ARTIFACTS=%~dp0%..\artifacts

IF NOT DEFINED DEPLOYMENT_SOURCE (
  SET DEPLOYMENT_SOURCE=%~dp0%.
)

IF NOT DEFINED DEPLOYMENT_TARGET (
  SET DEPLOYMENT_TARGET=%ARTIFACTS%\wwwroot
)

IF NOT DEFINED NEXT_MANIFEST_PATH (
  SET NEXT_MANIFEST_PATH=%ARTIFACTS%\manifest

  IF NOT DEFINED PREVIOUS_MANIFEST_PATH (
    SET PREVIOUS_MANIFEST_PATH=%ARTIFACTS%\manifest
  )
)

IF NOT DEFINED KUDU_SYNC_CMD (
  REM Install kudu sync
  echo Installing Kudu Sync
  call npm install kudusync -g --silent
  IF !ERRORLEVEL! NEQ 0 goto error

  REM Locally just running "kuduSync" would also work
  SET KUDU_SYNC_CMD=%appdata%\npm\kuduSync.cmd
)
IF NOT DEFINED DEPLOYMENT_TEMP (
  SET DEPLOYMENT_TEMP=%temp%\___deployTemp%random%
  SET CLEAN_LOCAL_DEPLOYMENT_TEMP=true
)

IF DEFINED CLEAN_LOCAL_DEPLOYMENT_TEMP (
  IF EXIST "%DEPLOYMENT_TEMP%" rd /s /q "%DEPLOYMENT_TEMP%"
  mkdir "%DEPLOYMENT_TEMP%"
)

IF DEFINED MSBUILD_PATH goto MsbuildPathDefined
SET MSBUILD_PATH=%ProgramFiles(x86)%\MSBuild\14.0\Bin\MSBuild.exe
:MsbuildPathDefined

REM Node set-up
SET NPM_CMD=npm
SET NODE_EXE=node
echo Node version
call :ExecuteCmd %NODE_EXE% -v
echo NPM version
call :ExecuteCmd %NPM_CMD% -v

REM Excluding files from syncing
REM Default list by KuduSync (deploy related files)
SET IGNORE_DEPLOY_FILES=.git;.hg;.deployment;deploy.cmd
REM Extended list, with our specific content that must not be copied into wwwroot
REM note: Excluding additional things, like Tests folder, on production/live
SET IGNORE_LIST=%IGNORE_DEPLOY_FILES%;.gitignore
IF "%CHANNEL%" EQU "live" (
  SET IGNORE_LIST=%IGNORE_LIST%;Tests
)

REM::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
REM Building
REM ----------
REM 0. Detect if a webapp rebuild is needed: Is it enabled and app package.json has changed?
REM By default, build is 0, like if AUTO_WEBAPP_BUILD had value "OFF" (or any unsupported value)
SET DO_WEBAPP_BUILD=0
SET DEPLOY_META_LAST_PACKAGE_JSON=%DEPLOYMENT_SOURCE%\..\deployments\last-app-package.json
SET DEPLOY_META_CURRENT_PACKAGE_JSON=%DEPLOYMENT_SOURCE%\app\package.json
REM NOTE: we have a env var to set this building OFF/ON/DETECT, as we usually set-it as ON (ever rebuild) at
REM dev channel/others since we don't update app version on changes there (could get triggered by other changes, usually modules or task set-up),
REM while on live/production we ever must update the version at the app/package.json by rule, so we are in 'DETECT' mode letting us to have 
REM faster updates when no webapp build needed.
IF /I "%AUTO_WEBAPP_BUILD%" EQU "ON" SET DO_WEBAPP_BUILD=1
IF /I "%AUTO_WEBAPP_BUILD%" EQU "DETECT" (
	REM Compare files with FC
	REM FC returned program codes:
	REM 1 means: there are differences between both files
	REM 0 means: no differences
	REM 2 means file not found
	REM -1 means: invalid syntax
	REM It is weird, but FC command doesn't set the ERRORLEVEL variable but the special code (used in IF without %_%)
	REM that has ever a greater-than comparision (see https://ss64.com/nt/errorlevel.html)
	call fc /LB1 "%DEPLOY_META_CURRENT_PACKAGE_JSON%" "%DEPLOY_META_LAST_PACKAGE_JSON%" 2>NUL >NUL
	IF ERRORLEVEL 1 SET DO_WEBAPP_BUILD=1
	REM no file (first time) or differences, request build!
	REM after success build, we will copy the file so it becomes the new 'last' one
)

IF %DO_WEBAPP_BUILD% EQU 0 goto AfterWebappBuild

REM 1. Build Webapp
echo Prepare environment to build WebApp
REM .a Install Yarn
echo Install Yarn if unavailable
SET YARN_PATH=%DEPLOYMENT_SOURCE%\node_modules\yarn\bin\yarn.cmd
IF NOT EXIST %YARN_PATH% (
  pushd %DEPLOYMENT_SOURCE%
  call :ExecuteCmd %NPM_CMD% i --no-save yarn
  popd
  IF !ERRORLEVEL! NEQ 0 goto error
)
REM .b Enter app dir
pushd %DEPLOYMENT_SOURCE%\app
REM .c Install Dependencies
echo Install app dependencies
call :ExecuteCmd %YARN_PATH% install
IF !ERRORLEVEL! NEQ 0 goto error
REM .e Build Webapp (already copy contents on the /web dir)
echo Building WebApp
call :ExecuteCmd %YARN_PATH% run build-web-release
IF !ERRORLEVEL! NEQ 0 goto error
REM .f Exit app dir (restore previous location)
popd
REM Z: on success end, copy package file to track future changes
copy /Y /V %DEPLOY_META_CURRENT_PACKAGE_JSON% %DEPLOY_META_LAST_PACKAGE_JSON%
IF !ERRORLEVEL! NEQ 0 goto error

:AfterWebappBuild

REM::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
REM Deployment
REM ----------

echo Handling .NET Web Site deployment.

REM 1. Prepare web.config file to deploy with Release settings
call :ExecuteCmd "%MSBUILD_PATH%" web/deploy-config.proj /verbosity:m /nologo /p:Configuration=Release /t:TransformConfig
call :ExecuteCmd "%MSBUILD_PATH%" web/deploy-config.proj /verbosity:m /nologo /p:Configuration=Release /t:CleanTransformConfig

REM 2. Restore NuGet packages
: Disabled since was unable to make it work. No the packages folder is commited into the repo
REM call :ExecuteCmd nuget.exe restore "%DEPLOYMENT_SOURCE%\web\Loconomics.sln" -MSBuildPath "%ProgramFiles(x86)%\MSBuild\14.0\Bin"

REM 3. Build to the repository path
call :ExecuteCmd "%MSBUILD_PATH%" "%DEPLOYMENT_SOURCE%\web\Loconomics.sln" /verbosity:m /nologo %SCM_BUILD_ARGS%
IF !ERRORLEVEL! NEQ 0 goto error

REM 4. KuduSync
IF /I "%IN_PLACE_DEPLOYMENT%" NEQ "1" (
  echo "KuduSync IgnoreList:" %IGNORE_LIST%
  call :ExecuteCmd "%KUDU_SYNC_CMD%" -v 50 -f "%DEPLOYMENT_SOURCE%\web" -t "%DEPLOYMENT_TARGET%" -n "%NEXT_MANIFEST_PATH%" -p "%PREVIOUS_MANIFEST_PATH%" -i "%IGNORE_LIST%"
  IF !ERRORLEVEL! NEQ 0 goto error
)

REM:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
goto end

REM Execute command routine that will echo out when error
:ExecuteCmd
setlocal
set _CMD_=%*
call %_CMD_%
if "%ERRORLEVEL%" NEQ "0" echo Failed exitCode=%ERRORLEVEL%, command=%_CMD_%
exit /b %ERRORLEVEL%

:error
endlocal
echo An error has occurred during web site deployment.
call :exitSetErrorLevel
call :exitFromFunction 2>nul

:exitSetErrorLevel
exit /b 1

:exitFromFunction
()

:end
endlocal
echo Finished successfully.
