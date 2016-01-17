(function(){
    'use strict';
    
    // initialize editor
    var ace = window.ace;
    var Range = ace.require('ace/range').Range;
    var editor = window.ace.edit('editor');
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
    editor.on('change', function() {
        renderOutput();
        verifyOutput();
        }
    });
    
    function intersects(range) {
        return editor.getSelectionRange().intersects(range);
    }

    
    /**
     * Renders the editor output in the iframe.
     */
    function renderOutput() {
        try {
            var editorVal = editor.getValue();
            var renderComponentCode = "ReactDOM.render(<Component/>, document.getElementById('output'))";
            var transpiledCode = babel.transform(editorVal + renderComponentCode).code;
            
            // Run the transpiled code
            eval(transpiledCode);
            
        } catch (e) {
            console.log(e);
        }
    }
    
    /**
     * Verifies the editor output to match expected output
     */
     function verifyOutput() {
         try {
            // if answer is correct alert us
            if(document.querySelector('#output').innerHTML.indexOf('Hello World!')>=0){
                alert('You got it!');
            }   
         } catch(e) {
            console.log(e); 
         }
     }
})();
