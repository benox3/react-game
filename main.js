(function(){
    'use strict';

    // cache DOM elements
    var errorListNode = document.getElementById('error-list');
    var outputNode;

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
     * @param {DOMElement} node - The DOM node, which can be an iframe.
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

        // get iframe window and document
        var iframeWindow = iframe.contentWindow || iframe;
        var iframeDocument = iframe.contentDocument || iframe.contentWindow.document;

        // construct iframe document
        iframeDocument.open();
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
        iframeDocument.write(html.join(''));
        iframeDocument.close();

        return iframeWindow;
    }

    // todo: get script dependencies from JSON
    var dependencies = [
        '//cdnjs.cloudflare.com/ajax/libs/babel-core/5.8.24/browser.js',
        '//cdnjs.cloudflare.com/ajax/libs/react/0.14.6/react.js',
        '//cdnjs.cloudflare.com/ajax/libs/react/0.14.6/react-dom.js'
    ];

    var iframeWindow = initializeIframe(
        document.getElementById('output'),
        dependencies
    );

    // iframe onload
    iframeWindow.onload = function() {
        outputNode = iframeWindow.document.body;
        renderOutput(editor.getValue(), outputNode, errorListNode);
    };

    // initialize editor
    var ace = window.ace;
    var Range = ace.require('ace/range').Range;
    var editor = ace.edit('editor');
    var session  = editor.getSession();
    // todo: get allowed lines from JSON
    var allowedLines = [3];

    editor.setTheme('ace/theme/monokai');
    session.setMode('ace/mode/jsx');

    // todo: get code from JSON
    var code = (
        'var Component = React.createClass({\n\t' +
        'render: function() {\n\t\treturn;\n\t}\n});' +
        '\n\nReactDOM.render(<Component />, document.body);'
    );

    editor.insert(code);

    var range = new Range();
    range.setStart(allowedLines[0] - 1, 0);
    range.setEnd(allowedLines[0] - 1, 80);
    session.addMarker(range, "editable-highlight");

    // prevent passsing event key if the cursor line does not meet our criteria
    editor.keyBinding.addKeyboardHandler({
        handleKeyboard : function(data, hash, keyString, keyCode, event) {
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

    // refresh on change
    // todo: get expected output from JSON
    editor.on('change', window._.debounce(function() {
         onEditorChange(editor.getValue(), 'Hello World!', outputNode, errorListNode);
    }, 500));

    /**
     * Refreshes Ace editor on change.
     *
     * @param {String} editorValue - The editor value.
     * @param {String} expectedOutput - The expected output.
     * @param {DOMElement} outputNode - The output DOM element.
     * @param {DOMElement} errorListNode - The error list DOM element.
     */
    function onEditorChange(editorValue, expectedOutput, outputNode, errorListNode) {
        var errorContainerNode = errorListNode.parentNode;
        errorListNode.innerHTML = '';
        renderOutput(editorValue, outputNode, errorListNode);
        // todo: hardcode expected output for now
        validateOutput(editorValue, outputNode.innerHTML, expectedOutput);
        console.log(errorListNode.innerHTML.length);

        if (errorListNode.innerHTML.length < 1) {
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
     * @param {DOMElement} outputNode - The output DOM element.
     * @param {DOMElement} errorListNode - The error list DOM element.
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

    /**
     * Validates the editor output.
     *
     * @param {String} editorValue - The editor value.
     * @param {String} outputHTML - The inner HTML of the output DOM element.
     * @param {String} expectedOutput - The expected output.
     */
     function validateOutput(editorValue, outputHTML, expectedOutput) {
        // if answer is correct alert us
        if (outputHTML.indexOf(expectedOutput) >= 0) {
            alert('You got it!');
        }
     }
})();
