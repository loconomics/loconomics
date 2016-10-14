
# PhoneGap Build

The cloud service is used to create the intallation packages for iOS and Android. To perform that task in your own computer, you need the SDKs of each platform.

Note that the Phonegap plugins must be installed before building in order to be included in the local build. You can do this from the /app/phonegap directory and typing into the command line:
```
phonegap plugin add https://git-wip-us.apache.org/repos/asf/cordova-plugin-inappbrowser.git
```
The file /app/source/cordova-config.js.xml has a list of all the plugins in use (look at the *gap:plugin* elements), this config is used by the PhoneGap Build service to automatically install them. The version in use is there too, but not the git URL. To find the git URL for a package, search by the package name at [npm](https://www.npmjs.com/).

## iOS 
[Download and install Apple XCode](https://itunes.apple.com/us/app/xcode/id497799835?mt=12) and run the command:
```
phonegap build ios
```  

## Android
[Download and install Android Studio](https://developer.android.com/studio/index.html) and run the command:
```
phonegap build android
```

## Web
In terminal enter command:
```
grunt build-webapp
```
or for html only:
```
grunt build-webapp-html 
```
Replace the following via FTP in Azure from your local machine:
- web/_specialRoutes/app.html (single file)
- web/assets (all folder contents)

