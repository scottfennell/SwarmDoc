/**
 * @author stillboy
 * 
 * This file and objects are intended to be static functions that will take wiki text
 * and convert it to an html element 
 */
NotoAir.WikiParser = function(){
	
	return {
	    parsers : [],
	
	    addParser : function(newParser /*NotoAir.WikiParser.prototype*/){
		    this.parsers.push(newParser);	
	    },
	
	    parseText : function(txt){
		    if(txt == null){
				return '';
			}
			for(var i = 0; i<this.parsers.length; i++){
			    txt = this.parsers[i].parse(txt);
		    }
		    return txt;
	    },
	    
	    addListeners : function(el){
	        for(var i = 0; i<this.parsers.length; i++){
			    this.parsers[i].delegate(el);
		    }
	    }
    }
}();

/**
 * NotoAir.Parser
 * This is intended to be extended and provide the common text functions needed to search
 * and replace text
 * 
 * The wrap function will most just wrap a text item in a string, or just replace the text
 * 
 * @param openString String - the opening string. 
 * @param closeString String - the closing string.
 * @param Function - a function that is passed the text that is matched inside openString and closeString
 */

NotoAir.Parser = function(){


	this.type = "NotoAir.WikiParser.parser"; //should stay private so we can verify
	this.openString = null;
	this.closeString = null;
	this.wrapType = true; //if the strings wrap text, ie [[sometext]] vs *sometext
	this.className = ".wikiLink";
	/**
	wrap takes the string that should be wrapped by the parser and wraps it in
	- this is a virtual function
	*/
	this.wrap = function(txt){
	
	    return txt;
	}
	
	//pass in the body element after render? to delegate the onclick action
    this.delegate = function(el){
        el.addListener("click",NotoAir.App.wikiClick,NotoAir.App,{
            delegate: this.className, // so that it only looks for this class
            stopEvent: true
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

	
	this.parse = function(txt){
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
	            break;
	        }
	        currIndex = txt.indexOf(this.openString, startIndex)
	    }
	    return txt;
	}
}

var WikiLinkParser = new NotoAir.Parser("[[", "]]",function(txt){
    return "<span class='wikiLink'>"+txt+"</span>";
});
NotoAir.WikiParser.addParser(WikiLinkParser);

var PageOutlineParser = new NotoAir.Parser("<h1>","</h1>", function(txt){
});

/**
 * External Link
 * usage
 * [http://someaddress] - link
 * [http://someaddress checkmeout] - named link
 */

NotoAir.LinkParser = function(){

	this.type = "NotoAir.WikiParser.parser"; //should stay private so we can verify
	this.openString = '[';
	this.closeString = ']';
	this.wrapType = true; //if the strings wrap text, ie [[sometext]] vs *sometext
	this.className = "externalLink";

	this.wrap = function(txt){
		//This should ha
		var t = txt.split(" ");

		if(t.length < 2){
			//named
			var linkText = "<a href='"+t[0]+"' class='"+this.className+"'>"+t[0]+"</a>";
		}else{
			var linkText = "<a href='"+t[0]+"' class='"+this.className+"'>"+t[1]+"</a>";
		}

	    return linkText;
	}
	
	//pass in the body element after render? to delegate the onclick action
    this.delegate = function(el){

		el.addListener("click",NotoAir.App.linkClick,NotoAir.App,{
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
NotoAir.WikiParser.addParser(new NotoAir.LinkParser);