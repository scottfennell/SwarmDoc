// Ext.ux.HTMLEditorStyles
// a plugin that add the styles list to the Ext.ux.HtmlEditor toolbar
Ext.ux.HTMLEditorStyles = function(s) {

  // PRIVATE

  // pointer to Ext.ux.HTMLEditor
  var editor;
  
  // styles list
  var styles = s;

  // ensure styles is an array
  if (! styles instanceof Array) {
    styles = [styles];
  }

  // include the No Style option
  // add defualt styles
  styles = [
  	{
  		text: "No Style", 
		value: "none"
	},
	{
		text: "Heading 1",
		value: "tag-h1",
	},
	{
		text: "Heading 2",
		value: "tag-h2",
	},
	{
		text: "Heading 3",
		value: "tag-h3",
	},
	{
		text: "Heading 4",
		value: "tag-h4",
	},
	{
		text: "Paragraph",
		value: "tag-p",
	},
	{
		text: "Blockquote",
		value: "tag-blockquote",
	},
  ].concat(styles);

  // update the styles combobox (runs when editorevent occurs in the editor)
  //for showing what style is slected
  var updateCombo = function() {
    var element =  editor.win.getSelection().anchorNode;
    var parent = getParentStyleElement(element);
	if(typeof(parent)=='object'){
		if (parent.combotag != undefined) {
			var style = parent.combotag;
		}
		else {
			var style = parent.className;
		}
	}else{
		var style = 'none';
	}
    if (editor.tb.items.map.style.el.value != style) {
      editor.tb.items.map.style.el.value = style;
    }
  }
  
  // this function gets the parent style property of an element.
  // it searches the parent hierarchy until it finds one
  var getParentStyleElement = function(element) {
    if (element) {
      if (element.nodeType == 1) {
	  	if (element.tagName.toLowerCase() == "span" && element.className != "") {
	  		return element;
	  	}else{
			//see if this maps to a style?
			var tagname = "tag-"+element.tagName.toLowerCase();
			for(var i=0; i<styles.length;i++){
				if (styles[i].value == tagname) {
					//return element;
					//return tagname;
					element.combotag = tagname;
					return element;
				}
			}//if this falls through then keep recursing
			return getParentStyleElement(element.parentNode);
		}
      }else {
        return getParentStyleElement(element.parentNode);
      }
    }
  }
  

  
  // perform the style request on the selected text.
  var doStyleWebkit = function(event, el) {
    // remove a style (performed if No Style is selected).
    // if the className is the only attribute of the element
    // then the entire element is removed
    var removeStyle = function(element,selection) {
      element.removeAttribute('class');
	  //webkit mod, get the correct document
	  if(selection){
	  }else{
	  	//TODO fix selection undefined bug
	  	console.error("selection is undefined, failed to remove style",element);	  	
		//not sure why this happens, but it wont work.
		return;
	  }
	  var odoc = selection.baseNode.ownerDocument;
	  var wrapper = odoc.createElement("span");
      wrapper.appendChild(element.cloneNode(false));
      if (wrapper.innerHTML.toLowerCase() == "<span></span>") {
        var fragment = document.createDocumentFragment() ;
        for (var i = 0; i < element.childNodes.length; i++) {
           fragment.appendChild(element.childNodes[i].cloneNode(true));
         }
        element.parentNode.replaceChild(fragment, element);
      }
    }

    // remove the styles of any children (within selected text).
    // searches entire child hierarchy so that selected text
    // now has only one style element
    var removeChildStyle = function(element,selection) {
      for (var i = 0; i < element.childNodes.length; i++) {
        var child = element.childNodes[i];
        if (child.nodeType == 1) {
          removeChildStyle(child,selection);
          if (child.tagName.toLowerCase() == "span") {
            removeStyle(child,selection);
          }
        }
      }
    }
	
	var getTag = function(val){
		//check if its a tag, if 
		var sub =  val.substr(0,3);
		if(sub == 'tag'){
			var tag = val.split("-")[1];
			return tag;
		}else{
			return false;
		}
	}
	
	var getText = function(node){
		//go through and get the text from 
		var text = '';
		for(var i=0; i<node.childNodes.length;i++){
			if(node.childNodes[i].nodeType == 3){
				text +=node.childNodes[i].nodeValue;
			}else{
				text +=getText(node.childNodes[i]);
			}
		}
		return text;
	}

    // get selected text
    var selection = editor.win.getSelection();

    // get the chosen style from the style combobox
    var style = el.value;

    // if No Style is chosen then remove the style from the parent
    if (style == "none") {
    	var element = selection.anchorNode;
	    var parent = getParentStyleElement(element);
		if (parent.combotag != 'undefined') {
	  		if(parent.childNodes.length > 0){
				var beforenode = parent;
				for(var i = parent.childNodes.length-1; i>=0; i--){
					parent.parentNode.insertBefore(parent.childNodes[i],beforenode);
					beforenode = parent.childNodes[i];
				}
			}
			parent.parentNode.removeChild(parent);
		} else {
			removeStyle(parent, selection);
		}
    } else {  // else apply the style to the selected text
		if (! selection.isCollapsed) {
			//webkit needs the correct document...
			var odoc = selection.baseNode.ownerDocument;
			//check for previous style
			var celement = selection.anchorNode;
			//if the selected element is part wrapped in a 
			var parent = getParentStyleElement(celement);
			if(typeof(parent)=='object'){
				if (parent.combotag != undefined) {
					/*
					 * If i have a parent tag (from this interface), then find out if i have 
					 * selected all the text if i have then we want to change, if no, then 
					 * just apply this tag as we normally would.
					 */
					var selectedText = selection.toString();
					var parentText = Ext.util.Format.trim(getText(parent));
					if(selectedText == parentText){
						//selected all, remove parent and replace with this element

						var tag = getTag(style);
						if (tag) {
							var element = odoc.createElement(tag);
						} else {
							var element = odoc.createElement("span");
						}
						for (var i = 0; i < selection.rangeCount; i++) {
							element.appendChild(selection.getRangeAt(i).extractContents());
						}
						if(!tag)element.className = style;
						removeChildStyle(element);
						//selection.getRangeAt(0).insertNode(element);
						parent.parentNode.replaceChild(element,parent);
						// perform required toolbar operations
					    editor.updateToolbar();
			    		editor.deferFocus();
						return;
					}
				}
				else {
					var oldstyle = parent.className;
				}
			}else{
				var oldstyle = 'none';
			}
			
			var tag = getTag(style);
			if (tag) {
				var element = odoc.createElement(tag);
			} else {
				var element = odoc.createElement("span");
			}
			for (var i = 0; i < selection.rangeCount; i++) {
				element.appendChild(selection.getRangeAt(i).extractContents());
			}
			if(!tag)element.className = style;
			removeChildStyle(element);
			selection.getRangeAt(0).insertNode(element);
		}
    }

    // perform required toolbar operations
    editor.updateToolbar();
    editor.deferFocus();
  }
  
  // PUBLIC

  return {

    // Ext.ux.HTMLEditorStyles.init
    // called upon instantiation
    init: function(htmlEditor) {
      	editor = htmlEditor;

		// add the styles combo and spacer to the toolbar.
		// insert before the fontname combo
		editor.tb.insertToolsBefore('fontname', [{
		  itemId: 'style',
		  xtype: 'tbcombo',
		  cls: 'x-font-select',
		  opts: styles,
		  handler: doStyleWebkit,
		  scope: this
		}, ' ']);
		
		// add listener to editorevent when editor is rendered
		editor.on('render', function() {
		
		  // if editorevent occurs then update the styles combobox
		  editor.on("editorevent", updateCombo, this);
		}, this);
    }
  }
}
