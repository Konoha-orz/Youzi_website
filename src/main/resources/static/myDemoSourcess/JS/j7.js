/* Detect-zoom
 * -----------
 * Cross Browser Zoom and Pixel Ratio Detector
 * Version 1.0.4 | Apr 1 2013
 * dual-licensed under the WTFPL and MIT license
 * Maintained by https://github/tombigel
 * Original developer https://github.com/yonran
 */

//AMD and CommonJS initialization copied from https://github.com/zohararad/audio5js
(function (root, ns, factory) {
    "use strict";

    if (typeof (module) !== 'undefined' && module.exports) { // CommonJS
        module.exports = factory(ns, root);
    } else if (typeof (define) === 'function' && define.amd) { // AMD
        define("factory", function () {
            return factory(ns, root);
        });
    } else {
        root[ns] = factory(ns, root);
    }

}(window, 'detectZoom', function () {

    /**
     * Use devicePixelRatio if supported by the browser
     * @return {Number}
     * @private
     */
    var devicePixelRatio = function () {
        return window.devicePixelRatio || 1;
    };

    /**
     * Fallback function to set default values
     * @return {Object}
     * @private
     */
    var fallback = function () {
        return {
            zoom: 1,
            devicePxPerCssPx: 1
        };
    };
    /**
     * IE 8 and 9: no trick needed!
     * TODO: Test on IE10 and Windows 8 RT
     * @return {Object}
     * @private
     **/
    var ie8 = function () {
        var zoom = Math.round((screen.deviceXDPI / screen.logicalXDPI) * 100) / 100;
        return {
            zoom: zoom,
            devicePxPerCssPx: zoom * devicePixelRatio()
        };
    };

    /**
     * For IE10 we need to change our technique again...
     * thanks https://github.com/stefanvanburen
     * @return {Object}
     * @private
     */
    var ie10 = function () {
        var zoom = Math.round((document.documentElement.offsetHeight / window.innerHeight) * 100) / 100;
        return {
            zoom: zoom,
            devicePxPerCssPx: zoom * devicePixelRatio()
        };
    };

    /**
     * Mobile WebKit
     * the trick: window.innerWIdth is in CSS pixels, while
     * screen.width and screen.height are in system pixels.
     * And there are no scrollbars to mess up the measurement.
     * @return {Object}
     * @private
     */
    var webkitMobile = function () {
        var deviceWidth = (Math.abs(window.orientation) == 90) ? screen.height : screen.width;
        var zoom = deviceWidth / window.innerWidth;
        return {
            zoom: zoom,
            devicePxPerCssPx: zoom * devicePixelRatio()
        };
    };

    /**
     * Desktop Webkit
     * the trick: an element's clientHeight is in CSS pixels, while you can
     * set its line-height in system pixels using font-size and
     * -webkit-text-size-adjust:none.
     * device-pixel-ratio: http://www.webkit.org/blog/55/high-dpi-web-sites/
     *
     * Previous trick (used before http://trac.webkit.org/changeset/100847):
     * documentElement.scrollWidth is in CSS pixels, while
     * document.width was in system pixels. Note that this is the
     * layout width of the document, which is slightly different from viewport
     * because document width does not include scrollbars and might be wider
     * due to big elements.
     * @return {Object}
     * @private
     */
    var webkit = function () {
        var important = function (str) {
            return str.replace(/;/g, " !important;");
        };

        var div = document.createElement('div');
        div.innerHTML = "1<br>2<br>3<br>4<br>5<br>6<br>7<br>8<br>9<br>0";
        div.setAttribute('style', important('font: 100px/1em sans-serif; -webkit-text-size-adjust: none; text-size-adjust: none; height: auto; width: 1em; padding: 0; overflow: visible;'));

        // The container exists so that the div will be laid out in its own flow
        // while not impacting the layout, viewport size, or display of the
        // webpage as a whole.
        // Add !important and relevant CSS rule resets
        // so that other rules cannot affect the results.
        var container = document.createElement('div');
        container.setAttribute('style', important('width:0; height:0; overflow:hidden; visibility:hidden; position: absolute;'));
        container.appendChild(div);

        document.body.appendChild(container);
        var zoom = 1000 / div.clientHeight;
        zoom = Math.round(zoom * 100) / 100;
        document.body.removeChild(container);

        return{
            zoom: zoom,
            devicePxPerCssPx: zoom * devicePixelRatio()
        };
    };

    /**
     * no real trick; device-pixel-ratio is the ratio of device dpi / css dpi.
     * (Note that this is a different interpretation than Webkit's device
     * pixel ratio, which is the ratio device dpi / system dpi).
     *
     * Also, for Mozilla, there is no difference between the zoom factor and the device ratio.
     *
     * @return {Object}
     * @private
     */
    var firefox4 = function () {
        var zoom = mediaQueryBinarySearch('min--moz-device-pixel-ratio', '', 0, 10, 20, 0.0001);
        zoom = Math.round(zoom * 100) / 100;
        return {
            zoom: zoom,
            devicePxPerCssPx: zoom
        };
    };

    /**
     * Firefox 18.x
     * Mozilla added support for devicePixelRatio to Firefox 18,
     * but it is affected by the zoom level, so, like in older
     * Firefox we can't tell if we are in zoom mode or in a device
     * with a different pixel ratio
     * @return {Object}
     * @private
     */
    var firefox18 = function () {
        return {
            zoom: firefox4().zoom,
            devicePxPerCssPx: devicePixelRatio()
        };
    };

    /**
     * works starting Opera 11.11
     * the trick: outerWidth is the viewport width including scrollbars in
     * system px, while innerWidth is the viewport width including scrollbars
     * in CSS px
     * @return {Object}
     * @private
     */
    var opera11 = function () {
        var zoom = window.top.outerWidth / window.top.innerWidth;
        zoom = Math.round(zoom * 100) / 100;
        return {
            zoom: zoom,
            devicePxPerCssPx: zoom * devicePixelRatio()
        };
    };

    /**
     * Use a binary search through media queries to find zoom level in Firefox
     * @param property
     * @param unit
     * @param a
     * @param b
     * @param maxIter
     * @param epsilon
     * @return {Number}
     */
    var mediaQueryBinarySearch = function (property, unit, a, b, maxIter, epsilon) {
        var matchMedia;
        var head, style, div;
        if (window.matchMedia) {
            matchMedia = window.matchMedia;
        } else {
            head = document.getElementsByTagName('head')[0];
            style = document.createElement('style');
            head.appendChild(style);

            div = document.createElement('div');
            div.className = 'mediaQueryBinarySearch';
            div.style.display = 'none';
            document.body.appendChild(div);

            matchMedia = function (query) {
                style.sheet.insertRule('@media ' + query + '{.mediaQueryBinarySearch ' + '{text-decoration: underline} }', 0);
                var matched = getComputedStyle(div, null).textDecoration == 'underline';
                style.sheet.deleteRule(0);
                return {matches: matched};
            };
        }
        var ratio = binarySearch(a, b, maxIter);
        if (div) {
            head.removeChild(style);
            document.body.removeChild(div);
        }
        return ratio;

        function binarySearch(a, b, maxIter) {
            var mid = (a + b) / 2;
            if (maxIter <= 0 || b - a < epsilon) {
                return mid;
            }
            var query = "(" + property + ":" + mid + unit + ")";
            if (matchMedia(query).matches) {
                return binarySearch(mid, b, maxIter - 1);
            } else {
                return binarySearch(a, mid, maxIter - 1);
            }
        }
    };

    /**
     * Generate detection function
     * @private
     */
    var detectFunction = (function () {
        var func = fallback;
        //IE8+
        if (!isNaN(screen.logicalXDPI) && !isNaN(screen.systemXDPI)) {
            func = ie8;
        }
        // IE10+ / Touch
        else if (window.navigator.msMaxTouchPoints) {
            func = ie10;
        }
        //Mobile Webkit
        else if ('orientation' in window && typeof document.body.style.webkitMarquee === 'string') {
            func = webkitMobile;
        }
        //WebKit
        else if (typeof document.body.style.webkitMarquee === 'string') {
            func = webkit;
        }
        //Opera
        else if (navigator.userAgent.indexOf('Opera') >= 0) {
            func = opera11;
        }
        //Last one is Firefox
        //FF 18.x
        else if (window.devicePixelRatio) {
            func = firefox18;
        }
        //FF 4.0 - 17.x
        else if (firefox4().zoom > 0.001) {
            func = firefox4;
        }

        return func;
    }());


    return ({

        /**
         * Ratios.zoom shorthand
         * @return {Number} Zoom level
         */
        zoom: function () {
            return detectFunction().zoom;
        },

        /**
         * Ratios.devicePxPerCssPx shorthand
         * @return {Number} devicePxPerCssPx level
         */
        device: function () {
            return detectFunction().devicePxPerCssPx;
        }
    });
}));

var wpcom_img_zoomer = {
    clientHintSupport: {
        gravatar: false,
        files: false,
        photon: false,
        mshots: false,
        staticAssets: false,
        latex: false,
        imgpress: false,
    },
    useHints: false,
    zoomed: false,
    timer: null,
    interval: 1000, // zoom polling interval in millisecond

    // Should we apply width/height attributes to control the image size?
    imgNeedsSizeAtts: function( img ) {
        // Do not overwrite existing width/height attributes.
        if ( img.getAttribute('width') !== null || img.getAttribute('height') !== null )
            return false;
        // Do not apply the attributes if the image is already constrained by a parent element.
        if ( img.width < img.naturalWidth || img.height < img.naturalHeight )
            return false;
        return true;
    },

    hintsFor: function( service ) {
        if ( this.useHints === false ) {
            return false;
        }
        if ( this.hints() === false ) {
            return false;
        }
        if ( typeof this.clientHintSupport[service] === "undefined" ) {
            return false;
        }
        if ( this.clientHintSupport[service] === true ) {
            return true;
        }
        return false;
    },

    hints: function() {
        try {
            var chrome = window.navigator.userAgent.match(/\sChrome\/([0-9]+)\.[.0-9]+\s/)
            if (chrome !== null) {
                var version = parseInt(chrome[1], 10)
                if (isNaN(version) === false && version >= 46) {
                    return true
                }
            }
        } catch (e) {
            return false
        }
        return false
    },

    init: function() {
        var t = this;
        try{
            t.zoomImages();
            t.timer = setInterval( function() { t.zoomImages(); }, t.interval );
        }
        catch(e){
        }
    },

    stop: function() {
        if ( this.timer )
            clearInterval( this.timer );
    },

    getScale: function() {
        var scale = detectZoom.device();
        // Round up to 1.5 or the next integer below the cap.
        if      ( scale <= 1.0 ) scale = 1.0;
        else if ( scale <= 1.5 ) scale = 1.5;
        else if ( scale <= 2.0 ) scale = 2.0;
        else if ( scale <= 3.0 ) scale = 3.0;
        else if ( scale <= 4.0 ) scale = 4.0;
        else                     scale = 5.0;
        return scale;
    },

    shouldZoom: function( scale ) {
        var t = this;
        // Do not operate on hidden frames.
        if ( "innerWidth" in window && !window.innerWidth )
            return false;
        // Don't do anything until scale > 1
        if ( scale == 1.0 && t.zoomed == false )
            return false;
        return true;
    },

    zoomImages: function() {
        var t = this;
        var scale = t.getScale();
        if ( ! t.shouldZoom( scale ) ){
            return;
        }
        t.zoomed = true;
        // Loop through all the <img> elements on the page.
        var imgs = document.getElementsByTagName("img");

        for ( var i = 0; i < imgs.length; i++ ) {
            // Wait for original images to load
            if ( "complete" in imgs[i] && ! imgs[i].complete )
                continue;

            // Skip images that have srcset attributes.
            if ( imgs[i].hasAttribute('srcset') ) {
                continue;
            }

            // Skip images that don't need processing.
            var imgScale = imgs[i].getAttribute("scale");
            if ( imgScale == scale || imgScale == "0" )
                continue;

            // Skip images that have already failed at this scale
            var scaleFail = imgs[i].getAttribute("scale-fail");
            if ( scaleFail && scaleFail <= scale )
                continue;

            // Skip images that have no dimensions yet.
            if ( ! ( imgs[i].width && imgs[i].height ) )
                continue;

            // Skip images from Lazy Load plugins
            if ( ! imgScale && imgs[i].getAttribute("data-lazy-src") && (imgs[i].getAttribute("data-lazy-src") !== imgs[i].getAttribute("src")))
                continue;

            if ( t.scaleImage( imgs[i], scale ) ) {
                // Mark the img as having been processed at this scale.
                imgs[i].setAttribute("scale", scale);
            }
            else {
                // Set the flag to skip this image.
                imgs[i].setAttribute("scale", "0");
            }
        }
    },

    scaleImage: function( img, scale ) {
        var t = this;
        var newSrc = img.src;

        var isFiles = false;
        var isLatex = false;
        var isPhoton = false;

        // Skip slideshow images
        if ( img.parentNode.className.match(/slideshow-slide/) )
            return false;

        // Scale gravatars that have ?s= or ?size=
        if ( img.src.match( /^https?:\/\/([^\/]*\.)?gravatar\.com\/.+[?&](s|size)=/ ) ) {
            if ( this.hintsFor( "gravatar" ) === true ) {
                return false;
            }
            newSrc = img.src.replace( /([?&](s|size)=)(\d+)/, function( $0, $1, $2, $3 ) {
                // Stash the original size
                var originalAtt = "originals",
                    originalSize = img.getAttribute(originalAtt);
                if ( originalSize === null ) {
                    originalSize = $3;
                    img.setAttribute(originalAtt, originalSize);
                    if ( t.imgNeedsSizeAtts( img ) ) {
                        // Fix width and height attributes to rendered dimensions.
                        img.width = img.width;
                        img.height = img.height;
                    }
                }
                // Get the width/height of the image in CSS pixels
                var size = img.clientWidth;
                // Convert CSS pixels to device pixels
                var targetSize = Math.ceil(img.clientWidth * scale);
                // Don't go smaller than the original size
                targetSize = Math.max( targetSize, originalSize );
                // Don't go larger than the service supports
                targetSize = Math.min( targetSize, 512 );
                return $1 + targetSize;
            });
        }

        // Scale mshots that have width
        else if ( img.src.match(/^https?:\/\/([^\/]+\.)*(wordpress|wp)\.com\/mshots\/.+[?&]w=\d+/) ) {
            if ( this.hintsFor( "mshots" ) === true ) {
                return false;
            }
            newSrc = img.src.replace( /([?&]w=)(\d+)/, function($0, $1, $2) {
                // Stash the original size
                var originalAtt = 'originalw', originalSize = img.getAttribute(originalAtt);
                if ( originalSize === null ) {
                    originalSize = $2;
                    img.setAttribute(originalAtt, originalSize);
                    if ( t.imgNeedsSizeAtts( img ) ) {
                        // Fix width and height attributes to rendered dimensions.
                        img.width = img.width;
                        img.height = img.height;
                    }
                }
                // Get the width of the image in CSS pixels
                var size = img.clientWidth;
                // Convert CSS pixels to device pixels
                var targetSize = Math.ceil(size * scale);
                // Don't go smaller than the original size
                targetSize = Math.max( targetSize, originalSize );
                // Don't go bigger unless the current one is actually lacking
                if ( scale > img.getAttribute("scale") && targetSize <= img.naturalWidth )
                    targetSize = $2;
                if ( $2 != targetSize )
                    return $1 + targetSize;
                return $0;
            });

            // Update height attribute to match width
            newSrc = newSrc.replace( /([?&]h=)(\d+)/, function($0, $1, $2) {
                if ( newSrc == img.src ) {
                    return $0;
                }
                // Stash the original size
                var originalAtt = 'originalh', originalSize = img.getAttribute(originalAtt);
                if ( originalSize === null ) {
                    originalSize = $2;
                    img.setAttribute(originalAtt, originalSize);
                }
                // Get the height of the image in CSS pixels
                var size = img.clientHeight;
                // Convert CSS pixels to device pixels
                var targetSize = Math.ceil(size * scale);
                // Don't go smaller than the original size
                targetSize = Math.max( targetSize, originalSize );
                // Don't go bigger unless the current one is actually lacking
                if ( scale > img.getAttribute("scale") && targetSize <= img.naturalHeight )
                    targetSize = $2;
                if ( $2 != targetSize )
                    return $1 + targetSize;
                return $0;
            });
        }

        // Scale simple imgpress queries (s0.wp.com) that only specify w/h/fit
        else if ( img.src.match(/^https?:\/\/([^\/.]+\.)*(wp|wordpress)\.com\/imgpress\?(.+)/) ) {
            if ( this.hintsFor( "imgpress" ) === true ) {
                return false;
            }
            var imgpressSafeFunctions = ["zoom", "url", "h", "w", "fit", "filter", "brightness", "contrast", "colorize", "smooth", "unsharpmask"];
            // Search the query string for unsupported functions.
            var qs = RegExp.$3.split('&');
            for ( var q in qs ) {
                q = qs[q].split('=')[0];
                if ( imgpressSafeFunctions.indexOf(q) == -1 ) {
                    return false;
                }
            }
            // Fix width and height attributes to rendered dimensions.
            img.width = img.width;
            img.height = img.height;
            // Compute new src
            if ( scale == 1 )
                newSrc = img.src.replace(/\?(zoom=[^&]+&)?/, '?');
            else
                newSrc = img.src.replace(/\?(zoom=[^&]+&)?/, '?zoom=' + scale + '&');
        }

        // Scale files.wordpress.com, LaTeX, or Photon images (i#.wp.com)
        else if (
            ( isFiles = img.src.match(/^https?:\/\/([^\/]+)\.files\.wordpress\.com\/.+[?&][wh]=/) ) ||
            ( isLatex = img.src.match(/^https?:\/\/([^\/.]+\.)*(wp|wordpress)\.com\/latex\.php\?(latex|zoom)=(.+)/) ) ||
            ( isPhoton = img.src.match(/^https?:\/\/i[\d]{1}\.wp\.com\/(.+)/) )
        ) {
            if ( false !== isFiles && this.hintsFor( "files" ) === true ) {
                return false
            }
            if ( false !== isLatex && this.hintsFor( "latex" ) === true ) {
                return false
            }
            if ( false !== isPhoton && this.hintsFor( "photon" ) === true ) {
                return false
            }
            // Fix width and height attributes to rendered dimensions.
            img.width = img.width;
            img.height = img.height;
            // Compute new src
            if ( scale == 1 ) {
                newSrc = img.src.replace(/\?(zoom=[^&]+&)?/, '?');
            } else {
                newSrc = img.src;

                var url_var = newSrc.match( /([?&]w=)(\d+)/ );
                if ( url_var !== null && url_var[2] ) {
                    newSrc = newSrc.replace( url_var[0], url_var[1] + img.width );
                }

                url_var = newSrc.match( /([?&]h=)(\d+)/ );
                if ( url_var !== null && url_var[2] ) {
                    newSrc = newSrc.replace( url_var[0], url_var[1] + img.height );
                }

                var zoom_arg = '&zoom=2';
                if ( !newSrc.match( /\?/ ) ) {
                    zoom_arg = '?zoom=2';
                }
                img.setAttribute( 'srcset', newSrc + zoom_arg + ' ' + scale + 'x' );
            }
        }

        // Scale static assets that have a name matching *-1x.png or *@1x.png
        else if ( img.src.match(/^https?:\/\/[^\/]+\/.*[-@]([12])x\.(gif|jpeg|jpg|png)(\?|$)/) ) {
            if ( this.hintsFor( "staticAssets" ) === true ) {
                return false;
            }
            // Fix width and height attributes to rendered dimensions.
            img.width = img.width;
            img.height = img.height;
            var currentSize = RegExp.$1, newSize = currentSize;
            if ( scale <= 1 )
                newSize = 1;
            else
                newSize = 2;
            if ( currentSize != newSize )
                newSrc = img.src.replace(/([-@])[12]x\.(gif|jpeg|jpg|png)(\?|$)/, '$1'+newSize+'x.$2$3');
        }

        else {
            return false;
        }

        // Don't set img.src unless it has changed. This avoids unnecessary reloads.
        if ( newSrc != img.src ) {
            // Store the original img.src
            var prevSrc, origSrc = img.getAttribute("src-orig");
            if ( !origSrc ) {
                origSrc = img.src;
                img.setAttribute("src-orig", origSrc);
            }
            // In case of error, revert img.src
            prevSrc = img.src;
            img.onerror = function(){
                img.src = prevSrc;
                if ( img.getAttribute("scale-fail") < scale )
                    img.setAttribute("scale-fail", scale);
                img.onerror = null;
            };
            // Finally load the new image
            img.src = newSrc;
        }

        return true;
    }
};

wpcom_img_zoomer.init();
;
/* global pm, wpcom_reblog */

var jetpackLikesWidgetQueue = [];
var jetpackLikesWidgetBatch = [];
var jetpackLikesMasterReady = false;

function JetpackLikespostMessage( message, target ) {
    if ( 'string' === typeof message ){
        try {
            message = JSON.parse( message );
        } catch(e) {
            return;
        }
    }

    pm( {
        target: target,
        type: 'likesMessage',
        data: message,
        origin: '*'
    } );
}

function JetpackLikesBatchHandler() {
    var requests = [];
    jQuery( 'div.jetpack-likes-widget-unloaded' ).each( function() {
        if ( jetpackLikesWidgetBatch.indexOf( this.id ) > -1 ) {
            return;
        }
        jetpackLikesWidgetBatch.push( this.id );
        var regex = /like-(post|comment)-wrapper-(\d+)-(\d+)-(\w+)/,
            match = regex.exec( this.id ),
            info;

        if ( ! match || match.length !== 5 ) {
            return;
        }

        info = {
            blog_id: match[2],
            width:   this.width
        };

        if ( 'post' === match[1] ) {
            info.post_id = match[3];
        } else if ( 'comment' === match[1] ) {
            info.comment_id = match[3];
        }

        info.obj_id = match[4];

        requests.push( info );
    });

    if ( requests.length > 0 ) {
        JetpackLikespostMessage( { event: 'initialBatch', requests: requests }, window.frames['likes-master'] );
    }
}

function JetpackLikesMessageListener( event, message ) {
    var allowedOrigin, $container, $list, offset, rowLength, height, scrollbarWidth;

    if ( 'undefined' === typeof event.event ) {
        return;
    }

    // We only allow messages from one origin
    allowedOrigin = window.location.protocol + '//widgets.wp.com';
    if ( allowedOrigin !== message.origin ) {
        return;
    }

    if ( 'masterReady' === event.event ) {
        jQuery( document ).ready( function() {
            jetpackLikesMasterReady = true;

            var stylesData = {
                    event: 'injectStyles'
                },
                $sdTextColor = jQuery( '.sd-text-color' ),
                $sdLinkColor = jQuery( '.sd-link-color' );

            if ( jQuery( 'iframe.admin-bar-likes-widget' ).length > 0 ) {
                JetpackLikespostMessage( { event: 'adminBarEnabled' }, window.frames[ 'likes-master' ] );

                stylesData.adminBarStyles = {
                    background: jQuery( '#wpadminbar .quicklinks li#wp-admin-bar-wpl-like > a' ).css( 'background' ),
                    isRtl: ( 'rtl' === jQuery( '#wpadminbar' ).css( 'direction' ) )
                };
            }

            // enable reblogs if we're on a single post page
            if ( jQuery( 'body' ).hasClass( 'single' ) ) {
                JetpackLikespostMessage( { event: 'reblogsEnabled' }, window.frames[ 'likes-master' ] );
            }

            if ( ! window.addEventListener ) {
                jQuery( '#wp-admin-bar-admin-bar-likes-widget' ).hide();
            }

            stylesData.textStyles = {
                color:          $sdTextColor.css( 'color' ),
                fontFamily:     $sdTextColor.css( 'font-family' ),
                fontSize:       $sdTextColor.css( 'font-size' ),
                direction:      $sdTextColor.css( 'direction' ),
                fontWeight:     $sdTextColor.css( 'font-weight' ),
                fontStyle:      $sdTextColor.css( 'font-style' ),
                textDecoration: $sdTextColor.css('text-decoration')
            };

            stylesData.linkStyles = {
                color:          $sdLinkColor.css('color'),
                fontFamily:     $sdLinkColor.css('font-family'),
                fontSize:       $sdLinkColor.css('font-size'),
                textDecoration: $sdLinkColor.css('text-decoration'),
                fontWeight:     $sdLinkColor.css( 'font-weight' ),
                fontStyle:      $sdLinkColor.css( 'font-style' )
            };

            JetpackLikespostMessage( stylesData, window.frames[ 'likes-master' ] );

            JetpackLikesBatchHandler();

            jQuery( document ).on( 'inview', 'div.jetpack-likes-widget-unloaded', function() {
                jetpackLikesWidgetQueue.push( this.id );
            });
        });
    }

    if ( 'showLikeWidget' === event.event ) {
        jQuery( '#' + event.id + ' .post-likes-widget-placeholder'  ).fadeOut( 'fast', function() {
            jQuery( '#' + event.id + ' .post-likes-widget' ).fadeIn( 'fast', function() {
                JetpackLikespostMessage( { event: 'likeWidgetDisplayed', blog_id: event.blog_id, post_id: event.post_id, obj_id: event.obj_id }, window.frames['likes-master'] );
            });
        });
    }

    if ( 'clickReblogFlair' === event.event ) {
        wpcom_reblog.toggle_reblog_box_flair( event.obj_id );
    }

    if ( 'showOtherGravatars' === event.event ) {
        $container = jQuery( '#likes-other-gravatars' );
        $list = $container.find( 'ul' );

        $container.hide();
        $list.html( '' );

        $container.find( '.likes-text span' ).text( event.total );

        jQuery.each( event.likers, function( i, liker ) {
            var element = jQuery( '<li><a><img /></a></li>' );
            element.addClass( liker.css_class );

            element.find( 'a' ).
            attr({
                href: liker.profile_URL,
                rel: 'nofollow',
                target: '_parent'
            }).
            addClass( 'wpl-liker' );

            element.find( 'img' ).
            attr({
                src: liker.avatar_URL,
                alt: liker.name
            }).
            css({
                width: '30px',
                height: '30px',
                paddingRight: '3px'
            });

            $list.append( element );
        } );

        offset = jQuery( '[name=\'' + event.parent + '\']' ).offset();

        $container.css( 'left', offset.left + event.position.left - 10 + 'px' );
        $container.css( 'top', offset.top + event.position.top - 33 + 'px' );

        rowLength = Math.floor( event.width / 37 );
        height = ( Math.ceil( event.likers.length / rowLength ) * 37 ) + 13;
        if ( height > 204 ) {
            height = 204;
        }

        $container.css( 'height', height + 'px' );
        $container.css( 'width', rowLength * 37 - 7 + 'px' );

        $list.css( 'width', rowLength * 37 + 'px' );

        $container.fadeIn( 'slow' );

        scrollbarWidth = $list[0].offsetWidth - $list[0].clientWidth;
        if ( scrollbarWidth > 0 ) {
            $container.width( $container.width() + scrollbarWidth );
            $list.width( $list.width() + scrollbarWidth );
        }
    }
}

pm.bind( 'likesMessage', JetpackLikesMessageListener );

jQuery( document ).click( function( e ) {
    var $container = jQuery( '#likes-other-gravatars' );

    if ( $container.has( e.target ).length === 0 ) {
        $container.fadeOut( 'slow' );
    }
});

