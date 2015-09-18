# Bootstrap custom download

The contents of this directory are from the Bootstrap Customizer and a few
additions to work with the code.

The /config2less-vars.js allows to create a Less file from the 
downloaded config.json with the variables, suitable for custom compilations
using the rest of the Bootstrap source code or plug-ins.

**The complete source code for Bootstrap is not included here right now**.
Just build files and some sources generated/manipulated (the /less and /styl folders).

## Creating files from custom config.json
This is needed so CSS can be rebuild on the App to get any variable change on the custom Bootstrap download.

### Automatic way and Grunt task
The script prepare.js in this directory automates all the process, generating the less and styl files with variables from the config.json file.
Just execute with nodejs
> node prepare

It just save every file in the expected place.

In the App Grunt configuration, there is a custom task registered that runs this automatically, its named prepare-bootstrap-variables

### Manual, step by step, way
With command line tools, in this folder (/vendor/bootstrap) run:
> node config2less-vars.js > less/variables.less
After that, file need to be converted to UTF-8 encoding (when Windows Powershell, this generates UCS-2 encoding incompatible with Nodejs tools)

> less2stylus ./less/variables.less > ./styl/variables.styl
After that, file need to be converted to UTF-8 without BOM encoding (when Windows Powershell, this generates UCS-2 encoding incompatible with Nodejs tools)

### Ending
In the project folder, rebuild CSS with the Grunt task 'build-css'
> grunt build-css

If there was JS changes (like after download an updated Bootstrap version), rebuild JS too:
> grunt build-js
