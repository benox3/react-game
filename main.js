(function(){
    'use strict';

    var scripts = [
        '//cdnjs.cloudflare.com/ajax/libs/babel-core/5.8.24/browser.js',
        '//cdnjs.cloudflare.com/ajax/libs/react/0.14.6/react.js',
        //'//cdnjs.cloudflare.com/ajax/libs/react/0.14.6/react-with-addons.js',
        '//cdnjs.cloudflare.com/ajax/libs/react/0.14.6/react-dom.js'
    ];

    // initialize editor
    var editor = window.ace.edit('editor');
    editor.setTheme('ace/theme/monokai');
    editor.getSession().setMode('ace/mode/jsx');

    // code
    var code = (
        'var Component = React.createClass({\n\trender: function() {\n\t\treturn <div>Hello, world!</div>;\n\t}\n});'
        + '\n\nReactDOM.render(<Component />, document.body);'
    );
    editor.insert(code);
        
    // initial load
    renderOutput();
    
    // refresh on change
    editor.on('change', renderOutput);
    
    /**
     * Renders the editor output in the iframe.
     */
    function renderOutput() {
        var iframe = document.getElementById('output');
        var outputDocument;
        if (iframe.contentDocument) {
            outputDocument = iframe.contentDocument;
        } else if (iframe.contentWindow) {
            outputDocument = iframe.contentWindow.document;
        } else {
            outputDocument = iframe.document;
        }
    
        outputDocument.open();
        outputDocument.writeln('<html><head>');
        
        // load external scripts
        for (var i in scripts) {
            outputDocument.writeln('<script src="' + scripts[i] +'"></script>');
        }

        outputDocument.writeln('</head><body>');
        outputDocument.writeln('<script type="text/babel">');
        outputDocument.writeln(editor.getValue());
        outputDocument.writeln('<\/script>');
        outputDocument.writeln('</body></html>');
        outputDocument.close();
    }
})();
