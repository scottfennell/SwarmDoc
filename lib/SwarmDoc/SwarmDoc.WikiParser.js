/**
 * @author stillboy
 * 
 * This file and objects are intended to be static functions that will take wiki text
 * and convert it to an html element 
 */
SwarmDoc.WikiParser = function(){// Ext.extend(Ext.util.Observable, {
    return {
		nowikiOpen:"{nowiki}",
		nowikiClose:"{/nowiki}",
		chunks:[],
		parsers : [],
	    addParser : function(newParser /*SwarmDoc.WikiParser.prototype*/){
		    this.parsers.push(newParser);	
	    },
		/**
		 * Pre-render parser
		 * @param {Object} txt
		 */
	    parseText : function(txt){
		    if(txt == null){
				return '';
			}
			this.chunks = [];
			this.parseNoWiki(txt);
			var finalString = '';
			for (var j = 0; j < this.chunks.length; j++) {
				if(!this.chunks[j].nowiki){
					for (var i = 0; i < this.parsers.length; i++) {
						this.chunks[j].text = this.parsers[i].parse(this.chunks[j].text);
					}
					finalString += this.chunks[j].text;
				}else{
					finalString += this.chunks[j].text;
				}
			}
		    return finalString;
	    },
		
	    /**
	     * Post render
	     * @param {Object} el
	     */
	    addListeners : function(el){
	        for(var i = 0; i<this.parsers.length; i++){
			    this.parsers[i].delegate(el);
		    }
	    },

		parseNoWiki : function(txt){
		    var count = 0;
		    var startIndex = 0;
		    var currIndex = txt.indexOf(this.nowikiOpen, startIndex)
		    while(currIndex>0){
		        //assume index is the start of the open string,
		        var endIndex = txt.indexOf(this.nowikiClose, currIndex)
		        if(endIndex >0){
	    	        var startString = txt.substring(0,currIndex);//the start of matched 
		            var wrapString = txt.substring(currIndex+this.nowikiOpen.length, endIndex);
		            var closeString = txt.substring(endIndex+this.nowikiClose.length);
					this.chunks.push({
						text:startString,
						nowiki:false
					});
					this.chunks.push({
						text:wrapString,
						nowiki:true
					})
					txt = closeString;
		            startIndex = 0;
		            count++;
		        }else{
		            console.warn("Found open tag without close: "+this.nowikiOpen+" index: "+currIndex);
		            break;
		        }
				if (txt.length > 0) {
					currIndex = txt.indexOf(this.nowikiOpen, startIndex);
				}else{
					currIndex = 0;
				}
				if(currIndex<1){
					//There is no more
					this.chunks.push({
						text: txt,
						nowiki: false
					});	
				}
		    }
			
			if(this.chunks.length == 0){
				//add all to to the string
				this.chunks.push({
					text:txt,
					nowiki:false
				});
			}
			
		    return this.chunks;
		}
		
		
	};
    
}();

/**
 * SwarmDoc.Parser
 * This is intended to be extended and provide the common text functions needed to search
 * and replace text
 * 
 * The wrap function will most just wrap a text item in a string, or just replace the text
 * 
 * @param openString String - the opening string. 
 * @param closeString String - the closing string.
 * @param Function - a function that is passed the text that is matched inside openString and closeString
 */

SwarmDoc.Parser = Ext.extend( Ext.util.Observable, {
	
	reg : "",
	wrapType : true, //if the strings wrap text, ie [[sometext]] vs *sometext
	

	//wrap takes the string that should be wrapped by the parser and wraps it in
	//- this is a virtual function
	wrap : function(txt){
	    return txt;
	},
	
	//pass in the body element after render? to delegate the onclick action
    delegate : function(el){
		el.addListener("click",SwarmDoc.App.wikiClick,SwarmDoc.App,{
            delegate: this.className, // so that it only looks for this class
            stopEvent: true
        });
    },
	
	parse : function(txt){
	    //if this object has not been initilized
	    if(this.openString == null||this.closeString==null){
	        console.warn("Parser found without open or close string set returned unavoided");
	        return txt;
	    }
	    var count = 0;
	    var startIndex = 0;
	    var currIndex = txt.indexOf(this.openString, startIndex)
	    while(currIndex>0){
	        //assume index is the start of the open string,
	        var endIndex = txt.indexOf(this.closeString, currIndex)
	        if(endIndex >0){
    	        var startString = txt.substring(0,currIndex);//the start of matched 
	            var wrapString = txt.substring(currIndex+this.openString.length, endIndex);
	            var closeString = txt.substring(endIndex+this.closeString.length);
	            txt = startString+this.wrap(wrapString)+closeString;
	            startIndex = endIndex+this.closeString.length;
	            count++;
	        }else{
	            console.warn("Found open tag without close: "+this.openString+" index: "+currIndex);
	            startIndex = txt.length-1;
	        }
	        currIndex = txt.indexOf(this.openString, startIndex)
	    }
	    return txt;
	},
});

