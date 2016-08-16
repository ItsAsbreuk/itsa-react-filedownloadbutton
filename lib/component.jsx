/*eslint no-empty: 0*/

"use strict";

/**
 * Description here
 *
 *
 *
 * <i>Copyright (c) 2016 ItsAsbreuk - http://itsasbreuk.nl</i><br>
 * New BSD License - http://choosealicense.com/licenses/bsd-3-clause/
 *
 *
 * @module component.jsx
 * @class Component
 * @since 15.0.0
*/

require("itsa-jsext");
require("itsa-dom");

let SAVEAS_SUPPORT = false,
    saveAs, isSafari;

const React = require("react"),
    ReactDom = require("react-dom"),
    PropTypes = React.PropTypes,
    cloneProps = require("itsa-react-clone-props"),
    AnchorButton = require("itsa-react-anchorbutton"),
    utils = require("itsa-utils"),
    mimeDb = require("mime-db"),
    isNode = utils.isNode,
    async = utils.async,
    later = utils.later,
    MAIN_CLASS = "itsa-filedownloadbutton",
    FORM_ELEMENT_CLASS_SPACES = " itsa-formelement";

if (!isNode) {
    isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
    if (!isSafari) {
        // safari does not support this nice download-feature
        try {
            SAVEAS_SUPPORT = !!new Blob;
        } catch (e) {}
    }
}

SAVEAS_SUPPORT && (saveAs=require("node-safe-filesaver").saveAs);

