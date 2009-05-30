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
    	    "showHistory": true,
			"beforeOpenPage" : true,//send page object to edit before
			"afterOpenPage" : true, //send the page element 
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
		this.editSwitchButton = new Ext.Button({
			text:"Edit",
		    listeners:{
		        click: this.switchView,
		        scope: this
		    }
		});
		this.toolBarTitle = new Ext.Toolbar.TextItem("Title");
		this.editreason = new Ext.form.TextField({
			hidden:true,
			grow:true,
			value:"Why?"
		})
		Ext.apply(this, {
			tbar:[
			    this.toolBarTitle,
			    "-",//Seperator
                this.editSwitchButton,
				"-",
				this.editreason,
                "->",//Right alighn
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
			
		this.editor = new Ext.ux.HTMLEditor({
	    	anchor:"100% 100%",
	        styles: ['noto.css'],//This does not work!!!
			plugins: new Ext.ux.HTMLEditorStyles([
			  {text: 'Standard Header', value: 'std_hdr'}
			]),
        });
		
		this.editreason.show();

		if (this.currentPage.text.length > 0) {
			if(this.currentPage.text[this.historyOffset].data == undefined){
				console.warn("Text for this page is not defined",this.currentPage,this.historyOffset);
			}			
			this.editor.setValue(this.currentPage.text[this.historyOffset].data);
		}
		else {
			this.editor.setValue("No Text");
		}
			

	    this.add(this.editor);

		if(this.doLayoutOk){
		    this.doLayout();
		}
		
		if(this.editSwitchButton != null){
		    this.editSwitchButton.setText("Save");
		}else{
			console.log("Text");
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
		if(this.editSwitchButton){
		    this.editSwitchButton.setText("Edit");
		}
		this.editreason.hide();
		this.editView = false;
	},
	
	//only do anything if the editView is enabled.
	showView: function(){
		if(this.editView){
			this._switchView();
		}
	}
	
	/**
	 * public switchView can handle events
	 * @param {Object} o
	 * @param {Object} t
	 */
	,switchView: function(o,t){
		if(o.text == 'Revert'){
		    console.error("Revert not yet hanled");
		}
		this.editSwitchButton = o;
		this._switchView();
	},
	
	_switchView: function(){
		if(!this.editView){
			//currently watching the view panel
			this.remove(this.viewPanel);
			this.openEditView();
		}else{
			if(this.editor.isDirty()){
				//shift array and push the new page into 0
				//TODO: consider validating form values here..
			    this.currentPage.text.unshift({
					data: this.editor.getValue(),
					reason: this.editreason.getValue(),
				});
			    //save the new body to the db and update thecurr
			    this.currentPage = this.currentPage.database.savePage(this.currentPage);
			    this.historyOffset = 0; //reset
			    this.updateHistory();
			    this.fireEvent("savepage", this.currentPage);
			}
			this.remove(this.editor, true);//destroy on unload
			this.editor = null; //kill ref
			this.openView();
		}
	},
	getCurrentPageName: function(){
		//check to see if the current page is set
		if(this.currentPage != undefined && this.currentPage.title != undefined){
			return this.currentPage.title;
		}else{
			return '';
		}
	},
	
	isEditor: function(){
		return this.editView;
	}
	
	,openPage: function(pageObject){
	    //TODO: check to see if the editor is open and has been changed before loading new page
	    //TODO: check if page has a body, open editor if not.
	    this.currentPage = pageObject;
	    this.historyOffset = 0;
	    this.updateHistory();
	    if(!pageObject.edit){
			this.editSwitchButton.hide();
		}else{
			this.editSwitchButton.show();
		}
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
        this.viewPanel.body.removeAllListeners();
        var text = NotoAir.WikiParser.parseText(this.currentPage.getBody());
		this.viewPanel.body.dom.innerHTML = text;
		//Add listeners is the link click listeners
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
	    if(this.historyOffset<this.currentPage.text.length){
	        var textCmp = NotoAir.WikiParser.parseText(
				this.doDiff(this.currentPage.getHistoryOffset(this.historyOffset-1),//startText
		            this.currentPage.getHistoryOffset(this.historyOffset))//endText
	        );
			this.showView();
	        this.setViewText(textCmp);
	        this.updateHistory();//update buttons
	    }else{
			this.historyOffset--;
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
			this.showView();
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
	    if(this.currentPage.text.length>1){
	        //not at most recent, enable next
			if(this.historyOffset>0){
				//can go back at least one more time
	            if(this.historyOffset+1<this.currentPage.text.length){
	                this.lastButton.enable();
	            }else{
	                //disable last history (we are at the end)
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
	    //return diffString(startText,endText);
	    return endText;
	    
	},
	
});
Ext.reg('wikipanel', NotoAir.WikiPanel);