function JetpackLikesWidgetQueueHandler() {
    var $wrapper, wrapperID, found;
    if ( ! jetpackLikesMasterReady ) {
        setTimeout( JetpackLikesWidgetQueueHandler, 500 );
        return;
    }

    if ( jetpackLikesWidgetQueue.length > 0 ) {
        // We may have a widget that needs creating now
        found = false;
        while( jetpackLikesWidgetQueue.length > 0 ) {
            // Grab the first member of the queue that isn't already loading.
            wrapperID = jetpackLikesWidgetQueue.splice( 0, 1 )[0];
            if ( jQuery( '#' + wrapperID ).hasClass( 'jetpack-likes-widget-unloaded' ) ) {
                found = true;
                break;
            }
        }
        if ( ! found ) {
            setTimeout( JetpackLikesWidgetQueueHandler, 500 );
            return;
        }
    } else if ( jQuery( 'div.jetpack-likes-widget-unloaded' ).length > 0 ) {
        // Grab any unloaded widgets for a batch request
        JetpackLikesBatchHandler();

        // Get the next unloaded widget
        wrapperID = jQuery( 'div.jetpack-likes-widget-unloaded' ).first()[0].id;
        if ( ! wrapperID ) {
            // Everything is currently loaded
            setTimeout( JetpackLikesWidgetQueueHandler, 500 );
            return;
        }
    }

    if ( 'undefined' === typeof wrapperID ) {
        setTimeout( JetpackLikesWidgetQueueHandler, 500 );
        return;
    }

    $wrapper = jQuery( '#' + wrapperID );
    $wrapper.find( 'iframe' ).remove();

    if ( $wrapper.hasClass( 'slim-likes-widget' ) ) {
        $wrapper.find( '.post-likes-widget-placeholder' ).after( '<iframe class="post-likes-widget jetpack-likes-widget" name="' + $wrapper.data( 'name' ) + '" height="22px" width="68px" frameBorder="0" scrolling="no" src="' + $wrapper.data( 'src' ) + '"></iframe>' );
    } else {
        $wrapper.find( '.post-likes-widget-placeholder' ).after( '<iframe class="post-likes-widget jetpack-likes-widget" name="' + $wrapper.data( 'name' ) + '" height="55px" width="100%" frameBorder="0" src="' + $wrapper.data( 'src' ) + '"></iframe>' );
    }

    $wrapper.removeClass( 'jetpack-likes-widget-unloaded' ).addClass( 'jetpack-likes-widget-loading' );

    $wrapper.find( 'iframe' ).load( function( e ) {
        var $iframe = jQuery( e.target );
        $wrapper.removeClass( 'jetpack-likes-widget-loading' ).addClass( 'jetpack-likes-widget-loaded' );

        JetpackLikespostMessage( { event: 'loadLikeWidget', name: $iframe.attr( 'name' ), width: $iframe.width() }, window.frames[ 'likes-master' ] );

        if ( $wrapper.hasClass( 'slim-likes-widget' ) ) {
            $wrapper.find( 'iframe' ).Jetpack( 'resizeable' );
        }
    });
    setTimeout( JetpackLikesWidgetQueueHandler, 250 );
}
JetpackLikesWidgetQueueHandler();
;
// WARNING: This file is distributed verbatim in Jetpack. There should be nothing WordPress.com specific in this file. @hide-in-jetpack
(function($){ // Open closure
// Local vars
    var Scroller, ajaxurl, stats, type, text, totop;

// IE requires special handling
    var isIE = ( -1 != navigator.userAgent.search( 'MSIE' ) );
    if ( isIE ) {
        var IEVersion = navigator.userAgent.match(/MSIE\s?(\d+)\.?\d*;/);
        var IEVersion = parseInt( IEVersion[1] );
    }

// HTTP ajaxurl when site is HTTPS causes Access-Control-Allow-Origin failure in Desktop and iOS Safari
    if ( "https:" == document.location.protocol ) {
        infiniteScroll.settings.ajaxurl = infiniteScroll.settings.ajaxurl.replace( "http://", "https://" );
    }

    /**
     * Loads new posts when users scroll near the bottom of the page.
     */
    Scroller = function( settings ) {
        var self = this;

        // Initialize our variables
        this.id               = settings.id;
        this.body             = $( document.body );
        this.window           = $( window );
        this.element          = $( '#' + settings.id );
        this.wrapperClass     = settings.wrapper_class;
        this.ready            = true;
        this.disabled         = false;
        this.page             = 1;
        this.offset           = settings.offset;
        this.currentday       = settings.currentday;
        this.order            = settings.order;
        this.throttle         = false;
        this.handle           = '<div id="infinite-handle"><span><button>' + text.replace( '\\', '' ) + '</button></span></div>';
        this.click_handle     = settings.click_handle;
        this.google_analytics = settings.google_analytics;
        this.history          = settings.history;
        this.origURL          = window.location.href;
        this.pageCache        = {};

        // Footer settings
        this.footer           = $( '#infinite-footer' );
        this.footer.wrap      = settings.footer;

        // Core's native MediaElement.js implementation needs special handling
        this.wpMediaelement   = null;

        // We have two type of infinite scroll
        // cases 'scroll' and 'click'

        if ( type == 'scroll' ) {
            // Bind refresh to the scroll event
            // Throttle to check for such case every 300ms

            // On event the case becomes a fact
            this.window.bind( 'scroll.infinity', function() {
                this.throttle = true;
            });

            // Go back top method
            self.gotop();

            setInterval( function() {
                if ( this.throttle ) {
                    // Once the case is the case, the action occurs and the fact is no more
                    this.throttle = false;
                    // Reveal or hide footer
                    self.thefooter();
                    // Fire the refresh
                    self.refresh();
                    self.determineURL(); // determine the url
                }
            }, 250 );

            // Ensure that enough posts are loaded to fill the initial viewport, to compensate for short posts and large displays.
            self.ensureFilledViewport();
            this.body.bind( 'post-load', { self: self }, self.checkViewportOnLoad );
        } else if ( type == 'click' ) {
            if ( this.click_handle ) {
                this.element.append( this.handle );
            }

            this.body.delegate( '#infinite-handle', 'click.infinity', function() {
                // Handle the handle
                if ( self.click_handle ) {
                    $( '#infinite-handle' ).remove();
                }

                // Fire the refresh
                self.refresh();
            });
        }

        // Initialize any Core audio or video players loaded via IS
        this.body.bind( 'post-load', { self: self }, self.initializeMejs );
    };

    /**
     * Check whether we should fetch any additional posts.
     */
    Scroller.prototype.check = function() {
        var container = this.element.offset();

        // If the container can't be found, stop otherwise errors result
        if ( 'object' !== typeof container ) {
            return false;
        }

        var bottom = this.window.scrollTop() + this.window.height(),
            threshold = container.top + this.element.outerHeight(false) - (this.window.height() * 2);

        return bottom > threshold;
    };

    /**
     * Renders the results from a successful response.
     */
    Scroller.prototype.render = function( response ) {
        this.body.addClass( 'infinity-success' );

        // Check if we can wrap the html
        this.element.append( response.html );
        this.body.trigger( 'post-load', response );
        this.ready = true;
    };

    /**
     * Returns the object used to query for new posts.
     */
    Scroller.prototype.query = function() {
        return {
            page          : this.page + this.offset, // Load the next page.
            currentday    : this.currentday,
            order         : this.order,
            scripts       : window.infiniteScroll.settings.scripts,
            styles        : window.infiniteScroll.settings.styles,
            query_args    : window.infiniteScroll.settings.query_args,
            query_before  : window.infiniteScroll.settings.query_before,
            last_post_date: window.infiniteScroll.settings.last_post_date
        };
    };

    /**
     * Scroll back to top.
     */
    Scroller.prototype.gotop = function() {
        var blog = $( '#infinity-blog-title' );

        blog.attr( 'title', totop );

        // Scroll to top on blog title
        blog.bind( 'click', function( e ) {
            $( 'html, body' ).animate( { scrollTop: 0 }, 'fast' );
            e.preventDefault();
        });
    };


    /**
     * The infinite footer.
     */
    Scroller.prototype.thefooter = function() {
        var self  = this,
            width;

        // Check if we have an id for the page wrapper
        if ( $.type( this.footer.wrap ) === "string" ) {
            width = $( 'body #' + this.footer.wrap ).outerWidth( false );

            // Make the footer match the width of the page
            if ( width > 479 )
                this.footer.find( '.container' ).css( 'width', width );
        }

        // Reveal footer
        if ( this.window.scrollTop() >= 350 )
            self.footer.animate( { 'bottom': 0 }, 'fast' );
        else if ( this.window.scrollTop() < 350 )
            self.footer.animate( { 'bottom': '-50px' }, 'fast' );
    };


    /**
     * Controls the flow of the refresh. Don't mess.
     */
    Scroller.prototype.refresh = function() {
        var	self   = this,
            query, jqxhr, load, loader, color, customized;

        // If we're disabled, ready, or don't pass the check, bail.
        if ( this.disabled || ! this.ready || ! this.check() )
            return;

        // Let's get going -- set ready to false to prevent
        // multiple refreshes from occurring at once.
        this.ready = false;

        // Create a loader element to show it's working.
        if ( this.click_handle ) {
            loader = '<span class="infinite-loader"></span>';
            this.element.append( loader );

            loader = this.element.find( '.infinite-loader' );
            color = loader.css( 'color' );

            try {
                loader.spin( 'medium-left', color );
            } catch ( error ) { }
        }

        // Generate our query vars.
        query = $.extend({
            action: 'infinite_scroll'
        }, this.query() );

        // Inject Customizer state.
        if ( 'undefined' !== typeof wp && wp.customize && wp.customize.settings.theme ) {
            customized = {};
            query.wp_customize = 'on';
            query.theme = wp.customize.settings.theme.stylesheet;
            wp.customize.each( function( setting ) {
                if ( setting._dirty ) {
                    customized[ setting.id ] = setting();
                }
            } );
            query.customized = JSON.stringify( customized );
            query.nonce = wp.customize.settings.nonce.preview;
        }

        // Fire the ajax request.
        jqxhr = $.post( infiniteScroll.settings.ajaxurl, query );

        // Allow refreshes to occur again if an error is triggered.
        jqxhr.fail( function() {
            if ( self.click_handle ) {
                loader.hide();
            }

            self.ready = true;
        });

        // Success handler
        jqxhr.done( function( response ) {
            // On success, let's hide the loader circle.
            if ( self.click_handle ) {
                loader.hide();
            }

            // Check for and parse our response.
            if ( ! response || ! response.type ) {
                return;
            }

            // If we've succeeded...
            if ( response.type == 'success' ) {
                // If additional scripts are required by the incoming set of posts, parse them
                if ( response.scripts ) {
                    $( response.scripts ).each( function() {
                        var elementToAppendTo = this.footer ? 'body' : 'head';

                        // Add script handle to list of those already parsed
                        window.infiniteScroll.settings.scripts.push( this.handle );

                        // Output extra data, if present
                        if ( this.extra_data ) {
                            var data = document.createElement('script'),
                                dataContent = document.createTextNode( "//<![CDATA[ \n" + this.extra_data + "\n//]]>" );

                            data.type = 'text/javascript';
                            data.appendChild( dataContent );

                            document.getElementsByTagName( elementToAppendTo )[0].appendChild(data);
                        }

                        // Build script tag and append to DOM in requested location
                        var script = document.createElement('script');
                        script.type = 'text/javascript';
                        script.src = this.src;
                        script.id = this.handle;

                        // If MediaElement.js is loaded in by this set of posts, don't initialize the players a second time as it breaks them all
                        if ( 'wp-mediaelement' === this.handle ) {
                            self.body.unbind( 'post-load', self.initializeMejs );
                        }

                        if ( 'wp-mediaelement' === this.handle && 'undefined' === typeof mejs ) {
                            self.wpMediaelement = {};
                            self.wpMediaelement.tag = script;
                            self.wpMediaelement.element = elementToAppendTo;
                            setTimeout( self.maybeLoadMejs.bind( self ), 250 );
                        } else {
                            document.getElementsByTagName( elementToAppendTo )[0].appendChild(script);
                        }
                    } );
                }

                // If additional stylesheets are required by the incoming set of posts, parse them
                if ( response.styles ) {
                    $( response.styles ).each( function() {
                        // Add stylesheet handle to list of those already parsed
                        window.infiniteScroll.settings.styles.push( this.handle );

                        // Build link tag
                        var style = document.createElement('link');
                        style.rel = 'stylesheet';
                        style.href = this.src;
                        style.id = this.handle + '-css';

                        // Destroy link tag if a conditional statement is present and either the browser isn't IE, or the conditional doesn't evaluate true
                        if ( this.conditional && ( ! isIE || ! eval( this.conditional.replace( /%ver/g, IEVersion ) ) ) )
                            var style = false;

                        // Append link tag if necessary
                        if ( style )
                            document.getElementsByTagName('head')[0].appendChild(style);
                    } );
                }

                // stash the response in the page cache
                self.pageCache[self.page+self.offset] = response;

                // Increment the page number
                self.page++;

                // Record pageview in WP Stats, if available.
                if ( stats )
                    new Image().src = document.location.protocol + '//pixel.wp.com/g.gif?' + stats + '&post=0&baba=' + Math.random();

                // Add new posts to the postflair object
                if ( 'object' == typeof response.postflair && 'object' == typeof WPCOM_sharing_counts )
                    WPCOM_sharing_counts = $.extend( WPCOM_sharing_counts, response.postflair );

                // Render the results
                self.render.apply( self, arguments );

                // If 'click' type and there are still posts to fetch, add back the handle
                if ( type == 'click' ) {
                    if ( response.lastbatch ) {
                        if ( self.click_handle ) {
                            $( '#infinite-handle' ).remove();
                            // Update body classes
                            self.body.addClass( 'infinity-end' ).removeClass( 'infinity-success' );
                        } else {
                            self.body.trigger( 'infinite-scroll-posts-end' );
                        }
                    } else {
                        if ( self.click_handle ) {
                            self.element.append( self.handle );
                        } else {
                            self.body.trigger( 'infinite-scroll-posts-more' );
                        }
                    }
                } else if ( response.lastbatch ) {
                    self.disabled = true;
                    self.body.addClass( 'infinity-end' ).removeClass( 'infinity-success' );
                }

                // Update currentday to the latest value returned from the server
                if ( response.currentday ) {
                    self.currentday = response.currentday;
                }

                // Fire Google Analytics pageview
                if ( self.google_analytics ) {
                    var ga_url = self.history.path.replace( /%d/, self.page );
                    if ( 'object' === typeof _gaq ) {
                        _gaq.push( [ '_trackPageview', ga_url ] );
                    }
                    if ( 'function' === typeof ga ) {
                        ga( 'send', 'pageview', ga_url );
                    }
                }
            }
        });

        return jqxhr;
    };

    /**
     * Core's native media player uses MediaElement.js
     * The library's size is sufficient that it may not be loaded in time for Core's helper to invoke it, so we need to delay until `mejs` exists.
     */
    Scroller.prototype.maybeLoadMejs = function() {
        if ( null === this.wpMediaelement ) {
            return;
        }

        if ( 'undefined' === typeof mejs ) {
            setTimeout( this.maybeLoadMejs, 250 );
        } else {
            document.getElementsByTagName( this.wpMediaelement.element )[0].appendChild( this.wpMediaelement.tag );
            this.wpMediaelement = null;

            // Ensure any subsequent IS loads initialize the players
            this.body.bind( 'post-load', { self: this }, this.initializeMejs );
        }
    }

    /**
     * Initialize the MediaElement.js player for any posts not previously initialized
     */
    Scroller.prototype.initializeMejs = function( ev, response ) {
        // Are there media players in the incoming set of posts?
        if ( ! response.html || -1 === response.html.indexOf( 'wp-audio-shortcode' ) && -1 === response.html.indexOf( 'wp-video-shortcode' ) ) {
            return;
        }

        // Don't bother if mejs isn't loaded for some reason
        if ( 'undefined' === typeof mejs ) {
            return;
        }

        // Adapted from wp-includes/js/mediaelement/wp-mediaelement.js
        // Modified to not initialize already-initialized players, as Mejs doesn't handle that well
        $(function () {
            var settings = {};

            if ( typeof _wpmejsSettings !== 'undefined' ) {
                settings.pluginPath = _wpmejsSettings.pluginPath;
            }

            settings.success = function (mejs) {
                var autoplay = mejs.attributes.autoplay && 'false' !== mejs.attributes.autoplay;
                if ( 'flash' === mejs.pluginType && autoplay ) {
                    mejs.addEventListener( 'canplay', function () {
                        mejs.play();
                    }, false );
                }
            };

            $('.wp-audio-shortcode, .wp-video-shortcode').not( '.mejs-container' ).mediaelementplayer( settings );
        });
    }

    /**
     * Trigger IS to load additional posts if the initial posts don't fill the window.
     * On large displays, or when posts are very short, the viewport may not be filled with posts, so we overcome this by loading additional posts when IS initializes.
     */
    Scroller.prototype.ensureFilledViewport = function() {
        var	self = this,
            windowHeight = self.window.height(),
            postsHeight = self.element.height(),
            aveSetHeight = 0,
            wrapperQty = 0;

        // Account for situations where postsHeight is 0 because child list elements are floated
        if ( postsHeight === 0 ) {
            $( self.element.selector + ' > li' ).each( function() {
                postsHeight += $( this ).height();
            } );

            if ( postsHeight === 0 ) {
                self.body.unbind( 'post-load', self.checkViewportOnLoad );
                return;
            }
        }

        // Calculate average height of a set of posts to prevent more posts than needed from being loaded.
        $( '.' + self.wrapperClass ).each( function() {
            aveSetHeight += $( this ).height();
            wrapperQty++;
        } );

        if ( wrapperQty > 0 )
            aveSetHeight = aveSetHeight / wrapperQty;
        else
            aveSetHeight = 0;

        // Load more posts if space permits, otherwise stop checking for a full viewport
        if ( postsHeight < windowHeight && ( postsHeight + aveSetHeight < windowHeight ) ) {
            self.ready = true;
            self.refresh();
        }
        else {
            self.body.unbind( 'post-load', self.checkViewportOnLoad );
        }
    }

    /**
     * Event handler for ensureFilledViewport(), tied to the post-load trigger.
     * Necessary to ensure that the variable `this` contains the scroller when used in ensureFilledViewport(). Since this function is tied to an event, `this` becomes the DOM element the event is tied to.
     */
    Scroller.prototype.checkViewportOnLoad = function( ev ) {
        ev.data.self.ensureFilledViewport();
    }

    /**
     * Identify archive page that corresponds to majority of posts shown in the current browser window.
     */
    Scroller.prototype.determineURL = function () {
        var self         = this,
            windowTop    = $( window ).scrollTop(),
            windowBottom = windowTop + $( window ).height(),
            windowSize   = windowBottom - windowTop,
            setsInView   = [],
            setsHidden   = [],
            pageNum      = false;

        // Find out which sets are in view
        $( '.' + self.wrapperClass ).each( function() {
            var id         = $( this ).attr( 'id' ),
                setTop     = $( this ).offset().top,
                setHeight  = $( this ).outerHeight( false ),
                setBottom  = 0,
                setPageNum = $( this ).data( 'page-num' );

            // Account for containers that have no height because their children are floated elements.
            if ( 0 === setHeight ) {
                $( '> *', this ).each( function() {
                    setHeight += $( this ).outerHeight( false );
                } );
            }

            // Determine position of bottom of set by adding its height to the scroll position of its top.
            setBottom = setTop + setHeight;

            // Populate setsInView object. While this logic could all be combined into a single conditional statement, this is easier to understand.
            if ( setTop < windowTop && setBottom > windowBottom ) { // top of set is above window, bottom is below
                setsInView.push({'id': id, 'top': setTop, 'bottom': setBottom, 'pageNum': setPageNum });
            }
            else if( setTop > windowTop && setTop < windowBottom ) { // top of set is between top (gt) and bottom (lt)
                setsInView.push({'id': id, 'top': setTop, 'bottom': setBottom, 'pageNum': setPageNum });
            }
            else if( setBottom > windowTop && setBottom < windowBottom ) { // bottom of set is between top (gt) and bottom (lt)
                setsInView.push({'id': id, 'top': setTop, 'bottom': setBottom, 'pageNum': setPageNum });
            } else {
                setsHidden.push({'id': id, 'top': setTop, 'bottom': setBottom, 'pageNum': setPageNum });
            }
        } );

        $.each(setsHidden, function() {
            var $set = $('#' + this.id);
            if( $set.hasClass( 'is--replaced' ) ) {
                return;
            }

            self.pageCache[ this.pageNum].html = $set.html();

            $set.css('min-height', ( this.bottom - this.top ) + 'px' )
                .addClass('is--replaced')
                .empty();
        });

        $.each(setsInView, function() {
            var $set = $('#' + this.id);

            if( $set.hasClass('is--replaced') ) {
                $set.css('min-height', '').removeClass('is--replaced');
                if( this.pageNum in self.pageCache ) {
                    $set.html( self.pageCache[this.pageNum].html );
                    self.body.trigger( 'post-load', self.pageCache[this.pageNum] );
                }
            }

        });

        // Parse number of sets found in view in an attempt to update the URL to match the set that comprises the majority of the window.
        if ( 0 == setsInView.length ) {
            pageNum = -1;
        }
        else if ( 1 == setsInView.length ) {
            var setData = setsInView.pop();

            // If the first set of IS posts is in the same view as the posts loaded in the template by WordPress, determine how much of the view is comprised of IS-loaded posts
            if ( ( ( windowBottom - setData.top ) / windowSize ) < 0.5 )
                pageNum = -1;
            else
                pageNum = setData.pageNum;
        }
        else {
            var majorityPercentageInView = 0;

            // Identify the IS set that comprises the majority of the current window and set the URL to it.
            $.each( setsInView, function( i, setData ) {
                var topInView     = 0,
                    bottomInView  = 0,
                    percentOfView = 0;

                // Figure percentage of view the current set represents
                if ( setData.top > windowTop && setData.top < windowBottom )
                    topInView = ( windowBottom - setData.top ) / windowSize;

                if ( setData.bottom > windowTop && setData.bottom < windowBottom )
                    bottomInView = ( setData.bottom - windowTop ) / windowSize;

                // Figure out largest percentage of view for current set
                if ( topInView >= bottomInView )
                    percentOfView = topInView;
                else if ( bottomInView >= topInView )
                    percentOfView = bottomInView;

                // Does current set's percentage of view supplant the largest previously-found set?
                if ( percentOfView > majorityPercentageInView ) {
                    pageNum = setData.pageNum;
                    majorityPercentageInView = percentOfView;
                }
            } );
        }

        // If a page number could be determined, update the URL
        // -1 indicates that the original requested URL should be used.
        if ( 'number' == typeof pageNum ) {
            self.updateURL( pageNum );
        }
    }

    /**
     * Update address bar to reflect archive page URL for a given page number.
     * Checks if URL is different to prevent pollution of browser history.
     */
    Scroller.prototype.updateURL = function( page ) {
        // IE only supports pushState() in v10 and above, so don't bother if those conditions aren't met.
        if ( ! window.history.pushState ) {
            return;
        }
        var self = this,
            pageSlug = -1 == page ? self.origURL : window.location.protocol + '//' + self.history.host + self.history.path.replace( /%d/, page ) + self.history.parameters;

        if ( window.location.href != pageSlug ) {
            history.pushState( null, null, pageSlug );
        }
    }

    /**
     * Pause scrolling.
     */
    Scroller.prototype.pause = function() {
        this.disabled = true;
    };

    /**
     * Resume scrolling.
     */
    Scroller.prototype.resume = function() {
        this.disabled = false;
    };

    /**
     * Ready, set, go!
     */
    $( document ).ready( function() {
        // Check for our variables
        if ( 'object' != typeof infiniteScroll )
            return;

        $( document.body ).addClass( infiniteScroll.settings.body_class );

        // Set ajaxurl (for brevity)
        ajaxurl = infiniteScroll.settings.ajaxurl;

        // Set stats, used for tracking stats
        stats = infiniteScroll.settings.stats;

        // Define what type of infinity we have, grab text for click-handle
        type  = infiniteScroll.settings.type;
        text  = infiniteScroll.settings.text;
        totop = infiniteScroll.settings.totop;

        // Initialize the scroller (with the ID of the element from the theme)
        infiniteScroll.scroller = new Scroller( infiniteScroll.settings );

        /**
         * Monitor user scroll activity to update URL to correspond to archive page for current set of IS posts
         */
        if( type == 'click' ) {
            var timer = null;
            $( window ).bind( 'scroll', function() {
                // run the real scroll handler once every 250 ms.
                if ( timer ) { return; }
                timer = setTimeout( function() {
                    infiniteScroll.scroller.determineURL();
                    timer = null;
                } , 250 );
            });
        }

        // Integrate with Selective Refresh in the Customizer.
        if ( 'undefined' !== typeof wp && wp.customize && wp.customize.selectiveRefresh ) {

            /**
             * Handle rendering of selective refresh partials.
             *
             * Make sure that when a partial is rendered, the Jetpack post-load event
             * will be triggered so that any dynamic elements will be re-constructed,
             * such as ME.js elements, Photon replacements, social sharing, and more.
             * Note that this is applying here not strictly to posts being loaded.
             * If a widget contains a ME.js element and it is previewed via selective
             * refresh, the post-load would get triggered allowing any dynamic elements
             * therein to also be re-constructed.
             *
             * @param {wp.customize.selectiveRefresh.Placement} placement
             */
            wp.customize.selectiveRefresh.bind( 'partial-content-rendered', function( placement ) {
                var content;
                if ( 'string' === typeof placement.addedContent ) {
                    content = placement.addedContent;
                } else if ( placement.container ) {
                    content = $( placement.container ).html();
                }

                if ( content ) {
                    $( document.body ).trigger( 'post-load', { html: content } );
                }
            } );

            /*
		 * Add partials for posts added via infinite scroll.
		 *
		 * This is unnecessary when MutationObserver is supported by the browser
		 * since then this will be handled by Selective Refresh in core.
		 */
            if ( 'undefined' === typeof MutationObserver ) {
                $( document.body ).on( 'post-load', function( e, response ) {
                    var rootElement = null;
                    if ( response.html && -1 !== response.html.indexOf( 'data-customize-partial' ) ) {
                        if ( infiniteScroll.settings.id ) {
                            rootElement = $( '#' + infiniteScroll.settings.id );
                        }
                        wp.customize.selectiveRefresh.addPartials( rootElement );
                    }
                } );
            }
        }
    });


})(jQuery); // Close closure
;
/**
 * navigation.js
 *
 * Handles toggling the navigation menu for small screens and enables tab
 * support for dropdown menus.
 */
( function() {
    var container, button, menu, links, subMenus;

    container = document.getElementById( 'site-navigation' );
    if ( ! container ) {
        return;
    }

    button = container.getElementsByTagName( 'button' )[0];
    if ( 'undefined' === typeof button ) {
        return;
    }

    menu = container.getElementsByTagName( 'ul' )[0];

    // Hide menu toggle button if menu is empty and return early.
    if ( 'undefined' === typeof menu ) {
        button.style.display = 'none';
        return;
    }

    menu.setAttribute( 'aria-expanded', 'false' );
    if ( -1 === menu.className.indexOf( 'nav-menu' ) ) {
        menu.className += ' nav-menu';
    }

    button.onclick = function() {
        if ( -1 !== container.className.indexOf( 'open' ) ) {
            container.className = container.className.replace( ' open', '' );
            button.setAttribute( 'aria-expanded', 'false' );
            menu.setAttribute( 'aria-expanded', 'false' );
        } else {
            container.className += ' open';
            button.setAttribute( 'aria-expanded', 'true' );
            menu.setAttribute( 'aria-expanded', 'true' );
        }
    };

    // Get all the link elements within the menu.
    links    = menu.getElementsByTagName( 'a' );
    subMenus = menu.getElementsByTagName( 'ul' );

    // Set menu items with submenus to aria-haspopup="true".
    for ( var i = 0, len = subMenus.length; i < len; i++ ) {
        subMenus[i].parentNode.setAttribute( 'aria-haspopup', 'true' );
    }

    // Each time a menu link is focused or blurred, toggle focus.
    for ( i = 0, len = links.length; i < len; i++ ) {
        links[i].addEventListener( 'focus', toggleFocus, true );
        links[i].addEventListener( 'blur', toggleFocus, true );
    }

    /**
     * Sets or removes .focus class on an element.
     */
    function toggleFocus() {
        var self = this;

        // Move up through the ancestors of the current link until we hit .nav-menu.
        while ( -1 === self.className.indexOf( 'nav-menu' ) ) {

            // On li elements toggle the class .focus.
            if ( 'li' === self.tagName.toLowerCase() ) {
                if ( -1 !== self.className.indexOf( 'focus' ) ) {
                    self.className = self.className.replace( ' focus', '' );
                } else {
                    self.className += ' focus';
                }
            }

            self = self.parentElement;
        }
    }
} )();
;
( function() {
    var is_webkit = navigator.userAgent.toLowerCase().indexOf( 'webkit' ) > -1,
        is_opera  = navigator.userAgent.toLowerCase().indexOf( 'opera' )  > -1,
        is_ie     = navigator.userAgent.toLowerCase().indexOf( 'msie' )   > -1;

    if ( ( is_webkit || is_opera || is_ie ) && document.getElementById && window.addEventListener ) {
        window.addEventListener( 'hashchange', function() {
            var id = location.hash.substring( 1 ),
                element;

            if ( ! ( /^[A-z0-9_-]+$/.test( id ) ) ) {
                return;
            }

            element = document.getElementById( id );

            if ( element ) {
                if ( ! ( /^(?:a|select|input|button|textarea)$/i.test( element.tagName ) ) ) {
                    element.tabIndex = -1;
                }

                element.focus();
            }
        }, false );
    }
})();
;
/*
     _ _      _       _
 ___| (_) ___| | __  (_)___
/ __| | |/ __| |/ /  | / __|
\__ \ | | (__|   < _ | \__ \
|___/_|_|\___|_|\_(_)/ |___/
                   |__/

 Version: 1.5.7
  Author: Ken Wheeler
 Website: http://kenwheeler.github.io
    Docs: http://kenwheeler.github.io/slick
    Repo: http://github.com/kenwheeler/slick
  Issues: http://github.com/kenwheeler/slick/issues

 */
