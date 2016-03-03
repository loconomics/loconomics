##Setting up a new backend dev environment using our host provider##
###Setting up a new database###
- Create a backup of current dev database
- Create a database using the dev backup named devYOURNAME (either on your local machine or ask @dani0198 or @iagosrl for one on the server)

###Setting up the app code###
- Copy the dev folder to your local machine to make these changes:
  - Rename the folder devYOURNAME

###Setting up the web config - should only be done by @iagosrl###
- Make the following changes to the devYOURNAME/web.config file:
  - <add key="Channel" value="devYOURNAME" />
  - change any reference of 31755_dev to 31755_devYOURNAME (all passwords remain the same)
- Copy the loconomi/web.config file to your local machine to make these changes:
  - Make a copy of original and name it web.last2.config (so you still have web.last.config)
  - Add 
    ```
    <add input="{HTTP_HOST}" pattern="^(www\.)?devYOURNAME\.loconomics\.com$" negate="true" />
    ``` 
  - Copy the  <!-- dev --> section and change any "dev" to "devYOURNAME"
- Put the new loconomi/web.config and web.last2.config into loconomi and test the dev and live sites to ensure they continue to work
- Put the devYOURNAME folder (with new web.config file) into loconomi
- Register the asp.net virtual app, by going to the hosting provider's control panel, [Application Starting Point] (https://cp.winhost.com/sites/application.aspx), and create it just selecting the folder.
- In order to work, the file must have the name *web.config* always (forced by asp.net).
- Rename the *web.channel.config* file to *web.config* when uploading it to the FTP server to devYOURNAME folder only.
- Keep the previous version of the server web.config, just renaming it to web.last.config, just in case something was wrong and the website breaks completely, I can quickly rollback by dropping the updated file and rename the web.last.config to web.config, and everything keeps working again; with more time to review the error in the log file and fix it before try again :-)
- Upload customized web.config to the *master* branch **but** renamed as *web.devYOURNAME.config* leaving original web.config at *master* (or any other branch) untouched (updates done only by @iagosrl).

###Making future changes to the web.config file###
- Upload the *web.channel.config* file to the channel folder in the FTP (where *channel* is the channel and folder name: dev, devYOURNAME, testing, staging, live).
- Once uploaded, remove from the FTP the file named *web.last.config*
- Rename in the FTP the *web.config* file to *web.last.config* (this is the new *last* config, just meaning is the previous file, the **last we know it works**).
- Rename the just uploaded *web.channel.config* to *web.config*.
- Open the website in the browser to see that it just works (no big error and all the site down); remember, is not just the website, but all the REST API too. **It will take an extra time to load**, is fine, it happens because the server asp.net app is reloading as result of detect a change at the web.config file.

### Special web.root.config
There is no a channel named *root*, but this is the *web.config* file we have in the root of our FTP and **it affects to all the channels**.
Here there are global things, but most important is the set-up to enable several channels, each one is an asp.net app attached to a subdomain, or in the case of *live*, to the domain (loconomics.com).

This means is **very sensitive**, same like touching the *live* config file: if a bad change is introduced on this file, all the channels go down, including *live*.
Rarely we need to do changes here.

### Maintenance mode at the root web.config
We can put the *live* website in maintenance mode in order to perform updates.
There is a setting at the root web.cinfig, that usually is touched directly on the FTP file, that lets to enable a maintenance mode that will display to any URL the content of the /live/maintenance.html file. It's an static file, will work even if the asp.net app is reloading because updates are being uploaded and the database being upgraded.
On the best case, uploading will take a few minutes, 5 or less. With a database upgrade being needed, being a bit manually still now, a bit more. With lot of files to upload because of a big update, even more.
But even if is expected that will take a short time, is good to put in this mode, just to prevent strange errors appearing to users and false errors being reported by some of them (this way they will see a common error, the maintenance message).

**Important**: only the *loconomics.com* site and REST API goes offline with this. Can still be accessed (maybe to double check update worked or to use the /tests/testDbSync page) using the subdomain *live.loconomics.com*. Other subdomains/channels will work too.

### How to put in maintenance mode
- edit the root web.config (at the FTP folder you see after connect),
- locate next line (currently number 17)
> &lt;rule name="maintenance-mode" enabled="false" stopProcessing="true"&gt;

- Change the *enabled="false"* to *enabled="true"
- Save/upload
- Revert to disable maintenance

To have configuration for a specific server, specially sensitive things like passwords, into files and into a repository, is not a recommended thing usually, but I didn't find how to manage it in other way, taking care that asp.net web.config files include more than just *config* or environment settings, and that things are good to keep saved and tracked. One of the problems is that anyone with access to the repository can see the passwords. But for now, we go this way, keeping all channels web.configs at github, with the channel name.

This way, if there is some of that *special config* things, that affect how the whole website/backend works, that need update, I can do it in all the files, upload them, and keep tract at git of the change. And example is the recent case where I need to adjust some "hidden directories" settings to prevent web access to sensitive content (logs) and the addition of a new supported file extension (.woff2) so the download of webfonts of that format can work on the server (by default, they don't work, triggering browser error and no font/icons being loaded).
