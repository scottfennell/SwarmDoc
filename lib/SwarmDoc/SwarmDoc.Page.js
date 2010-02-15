/**
 * @author stillboy
 * 
 * SwarmDoc.Page is the object that handles storing and retrieving page data.
 * Currently the intention is to provide a rich js object to help organize a single
 * Page.
 * 
 * This should basically duplicate the database and utilize lazy reads for historical data
 */

SwarmDoc.Page = function(configObj){
	
	this.body = '';//The current body text
	this.title = '';//The title of this page. 
	this.settings = [];//advanced settings, such as permissions
	this.tags = [];//the list of tags.
	this.id = -1; 
	this.text = [];
	
	/**
	 * history 
	 * The history objects are the history of the page in the order of index 0 being the most
	 * recent while length-1 is the very first draft, history should only be guarunteed to 
	 * have the text_id as history[i].id
	 */
	this.history = [];//the list of history objects, history objects ar
	this.database = null;//the link to the current database object
	this.textId = null;//the current text id for body
	this.isNew = true;
	
	
    if(configObj != undefined){
        this.database = configObj.database;
    }
	
	this.init = function(new_title){
		this.title = new_title;
    }
	
	this.setBody  = function(new_body){
		this.body = new_body;
	}
	
	this.getBody = function(){
		if (this.text.length > 0) {
			return this.text[0].data;
		} else {
			return '';//just in case
		}
	}

	
	/**
	 * getTags gets the current tag array
	 * @return Array of tags
	 */
	this.getTags = function(){
		return this.tags;
	}
	
	/**
	 * setTags takes an array, object or string and adds it to the tag array
	 * @param {Object} tag
	 */
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
				console.error("Adding link to links panel is wrong type:" + linkObj);
		}
	}
	
	/**
	 * Get the text from the id in the database.
	 * TODO: should make sure that this textId coincides with the current page, currently it
	 * will return any text with the id given
	 * @param {Object} histId
	 */
	this.getHistoryId = function(histId){
		//TODO: put this page text in the history array here?
		var text  = "";
		try{
			//use this to load the history of this page into the page object.
			text = this.database.getTextFromID(histId,this);
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
		if (historyOffset == -1) {
			console.error("historyOffset passed is too large");
			return "Error - historyOffset is negative"
		}
		if(historyOffset >= this.text.length){
			console.error("historyOffset passed is too large");
			return "Error getting history text";
		}
		//load historical text now...
		if(this.text[historyOffset].data == undefined){
            var histId = this.text[historyOffset].id;
            this.text[historyOffset].data = this.getHistoryId(histId);
        }
		//fix issue if the the text portion is null
		if(this.text[historyOffset].data == null){
			this.text[historyOffset].data = "";
		}
		return this.text[historyOffset].data;		
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