/* global window, document, define, jQuery, setInterval, clearInterval */
(function(factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else if (typeof exports !== 'undefined') {
        module.exports = factory(require('jquery'));
    } else {
        factory(jQuery);
    }

}(function($) {
    'use strict';
    var Slick = window.Slick || {};

    Slick = (function() {

        var instanceUid = 0;

        function Slick(element, settings) {

            var _ = this, dataSettings;

            _.defaults = {
                accessibility: true,
                adaptiveHeight: false,
                appendArrows: $(element),
                appendDots: $(element),
                arrows: true,
                asNavFor: null,
                prevArrow: '<button type="button" data-role="none" class="slick-prev" aria-label="Previous" tabindex="0" role="button">Previous</button>',
                nextArrow: '<button type="button" data-role="none" class="slick-next" aria-label="Next" tabindex="0" role="button">Next</button>',
                autoplay: false,
                autoplaySpeed: 3000,
                centerMode: false,
                centerPadding: '50px',
                cssEase: 'ease',
                customPaging: function(slider, i) {
                    return '<button type="button" data-role="none" role="button" aria-required="false" tabindex="0">' + (i + 1) + '</button>';
                },
                dots: false,
                dotsClass: 'slick-dots',
                draggable: true,
                easing: 'linear',
                edgeFriction: 0.35,
                fade: false,
                focusOnSelect: false,
                infinite: true,
                initialSlide: 0,
                lazyLoad: 'ondemand',
                mobileFirst: false,
                pauseOnHover: true,
                pauseOnDotsHover: false,
                respondTo: 'window',
                responsive: null,
                rows: 1,
                rtl: false,
                slide: '',
                slidesPerRow: 1,
                slidesToShow: 1,
                slidesToScroll: 1,
                speed: 500,
                swipe: true,
                swipeToSlide: false,
                touchMove: true,
                touchThreshold: 5,
                useCSS: true,
                variableWidth: false,
                vertical: false,
                verticalSwiping: false,
                waitForAnimate: true,
                zIndex: 1000
            };

            _.initials = {
                animating: false,
                dragging: false,
                autoPlayTimer: null,
                currentDirection: 0,
                currentLeft: null,
                currentSlide: 0,
                direction: 1,
                $dots: null,
                listWidth: null,
                listHeight: null,
                loadIndex: 0,
                $nextArrow: null,
                $prevArrow: null,
                slideCount: null,
                slideWidth: null,
                $slideTrack: null,
                $slides: null,
                sliding: false,
                slideOffset: 0,
                swipeLeft: null,
                $list: null,
                touchObject: {},
                transformsEnabled: false,
                unslicked: false
            };

            $.extend(_, _.initials);

            _.activeBreakpoint = null;
            _.animType = null;
            _.animProp = null;
            _.breakpoints = [];
            _.breakpointSettings = [];
            _.cssTransitions = false;
            _.hidden = 'hidden';
            _.paused = false;
            _.positionProp = null;
            _.respondTo = null;
            _.rowCount = 1;
            _.shouldClick = true;
            _.$slider = $(element);
            _.$slidesCache = null;
            _.transformType = null;
            _.transitionType = null;
            _.visibilityChange = 'visibilitychange';
            _.windowWidth = 0;
            _.windowTimer = null;

            dataSettings = $(element).data('slick') || {};

            _.options = $.extend({}, _.defaults, dataSettings, settings);

            _.currentSlide = _.options.initialSlide;

            _.originalSettings = _.options;

            if (typeof document.mozHidden !== 'undefined') {
                _.hidden = 'mozHidden';
                _.visibilityChange = 'mozvisibilitychange';
            } else if (typeof document.webkitHidden !== 'undefined') {
                _.hidden = 'webkitHidden';
                _.visibilityChange = 'webkitvisibilitychange';
            }

            _.autoPlay = $.proxy(_.autoPlay, _);
            _.autoPlayClear = $.proxy(_.autoPlayClear, _);
            _.changeSlide = $.proxy(_.changeSlide, _);
            _.clickHandler = $.proxy(_.clickHandler, _);
            _.selectHandler = $.proxy(_.selectHandler, _);
            _.setPosition = $.proxy(_.setPosition, _);
            _.swipeHandler = $.proxy(_.swipeHandler, _);
            _.dragHandler = $.proxy(_.dragHandler, _);
            _.keyHandler = $.proxy(_.keyHandler, _);
            _.autoPlayIterator = $.proxy(_.autoPlayIterator, _);

            _.instanceUid = instanceUid++;

            // A simple way to check for HTML strings
            // Strict HTML recognition (must start with <)
            // Extracted from jQuery v1.11 source
            _.htmlExpr = /^(?:\s*(<[\w\W]+>)[^>]*)$/;


            _.registerBreakpoints();
            _.init(true);
            _.checkResponsive(true);

        }

        return Slick;

    }());

    Slick.prototype.addSlide = Slick.prototype.slickAdd = function(markup, index, addBefore) {

        var _ = this;

        if (typeof(index) === 'boolean') {
            addBefore = index;
            index = null;
        } else if (index < 0 || (index >= _.slideCount)) {
            return false;
        }

        _.unload();

        if (typeof(index) === 'number') {
            if (index === 0 && _.$slides.length === 0) {
                $(markup).appendTo(_.$slideTrack);
            } else if (addBefore) {
                $(markup).insertBefore(_.$slides.eq(index));
            } else {
                $(markup).insertAfter(_.$slides.eq(index));
            }
        } else {
            if (addBefore === true) {
                $(markup).prependTo(_.$slideTrack);
            } else {
                $(markup).appendTo(_.$slideTrack);
            }
        }

        _.$slides = _.$slideTrack.children(this.options.slide);

        _.$slideTrack.children(this.options.slide).detach();

        _.$slideTrack.append(_.$slides);

        _.$slides.each(function(index, element) {
            $(element).attr('data-slick-index', index);
        });

        _.$slidesCache = _.$slides;

        _.reinit();

    };

    Slick.prototype.animateHeight = function() {
        var _ = this;
        if (_.options.slidesToShow === 1 && _.options.adaptiveHeight === true && _.options.vertical === false) {
            var targetHeight = _.$slides.eq(_.currentSlide).outerHeight(true);
            _.$list.animate({
                height: targetHeight
            }, _.options.speed);
        }
    };

    Slick.prototype.animateSlide = function(targetLeft, callback) {

        var animProps = {},
            _ = this;

        _.animateHeight();

        if (_.options.rtl === true && _.options.vertical === false) {
            targetLeft = -targetLeft;
        }
        if (_.transformsEnabled === false) {
            if (_.options.vertical === false) {
                _.$slideTrack.animate({
                    left: targetLeft
                }, _.options.speed, _.options.easing, callback);
            } else {
                _.$slideTrack.animate({
                    top: targetLeft
                }, _.options.speed, _.options.easing, callback);
            }

        } else {

            if (_.cssTransitions === false) {
                if (_.options.rtl === true) {
                    _.currentLeft = -(_.currentLeft);
                }
                $({
                    animStart: _.currentLeft
                }).animate({
                    animStart: targetLeft
                }, {
                    duration: _.options.speed,
                    easing: _.options.easing,
                    step: function(now) {
                        now = Math.ceil(now);
                        if (_.options.vertical === false) {
                            animProps[_.animType] = 'translate(' +
                                now + 'px, 0px)';
                            _.$slideTrack.css(animProps);
                        } else {
                            animProps[_.animType] = 'translate(0px,' +
                                now + 'px)';
                            _.$slideTrack.css(animProps);
                        }
                    },
                    complete: function() {
                        if (callback) {
                            callback.call();
                        }
                    }
                });

            } else {

                _.applyTransition();
                targetLeft = Math.ceil(targetLeft);

                if (_.options.vertical === false) {
                    animProps[_.animType] = 'translate3d(' + targetLeft + 'px, 0px, 0px)';
                } else {
                    animProps[_.animType] = 'translate3d(0px,' + targetLeft + 'px, 0px)';
                }
                _.$slideTrack.css(animProps);

                if (callback) {
                    setTimeout(function() {

                        _.disableTransition();

                        callback.call();
                    }, _.options.speed);
                }

            }

        }

    };

    Slick.prototype.asNavFor = function(index) {

        var _ = this,
            asNavFor = _.options.asNavFor;

        if ( asNavFor && asNavFor !== null ) {
            asNavFor = $(asNavFor).not(_.$slider);
        }

        if ( asNavFor !== null && typeof asNavFor === 'object' ) {
            asNavFor.each(function() {
                var target = $(this).slick('getSlick');
                if(!target.unslicked) {
                    target.slideHandler(index, true);
                }
            });
        }

    };

    Slick.prototype.applyTransition = function(slide) {

        var _ = this,
            transition = {};

        if (_.options.fade === false) {
            transition[_.transitionType] = _.transformType + ' ' + _.options.speed + 'ms ' + _.options.cssEase;
        } else {
            transition[_.transitionType] = 'opacity ' + _.options.speed + 'ms ' + _.options.cssEase;
        }

        if (_.options.fade === false) {
            _.$slideTrack.css(transition);
        } else {
            _.$slides.eq(slide).css(transition);
        }

    };

    Slick.prototype.autoPlay = function() {

        var _ = this;

        if (_.autoPlayTimer) {
            clearInterval(_.autoPlayTimer);
        }

        if (_.slideCount > _.options.slidesToShow && _.paused !== true) {
            _.autoPlayTimer = setInterval(_.autoPlayIterator,
                _.options.autoplaySpeed);
        }

    };

    Slick.prototype.autoPlayClear = function() {

        var _ = this;
        if (_.autoPlayTimer) {
            clearInterval(_.autoPlayTimer);
        }

    };

    Slick.prototype.autoPlayIterator = function() {

        var _ = this;

        if (_.options.infinite === false) {

            if (_.direction === 1) {

                if ((_.currentSlide + 1) === _.slideCount -
                    1) {
                    _.direction = 0;
                }

                _.slideHandler(_.currentSlide + _.options.slidesToScroll);

            } else {

                if ((_.currentSlide - 1 === 0)) {

                    _.direction = 1;

                }

                _.slideHandler(_.currentSlide - _.options.slidesToScroll);

            }

        } else {

            _.slideHandler(_.currentSlide + _.options.slidesToScroll);

        }

    };

    Slick.prototype.buildArrows = function() {

        var _ = this;

        if (_.options.arrows === true ) {

            _.$prevArrow = $(_.options.prevArrow).addClass('slick-arrow');
            _.$nextArrow = $(_.options.nextArrow).addClass('slick-arrow');

            if( _.slideCount > _.options.slidesToShow ) {

                _.$prevArrow.removeClass('slick-hidden').removeAttr('aria-hidden tabindex');
                _.$nextArrow.removeClass('slick-hidden').removeAttr('aria-hidden tabindex');

                if (_.htmlExpr.test(_.options.prevArrow)) {
                    _.$prevArrow.prependTo(_.options.appendArrows);
                }

                if (_.htmlExpr.test(_.options.nextArrow)) {
                    _.$nextArrow.appendTo(_.options.appendArrows);
                }

                if (_.options.infinite !== true) {
                    _.$prevArrow
                        .addClass('slick-disabled')
                        .attr('aria-disabled', 'true');
                }

            } else {

                _.$prevArrow.add( _.$nextArrow )

                    .addClass('slick-hidden')
                    .attr({
                        'aria-disabled': 'true',
                        'tabindex': '-1'
                    });

            }

        }

    };

    Slick.prototype.buildDots = function() {

        var _ = this,
            i, dotString;

        if (_.options.dots === true && _.slideCount > _.options.slidesToShow) {

            dotString = '<ul class="' + _.options.dotsClass + '">';

            for (i = 0; i <= _.getDotCount(); i += 1) {
                dotString += '<li>' + _.options.customPaging.call(this, _, i) + '</li>';
            }

            dotString += '</ul>';

            _.$dots = $(dotString).appendTo(
                _.options.appendDots);

            _.$dots.find('li').first().addClass('slick-active').attr('aria-hidden', 'false');

        }

    };

    Slick.prototype.buildOut = function() {

        var _ = this;

        _.$slides =
            _.$slider
                .children( _.options.slide + ':not(.slick-cloned)')
                .addClass('slick-slide');

        _.slideCount = _.$slides.length;

        _.$slides.each(function(index, element) {
            $(element)
                .attr('data-slick-index', index)
                .data('originalStyling', $(element).attr('style') || '');
        });

        _.$slidesCache = _.$slides;

        _.$slider.addClass('slick-slider');

        _.$slideTrack = (_.slideCount === 0) ?
            $('<div class="slick-track"/>').appendTo(_.$slider) :
            _.$slides.wrapAll('<div class="slick-track"/>').parent();

        _.$list = _.$slideTrack.wrap(
            '<div aria-live="polite" class="slick-list"/>').parent();
        _.$slideTrack.css('opacity', 0);

        if (_.options.centerMode === true || _.options.swipeToSlide === true) {
            _.options.slidesToScroll = 1;
        }

        $('img[data-lazy]', _.$slider).not('[src]').addClass('slick-loading');

        _.setupInfinite();

        _.buildArrows();

        _.buildDots();

        _.updateDots();


        _.setSlideClasses(typeof _.currentSlide === 'number' ? _.currentSlide : 0);

        if (_.options.draggable === true) {
            _.$list.addClass('draggable');
        }

    };

    Slick.prototype.buildRows = function() {

        var _ = this, a, b, c, newSlides, numOfSlides, originalSlides,slidesPerSection;

        newSlides = document.createDocumentFragment();
        originalSlides = _.$slider.children();

        if(_.options.rows > 1) {

            slidesPerSection = _.options.slidesPerRow * _.options.rows;
            numOfSlides = Math.ceil(
                originalSlides.length / slidesPerSection
            );

            for(a = 0; a < numOfSlides; a++){
                var slide = document.createElement('div');
                for(b = 0; b < _.options.rows; b++) {
                    var row = document.createElement('div');
                    for(c = 0; c < _.options.slidesPerRow; c++) {
                        var target = (a * slidesPerSection + ((b * _.options.slidesPerRow) + c));
                        if (originalSlides.get(target)) {
                            row.appendChild(originalSlides.get(target));
                        }
                    }
                    slide.appendChild(row);
                }
                newSlides.appendChild(slide);
            }

            _.$slider.html(newSlides);
            _.$slider.children().children().children()
                .css({
                    'width':(100 / _.options.slidesPerRow) + '%',
                    'display': 'inline-block'
                });

        }

    };

    Slick.prototype.checkResponsive = function(initial, forceUpdate) {

        var _ = this,
            breakpoint, targetBreakpoint, respondToWidth, triggerBreakpoint = false;
        var sliderWidth = _.$slider.width();
        var windowWidth = window.innerWidth || $(window).width();

        if (_.respondTo === 'window') {
            respondToWidth = windowWidth;
        } else if (_.respondTo === 'slider') {
            respondToWidth = sliderWidth;
        } else if (_.respondTo === 'min') {
            respondToWidth = Math.min(windowWidth, sliderWidth);
        }

        if ( _.options.responsive &&
            _.options.responsive.length &&
            _.options.responsive !== null) {

            targetBreakpoint = null;

            for (breakpoint in _.breakpoints) {
                if (_.breakpoints.hasOwnProperty(breakpoint)) {
                    if (_.originalSettings.mobileFirst === false) {
                        if (respondToWidth < _.breakpoints[breakpoint]) {
                            targetBreakpoint = _.breakpoints[breakpoint];
                        }
                    } else {
                        if (respondToWidth > _.breakpoints[breakpoint]) {
                            targetBreakpoint = _.breakpoints[breakpoint];
                        }
                    }
                }
            }

            if (targetBreakpoint !== null) {
                if (_.activeBreakpoint !== null) {
                    if (targetBreakpoint !== _.activeBreakpoint || forceUpdate) {
                        _.activeBreakpoint =
                            targetBreakpoint;
                        if (_.breakpointSettings[targetBreakpoint] === 'unslick') {
                            _.unslick(targetBreakpoint);
                        } else {
                            _.options = $.extend({}, _.originalSettings,
                                _.breakpointSettings[
                                    targetBreakpoint]);
                            if (initial === true) {
                                _.currentSlide = _.options.initialSlide;
                            }
                            _.refresh(initial);
                        }
                        triggerBreakpoint = targetBreakpoint;
                    }
                } else {
                    _.activeBreakpoint = targetBreakpoint;
                    if (_.breakpointSettings[targetBreakpoint] === 'unslick') {
                        _.unslick(targetBreakpoint);
                    } else {
                        _.options = $.extend({}, _.originalSettings,
                            _.breakpointSettings[
                                targetBreakpoint]);
                        if (initial === true) {
                            _.currentSlide = _.options.initialSlide;
                        }
                        _.refresh(initial);
                    }
                    triggerBreakpoint = targetBreakpoint;
                }
            } else {
                if (_.activeBreakpoint !== null) {
                    _.activeBreakpoint = null;
                    _.options = _.originalSettings;
                    if (initial === true) {
                        _.currentSlide = _.options.initialSlide;
                    }
                    _.refresh(initial);
                    triggerBreakpoint = targetBreakpoint;
                }
            }

            // only trigger breakpoints during an actual break. not on initialize.
            if( !initial && triggerBreakpoint !== false ) {
                _.$slider.trigger('breakpoint', [_, triggerBreakpoint]);
            }
        }

    };

    Slick.prototype.changeSlide = function(event, dontAnimate) {

        var _ = this,
            $target = $(event.target),
            indexOffset, slideOffset, unevenOffset;

        // If target is a link, prevent default action.
        if($target.is('a')) {
            event.preventDefault();
        }

        // If target is not the <li> element (ie: a child), find the <li>.
        if(!$target.is('li')) {
            $target = $target.closest('li');
        }

        unevenOffset = (_.slideCount % _.options.slidesToScroll !== 0);
        indexOffset = unevenOffset ? 0 : (_.slideCount - _.currentSlide) % _.options.slidesToScroll;

        switch (event.data.message) {

            case 'previous':
                slideOffset = indexOffset === 0 ? _.options.slidesToScroll : _.options.slidesToShow - indexOffset;
                if (_.slideCount > _.options.slidesToShow) {
                    _.slideHandler(_.currentSlide - slideOffset, false, dontAnimate);
                }
                break;

            case 'next':
                slideOffset = indexOffset === 0 ? _.options.slidesToScroll : indexOffset;
                if (_.slideCount > _.options.slidesToShow) {
                    _.slideHandler(_.currentSlide + slideOffset, false, dontAnimate);
                }
                break;

            case 'index':
                var index = event.data.index === 0 ? 0 :
                    event.data.index || $target.index() * _.options.slidesToScroll;

                _.slideHandler(_.checkNavigable(index), false, dontAnimate);
                $target.children().trigger('focus');
                break;

            default:
                return;
        }

    };

    Slick.prototype.checkNavigable = function(index) {

        var _ = this,
            navigables, prevNavigable;

        navigables = _.getNavigableIndexes();
        prevNavigable = 0;
        if (index > navigables[navigables.length - 1]) {
            index = navigables[navigables.length - 1];
        } else {
            for (var n in navigables) {
                if (index < navigables[n]) {
                    index = prevNavigable;
                    break;
                }
                prevNavigable = navigables[n];
            }
        }

        return index;
    };

    Slick.prototype.cleanUpEvents = function() {

        var _ = this;

        if (_.options.dots && _.$dots !== null) {

            $('li', _.$dots).off('click.slick', _.changeSlide);

            if (_.options.pauseOnDotsHover === true && _.options.autoplay === true) {

                $('li', _.$dots)
                    .off('mouseenter.slick', $.proxy(_.setPaused, _, true))
                    .off('mouseleave.slick', $.proxy(_.setPaused, _, false));

            }

        }

        if (_.options.arrows === true && _.slideCount > _.options.slidesToShow) {
            _.$prevArrow && _.$prevArrow.off('click.slick', _.changeSlide);
            _.$nextArrow && _.$nextArrow.off('click.slick', _.changeSlide);
        }

        _.$list.off('touchstart.slick mousedown.slick', _.swipeHandler);
        _.$list.off('touchmove.slick mousemove.slick', _.swipeHandler);
        _.$list.off('touchend.slick mouseup.slick', _.swipeHandler);
        _.$list.off('touchcancel.slick mouseleave.slick', _.swipeHandler);

        _.$list.off('click.slick', _.clickHandler);

        $(document).off(_.visibilityChange, _.visibility);

        _.$list.off('mouseenter.slick', $.proxy(_.setPaused, _, true));
        _.$list.off('mouseleave.slick', $.proxy(_.setPaused, _, false));

        if (_.options.accessibility === true) {
            _.$list.off('keydown.slick', _.keyHandler);
        }

        if (_.options.focusOnSelect === true) {
            $(_.$slideTrack).children().off('click.slick', _.selectHandler);
        }

        $(window).off('orientationchange.slick.slick-' + _.instanceUid, _.orientationChange);

        $(window).off('resize.slick.slick-' + _.instanceUid, _.resize);

        $('[draggable!=true]', _.$slideTrack).off('dragstart', _.preventDefault);

        $(window).off('load.slick.slick-' + _.instanceUid, _.setPosition);
        $(document).off('ready.slick.slick-' + _.instanceUid, _.setPosition);
    };

    Slick.prototype.cleanUpRows = function() {

        var _ = this, originalSlides;

        if(_.options.rows > 1) {
            originalSlides = _.$slides.children().children();
            originalSlides.removeAttr('style');
            _.$slider.html(originalSlides);
        }

    };

    Slick.prototype.clickHandler = function(event) {

        var _ = this;

        if (_.shouldClick === false) {
            event.stopImmediatePropagation();
            event.stopPropagation();
            event.preventDefault();
        }

    };

    Slick.prototype.destroy = function(refresh) {

        var _ = this;

        _.autoPlayClear();

        _.touchObject = {};

        _.cleanUpEvents();

        $('.slick-cloned', _.$slider).detach();

        if (_.$dots) {
            _.$dots.remove();
        }

        if ( _.options.arrows === true ) {

            if ( _.$prevArrow && _.$prevArrow.length ) {

                _.$prevArrow
                    .removeClass('slick-disabled slick-arrow slick-hidden')
                    .removeAttr('aria-hidden aria-disabled tabindex')
                    .css("display","");

                if ( _.htmlExpr.test( _.options.prevArrow )) {
                    _.$prevArrow.remove();
                }
            }

            if ( _.$nextArrow && _.$nextArrow.length ) {

                _.$nextArrow
                    .removeClass('slick-disabled slick-arrow slick-hidden')
                    .removeAttr('aria-hidden aria-disabled tabindex')
                    .css("display","");

                if ( _.htmlExpr.test( _.options.nextArrow )) {
                    _.$nextArrow.remove();
                }
            }

        }

        if (_.$slides) {

            _.$slides
                .removeClass('slick-slide slick-active slick-center slick-visible slick-current')
                .removeAttr('aria-hidden')
                .removeAttr('data-slick-index')
                .each(function(){
                    $(this).attr('style', $(this).data('originalStyling'));
                });

            _.$slideTrack.children(this.options.slide).detach();

            _.$slideTrack.detach();

            _.$list.detach();

            _.$slider.append(_.$slides);
        }

        _.cleanUpRows();

        _.$slider.removeClass('slick-slider');
        _.$slider.removeClass('slick-initialized');

        _.unslicked = true;

        if(!refresh) {
            _.$slider.trigger('destroy', [_]);
        }

    };

    Slick.prototype.disableTransition = function(slide) {

        var _ = this,
            transition = {};

        transition[_.transitionType] = '';

        if (_.options.fade === false) {
            _.$slideTrack.css(transition);
        } else {
            _.$slides.eq(slide).css(transition);
        }

    };

    Slick.prototype.fadeSlide = function(slideIndex, callback) {

        var _ = this;

        if (_.cssTransitions === false) {

            _.$slides.eq(slideIndex).css({
                zIndex: _.options.zIndex
            });

            _.$slides.eq(slideIndex).animate({
                opacity: 1
            }, _.options.speed, _.options.easing, callback);

        } else {

            _.applyTransition(slideIndex);

            _.$slides.eq(slideIndex).css({
                opacity: 1,
                zIndex: _.options.zIndex
            });

            if (callback) {
                setTimeout(function() {

                    _.disableTransition(slideIndex);

                    callback.call();
                }, _.options.speed);
            }

        }

    };

    Slick.prototype.fadeSlideOut = function(slideIndex) {

        var _ = this;

        if (_.cssTransitions === false) {

            _.$slides.eq(slideIndex).animate({
                opacity: 0,
                zIndex: _.options.zIndex - 2
            }, _.options.speed, _.options.easing);

        } else {

            _.applyTransition(slideIndex);

            _.$slides.eq(slideIndex).css({
                opacity: 0,
                zIndex: _.options.zIndex - 2
            });

        }

    };

    Slick.prototype.filterSlides = Slick.prototype.slickFilter = function(filter) {

        var _ = this;

        if (filter !== null) {

            _.unload();

            _.$slideTrack.children(this.options.slide).detach();

            _.$slidesCache.filter(filter).appendTo(_.$slideTrack);

            _.reinit();

        }

    };

    Slick.prototype.getCurrent = Slick.prototype.slickCurrentSlide = function() {

        var _ = this;
        return _.currentSlide;

    };

    Slick.prototype.getDotCount = function() {

        var _ = this;

        var breakPoint = 0;
        var counter = 0;
        var pagerQty = 0;

        if (_.options.infinite === true) {
            while (breakPoint < _.slideCount) {
                ++pagerQty;
                breakPoint = counter + _.options.slidesToShow;
                counter += _.options.slidesToScroll <= _.options.slidesToShow ? _.options.slidesToScroll : _.options.slidesToShow;
            }
        } else if (_.options.centerMode === true) {
            pagerQty = _.slideCount;
        } else {
            while (breakPoint < _.slideCount) {
                ++pagerQty;
                breakPoint = counter + _.options.slidesToShow;
                counter += _.options.slidesToScroll <= _.options.slidesToShow ? _.options.slidesToScroll : _.options.slidesToShow;
            }
        }

        return pagerQty - 1;

    };

    Slick.prototype.getLeft = function(slideIndex) {

        var _ = this,
            targetLeft,
            verticalHeight,
            verticalOffset = 0,
            targetSlide;

        _.slideOffset = 0;
        verticalHeight = _.$slides.first().outerHeight(true);

        if (_.options.infinite === true) {
            if (_.slideCount > _.options.slidesToShow) {
                _.slideOffset = (_.slideWidth * _.options.slidesToShow) * -1;
                verticalOffset = (verticalHeight * _.options.slidesToShow) * -1;
            }
            if (_.slideCount % _.options.slidesToScroll !== 0) {
                if (slideIndex + _.options.slidesToScroll > _.slideCount && _.slideCount > _.options.slidesToShow) {
                    if (slideIndex > _.slideCount) {
                        _.slideOffset = ((_.options.slidesToShow - (slideIndex - _.slideCount)) * _.slideWidth) * -1;
                        verticalOffset = ((_.options.slidesToShow - (slideIndex - _.slideCount)) * verticalHeight) * -1;
                    } else {
                        _.slideOffset = ((_.slideCount % _.options.slidesToScroll) * _.slideWidth) * -1;
                        verticalOffset = ((_.slideCount % _.options.slidesToScroll) * verticalHeight) * -1;
                    }
                }
            }
        } else {
            if (slideIndex + _.options.slidesToShow > _.slideCount) {
                _.slideOffset = ((slideIndex + _.options.slidesToShow) - _.slideCount) * _.slideWidth;
                verticalOffset = ((slideIndex + _.options.slidesToShow) - _.slideCount) * verticalHeight;
            }
        }

        if (_.slideCount <= _.options.slidesToShow) {
            _.slideOffset = 0;
            verticalOffset = 0;
        }

        if (_.options.centerMode === true && _.options.infinite === true) {
            _.slideOffset += _.slideWidth * Math.floor(_.options.slidesToShow / 2) - _.slideWidth;
        } else if (_.options.centerMode === true) {
            _.slideOffset = 0;
            _.slideOffset += _.slideWidth * Math.floor(_.options.slidesToShow / 2);
        }

        if (_.options.vertical === false) {
            targetLeft = ((slideIndex * _.slideWidth) * -1) + _.slideOffset;
        } else {
            targetLeft = ((slideIndex * verticalHeight) * -1) + verticalOffset;
        }

        if (_.options.variableWidth === true) {

            if (_.slideCount <= _.options.slidesToShow || _.options.infinite === false) {
                targetSlide = _.$slideTrack.children('.slick-slide').eq(slideIndex);
            } else {
                targetSlide = _.$slideTrack.children('.slick-slide').eq(slideIndex + _.options.slidesToShow);
            }

            targetLeft = targetSlide[0] ? targetSlide[0].offsetLeft * -1 : 0;

            if (_.options.centerMode === true) {
                if (_.options.infinite === false) {
                    targetSlide = _.$slideTrack.children('.slick-slide').eq(slideIndex);
                } else {
                    targetSlide = _.$slideTrack.children('.slick-slide').eq(slideIndex + _.options.slidesToShow + 1);
                }
                targetLeft = targetSlide[0] ? targetSlide[0].offsetLeft * -1 : 0;
                targetLeft += (_.$list.width() - targetSlide.outerWidth()) / 2;
            }
        }

        return targetLeft;

    };

    Slick.prototype.getOption = Slick.prototype.slickGetOption = function(option) {

        var _ = this;

        return _.options[option];

    };

    Slick.prototype.getNavigableIndexes = function() {

        var _ = this,
            breakPoint = 0,
            counter = 0,
            indexes = [],
            max;

        if (_.options.infinite === false) {
            max = _.slideCount;
        } else {
            breakPoint = _.options.slidesToScroll * -1;
            counter = _.options.slidesToScroll * -1;
            max = _.slideCount * 2;
        }

        while (breakPoint < max) {
            indexes.push(breakPoint);
            breakPoint = counter + _.options.slidesToScroll;
            counter += _.options.slidesToScroll <= _.options.slidesToShow ? _.options.slidesToScroll : _.options.slidesToShow;
        }

        return indexes;

    };

    Slick.prototype.getSlick = function() {

        return this;

    };

    Slick.prototype.getSlideCount = function() {

        var _ = this,
            slidesTraversed, swipedSlide, centerOffset;

        centerOffset = _.options.centerMode === true ? _.slideWidth * Math.floor(_.options.slidesToShow / 2) : 0;

        if (_.options.swipeToSlide === true) {
            _.$slideTrack.find('.slick-slide').each(function(index, slide) {
                if (slide.offsetLeft - centerOffset + ($(slide).outerWidth() / 2) > (_.swipeLeft * -1)) {
                    swipedSlide = slide;
                    return false;
                }
            });

            slidesTraversed = Math.abs($(swipedSlide).attr('data-slick-index') - _.currentSlide) || 1;

            return slidesTraversed;

        } else {
            return _.options.slidesToScroll;
        }

    };

    Slick.prototype.goTo = Slick.prototype.slickGoTo = function(slide, dontAnimate) {

        var _ = this;

        _.changeSlide({
            data: {
                message: 'index',
                index: parseInt(slide)
            }
        }, dontAnimate);

    };

    Slick.prototype.init = function(creation) {

        var _ = this;

        if (!$(_.$slider).hasClass('slick-initialized')) {

            $(_.$slider).addClass('slick-initialized');

            _.buildRows();
            _.buildOut();
            _.setProps();
            _.startLoad();
            _.loadSlider();
            _.initializeEvents();
            _.updateArrows();
            _.updateDots();

        }

        if (creation) {
            _.$slider.trigger('init', [_]);
        }

        if (_.options.accessibility === true) {
            _.initADA();
        }

    };

    Slick.prototype.initArrowEvents = function() {

        var _ = this;

        if (_.options.arrows === true && _.slideCount > _.options.slidesToShow) {
            _.$prevArrow.on('click.slick', {
                message: 'previous'
            }, _.changeSlide);
            _.$nextArrow.on('click.slick', {
                message: 'next'
            }, _.changeSlide);
        }

    };

    Slick.prototype.initDotEvents = function() {

        var _ = this;

        if (_.options.dots === true && _.slideCount > _.options.slidesToShow) {
            $('li', _.$dots).on('click.slick', {
                message: 'index'
            }, _.changeSlide);
        }

        if (_.options.dots === true && _.options.pauseOnDotsHover === true && _.options.autoplay === true) {
            $('li', _.$dots)
                .on('mouseenter.slick', $.proxy(_.setPaused, _, true))
                .on('mouseleave.slick', $.proxy(_.setPaused, _, false));
        }

    };

    Slick.prototype.initializeEvents = function() {

        var _ = this;

        _.initArrowEvents();

        _.initDotEvents();

        _.$list.on('touchstart.slick mousedown.slick', {
            action: 'start'
        }, _.swipeHandler);
        _.$list.on('touchmove.slick mousemove.slick', {
            action: 'move'
        }, _.swipeHandler);
        _.$list.on('touchend.slick mouseup.slick', {
            action: 'end'
        }, _.swipeHandler);
        _.$list.on('touchcancel.slick mouseleave.slick', {
            action: 'end'
        }, _.swipeHandler);

        _.$list.on('click.slick', _.clickHandler);

        $(document).on(_.visibilityChange, $.proxy(_.visibility, _));

        _.$list.on('mouseenter.slick', $.proxy(_.setPaused, _, true));
        _.$list.on('mouseleave.slick', $.proxy(_.setPaused, _, false));

        if (_.options.accessibility === true) {
            _.$list.on('keydown.slick', _.keyHandler);
        }

        if (_.options.focusOnSelect === true) {
            $(_.$slideTrack).children().on('click.slick', _.selectHandler);
        }

        $(window).on('orientationchange.slick.slick-' + _.instanceUid, $.proxy(_.orientationChange, _));

        $(window).on('resize.slick.slick-' + _.instanceUid, $.proxy(_.resize, _));

        $('[draggable!=true]', _.$slideTrack).on('dragstart', _.preventDefault);

        $(window).on('load.slick.slick-' + _.instanceUid, _.setPosition);
        $(document).on('ready.slick.slick-' + _.instanceUid, _.setPosition);

    };

    Slick.prototype.initUI = function() {

        var _ = this;

        if (_.options.arrows === true && _.slideCount > _.options.slidesToShow) {

            _.$prevArrow.show();
            _.$nextArrow.show();

        }

        if (_.options.dots === true && _.slideCount > _.options.slidesToShow) {

            _.$dots.show();

        }

        if (_.options.autoplay === true) {

            _.autoPlay();

        }

    };

    Slick.prototype.keyHandler = function(event) {

        var _ = this;
        //Dont slide if the cursor is inside the form fields and arrow keys are pressed
        if(!event.target.tagName.match('TEXTAREA|INPUT|SELECT')) {
            if (event.keyCode === 37 && _.options.accessibility === true) {
                _.changeSlide({
                    data: {
                        message: 'previous'
                    }
                });
            } else if (event.keyCode === 39 && _.options.accessibility === true) {
                _.changeSlide({
                    data: {
                        message: 'next'
                    }
                });
            }
        }

    };

    Slick.prototype.lazyLoad = function() {

        var _ = this,
            loadRange, cloneRange, rangeStart, rangeEnd;

        function loadImages(imagesScope) {
            $('img[data-lazy]', imagesScope).each(function() {

                var image = $(this),
                    imageSource = $(this).attr('data-lazy'),
                    imageToLoad = document.createElement('img');

                imageToLoad.onload = function() {
                    image
                        .animate({ opacity: 0 }, 100, function() {
                            image
                                .attr('src', imageSource)
                                .animate({ opacity: 1 }, 200, function() {
                                    image
                                        .removeAttr('data-lazy')
                                        .removeClass('slick-loading');
                                });
                        });
                };

                imageToLoad.src = imageSource;

            });
        }

        if (_.options.centerMode === true) {
            if (_.options.infinite === true) {
                rangeStart = _.currentSlide + (_.options.slidesToShow / 2 + 1);
                rangeEnd = rangeStart + _.options.slidesToShow + 2;
            } else {
                rangeStart = Math.max(0, _.currentSlide - (_.options.slidesToShow / 2 + 1));
                rangeEnd = 2 + (_.options.slidesToShow / 2 + 1) + _.currentSlide;
            }
        } else {
            rangeStart = _.options.infinite ? _.options.slidesToShow + _.currentSlide : _.currentSlide;
            rangeEnd = rangeStart + _.options.slidesToShow;
            if (_.options.fade === true) {
                if (rangeStart > 0) rangeStart--;
                if (rangeEnd <= _.slideCount) rangeEnd++;
            }
        }

        loadRange = _.$slider.find('.slick-slide').slice(rangeStart, rangeEnd);
        loadImages(loadRange);

        if (_.slideCount <= _.options.slidesToShow) {
            cloneRange = _.$slider.find('.slick-slide');
            loadImages(cloneRange);
        } else
        if (_.currentSlide >= _.slideCount - _.options.slidesToShow) {
            cloneRange = _.$slider.find('.slick-cloned').slice(0, _.options.slidesToShow);
            loadImages(cloneRange);
        } else if (_.currentSlide === 0) {
            cloneRange = _.$slider.find('.slick-cloned').slice(_.options.slidesToShow * -1);
            loadImages(cloneRange);
        }

    };

    Slick.prototype.loadSlider = function() {

        var _ = this;

        _.setPosition();

        _.$slideTrack.css({
            opacity: 1
        });

        _.$slider.removeClass('slick-loading');

        _.initUI();

        if (_.options.lazyLoad === 'progressive') {
            _.progressiveLazyLoad();
        }

    };

    Slick.prototype.next = Slick.prototype.slickNext = function() {

        var _ = this;

        _.changeSlide({
            data: {
                message: 'next'
            }
        });

    };

    Slick.prototype.orientationChange = function() {

        var _ = this;

        _.checkResponsive();
        _.setPosition();

    };

    Slick.prototype.pause = Slick.prototype.slickPause = function() {

        var _ = this;

        _.autoPlayClear();
        _.paused = true;

    };

    Slick.prototype.play = Slick.prototype.slickPlay = function() {

        var _ = this;

        _.paused = false;
        _.autoPlay();

    };

    Slick.prototype.postSlide = function(index) {

        var _ = this;

        _.$slider.trigger('afterChange', [_, index]);

        _.animating = false;

        _.setPosition();

        _.swipeLeft = null;

        if (_.options.autoplay === true && _.paused === false) {
            _.autoPlay();
        }
        if (_.options.accessibility === true) {
            _.initADA();
        }

    };

    Slick.prototype.prev = Slick.prototype.slickPrev = function() {

        var _ = this;

        _.changeSlide({
            data: {
                message: 'previous'
            }
        });

    };

    Slick.prototype.preventDefault = function(e) {
        e.preventDefault();
    };

    Slick.prototype.progressiveLazyLoad = function() {

        var _ = this,
            imgCount, targetImage;

        imgCount = $('img[data-lazy]', _.$slider).length;

        if (imgCount > 0) {
            targetImage = $('img[data-lazy]', _.$slider).first();
            targetImage.attr('src', targetImage.attr('data-lazy')).removeClass('slick-loading').load(function() {
                targetImage.removeAttr('data-lazy');
                _.progressiveLazyLoad();

                if (_.options.adaptiveHeight === true) {
                    _.setPosition();
                }
            })
                .error(function() {
                    targetImage.removeAttr('data-lazy');
                    _.progressiveLazyLoad();
                });
        }

    };

    Slick.prototype.refresh = function( initializing ) {

        var _ = this,
            currentSlide = _.currentSlide;

        _.destroy(true);

        $.extend(_, _.initials, { currentSlide: currentSlide });

        _.init();

        if( !initializing ) {

            _.changeSlide({
                data: {
                    message: 'index',
                    index: currentSlide
                }
            }, false);

        }

    };

    Slick.prototype.registerBreakpoints = function() {

        var _ = this, breakpoint, currentBreakpoint, l,
            responsiveSettings = _.options.responsive || null;

        if ( $.type(responsiveSettings) === "array" && responsiveSettings.length ) {

            _.respondTo = _.options.respondTo || 'window';

            for ( breakpoint in responsiveSettings ) {

                l = _.breakpoints.length-1;
                currentBreakpoint = responsiveSettings[breakpoint].breakpoint;

                if (responsiveSettings.hasOwnProperty(breakpoint)) {

                    // loop through the breakpoints and cut out any existing
                    // ones with the same breakpoint number, we don't want dupes.
                    while( l >= 0 ) {
                        if( _.breakpoints[l] && _.breakpoints[l] === currentBreakpoint ) {
                            _.breakpoints.splice(l,1);
                        }
                        l--;
                    }

                    _.breakpoints.push(currentBreakpoint);
                    _.breakpointSettings[currentBreakpoint] = responsiveSettings[breakpoint].settings;

                }

            }

            _.breakpoints.sort(function(a, b) {
                return ( _.options.mobileFirst ) ? a-b : b-a;
            });

        }

    };

    Slick.prototype.reinit = function() {

        var _ = this;

        _.$slides =
            _.$slideTrack
                .children(_.options.slide)
                .addClass('slick-slide');

        _.slideCount = _.$slides.length;

        if (_.currentSlide >= _.slideCount && _.currentSlide !== 0) {
            _.currentSlide = _.currentSlide - _.options.slidesToScroll;
        }

        if (_.slideCount <= _.options.slidesToShow) {
            _.currentSlide = 0;
        }

        _.registerBreakpoints();

        _.setProps();
        _.setupInfinite();
        _.buildArrows();
        _.updateArrows();
        _.initArrowEvents();
        _.buildDots();
        _.updateDots();
        _.initDotEvents();

        _.checkResponsive(false, true);

        if (_.options.focusOnSelect === true) {
            $(_.$slideTrack).children().on('click.slick', _.selectHandler);
        }

        _.setSlideClasses(0);

        _.setPosition();

        _.$slider.trigger('reInit', [_]);

        if (_.options.autoplay === true) {
            _.focusHandler();
        }

    };

    Slick.prototype.resize = function() {

        var _ = this;

        if ($(window).width() !== _.windowWidth) {
            clearTimeout(_.windowDelay);
            _.windowDelay = window.setTimeout(function() {
                _.windowWidth = $(window).width();
                _.checkResponsive();
                if( !_.unslicked ) { _.setPosition(); }
            }, 50);
        }
    };

    Slick.prototype.removeSlide = Slick.prototype.slickRemove = function(index, removeBefore, removeAll) {

        var _ = this;

        if (typeof(index) === 'boolean') {
            removeBefore = index;
            index = removeBefore === true ? 0 : _.slideCount - 1;
        } else {
            index = removeBefore === true ? --index : index;
        }

        if (_.slideCount < 1 || index < 0 || index > _.slideCount - 1) {
            return false;
        }

        _.unload();

        if (removeAll === true) {
            _.$slideTrack.children().remove();
        } else {
            _.$slideTrack.children(this.options.slide).eq(index).remove();
        }

        _.$slides = _.$slideTrack.children(this.options.slide);

        _.$slideTrack.children(this.options.slide).detach();

        _.$slideTrack.append(_.$slides);

        _.$slidesCache = _.$slides;

        _.reinit();

    };

    Slick.prototype.setCSS = function(position) {

        var _ = this,
            positionProps = {},
            x, y;

        if (_.options.rtl === true) {
            position = -position;
        }
        x = _.positionProp == 'left' ? Math.ceil(position) + 'px' : '0px';
        y = _.positionProp == 'top' ? Math.ceil(position) + 'px' : '0px';

        positionProps[_.positionProp] = position;

        if (_.transformsEnabled === false) {
            _.$slideTrack.css(positionProps);
        } else {
            positionProps = {};
            if (_.cssTransitions === false) {
                positionProps[_.animType] = 'translate(' + x + ', ' + y + ')';
                _.$slideTrack.css(positionProps);
            } else {
                positionProps[_.animType] = 'translate3d(' + x + ', ' + y + ', 0px)';
                _.$slideTrack.css(positionProps);
            }
        }

    };

    Slick.prototype.setDimensions = function() {

        var _ = this;

        if (_.options.vertical === false) {
            if (_.options.centerMode === true) {
                _.$list.css({
                    padding: ('0px ' + _.options.centerPadding)
                });
            }
        } else {
            _.$list.height(_.$slides.first().outerHeight(true) * _.options.slidesToShow);
            if (_.options.centerMode === true) {
                _.$list.css({
                    padding: (_.options.centerPadding + ' 0px')
                });
            }
        }

        _.listWidth = _.$list.width();
        _.listHeight = _.$list.height();


        if (_.options.vertical === false && _.options.variableWidth === false) {
            _.slideWidth = Math.ceil(_.listWidth / _.options.slidesToShow);
            _.$slideTrack.width(Math.ceil((_.slideWidth * _.$slideTrack.children('.slick-slide').length)));

        } else if (_.options.variableWidth === true) {
            _.$slideTrack.width(5000 * _.slideCount);
        } else {
            _.slideWidth = Math.ceil(_.listWidth);
            _.$slideTrack.height(Math.ceil((_.$slides.first().outerHeight(true) * _.$slideTrack.children('.slick-slide').length)));
        }

        var offset = _.$slides.first().outerWidth(true) - _.$slides.first().width();
        if (_.options.variableWidth === false) _.$slideTrack.children('.slick-slide').width(_.slideWidth - offset);

    };

    Slick.prototype.setFade = function() {

        var _ = this,
            targetLeft;

        _.$slides.each(function(index, element) {
            targetLeft = (_.slideWidth * index) * -1;
            if (_.options.rtl === true) {
                $(element).css({
                    position: 'relative',
                    right: targetLeft,
                    top: 0,
                    zIndex: _.options.zIndex - 2,
                    opacity: 0
                });
            } else {
                $(element).css({
                    position: 'relative',
                    left: targetLeft,
                    top: 0,
                    zIndex: _.options.zIndex - 2,
                    opacity: 0
                });
            }
        });

        _.$slides.eq(_.currentSlide).css({
            zIndex: _.options.zIndex - 1,
            opacity: 1
        });

    };

    Slick.prototype.setHeight = function() {

        var _ = this;

        if (_.options.slidesToShow === 1 && _.options.adaptiveHeight === true && _.options.vertical === false) {
            var targetHeight = _.$slides.eq(_.currentSlide).outerHeight(true);
            _.$list.css('height', targetHeight);
        }

    };

    Slick.prototype.setOption = Slick.prototype.slickSetOption = function(option, value, refresh) {

        var _ = this, l, item;

        if( option === "responsive" && $.type(value) === "array" ) {
            for ( item in value ) {
                if( $.type( _.options.responsive ) !== "array" ) {
                    _.options.responsive = [ value[item] ];
                } else {
                    l = _.options.responsive.length-1;
                    // loop through the responsive object and splice out duplicates.
                    while( l >= 0 ) {
                        if( _.options.responsive[l].breakpoint === value[item].breakpoint ) {
                            _.options.responsive.splice(l,1);
                        }
                        l--;
                    }
                    _.options.responsive.push( value[item] );
                }
            }
        } else {
            _.options[option] = value;
        }

        if (refresh === true) {
            _.unload();
            _.reinit();
        }

    };

    Slick.prototype.setPosition = function() {

        var _ = this;

        _.setDimensions();

        _.setHeight();

        if (_.options.fade === false) {
            _.setCSS(_.getLeft(_.currentSlide));
        } else {
            _.setFade();
        }

        _.$slider.trigger('setPosition', [_]);

    };

    Slick.prototype.setProps = function() {

        var _ = this,
            bodyStyle = document.body.style;

        _.positionProp = _.options.vertical === true ? 'top' : 'left';

        if (_.positionProp === 'top') {
            _.$slider.addClass('slick-vertical');
        } else {
            _.$slider.removeClass('slick-vertical');
        }

        if (bodyStyle.WebkitTransition !== undefined ||
            bodyStyle.MozTransition !== undefined ||
            bodyStyle.msTransition !== undefined) {
            if (_.options.useCSS === true) {
                _.cssTransitions = true;
            }
        }

        if ( _.options.fade ) {
            if ( typeof _.options.zIndex === 'number' ) {
                if( _.options.zIndex < 3 ) {
                    _.options.zIndex = 3;
                }
            } else {
                _.options.zIndex = _.defaults.zIndex;
            }
        }

        if (bodyStyle.OTransform !== undefined) {
            _.animType = 'OTransform';
            _.transformType = '-o-transform';
            _.transitionType = 'OTransition';
            if (bodyStyle.perspectiveProperty === undefined && bodyStyle.webkitPerspective === undefined) _.animType = false;
        }
        if (bodyStyle.MozTransform !== undefined) {
            _.animType = 'MozTransform';
            _.transformType = '-moz-transform';
            _.transitionType = 'MozTransition';
            if (bodyStyle.perspectiveProperty === undefined && bodyStyle.MozPerspective === undefined) _.animType = false;
        }
        if (bodyStyle.webkitTransform !== undefined) {
            _.animType = 'webkitTransform';
            _.transformType = '-webkit-transform';
            _.transitionType = 'webkitTransition';
            if (bodyStyle.perspectiveProperty === undefined && bodyStyle.webkitPerspective === undefined) _.animType = false;
        }
        if (bodyStyle.msTransform !== undefined) {
            _.animType = 'msTransform';
            _.transformType = '-ms-transform';
            _.transitionType = 'msTransition';
            if (bodyStyle.msTransform === undefined) _.animType = false;
        }
        if (bodyStyle.transform !== undefined && _.animType !== false) {
            _.animType = 'transform';
            _.transformType = 'transform';
            _.transitionType = 'transition';
        }
        _.transformsEnabled = (_.animType !== null && _.animType !== false);

    };


    Slick.prototype.setSlideClasses = function(index) {

        var _ = this,
            centerOffset, allSlides, indexOffset, remainder;

        allSlides = _.$slider
            .find('.slick-slide')
            .removeClass('slick-active slick-center slick-current')
            .attr('aria-hidden', 'true');

        _.$slides
            .eq(index)
            .addClass('slick-current');

        if (_.options.centerMode === true) {

            centerOffset = Math.floor(_.options.slidesToShow / 2);

            if (_.options.infinite === true) {

                if (index >= centerOffset && index <= (_.slideCount - 1) - centerOffset) {

                    _.$slides
                        .slice(index - centerOffset, index + centerOffset + 1)
                        .addClass('slick-active')
                        .attr('aria-hidden', 'false');

                } else {

                    indexOffset = _.options.slidesToShow + index;
                    allSlides
                        .slice(indexOffset - centerOffset + 1, indexOffset + centerOffset + 2)
                        .addClass('slick-active')
                        .attr('aria-hidden', 'false');

                }

                if (index === 0) {

                    allSlides
                        .eq(allSlides.length - 1 - _.options.slidesToShow)
                        .addClass('slick-center');

                } else if (index === _.slideCount - 1) {

                    allSlides
                        .eq(_.options.slidesToShow)
                        .addClass('slick-center');

                }

            }

            _.$slides
                .eq(index)
                .addClass('slick-center');

        } else {

            if (index >= 0 && index <= (_.slideCount - _.options.slidesToShow)) {

                _.$slides
                    .slice(index, index + _.options.slidesToShow)
                    .addClass('slick-active')
                    .attr('aria-hidden', 'false');

            } else if (allSlides.length <= _.options.slidesToShow) {

                allSlides
                    .addClass('slick-active')
                    .attr('aria-hidden', 'false');

            } else {

                remainder = _.slideCount % _.options.slidesToShow;
                indexOffset = _.options.infinite === true ? _.options.slidesToShow + index : index;

                if (_.options.slidesToShow == _.options.slidesToScroll && (_.slideCount - index) < _.options.slidesToShow) {

                    allSlides
                        .slice(indexOffset - (_.options.slidesToShow - remainder), indexOffset + remainder)
                        .addClass('slick-active')
                        .attr('aria-hidden', 'false');

                } else {

                    allSlides
                        .slice(indexOffset, indexOffset + _.options.slidesToShow)
                        .addClass('slick-active')
                        .attr('aria-hidden', 'false');

                }

            }

        }

        if (_.options.lazyLoad === 'ondemand') {
            _.lazyLoad();
        }

    };

    Slick.prototype.setupInfinite = function() {

        var _ = this,
            i, slideIndex, infiniteCount;

        if (_.options.fade === true) {
            _.options.centerMode = false;
        }

        if (_.options.infinite === true && _.options.fade === false) {

            slideIndex = null;

            if (_.slideCount > _.options.slidesToShow) {

                if (_.options.centerMode === true) {
                    infiniteCount = _.options.slidesToShow + 1;
                } else {
                    infiniteCount = _.options.slidesToShow;
                }

                for (i = _.slideCount; i > (_.slideCount -
                    infiniteCount); i -= 1) {
                    slideIndex = i - 1;
                    $(_.$slides[slideIndex]).clone(true).attr('id', '')
                        .attr('data-slick-index', slideIndex - _.slideCount)
                        .prependTo(_.$slideTrack).addClass('slick-cloned');
                }
                for (i = 0; i < infiniteCount; i += 1) {
                    slideIndex = i;
                    $(_.$slides[slideIndex]).clone(true).attr('id', '')
                        .attr('data-slick-index', slideIndex + _.slideCount)
                        .appendTo(_.$slideTrack).addClass('slick-cloned');
                }
                _.$slideTrack.find('.slick-cloned').find('[id]').each(function() {
                    $(this).attr('id', '');
                });

            }

        }

    };

    Slick.prototype.setPaused = function(paused) {

        var _ = this;

        if (_.options.autoplay === true && _.options.pauseOnHover === true) {
            _.paused = paused;
            if (!paused) {
                _.autoPlay();
            } else {
                _.autoPlayClear();
            }
        }
    };

    Slick.prototype.selectHandler = function(event) {

        var _ = this;

        var targetElement =
            $(event.target).is('.slick-slide') ?
                $(event.target) :
                $(event.target).parents('.slick-slide');

        var index = parseInt(targetElement.attr('data-slick-index'));

        if (!index) index = 0;

        if (_.slideCount <= _.options.slidesToShow) {

            _.setSlideClasses(index);
            _.asNavFor(index);
            return;

        }

        _.slideHandler(index);

    };

    Slick.prototype.slideHandler = function(index, sync, dontAnimate) {

        var targetSlide, animSlide, oldSlide, slideLeft, targetLeft = null,
            _ = this;

        sync = sync || false;

        if (_.animating === true && _.options.waitForAnimate === true) {
            return;
        }

        if (_.options.fade === true && _.currentSlide === index) {
            return;
        }

        if (_.slideCount <= _.options.slidesToShow) {
            return;
        }

        if (sync === false) {
            _.asNavFor(index);
        }

        targetSlide = index;
        targetLeft = _.getLeft(targetSlide);
        slideLeft = _.getLeft(_.currentSlide);

        _.currentLeft = _.swipeLeft === null ? slideLeft : _.swipeLeft;

        if (_.options.infinite === false && _.options.centerMode === false && (index < 0 || index > _.getDotCount() * _.options.slidesToScroll)) {
            if (_.options.fade === false) {
                targetSlide = _.currentSlide;
                if (dontAnimate !== true) {
                    _.animateSlide(slideLeft, function() {
                        _.postSlide(targetSlide);
                    });
                } else {
                    _.postSlide(targetSlide);
                }
            }
            return;
        } else if (_.options.infinite === false && _.options.centerMode === true && (index < 0 || index > (_.slideCount - _.options.slidesToScroll))) {
            if (_.options.fade === false) {
                targetSlide = _.currentSlide;
                if (dontAnimate !== true) {
                    _.animateSlide(slideLeft, function() {
                        _.postSlide(targetSlide);
                    });
                } else {
                    _.postSlide(targetSlide);
                }
            }
            return;
        }

        if (_.options.autoplay === true) {
            clearInterval(_.autoPlayTimer);
        }

        if (targetSlide < 0) {
            if (_.slideCount % _.options.slidesToScroll !== 0) {
                animSlide = _.slideCount - (_.slideCount % _.options.slidesToScroll);
            } else {
                animSlide = _.slideCount + targetSlide;
            }
        } else if (targetSlide >= _.slideCount) {
            if (_.slideCount % _.options.slidesToScroll !== 0) {
                animSlide = 0;
            } else {
                animSlide = targetSlide - _.slideCount;
            }
        } else {
            animSlide = targetSlide;
        }

        _.animating = true;

        _.$slider.trigger('beforeChange', [_, _.currentSlide, animSlide]);

        oldSlide = _.currentSlide;
        _.currentSlide = animSlide;

        _.setSlideClasses(_.currentSlide);

        _.updateDots();
        _.updateArrows();

        if (_.options.fade === true) {
            if (dontAnimate !== true) {

                _.fadeSlideOut(oldSlide);

                _.fadeSlide(animSlide, function() {
                    _.postSlide(animSlide);
                });

            } else {
                _.postSlide(animSlide);
            }
            _.animateHeight();
            return;
        }

        if (dontAnimate !== true) {
            _.animateSlide(targetLeft, function() {
                _.postSlide(animSlide);
            });
        } else {
            _.postSlide(animSlide);
        }

    };

    Slick.prototype.startLoad = function() {

        var _ = this;

        if (_.options.arrows === true && _.slideCount > _.options.slidesToShow) {

            _.$prevArrow.hide();
            _.$nextArrow.hide();

        }

        if (_.options.dots === true && _.slideCount > _.options.slidesToShow) {

            _.$dots.hide();

        }

        _.$slider.addClass('slick-loading');

    };

    Slick.prototype.swipeDirection = function() {

        var xDist, yDist, r, swipeAngle, _ = this;

        xDist = _.touchObject.startX - _.touchObject.curX;
        yDist = _.touchObject.startY - _.touchObject.curY;
        r = Math.atan2(yDist, xDist);

        swipeAngle = Math.round(r * 180 / Math.PI);
        if (swipeAngle < 0) {
            swipeAngle = 360 - Math.abs(swipeAngle);
        }

        if ((swipeAngle <= 45) && (swipeAngle >= 0)) {
            return (_.options.rtl === false ? 'left' : 'right');
        }
        if ((swipeAngle <= 360) && (swipeAngle >= 315)) {
            return (_.options.rtl === false ? 'left' : 'right');
        }
        if ((swipeAngle >= 135) && (swipeAngle <= 225)) {
            return (_.options.rtl === false ? 'right' : 'left');
        }
        if (_.options.verticalSwiping === true) {
            if ((swipeAngle >= 35) && (swipeAngle <= 135)) {
                return 'left';
            } else {
                return 'right';
            }
        }

        return 'vertical';

    };

    Slick.prototype.swipeEnd = function(event) {

        var _ = this,
            slideCount;

        _.dragging = false;

        _.shouldClick = (_.touchObject.swipeLength > 10) ? false : true;

        if (_.touchObject.curX === undefined) {
            return false;
        }

        if (_.touchObject.edgeHit === true) {
            _.$slider.trigger('edge', [_, _.swipeDirection()]);
        }

        if (_.touchObject.swipeLength >= _.touchObject.minSwipe) {

            switch (_.swipeDirection()) {
                case 'left':
                    slideCount = _.options.swipeToSlide ? _.checkNavigable(_.currentSlide + _.getSlideCount()) : _.currentSlide + _.getSlideCount();
                    _.slideHandler(slideCount);
                    _.currentDirection = 0;
                    _.touchObject = {};
                    _.$slider.trigger('swipe', [_, 'left']);
                    break;

                case 'right':
                    slideCount = _.options.swipeToSlide ? _.checkNavigable(_.currentSlide - _.getSlideCount()) : _.currentSlide - _.getSlideCount();
                    _.slideHandler(slideCount);
                    _.currentDirection = 1;
                    _.touchObject = {};
                    _.$slider.trigger('swipe', [_, 'right']);
                    break;
            }
        } else {
            if (_.touchObject.startX !== _.touchObject.curX) {
                _.slideHandler(_.currentSlide);
                _.touchObject = {};
            }
        }

    };

    Slick.prototype.swipeHandler = function(event) {

        var _ = this;

        if ((_.options.swipe === false) || ('ontouchend' in document && _.options.swipe === false)) {
            return;
        } else if (_.options.draggable === false && event.type.indexOf('mouse') !== -1) {
            return;
        }

        _.touchObject.fingerCount = event.originalEvent && event.originalEvent.touches !== undefined ?
            event.originalEvent.touches.length : 1;

        _.touchObject.minSwipe = _.listWidth / _.options
            .touchThreshold;

        if (_.options.verticalSwiping === true) {
            _.touchObject.minSwipe = _.listHeight / _.options
                .touchThreshold;
        }

        switch (event.data.action) {

            case 'start':
                _.swipeStart(event);
                break;

            case 'move':
                _.swipeMove(event);
                break;

            case 'end':
                _.swipeEnd(event);
                break;

        }

    };

    Slick.prototype.swipeMove = function(event) {

        var _ = this,
            edgeWasHit = false,
            curLeft, swipeDirection, swipeLength, positionOffset, touches;

        touches = event.originalEvent !== undefined ? event.originalEvent.touches : null;

        if (!_.dragging || touches && touches.length !== 1) {
            return false;
        }

        curLeft = _.getLeft(_.currentSlide);

        _.touchObject.curX = touches !== undefined ? touches[0].pageX : event.clientX;
        _.touchObject.curY = touches !== undefined ? touches[0].pageY : event.clientY;

        _.touchObject.swipeLength = Math.round(Math.sqrt(
            Math.pow(_.touchObject.curX - _.touchObject.startX, 2)));

        if (_.options.verticalSwiping === true) {
            _.touchObject.swipeLength = Math.round(Math.sqrt(
                Math.pow(_.touchObject.curY - _.touchObject.startY, 2)));
        }

        swipeDirection = _.swipeDirection();

        if (swipeDirection === 'vertical') {
            return;
        }

        if (event.originalEvent !== undefined && _.touchObject.swipeLength > 4) {
            event.preventDefault();
        }

        positionOffset = (_.options.rtl === false ? 1 : -1) * (_.touchObject.curX > _.touchObject.startX ? 1 : -1);
        if (_.options.verticalSwiping === true) {
            positionOffset = _.touchObject.curY > _.touchObject.startY ? 1 : -1;
        }


        swipeLength = _.touchObject.swipeLength;

        _.touchObject.edgeHit = false;

        if (_.options.infinite === false) {
            if ((_.currentSlide === 0 && swipeDirection === 'right') || (_.currentSlide >= _.getDotCount() && swipeDirection === 'left')) {
                swipeLength = _.touchObject.swipeLength * _.options.edgeFriction;
                _.touchObject.edgeHit = true;
            }
        }

        if (_.options.vertical === false) {
            _.swipeLeft = curLeft + swipeLength * positionOffset;
        } else {
            _.swipeLeft = curLeft + (swipeLength * (_.$list.height() / _.listWidth)) * positionOffset;
        }
        if (_.options.verticalSwiping === true) {
            _.swipeLeft = curLeft + swipeLength * positionOffset;
        }

        if (_.options.fade === true || _.options.touchMove === false) {
            return false;
        }

        if (_.animating === true) {
            _.swipeLeft = null;
            return false;
        }

        _.setCSS(_.swipeLeft);

    };

    Slick.prototype.swipeStart = function(event) {

        var _ = this,
            touches;

        if (_.touchObject.fingerCount !== 1 || _.slideCount <= _.options.slidesToShow) {
            _.touchObject = {};
            return false;
        }

        if (event.originalEvent !== undefined && event.originalEvent.touches !== undefined) {
            touches = event.originalEvent.touches[0];
        }

        _.touchObject.startX = _.touchObject.curX = touches !== undefined ? touches.pageX : event.clientX;
        _.touchObject.startY = _.touchObject.curY = touches !== undefined ? touches.pageY : event.clientY;

        _.dragging = true;

    };

    Slick.prototype.unfilterSlides = Slick.prototype.slickUnfilter = function() {

        var _ = this;

        if (_.$slidesCache !== null) {

            _.unload();

            _.$slideTrack.children(this.options.slide).detach();

            _.$slidesCache.appendTo(_.$slideTrack);

            _.reinit();

        }

    };

    Slick.prototype.unload = function() {

        var _ = this;

        $('.slick-cloned', _.$slider).remove();

        if (_.$dots) {
            _.$dots.remove();
        }

        if (_.$prevArrow && _.htmlExpr.test(_.options.prevArrow)) {
            _.$prevArrow.remove();
        }

        if (_.$nextArrow && _.htmlExpr.test(_.options.nextArrow)) {
            _.$nextArrow.remove();
        }

        _.$slides
            .removeClass('slick-slide slick-active slick-visible slick-current')
            .attr('aria-hidden', 'true')
            .css('width', '');

    };

    Slick.prototype.unslick = function(fromBreakpoint) {

        var _ = this;
        _.$slider.trigger('unslick', [_, fromBreakpoint]);
        _.destroy();

    };

    Slick.prototype.updateArrows = function() {

        var _ = this,
            centerOffset;

        centerOffset = Math.floor(_.options.slidesToShow / 2);

        if ( _.options.arrows === true &&
            _.slideCount > _.options.slidesToShow &&
            !_.options.infinite ) {

            _.$prevArrow.removeClass('slick-disabled').attr('aria-disabled', 'false');
            _.$nextArrow.removeClass('slick-disabled').attr('aria-disabled', 'false');

            if (_.currentSlide === 0) {

                _.$prevArrow.addClass('slick-disabled').attr('aria-disabled', 'true');
                _.$nextArrow.removeClass('slick-disabled').attr('aria-disabled', 'false');

            } else if (_.currentSlide >= _.slideCount - _.options.slidesToShow && _.options.centerMode === false) {

                _.$nextArrow.addClass('slick-disabled').attr('aria-disabled', 'true');
                _.$prevArrow.removeClass('slick-disabled').attr('aria-disabled', 'false');

            } else if (_.currentSlide >= _.slideCount - 1 && _.options.centerMode === true) {

                _.$nextArrow.addClass('slick-disabled').attr('aria-disabled', 'true');
                _.$prevArrow.removeClass('slick-disabled').attr('aria-disabled', 'false');

            }

        }

    };

    Slick.prototype.updateDots = function() {

        var _ = this;

        if (_.$dots !== null) {

            _.$dots
                .find('li')
                .removeClass('slick-active')
                .attr('aria-hidden', 'true');

            _.$dots
                .find('li')
                .eq(Math.floor(_.currentSlide / _.options.slidesToScroll))
                .addClass('slick-active')
                .attr('aria-hidden', 'false');

        }

    };

    Slick.prototype.visibility = function() {

        var _ = this;

        if (document[_.hidden]) {
            _.paused = true;
            _.autoPlayClear();
        } else {
            if (_.options.autoplay === true) {
                _.paused = false;
                _.autoPlay();
            }
        }

    };
    Slick.prototype.initADA = function() {
        var _ = this;
        _.$slides.add(_.$slideTrack.find('.slick-cloned')).attr({
            'aria-hidden': 'true',
            'tabindex': '-1'
        }).find('a, input, button, select').attr({
            'tabindex': '-1'
        });

        _.$slideTrack.attr('role', 'listbox');

        _.$slides.not(_.$slideTrack.find('.slick-cloned')).each(function(i) {
            $(this).attr({
                'role': 'option',
                'aria-describedby': 'slick-slide' + _.instanceUid + i + ''
            });
        });

        if (_.$dots !== null) {
            _.$dots.attr('role', 'tablist').find('li').each(function(i) {
                $(this).attr({
                    'role': 'presentation',
                    'aria-selected': 'false',
                    'aria-controls': 'navigation' + _.instanceUid + i + '',
                    'id': 'slick-slide' + _.instanceUid + i + ''
                });
            })
                .first().attr('aria-selected', 'true').end()
                .find('button').attr('role', 'button').end()
                .closest('div').attr('role', 'toolbar');
        }
        _.activateADA();

    };

    Slick.prototype.activateADA = function() {
        var _ = this,
            _isSlideOnFocus =_.$slider.find('*').is(':focus');
        // _isSlideOnFocus = _.$slides.is(':focus') || _.$slides.find('*').is(':focus');

        _.$slideTrack.find('.slick-active').attr({
            'aria-hidden': 'false',
            'tabindex': '0'
        }).find('a, input, button, select').attr({
            'tabindex': '0'
        });

        (_isSlideOnFocus) &&  _.$slideTrack.find('.slick-active').focus();

    };

    Slick.prototype.focusHandler = function() {
        var _ = this;
        _.$slider.on('focus.slick blur.slick', '*', function(event) {
            event.stopImmediatePropagation();
            var sf = $(this);
            setTimeout(function() {
                if (_.isPlay) {
                    if (sf.is(':focus')) {
                        _.autoPlayClear();
                        _.paused = true;
                    } else {
                        _.paused = false;
                        _.autoPlay();
                    }
                }
            }, 0);
        });
    };

    $.fn.slick = function() {
        var _ = this,
            opt = arguments[0],
            args = Array.prototype.slice.call(arguments, 1),
            l = _.length,
            i = 0,
            ret;
        for (i; i < l; i++) {
            if (typeof opt == 'object' || typeof opt == 'undefined')
                _[i].slick = new Slick(_[i], opt);
            else
                ret = _[i].slick[opt].apply(_[i].slick, args);
            if (typeof ret != 'undefined') return ret;
        }
        return _;
    };

}));
;
(function(){"use strict";function a(){}function b(a,b){for(var c=a.length;c--;)if(a[c].listener===b)return c;return-1}function c(a){return function(){return this[a].apply(this,arguments)}}var d=a.prototype,e=this,f=e.EventEmitter;d.getListeners=function(a){var b,c,d=this._getEvents();if("object"==typeof a){b={};for(c in d)d.hasOwnProperty(c)&&a.test(c)&&(b[c]=d[c])}else b=d[a]||(d[a]=[]);return b},d.flattenListeners=function(a){var b,c=[];for(b=0;b<a.length;b+=1)c.push(a[b].listener);return c},d.getListenersAsObject=function(a){var b,c=this.getListeners(a);return c instanceof Array&&(b={},b[a]=c),b||c},d.addListener=function(a,c){var d,e=this.getListenersAsObject(a),f="object"==typeof c;for(d in e)e.hasOwnProperty(d)&&-1===b(e[d],c)&&e[d].push(f?c:{listener:c,once:!1});return this},d.on=c("addListener"),d.addOnceListener=function(a,b){return this.addListener(a,{listener:b,once:!0})},d.once=c("addOnceListener"),d.defineEvent=function(a){return this.getListeners(a),this},d.defineEvents=function(a){for(var b=0;b<a.length;b+=1)this.defineEvent(a[b]);return this},d.removeListener=function(a,c){var d,e,f=this.getListenersAsObject(a);for(e in f)f.hasOwnProperty(e)&&(d=b(f[e],c),-1!==d&&f[e].splice(d,1));return this},d.off=c("removeListener"),d.addListeners=function(a,b){return this.manipulateListeners(!1,a,b)},d.removeListeners=function(a,b){return this.manipulateListeners(!0,a,b)},d.manipulateListeners=function(a,b,c){var d,e,f=a?this.removeListener:this.addListener,g=a?this.removeListeners:this.addListeners;if("object"!=typeof b||b instanceof RegExp)for(d=c.length;d--;)f.call(this,b,c[d]);else for(d in b)b.hasOwnProperty(d)&&(e=b[d])&&("function"==typeof e?f.call(this,d,e):g.call(this,d,e));return this},d.removeEvent=function(a){var b,c=typeof a,d=this._getEvents();if("string"===c)delete d[a];else if("object"===c)for(b in d)d.hasOwnProperty(b)&&a.test(b)&&delete d[b];else delete this._events;return this},d.removeAllListeners=c("removeEvent"),d.emitEvent=function(a,b){var c,d,e,f,g=this.getListenersAsObject(a);for(e in g)if(g.hasOwnProperty(e))for(d=g[e].length;d--;)c=g[e][d],c.once===!0&&this.removeListener(a,c.listener),f=c.listener.apply(this,b||[]),f===this._getOnceReturnValue()&&this.removeListener(a,c.listener);return this},d.trigger=c("emitEvent"),d.emit=function(a){var b=Array.prototype.slice.call(arguments,1);return this.emitEvent(a,b)},d.setOnceReturnValue=function(a){return this._onceReturnValue=a,this},d._getOnceReturnValue=function(){return!this.hasOwnProperty("_onceReturnValue")||this._onceReturnValue},d._getEvents=function(){return this._events||(this._events={})},a.noConflict=function(){return e.EventEmitter=f,a},"function"==typeof define&&define.amd?define("eventEmitter/EventEmitter",[],function(){return a}):"object"==typeof module&&module.exports?module.exports=a:this.EventEmitter=a}).call(this),function(a){function b(b){var c=a.event;return c.target=c.target||c.srcElement||b,c}var c=document.documentElement,d=function(){};c.addEventListener?d=function(a,b,c){a.addEventListener(b,c,!1)}:c.attachEvent&&(d=function(a,c,d){a[c+d]=d.handleEvent?function(){var c=b(a);d.handleEvent.call(d,c)}:function(){var c=b(a);d.call(a,c)},a.attachEvent("on"+c,a[c+d])});var e=function(){};c.removeEventListener?e=function(a,b,c){a.removeEventListener(b,c,!1)}:c.detachEvent&&(e=function(a,b,c){a.detachEvent("on"+b,a[b+c]);try{delete a[b+c]}catch(d){a[b+c]=void 0}});var f={bind:d,unbind:e};"function"==typeof define&&define.amd?define("eventie/eventie",f):a.eventie=f}(this),function(a,b){"use strict";"function"==typeof define&&define.amd?define(["eventEmitter/EventEmitter","eventie/eventie"],function(c,d){return b(a,c,d)}):"object"==typeof module&&module.exports?module.exports=b(a,require("wolfy87-eventemitter"),require("eventie")):a.imagesLoaded=b(a,a.EventEmitter,a.eventie)}(window,function(a,b,c){function d(a,b){for(var c in b)a[c]=b[c];return a}function e(a){return"[object Array]"==l.call(a)}function f(a){var b=[];if(e(a))b=a;else if("number"==typeof a.length)for(var c=0;c<a.length;c++)b.push(a[c]);else b.push(a);return b}function g(a,b,c){if(!(this instanceof g))return new g(a,b,c);"string"==typeof a&&(a=document.querySelectorAll(a)),this.elements=f(a),this.options=d({},this.options),"function"==typeof b?c=b:d(this.options,b),c&&this.on("always",c),this.getImages(),j&&(this.jqDeferred=new j.Deferred);var e=this;setTimeout(function(){e.check()})}function h(a){this.img=a}function i(a,b){this.url=a,this.element=b,this.img=new Image}var j=a.jQuery,k=a.console,l=Object.prototype.toString;g.prototype=new b,g.prototype.options={},g.prototype.getImages=function(){this.images=[];for(var a=0;a<this.elements.length;a++){var b=this.elements[a];this.addElementImages(b)}},g.prototype.addElementImages=function(a){"IMG"==a.nodeName&&this.addImage(a),this.options.background===!0&&this.addElementBackgroundImages(a);var b=a.nodeType;if(b&&m[b]){for(var c=a.querySelectorAll("img"),d=0;d<c.length;d++){var e=c[d];this.addImage(e)}if("string"==typeof this.options.background){var f=a.querySelectorAll(this.options.background);for(d=0;d<f.length;d++){var g=f[d];this.addElementBackgroundImages(g)}}}};var m={1:!0,9:!0,11:!0};g.prototype.addElementBackgroundImages=function(a){for(var b=n(a),c=/url\(['"]*([^'"\)]+)['"]*\)/gi,d=c.exec(b.backgroundImage);null!==d;){var e=d&&d[1];e&&this.addBackground(e,a),d=c.exec(b.backgroundImage)}};var n=a.getComputedStyle||function(a){return a.currentStyle};return g.prototype.addImage=function(a){var b=new h(a);this.images.push(b)},g.prototype.addBackground=function(a,b){var c=new i(a,b);this.images.push(c)},g.prototype.check=function(){function a(a,c,d){setTimeout(function(){b.progress(a,c,d)})}var b=this;if(this.progressedCount=0,this.hasAnyBroken=!1,!this.images.length)return void this.complete();for(var c=0;c<this.images.length;c++){var d=this.images[c];d.once("progress",a),d.check()}},g.prototype.progress=function(a,b,c){this.progressedCount++,this.hasAnyBroken=this.hasAnyBroken||!a.isLoaded,this.emit("progress",this,a,b),this.jqDeferred&&this.jqDeferred.notify&&this.jqDeferred.notify(this,a),this.progressedCount==this.images.length&&this.complete(),this.options.debug&&k&&k.log("progress: "+c,a,b)},g.prototype.complete=function(){var a=this.hasAnyBroken?"fail":"done";if(this.isComplete=!0,this.emit(a,this),this.emit("always",this),this.jqDeferred){var b=this.hasAnyBroken?"reject":"resolve";this.jqDeferred[b](this)}},h.prototype=new b,h.prototype.check=function(){var a=this.getIsImageComplete();return a?void this.confirm(0!==this.img.naturalWidth,"naturalWidth"):(this.proxyImage=new Image,c.bind(this.proxyImage,"load",this),c.bind(this.proxyImage,"error",this),c.bind(this.img,"load",this),c.bind(this.img,"error",this),void(this.proxyImage.src=this.img.src))},h.prototype.getIsImageComplete=function(){return this.img.complete&&void 0!==this.img.naturalWidth},h.prototype.confirm=function(a,b){this.isLoaded=a,this.emit("progress",this,this.img,b)},h.prototype.handleEvent=function(a){var b="on"+a.type;this[b]&&this[b](a)},h.prototype.onload=function(){this.confirm(!0,"onload"),this.unbindEvents()},h.prototype.onerror=function(){this.confirm(!1,"onerror"),this.unbindEvents()},h.prototype.unbindEvents=function(){c.unbind(this.proxyImage,"load",this),c.unbind(this.proxyImage,"error",this),c.unbind(this.img,"load",this),c.unbind(this.img,"error",this)},i.prototype=new h,i.prototype.check=function(){c.bind(this.img,"load",this),c.bind(this.img,"error",this),this.img.src=this.url;var a=this.getIsImageComplete();a&&(this.confirm(0!==this.img.naturalWidth,"naturalWidth"),this.unbindEvents())},i.prototype.unbindEvents=function(){c.unbind(this.img,"load",this),c.unbind(this.img,"error",this)},i.prototype.confirm=function(a,b){this.isLoaded=a,this.emit("progress",this,this.element,b)},g.makeJQueryPlugin=function(b){b=b||a.jQuery,b&&(j=b,j.fn.imagesLoaded=function(a,b){var c=new g(this,a,b);return c.jqDeferred.promise(j(this))})},g.makeJQueryPlugin(),g});;
/*!
 * Masonry PACKAGED v3.3.2
 * Cascading grid layout library
 * http://masonry.desandro.com
 * MIT License
 * by David DeSandro
 */

