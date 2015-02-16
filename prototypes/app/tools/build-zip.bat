echo "Remove previous latest package"
del /F "../tools/latest.zip"
echo "Place us on the directory"
cd ../phonegap
echo "Package new version"
"C:\Program Files (x86)\7-Zip\7z.exe" a ../tools/latest.zip www/ .cordova/ hooks/ config.xml
echo "Done!"
cd ../tools
pause