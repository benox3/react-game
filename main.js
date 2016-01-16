(function(){
    'use strict';

    var scripts = [
        '//cdnjs.cloudflare.com/ajax/libs/babel-core/5.8.24/browser.min.js',
        '//cdnjs.cloudflare.com/ajax/libs/react/0.14.6/react.js',
        '//cdnjs.cloudflare.com/ajax/libs/react/0.14.6/react-dom.js'
    ];
    
    //define iframe
    var iframe = document.getElementById('output');
    var outputDocument;
    if (iframe.contentDocument) {
        outputDocument = iframe.contentDocument;
    } else if (iframe.contentWindow) {
        outputDocument = iframe.contentWindow.document;
    } else {
        outputDocument = iframe.document;
    }
    
    // initialize editor
    var ace = window.ace;
    var Range = ace.require('ace/range').Range;
    var editor = window.ace.edit('editor');
    var session  = editor.getSession();
    var allowedLines = [3];
    editor.setTheme('ace/theme/monokai');
    session.setMode('ace/mode/jsx');

    
    
    /*
    var session  = editor.getSession();
    var Range    = ace.require("ace/range").Range;
    var range    = new Range(3);
    var markerId = session.addMarker(range, "readonly-highlight");
    
    range.start  = session.doc.createAnchor(range.start);
    range.end    = session.doc.createAnchor(range.end);
    range.end.$insertRight = true;
    */

    // code
    var code = (
        'var Component = React.createClass({\n\trender: function() {\n\t\treturn;\n\t}\n});'
    );
    
    

    editor.insert(code);
        
    // initial load
    renderOutput();
    
    var range = new Range();
    range.setStart(allowedLines[0]-1, 0);
    range.setEnd(allowedLines[0]-1, 80);
    var markerId = session.addMarker(range, "editable-highlight");
    
    // Prevent passsing event key if the cursor line does not meet our criterea
    editor.keyBinding.addKeyboardHandler({
        handleKeyboard : function(data, hash, keyString, keyCode, event) {
            if (hash === -1 || (keyCode <= 40 && keyCode >= 37)) return false;
            
            if (intersects(range) === false) {
                return {command:"null", passEvent:false};
            }
        }
    });
    
    // refresh on change
    editor.on('input', _.throttle(function() {
        renderOutput();
        
        //if answer is correct
        if(outputDocument.querySelector('#answer div').innerHTML.indexOf('Hello World!')>=0){
            alert('you got it!')   
        }
        
    }, 500));
    
    function intersects(range) {
        return editor.getSelectionRange().intersects(range);
    }

    
    /**
     * Renders the editor output in the iframe.
     */
    function renderOutput() {
        outputDocument.open();
        outputDocument.writeln('<html><head>');
        
        // load external scripts
        for (var i in scripts) {
            outputDocument.writeln('<script src="' + scripts[i] +'"></script>');
        }
        
        var editorVal = editor.getValue() + ';ReactDOM.render(<Component />, document.getElementById("answer"));';
        
        var result = '';
        result = '</head><body><div id="answer"></div>' +
                 '<script type="text/babel">' +
                 editorVal +
                 '<\/script>' +
                 '</body></html>';
        outputDocument.writeln(result);
        outputDocument.close();
    }
})();