!function(a){function b(){}function c(a){function c(b){b.prototype.option||(b.prototype.option=function(b){a.isPlainObject(b)&&(this.options=a.extend(!0,this.options,b))})}function e(b,c){a.fn[b]=function(e){if("string"==typeof e){for(var g=d.call(arguments,1),h=0,i=this.length;i>h;h++){var j=this[h],k=a.data(j,b);if(k)if(a.isFunction(k[e])&&"_"!==e.charAt(0)){var l=k[e].apply(k,g);if(void 0!==l)return l}else f("no such method '"+e+"' for "+b+" instance");else f("cannot call methods on "+b+" prior to initialization; attempted to call '"+e+"'")}return this}return this.each(function(){var d=a.data(this,b);d?(d.option(e),d._init()):(d=new c(this,e),a.data(this,b,d))})}}if(a){var f="undefined"==typeof console?b:function(a){console.error(a)};return a.bridget=function(a,b){c(b),e(a,b)},a.bridget}}var d=Array.prototype.slice;"function"==typeof define&&define.amd?define("jquery-bridget/jquery.bridget",["jquery"],c):c("object"==typeof exports?require("jquery"):a.jQuery)}(window),function(a){function b(b){var c=a.event;return c.target=c.target||c.srcElement||b,c}var c=document.documentElement,d=function(){};c.addEventListener?d=function(a,b,c){a.addEventListener(b,c,!1)}:c.attachEvent&&(d=function(a,c,d){a[c+d]=d.handleEvent?function(){var c=b(a);d.handleEvent.call(d,c)}:function(){var c=b(a);d.call(a,c)},a.attachEvent("on"+c,a[c+d])});var e=function(){};c.removeEventListener?e=function(a,b,c){a.removeEventListener(b,c,!1)}:c.detachEvent&&(e=function(a,b,c){a.detachEvent("on"+b,a[b+c]);try{delete a[b+c]}catch(d){a[b+c]=void 0}});var f={bind:d,unbind:e};"function"==typeof define&&define.amd?define("eventie/eventie",f):"object"==typeof exports?module.exports=f:a.eventie=f}(window),function(){function a(){}function b(a,b){for(var c=a.length;c--;)if(a[c].listener===b)return c;return-1}function c(a){return function(){return this[a].apply(this,arguments)}}var d=a.prototype,e=this,f=e.EventEmitter;d.getListeners=function(a){var b,c,d=this._getEvents();if(a instanceof RegExp){b={};for(c in d)d.hasOwnProperty(c)&&a.test(c)&&(b[c]=d[c])}else b=d[a]||(d[a]=[]);return b},d.flattenListeners=function(a){var b,c=[];for(b=0;b<a.length;b+=1)c.push(a[b].listener);return c},d.getListenersAsObject=function(a){var b,c=this.getListeners(a);return c instanceof Array&&(b={},b[a]=c),b||c},d.addListener=function(a,c){var d,e=this.getListenersAsObject(a),f="object"==typeof c;for(d in e)e.hasOwnProperty(d)&&-1===b(e[d],c)&&e[d].push(f?c:{listener:c,once:!1});return this},d.on=c("addListener"),d.addOnceListener=function(a,b){return this.addListener(a,{listener:b,once:!0})},d.once=c("addOnceListener"),d.defineEvent=function(a){return this.getListeners(a),this},d.defineEvents=function(a){for(var b=0;b<a.length;b+=1)this.defineEvent(a[b]);return this},d.removeListener=function(a,c){var d,e,f=this.getListenersAsObject(a);for(e in f)f.hasOwnProperty(e)&&(d=b(f[e],c),-1!==d&&f[e].splice(d,1));return this},d.off=c("removeListener"),d.addListeners=function(a,b){return this.manipulateListeners(!1,a,b)},d.removeListeners=function(a,b){return this.manipulateListeners(!0,a,b)},d.manipulateListeners=function(a,b,c){var d,e,f=a?this.removeListener:this.addListener,g=a?this.removeListeners:this.addListeners;if("object"!=typeof b||b instanceof RegExp)for(d=c.length;d--;)f.call(this,b,c[d]);else for(d in b)b.hasOwnProperty(d)&&(e=b[d])&&("function"==typeof e?f.call(this,d,e):g.call(this,d,e));return this},d.removeEvent=function(a){var b,c=typeof a,d=this._getEvents();if("string"===c)delete d[a];else if(a instanceof RegExp)for(b in d)d.hasOwnProperty(b)&&a.test(b)&&delete d[b];else delete this._events;return this},d.removeAllListeners=c("removeEvent"),d.emitEvent=function(a,b){var c,d,e,f,g=this.getListenersAsObject(a);for(e in g)if(g.hasOwnProperty(e))for(d=g[e].length;d--;)c=g[e][d],c.once===!0&&this.removeListener(a,c.listener),f=c.listener.apply(this,b||[]),f===this._getOnceReturnValue()&&this.removeListener(a,c.listener);return this},d.trigger=c("emitEvent"),d.emit=function(a){var b=Array.prototype.slice.call(arguments,1);return this.emitEvent(a,b)},d.setOnceReturnValue=function(a){return this._onceReturnValue=a,this},d._getOnceReturnValue=function(){return this.hasOwnProperty("_onceReturnValue")?this._onceReturnValue:!0},d._getEvents=function(){return this._events||(this._events={})},a.noConflict=function(){return e.EventEmitter=f,a},"function"==typeof define&&define.amd?define("eventEmitter/EventEmitter",[],function(){return a}):"object"==typeof module&&module.exports?module.exports=a:e.EventEmitter=a}.call(this),function(a){function b(a){if(a){if("string"==typeof d[a])return a;a=a.charAt(0).toUpperCase()+a.slice(1);for(var b,e=0,f=c.length;f>e;e++)if(b=c[e]+a,"string"==typeof d[b])return b}}var c="Webkit Moz ms Ms O".split(" "),d=document.documentElement.style;"function"==typeof define&&define.amd?define("get-style-property/get-style-property",[],function(){return b}):"object"==typeof exports?module.exports=b:a.getStyleProperty=b}(window),function(a){function b(a){var b=parseFloat(a),c=-1===a.indexOf("%")&&!isNaN(b);return c&&b}function c(){}function d(){for(var a={width:0,height:0,innerWidth:0,innerHeight:0,outerWidth:0,outerHeight:0},b=0,c=g.length;c>b;b++){var d=g[b];a[d]=0}return a}function e(c){function e(){if(!m){m=!0;var d=a.getComputedStyle;if(j=function(){var a=d?function(a){return d(a,null)}:function(a){return a.currentStyle};return function(b){var c=a(b);return c||f("Style returned "+c+". Are you running this code in a hidden iframe on Firefox? See http://bit.ly/getsizebug1"),c}}(),k=c("boxSizing")){var e=document.createElement("div");e.style.width="200px",e.style.padding="1px 2px 3px 4px",e.style.borderStyle="solid",e.style.borderWidth="1px 2px 3px 4px",e.style[k]="border-box";var g=document.body||document.documentElement;g.appendChild(e);var h=j(e);l=200===b(h.width),g.removeChild(e)}}}function h(a){if(e(),"string"==typeof a&&(a=document.querySelector(a)),a&&"object"==typeof a&&a.nodeType){var c=j(a);if("none"===c.display)return d();var f={};f.width=a.offsetWidth,f.height=a.offsetHeight;for(var h=f.isBorderBox=!(!k||!c[k]||"border-box"!==c[k]),m=0,n=g.length;n>m;m++){var o=g[m],p=c[o];p=i(a,p);var q=parseFloat(p);f[o]=isNaN(q)?0:q}var r=f.paddingLeft+f.paddingRight,s=f.paddingTop+f.paddingBottom,t=f.marginLeft+f.marginRight,u=f.marginTop+f.marginBottom,v=f.borderLeftWidth+f.borderRightWidth,w=f.borderTopWidth+f.borderBottomWidth,x=h&&l,y=b(c.width);y!==!1&&(f.width=y+(x?0:r+v));var z=b(c.height);return z!==!1&&(f.height=z+(x?0:s+w)),f.innerWidth=f.width-(r+v),f.innerHeight=f.height-(s+w),f.outerWidth=f.width+t,f.outerHeight=f.height+u,f}}function i(b,c){if(a.getComputedStyle||-1===c.indexOf("%"))return c;var d=b.style,e=d.left,f=b.runtimeStyle,g=f&&f.left;return g&&(f.left=b.currentStyle.left),d.left=c,c=d.pixelLeft,d.left=e,g&&(f.left=g),c}var j,k,l,m=!1;return h}var f="undefined"==typeof console?c:function(a){console.error(a)},g=["paddingLeft","paddingRight","paddingTop","paddingBottom","marginLeft","marginRight","marginTop","marginBottom","borderLeftWidth","borderRightWidth","borderTopWidth","borderBottomWidth"];"function"==typeof define&&define.amd?define("get-size/get-size",["get-style-property/get-style-property"],e):"object"==typeof exports?module.exports=e(require("desandro-get-style-property")):a.getSize=e(a.getStyleProperty)}(window),function(a){function b(a){"function"==typeof a&&(b.isReady?a():g.push(a))}function c(a){var c="readystatechange"===a.type&&"complete"!==f.readyState;b.isReady||c||d()}function d(){b.isReady=!0;for(var a=0,c=g.length;c>a;a++){var d=g[a];d()}}function e(e){return"complete"===f.readyState?d():(e.bind(f,"DOMContentLoaded",c),e.bind(f,"readystatechange",c),e.bind(a,"load",c)),b}var f=a.document,g=[];b.isReady=!1,"function"==typeof define&&define.amd?define("doc-ready/doc-ready",["eventie/eventie"],e):"object"==typeof exports?module.exports=e(require("eventie")):a.docReady=e(a.eventie)}(window),function(a){function b(a,b){return a[g](b)}function c(a){if(!a.parentNode){var b=document.createDocumentFragment();b.appendChild(a)}}function d(a,b){c(a);for(var d=a.parentNode.querySelectorAll(b),e=0,f=d.length;f>e;e++)if(d[e]===a)return!0;return!1}function e(a,d){return c(a),b(a,d)}var f,g=function(){if(a.matches)return"matches";if(a.matchesSelector)return"matchesSelector";for(var b=["webkit","moz","ms","o"],c=0,d=b.length;d>c;c++){var e=b[c],f=e+"MatchesSelector";if(a[f])return f}}();if(g){var h=document.createElement("div"),i=b(h,"div");f=i?b:e}else f=d;"function"==typeof define&&define.amd?define("matches-selector/matches-selector",[],function(){return f}):"object"==typeof exports?module.exports=f:window.matchesSelector=f}(Element.prototype),function(a,b){"function"==typeof define&&define.amd?define("fizzy-ui-utils/utils",["doc-ready/doc-ready","matches-selector/matches-selector"],function(c,d){return b(a,c,d)}):"object"==typeof exports?module.exports=b(a,require("doc-ready"),require("desandro-matches-selector")):a.fizzyUIUtils=b(a,a.docReady,a.matchesSelector)}(window,function(a,b,c){var d={};d.extend=function(a,b){for(var c in b)a[c]=b[c];return a},d.modulo=function(a,b){return(a%b+b)%b};var e=Object.prototype.toString;d.isArray=function(a){return"[object Array]"==e.call(a)},d.makeArray=function(a){var b=[];if(d.isArray(a))b=a;else if(a&&"number"==typeof a.length)for(var c=0,e=a.length;e>c;c++)b.push(a[c]);else b.push(a);return b},d.indexOf=Array.prototype.indexOf?function(a,b){return a.indexOf(b)}:function(a,b){for(var c=0,d=a.length;d>c;c++)if(a[c]===b)return c;return-1},d.removeFrom=function(a,b){var c=d.indexOf(a,b);-1!=c&&a.splice(c,1)},d.isElement="function"==typeof HTMLElement||"object"==typeof HTMLElement?function(a){return a instanceof HTMLElement}:function(a){return a&&"object"==typeof a&&1==a.nodeType&&"string"==typeof a.nodeName},d.setText=function(){function a(a,c){b=b||(void 0!==document.documentElement.textContent?"textContent":"innerText"),a[b]=c}var b;return a}(),d.getParent=function(a,b){for(;a!=document.body;)if(a=a.parentNode,c(a,b))return a},d.getQueryElement=function(a){return"string"==typeof a?document.querySelector(a):a},d.handleEvent=function(a){var b="on"+a.type;this[b]&&this[b](a)},d.filterFindElements=function(a,b){a=d.makeArray(a);for(var e=[],f=0,g=a.length;g>f;f++){var h=a[f];if(d.isElement(h))if(b){c(h,b)&&e.push(h);for(var i=h.querySelectorAll(b),j=0,k=i.length;k>j;j++)e.push(i[j])}else e.push(h)}return e},d.debounceMethod=function(a,b,c){var d=a.prototype[b],e=b+"Timeout";a.prototype[b]=function(){var a=this[e];a&&clearTimeout(a);var b=arguments,f=this;this[e]=setTimeout(function(){d.apply(f,b),delete f[e]},c||100)}},d.toDashed=function(a){return a.replace(/(.)([A-Z])/g,function(a,b,c){return b+"-"+c}).toLowerCase()};var f=a.console;return d.htmlInit=function(c,e){b(function(){for(var b=d.toDashed(e),g=document.querySelectorAll(".js-"+b),h="data-"+b+"-options",i=0,j=g.length;j>i;i++){var k,l=g[i],m=l.getAttribute(h);try{k=m&&JSON.parse(m)}catch(n){f&&f.error("Error parsing "+h+" on "+l.nodeName.toLowerCase()+(l.id?"#"+l.id:"")+": "+n);continue}var o=new c(l,k),p=a.jQuery;p&&p.data(l,e,o)}})},d}),function(a,b){"function"==typeof define&&define.amd?define("outlayer/item",["eventEmitter/EventEmitter","get-size/get-size","get-style-property/get-style-property","fizzy-ui-utils/utils"],function(c,d,e,f){return b(a,c,d,e,f)}):"object"==typeof exports?module.exports=b(a,require("wolfy87-eventemitter"),require("get-size"),require("desandro-get-style-property"),require("fizzy-ui-utils")):(a.Outlayer={},a.Outlayer.Item=b(a,a.EventEmitter,a.getSize,a.getStyleProperty,a.fizzyUIUtils))}(window,function(a,b,c,d,e){function f(a){for(var b in a)return!1;return b=null,!0}function g(a,b){a&&(this.element=a,this.layout=b,this.position={x:0,y:0},this._create())}function h(a){return a.replace(/([A-Z])/g,function(a){return"-"+a.toLowerCase()})}var i=a.getComputedStyle,j=i?function(a){return i(a,null)}:function(a){return a.currentStyle},k=d("transition"),l=d("transform"),m=k&&l,n=!!d("perspective"),o={WebkitTransition:"webkitTransitionEnd",MozTransition:"transitionend",OTransition:"otransitionend",transition:"transitionend"}[k],p=["transform","transition","transitionDuration","transitionProperty"],q=function(){for(var a={},b=0,c=p.length;c>b;b++){var e=p[b],f=d(e);f&&f!==e&&(a[e]=f)}return a}();e.extend(g.prototype,b.prototype),g.prototype._create=function(){this._transn={ingProperties:{},clean:{},onEnd:{}},this.css({position:"absolute"})},g.prototype.handleEvent=function(a){var b="on"+a.type;this[b]&&this[b](a)},g.prototype.getSize=function(){this.size=c(this.element)},g.prototype.css=function(a){var b=this.element.style;for(var c in a){var d=q[c]||c;b[d]=a[c]}},g.prototype.getPosition=function(){var a=j(this.element),b=this.layout.options,c=b.isOriginLeft,d=b.isOriginTop,e=a[c?"left":"right"],f=a[d?"top":"bottom"],g=this.layout.size,h=-1!=e.indexOf("%")?parseFloat(e)/100*g.width:parseInt(e,10),i=-1!=f.indexOf("%")?parseFloat(f)/100*g.height:parseInt(f,10);h=isNaN(h)?0:h,i=isNaN(i)?0:i,h-=c?g.paddingLeft:g.paddingRight,i-=d?g.paddingTop:g.paddingBottom,this.position.x=h,this.position.y=i},g.prototype.layoutPosition=function(){var a=this.layout.size,b=this.layout.options,c={},d=b.isOriginLeft?"paddingLeft":"paddingRight",e=b.isOriginLeft?"left":"right",f=b.isOriginLeft?"right":"left",g=this.position.x+a[d];c[e]=this.getXValue(g),c[f]="";var h=b.isOriginTop?"paddingTop":"paddingBottom",i=b.isOriginTop?"top":"bottom",j=b.isOriginTop?"bottom":"top",k=this.position.y+a[h];c[i]=this.getYValue(k),c[j]="",this.css(c),this.emitEvent("layout",[this])},g.prototype.getXValue=function(a){var b=this.layout.options;return b.percentPosition&&!b.isHorizontal?a/this.layout.size.width*100+"%":a+"px"},g.prototype.getYValue=function(a){var b=this.layout.options;return b.percentPosition&&b.isHorizontal?a/this.layout.size.height*100+"%":a+"px"},g.prototype._transitionTo=function(a,b){this.getPosition();var c=this.position.x,d=this.position.y,e=parseInt(a,10),f=parseInt(b,10),g=e===this.position.x&&f===this.position.y;if(this.setPosition(a,b),g&&!this.isTransitioning)return void this.layoutPosition();var h=a-c,i=b-d,j={};j.transform=this.getTranslate(h,i),this.transition({to:j,onTransitionEnd:{transform:this.layoutPosition},isCleaning:!0})},g.prototype.getTranslate=function(a,b){var c=this.layout.options;return a=c.isOriginLeft?a:-a,b=c.isOriginTop?b:-b,n?"translate3d("+a+"px, "+b+"px, 0)":"translate("+a+"px, "+b+"px)"},g.prototype.goTo=function(a,b){this.setPosition(a,b),this.layoutPosition()},g.prototype.moveTo=m?g.prototype._transitionTo:g.prototype.goTo,g.prototype.setPosition=function(a,b){this.position.x=parseInt(a,10),this.position.y=parseInt(b,10)},g.prototype._nonTransition=function(a){this.css(a.to),a.isCleaning&&this._removeStyles(a.to);for(var b in a.onTransitionEnd)a.onTransitionEnd[b].call(this)},g.prototype._transition=function(a){if(!parseFloat(this.layout.options.transitionDuration))return void this._nonTransition(a);var b=this._transn;for(var c in a.onTransitionEnd)b.onEnd[c]=a.onTransitionEnd[c];for(c in a.to)b.ingProperties[c]=!0,a.isCleaning&&(b.clean[c]=!0);if(a.from){this.css(a.from);var d=this.element.offsetHeight;d=null}this.enableTransition(a.to),this.css(a.to),this.isTransitioning=!0};var r="opacity,"+h(q.transform||"transform");g.prototype.enableTransition=function(){this.isTransitioning||(this.css({transitionProperty:r,transitionDuration:this.layout.options.transitionDuration}),this.element.addEventListener(o,this,!1))},g.prototype.transition=g.prototype[k?"_transition":"_nonTransition"],g.prototype.onwebkitTransitionEnd=function(a){this.ontransitionend(a)},g.prototype.onotransitionend=function(a){this.ontransitionend(a)};var s={"-webkit-transform":"transform","-moz-transform":"transform","-o-transform":"transform"};g.prototype.ontransitionend=function(a){if(a.target===this.element){var b=this._transn,c=s[a.propertyName]||a.propertyName;if(delete b.ingProperties[c],f(b.ingProperties)&&this.disableTransition(),c in b.clean&&(this.element.style[a.propertyName]="",delete b.clean[c]),c in b.onEnd){var d=b.onEnd[c];d.call(this),delete b.onEnd[c]}this.emitEvent("transitionEnd",[this])}},g.prototype.disableTransition=function(){this.removeTransitionStyles(),this.element.removeEventListener(o,this,!1),this.isTransitioning=!1},g.prototype._removeStyles=function(a){var b={};for(var c in a)b[c]="";this.css(b)};var t={transitionProperty:"",transitionDuration:""};return g.prototype.removeTransitionStyles=function(){this.css(t)},g.prototype.removeElem=function(){this.element.parentNode.removeChild(this.element),this.css({display:""}),this.emitEvent("remove",[this])},g.prototype.remove=function(){if(!k||!parseFloat(this.layout.options.transitionDuration))return void this.removeElem();var a=this;this.once("transitionEnd",function(){a.removeElem()}),this.hide()},g.prototype.reveal=function(){delete this.isHidden,this.css({display:""});var a=this.layout.options,b={},c=this.getHideRevealTransitionEndProperty("visibleStyle");b[c]=this.onRevealTransitionEnd,this.transition({from:a.hiddenStyle,to:a.visibleStyle,isCleaning:!0,onTransitionEnd:b})},g.prototype.onRevealTransitionEnd=function(){this.isHidden||this.emitEvent("reveal")},g.prototype.getHideRevealTransitionEndProperty=function(a){var b=this.layout.options[a];if(b.opacity)return"opacity";for(var c in b)return c},g.prototype.hide=function(){this.isHidden=!0,this.css({display:""});var a=this.layout.options,b={},c=this.getHideRevealTransitionEndProperty("hiddenStyle");b[c]=this.onHideTransitionEnd,this.transition({from:a.visibleStyle,to:a.hiddenStyle,isCleaning:!0,onTransitionEnd:b})},g.prototype.onHideTransitionEnd=function(){this.isHidden&&(this.css({display:"none"}),this.emitEvent("hide"))},g.prototype.destroy=function(){this.css({position:"",left:"",right:"",top:"",bottom:"",transition:"",transform:""})},g}),function(a,b){"function"==typeof define&&define.amd?define("outlayer/outlayer",["eventie/eventie","eventEmitter/EventEmitter","get-size/get-size","fizzy-ui-utils/utils","./item"],function(c,d,e,f,g){return b(a,c,d,e,f,g)}):"object"==typeof exports?module.exports=b(a,require("eventie"),require("wolfy87-eventemitter"),require("get-size"),require("fizzy-ui-utils"),require("./item")):a.Outlayer=b(a,a.eventie,a.EventEmitter,a.getSize,a.fizzyUIUtils,a.Outlayer.Item)}(window,function(a,b,c,d,e,f){function g(a,b){var c=e.getQueryElement(a);if(!c)return void(h&&h.error("Bad element for "+this.constructor.namespace+": "+(c||a)));this.element=c,i&&(this.$element=i(this.element)),this.options=e.extend({},this.constructor.defaults),this.option(b);var d=++k;this.element.outlayerGUID=d,l[d]=this,this._create(),this.options.isInitLayout&&this.layout()}var h=a.console,i=a.jQuery,j=function(){},k=0,l={};return g.namespace="outlayer",g.Item=f,g.defaults={containerStyle:{position:"relative"},isInitLayout:!0,isOriginLeft:!0,isOriginTop:!0,isResizeBound:!0,isResizingContainer:!0,transitionDuration:"0.4s",hiddenStyle:{opacity:0,transform:"scale(0.001)"},visibleStyle:{opacity:1,transform:"scale(1)"}},e.extend(g.prototype,c.prototype),g.prototype.option=function(a){e.extend(this.options,a)},g.prototype._create=function(){this.reloadItems(),this.stamps=[],this.stamp(this.options.stamp),e.extend(this.element.style,this.options.containerStyle),this.options.isResizeBound&&this.bindResize()},g.prototype.reloadItems=function(){this.items=this._itemize(this.element.children)},g.prototype._itemize=function(a){for(var b=this._filterFindItemElements(a),c=this.constructor.Item,d=[],e=0,f=b.length;f>e;e++){var g=b[e],h=new c(g,this);d.push(h)}return d},g.prototype._filterFindItemElements=function(a){return e.filterFindElements(a,this.options.itemSelector)},g.prototype.getItemElements=function(){for(var a=[],b=0,c=this.items.length;c>b;b++)a.push(this.items[b].element);return a},g.prototype.layout=function(){this._resetLayout(),this._manageStamps();var a=void 0!==this.options.isLayoutInstant?this.options.isLayoutInstant:!this._isLayoutInited;this.layoutItems(this.items,a),this._isLayoutInited=!0},g.prototype._init=g.prototype.layout,g.prototype._resetLayout=function(){this.getSize()},g.prototype.getSize=function(){this.size=d(this.element)},g.prototype._getMeasurement=function(a,b){var c,f=this.options[a];f?("string"==typeof f?c=this.element.querySelector(f):e.isElement(f)&&(c=f),this[a]=c?d(c)[b]:f):this[a]=0},g.prototype.layoutItems=function(a,b){a=this._getItemsForLayout(a),this._layoutItems(a,b),this._postLayout()},g.prototype._getItemsForLayout=function(a){for(var b=[],c=0,d=a.length;d>c;c++){var e=a[c];e.isIgnored||b.push(e)}return b},g.prototype._layoutItems=function(a,b){if(this._emitCompleteOnItems("layout",a),a&&a.length){for(var c=[],d=0,e=a.length;e>d;d++){var f=a[d],g=this._getItemLayoutPosition(f);g.item=f,g.isInstant=b||f.isLayoutInstant,c.push(g)}this._processLayoutQueue(c)}},g.prototype._getItemLayoutPosition=function(){return{x:0,y:0}},g.prototype._processLayoutQueue=function(a){for(var b=0,c=a.length;c>b;b++){var d=a[b];this._positionItem(d.item,d.x,d.y,d.isInstant)}},g.prototype._positionItem=function(a,b,c,d){d?a.goTo(b,c):a.moveTo(b,c)},g.prototype._postLayout=function(){this.resizeContainer()},g.prototype.resizeContainer=function(){if(this.options.isResizingContainer){var a=this._getContainerSize();a&&(this._setContainerMeasure(a.width,!0),this._setContainerMeasure(a.height,!1))}},g.prototype._getContainerSize=j,g.prototype._setContainerMeasure=function(a,b){if(void 0!==a){var c=this.size;c.isBorderBox&&(a+=b?c.paddingLeft+c.paddingRight+c.borderLeftWidth+c.borderRightWidth:c.paddingBottom+c.paddingTop+c.borderTopWidth+c.borderBottomWidth),a=Math.max(a,0),this.element.style[b?"width":"height"]=a+"px"}},g.prototype._emitCompleteOnItems=function(a,b){function c(){e.dispatchEvent(a+"Complete",null,[b])}function d(){g++,g===f&&c()}var e=this,f=b.length;if(!b||!f)return void c();for(var g=0,h=0,i=b.length;i>h;h++){var j=b[h];j.once(a,d)}},g.prototype.dispatchEvent=function(a,b,c){var d=b?[b].concat(c):c;if(this.emitEvent(a,d),i)if(this.$element=this.$element||i(this.element),b){var e=i.Event(b);e.type=a,this.$element.trigger(e,c)}else this.$element.trigger(a,c)},g.prototype.ignore=function(a){var b=this.getItem(a);b&&(b.isIgnored=!0)},g.prototype.unignore=function(a){var b=this.getItem(a);b&&delete b.isIgnored},g.prototype.stamp=function(a){if(a=this._find(a)){this.stamps=this.stamps.concat(a);for(var b=0,c=a.length;c>b;b++){var d=a[b];this.ignore(d)}}},g.prototype.unstamp=function(a){if(a=this._find(a))for(var b=0,c=a.length;c>b;b++){var d=a[b];e.removeFrom(this.stamps,d),this.unignore(d)}},g.prototype._find=function(a){return a?("string"==typeof a&&(a=this.element.querySelectorAll(a)),a=e.makeArray(a)):void 0},g.prototype._manageStamps=function(){if(this.stamps&&this.stamps.length){this._getBoundingRect();for(var a=0,b=this.stamps.length;b>a;a++){var c=this.stamps[a];this._manageStamp(c)}}},g.prototype._getBoundingRect=function(){var a=this.element.getBoundingClientRect(),b=this.size;this._boundingRect={left:a.left+b.paddingLeft+b.borderLeftWidth,top:a.top+b.paddingTop+b.borderTopWidth,right:a.right-(b.paddingRight+b.borderRightWidth),bottom:a.bottom-(b.paddingBottom+b.borderBottomWidth)}},g.prototype._manageStamp=j,g.prototype._getElementOffset=function(a){var b=a.getBoundingClientRect(),c=this._boundingRect,e=d(a),f={left:b.left-c.left-e.marginLeft,top:b.top-c.top-e.marginTop,right:c.right-b.right-e.marginRight,bottom:c.bottom-b.bottom-e.marginBottom};return f},g.prototype.handleEvent=function(a){var b="on"+a.type;this[b]&&this[b](a)},g.prototype.bindResize=function(){this.isResizeBound||(b.bind(a,"resize",this),this.isResizeBound=!0)},g.prototype.unbindResize=function(){this.isResizeBound&&b.unbind(a,"resize",this),this.isResizeBound=!1},g.prototype.onresize=function(){function a(){b.resize(),delete b.resizeTimeout}this.resizeTimeout&&clearTimeout(this.resizeTimeout);var b=this;this.resizeTimeout=setTimeout(a,100)},g.prototype.resize=function(){this.isResizeBound&&this.needsResizeLayout()&&this.layout()},g.prototype.needsResizeLayout=function(){var a=d(this.element),b=this.size&&a;return b&&a.innerWidth!==this.size.innerWidth},g.prototype.addItems=function(a){var b=this._itemize(a);return b.length&&(this.items=this.items.concat(b)),b},g.prototype.appended=function(a){var b=this.addItems(a);b.length&&(this.layoutItems(b,!0),this.reveal(b))},g.prototype.prepended=function(a){var b=this._itemize(a);if(b.length){var c=this.items.slice(0);this.items=b.concat(c),this._resetLayout(),this._manageStamps(),this.layoutItems(b,!0),this.reveal(b),this.layoutItems(c)}},g.prototype.reveal=function(a){this._emitCompleteOnItems("reveal",a);for(var b=a&&a.length,c=0;b&&b>c;c++){var d=a[c];d.reveal()}},g.prototype.hide=function(a){this._emitCompleteOnItems("hide",a);for(var b=a&&a.length,c=0;b&&b>c;c++){var d=a[c];d.hide()}},g.prototype.revealItemElements=function(a){var b=this.getItems(a);this.reveal(b)},g.prototype.hideItemElements=function(a){var b=this.getItems(a);this.hide(b)},g.prototype.getItem=function(a){for(var b=0,c=this.items.length;c>b;b++){var d=this.items[b];if(d.element===a)return d}},g.prototype.getItems=function(a){a=e.makeArray(a);for(var b=[],c=0,d=a.length;d>c;c++){var f=a[c],g=this.getItem(f);g&&b.push(g)}return b},g.prototype.remove=function(a){var b=this.getItems(a);if(this._emitCompleteOnItems("remove",b),b&&b.length)for(var c=0,d=b.length;d>c;c++){var f=b[c];f.remove(),e.removeFrom(this.items,f)}},g.prototype.destroy=function(){var a=this.element.style;a.height="",a.position="",a.width="";for(var b=0,c=this.items.length;c>b;b++){var d=this.items[b];d.destroy()}this.unbindResize();var e=this.element.outlayerGUID;delete l[e],delete this.element.outlayerGUID,i&&i.removeData(this.element,this.constructor.namespace)},g.data=function(a){a=e.getQueryElement(a);var b=a&&a.outlayerGUID;return b&&l[b]},g.create=function(a,b){function c(){g.apply(this,arguments)}return Object.create?c.prototype=Object.create(g.prototype):e.extend(c.prototype,g.prototype),c.prototype.constructor=c,c.defaults=e.extend({},g.defaults),e.extend(c.defaults,b),c.prototype.settings={},c.namespace=a,c.data=g.data,c.Item=function(){f.apply(this,arguments)},c.Item.prototype=new f,e.htmlInit(c,a),i&&i.bridget&&i.bridget(a,c),c},g.Item=f,g}),function(a,b){"function"==typeof define&&define.amd?define(["outlayer/outlayer","get-size/get-size","fizzy-ui-utils/utils"],b):"object"==typeof exports?module.exports=b(require("outlayer"),require("get-size"),require("fizzy-ui-utils")):a.Masonry=b(a.Outlayer,a.getSize,a.fizzyUIUtils)}(window,function(a,b,c){var d=a.create("masonry");return d.prototype._resetLayout=function(){this.getSize(),this._getMeasurement("columnWidth","outerWidth"),this._getMeasurement("gutter","outerWidth"),this.measureColumns();var a=this.cols;for(this.colYs=[];a--;)this.colYs.push(0);this.maxY=0},d.prototype.measureColumns=function(){if(this.getContainerWidth(),!this.columnWidth){var a=this.items[0],c=a&&a.element;this.columnWidth=c&&b(c).outerWidth||this.containerWidth}var d=this.columnWidth+=this.gutter,e=this.containerWidth+this.gutter,f=e/d,g=d-e%d,h=g&&1>g?"round":"floor";f=Math[h](f),this.cols=Math.max(f,1)},d.prototype.getContainerWidth=function(){var a=this.options.isFitWidth?this.element.parentNode:this.element,c=b(a);this.containerWidth=c&&c.innerWidth},d.prototype._getItemLayoutPosition=function(a){a.getSize();var b=a.size.outerWidth%this.columnWidth,d=b&&1>b?"round":"ceil",e=Math[d](a.size.outerWidth/this.columnWidth);e=Math.min(e,this.cols);for(var f=this._getColGroup(e),g=Math.min.apply(Math,f),h=c.indexOf(f,g),i={x:this.columnWidth*h,y:g},j=g+a.size.outerHeight,k=this.cols+1-f.length,l=0;k>l;l++)this.colYs[h+l]=j;return i},d.prototype._getColGroup=function(a){if(2>a)return this.colYs;for(var b=[],c=this.cols+1-a,d=0;c>d;d++){var e=this.colYs.slice(d,d+a);b[d]=Math.max.apply(Math,e)}return b},d.prototype._manageStamp=function(a){var c=b(a),d=this._getElementOffset(a),e=this.options.isOriginLeft?d.left:d.right,f=e+c.outerWidth,g=Math.floor(e/this.columnWidth);g=Math.max(0,g);var h=Math.floor(f/this.columnWidth);h-=f%this.columnWidth?0:1,h=Math.min(this.cols-1,h);for(var i=(this.options.isOriginTop?d.top:d.bottom)+c.outerHeight,j=g;h>=j;j++)this.colYs[j]=Math.max(i,this.colYs[j])},d.prototype._getContainerSize=function(){this.maxY=Math.max.apply(Math,this.colYs);var a={height:this.maxY};return this.options.isFitWidth&&(a.width=this._getContainerFitWidth()),a},d.prototype._getContainerFitWidth=function(){for(var a=0,b=this.cols;--b&&0===this.colYs[b];)a++;return(this.cols-a)*this.columnWidth-this.gutter},d.prototype.needsResizeLayout=function(){var a=this.containerWidth;return this.getContainerWidth(),a!==this.containerWidth},d});
;
/**
 * Theme frontend scripts
 *
 * @package    dyad
 *
 */