SwarmDoc.Parser.NoWiki = Ext.extend(SwarmDoc.Parser,{

	
	
});

SwarmDoc.Parser.WikiLinkParser = Ext.extend(SwarmDoc.Parser, { //) new SwarmDoc.Parser("[[", "]]",function(txt){
	//This should ha
	openString:"[[",
	closeString:"]]",
	className:".wikiLink",
	
	wrap: function(txt){
		var t = txt.split(" ");
		var nsTest = t[0].split(":");
		
		var link = '';
		var pageName = '';
		
		if (t.length > 1) {
			link = t[0];
			pageName = t[1];
		}
		else {
			if (nsTest.length > 1) {
				pageName = nsTest[1];
			}
			else {
				pageName = t[0];
			}
			link = t[0];
		}
		return "<span id='" + link + "' class='wikiLink'>" + pageName + "</span>";
	}
});

SwarmDoc.WikiParser.addParser(new SwarmDoc.Parser.WikiLinkParser);

var PageOutlineParser = new SwarmDoc.Parser("<h1>","</h1>", function(txt){
});



/**
 * External Link
 * usage
 * [http://someaddress] - link
 * [http://someaddress checkmeout] - named link
 */

SwarmDoc.LinkParser = function(){

	this.openString = '[';
	this.closeString = ']';
	this.wrapType = true; //if the strings wrap text, ie [[sometext]] vs *sometext
	this.className = "externalLink";

	this.wrap = function(txt){
		//This should ha

		var link = '';
		var pageName = '';
		var spcIndex = txt.indexOf(" ");
		if(spcIndex>0){
			link = txt.substring(0,spcIndex);
			pageName = txt.substring(spcIndex);
		}else{
			link = pageName = txt;
		}
	    return  "<a href='"+link+"' class='"+this.className+"'>"+pageName+"</a>";
	}
	
	//pass in the body element after render? to delegate the onclick action
    this.delegate = function(el){

		el.addListener("click",SwarmDoc.App.linkClick,SwarmDoc.App,{
            delegate: "a",
            stopEvent: true,
			preventDefault: true,
        });
    }
	
	//override if exists
	if(arguments.length >1){
        this.openString = arguments[0];
        this.closeString = arguments[1];
        if(arguments.length>2){
            this.wrap = arguments[2];
        }
    }	

	//Need to override this function to make sure it doesnt match for double [[
	this.parse = function(txt){
	    //if this object has not been initilized
	    if(this.openString == null||this.closeString==null){
	        console.warn("Parser found without open or close string set returned unavoided");
	        return txt;
	    }
	    var count = 0;
	    var startIndex = 0;
	    var currIndex = txt.indexOf(this.openString, startIndex)
	    while(currIndex>=0){
	        //assume index is the start of the open string,
			if (txt.charAt(currIndex + 1) != '[') {//should not match the second [, since we skip it here
				var endIndex = txt.indexOf(this.closeString, currIndex)
				if (endIndex > 0) {
					var startString = txt.substring(0, currIndex);//the start of matched 
					var wrapString = txt.substring(currIndex + this.openString.length, endIndex);
					var closeString = txt.substring(endIndex + this.closeString.length);
					txt = startString + this.wrap(wrapString) + closeString;
					startIndex = endIndex + this.closeString.length;
					count++;
				}
				else {
					console.warn("Found open tag without close: " + this.openString + " index: " + currIndex);
					break;
				}
				currIndex = txt.indexOf(this.openString, startIndex);
			}else{
				currIndex = txt.indexOf(this.openString, currIndex+1);
			}			
	    }
	    return txt;
	}
}
SwarmDoc.WikiParser.addParser(new SwarmDoc.LinkParser);
