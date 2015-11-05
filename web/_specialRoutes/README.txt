Special Routes folder (hidden from direct URL access thanks to the underscore prefix) holds several files routed through the AppStar file using calls to RouteTable.Routes.MapWebPageRoute, and are located here to don't mix with root files.
It includes some files that does not use special routes but are URL-located in the root, again just to don't mix with main Default handler, config and other files that is mandatory to locate in the root folder.
Other special routes handlers can be located on other folders, like the REST API ones, but others without better place are located here.

Files starting with lodash character are meant to be used as partials/components (through RenderPage(..)).