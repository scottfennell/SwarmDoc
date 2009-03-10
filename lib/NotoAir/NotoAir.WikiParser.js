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
		    for(var i = 0; i<this.parsers.length; i++){
			    console.log(this.parsers[i]);
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
            delegate: this.className,
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
	    
	    console.log("Found "+count+" sections for "+this.openString+" : "+this.closeString);
	    console.log("output text:\n"+txt);
	    return txt;
	}
}

var WikiLinkParser = new NotoAir.Parser("[[", "]]",function(txt){
    return "<span class='wikiLink'>"+txt+"</span>";
});

NotoAir.WikiParser.addParser(WikiLinkParser);

