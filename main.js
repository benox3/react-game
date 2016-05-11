(function(){
    'use strict';

    // cache DOM elements
    var errorListNode = document.getElementById('error-list');
    var outputNode;
    var iframeWindow;

    /**
     * The `getJSON` success callback.
     *
     * @callback xhrCallback
     * @param {Object} The JSON response.
     */

    /**
     * Gets JSON from url.
     *
     * @param {String} url - The url.
     * @param {xhrCallback} callback - The callback that handles the response.
     */
    function getJSON(url, callback) {
        // http://youmightnotneedjquery.com/#json
        var request = new XMLHttpRequest();
        request.open('GET', url, true);

        request.onreadystatechange = function() {
            if (this.readyState === 4) {
                if (this.status >= 200 && this.status < 400) {
                    callback(JSON.parse(this.responseText));
                } else {
                    // todo: handle error
                }
            }
        };

        request.send();
        request = null;
    }

    /**
     * Initializes iframe window and document for level output.
     *
     * @param {HTMLElement} node - The DOM node, which can be an iframe.
     * @param {Array} dependencies - The script dependencies for the iframe head.
     * @return {Window} - The iframe window object.
     */
    function initializeIframe(node, dependencies) {
        var iframe = node;

        // use iframe node or create and append an iframe into node
        if (iframe.nodeName !== 'IFRAME') {
            iframe = document.createElement('iframe');
            node.appendChild(iframe);
        }

        // get iframe window
        iframeWindow = iframe.contentWindow || iframe;

        // construct iframe document
        iframeWindow.document.open();
        var url, extension;
        var html = ['<head>'];
        for (var i = 0, l = dependencies.length; i < l; i++) {
            url = dependencies[i];
            extension = url.split('.').pop().toLowerCase();
            if (extension === 'js') {
                html.push('<script src="' + url + '"></script>');
            } else if (extension === 'css') {
                html.push('<link rel="stylesheet" href="' + url + '" />');
            }
        }
        html.push('</head>');
        iframeWindow.document.write(html.join(''));
        iframeWindow.document.close();

        return iframeWindow;
    }

    // initialize editor
    var ace = window.ace;
    var Range = ace.require('ace/range').Range;
    var editor = ace.edit('editor');
    var session  = editor.getSession();
    editor.setTheme('ace/theme/monokai');

    // get level JSON
    getJSON('./level.json', function(res) {
        session.setMode('ace/mode/' + res.editor_mode);

        var iframeWindow = initializeIframe(
            document.getElementById('output'),
            res.dependencies || []
        );

        // iframe onload
        iframeWindow.onload = function() {
            outputNode = iframeWindow.document.body;
            renderOutput(editor.getValue(), outputNode, errorListNode);
        };

        // editor range
        var range = new Range();
        // todo: update for more than one allowed line
        range.setStart(res.editor_allowed_lines[0] - 1, 0);
        range.setEnd(res.editor_allowed_lines[0] - 1, 80);
        session.addMarker(range, 'editable-highlight');

        // prevent passing event key if the cursor line does not meet our criteria
        editor.keyBinding.addKeyboardHandler({
            handleKeyboard: function(data, hash, keyString, keyCode, event) {
                if (hash === -1 || (keyCode <= 40 && keyCode >= 37)) {
                    return false;
                }

                if (!intersects(editor, range)) {
                    return {
                        command: 'null',
                        passEvent: false
                    };
                }
            }
        });

        // insert level code into editor
        editor.insert(res.code);

        // refresh on change
        editor.on('change', window._.debounce(function() {
             onEditorChange({
                editorValue: editor.getValue(),
                outputValidator: eval(res.output_validator),
                iframeWindow: iframeWindow,
                outputNode: outputNode,
                errorListNode: errorListNode
             });
        }, 500));

    });

    /**
     * Refreshes Ace editor on change.
     *
     * @param {Object} options - The options.
     * @param {String} options.editorValue - The editor value.
     * @param {Function} options.outputValidator - The validation function.
     * @param {Window} options.iframeWindow - The iframe window.
     * @param {HTMLElement} options.outputNode - The output DOM element.
     * @param {HTMLElement} options.errorListNode - The error list DOM element.
     */
    function onEditorChange(options) {
        var errorContainerNode = options.errorListNode.parentNode;
        options.errorListNode.innerHTML = '';
        renderOutput(options.editorValue, options.outputNode, options.errorListNode);
        console.log(options.outputValidator(options.iframeWindow));

        if (options.errorListNode.innerHTML.length < 1) {
            errorContainerNode.classList.remove('hide');
            errorContainerNode.classList.add('hide');
        } else { 
            errorContainerNode.classList.remove('hide');
        }
    }

    /**
     * Checks to see if current selection matches range.
     *
     * @param {Object} editor - The Ace editor.
     * @param {Object} range - The Ace range.
     * @return {Boolean}
     */
    function intersects(editor, range) {
        return editor.getSelectionRange().intersects(range);
    }

    /**
     * Renders the editor output.
     *
     * @param {String} editorValue - The editor value.
     * @param {HTMLElement} outputNode - The output DOM element.
     * @param {HTMLElement} errorListNode - The error list DOM element.
     */
    function renderOutput(editorValue, outputNode, errorListNode) {
        try {
            // todo: use test case from JSON
            var transpiledCode = iframeWindow.babel.transform(editorValue).code;

            // run the transpiled code
            iframeWindow.eval(transpiledCode);

        } catch (e) {
            var errorElement = document.createElement('li');
            errorElement.innerHTML = '<span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>' + '<span> ' + e + '</span>';
            errorListNode.appendChild(errorElement);
        }
    }
})();
