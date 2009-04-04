/**
 * @author stillboy
 */
/* NotoAir.HistoryPanel.js */

NotoAir.DiffPanel = Ext.extend(Ext.Panel, {
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
        NotoAir.DiffPanel.superclass.initComponent.apply(this, arguments);
    },
    
    afterRender: function(){
        NotoAir.DiffPanel.superclass.afterRender.apply(this, arguments);
    },
	
	backButton : function(o,e){
		//back button listener
		//was for revert -> NotoAir.App.closeHistory();
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
		//the diff functions should be 
		console.log("comparing:"+start+", "+end);
		if(this.currentPage != undefined){
			var startOff = -1;
			var endOff = -1;
			//TODO: fix this... it should be done a better way - but....
			console.log(this.currentPage);
			for(var i = 0; i<this.currentPage.history.length; i++){
				if(this.currentPage.history[i].id == start){
					startOff = i;
				}
				if(this.currentPage.history[i].id == end){
					endOff = i;
				}
			}
			var h1text = this.currentPage.getHistoryOffset(startOff);
			var h2text = this.currentPage.getHistoryOffset(endOff);
			console.log("Comparing texts",startOff,endOff,h1text,h2text);
			var out = diffString(h1text, h2text);
			//CORRECT return is here.
			return out;
		}else{
			console.error("There is no currentPage set in DiffPanel, cannot compare texts.");
		}
		return "";//return an empty string if I get here
	}
    

    

});

Ext.reg('diffpanel', NotoAir.DiffPanel);