( function( $ ) {

    var $window = $( window );

    $( '.no-js' ).removeClass( 'no-js' );

    /**
     * Banner slider
     */

    if ( $().slick ) {

        $( '#site-banner.enable-slider .site-banner-inner' ).slick( {
            'adaptiveHeight' : false,
            'autoplay'       : true,
            'autoplaySpeed'  : ( ! jQuery( '#site-banner' ).data( 'speed' ) ) ? ( 5400 ) : ( jQuery( '#site-banner' ).data( 'speed' ) ),
            'cssEase'        : 'ease-in-out',
            'dots'           : false,
            'draggable'      : false,
            'easing'         : 'easeInOutBack',
            'fade'           : true,
            'pauseOnHover'   : true,
            'slide'          : 'article',
            'speed'          : 600,
            'swipeToSlide'   : true,
            'prevArrow'      : '<div class="slider-nav slider-nav-prev"><button type="button" class="slick-prev"><span class="genericon genericon-expand"></span></button></div>',
            'nextArrow'      : '<div class="slider-nav slider-nav-next"><button type="button" class="slick-next"><span class="genericon genericon-expand"></span></button></div>'
        } );

    }


    /**
     * Page scrolled?
     */

    if ( 0 == $window.scrollTop() ) {
        $( 'body' ).addClass( 'not-scrolled' )
    }

    $window.on( 'scroll', function( e ) {
        if ( 0 == $window.scrollTop() ) {
            $( 'body' ).addClass( 'not-scrolled' ).removeClass( 'is-scrolled' );
        } else {
            $( 'body' ).addClass( 'is-scrolled' ).removeClass( 'not-scrolled' );
        }
    } );


    /*
	 * Add 'focus' style to contact form
	 */

    $('.comment-form-author input, .comment-form-email input, .comment-form-url input, .comment-form-comment textarea').focus( function() {
        $( this ).parent().addClass( 'focus' );
    } ).blur( function() {
        if( "" == $( this). val() ) {
            $( this ).parent().removeClass( 'focus' );
        }
    } );

    /*
	 * Make sure 'Add Yours' comment link doesn't overshoot the form when header is fixed
	 */

    $( '.add-comment-link' ).click( function( e ) {
        if( $( window ).width() > 1400 ) {
            e.preventDefault();
            var offset = $( '#respond' ).offset();
            var scrollto = offset.top - ( $('#masthead').innerHeight() + 50 );
            $('html, body').animate({scrollTop:scrollto}, 0);
        }
    } );


    /**
     * Make sure content isn't too high in grid view
     */

    function adjustPosts() {
        $('.posts .entry-inner').each( function() {
            var $contain = $(this),
                $innerContainHeight = $('.entry-inner-content', this ).height(),
                $linkMoreHeight = $( '.link-more', this ).height();
            $header = $('.entry-header', this),
                $headerHeight = $header.innerHeight(),
                $content = $('.entry-content', this),
                $contentHeight = $content.innerHeight(),
                $wholeContentHeight = $headerHeight + $contentHeight;

            if ( ( $innerContainHeight - $linkMoreHeight ) <= $wholeContentHeight ) {
                $contain.parent().addClass('too-short');
            } else {
                $contain.parent().removeClass('too-short');
            }
        } );
    }


    /**
     * Adjust header height
     */

    function adjustHeaderHeight() {
        var $header = $('#masthead'),
            $headerHeight = $header.outerHeight() + 50;

        if( $('body').hasClass('blog') || $('body').hasClass('home')  ) {
            if( $('.site-banner-header').length !== 0 && $('.site-banner-header').offset().top <= $headerHeight ) {
                $('.site-banner').addClass('too-tall');
            }

        } else {
            $('body:not(.blog, .home, .single-format-image.has-post-thumbnail) .site-content').css('padding-top', $headerHeight );
        }
    }

    /**
     * Masonry for footer widgets
     */

    function widgetMasonry() {

        // Make sure we're on a larger screen
        if ( 'none' !== $( '#colophon .widget-area .widget:first-of-type' ).css( 'float' ) ) {
            // Determine text direction
            var ltr = true;
            if ( $('html' ).attr( 'dir' ) == 'rtl') {
                ltr = false;
            }

            $grid = $( '.grid-container' ).masonry( {
                itemSelector: '.widget',
                columnWidth: '.widget-area aside',
                isOriginLeft: ltr,
            } );

            // Re-fire masonry after set of time, for any late-loading widgets
            setTimeout( function() { $grid.masonry( 'layout' ); }, 2000 );
        }
    }

    /**
     * Firing events
     */

    // Fire on load
    $( window ).on( 'load', function() {
        widgetMasonry();
    } );

    // Fire on document ready
    $( document ).ready(function(){
        adjustPosts();
        adjustHeaderHeight();

        // Make sure we're on a larger screen
        if ( 'none' !== $( '#colophon .widget-area .widget:first-of-type' ).css( 'float' ) ) {

            // Set some min-heights to help improve Masonry's treatment of these widgets

            // Get Twitter widgets and set a min-height on parent elements
            $( 'a.twitter-timeline' ).each( function() {

                var thisHeight = $( this ).attr( 'data-height' );

                // Set the widget to have this height
                $( this ).parent().css( 'min-height', thisHeight + 'px' );
            } );

            // Get Facebook widgets and set a min-height on parent elements
            $( '.fb-page' ).each( function() {

                // Get some settings from the initial markup:
                var $set_height = $( this ).data( 'height' ),
                    $hide_cover = $( this ).data( 'hide-cover' ),
                    $show_facepile = $( this ).data( 'show-facepile' ),
                    $show_posts = $( this ).data( 'show-posts' ), // AKA stream
                    $min_height = $set_height; // set the default 'min-height'

                // These values are defaults from the FB widget.
                var $no_posts_no_faces = 130,
                    $no_posts = 220;

                if ( $show_posts ) {
                    // Showing posts; may also be showing faces and/or cover - the latter doesn't affect the height at all.
                    $min_height = $set_height;

                } else if ( $show_facepile ) {
                    // Showing facepile with or without cover image - both would be same height.
                    // If the user selected height is lower than the no_posts height, we'll use that instead
                    $min_height = ( $set_height < $no_posts ) ? $set_height : $no_posts;

                } else {
                    // Either just showing cover, or nothing is selected (both are same height).
                    // If the user selected height is lower than the no_posts_no_faces height, we'll use that instead
                    $min_height = ( $set_height < $no_posts_no_faces ) ? $set_height : $no_posts_no_faces;
                }

                // apply min-height to .fb-page container
                $( this ).css( 'min-height', $min_height + 'px' );
            } );
        }
    } );

    //Fire on window resize
    var resizeTimer;

    $( window ).on( 'resize', function() {
        clearTimeout( resizeTimer );
        resizeTimer = setTimeout( function() {
            adjustPosts();
            adjustHeaderHeight();

            // Fire Masonry, in case we're moving from mobile to desktop
            widgetMasonry();
        }, 250 );
    } );

    // if Infinite Scroll, fire again when new posts are loaded
    $( document.body ).on( 'post-load', function() {
        adjustPosts();
    } );

} )( jQuery );
;
( function( $ ) {
    var cookieValue = document.cookie.replace( /(?:(?:^|.*;\s*)eucookielaw\s*\=\s*([^;]*).*$)|^.*$/, '$1' ),
        overlay = $( '#eu-cookie-law' ),
        initialScrollPosition,
        scrollFunction;

    if ( overlay.hasClass( 'ads-active' ) ) {
        var adsCookieValue = document.cookie.replace( /(?:(?:^|.*;\s*)personalized-ads-consent\s*\=\s*([^;]*).*$)|^.*$/, '$1' );
        if ( '' !== cookieValue && '' !== adsCookieValue ) {
            overlay.remove();
        }
    } else if ( '' !== cookieValue ) {
        overlay.remove();
    }

    $( '.widget_eu_cookie_law_widget' ).appendTo( 'body' ).fadeIn();

    overlay.find( 'form' ).on( 'submit', accept );

    if ( overlay.hasClass( 'hide-on-scroll' ) ) {
        initialScrollPosition = $( window ).scrollTop();
        scrollFunction = function() {
            if ( Math.abs( $( window ).scrollTop() - initialScrollPosition ) > 50 ) {
                accept();
            }
        };
        $( window ).on( 'scroll', scrollFunction );
    } else if ( overlay.hasClass( 'hide-on-time' ) ) {
        setTimeout( accept, overlay.data( 'hide-timeout' ) * 1000 );
    }

    var accepted = false;
    function accept( event ) {
        if ( accepted ) {
            return;
        }
        accepted = true;

        if ( event && event.preventDefault ) {
            event.preventDefault();
        }

        if ( overlay.hasClass( 'hide-on-scroll' ) ) {
            $( window ).off( 'scroll', scrollFunction );
        }

        var expireTime = new Date();
        expireTime.setTime( expireTime.getTime() + ( overlay.data( 'consent-expiration' ) * 24 * 60 * 60 * 1000 ) );

        document.cookie = 'eucookielaw=' + expireTime.getTime() + ';path=/;expires=' + expireTime.toGMTString();
        if ( overlay.hasClass( 'ads-active' ) && overlay.hasClass( 'hide-on-button' ) ) {
            document.cookie = 'personalized-ads-consent=' + expireTime.getTime() + ';path=/;expires=' + expireTime.toGMTString();
        }

        overlay.fadeOut( 400, function() {
            overlay.remove();
        } );
    }
} )( jQuery );
;
/***
 * Warning: This file is remotely enqueued in Jetpack's Masterbar module.
 * Changing it will also affect Jetpack sites.
 */
