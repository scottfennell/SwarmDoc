/**
 * @author stillboy
 */

Ext.ns("NotoAir");

NotoAir.app = function(){
    var count = 0; // Private Variable for the module. Not accessible from outside
    var increaseCount = function(){ // Private function. Not accessible from outside
        count++;
    }
	//Initilize current page data
	var currPage = {
		name: 'MainPage',
		text: ''
	}
 
    return {
        init : function(){ // Privileged method. Can be called from outside
            // Here comes the initialisation code
        }
    }
}();

NotoAir.page = function(){
	//page storage object, this object will store all the page data, such as body, title and
	//settings - this object is a data sync, cannot communicate with the db, as of right now
	
	var body = '';
	var title = '';
	var settings = [];
	var tags = [];
	var history = [];
	
	return {
        // public properties, e.g. strings to translate
 
        // public methods
        init: function(new_title) {
            alert('Application successfully initialized '+new_title);
			this.title = new_title;
        }
		,setBody: function(new_body){
			this.body = new_body;
		}
		,getBody: function(){
			return this.body;
		}
		,setTags: function(tag){
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
		,getTags: function(tag){
			return this.tags;
		}
		,getHistory: function(){
			return this.history;
		}
		,setHistory: function(new_history){
			this.history = new_history;
		}
		
    };

	
}

NotoAir.

Ext.onReady(function(){
   // Menu containing actions
    var tabActions = new Ext.Panel({
    	frame:true,
    	title: 'Actions',
    	collapsible:true,
    	contentEl:'actions',
    	titleCollapse: true
    });
 
    // Parent Panel to hold actions menu
    var actionPanel = new Ext.Panel({
    	id:'action-panel',
    	region:'west',
    	split:true,
    	collapsible: true,
    	collapseMode: 'mini',
    	width:200,
    	minWidth: 150,
    	border: false,
    	baseCls:'x-plain',
    	items: [tabActions]
    });
	
	var viewPanel = new Ext.Panel({
		id: 'viewPanel',
		anchor:'100% 100%',
		html: 'Sinvertical rocks'
	})
 
    // Main (Tabbed) Panel
    var mainPanel = new Ext.Panel({
		region:'center',
		layout:'anchor',
		tbar:[
			{text:"editView",handler:editView},
			{text:"ok", handler: okHandler}	
		]

    });
	
	mainPanel.add(viewPanel);
	mainPanel.doLayout();
 
    // Configure viewport
    viewport = new Ext.Viewport({
           layout:'border',
           items:[actionPanel,mainPanel]});
		   
	function addTab(tabTitle, targetUrl){
		
    }
	
	function editView(){
		alert("EditView");
		var curr = mainPanel.findById('viewPanel');
		if(curr!=null){
			//the view is active, create an editview
			var currContents = curr.body.dom.innerHTML;
			var newEdit = new Ext.form.HtmlEditor({anchor:"100% 100%"});
			newEdit.setValue(currContents);
			mainPanel.remove(curr);
			mainPanel.add(newEdit);
			mainPanel.doLayout();
		}else{
			var curr = mainPanel.getComponent(0);
			var currContents = curr.getValue();
			mainPanel.remove(curr, true);//destroy on unload
			viewPanel.body.dom.innerHTML = currContents;
			mainPanel.add(viewPanel);
			mainPanel.doLayout();
		}
	}
	
	function okHandler(){
		alert("okHandler");
	}
 
    // Update the contents of a tab if it exists, otherwise create a new one
    function updateTab(tabId,title, url) {
    	var tab = tabPanel.getItem(tabId);
    	if(tab){
    		tab.getUpdater().update(url);
    		tab.setTitle(title);
    	}else{
    		tab = addTab(title,url);
    	}
    	tabPanel.setActiveTab(tab);
    }
 
    // Map link ids to functions
    var count = 0;
    var actions = {
    	'create' : function(){
    		addTab("New Tab",'loripsum.html');
    	},
    	'use' : function(){
    		// Toggle between sample pages
    		updateTab('tab1','Replaced ' + count + ' Times','sample'+(count%2)+'.html');
    		count++;	    		
    	}
    };
 
    function doAction(e, t){
    	e.stopEvent();
    	actions[t.id]();
    }
 
    // This must come after the viewport setup, so the body has been initialized
    actionPanel.body.on('mousedown', doAction, null, {delegate:'a'});
});


