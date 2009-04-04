/**
 * @author stillboy
 */
NotoAir.WikiPanel = Ext.extend(Ext.Panel, {
	
	layout: 'anchor',
	//region: 'center',
	viewPanel: '',
	currentPage: '',
	editView: false,
	editor: null,
	parser: null,
	doLayoutOk: false,
	
	
	initComponent:function() {
    	//add custom events for wiki panel
    	this.addEvents({
    	    "changepage": true,
    	    "savepage": true, //I dont know what the true applies to
    	    "showHistory": true
    	});

		this.lastButton = new Ext.Button({
		    text:"<<",
		    listeners:{
		        click: this.lastHistory,
		        scope: this
		    }
		});
		this.allButton = new Ext.Button({
		    text:"All",
		    listeners:{
		        click: this.allHistory,
		        scope: this
		    }
		});
    	this.nextButton = new Ext.Button({
		    text:">>",
		    listeners:{
		        click: this.nextHistory,
		        scope: this
		    }
		});
		
		this.toolBarTitle = new Ext.Toolbar.TextItem("Title");
        // Add a bunch of items at once using different methods.
        // Only the last item added will be returned.
        //var item = this.menu.add(
        //    { text: 'Config Item' }  // new item by config
        //);'
        
		
		Ext.apply(this, {
			tbar:[
			    this.toolBarTitle,
			    "-",
                {
	                text:'Edit'
	                ,listeners:
	                    { 
	                        click:this.switchView,
                            scope: this
                        }
                },
                "->",
                "History",
                this.lastButton,
                this.allButton,
                this.nextButton
			]
		});
		this.currentPage = new NotoAir.Page();
		NotoAir.WikiPanel.superclass.initComponent.apply(this, arguments);
		
	}
	,afterRender:function() {
		// call parent
		NotoAir.WikiPanel.superclass.afterRender.apply(this, arguments);
		// create links
		var page = this.currentPage.getBody();
		this.viewPanel = new Ext.Panel({
			id: 'viewPanel',
			anchor:'100% 100%',
			html: this.currentPage.getBody(),
			autoScroll:true,
			cls:"wikiPage"
			//TODO: add listeners to the viewPanel config object instead of each
		});
		if(this.editView){
		    this.openEditView();
		}else{
		    this.add(this.viewPanel);
		}
		//this.doLayout();
		this.doLayoutOk = true;
	
	}
	
	//only handle opening the editor
	,openEditView: function(){
        this.editor = new Ext.form.HtmlEditor({anchor:"100% 100%"});
	    if(this.historyOffset > 0){
	        this.editor.setValue(this.currentPage.history[this.historyOffset].text);
	    }else{
	        this.editor.setValue(this.currentPage.getBody());
	    }
	    this.add(this.editor);
		if(this.doLayoutOk){
		    console.log('doing layout');
		    this.doLayout();
		}
		if(this.editButton){
		    this.editButton.setText("Save");
		}		
		this.editView = true;
		
		
	}
	
	,openView: function(){
	    this.viewPanel.body.dom.innerHTML = this.currentPage.getBody();
		this.wikify();
		this.add(this.viewPanel);
		if(this.doLayoutOk){
		    this.doLayout();
		}
		if(this.editButton){
		    this.editButton.setText("Edit");
		}
		this.editView = false;
	}
	
	,switchView: function(o,t){
		if(o.text == 'Revert'){
		    console.log("Revert");
		}
		this.editButton = o;
		if(!this.editView){
			//currently watching the view panel
			console.log(this.currentPage);
			console.log(this);
			this.remove(this.viewPanel);
			this.openEditView();
		}else{
			if(this.editor.isDirty()){
    			//let the database handle saves
			    this.currentPage.body = this.editor.getValue();
			    //save the new body to the db and update thecurr
			    this.currentPage = NotoAir.DB.savePage(this.currentPage);
			    this.historyOffset = 0; //reset
			    this.updateHistory();
			    this.fireEvent("savepage", this.currentPage);
			}
			this.remove(this.editor, true);//destroy on unload
			this.editor = null; //kill ref
			this.openView();
		}
	}
	

	
	,openPage: function(pageObject){
	    
	    //TODO: check to see if the editor is open and has been changed before loading new page
	    //TODO: check if page has a body, open editor if not.
	    this.currentPage = pageObject;
	    this.historyOffset = 0;
	    this.updateHistory();
	    
	    this.toolBarTitle.getEl().innerHTML = "<span class='wikiPanel-toolbar-title'>"+pageObject.title+"</span>";

	    
	    if(this.viewPanel == ''){
	        //if the page has not yet been rendered when this is called, then view
	        //panel will not exist. although - setting the page object should be
	        //enough to get this into the display. as it will just replace the default
	        //blank object.
	        if(pageObject.isNew){
	            this.editView = true;//checked on startup
	        }
	    }else{
	        if(this.editView){
	            //in edit mode
	            //just remove the edit view - dont save
			    if(pageObject.isNew){
			        //if this page                             
			        this.editor.setValue('');
			    }else{			    
			        this.remove(this.editor, true);//destroy on unload
			        this.editor = null; //kill ref
                    this.openView();      
			    }
	        }else{
			    this.viewPanel.body.dom.innerHTML = this.currentPage.getBody();
	        }
	    }
	    this.wikify();
	    this.fireEvent("changepage",pageObject);
        
	}
	
	,wikify: function(){
	    //there should be a better way to do the listeners part, but this works for now
	    //currently this 
        this.viewPanel.body.removeAllListeners()
        var text = NotoAir.WikiParser.parseText(this.currentPage.getBody())
		this.viewPanel.body.dom.innerHTML = text;		
		NotoAir.WikiParser.addListeners(this.viewPanel.body);
	   
	},
	//make listeners
	setViewText : function(txt){
	    this.viewPanel.body.removeAllListeners();
	    this.viewPanel.body.dom.innerHTML = txt;
	    NotoAir.WikiParser.addListeners(this.viewPanel.body);
	},
	
	/*History button event handlers*/
	
	lastHistory : function(e,t){
	    this.historyOffset++;
	    //sanity check, also done in Page.
	    if(this.historyOffset<this.currentPage.history.length){
	        var textCmp = NotoAir.WikiParser.parseText(
				this.doDiff(this.currentPage.getHistoryOffset(this.historyOffset-1),//startText
		            this.currentPage.getHistoryOffset(this.historyOffset))//endText
	        );
	        this.setViewText(textCmp);
	        this.updateHistory();//update buttons
	    }else{
	        this.updateHistory();
	        console.warn("historyOffset is not correct, tried to go out of bounds");
	    }
	},
	
	allHistory : function(e,t){
	    this.fireEvent("showHistory", this, this.currentPage, this.historyOffset);
	},
	
	nextHistory : function(e,t){
	    this.historyOffset--;
	    if(this.historyOffset >= 0){
	        var textCmp = NotoAir.WikiParser.parseText(
	            this.doDiff(this.currentPage.getHistoryOffset(this.historyOffset+1),//startText
		            this.currentPage.getHistoryOffset(this.historyOffset))//endText
	        );
	        this.setViewText(textCmp);
	        this.updateHistory();//update button
	    }else{
	        this.historyOffset = 0;
	        this.updateHistory();//update buttons
	    }
	    
	}
	
	//Update the history buttons
	,updateHistory: function(){
        //Update history buttons
        //If we have history, or more than 1
	    if(this.currentPage.history.length>1){
	        if(this.historyOffset>0){
	            if(this.historyOffset<this.currentPage.history.length-1){
	                //disable last history (we are at the end)
	                this.lastButton.enable();
	            }else{
	                this.lastButton.disable();
	            }
	            //the next button will always be available, if the history offset is not 0
	            this.nextButton.enable();
   	        }else{
                //last is valid becauset current page has history
	            this.lastButton.enable();
	            //disable next button, if historyOffset is 0, then we are displaying the most recent
	            this.nextButton.disable();
	        }
	        //if there is any history, enable the 'all' button
	        this.allButton.enable();
	    }else{
	        //disable all buttons, no history available
	        this.lastButton.disable();
	        this.allButton.disable();
	        this.nextButton.disable();
	    }

	},
	
	doDiff : function(startText, endText){
	    //startText is the what we are transitioning from
	    //endText is what we are transitioning to
	    //TODO: make the diff mods go away after a short period of time
	    var startElement = document.createElement('div');
	    startElement.innerHTML = startText;
	    var endElement = document.createElement('div');
	    endElement.innerHTML = endText;
	    console.log("Start Element", startElement);
	    console.log("End element", endElement);
	    
	    //return diffString(startText,endText);
	    return endText;
	    
	},
	
	handleHistory : function(e,t){
	    //alert("history");
	    //TODO: limit the height and add a scroll bar
	    console.log(this.currentPage.history[t.histid].text);
	    console.log(t);
	    if(t.histid != undefined){
	        Ext.Msg.show({
               title:'History',
               msg: this.currentPage.history[t.histid].text,
               //buttons: Ext.Msg.YESNOCANCEL,
               //fn: processResult,
               //animEl: 'elId',
               //icon: Ext.MessageBox.QUESTION
            });
   	        //this.historyViewer = new Ext.Msg.alert('History', this.currentPage.history[t.histid].text);
	    }
	}
});
Ext.reg('wikipanel', NotoAir.WikiPanel);
