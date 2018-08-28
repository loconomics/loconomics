@if "%SCM_TRACE_LEVEL%" NEQ "4" @echo off

:: ----------------------
:: KUDU Deployment Script
:: Version: 1.0.17
:: ----------------------

:: Prerequisites
:: -------------

:: Verify node.js installed
where node 2>nul >nul
IF %ERRORLEVEL% NEQ 0 (
  echo Missing node.js executable, please install node.js, if already installed make sure it can be reached from current environment.
  goto error
)

:: Setup
:: -----

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
  :: Install kudu sync
  echo Installing Kudu Sync
  call npm install kudusync -g --silent
  IF !ERRORLEVEL! NEQ 0 goto error

  :: Locally just running "kuduSync" would also work
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

:: Node set-up
SET NPM_CMD=npm
SET NODE_EXE=node
echo Node version
call :ExecuteCmd %NODE_EXE% -v
echo NPM version
call :ExecuteCmd %NPM_CMD% -v

:: Excluding files from syncing
:: Default list by KuduSync (deploy related files)
SET IGNORE_DEPLOY_FILES=.git;.hg;.deployment;deploy.cmd
:: Extended list, with our specific content that must not be copied into wwwroot
:: note: Excluding additional things, like Tests folder, on production/live
SET IGNORE_LIST=%IGNORE_DEPLOY_FILES%;.gitignore
IF "%CHANNEL%" EQU "live" (
  SET IGNORE_LIST=%IGNORE_LIST%;Tests
)

::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
:: Building
:: ----------

:: 1. Build Webapp
:: .a Install Yarn
echo Prepare environment to build WebApp
call :ExecuteCmd %NPM_CMD% install -g yarn
SET YARN_PATH=%DEPLOYMENT_SOURCE%\node_modules\.bin\yarn
IF !ERRORLEVEL! NEQ 0 goto step1b
:step1b
:: .b Enter app dir
pushd %DEPLOYMENT_SOURCE%\app
:: .c Install Dependencies
call :ExecuteCmd %YARN_PATH% install
IF !ERRORLEVEL! NEQ 0 goto error
:: .e Build Webapp (already copy contents on the /web dir)
echo Building WebApp
call :ExecuteCmd %YARN_PATH% run build-web-release
IF !ERRORLEVEL! NEQ 0 goto error
:: .f Exit app dir (restore previous location)
popd

::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
:: Deployment
:: ----------

echo Handling .NET Web Site deployment.

:: 1. Prepare web.config file to deploy with Release settings
call :ExecuteCmd "%MSBUILD_PATH%" web/deploy-config.proj /verbosity:m /nologo /p:Configuration=Release /t:TransformConfig
call :ExecuteCmd "%MSBUILD_PATH%" web/deploy-config.proj /verbosity:m /nologo /p:Configuration=Release /t:CleanTransformConfig

:: 2. Restore NuGet packages
: Disabled since was unable to make it work. No the packages folder is commited into the repo
REM call :ExecuteCmd nuget.exe restore "%DEPLOYMENT_SOURCE%\web\Loconomics.sln" -MSBuildPath "%ProgramFiles(x86)%\MSBuild\14.0\Bin"

:: 3. Build to the repository path
call :ExecuteCmd "%MSBUILD_PATH%" "%DEPLOYMENT_SOURCE%\web\Loconomics.sln" /verbosity:m /nologo %SCM_BUILD_ARGS%
IF !ERRORLEVEL! NEQ 0 goto error

:: 4. KuduSync
IF /I "%IN_PLACE_DEPLOYMENT%" NEQ "1" (
  echo "KuduSync IgnoreList:" %IGNORE_LIST%
  call :ExecuteCmd "%KUDU_SYNC_CMD%" -v 50 -f "%DEPLOYMENT_SOURCE%\web" -t "%DEPLOYMENT_TARGET%" -n "%NEXT_MANIFEST_PATH%" -p "%PREVIOUS_MANIFEST_PATH%" -i "%IGNORE_LIST%"
  IF !ERRORLEVEL! NEQ 0 goto error
)

::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
goto end

:: Execute command routine that will echo out when error
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
