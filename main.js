(function(){
    'use strict';

    // cache DOM elements
    var outputNode = document.getElementById('output');
    var errorListNode = document.getElementById('error-list');

    // initialize editor
    var ace = window.ace;
    var Range = ace.require('ace/range').Range;
    var editor = ace.edit('editor');
    var session  = editor.getSession();
    var allowedLines = [3];

    editor.setTheme('ace/theme/monokai');
    session.setMode('ace/mode/jsx');

    // code
    var code = (
        'var Component = React.createClass({\n\trender: function() {\n\t\treturn;\n\t}\n});'
    );

    editor.insert(code);

    // initial load
    renderOutput(editor.getValue(), outputNode, errorListNode);

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
    editor.on('change', function() {
        // todo: hardcode expected output for now
        onEditorChange(editor.getValue(), 'Hello World!', outputNode, errorListNode);
    });

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
            var renderComponentCode = '; ReactDOM.render(React.createElement(Component), document.getElementById("output"))';
            var transpiledCode = window.babel.transform(editorValue + renderComponentCode).code;

            // run the transpiled code
            eval(transpiledCode);

        } catch (e) {
            var errorElement = document.createElement('li');
            errorElement.innerHTML = '<span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>' + '<span>' + e + '</span>';
            errorListNode.appendChild(errorElement);
            console.log(e);
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