jQuery( document ).ready( function( $, wpcom ) {
    var masterbar,
        menupops = $( 'li#wp-admin-bar-blog.menupop, li#wp-admin-bar-newdash.menupop, li#wp-admin-bar-my-account.menupop' ),
        newmenu = $( '#wp-admin-bar-new-post-types' );

    // Unbind hoverIntent, we want clickable menus.
    menupops
        .unbind( 'mouseenter mouseleave' )
        .removeProp( 'hoverIntent_t' )
        .removeProp( 'hoverIntent_s' )
        .on( 'mouseover', function(e) {
            var li = $(e.target).closest( 'li.menupop' );
            menupops.not(li).removeClass( 'ab-hover' );
            li.toggleClass( 'ab-hover' );
        } )
        .on( 'click touchstart', function(e) {
            var $target = $( e.target );

            if ( masterbar.focusSubMenus( $target ) ) {
                return;
            }

            e.preventDefault();
            masterbar.toggleMenu( $target );
        } );

    masterbar = {
        focusSubMenus: function( $target ) {
            // Handle selection of menu items
            if ( ! $target.closest( 'ul' ).hasClass( 'ab-top-menu' ) ) {
                $target
                    .closest( 'li' );

                return true;
            }

            return false;
        },

        toggleMenu: function( $target ) {
            var $li = $target.closest( 'li.menupop' ),
                $html = $( 'html' );

            $( 'body' ).off( 'click.ab-menu' );
            $( '#wpadminbar li.menupop' ).not($li).removeClass( 'ab-active wpnt-stayopen wpnt-show' );

            if ( $li.hasClass( 'ab-active' ) ) {
                $li.removeClass( 'ab-active' );
                $html.removeClass( 'ab-menu-open' );
            } else {
                $li.addClass( 'ab-active' );
                $html.addClass( 'ab-menu-open' );

                $( 'body' ).on( 'click.ab-menu', function( e ) {
                    if ( ! $( e.target ).parents( '#wpadminbar' ).length ) {
                        e.preventDefault();
                        masterbar.toggleMenu( $li );
                        $( 'body' ).off( 'click.ab-menu' );
                    }
                } );
            }
        }
    };
} );;
/*globals JSON */
( function( $ ) {
    var eventName = 'wpcom_masterbar_click';

    var linksTracksEvents = {
        //top level items
        'wp-admin-bar-blog'                        : 'my_sites',
        'wp-admin-bar-newdash'                     : 'reader',
        'wp-admin-bar-ab-new-post'                 : 'write_button',
        'wp-admin-bar-my-account'                  : 'my_account',
        'wp-admin-bar-notes'                       : 'notifications',
        //my sites - top items
        'wp-admin-bar-switch-site'                 : 'my_sites_switch_site',
        'wp-admin-bar-blog-info'                   : 'my_sites_site_info',
        'wp-admin-bar-site-view'                   : 'my_sites_view_site',
        'wp-admin-bar-blog-stats'                  : 'my_sites_site_stats',
        'wp-admin-bar-plan'                        : 'my_sites_plan',
        'wp-admin-bar-plan-badge'                  : 'my_sites_plan_badge',
        //my sites - manage
        'wp-admin-bar-edit-page'                   : 'my_sites_manage_site_pages',
        'wp-admin-bar-new-page-badge'              : 'my_sites_manage_add_page',
        'wp-admin-bar-edit-post'                   : 'my_sites_manage_blog_posts',
        'wp-admin-bar-new-post-badge'              : 'my_sites_manage_add_post',
        'wp-admin-bar-edit-attachment'             : 'my_sites_manage_media',
        'wp-admin-bar-new-attachment-badge'        : 'my_sites_manage_add_media',
        'wp-admin-bar-comments'                    : 'my_sites_manage_comments',
        'wp-admin-bar-edit-jetpack-testimonial'    : 'my_sites_manage_testimonials',
        'wp-admin-bar-new-jetpack-testimonial'     : 'my_sites_manage_add_testimonial',
        'wp-admin-bar-edit-jetpack-portfolio'      : 'my_sites_manage_portfolio',
        'wp-admin-bar-new-jetpack-portfolio'       : 'my_sites_manage_add_portfolio',
        //my sites - personalize
        'wp-admin-bar-themes'                      : 'my_sites_personalize_themes',
        'wp-admin-bar-cmz'                         : 'my_sites_personalize_themes_customize',
        //my sites - configure
        'wp-admin-bar-sharing'                     : 'my_sites_configure_sharing',
        'wp-admin-bar-people'                      : 'my_sites_configure_people',
        'wp-admin-bar-people-add'                  : 'my_sites_configure_people_add_button',
        'wp-admin-bar-plugins'                     : 'my_sites_configure_plugins',
        'wp-admin-bar-domains'                     : 'my_sites_configure_domains',
        'wp-admin-bar-domains-add'                 : 'my_sites_configure_add_domain',
        'wp-admin-bar-blog-settings'               : 'my_sites_configure_settings',
        'wp-admin-bar-legacy-dashboard'            : 'my_sites_configure_wp_admin',
        //reader
        'wp-admin-bar-followed-sites'              : 'reader_followed_sites',
        'wp-admin-bar-reader-followed-sites-manage': 'reader_manage_followed_sites',
        'wp-admin-bar-discover-discover'           : 'reader_discover',
        'wp-admin-bar-discover-search'             : 'reader_search',
        'wp-admin-bar-my-activity-my-likes'        : 'reader_my_likes',
        //account
        'wp-admin-bar-user-info'                   : 'my_account_user_name',
        // account - profile
        'wp-admin-bar-my-profile'                  : 'my_account_profile_my_profile',
        'wp-admin-bar-account-settings'            : 'my_account_profile_account_settings',
        'wp-admin-bar-billing'                     : 'my_account_profile_manage_purchases',
        'wp-admin-bar-security'                    : 'my_account_profile_security',
        'wp-admin-bar-notifications'               : 'my_account_profile_notifications',
        //account - special
        'wp-admin-bar-get-apps'                    : 'my_account_special_get_apps',
        'wp-admin-bar-next-steps'                  : 'my_account_special_next_steps',
        'wp-admin-bar-help'                        : 'my_account_special_help',
    };

    var notesTracksEvents = {
        openSite: function( data ) {
            return {
                clicked: 'masterbar_notifications_panel_site',
                site_id: data.siteId
            };
        },
        openPost: function( data ) {
            return {
                clicked: 'masterbar_notifications_panel_post',
                site_id: data.siteId,
                post_id: data.postId
            };
        },
        openComment: function( data ) {
            return {
                clicked: 'masterbar_notifications_panel_comment',
                site_id: data.siteId,
                post_id: data.postId,
                comment_id: data.commentId
            };
        }
    };

    function recordTracksEvent( eventProps ) {
        eventProps = eventProps || {};
        window._tkq = window._tkq || [];
        window._tkq.push( [ 'recordEvent', eventName, eventProps ] );
    }

    function parseJson( s, defaultValue ) {
        try {
            return JSON.parse( s );
        } catch ( e ) {
            return defaultValue;
        }
    }

    $( document ).ready( function() {
        var trackableLinks = '.mb-trackable .ab-item:not(div),' +
            '#wp-admin-bar-notes .ab-item,' +
            '#wp-admin-bar-user-info .ab-item,' +
            '.mb-trackable .ab-secondary';

        $( trackableLinks ).on( 'click touchstart', function( e ) {
            var $target = $( e.target ),
                $parent = $target.closest( 'li' );

            if ( ! $parent ) {
                return;
            }

            var trackingId = $target.attr( 'ID' ) || $parent.attr( 'ID' );

            if ( ! linksTracksEvents.hasOwnProperty( trackingId ) ) {
                return;
            }

            var eventProps = { 'clicked': linksTracksEvents[ trackingId ] };

            recordTracksEvent( eventProps );
        } );
    } );

    // listen for postMessage events from the notifications iframe
    $( window ).on( 'message', function( e ) {
        var event = ! e.data && e.originalEvent.data ? e.originalEvent : e;
        if ( event.origin !== 'https://widgets.wp.com' ) {
            return;
        }

        var data = ( 'string' === typeof event.data ) ? parseJson( event.data, {} ) : event.data;
        if ( 'notesIframeMessage' !== data.type ) {
            return;
        }

        var eventData = notesTracksEvents[ data.action ];
        if ( ! eventData ) {
            return;
        }

        recordTracksEvent( eventData( data ) );
    } );

} )( jQuery );
;
/*	SWFObject v2.2 <http://code.google.com/p/swfobject/>
	is released under the MIT License <http://www.opensource.org/licenses/mit-license.php>
*/
var swfobject=function(){var D="undefined",r="object",S="Shockwave Flash",W="ShockwaveFlash.ShockwaveFlash",q="application/x-shockwave-flash",R="SWFObjectExprInst",x="onreadystatechange",O=window,j=document,t=navigator,T=false,U=[h],o=[],N=[],I=[],l,Q,E,B,J=false,a=false,n,G,m=true,M=function(){var aa=typeof j.getElementById!=D&&typeof j.getElementsByTagName!=D&&typeof j.createElement!=D,ah=t.userAgent.toLowerCase(),Y=t.platform.toLowerCase(),ae=Y?/win/.test(Y):/win/.test(ah),ac=Y?/mac/.test(Y):/mac/.test(ah),af=/webkit/.test(ah)?parseFloat(ah.replace(/^.*webkit\/(\d+(\.\d+)?).*$/,"$1")):false,X=!+"\v1",ag=[0,0,0],ab=null;if(typeof t.plugins!=D&&typeof t.plugins[S]==r){ab=t.plugins[S].description;if(ab&&!(typeof t.mimeTypes!=D&&t.mimeTypes[q]&&!t.mimeTypes[q].enabledPlugin)){T=true;X=false;ab=ab.replace(/^.*\s+(\S+\s+\S+$)/,"$1");ag[0]=parseInt(ab.replace(/^(.*)\..*$/,"$1"),10);ag[1]=parseInt(ab.replace(/^.*\.(.*)\s.*$/,"$1"),10);ag[2]=/[a-zA-Z]/.test(ab)?parseInt(ab.replace(/^.*[a-zA-Z]+(.*)$/,"$1"),10):0}}else{if(typeof O.ActiveXObject!=D){try{var ad=new ActiveXObject(W);if(ad){ab=ad.GetVariable("$version");if(ab){X=true;ab=ab.split(" ")[1].split(",");ag=[parseInt(ab[0],10),parseInt(ab[1],10),parseInt(ab[2],10)]}}}catch(Z){}}}return{w3:aa,pv:ag,wk:af,ie:X,win:ae,mac:ac}}(),k=function(){if(!M.w3){return}if((typeof j.readyState!=D&&j.readyState=="complete")||(typeof j.readyState==D&&(j.getElementsByTagName("body")[0]||j.body))){f()}if(!J){if(typeof j.addEventListener!=D){j.addEventListener("DOMContentLoaded",f,false)}if(M.ie&&M.win){j.attachEvent(x,function(){if(j.readyState=="complete"){j.detachEvent(x,arguments.callee);f()}});if(O==top){(function(){if(J){return}try{j.documentElement.doScroll("left")}catch(X){setTimeout(arguments.callee,0);return}f()})()}}if(M.wk){(function(){if(J){return}if(!/loaded|complete/.test(j.readyState)){setTimeout(arguments.callee,0);return}f()})()}s(f)}}();function f(){if(J){return}try{var Z=j.getElementsByTagName("body")[0].appendChild(C("span"));Z.parentNode.removeChild(Z)}catch(aa){return}J=true;var X=U.length;for(var Y=0;Y<X;Y++){U[Y]()}}function K(X){if(J){X()}else{U[U.length]=X}}function s(Y){if(typeof O.addEventListener!=D){O.addEventListener("load",Y,false)}else{if(typeof j.addEventListener!=D){j.addEventListener("load",Y,false)}else{if(typeof O.attachEvent!=D){i(O,"onload",Y)}else{if(typeof O.onload=="function"){var X=O.onload;O.onload=function(){X();Y()}}else{O.onload=Y}}}}}function h(){if(T){V()}else{H()}}function V(){var X=j.getElementsByTagName("body")[0];var aa=C(r);aa.setAttribute("type",q);var Z=X.appendChild(aa);if(Z){var Y=0;(function(){if(typeof Z.GetVariable!=D){var ab=Z.GetVariable("$version");if(ab){ab=ab.split(" ")[1].split(",");M.pv=[parseInt(ab[0],10),parseInt(ab[1],10),parseInt(ab[2],10)]}}else{if(Y<10){Y++;setTimeout(arguments.callee,10);return}}X.removeChild(aa);Z=null;H()})()}else{H()}}function H(){var ag=o.length;if(ag>0){for(var af=0;af<ag;af++){var Y=o[af].id;var ab=o[af].callbackFn;var aa={success:false,id:Y};if(M.pv[0]>0){var ae=c(Y);if(ae){if(F(o[af].swfVersion)&&!(M.wk&&M.wk<312)){w(Y,true);if(ab){aa.success=true;aa.ref=z(Y);ab(aa)}}else{if(o[af].expressInstall&&A()){var ai={};ai.data=o[af].expressInstall;ai.width=ae.getAttribute("width")||"0";ai.height=ae.getAttribute("height")||"0";if(ae.getAttribute("class")){ai.styleclass=ae.getAttribute("class")}if(ae.getAttribute("align")){ai.align=ae.getAttribute("align")}var ah={};var X=ae.getElementsByTagName("param");var ac=X.length;for(var ad=0;ad<ac;ad++){if(X[ad].getAttribute("name").toLowerCase()!="movie"){ah[X[ad].getAttribute("name")]=X[ad].getAttribute("value")}}P(ai,ah,Y,ab)}else{p(ae);if(ab){ab(aa)}}}}}else{w(Y,true);if(ab){var Z=z(Y);if(Z&&typeof Z.SetVariable!=D){aa.success=true;aa.ref=Z}ab(aa)}}}}}function z(aa){var X=null;var Y=c(aa);if(Y&&Y.nodeName=="OBJECT"){if(typeof Y.SetVariable!=D){X=Y}else{var Z=Y.getElementsByTagName(r)[0];if(Z){X=Z}}}return X}function A(){return !a&&F("6.0.65")&&(M.win||M.mac)&&!(M.wk&&M.wk<312)}function P(aa,ab,X,Z){a=true;E=Z||null;B={success:false,id:X};var ae=c(X);if(ae){if(ae.nodeName=="OBJECT"){l=g(ae);Q=null}else{l=ae;Q=X}aa.id=R;if(typeof aa.width==D||(!/%$/.test(aa.width)&&parseInt(aa.width,10)<310)){aa.width="310"}if(typeof aa.height==D||(!/%$/.test(aa.height)&&parseInt(aa.height,10)<137)){aa.height="137"}j.title=j.title.slice(0,47)+" - Flash Player Installation";var ad=M.ie&&M.win?"ActiveX":"PlugIn",ac="MMredirectURL="+encodeURI(O.location).toString().replace(/&/g,"%26")+"&MMplayerType="+ad+"&MMdoctitle="+j.title;if(typeof ab.flashvars!=D){ab.flashvars+="&"+ac}else{ab.flashvars=ac}if(M.ie&&M.win&&ae.readyState!=4){var Y=C("div");X+="SWFObjectNew";Y.setAttribute("id",X);ae.parentNode.insertBefore(Y,ae);ae.style.display="none";(function(){if(ae.readyState==4){ae.parentNode.removeChild(ae)}else{setTimeout(arguments.callee,10)}})()}u(aa,ab,X)}}function p(Y){if(M.ie&&M.win&&Y.readyState!=4){var X=C("div");Y.parentNode.insertBefore(X,Y);X.parentNode.replaceChild(g(Y),X);Y.style.display="none";(function(){if(Y.readyState==4){Y.parentNode.removeChild(Y)}else{setTimeout(arguments.callee,10)}})()}else{Y.parentNode.replaceChild(g(Y),Y)}}function g(ab){var aa=C("div");if(M.win&&M.ie){aa.innerHTML=ab.innerHTML}else{var Y=ab.getElementsByTagName(r)[0];if(Y){var ad=Y.childNodes;if(ad){var X=ad.length;for(var Z=0;Z<X;Z++){if(!(ad[Z].nodeType==1&&ad[Z].nodeName=="PARAM")&&!(ad[Z].nodeType==8)){aa.appendChild(ad[Z].cloneNode(true))}}}}}return aa}function u(ai,ag,Y){var X,aa=c(Y);if(M.wk&&M.wk<312){return X}if(aa){if(typeof ai.id==D){ai.id=Y}if(M.ie&&M.win){var ah="";for(var ae in ai){if(ai[ae]!=Object.prototype[ae]){if(ae.toLowerCase()=="data"){ag.movie=ai[ae]}else{if(ae.toLowerCase()=="styleclass"){ah+=' class="'+ai[ae]+'"'}else{if(ae.toLowerCase()!="classid"){ah+=" "+ae+'="'+ai[ae]+'"'}}}}}var af="";for(var ad in ag){if(ag[ad]!=Object.prototype[ad]){af+='<param name="'+ad+'" value="'+ag[ad]+'" />'}}aa.outerHTML='<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"'+ah+">"+af+"</object>";N[N.length]=ai.id;X=c(ai.id)}else{var Z=C(r);Z.setAttribute("type",q);for(var ac in ai){if(ai[ac]!=Object.prototype[ac]){if(ac.toLowerCase()=="styleclass"){Z.setAttribute("class",ai[ac])}else{if(ac.toLowerCase()!="classid"){Z.setAttribute(ac,ai[ac])}}}}for(var ab in ag){if(ag[ab]!=Object.prototype[ab]&&ab.toLowerCase()!="movie"){e(Z,ab,ag[ab])}}aa.parentNode.replaceChild(Z,aa);X=Z}}return X}function e(Z,X,Y){var aa=C("param");aa.setAttribute("name",X);aa.setAttribute("value",Y);Z.appendChild(aa)}function y(Y){var X=c(Y);if(X&&X.nodeName=="OBJECT"){if(M.ie&&M.win){X.style.display="none";(function(){if(X.readyState==4){b(Y)}else{setTimeout(arguments.callee,10)}})()}else{X.parentNode.removeChild(X)}}}function b(Z){var Y=c(Z);if(Y){for(var X in Y){if(typeof Y[X]=="function"){Y[X]=null}}Y.parentNode.removeChild(Y)}}function c(Z){var X=null;try{X=j.getElementById(Z)}catch(Y){}return X}function C(X){return j.createElement(X)}function i(Z,X,Y){Z.attachEvent(X,Y);I[I.length]=[Z,X,Y]}function F(Z){var Y=M.pv,X=Z.split(".");X[0]=parseInt(X[0],10);X[1]=parseInt(X[1],10)||0;X[2]=parseInt(X[2],10)||0;return(Y[0]>X[0]||(Y[0]==X[0]&&Y[1]>X[1])||(Y[0]==X[0]&&Y[1]==X[1]&&Y[2]>=X[2]))?true:false}function v(ac,Y,ad,ab){if(M.ie&&M.mac){return}var aa=j.getElementsByTagName("head")[0];if(!aa){return}var X=(ad&&typeof ad=="string")?ad:"screen";if(ab){n=null;G=null}if(!n||G!=X){var Z=C("style");Z.setAttribute("type","text/css");Z.setAttribute("media",X);n=aa.appendChild(Z);if(M.ie&&M.win&&typeof j.styleSheets!=D&&j.styleSheets.length>0){n=j.styleSheets[j.styleSheets.length-1]}G=X}if(M.ie&&M.win){if(n&&typeof n.addRule==r){n.addRule(ac,Y)}}else{if(n&&typeof j.createTextNode!=D){n.appendChild(j.createTextNode(ac+" {"+Y+"}"))}}}function w(Z,X){if(!m){return}var Y=X?"visible":"hidden";if(J&&c(Z)){c(Z).style.visibility=Y}else{v("#"+Z,"visibility:"+Y)}}function L(Y){var Z=/[\\\"<>\.;]/;var X=Z.exec(Y)!=null;return X&&typeof encodeURIComponent!=D?encodeURIComponent(Y):Y}var d=function(){if(M.ie&&M.win){window.attachEvent("onunload",function(){var ac=I.length;for(var ab=0;ab<ac;ab++){I[ab][0].detachEvent(I[ab][1],I[ab][2])}var Z=N.length;for(var aa=0;aa<Z;aa++){y(N[aa])}for(var Y in M){M[Y]=null}M=null;for(var X in swfobject){swfobject[X]=null}swfobject=null})}}();return{registerObject:function(ab,X,aa,Z){if(M.w3&&ab&&X){var Y={};Y.id=ab;Y.swfVersion=X;Y.expressInstall=aa;Y.callbackFn=Z;o[o.length]=Y;w(ab,false)}else{if(Z){Z({success:false,id:ab})}}},getObjectById:function(X){if(M.w3){return z(X)}},embedSWF:function(ab,ah,ae,ag,Y,aa,Z,ad,af,ac){var X={success:false,id:ah};if(M.w3&&!(M.wk&&M.wk<312)&&ab&&ah&&ae&&ag&&Y){w(ah,false);K(function(){ae+="";ag+="";var aj={};if(af&&typeof af===r){for(var al in af){aj[al]=af[al]}}aj.data=ab;aj.width=ae;aj.height=ag;var am={};if(ad&&typeof ad===r){for(var ak in ad){am[ak]=ad[ak]}}if(Z&&typeof Z===r){for(var ai in Z){if(typeof am.flashvars!=D){am.flashvars+="&"+ai+"="+Z[ai]}else{am.flashvars=ai+"="+Z[ai]}}}if(F(Y)){var an=u(aj,am,ah);if(aj.id==ah){w(ah,true)}X.success=true;X.ref=an}else{if(aa&&A()){aj.data=aa;P(aj,am,ah,ac);return}else{w(ah,true)}}if(ac){ac(X)}})}else{if(ac){ac(X)}}},switchOffAutoHideShow:function(){m=false},ua:M,getFlashPlayerVersion:function(){return{major:M.pv[0],minor:M.pv[1],release:M.pv[2]}},hasFlashPlayerVersion:F,createSWF:function(Z,Y,X){if(M.w3){return u(Z,Y,X)}else{return undefined}},showExpressInstall:function(Z,aa,X,Y){if(M.w3&&A()){P(Z,aa,X,Y)}},removeSWF:function(X){if(M.w3){y(X)}},createCSS:function(aa,Z,Y,X){if(M.w3){v(aa,Z,Y,X)}},addDomLoadEvent:K,addLoadEvent:s,getQueryParamValue:function(aa){var Z=j.location.search||j.location.hash;if(Z){if(/\?/.test(Z)){Z=Z.split("?")[1]}if(aa==null){return L(Z)}var Y=Z.split("&");for(var X=0;X<Y.length;X++){if(Y[X].substring(0,Y[X].indexOf("="))==aa){return L(Y[X].substring((Y[X].indexOf("=")+1)))}}}return""},expressInstallCallback:function(){if(a){var X=c(R);if(X&&l){X.parentNode.replaceChild(l,X);if(Q){w(Q,true);if(M.ie&&M.win){l.style.display="block"}}if(E){E(B)}}a=false}}}}();;
/*!
 * VideoPress JavaScript Loader 1.09
 *
 * Copyright 2011 Automattic Inc.
 * Licensed under GNU General Public License (GPL) Version 2 or later
 * http://www.gnu.org/licenses/gpl-2.0.html
 */

// jQuery.type() was introduced in 1.4.3, WP 3.0 has 1.4.2
// To maintain backwards compatibility, insert our own version if it doesn't exist
if ( typeof jQuery.type != 'function' ) {
    jQuery.extend({
        class2type: {},

        type: function( obj ) {
            return obj == null ?
                String( obj ) :
                jQuery.class2type[ toString.call(obj) ] || "object";
        }
    });

    jQuery.each("Boolean Number String Function Array Date RegExp Object".split(" "), function(i, name) {
        jQuery.class2type[ "[object " + name + "]" ] = name.toLowerCase();
    });

}

jQuery.extend({VideoPress: {
        error:{
            messages:{
                age:"You are of insufficient age to view this video.",
                error:"Unable to download and play video",
                flash:"Error loading Flash on your system",
                freedom:'You do not have sufficient <a href="http://www.gnu.org/philosophy/free-sw.html">Freedom levels</a> to view this video.',
                incompatible:'VideoPress requires either HTML5 video or <a href="http://www.adobe.com/go/getflashplayer">Adobe Flash Player 10</a> or above for playback.',
                incapable:"Your device is incapable of playing the requested video.",
                network:"A network error prevented video download and playback"
            }
        },
        support:{
            flash: function() {
                if ( typeof swfobject !== "undefined" && swfobject.hasFlashPlayerVersion( jQuery.VideoPress.video.flash.min_version ) ) {
                    return true;
                } else {
                    return false;
                }
            },
            html5Video: function(sourcetype) {
                var v = document.createElement("video");
                if ( !!v.canPlayType ) {
                    if ( jQuery.type(sourcetype)==="string" ) {
                        return !!v.canPlayType(sourcetype).replace(/no/,"");
                    }
                    return true;
                } else {
                    return false;
                }
            }
        },
        data:[],
        analytics:{
            wpcom:{
                base_uri:"//pixel.wp.com/v.gif?",
                params:function(guid, filetype) {
                    var data = jQuery.VideoPress.data[guid];
                    if ( !jQuery.isPlainObject(data) ) {
                        return;
                    }

                    var params = {blog:data.blog,post:data.post,page_url:top.document.URL};
                    if ( filetype==="mp4" && data.mp4 && data.mp4.size ) {
                        params.video_fmt = "fmt_" + data.mp4.size;
                    } else {
                        params.video_fmt = "fmt_std";
                    }
                    return params;
                },
                send:function(params) {
                    var beacon = new Image();
                    beacon.src = jQuery.VideoPress.analytics.wpcom.base_uri + jQuery.param(params);
                    beacon=null;
                }
            },
            ga:{
                is_active:function(){
                    if ( (typeof _gaq !== "undefined") && jQuery.type( _gaq )==="array" ) {
                        return true;
                    } else {
                        return false;
                    }
                }
            },
            /*comscore:{
			is_active()function(){
				if ( typeof COMSCORE !== "undefined" )
					return true;
			}
		}*/
            impression:function(guid) {
                var params = jQuery.VideoPress.analytics.wpcom.params( guid, "mp4" );
                if ( !jQuery.isPlainObject( params ) ) {
                    return;
                }
                params.video_impression = 1;
                jQuery.VideoPress.analytics.wpcom.send( params );
            },
            played:function(guid, filetype) {
                var params = jQuery.VideoPress.analytics.wpcom.params( guid, filetype );
                if ( !jQuery.isPlainObject( params ) ) {
                    return;
                }
                params.video_play = 1;
                jQuery.VideoPress.analytics.wpcom.send( params );

                if ( jQuery.VideoPress.analytics.ga.is_active() ) {
                    /* Google Analytics tracks unique events per visit.
				 * Unique video value omitted since two videos on the same page that are both played would only be recorded as one play event.
				 */
                    _gaq.push( ["_trackEvent", "Videos", "Play" ] );
                }
            },
            watched:function( guid, filetype, current_time, initial_time ) {
                if ( jQuery.VideoPress.data[guid].playback === undefined ) {
                    var start = 0;
                    if ( initial_time !== undefined && jQuery.type(initial_time)==="number" && initial_time > 0 ) {
                        if ( current_time > initial_time ) {
                            start = current_time - initial_time;
                        }
                    }
                    jQuery.VideoPress.data[guid].playback = { last_observed:current_time, time_elapsed:start };
                }
                var time_watched = current_time - jQuery.VideoPress.data[guid].playback.last_observed;
                if ( time_watched > 0 ) {
                    jQuery.VideoPress.data[guid].playback.time_elapsed += time_watched;
                    jQuery.VideoPress.data[guid].playback.last_observed = current_time;
                    if ( jQuery.VideoPress.data[guid].playback.time_elapsed > 15 ) {
                        var params = jQuery.VideoPress.analytics.wpcom.params( guid, filetype );
                        if ( !jQuery.isPlainObject( params ) ) {
                            return;
                        }
                        params.t = 15;
                        jQuery.VideoPress.analytics.wpcom.send( params );
                        jQuery.VideoPress.data[guid].playback.time_elapsed -= 15;
                    } else if ( current_time === jQuery.VideoPress.data[guid].duration ) {
                        jQuery.VideoPress.analytics.wpcom.send( params );
                        jQuery.VideoPress.data[guid].playback.time_elapsed = 0;
                        delete jQuery.VideoPress.data[guid].playback;
                    }
                }
            }
        },
        requirements:{
            isSufficientAge: function( container_el, min_age ) {
                var birthday = new Date( parseInt( jQuery( "select[name=year]", container_el ).val() ), parseInt( jQuery( "select[name=month]", container_el ).val() ), parseInt( jQuery( "select[name=day]", container_el ).val() ) );
                var allowed_age = new Date( Date.now() - (1000*60*60*24*365*min_age) );
                if ( birthday > allowed_age ) {
                    container_el.html( '<p class="error" style="color:#fff;font-weight:bold">' + jQuery.VideoPress.error.messages.age + "</p>");
                } else {
                    jQuery.VideoPress.video.play(container_el);
                }
            },
            allowedDomain: function (allowed_domains) {
                if ( jQuery.type(allowed_domains)==="array" ) {
                    if ( jQuery.inArray( top.document.location.hostname, allowed_domains )===-1 ) {
                        return false;
                    }
                }
                return true;
            }
        },
        video:{
            flash:{
                // Protocol and domain for player_uri and expressinstall set in video.play()
                player_uri: ( 'https:' == location.protocol ? 'https://v0.wordpress.com' : 'http://s0.videopress.com' ) + "/player.swf?v=1.04",
                min_version:"10.0.0",
                params:{wmode:"direct",quality:"autohigh",seamlesstabbing:"true",allowfullscreen:"true",allowscriptaccess:"always",overstretch:"true"},
                expressinstall: ( 'https:' == location.protocol ? 'https://v0.wordpress.com' : 'http://s0.videopress.com' ) + "/playerProductInstall.swf",
                embedCallback: function(event) {
                    if ( event.success===false ) {
                        jQuery("#" + event.id).html("<p>" + jQuery.VideoPress.error.messages.flash + "</p>");
                    }
                }
            },
            types:{mp4:'video/mp4; codecs="avc1.64001E, mp4a.40.2"',ogv:'video/ogg; codecs="theora, vorbis"'},
            canPlay:function () {
                if ( jQuery.VideoPress.support.flash() ) {
                    jQuery.VideoPress.video.playerSupport = "flash";
                } else if ( jQuery.VideoPress.support.html5Video() ) {
                    if ( jQuery.VideoPress.support.html5Video( jQuery.VideoPress.video.types.mp4 ) ) {
                        jQuery.VideoPress.video.playerSupport = "mp4";
                    } else if ( jQuery.VideoPress.support.html5Video( jQuery.VideoPress.video.types.ogv ) ) {
                        jQuery.VideoPress.video.playerSupport = "ogv";
                    } else {
                        jQuery.VideoPress.video.playerSupport = "html5";
                    }
                } else {
                    jQuery.VideoPress.video.playerSupport = "";
                }
            },
            prepare: function ( guid, config, count ) {
                var video = jQuery.VideoPress.data[guid][count];
                if ( config.container === undefined || jQuery.type(video)!=="object" ) {
                    return;
                }

                var width = 0;
                if ( config.width !== undefined ) {
                    width = config.width;
                } else {
                    config.container.width();
                }


                var height = 0;
                if ( config.height !== undefined ) {
                    height = config.height;
                } else {
                    config.container.height();
                }

                var div_id = "#v-" + guid + '-' + count;

                var parent_width = jQuery( div_id ).parent().width();
                var diffw = 0;
                var diffh = 0;
                var ratio = 0;
                if ( width > parent_width ) {
                    diffw = width - parent_width + 11;
                    ratio = ( width * 1.0 ) / ( height * 1.0 );
                    diffh = diffw / ratio;

                    width -= diffw;
                    height -= Math.round( diffh );
                }

                if ( width < 60 || height < 60 ) {
                    width = 400;
                    height = 300;
                }

                jQuery.VideoPress.data[guid][count].dimensions = {};

                if( 0 == ratio ) {
                    jQuery.VideoPress.data[guid][count].dimensions.width = width;
                    jQuery.VideoPress.data[guid][count].dimensions.height = height;
                }
                else {
                    jQuery.VideoPress.data[guid][count].dimensions.width = width - 7;
                    jQuery.VideoPress.data[guid][count].dimensions.height = height - Math.round( 7 / ratio );

                    jQuery( div_id ).width( width );
                    jQuery( div_id ).height( height + 50 );

                    jQuery( div_id + "-placeholder" ).width( jQuery.VideoPress.data[guid][count].dimensions.width );
                    jQuery( div_id + "-placeholder" ).height( jQuery.VideoPress.data[guid][count].dimensions.height );

                    jQuery( div_id + "-placeholder img.videopress-poster" ).width( jQuery.VideoPress.data[guid][count].dimensions.width );
                    jQuery( div_id + "-placeholder img.videopress-poster" ).height( jQuery.VideoPress.data[guid][count].dimensions.height );
                }

                config.container.data( "guid", guid );
                config.container.data( "count", count );
                if ( jQuery.VideoPress.video.playerSupport === undefined ) {
                    jQuery.VideoPress.video.canPlay();
                }

                if ( config.freedom===true && jQuery.type(video.ogv)==="string" ) {
                    jQuery.VideoPress.video.insert( config.container, guid, count, video, "ogv", jQuery.VideoPress.data[guid][count].dimensions.width, jQuery.VideoPress.data[guid].dimensions.height );
                    config.container.data( "player", "ogv" );
                } else if ( jQuery.VideoPress.video.playerSupport === "flash" ) {
                    config.container.data( "player", "flash" );
                    config.container.append( '<div id="v-' + guid + "-" + count + '-video">' );
                } else if ( jQuery.inArray( jQuery.VideoPress.video.playerSupport, ["html5","mp4","ogv"] ) && ( jQuery.type(video.mp4.uri)==="string" || jQuery.type(video.ogv.uri)==="string" ) ) {
                    var load_type = "html5";
                    if ( jQuery.VideoPress.video.playerSupport==="mp4" && video.mp4!==undefined && jQuery.type(video.mp4.uri)==="string" ) {
                        load_type = "mp4";
                    } else if ( jQuery.VideoPress.video.playerSupport==="ogv" && video.ogv!==undefined && jQuery.type(video.ogv.uri)==="string" ) {
                        load_type = "ogv";
                    }
                    jQuery.VideoPress.video.insert( config.container, guid, count, video, load_type, jQuery.VideoPress.data[guid][count].dimensions.width, jQuery.VideoPress.data[guid][count].dimensions.height );
                    config.container.data( "player", load_type );
                    load_type=null;
                } else {
                    config.container.html('<p class="videopress-error">' + jQuery.VideoPress.error.messages.incompatible + '</p>');
                    return false;
                }
                return true;
            },
            insert: function( container_el, guid, count, video_data, video_type, width, height ) {
                var video_id = "v-" + guid + "-" + count + "-video";
                var video_el = jQuery("<video />");
                video_el.attr( "id", video_id );
                video_el.attr( "width", width );
                video_el.attr( "height", height );
                video_el.attr( "poster", video_data.poster );
                if ( video_type==="ogv" ) {
                    video_el.attr( "preload", "metadata" );
                } else {
                    video_el.attr( "preload", "none" );
                }
                video_el.attr( "controls", "true" );
                video_el.attr( "x-webkit-airplay", "allow" );
                if ( video_type==="mp4" && video_data.mp4!==undefined && jQuery.type(video_data.mp4.uri)==="string" ) {
                    video_el.attr( "src", video_data.mp4.uri );
                } else if ( video_type==="ogv" && video_data.ogv!==undefined && jQuery.type(video_data.ogv.uri)==="string" ) {
                    video_el.attr( "src", video_data.ogv.uri );
                } else {
                    // Purposely omit source type attribute since the browser does not seem to support specifics such as canPlayType
                    if ( video_data.mp4!==undefined && jQuery.type(video_data.mp4.uri)==="string" ) {
                        video_el.append( '<source src="' + video_data.mp4.uri + '" />' );
                    }
                    if ( video_data.ogv!==undefined && jQuery.type(video_data.ogv.uri)==="string" ) {
                        video_el.append( '<source src="' + video_data.ogv.uri + '" />' );
                    }
                }

                if ( video_data.tracks !== undefined ) {
                    video_el.append( video_data.tracks );
                }
                video_el.append( '<p class="videopress-error">' + jQuery.VideoPress.error.messages.incompatible + "</p>" );
                video_el.hide();
                container_el.append( video_el );
                video_el=null;
                video_id=null;
            },
            play: function( container_el ) {
                var player = container_el.data( "player" );
                if ( player===undefined ) {
                    player="flash";
                }

                var guid = container_el.data( "guid" );
                var count = container_el.data( "count" );

                if ( player === "flash" ) {
                    jQuery( "#" + container_el.attr("id") + "-placeholder", container_el ).remove();

                    var player_uri = jQuery.VideoPress.video.flash.player_uri;
                    var expressinstall = jQuery.VideoPress.video.flash.expressinstall;

                    swfobject.embedSWF( player_uri, "v-" + guid + "-" + count + "-video", jQuery.VideoPress.data[guid][count].dimensions.width, jQuery.VideoPress.data[guid][count].dimensions.height, jQuery.VideoPress.video.flash.min_version, expressinstall, {guid:guid,autoPlay:"true",isDynamicSeeking:"true",hd:jQuery.VideoPress.data[guid][count].hd}, jQuery.VideoPress.video.flash.params, null, jQuery.VideoPress.video.flash.embedCallback );
                } else if ( jQuery.inArray( player, ["html5", "mp4", "ogv"] ) ) {
                    var video_el = jQuery("video", container_el);
                    if ( video_el ) {
                        jQuery( "#" + container_el.attr("id") + "-placeholder", container_el ).remove();
                        if ( player==="html5" ) {
                            player = "mp4";
                        }
                        jQuery.VideoPress.video.playHTML5( video_el, guid, player );
                    }
                } else {
                    jQuery( "#" + container_el.attr("id") + "-placeholder", container_el ).remove();
                    container_el.append( '<p class="videopress-error">Unable to play video. No suitable player.</p>' );
                }

                var play_event = new CustomEvent( 'videopress_play_video', { 'detail': { 'video_id': guid } } );
                window.dispatchEvent( play_event );
            },
            playHTML5: function( video_el, guid, filetype ) {
                video_el.show();
                video_el[0].load();

                /* It seems load() sometimes does not work, but play() will trigger load.
			 * Tried attaching play() to a data event but data might not load
			 * So we trigger play() even if there is not enough data loaded to begin playback
			 */
                video_el[0].play();
                jQuery.VideoPress.analytics.played(guid, filetype);
                video_el.bind( "error stalled", function(e) {
                    var message = jQuery.VideoPress.error.messages.error;
                    try {
                        // provide a more detailed error message if a failure reason is communicated
                        switch (e.target.error.code) {
                            case e.target.error.MEDIA_ERR_NETWORK:
                                message = jQuery.VideoPress.error.messages.network;
                                break;
                            case e.target.error.MEDIA_ERR_DECODE:
                            case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                                message = jQuery.VideoPress.error.messages.incapable + " " + filetype.toUpperCase() + ".";
                                break;
                            default:
                                break;
                        }
                    } catch( err ){}
                    // provide an opportunity to silence an error with an empty string
                    if ( message.length > 0 ) {
                        video_el.html( '<p class="videopress-error">' + message + "</p>" );
                    }
                    message=null;
                } );
                video_el.bind( "durationchange", {guid:guid}, function( event ) {
                    var duration = jQuery(event.target).attr("duration");
                    if ( jQuery.type(duration)==="number" ) {
                        jQuery.VideoPress.data[event.data.guid].duration = duration;
                    }
                    duration=null;
                } );

                /* Only record stats after video data has loaded
			 * If html5 video seems to work but we could not match on a specific codec descriptor then there may be multiple source elements. Browser chooses a source at runtime in source order. We check the loaded video filetype instead of assuming MP4.
			 */
                video_el.one( "loadeddata", {guid:guid, filetype:filetype}, function( event ){
                    var filetype = event.data.filetype;
                    var loaded_file = jQuery(event.target).attr("currentSrc");
                    if ( jQuery.type(loaded_file)==="string" && loaded_file.length > 3 ) {
                        var ext = loaded_file.substr( loaded_file.lastIndexOf(".") + 1 ).toLowerCase();
                        if ( jQuery.inArray( ext, ["mp4","ogv"] ) ) {
                            filetype = ext;
                        }
                        ext=null;
                    }
                    video_el.bind( "play", {guid:event.data.guid,filetype:filetype}, function( event ) {
                        jQuery.VideoPress.analytics.played(event.data.guid, event.data.filetype);
                    } );
                    video_el.bind( "timeupdate", {guid:event.data.guid,filetype:filetype}, function( event ) {
                        var target = jQuery(event.target);
                        jQuery.VideoPress.analytics.watched( event.data.guid, event.data.filetype, target.attr("currentTime"), target.attr("initialTime") );
                        target=null;
                    } );
                    video_el.bind( "ended", {guid:event.data.guid,filetype:filetype}, function( event ) {
                        jQuery.VideoPress.analytics.watched( event.data.guid, event.data.filetype, jQuery.VideoPress.data[guid].duration, jQuery(event.target).attr("initialTime") );
                    } );
                } );
            }
        }
    }});
;
/* jshint sub: true, onevar: false, multistr: true, devel: true, smarttabs: true */
/* global jetpackCarouselStrings, DocumentTouch */

// @start-hide-in-jetpack
if (typeof wpcom === 'undefined') {
    var wpcom = {};
}
wpcom.carousel = (function(/*$*/) {
    var prebuilt_widths = jetpackCarouselStrings.widths;
    var pageviews_stats_args = jetpackCarouselStrings.stats_query_args;

    var findFirstLargeEnoughWidth = function(original_w, original_h, dest_w, dest_h) {
        var inverse_ratio = original_h / original_w;

        for ( var i = 0; i < prebuilt_widths.length; ++i ) {
            if ( prebuilt_widths[i] >= dest_w || prebuilt_widths[i] * inverse_ratio >= dest_h ) {
                return prebuilt_widths[i];
            }
        }

        return original_w;
    };

    var addWidthToImageURL = function(url, width) {
        width = parseInt(width, 10);
        // Give devices with a higher devicePixelRatio higher-res images (Retina display = 2, Android phones = 1.5, etc)
        if ('undefined' !== typeof window.devicePixelRatio && window.devicePixelRatio > 1) {
            width = Math.round( width * window.devicePixelRatio );
        }
        url = addArgToURL(url, 'w', width);
        url = addArgToURL(url, 'h', '');
        return url;
    };

    var addArgToURL = function(url, arg, value) {
        var re = new RegExp(arg+'=[^?&]+');
        if ( url.match(re) ) {
            return url.replace(re, arg + '=' + value);
        } else {
            var divider = url.indexOf('?') !== -1 ? '&' : '?';
            return url + divider + arg + '=' + value;
        }
    };

    var stat = function ( names ) {
        if ( typeof names !== 'string' ) {
            names = names.join( ',' );
        }

        new Image().src = window.location.protocol +
            '//pixel.wp.com/g.gif?v=wpcom-no-pv' +
            '&x_carousel=' + names +
            '&baba=' + Math.random();
    };

    var pageview = function ( post_id ) {
        new Image().src = window.location.protocol +
            '//pixel.wp.com/g.gif?host=' + encodeURIComponent( window.location.host ) +
            '&ref=' + encodeURIComponent( document.referrer ) +
            '&rand=' + Math.random() +
            '&' + pageviews_stats_args +
            '&post=' + encodeURIComponent( post_id );
    };


    return {
        findFirstLargeEnoughWidth: findFirstLargeEnoughWidth,
        addWidthToImageURL: addWidthToImageURL,
        stat: stat,
        pageview: pageview
    };

})(jQuery);
// @end-hide-in-jetpack

jQuery(document).ready(function($) {

    // gallery faded layer and container elements
    var overlay, comments, gallery, container, nextButton, previousButton, info, transitionBegin,
        caption, resizeTimeout, photo_info, close_hint, commentInterval, lastSelectedSlide,
        screenPadding = 110, originalOverflow = $('body').css('overflow'), originalHOverflow = $('html').css('overflow'), proportion = 85,
        last_known_location_hash = '', imageMeta, titleAndDescription, commentForm, leftColWrapper, scrollPos;

    if ( window.innerWidth <= 760 ) {
        screenPadding = Math.round( ( window.innerWidth / 760 ) * 110 );

        if ( screenPadding < 40 && ( ( 'ontouchstart' in window ) || window.DocumentTouch && document instanceof DocumentTouch ) ) {
            screenPadding = 0;
        }
    }

    // Adding a polyfill for browsers that do not have Date.now
    if ( 'undefined' === typeof Date.now ) {
        Date.now = function now() {
            return new Date().getTime();
        };
    }

    var keyListener = function(e){
        switch(e.which){
            case 38: // up
                e.preventDefault();
                container.scrollTop(container.scrollTop() - 100);
                break;
            case 40: // down
                e.preventDefault();
                container.scrollTop(container.scrollTop() + 100);
                break;
            case 39: // right
                e.preventDefault();
                gallery.jp_carousel('next');
                break;
            case 37: // left
            case 8: // backspace
                e.preventDefault();
                gallery.jp_carousel('previous');
                break;
            case 27: // escape
                e.preventDefault();
                container.jp_carousel('close');
                break;
            default:
                // making jslint happy
                break;
        }
    };

    var resizeListener = function(/*e*/){
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function(){
            gallery
                .jp_carousel('slides')
                .jp_carousel('fitSlide', true);
            gallery.jp_carousel('updateSlidePositions', true);
            gallery.jp_carousel('fitMeta', true);
        }, 200);
    };

    var prepareGallery = function( /*dataCarouselExtra*/ ){
        if (!overlay) {
            overlay = $('<div></div>')
                .addClass('jp-carousel-overlay')
                .css({
                    'position' : 'absolute',
                    'top'      : 0,
                    'right'    : 0,
                    'bottom'   : 0,
                    'left'     : 0
                });

            var buttons  = '<a class="jp-carousel-commentlink" href="#">' + jetpackCarouselStrings.comment + '</a>';
            if ( 1 === Number( jetpackCarouselStrings.is_logged_in ) ) {
// @start-hide-in-jetpack
                if ( 1 === Number( jetpackCarouselStrings.is_public && 1 === Number( jetpackCarouselStrings.reblog_enabled ) ) ) {
                    buttons += '<a class="jp-carousel-reblog" href="#">' + jetpackCarouselStrings.reblog + '</a>';
                }
// @end-hide-in-jetpack
            }

            buttons  = $('<div class="jp-carousel-buttons">' + buttons + '</div>');

            caption    = $('<h2 itemprop="caption description"></h2>');
            photo_info = $('<div class="jp-carousel-photo-info"></div>').append(caption);

            imageMeta = $('<div></div>')
                .addClass('jp-carousel-image-meta')
                .css({
                    'float'      : 'right',
                    'margin-top' : '20px',
                    'width'      :  '250px'
                });

            imageMeta
                .append( buttons )
                .append( '<ul class=\'jp-carousel-image-exif\' style=\'display:none;\'></ul>' )
                .append( '<a class=\'jp-carousel-image-download\' style=\'display:none;\'></a>' )
                .append( '<div class=\'jp-carousel-image-map\' style=\'display:none;\'></div>' );

            titleAndDescription = $('<div></div>')
                .addClass('jp-carousel-titleanddesc')
                .css({
                    'width'      : '100%',
                    'margin-top' : imageMeta.css('margin-top')
                });

            var commentFormMarkup = '<div id="jp-carousel-comment-form-container">';

            if ( jetpackCarouselStrings.local_comments_commenting_as && jetpackCarouselStrings.local_comments_commenting_as.length ) {
                // Comments not enabled, fallback to local comments

                if ( 1 !== Number( jetpackCarouselStrings.is_logged_in ) && 1 === Number( jetpackCarouselStrings.comment_registration ) ) {
                    commentFormMarkup += '<div id="jp-carousel-comment-form-commenting-as">' + jetpackCarouselStrings.local_comments_commenting_as + '</div>';
                } else {
                    commentFormMarkup += '<form id="jp-carousel-comment-form">';
                    commentFormMarkup += '<textarea name="comment" class="jp-carousel-comment-form-field jp-carousel-comment-form-textarea" id="jp-carousel-comment-form-comment-field" placeholder="' + jetpackCarouselStrings.write_comment + '"></textarea>';
                    commentFormMarkup += '<div id="jp-carousel-comment-form-submit-and-info-wrapper">';
                    commentFormMarkup += '<div id="jp-carousel-comment-form-commenting-as">' + jetpackCarouselStrings.local_comments_commenting_as + '</div>';
                    commentFormMarkup += '<input type="submit" name="submit" class="jp-carousel-comment-form-button" id="jp-carousel-comment-form-button-submit" value="'+jetpackCarouselStrings.post_comment+'" />';
                    commentFormMarkup += '<span id="jp-carousel-comment-form-spinner">&nbsp;</span>';
                    commentFormMarkup += '<div id="jp-carousel-comment-post-results"></div>';
                    commentFormMarkup += '</div>';
                    commentFormMarkup += '</form>';
                }
            }
            commentFormMarkup += '</div>';

            commentForm = $(commentFormMarkup)
                .css({
                    'width'      : '100%',
                    'margin-top' : '20px',
                    'color'      : '#999'
                });

            comments = $('<div></div>')
                .addClass('jp-carousel-comments')
                .css({
                    'width'      : '100%',
                    'bottom'     : '10px',
                    'margin-top' : '20px'
                });

            var commentsLoading = $('<div id="jp-carousel-comments-loading"><span>'+jetpackCarouselStrings.loading_comments+'</span></div>')
                .css({
                    'width'      : '100%',
                    'bottom'     : '10px',
                    'margin-top' : '20px'
                });

            var leftWidth = ( $(window).width() - ( screenPadding * 2 ) ) - (imageMeta.width() + 40);
            leftWidth += 'px';

            leftColWrapper = $('<div></div>')
                .addClass('jp-carousel-left-column-wrapper')
                .css({
                    'width' : Math.floor( leftWidth )
                })
                .append(titleAndDescription)
                .append(commentForm)
                .append(comments)
                .append(commentsLoading);

            var fadeaway = $('<div></div>')
                .addClass('jp-carousel-fadeaway');

            info = $('<div></div>')
                .addClass('jp-carousel-info')
                .css({
                    'top'   : Math.floor( ($(window).height() / 100) * proportion ),
                    'left'  : screenPadding,
                    'right' : screenPadding
                })
                .append(photo_info)
                .append(imageMeta);

            if ( window.innerWidth <= 760 ) {
                photo_info.remove().insertAfter( titleAndDescription );
                info.prepend( leftColWrapper );
            }
            else {
                info.append( leftColWrapper );
            }

            var targetBottomPos = ( $(window).height() - parseInt( info.css('top'), 10 ) ) + 'px';

            nextButton = $('<div><span></span></div>')
                .addClass('jp-carousel-next-button')
                .css({
                    'right'    : '15px'
                })
                .hide();

            previousButton = $('<div><span></span></div>')
                .addClass('jp-carousel-previous-button')
                .css({
                    'left'     : 0
                })
                .hide();

            nextButton.add( previousButton ).css( {
                'position' : 'fixed',
                'top' : '40px',
                'bottom' : targetBottomPos,
                'width' : screenPadding
            } );

            gallery = $('<div></div>')
                .addClass('jp-carousel')
                .css({
                    'position' : 'absolute',
                    'top'      : 0,
                    'bottom'   : targetBottomPos,
                    'left'     : 0,
                    'right'    : 0
                });

            close_hint = $('<div class="jp-carousel-close-hint"><span>&times;</span></div>')
                .css({
                    position : 'fixed'
                });

            container = $('<div></div>')
                .addClass('jp-carousel-wrap')
                .addClass( 'jp-carousel-transitions' );
            if ( 'white' === jetpackCarouselStrings.background_color ) {
                container.addClass('jp-carousel-light');
            }

            container.attr('itemscope', '');

            container.attr('itemtype', 'https://schema.org/ImageGallery');

            container.css({
                'position'   : 'fixed',
                'top'        : 0,
                'right'      : 0,
                'bottom'     : 0,
                'left'       : 0,
                'z-index'    : 2147483647,
                'overflow-x' : 'hidden',
                'overflow-y' : 'auto',
                'direction'  : 'ltr'
            })
                .hide()
                .append(overlay)
                .append(gallery)
                .append(fadeaway)
                .append(info)
                .append(nextButton)
                .append(previousButton)
                .append(close_hint)
                .appendTo($('body'))
                .click(function(e){
                    var target = $(e.target), wrap = target.parents('div.jp-carousel-wrap'), data = wrap.data('carousel-extra'),
                        slide = wrap.find('div.selected'), attachment_id = slide.data('attachment-id');
                    data = data || [];

                    if ( target.is(gallery) || target.parents().add(target).is(close_hint) ) {
                        container.jp_carousel('close');
// @start-hide-in-jetpack
                    } else if ( target.hasClass('jp-carousel-reblog') ) {
                        e.preventDefault();
                        e.stopPropagation();
                        if ( !target.hasClass('reblogged') ) {
                            target.jp_carousel('show_reblog_box');
                            wpcom.carousel.stat('reblog_show_box');
                        }
                    } else if ( target.parents('#carousel-reblog-box').length ) {
                        if ( target.is('a.cancel') ) {
                            e.preventDefault();
                            e.stopPropagation();
                            target.jp_carousel('hide_reblog_box');
                            wpcom.carousel.stat('reblog_cancel');
                        } else if ( target.is( 'input[type="submit"]' ) ) {
                            e.preventDefault();
                            e.stopPropagation();

                            var note = $('#carousel-reblog-box textarea').val();
                            if ( jetpackCarouselStrings.reblog_add_thoughts === note ) {
                                note = '';
                            }

                            $('#carousel-reblog-submit').val( jetpackCarouselStrings.reblogging );
                            $('#carousel-reblog-submit').prop('disabled', true);
                            $( '#carousel-reblog-box div.submit span.canceltext' ).spin( 'small' );

                            $.post( jetpackCarouselStrings.ajaxurl, {
                                    'action': 'post_reblog',
                                    'reblog_source': 'carousel',
                                    'original_blog_id': $('#carousel-reblog-box input#carousel-reblog-blog-id').val(),
                                    'original_post_id': $('.jp-carousel div.selected').data('attachment-id'),
                                    'blog_id': $('#carousel-reblog-box select').val(),
                                    'blog_url': $('#carousel-reblog-box input#carousel-reblog-blog-url').val(),
                                    'blog_title': $('#carousel-reblog-box input#carousel-reblog-blog-title').val(),
                                    'post_url': $('#carousel-reblog-box input#carousel-reblog-post-url').val(),
                                    'post_title': slide.data( 'caption' ) || $('#carousel-reblog-box input#carousel-reblog-post-title').val(),
                                    'note': note,
                                    '_wpnonce': $('#carousel-reblog-box #_wpnonce').val()
                                },
                                function(/*result*/) {
                                    $('#carousel-reblog-box').css({ 'height': $('#carousel-reblog-box').height() + 'px' }).slideUp('fast');
                                    $('a.jp-carousel-reblog').html( jetpackCarouselStrings.reblogged ).removeClass( 'reblog' ).addClass( 'reblogged' );
                                    $( '#carousel-reblog-box div.submit span.canceltext' ).spin( false );
                                    $('#carousel-reblog-submit').val( jetpackCarouselStrings.post_reblog );
                                    $('div.jp-carousel-info').children().not('#carousel-reblog-box').fadeIn('fast');
                                    slide.data('reblogged', 1);
                                    $('div.gallery').find('img[data-attachment-id="' + slide.data('attachment-id') + '"]').data('reblogged', 1);


                                }, 'json' );
                            wpcom.carousel.stat('reblog_submit');
                        }
                    } else if ( target.hasClass( 'jp-carousel-image-download' ) ) {
                        wpcom.carousel.stat( 'download_original_click' );
// @end-hide-in-jetpack
                    } else if ( target.hasClass('jp-carousel-commentlink') ) {
                        e.preventDefault();
                        e.stopPropagation();
                        $(window).unbind('keydown', keyListener);
                        container.animate({scrollTop: parseInt(info.position()['top'], 10)}, 'fast');
                        $('#jp-carousel-comment-form-submit-and-info-wrapper').slideDown('fast');
                        $('#jp-carousel-comment-form-comment-field').focus();
                    } else if ( target.hasClass('jp-carousel-comment-login') ) {
                        var url = jetpackCarouselStrings.login_url + '%23jp-carousel-' + attachment_id;

                        window.location.href = url;
                    } else if ( target.parents('#jp-carousel-comment-form-container').length ) {
                        var textarea = $('#jp-carousel-comment-form-comment-field')
                            .blur(function(){
                                $(window).bind('keydown', keyListener);
                            })
                            .focus(function(){
                                $(window).unbind('keydown', keyListener);
                            });

                        var emailField = $('#jp-carousel-comment-form-email-field')
                            .blur(function(){
                                $(window).bind('keydown', keyListener);
                            })
                            .focus(function(){
                                $(window).unbind('keydown', keyListener);
                            });

                        var authorField = $('#jp-carousel-comment-form-author-field')
                            .blur(function(){
                                $(window).bind('keydown', keyListener);
                            })
                            .focus(function(){
                                $(window).unbind('keydown', keyListener);
                            });

                        var urlField = $('#jp-carousel-comment-form-url-field')
                            .blur(function(){
                                $(window).bind('keydown', keyListener);
                            })
                            .focus(function(){
                                $(window).unbind('keydown', keyListener);
                            });

                        if ( textarea && textarea.attr('id') === target.attr('id')) {
                            // For first page load
                            $(window).unbind('keydown', keyListener);
                            $('#jp-carousel-comment-form-submit-and-info-wrapper').slideDown('fast');
                        } else if ( target.is( 'input[type="submit"]' ) ) {
                            e.preventDefault();
                            e.stopPropagation();

                            $('#jp-carousel-comment-form-spinner').spin('small', 'white');

                            var ajaxData = {
                                action: 'post_attachment_comment',
                                nonce:   jetpackCarouselStrings.nonce,
                                blog_id: data['blog_id'],
                                id:      attachment_id,
                                comment: textarea.val()
                            };

                            if ( ! ajaxData['comment'].length ) {
                                gallery.jp_carousel('postCommentError', {'field': 'jp-carousel-comment-form-comment-field', 'error': jetpackCarouselStrings.no_comment_text});
                                return;
                            }

                            if ( 1 !== Number( jetpackCarouselStrings.is_logged_in ) ) {
                                ajaxData['email']  = emailField.val();
                                ajaxData['author'] = authorField.val();
                                ajaxData['url']    = urlField.val();

                                if ( 1 === Number( jetpackCarouselStrings.require_name_email ) ) {
                                    if ( ! ajaxData['email'].length || ! ajaxData['email'].match('@') ) {
                                        gallery.jp_carousel('postCommentError', {'field': 'jp-carousel-comment-form-email-field', 'error': jetpackCarouselStrings.no_comment_email});
                                        return;
                                    } else if ( ! ajaxData['author'].length ) {
                                        gallery.jp_carousel('postCommentError', {'field': 'jp-carousel-comment-form-author-field', 'error': jetpackCarouselStrings.no_comment_author});
                                        return;
                                    }
                                }
                            }

                            $.ajax({
                                type:       'POST',
                                url:        jetpackCarouselStrings.ajaxurl,
                                data:       ajaxData,
                                dataType:   'json',
                                success: function(response/*, status, xhr*/) {
                                    if ( 'approved' === response.comment_status ) {
                                        $('#jp-carousel-comment-post-results').slideUp('fast').html('<span class="jp-carousel-comment-post-success">' + jetpackCarouselStrings.comment_approved + '</span>').slideDown('fast');
                                    } else if ( 'unapproved' === response.comment_status ) {
                                        $('#jp-carousel-comment-post-results').slideUp('fast').html('<span class="jp-carousel-comment-post-success">' + jetpackCarouselStrings.comment_unapproved + '</span>').slideDown('fast');
                                    } else {
                                        // 'deleted', 'spam', false
                                        $('#jp-carousel-comment-post-results').slideUp('fast').html('<span class="jp-carousel-comment-post-error">' + jetpackCarouselStrings.comment_post_error + '</span>').slideDown('fast');
                                    }
                                    gallery.jp_carousel('clearCommentTextAreaValue');
                                    gallery.jp_carousel('getComments', {attachment_id: attachment_id, offset: 0, clear: true});
                                    $('#jp-carousel-comment-form-button-submit').val(jetpackCarouselStrings.post_comment);
                                    $('#jp-carousel-comment-form-spinner').spin(false);
                                },
                                error: function(/*xhr, status, error*/) {
                                    // TODO: Add error handling and display here
                                    gallery.jp_carousel('postCommentError', {'field': 'jp-carousel-comment-form-comment-field', 'error': jetpackCarouselStrings.comment_post_error});
                                    return;
                                }
                            });
                        }
                    } else if ( ! target.parents( '.jp-carousel-info' ).length ) {
                        container.jp_carousel('next');
                    }
                })
                .bind('jp_carousel.afterOpen', function(){
                    $(window).bind('keydown', keyListener);
                    $(window).bind('resize', resizeListener);
                    gallery.opened = true;

                    resizeListener();
                })
                .bind('jp_carousel.beforeClose', function(){
                    var scroll = $(window).scrollTop();

                    $(window).unbind('keydown', keyListener);
                    $(window).unbind('resize', resizeListener);
                    $(window).scrollTop(scroll);
                    $( '.jp-carousel-previous-button' ).hide();
                    $( '.jp-carousel-next-button' ).hide();
                    gallery.jp_carousel( 'hide_reblog_box' ); // @hide-in-jetpack
                })
                .bind('jp_carousel.afterClose', function(){
                    if ( window.location.hash && history.back ) {
                        history.back();
                    }
                    last_known_location_hash = '';
                    gallery.opened = false;
                })
                .on( 'transitionend.jp-carousel ', '.jp-carousel-slide', function ( e ) {
                    // If the movement transitions take more than twice the allotted time, disable them.
                    // There is some wiggle room in the 2x, since some of that time is taken up in
                    // JavaScript, setting up the transition and calling the events.
                    if ( 'transform' === e.originalEvent.propertyName ) {
                        var transitionMultiplier = ( ( Date.now() - transitionBegin ) / 1000 ) / e.originalEvent.elapsedTime;

                        container.off( 'transitionend.jp-carousel' );

                        if ( transitionMultiplier >= 2 ) {
                            $( '.jp-carousel-transitions' ).removeClass( 'jp-carousel-transitions' );
                        }
                    }
                } );

            $( '.jp-carousel-wrap' ).touchwipe( {
                wipeLeft : function ( e ) {
                    e.preventDefault();
                    gallery.jp_carousel( 'next' );
                },
                wipeRight : function ( e ) {
                    e.preventDefault();
                    gallery.jp_carousel( 'previous' );
                },
                preventDefaultEvents : false
            } );

            nextButton.add(previousButton).click(function(e){
                e.preventDefault();
                e.stopPropagation();
                if ( nextButton.is(this) ) {
                    gallery.jp_carousel('next');
                } else {
                    gallery.jp_carousel('previous');
                }
            });
        }
    };

    var processSingleImageGallery = function() {
        // process links that contain img tag with attribute data-attachment-id
        $( 'a img[data-attachment-id]' ).each(function() {
            var container = $( this ).parent();

            // skip if image was already added to gallery by shortcode
            if( container.parent( '.gallery-icon' ).length ) {
                return;
            }

            // skip if the container is not a link
            if ( 'undefined' === typeof( $( container ).attr( 'href' ) ) ) {
                return;
            }

            var valid = false;

            // if link points to 'Media File' (ignoring GET parameters) and flag is set allow it
            if ( $( container ).attr( 'href' ).split( '?' )[0] === $( this ).attr( 'data-orig-file' ).split( '?' )[0] &&
                1 === Number( jetpackCarouselStrings.single_image_gallery_media_file )
            ) {
                valid = true;
            }

            // if link points to 'Attachment Page' allow it
            if( $( container ).attr( 'href' ) === $( this ).attr( 'data-permalink' ) ) {
                valid = true;
            }

            // links to 'Custom URL' or 'Media File' when flag not set are not valid
            if( ! valid ) {
                return;
            }

            // make this node a gallery recognizable by event listener above
            $( container ).addClass( 'single-image-gallery' ) ;
            // blog_id is needed to allow posting comments to correct blog
            $( container ).data( 'carousel-extra', { blog_id: Number( jetpackCarouselStrings.blog_id ) } );
        });
    };

    var methods = {
        testForData: function(gallery) {
            gallery = $( gallery ); // make sure we have it as a jQuery object.
            return !( ! gallery.length || ! gallery.data( 'carousel-extra' ) );
        },

        testIfOpened: function() {
            return !!( 'undefined' !== typeof(gallery) && 'undefined' !== typeof(gallery.opened) && gallery.opened );
        },

        openOrSelectSlide: function( index ) {
            // The `open` method triggers an asynchronous effect, so we will get an
            // error if we try to use `open` then `selectSlideAtIndex` immediately
            // after it. We can only use `selectSlideAtIndex` if the carousel is
            // already open.
            if ( ! $( this ).jp_carousel( 'testIfOpened' ) ) {
                // The `open` method selects the correct slide during the
                // initialization.
                $( this ).jp_carousel( 'open', { start_index: index } );
            } else {
                gallery.jp_carousel( 'selectSlideAtIndex', index );
            }
        },

        open: function(options) {
            var settings = {
                    'items_selector' : '.gallery-item [data-attachment-id], .tiled-gallery-item [data-attachment-id], img[data-attachment-id]',
                    'start_index': 0
                },
                data = $(this).data('carousel-extra');

            if ( !data ) {
                return; // don't run if the default gallery functions weren't used
            }

            prepareGallery( data );

            if ( gallery.jp_carousel( 'testIfOpened' ) ) {
                return; // don't open if already opened
            }

            // make sure to stop the page from scrolling behind the carousel overlay, so we don't trigger
            // infiniscroll for it when enabled (Reader, theme infiniscroll, etc).
            originalOverflow = $('body').css('overflow');
            $('body').css('overflow', 'hidden');
            // prevent html from overflowing on some of the new themes.
            originalHOverflow = $('html').css('overflow');
            $('html').css('overflow', 'hidden');
            scrollPos = $( window ).scrollTop();

            container.data('carousel-extra', data);
// @start-hide-in-jetpack
            wpcom.carousel.stat( ['open', 'view_image'] );
// @end-hide-in-jetpack

            return this.each(function() {
                // If options exist, lets merge them
                // with our default settings
                var $this = $(this);

                if ( options ) {
                    $.extend( settings, options );
                }
                if ( -1 === settings.start_index ) {
                    settings.start_index = 0; //-1 returned if can't find index, so start from beginning
                }

                container.trigger('jp_carousel.beforeOpen').fadeIn('fast',function(){
                    container.trigger('jp_carousel.afterOpen');
                    gallery
                        .jp_carousel('initSlides', $this.find(settings.items_selector), settings.start_index)
                        .jp_carousel('selectSlideAtIndex', settings.start_index);
                });
                gallery.html('');
            });
        },

        selectSlideAtIndex : function(index){
            var slides = this.jp_carousel('slides'), selected = slides.eq(index);

            if ( 0 === selected.length ) {
                selected = slides.eq(0);
            }

            gallery.jp_carousel('selectSlide', selected, false);
            return this;
        },

        close : function(){
            // make sure to let the page scroll again
            $('body').css('overflow', originalOverflow);
            $('html').css('overflow', originalHOverflow);
            this.jp_carousel( 'clearCommentTextAreaValue' );
            return container
                .trigger('jp_carousel.beforeClose')
                .fadeOut('fast', function(){
                    container.trigger('jp_carousel.afterClose');
                    $( window ).scrollTop( scrollPos );
                });

        },

        next : function() {
            this.jp_carousel( 'previousOrNext', 'nextSlide' );
            gallery.jp_carousel( 'hide_reblog_box' ); // @hide-in-jetpack
        },

        previous : function() {
            this.jp_carousel( 'previousOrNext', 'prevSlide' );
            gallery.jp_carousel( 'hide_reblog_box' ); // @hide-in-jetpack
        },

        previousOrNext : function ( slideSelectionMethodName ) {
            if ( ! this.jp_carousel( 'hasMultipleImages' ) ) {
                return false;
            }

            var slide = gallery.jp_carousel( slideSelectionMethodName );

            if ( slide ) {
                container.animate( { scrollTop: 0 }, 'fast' );
                this.jp_carousel( 'clearCommentTextAreaValue' );
                this.jp_carousel( 'selectSlide', slide );
                wpcom.carousel.stat( ['previous', 'view_image'] ); // @hide-in-jetpack
            }
        },

        // @start-hide-in-jetpack
        resetButtons : function(current) {
            if ( current.data( 'reblogged' ) ) {
                $('.jp-carousel-buttons a.jp-carousel-reblog').addClass( 'reblogged' ).text( jetpackCarouselStrings.reblogged );
            } else {
                $('.jp-carousel-buttons a.jp-carousel-reblog').removeClass( 'reblogged' ).text( jetpackCarouselStrings.reblog );
            }
            // Must also take care of reblog/reblogged here
        },
        // @end-hide-in-jetpack


        selectedSlide : function(){
            return this.find('.selected');
        },

        setSlidePosition : function(x) {
            transitionBegin = Date.now();

            return this.css({
                '-webkit-transform':'translate3d(' + x + 'px,0,0)',
                '-moz-transform':'translate3d(' + x + 'px,0,0)',
                '-ms-transform':'translate(' + x + 'px,0)',
                '-o-transform':'translate(' + x + 'px,0)',
                'transform':'translate3d(' + x + 'px,0,0)'
            });
        },

        updateSlidePositions : function(animate) {
            var current = this.jp_carousel( 'selectedSlide' ),
                galleryWidth = gallery.width(),
                currentWidth = current.width(),
                previous = gallery.jp_carousel( 'prevSlide' ),
                next = gallery.jp_carousel( 'nextSlide' ),
                previousPrevious = previous.prev(),
                nextNext = next.next(),
                left = Math.floor( ( galleryWidth - currentWidth ) * 0.5 );

            current.jp_carousel( 'setSlidePosition', left ).show();

            // minimum width
            gallery.jp_carousel( 'fitInfo', animate );

            // prep the slides
            var direction = lastSelectedSlide.is( current.prevAll() ) ? 1 : -1;

            // Since we preload the `previousPrevious` and `nextNext` slides, we need
            // to make sure they technically visible in the DOM, but invisible to the
            // user. To hide them from the user, we position them outside the edges
            // of the window.
            //
            // This section of code only applies when there are more than three
            // slides. Otherwise, the `previousPrevious` and `nextNext` slides will
            // overlap with the `previous` and `next` slides which must be visible
            // regardless.
            if ( 1 === direction ) {
                if ( ! nextNext.is( previous ) ) {
                    nextNext.jp_carousel( 'setSlidePosition', galleryWidth + next.width() ).show();
                }

                if ( ! previousPrevious.is( next ) ) {
                    previousPrevious.jp_carousel( 'setSlidePosition', -previousPrevious.width() - currentWidth ).show();
                }
            } else {
                if ( ! nextNext.is( previous ) ) {
                    nextNext.jp_carousel( 'setSlidePosition', galleryWidth + currentWidth ).show();
                }
            }

            previous.jp_carousel( 'setSlidePosition', Math.floor( -previous.width() + ( screenPadding * 0.75 ) ) ).show();
            next.jp_carousel( 'setSlidePosition', Math.ceil( galleryWidth - ( screenPadding * 0.75 ) ) ).show();
        },

        selectSlide : function(slide, animate){
            lastSelectedSlide = this.find( '.selected' ).removeClass( 'selected' );

            var slides = gallery.jp_carousel( 'slides' ).css({ 'position': 'fixed' }),
                current = $( slide ).addClass( 'selected' ).css({ 'position': 'relative' }),
                attachmentId = current.data( 'attachment-id' ),
                previous = gallery.jp_carousel( 'prevSlide' ),
                next = gallery.jp_carousel( 'nextSlide' ),
                previousPrevious = previous.prev(),
                nextNext = next.next(),
                animated,
                captionHtml;

            // center the main image
            gallery.jp_carousel( 'loadFullImage', current );

            caption.hide();

            if ( next.length === 0 && slides.length <= 2 ) {
                $( '.jp-carousel-next-button' ).hide();
            } else {
                $( '.jp-carousel-next-button' ).show();
            }

            if ( previous.length === 0 && slides.length <= 2 ) {
                $( '.jp-carousel-previous-button' ).hide();
            } else {
                $( '.jp-carousel-previous-button' ).show();
            }

            animated = current
                .add( previous )
                .add( previousPrevious )
                .add( next )
                .add( nextNext )
                .jp_carousel( 'loadSlide' );

            // slide the whole view to the x we want
            slides.not( animated ).hide();

            gallery.jp_carousel( 'updateSlidePositions', animate );

            gallery.jp_carousel( 'resetButtons', current ); // @hide-in-jetpack
            container.trigger( 'jp_carousel.selectSlide', [current] );

            gallery.jp_carousel( 'getTitleDesc', {
                title: current.data( 'title' ),
                desc: current.data( 'desc' )
            });

            var imageMeta = current.data( 'image-meta' );
            gallery.jp_carousel( 'updateExif', imageMeta );
            gallery.jp_carousel( 'updateFullSizeLink', current );
            gallery.jp_carousel( 'updateMap', imageMeta );
            gallery.jp_carousel( 'testCommentsOpened', current.data( 'comments-opened' ) );
            gallery.jp_carousel( 'getComments', {
                'attachment_id': attachmentId,
                'offset': 0,
                'clear': true
            });
            $( '#jp-carousel-comment-post-results' ).slideUp();

            // $('<div />').text(sometext).html() is a trick to go to HTML to plain
            // text (including HTML entities decode, etc)
            if ( current.data( 'caption' ) ) {
                captionHtml = $( '<div />' ).text( current.data( 'caption' ) ).html();

                if ( captionHtml === $( '<div />' ).text( current.data( 'title' ) ).html() ) {
                    $( '.jp-carousel-titleanddesc-title' ).fadeOut( 'fast' ).empty();
                }

                if ( captionHtml === $( '<div />' ).text( current.data( 'desc' ) ).html() ) {
                    $( '.jp-carousel-titleanddesc-desc' ).fadeOut( 'fast' ).empty();
                }

                caption.html( current.data( 'caption' ) ).fadeIn( 'slow' );
            } else {
                caption.fadeOut( 'fast' ).empty();
            }

            // Record pageview in WP Stats, for each new image loaded full-screen.
            if ( jetpackCarouselStrings.stats ) {
                new Image().src = document.location.protocol +
                    '//pixel.wp.com/g.gif?' +
                    jetpackCarouselStrings.stats +
                    '&post=' + encodeURIComponent( attachmentId ) +
                    '&rand=' + Math.random();
            }

            wpcom.carousel.pageview( attachmentId ); // @hide-in-jetpack

            // Load the images for the next and previous slides.
            $( next ).add( previous ).each( function() {
                gallery.jp_carousel( 'loadFullImage', $( this ) );
            });

            window.location.hash = last_known_location_hash = '#jp-carousel-' + attachmentId;
        },

        slides : function(){
            return this.find('.jp-carousel-slide');
        },

        slideDimensions : function(){
            return {
                width: $(window).width() - (screenPadding * 2),
                height: Math.floor( $(window).height() / 100 * proportion - 60 )
            };
        },

        loadSlide : function() {
            return this.each(function(){
                var slide = $(this);
                slide.find('img')
                    .one('load', function(){
                        // set the width/height of the image if it's too big
                        slide
                            .jp_carousel('fitSlide',false);
                    });
            });
        },

        bestFit : function(){
            var max        = gallery.jp_carousel('slideDimensions'),
                orig       = this.jp_carousel('originalDimensions'),
                orig_ratio = orig.width / orig.height,
                w_ratio    = 1,
                h_ratio    = 1,
                width, height;

            if ( orig.width > max.width ) {
                w_ratio = max.width / orig.width;
            }
            if ( orig.height > max.height ) {
                h_ratio = max.height / orig.height;
            }

            if ( w_ratio < h_ratio ) {
                width = max.width;
                height = Math.floor( width / orig_ratio );
            } else if ( h_ratio < w_ratio ) {
                height = max.height;
                width = Math.floor( height * orig_ratio );
            } else {
                width = orig.width;
                height = orig.height;
            }

            return {
                width: width,
                height: height
            };
        },

        fitInfo : function(/*animated*/){
            var current = this.jp_carousel('selectedSlide'),
                size = current.jp_carousel('bestFit');

            photo_info.css({
                'left'  : Math.floor( (info.width() - size.width) * 0.5 ),
                'width' : Math.floor( size.width )
            });

            return this;
        },

        fitMeta : function(animated){
            var newInfoTop   = { top: Math.floor( $(window).height() / 100 * proportion + 5 ) + 'px' };
            var newLeftWidth = { width: ( info.width() - (imageMeta.width() + 80) ) + 'px' };

            if (animated) {
                info.animate(newInfoTop);
                leftColWrapper.animate(newLeftWidth);
            } else {
                info.animate(newInfoTop);
                leftColWrapper.css(newLeftWidth);
            }
        },

        fitSlide : function(/*animated*/){
            return this.each(function(){
                var $this      = $(this),
                    dimensions = $this.jp_carousel('bestFit'),
                    method     = 'css',
                    max        = gallery.jp_carousel('slideDimensions');

                dimensions.left = 0;
                dimensions.top = Math.floor( (max.height - dimensions.height) * 0.5 ) + 40;
                $this[method](dimensions);
            });
        },

        texturize : function(text) {
            text = '' + text; // make sure we get a string. Title "1" came in as int 1, for example, which did not support .replace().
            text = text.replace(/'/g, '&#8217;').replace(/&#039;/g, '&#8217;').replace(/[\u2019]/g, '&#8217;');
            text = text.replace(/"/g, '&#8221;').replace(/&#034;/g, '&#8221;').replace(/&quot;/g, '&#8221;').replace(/[\u201D]/g, '&#8221;');
            text = text.replace(/([\w]+)=&#[\d]+;(.+?)&#[\d]+;/g, '$1="$2"'); // untexturize allowed HTML tags params double-quotes
            return $.trim(text);
        },

        initSlides : function(items, start_index){
            if ( items.length < 2 ) {
                $( '.jp-carousel-next-button, .jp-carousel-previous-button' ).hide();
            } else {
                $( '.jp-carousel-next-button, .jp-carousel-previous-button' ).show();
            }

            // Calculate the new src.
            items.each(function(/*i*/){
                var src_item  = $(this),
                    orig_size = src_item.data('orig-size') || '',
                    max       = gallery.jp_carousel('slideDimensions'),
                    parts     = orig_size.split(','),
                    medium_file     = src_item.data('medium-file') || '',
                    large_file      = src_item.data('large-file') || '',
                    src;
                orig_size = {width: parseInt(parts[0], 10), height: parseInt(parts[1], 10)};

// @start-hide-in-jetpack
                if ( 'undefined' !== typeof wpcom ) {
                    src = src_item.attr('src') || src_item.attr('original') || src_item.data('original') || src_item.data('lazy-src');
                    if (src.indexOf('imgpress') !== -1) {
                        src = src_item.data('orig-file');
                    }
                    src = wpcom.carousel.addWidthToImageURL( src, wpcom.carousel.findFirstLargeEnoughWidth( orig_size.width, orig_size.height, max.width, max.height ) );
                } else {

// @end-hide-in-jetpack
                    src = src_item.data('orig-file');

                    src = gallery.jp_carousel('selectBestImageSize', {
                        orig_file   : src,
                        orig_width  : orig_size.width,
                        orig_height : orig_size.height,
                        max_width   : max.width,
                        max_height  : max.height,
                        medium_file : medium_file,
                        large_file  : large_file
                    });
// @start-hide-in-jetpack
                } // end else of if ( 'undefined' != typeof wpcom )
// @end-hide-in-jetpack

                // Set the final src
                $(this).data( 'gallery-src', src );
            });

            // If the start_index is not 0 then preload the clicked image first.
            if ( 0 !== start_index ) {
                $('<img/>')[0].src = $(items[start_index]).data('gallery-src');
            }

            var useInPageThumbnails = items.first().closest( '.tiled-gallery.type-rectangular' ).length > 0;

            // create the 'slide'
            items.each(function(i){
                var src_item        = $(this),
                    reblogged       = src_item.data( 'reblogged' ) || 0, // @hide-in-jetpack
                    attachment_id   = src_item.data('attachment-id') || 0,
                    comments_opened = src_item.data('comments-opened') || 0,
                    image_meta      = src_item.data('image-meta') || {},
                    orig_size       = src_item.data('orig-size') || '',
                    thumb_size      = { width : src_item[0].naturalWidth, height : src_item[0].naturalHeight },
                    title           = src_item.data('image-title') || '',
                    description     = src_item.data('image-description') || '',
                    caption         = src_item.parents('.gallery-item').find('.gallery-caption').html() || '',
                    src		= src_item.data('gallery-src') || '',
                    medium_file     = src_item.data('medium-file') || '',
                    large_file      = src_item.data('large-file') || '',
                    orig_file	= src_item.data('orig-file') || '';

                var tiledCaption = src_item.parents('div.tiled-gallery-item').find('div.tiled-gallery-caption').html();
                if ( tiledCaption ) {
                    caption = tiledCaption;
                }

                if ( attachment_id && orig_size.length ) {
                    title       = gallery.jp_carousel('texturize', title);
                    description = gallery.jp_carousel('texturize', description);
                    caption     = gallery.jp_carousel('texturize', caption);

                    // Initially, the image is a 1x1 transparent gif.  The preview is shown as a background image on the slide itself.
                    var image = $( '<img/>' )
                        .attr( 'src', 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' )
                        .css( 'width', '100%' )
                        .css( 'height', '100%' );

                    var slide = $('<div class="jp-carousel-slide" itemprop="associatedMedia" itemscope itemtype="https://schema.org/ImageObject"></div>')
                        .hide()
                        .css({
                            //'position' : 'fixed',
                            'left'     : i < start_index ? -1000 : gallery.width()
                        })
                        .append( image )
                        .appendTo(gallery)
                        .data('src', src )
                        .data('title', title)
                        .data('desc', description)
                        .data('caption', caption)
                        .data('attachment-id', attachment_id)
                        .data('permalink', src_item.parents('a').attr('href'))
                        .data('orig-size', orig_size)
                        .data('comments-opened', comments_opened)
                        .data('image-meta', image_meta)
                        .data('medium-file', medium_file)
                        .data('large-file', large_file)
                        .data('orig-file', orig_file)
                        .data('thumb-size', thumb_size)
                        .data( 'reblogged', reblogged ) // @hide-in-jetpack
                    ;

                    if ( useInPageThumbnails ) {
                        // Use the image already loaded in the gallery as a preview.
                        slide
                            .data( 'preview-image', src_item.attr( 'src' ) )
                            .css( {
                                'background-image' : 'url("' + src_item.attr( 'src' ) + '")',
                                'background-size' : '100% 100%',
                                'background-position' : 'center center'
                            } );
                    }

                    slide.jp_carousel( 'fitSlide', false );
                }
            });
            return this;
        },

        selectBestImageSize: function(args) {
            if ( 'object' !== typeof args ) {
                args = {};
            }

            if ( 'undefined' === typeof args.orig_file ) {
                return '';
            }

            if ( 'undefined' === typeof args.orig_width || 'undefined' === typeof args.max_width ) {
                return args.orig_file;
            }

            if ( 'undefined' === typeof args.medium_file || 'undefined' === typeof args.large_file ) {
                return args.orig_file;
            }

            // Check if the image is being served by Photon (using a regular expression on the hostname).

            var imageLinkParser = document.createElement( 'a' );
            imageLinkParser.href = args.large_file;

            var isPhotonUrl = ( imageLinkParser.hostname.match( /^i[\d]{1}.wp.com$/i ) != null );

            var medium_size_parts	= gallery.jp_carousel( 'getImageSizeParts', args.medium_file, args.orig_width, isPhotonUrl );
            var large_size_parts	= gallery.jp_carousel( 'getImageSizeParts', args.large_file, args.orig_width, isPhotonUrl );

            var large_width       = parseInt( large_size_parts[0], 10 ),
                large_height      = parseInt( large_size_parts[1], 10 ),
                medium_width      = parseInt( medium_size_parts[0], 10 ),
                medium_height     = parseInt( medium_size_parts[1], 10 );

            // Assign max width and height.
            args.orig_max_width  = args.max_width;
            args.orig_max_height = args.max_height;

            // Give devices with a higher devicePixelRatio higher-res images (Retina display = 2, Android phones = 1.5, etc)
            if ( 'undefined' !== typeof window.devicePixelRatio && window.devicePixelRatio > 1 ) {
                args.max_width  = args.max_width * window.devicePixelRatio;
                args.max_height = args.max_height * window.devicePixelRatio;
            }

            if ( large_width >= args.max_width || large_height >= args.max_height ) {
                return args.large_file;
            }

            if ( medium_width >= args.max_width || medium_height >= args.max_height ) {
                return args.medium_file;
            }

            if ( isPhotonUrl ) {
                // args.orig_file doesn't point to a Photon url, so in this case we use args.large_file
                // to return the photon url of the original image.
                var largeFileIndex = args.large_file.lastIndexOf( '?' );
                var origPhotonUrl = args.large_file;
                if ( -1 !== largeFileIndex ) {
                    origPhotonUrl = args.large_file.substring( 0, largeFileIndex );
                    // If we have a really large image load a smaller version
                    // that is closer to the viewable size
                    if ( args.orig_width > args.max_width || args.orig_height > args.max_height ) {
                        origPhotonUrl += '?fit=' + args.orig_max_width + '%2C' + args.orig_max_height;
                    }
                }
                return origPhotonUrl;
            }

            return args.orig_file;
        },

        getImageSizeParts: function( file, orig_width, isPhotonUrl ) {
            var size		= isPhotonUrl ?
                file.replace( /.*=([\d]+%2C[\d]+).*$/, '$1' ) :
                file.replace( /.*-([\d]+x[\d]+)\..+$/, '$1' );

            var size_parts  = ( size !== file ) ?
                ( isPhotonUrl ? size.split( '%2C' ) : size.split( 'x' ) ) :
                [ orig_width, 0 ];

            // If one of the dimensions is set to 9999, then the actual value of that dimension can't be retrieved from the url.
            // In that case, we set the value to 0.
            if ( '9999' === size_parts[0] ) {
                size_parts[0] = '0';
            }

            if ( '9999' === size_parts[1] ) {
                size_parts[1] = '0';
            }

            return size_parts;
        },

// @start-hide-in-jetpack
        show_reblog_box: function() {
            $('#carousel-reblog-box textarea').val(jetpackCarouselStrings.reblog_add_thoughts);
            //t.addClass('selected');
            $('#carousel-reblog-box p.response').remove();
            $('#carousel-reblog-box div.submit, #carousel-reblog-box div.submit span.canceltext').show();
            $('#carousel-reblog-box div.submit input[type=submit]').prop('disabled', false);

            var current = $('.jp-carousel div.selected');
            $('#carousel-reblog-box input#carousel-reblog-post-url').val( current.data('permalink') );
            $('#carousel-reblog-box input#carousel-reblog-post-title').val( $('div.jp-carousel-info').children('h2').text() );

            $('div.jp-carousel-info').append( $('#carousel-reblog-box') ).children().fadeOut('fast');
            $('#carousel-reblog-box').fadeIn('fast');
        },

        hide_reblog_box: function () {
            $( 'div.jp-carousel-info' ).children().not( '#carousel-reblog-box' ).fadeIn( 'fast' );
            $( '#carousel-reblog-box' ).fadeOut( 'fast' );
        },
// @end-hide-in-jetpack

        originalDimensions: function() {
            var splitted = $(this).data('orig-size').split(',');
            return {width: parseInt(splitted[0], 10), height: parseInt(splitted[1], 10)};
        },

        format: function( args ) {
            if ( 'object' !== typeof args ) {
                args = {};
            }
            if ( ! args.text || 'undefined' === typeof args.text ) {
                return;
            }
            if ( ! args.replacements || 'undefined' === typeof args.replacements ) {
                return args.text;
            }
            return args.text.replace(/{(\d+)}/g, function( match, number ) {
                return typeof args.replacements[number] !== 'undefined' ? args.replacements[number] : match;
            });
        },

        /**
         * Returns a number in a fraction format that represents the shutter speed.
         * @param Number speed
         * @return String
         */
        shutterSpeed: function( speed ) {
            var denominator;

            // round to one decimal if value > 1s by multiplying it by 10, rounding, then dividing by 10 again
            if ( speed >= 1 ) {
                return Math.round( speed * 10 ) / 10 + 's';
            }

            // If the speed is less than one, we find the denominator by inverting
            // the number. Since cameras usually use rational numbers as shutter
            // speeds, we should get a nice round number. Or close to one in cases
            // like 1/30. So we round it.
            denominator = Math.round( 1 / speed );

            return '1/' + denominator + 's';
        },

        parseTitleDesc: function( value ) {
            if ( !value.match(' ') && value.match('_') ) {
                return '';
            }
            // Prefix list originally based on http://commons.wikimedia.org/wiki/MediaWiki:Filename-prefix-blacklist
            $([
                'CIMG',                   // Casio
                'DSC_',                   // Nikon
                'DSCF',                   // Fuji
                'DSCN',                   // Nikon
                'DUW',                    // some mobile phones
                'GEDC',                   // GE
                'IMG',                    // generic
                'JD',                     // Jenoptik
                'MGP',                    // Pentax
                'PICT',                   // misc.
                'Imagen',                 // misc.
                'Foto',                   // misc.
                'DSC',                    // misc.
                'Scan',                   // Scanners
                'SANY',                   // Sanyo
                'SAM',                    // Samsung
                'Screen Shot [0-9]+'      // Mac screenshots
            ])
                .each(function(key, val){
                    var regex = new RegExp('^' + val);
                    if ( regex.test(value) ) {
                        value = '';
                        return;
                    }
                });
            return value;
        },

        getTitleDesc: function( data ) {
            var title ='', desc = '', markup = '', target;

            target = $( 'div.jp-carousel-titleanddesc', 'div.jp-carousel-wrap' );
            target.hide();

            title = gallery.jp_carousel('parseTitleDesc', data.title) || '';
            desc  = gallery.jp_carousel('parseTitleDesc', data.desc)  || '';

            if ( title.length || desc.length ) {
                // Convert from HTML to plain text (including HTML entities decode, etc)
                if ( $('<div />').html( title ).text() === $('<div />').html( desc ).text() ) {
                    title = '';
                }

                markup  = ( title.length ) ? '<div class="jp-carousel-titleanddesc-title">' + title + '</div>' : '';
                markup += ( desc.length )  ? '<div class="jp-carousel-titleanddesc-desc">' + desc + '</div>'   : '';

                target.html( markup ).fadeIn('slow');
            }

            $( 'div#jp-carousel-comment-form-container' ).css('margin-top', '20px');
            $( 'div#jp-carousel-comments-loading' ).css('margin-top', '20px');
        },

        // updateExif updates the contents of the exif UL (.jp-carousel-image-exif)
        updateExif: function( meta ) {
            if ( !meta || 1 !== Number( jetpackCarouselStrings.display_exif ) ) {
                return false;
            }

            var $ul = $( '<ul class=\'jp-carousel-image-exif\'></ul>' );

            $.each( meta, function( key, val ) {
                if ( 0 === parseFloat(val) || !val.length || -1 === $.inArray( key, $.makeArray( jetpackCarouselStrings.meta_data ) ) ) {
                    return;
                }

                switch( key ) {
                    case 'focal_length':
                        val = val + 'mm';
                        break;
                    case 'shutter_speed':
                        val = gallery.jp_carousel('shutterSpeed', val);
                        break;
                    case 'aperture':
                        val = 'f/' + val;
                        break;
                }

                $ul.append( '<li><h5>' + jetpackCarouselStrings[key] + '</h5>' + val + '</li>' );
            });

            // Update (replace) the content of the ul
            $( 'div.jp-carousel-image-meta ul.jp-carousel-image-exif' ).replaceWith( $ul );
        },

        // updateFullSizeLink updates the contents of the jp-carousel-image-download link
        updateFullSizeLink: function(current) {
            if(!current || !current.data) {
                return false;
            }
            var original,
                origSize = current.data('orig-size').split(',' ),
                imageLinkParser = document.createElement( 'a' );

            imageLinkParser.href = current.data( 'src' ).replace( /\?.+$/, '' );

            // Is this a Photon URL?
            if ( imageLinkParser.hostname.match( /^i[\d]{1}.wp.com$/i ) !== null ) {
                original = imageLinkParser.href;
            } else {
                original = current.data('orig-file').replace(/\?.+$/, '');
            }

            var permalink = $( '<a>'+gallery.jp_carousel('format', {'text': jetpackCarouselStrings.download_original, 'replacements': origSize})+'</a>' )
                .addClass( 'jp-carousel-image-download' )
                .attr( 'href', original )
                .attr( 'target', '_blank' );

            // Update (replace) the content of the anchor
            $( 'div.jp-carousel-image-meta a.jp-carousel-image-download' ).replaceWith( permalink );
        },

        updateMap: function( meta ) {
            if ( !meta.latitude || !meta.longitude || 1 !== Number( jetpackCarouselStrings.display_geo ) ) {
                return;
            }

            var latitude  = meta.latitude,
                longitude = meta.longitude,
                $metabox  = $( 'div.jp-carousel-image-meta', 'div.jp-carousel-wrap' ),
                $mapbox   = $( '<div></div>' ),
                style     = '&scale=2&style=feature:all|element:all|invert_lightness:true|hue:0x0077FF|saturation:-50|lightness:-5|gamma:0.91';

            $mapbox
                .addClass( 'jp-carousel-image-map' )
                .html( '<img width="154" height="154" src="https://maps.googleapis.com/maps/api/staticmap?\
							center=' + latitude + ',' + longitude + '&\
							zoom=8&\
							size=154x154&\
							sensor=false&\
							markers=size:medium%7Ccolor:blue%7C' + latitude + ',' + longitude + style +'" class="gmap-main" />\
							\
						<div class="gmap-topright"><div class="imgclip"><img width="175" height="154" src="https://maps.googleapis.com/maps/api/staticmap?\
							center=' + latitude + ',' + longitude + '&\
							zoom=3&\
							size=175x154&\
							sensor=false&\
							markers=size:small%7Ccolor:blue%7C' + latitude + ',' + longitude + style + '"c /></div></div>\
							\
						' )
                .prependTo( $metabox );
        },

        testCommentsOpened: function( opened ) {
            if ( 1 === parseInt( opened, 10 ) ) {
// @start-hide-in-jetpack
                if ( 1 === Number( jetpackCarouselStrings.is_logged_in ) ) {
                    $('.jp-carousel-commentlink').fadeIn('fast');
                } else {
// @end-hide-in-jetpack
                    $('.jp-carousel-buttons').fadeIn('fast');
// @start-hide-in-jetpack
                }
// @end-hide-in-jetpack
                commentForm.fadeIn('fast');
            } else {
// @start-hide-in-jetpack
                if ( 1 === Number( jetpackCarouselStrings.is_logged_in ) ) {
                    $('.jp-carousel-commentlink').fadeOut('fast');
                } else {
// @end-hide-in-jetpack
                    $('.jp-carousel-buttons').fadeOut('fast');
// @start-hide-in-jetpack
                }
// @end-hide-in-jetpack
                commentForm.fadeOut('fast');
            }
        },

        getComments: function( args ) {
            clearInterval( commentInterval );

            if ( 'object' !== typeof args ) {
                return;
            }

            if ( 'undefined' === typeof args.attachment_id || ! args.attachment_id ) {
                return;
            }

            if ( ! args.offset || 'undefined' === typeof args.offset || args.offset < 1 ) {
                args.offset = 0;
            }

            var comments        = $('.jp-carousel-comments'),
                commentsLoading = $('#jp-carousel-comments-loading').show();

            if ( args.clear ) {
                comments.hide().empty();
            }

            $.ajax({
                type:       'GET',
                url:        jetpackCarouselStrings.ajaxurl,
                dataType:   'json',
                data: {
                    action: 'get_attachment_comments',
                    nonce:  jetpackCarouselStrings.nonce,
                    id:     args.attachment_id,
                    offset: args.offset
                },
                success: function(data/*, status, xhr*/) {
                    if ( args.clear ) {
                        comments.fadeOut('fast').empty();
                    }

                    $( data ).each(function(){
                        var comment = $('<div></div>')
                            .addClass('jp-carousel-comment')
                            .attr('id', 'jp-carousel-comment-' + this['id'])
                            .html(
                                '<div class="comment-gravatar">' +
                                this['gravatar_markup'] +
                                '</div>' +
                                '<div class="comment-author">' +
                                this['author_markup'] +
                                '</div>' +
                                '<div class="comment-date">' +
                                this['date_gmt'] +
                                '</div>' +
                                '<div class="comment-content">' +
                                this['content'] +
                                '</div>'
                            );
                        comments.append(comment);

                        // Set the interval to check for a new page of comments.
                        clearInterval( commentInterval );
                        commentInterval = setInterval( function() {
                            if ( ( $('.jp-carousel-overlay').height() - 150 ) < $('.jp-carousel-wrap').scrollTop() + $(window).height() ) {
                                gallery.jp_carousel('getComments',{ attachment_id: args.attachment_id, offset: args.offset + 10, clear: false });
                                clearInterval( commentInterval );
                            }
                        }, 300 );
                    });

                    // Verify (late) that the user didn't repeatldy click the arrows really fast, in which case the requested
                    // attachment id might no longer match the current attachment id by the time we get the data back or a now
                    // registered infiniscroll event kicks in, so we don't ever display comments for the wrong image by mistake.
                    var current = $('.jp-carousel div.selected');
                    if ( current && current.data && current.data('attachment-id') != args.attachment_id ) { // jshint ignore:line
                        comments.fadeOut('fast');
                        comments.empty();
                        return;
                    }

                    // Increase the height of the background, semi-transparent overlay to match the new length of the comments list.
                    $('.jp-carousel-overlay').height( $(window).height() + titleAndDescription.height() + commentForm.height() + ( (comments.height() > 0) ? comments.height() : imageMeta.height() ) + 200 );

                    comments.show();
                    commentsLoading.hide();
                },
                error: function(xhr, status, error) {
                    // TODO: proper error handling
                    console.log( 'Comment get fail...', xhr, status, error );
                    comments.fadeIn('fast');
                    commentsLoading.fadeOut('fast');
                }
            });
        },

        postCommentError: function(args) {
            if ( 'object' !== typeof args ) {
                args = {};
            }
            if ( ! args.field || 'undefined' === typeof args.field ||  ! args.error || 'undefined' === typeof args.error ) {
                return;
            }
            $('#jp-carousel-comment-post-results').slideUp('fast').html('<span class="jp-carousel-comment-post-error">'+args.error+'</span>').slideDown('fast');
            $('#jp-carousel-comment-form-spinner').spin(false);
        },

        setCommentIframeSrc: function(attachment_id) {
            var iframe = $('#jp-carousel-comment-iframe');
            // Set the proper irame src for the current attachment id
            if (iframe && iframe.length) {
                iframe.attr('src', iframe.attr('src').replace(/(postid=)\d+/, '$1'+attachment_id) );
                iframe.attr('src', iframe.attr('src').replace(/(%23.+)?$/, '%23jp-carousel-'+attachment_id) );
            }
        },

        clearCommentTextAreaValue: function() {
            var commentTextArea = $('#jp-carousel-comment-form-comment-field');
            if ( commentTextArea ) {
                commentTextArea.val('');
            }
        },

        nextSlide : function () {
            var slides = this.jp_carousel( 'slides' );
            var selected = this.jp_carousel( 'selectedSlide' );

            if ( selected.length === 0 || ( slides.length > 2 && selected.is( slides.last() ) ) ) {
                return slides.first();
            }

            return selected.next();
        },

        prevSlide : function () {
            var slides = this.jp_carousel( 'slides' );
            var selected = this.jp_carousel( 'selectedSlide' );

            if ( selected.length === 0 || ( slides.length > 2 && selected.is( slides.first() ) ) ) {
                return slides.last();
            }

            return selected.prev();
        },

        loadFullImage : function ( slide ) {
            var image = slide.find( 'img:first' );

            if ( ! image.data( 'loaded' ) ) {
                // If the width of the slide is smaller than the width of the "thumbnail" we're already using,
                // don't load the full image.

                image.on( 'load.jetpack', function () {
                    image.off( 'load.jetpack' );
                    $( this ).closest( '.jp-carousel-slide' ).css( 'background-image', '' );
                } );

                if ( ! slide.data( 'preview-image' ) || ( slide.data( 'thumb-size' ) && slide.width() > slide.data( 'thumb-size' ).width ) ) {
                    image.attr( 'src', image.closest( '.jp-carousel-slide' ).data( 'src' ) ).attr('itemprop', 'image');
                } else {
                    image.attr( 'src', slide.data( 'preview-image' ) ).attr('itemprop', 'image');
                }

                image.data( 'loaded', 1 );
            }
        },

        hasMultipleImages : function () {
            return gallery.jp_carousel('slides').length > 1;
        }
    };

    $.fn.jp_carousel = function(method){
        // ask for the HTML of the gallery
        // Method calling logic
        if ( methods[method] ) {
            return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            return methods.open.apply( this, arguments );
        } else {
            $.error( 'Method ' +	method + ' does not exist on jQuery.jp_carousel' );
        }

    };

    // register the event listener for starting the gallery
    $( document.body ).on( 'click.jp-carousel', 'div.gallery,div.tiled-gallery, a.single-image-gallery', function(e) {
        if ( ! $(this).jp_carousel( 'testForData', e.currentTarget ) ) {
            return;
        }
        if ( $(e.target).parent().hasClass('gallery-caption') ) {
            return;
        }
        e.preventDefault();

        // Stopping propagation in case there are parent elements
        // with .gallery or .tiled-gallery class
        e.stopPropagation();
        $(this).jp_carousel('open', {start_index: $(this).find('.gallery-item, .tiled-gallery-item').index($(e.target).parents('.gallery-item, .tiled-gallery-item'))});
    });

    // handle lightbox (single image gallery) for images linking to 'Attachment Page'
    if ( 1 === Number( jetpackCarouselStrings.single_image_gallery ) ) {
        processSingleImageGallery();
        $( document.body ).on( 'post-load', function() {
            processSingleImageGallery();
        } );
    }

    // Makes carousel work on page load and when back button leads to same URL with carousel hash (ie: no actual document.ready trigger)
    $( window ).on( 'hashchange.jp-carousel', function () {

        var hashRegExp = /jp-carousel-(\d+)/,
            matches, attachmentId, galleries, selectedThumbnail;

        if ( ! window.location.hash || ! hashRegExp.test( window.location.hash ) ) {
            if ( gallery && gallery.opened ) {
                container.jp_carousel( 'close' );
            }

            return;
        }

        if ( ( window.location.hash === last_known_location_hash ) && gallery.opened ) {
            return;
        }

        if ( window.location.hash && gallery && !gallery.opened && history.back) {
            history.back();
            return;
        }

        last_known_location_hash = window.location.hash;
        matches = window.location.hash.match( hashRegExp );
        attachmentId = parseInt( matches[1], 10 );
        galleries = $( 'div.gallery, div.tiled-gallery, a.single-image-gallery' );

        // Find the first thumbnail that matches the attachment ID in the location
        // hash, then open the gallery that contains it.
        galleries.each( function( _, galleryEl ) {
            $( galleryEl ).find('img').each( function( imageIndex, imageEl ) {
                if ( $( imageEl ).data( 'attachment-id' ) === parseInt( attachmentId, 10 ) ) {
                    selectedThumbnail = { index: imageIndex, gallery: galleryEl };
                    return false;
                }
            });

            if ( selectedThumbnail ) {
                $( selectedThumbnail.gallery )
                    .jp_carousel( 'openOrSelectSlide', selectedThumbnail.index );
                return false;
            }
        });
    });

    if ( window.location.hash ) {
        $( window ).trigger( 'hashchange' );
    }
});

/**
 * jQuery Plugin to obtain touch gestures from iPhone, iPod Touch and iPad, should also work with Android mobile phones (not tested yet!)
 * Common usage: wipe images (left and right to show the previous or next image)
 *
 * @author Andreas Waltl, netCU Internetagentur (http://www.netcu.de)
 * Version 1.1.1, modified to pass the touchmove event to the callbacks.
 */
(function($) {
    $.fn.touchwipe = function(settings) {
        var config = {
            min_move_x: 20,
            min_move_y: 20,
            wipeLeft: function(/*e*/) { },
            wipeRight: function(/*e*/) { },
            wipeUp: function(/*e*/) { },
            wipeDown: function(/*e*/) { },
            preventDefaultEvents: true
        };

        if (settings) {
            $.extend(config, settings);
        }

        this.each(function() {
            var startX;
            var startY;
            var isMoving = false;

            function cancelTouch() {
                this.removeEventListener('touchmove', onTouchMove);
                startX = null;
                isMoving = false;
            }

            function onTouchMove(e) {
                if(config.preventDefaultEvents) {
                    e.preventDefault();
                }
                if(isMoving) {
                    var x = e.touches[0].pageX;
                    var y = e.touches[0].pageY;
                    var dx = startX - x;
                    var dy = startY - y;
                    if(Math.abs(dx) >= config.min_move_x) {
                        cancelTouch();
                        if(dx > 0) {
                            config.wipeLeft(e);
                        } else {
                            config.wipeRight(e);
                        }
                    }
                    else if(Math.abs(dy) >= config.min_move_y) {
                        cancelTouch();
                        if(dy > 0) {
                            config.wipeDown(e);
                        } else {
                            config.wipeUp(e);
                        }
                    }
                }
            }

            function onTouchStart(e)
            {
                if (e.touches.length === 1) {
                    startX = e.touches[0].pageX;
                    startY = e.touches[0].pageY;
                    isMoving = true;
                    this.addEventListener('touchmove', onTouchMove, false);
                }
            }
            if ('ontouchstart' in document.documentElement) {
                this.addEventListener('touchstart', onTouchStart, false);
            }
        });

        return this;
    };
})(jQuery);
;