const Component = React.createClass({

    propTypes: {
        /**
         * Whether to abort running requests at the time the component gets unmounted
         *
         * @property abortOnUnmount
         * @default false
         * @type Boolean
         * @since 0.0.1
        */
        abortOnUnmount: PropTypes.bool,

        /**
         * Whether to autofocus the Component.
         *
         * @property autoFocus
         * @default false
         * @type Boolean
         * @since 0.0.1
        */
        autoFocus: PropTypes.bool,

        /**
         * Whether the Component has a Button-look. If `false` then it will look as a native anchor-element.
         *
         * @property buttonLook
         * @default true
         * @type Boolean
         * @since 15.0.0
        */
        buttonLook: PropTypes.bool,

        /**
         * Additional classname for the Component.
         *
         * @property className
         * @type String
         * @since 15.0.0
        */
        className: PropTypes.string,

        /**
         * Whether the button is disabled
         *
         * @property disabled
         * @type Boolean
         * @since 0.0.1
        */
        disabled: PropTypes.bool,

        /**
         * The url for the anchor-element.
         *
         * @default "#"
         * @property href
         * @type String
         * @since 0.0.1
        */
        href: PropTypes.string,

        /**
         * Additional classname for the Component.
         *
         * @property labelHTML
         * @type String
         * @default "download file"
         * @since 15.0.0
        */
        labelHTML: PropTypes.string,

        /**
         * The name-attribute of the button
         *
         * @property name
         * @type String
         * @since 0.0.1
        */
        name: PropTypes.string,

        /**
         * Callback whenever the button gets clicked by the left mousebutton.
         *
         * @property onClick
         * @type Function
         * @since 0.0.1
        */
        onClick: PropTypes.func,

        /**
         * Whether the checkbox is readonly
         *
         * @property readOnly
         * @type Boolean
         * @default false
         * @since 15.2.0
        */
        readOnly: PropTypes.bool,

        /**
         * Inline style
         *
         * @property style
         * @type object
         * @since 0.0.1
        */
        style: PropTypes.object,

        /**
         * The tabIndex
         * Default: 1
         *
         * @property tabIndex
         * @type Number
         * @since 0.0.1
        */
        tabIndex: PropTypes.number,

        /**
         * The anchor-target where the response should go into.
         *
         * @property target
         * @type String
         * @since 0.0.1
        */
        target: PropTypes.string
    },

    /**
     * Blurs the Component.
     *
     * @method blur
     * @chainable
     * @since 0.0.1
     */
    blur() {
        var instance = this;
        if (instance.props.buttonLook) {
            instance.refs["anchor-button"].blur();
        }
        else {
            instance._anchorNode.blur();
        }
        return instance;
    },

    /**
     * componentDidMount does some initialization.
     *
     * @method componentDidMount
     * @since 0.0.1
     */
    componentDidMount() {
        const instance = this;
        instance._anchorNode = ReactDom.findDOMNode(instance);
        if (instance.props.autoFocus && !instance.props.buttonLook) {
            instance._focusLater = later(() => instance.focus(), 50);
        }
    },

    /**
     * componentWillMount does some initial setup.
     *
     * @method componentWillUnmount
     * @since 0.0.1
     */
    componentWillMount() {
        if (SAVEAS_SUPPORT) {
            this._fileRequests = [];
            this._io = require("itsa-fetch").io;
        }
    },

    /**
     * componentWilUnmount does some cleanup.
     *
     * @method componentWillUnmount
     * @since 0.0.1
     */
    componentWillUnmount() {
        const instance = this;
        if (SAVEAS_SUPPORT && instance.props.abortOnUnmount) {
            instance._fileRequests.forEach(fileRequest => async(() => fileRequest.abort()));
        }
        instance._focusLater && instance._focusLater.cancel();
    },

    /**
     * Sets the focus on the Component.
     *
     * @method focus
     * @param [transitionTime] {Number} transition-time to focus the element into the view
     * @chainable
     * @since 0.0.1
     */
    focus(transitionTime) {
        var instance = this;
        if (instance.props.buttonLook) {
            instance.refs["anchor-button"].focus(transitionTime);
        }
        else {
            instance._anchorNode.itsa_focus && instance._anchorNode.itsa_focus(null, null, transitionTime);
        }
        return instance;
    },

    /**
     * Returns the default props.
     *
     * @method getDefaultProps
     * @return object
     * @since 0.0.1
     */
    getDefaultProps() {
        return {
            abortOnUnmount: false,
            autoFocus: false,
            buttonLook: true,
            labelHTML: "download file"
        };
    },

    /**
     * Callback-fn for the onClick-event.
     * Will invoke `this.props.onChange`
     *
     * @method handleClick
     * @param e {Object}
     * @since 0.0.1
     */
    handleClick(e) {
        let preventedExternally = false,
            fileRequest;
        const instance = this,
            props = instance.props,
            url = props.href,
            onClick = props.onClick,
            getFilenameFromContentDisposition = xhrResponse => {
                let responseHeaders = xhrResponse.getAllResponseHeaders().split("\r\n"),
                   filename, items, contentDisposition;
                responseHeaders.some(responseHeader => {
                    const responseHeaderSplitted = responseHeader.split(":");
                    if ((responseHeaderSplitted.length===2) && (responseHeaderSplitted[0].toLowerCase==="content-disposition")) {
                        contentDisposition = responseHeaderSplitted[1];
                    }
                    return contentDisposition;
                });
                if (!contentDisposition) {
                    return;
                }
                items = contentDisposition.split(";");
                items.some(item => {
                    const splitted = item.split("=");
                    if ((splitted.length===2) && (splitted[0].toLowerCase()==="filename")) {
                        filename = splitted[1];
                    }
                    return filename;
                });
                return filename;
            },
            getFilenameFromUrl = url => {
                let filename = url.split("?")[0];
                const slashIndex = filename.lastIndexOf("/");
                (slashIndex>-1) && (filename=filename.substr(slashIndex+1));
                return filename;
            },
            getContentTypeFromFilename = filename => {
                let extention, dotIndex;
                const mimeSearch = fileExt => {
                    let type;
                    mimeDb.itsa_some((value, key) => {
                        if (value.extensions && value.extensions.itsa_contains(fileExt)) {
                            type = key;
                        }
                        return type;
                    });
                    return type || "like/"+fileExt;
                };
                dotIndex = filename.lastIndexOf("\.");
                (dotIndex>0) && (extention=filename.substr(dotIndex+1));
                return mimeSearch(extention);
            },
            filename = getFilenameFromUrl(url),
            options = {
                url,
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                },
                responseType: "blob"
            };
        e.preventDefault();
        if (onClick) {
            onClick({
                preventDefault: function() {
                    preventedExternally = true;
                }
            });
        }
        if (!preventedExternally) {
            fileRequest = instance._io.request(options);
            instance._fileRequests.push(fileRequest);
            fileRequest
            .then(xhrResponse => {
                const storeFileName = getFilenameFromContentDisposition(xhrResponse) || filename,
                    contentType = getContentTypeFromFilename(storeFileName),
                    blob = new Blob([xhrResponse.response], {type: contentType});
                saveAs(blob, storeFileName);
            })
            .catch(err => console.error(err))
            .itsa_finally(() => instance._fileRequests.itsa_remove(fileRequest));
        }
    },

    /**
     * Callback-fn for the onClick-event in case the Component is disabled or readOnly.
     *
     * @method handleNoClick
     * @param e {Object}
     * @since 0.0.1
     */
    handleNoClick(e) {
        e.preventDefault();
    },

    /**
     * React render-method --> renderes the Component.
     *
     * @method render
     * @return ReactComponent
     * @since 15.0.0
     */
    render() {
        let className = MAIN_CLASS,
            handleClick, passProps;
        const instance = this,
            props = instance.props,
            propsClass = props.className,
            innerHTML = {__html: props.labelHTML},
            buttonLook = props.buttonLook;
        buttonLook && (className+=" "+MAIN_CLASS+"-buttonstyle");
        propsClass && (className+=" "+propsClass);
        if (props.disabled || props.readOnly) {
            handleClick = instance.handleNoClick;
        }
        else {
            SAVEAS_SUPPORT && (handleClick=instance.handleClick);
        }
        passProps = cloneProps.clone(props);
        delete passProps.labelHTML;
        delete passProps.buttonLook;
        delete passProps.abortOnUnmount;
        return buttonLook ?
            (
                <AnchorButton
                    {...passProps}
                    className={className}
                    dangerouslySetInnerHTML={innerHTML}
                    href={props.href}
                    onClick={handleClick}
                    ref="anchor-button"
                    target="_blank" />
            ) :
            (
                <a
                    {...passProps}
                    className={className+FORM_ELEMENT_CLASS_SPACES}
                    dangerouslySetInnerHTML={innerHTML}
                    href={props.href}
                    onClick={handleClick}
                    target="_blank" />
            );
    }

});

module.exports = Component;
