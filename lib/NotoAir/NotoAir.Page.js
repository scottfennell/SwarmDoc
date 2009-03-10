/**
 * @author stillboy
 */

NotoAir.Page = function(configObj){
	//page storage object, this object will store all the page data, such as body, title and
	//settings - this object is a data sync, cannot communicate with the db, as of right now
	
	this.body = '';
	this.title = '';
	this.settings = [];
	this.tags = [];
	this.history = [];
	this.database = null;    
	this.textId = null;
	this.isNew = true;
	
    if(configObj != undefined){
        this.database = configObj.database;
    }
	
	this.init = function(new_title){
    //function init(new_title) {
        alert('Application successfully initialized '+new_title);
		this.title = new_title;
    }
	
	this.setBody  = function(new_body){
		this.body = new_body;
	}
	this.getBody = function(){
	//function getBody(){
		return this.body;
	}
	
	//SAVE IS NOT CURRENT USED, SEE SAVE IN DB..
	this.save = function(newtext){
	    //should only be called if there where changes made - 
	    this.isNew = false;
	    if(this.database != null){
	        console.log("saving page with updated text: "+this.title+" text:"+newtext);
	        //add the old body to the history, update the body
	        this.addHistory();//save current page to history
	        this.body = newtext;
	        this.database.updateText(this);
	    }else{
	        console.log("database is null, cannot call 'save' from page object");
	    }
	    
	}
	
	this.setTags = function(tag){
		//tag is either an object, array or string  use accordingly
		switch (Ext.type(tag)) {
			case "array":
				Ext.each(tag, addLink, this);
				break;
			case "object":
				this.tags[this.tags.length] = tag;
				//this.tpl.overwrite(this.body, {links:this.links});
				break;
			case "string":
				this.tags[this.tag.length] = {
					tag: tag
				};
				break;
			default:
				console.log("Adding link to links panel is wrong type:" + linkObj);
		}
	}
	/**
	 * Get the text from the id in the database.
	 * TODO: should make sure that this textId coincides with the current page, currently it
	 * will return any text with the id given
	 * @param {Object} histId
	 */
	this.getHistoryId = function(histId){
		//
		var text  = "";
		try{
			//use this to load the history of this page into the page object.
			text = this.database.getTextFromID(histId);
		}catch(e){
			console.error(e)
			console.log("database is not defined in the current page, make sure and pass database in configuration parameters");			
		}
		return text;
		
	}
	/**
	 * get the historical text at historyOffset [0 is current, 1 is the prior, 2 is the one before that, etc]
	 * @param {Object} historyOffset
	 */
	
	this.getHistoryOffset = function(historyOffset){
		if(historyOffset >= this.history.length){
			console.error("historyOffset passed is too large");
			return "Error getting history text";
		}
		if(this.currentPage.history[historyOffset].text == undefined){
            var histId = this.history[historyOffset].id;//I should know the ids
            this.history[historyOffset].text = this.getHistoryId(histId);
        }
		return this.history[historyOffset].text;		
	}
	
	this.getTags = function(tag){
		return this.tags;
	}
	
	this.getHistory = function(){
		return this.history;
	}
	
	this.setHistory = function(new_history){
		this.history = new_history;
	}
	
	this.addHistory = function(){
	    //add the current body to the history object
        var dt = new Date();
        //document.write(dt.format(Date.patterns.ISO8601Long));
	    var histObj = {
	        id: this.textId,
	        text: this.body,
	        dtime: dt.format("Y-m-d H:i:s")
	    }
	    this.history.push(histObj);
	    this.textId = -1;
	    this.body = '';
	}
			
};
