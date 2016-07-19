"use strict";

require("ypromise");

const React = require("react"),
    ReactDOM = require("react-dom"),
    FileDownloadButton = require("./lib/component-styled.jsx");

const props1 = {
    autoFocus: true,
    href: "http://imageuploader.itsa.io/downloadfile/hello world.pdf",
    labelHTML: "Download"
};

const props2 = {
    href: "http://imageuploader.itsa.io/downloadfile/hello world.pdf",
    labelHTML: "Download",
    buttonLook: false
};

ReactDOM.render(
    <FileDownloadButton {...props1} />,
    document.getElementById("component-container1")
);

ReactDOM.render(
    <FileDownloadButton {...props2} />,
    document.getElementById("component-container2")
);
