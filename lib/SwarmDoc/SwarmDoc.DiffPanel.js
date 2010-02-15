/**
 * @author stillboy
 */
/* SwarmDoc.HistoryPanel.js */

SwarmDoc.DiffPanel = Ext.extend(Ext.Panel, {
	pageId: null,
	//layout: 'border',
	startId: 0, //should be overridden in configuration
	endId: 1,
	

    //unfortunatly doing things this way, i cant pass vars into constructior
    initComponent: function(){
        
        if(this.currentPage == undefined){
            alert("currentPage non-existant in history panel, not passed on construction");
            //return;
        }
		
        this.addEvents({
    	    "closePanel": true,
    	    //"showHistory": true //I dont know what the true applies to
    	});
		
		var bodyHtml = "<pre>"+this.getDiffText(this.startId,this.endId)+"</pre>";
		//var bodyHtml = this.getDiffText(this.startId,this.endId);
		
        Ext.apply(this, {
			tbar:[
                {
	                text:'Back'
	                ,listeners:
	                    { 
	                        click:this.backButton,
                            scope: this
                        }
                }
			],
			
			html: bodyHtml
		});
        SwarmDoc.DiffPanel.superclass.initComponent.apply(this, arguments);
    },
    
    afterRender: function(){
        SwarmDoc.DiffPanel.superclass.afterRender.apply(this, arguments);
    },
	
	backButton : function(o,e){
		//back button listener
		//was for revert -> SwarmDoc.App.closeHistory();
		this.fireEvent("closePanel",this);
	},
    
    closePanel : function(){
        this.fireEvent("closePanel",this);
    },
	
	//
	showDiffPage : function(page, startId, endId){
		this.currentPage = page;
		this.startId = startId;
		this.endId = endId;
		//TODO: showDiffPage - insert into panel body
	},
	
	getDiffText : function(start,end){
		//start and end are the ids in the current page...
		if(this.currentPage != undefined){
			var startOff = -1;
			var endOff = -1;
			//TODO: fix this... it should be done a better way - but....
			for(var i = 0; i<this.currentPage.text.length; i++){
				if(this.currentPage.text[i].id == start){
					startOff = i;
				}
				if(this.currentPage.text[i].id == end){
					endOff = i;
				}
			}
			var h1text = this.currentPage.getHistoryOffset(startOff);
			var h2text = this.currentPage.getHistoryOffset(endOff);
			var out = diffString(h1text, h2text);
			//CORRECT return is here.
			return out;
		}else{
			console.error("There is no currentPage set in DiffPanel, cannot compare texts.");
		}
		return "";//return an empty string if I get here
	}
});

Ext.reg('diffpanel', SwarmDoc.DiffPanel);
