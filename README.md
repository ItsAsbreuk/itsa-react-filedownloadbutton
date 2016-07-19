File downloadbutton, which uses a HTML5 FileSaver when possible, otherwise a native anchor-link.

`Browser-support:` *all*

#### Why this component:
* In modern browsers, you won't see an extra window created when downloading a file. Just a small thing, but it leads into a much better user-experience!
* The anchor-element is styled as a button (default)
* Native a-href fallback for browsers that don;t support `blob` (IE9-)

#### How it works:
In case the browser does not support `blob` (IE9-), then the download will be done by a simple a-href, targetting a new window for the downloadfile.

However, in all modern browsers, the file-download will go through the `FileSaver` feature, which is delevired by `node-safe-filesaver` In practice, the a-href will be default-prevented and an ajax GET-request will be initiated.


## How to use:

```js
"use strict";

require("itsa-react-anchorbutton/css/component.scss"),

const React = require("react"),
    ReactDOM = require("react-dom"),
    FileDownloadButton = require("itsa-react-filedownloadbutton");

const props = {
    autoFocus: true,
    href: "http://imageuploader.itsa.io/downloadfile/hello world.pdf",
    labelHTML: "Download"
};

ReactDOM.render(
    <FileDownloadButton {...props} />,
    document.getElementById("component-container")
);
```

## Serverside setup
In order to have the files loaded, you'' need to setup the server as well. itsa-react-filedownloadbutton makes it easy, in a way that you don't need special setup for having the `saveAs`-feature working. There are some things to be aware of though, when you are using CORS.

#### Setup same domain (hapijs):
```js
{
    method: 'GET',
    path: '/downloadfile/{filename}',
    handler: function(request, reply) {
        var filename = request.params.filename,
            stream = fs.createReadStream("/var/www/vhosts/yourdomain.com/files/"+filename);
        reply(stream)
        .header('Content-Disposition', 'attachment; filename="' + filename + '"');
    }
}
```

#### Setup same domain (hapijs):
```js
{
    method: 'OPTIONS',
    path: '/downloadfile/{filename}',
    handler: function(request, reply) {
        var requestHeaders = request.headers['access-control-request-headers'];
        reply().header('access-control-allow-origin', '*')
               .header('access-control-allow-methods', 'GET')
               .header('access-control-allow-headers', requestHeaders)
               .header('access-control-max-age', '1728000')
               .header('content-length', '0');
    }
},

{
    method: 'GET',
    path: '/downloadfile/{filename}',
    handler: function(request, reply) {
        var filename = request.params.filename,
            stream = fs.createReadStream("/var/www/vhosts/yourdomain.com/files/"+filename);
        reply(stream)
        .header('Content-Disposition', 'attachment; filename="' + filename + '"')
        .header('access-control-allow-origin', '*');
    }
}
```

*Special note about CORS:*
The filename that pops-up on the client cannot be determined by `Content-Disposition` in case CORS is active and HTML5 saveAs is operational. In these cases (IE9-), the filename will be determined based upon `href`. This will lead into the same name in most cases. Just be aware that using `CORS` and defining a different `filename` to `Content-Disposition` (different than specified by `href`) will lead into different filenames on the client wit IE9-.

## About the css

You need the right css in order to make use of `itsa-react-filedownloadbutton`. There are 2 options:

1. You can use the css-files of *itsa-react-anchorbutton* --> require("itsa-react-anchorbutton/css/component.scss").
2. You can use: `Component = require("itsa-react-filedownloadbutton/lib/component-styled.jsx");` and build your project with `webpack`. This is needed, because you need the right plugin to handle a requirement of the `scss`-file.


[View live example](http://projects.itsasbreuk.nl/react-components/itsa-filedownloadbutton/component.html)

[API](http://projects.itsasbreuk.nl/react-components/itsa-filedownloadbutton/api/)