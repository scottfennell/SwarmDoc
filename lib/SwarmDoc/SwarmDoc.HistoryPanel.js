/* SwarmDoc.HistoryPanel.js */

SwarmDoc.HistoryPanel = Ext.extend(Ext.Panel, {
	pageId: null,
	layout: 'border',
	

    //unfortunatly doing things this way, i cant pass vars into constructior
    initComponent: function(){
        
        if(this.currentPage == undefined){
            alert("currentPage non-existant in history panel, not passed on construction");
            return;
        }
		
        this.addEvents({
    	    "closePanel": true,
    	    "showHistory": true, //I dont know what the true applies to
    	    "showHistoryDiff": true
    	});
		
    	//Unsure if this needs to be 'cleared' first       
        var outHtml = '';//SwarmDoc.Templates.hist.apply(this.currentPage);
        
        var headerHtml = "<h1>"+this.currentPage.title+"</h1>";
		if(this.currentPage.info != ''){
			//If there is any content in the 
		}
		if(this.currentPage.permission_id == undefined){
			this.currentPage.permission_id = 0;
		}else if(this.currentPage.permission_id == ''){
			this.currentPage.permission_id = 0;
		}
		this.perm = new Ext.form.ComboBox({
			id:"PermissionComboBox",
			name: 'permission',
			editable: false,
			disableKeyFilter: true,
			forceSelection: true,
			emptyText: '--select one--',
			triggerAction: 'all',
			mode: 'local',
			store: new Ext.data.SimpleStore({
			id: 0,
			fields: ['value', 'text'],
			data : [
			  	['0', 'Private'], 
				['1', 'Public']	
			 ]
			}),
			valueField: 'value',
			displayField: 'text',
			// Important: by default the POST/GET data
			// for this item will contain the display text
			// not the value. This option creates a hidden field
			// with the same name as the dropdown containing the
			// selected value so it is that which gets returned
			hiddenName: 'permission_id',
			value: this.currentPage.permission_id+"",
    		tpl : (Ext.isAir) ? SwarmDoc.App.Templates.ciCombo : null,
			fieldLabel: "Access",
		});
		this.perm.on('select',this.changePerms,this);
        
		var head = new Ext.Panel({
			id:"BoxHeader1",
			html:headerHtml,	
			border:false
		});
		
        var header = new Ext.FormPanel({
            region: 'north',
			height: 50,
			items:[				
				head,
				this.perm,
			]
        });
		var historyRecord = Ext.data.Record.create([
		    {name: 'id'},
			{name: 'reason'},
		    {name: 'time'}
		]);
        var reader = new Ext.data.JsonReader({
			root: "text",
			id: "id"
		}, historyRecord);
		
		var dummyPage = {body:"CurrentBody", title:"Dummy", history:[{id:0,data:"stuff", page_id:0,time:"10:40"},{id:1,data:"suttefef", page_id:0,time:"10:41"}]};

		this.rowsel = new Ext.grid.CheckboxSelectionModel({
			singleSelect:false, 
			listeners:{
				rowselect: this.rowSelect,
				scope: this
			}
		});

        var gridPanel = new Ext.grid.GridPanel({
            region: "center",
			store: new Ext.data.Store({
                reader: reader,
                data: this.currentPage
            }),
			sm: this.rowsel,
            columns: [
				this.rowsel,
                {id:'id', header: "ID", sortable: true, dataIndex: 'id'},
				{header: "Comments", sortable: false, dataIndex: 'reason'},
				{header: "Time",  sortable: true, dataIndex: 'time'},
            ],
            viewConfig: {
                forceFit: true
            },
            frame:true,
            //title:'History of page...',
            iconCls:'icon-grid'
        });
		this.gridPanel = gridPanel;
    	
        Ext.apply(this, {
			tbar:[
                {
	                text:'Back'
	                ,listeners:
	                    { 
	                        click:this.revert,
                            scope: this
                        }
                },
				{
					text:'Compare',
					listeners:
						{
							click: function(){
								this.compareSelectedTexts(arguments);
							},
							scope: this
						}
				}
			],
			items:[
			    header,
				gridPanel			    
			],
			
			html: outHtml
		});
        SwarmDoc.HistoryPanel.superclass.initComponent.apply(this, arguments);
    },
    
    afterRender: function(){
        SwarmDoc.HistoryPanel.superclass.afterRender.apply(this, arguments);
        //TODO: add listeners for history, and comparison
        //get the body element,
        //replace all the radio buttons with valid ones?
        //add listeners to each button and link
    },
    
    revert : function(o,e){
        SwarmDoc.App.closeHistory();
    },
    
    closePanel : function(){
        this.fireEvent("closePanel",this);
    },
    
    showHistory: function(o,e){
        //where o is the object that is clicked, shoud be able to get teh page 
        if(this.pageId != null){
            //this might work, not sure how we can make sure that o has id set
            var histId = this.currentPage.text[o.id];
            this.fireEvent("showHistory",this.pageId, histId);   
        }
    },
	
	/*
	 * Take two text ids, and open a page that shows them 
	 */
	showHistoryDiff: function(txtidStart, txtidEnd){
		this.fireEvent("showHistoryDiff", this.currentPage, txtidStart, txtidEnd);
	},
	
	gridCompareRenderer: function(val, cell, record, rowIndex, colIndex, store){
		//renderer: function(val, cell, record, rowIndex, colIndex, store) {
        var retval = '<input type="checkbox" onClick="SwarmDoc.App.historyCompare()" name="comp-1-'+rowIndex+'">Compare?';
	    return retval;

	},
	
	rowSelect: function(rs, idx, record){
		//
		record.rowid = idx;
		//check to see how many are selected, if <2 then just set last selected, otherwise, deselect the last selected first
		if (rs.getCount() > 2) {
			//this.lastSelected = record;
			this.rowSelections = rs.getSelections();
			rs.deselectRow(this.rowSelections[this.rowSelections.length-2].rowid);
		}
	},
	
	compareSelectedTexts: function(){
		if(this.rowsel.getCount() > 1){
			//Todo: select the correct to and from 
			var records = this.rowsel.getSelections();
			this.showHistoryDiff(records[0].id, records[1].id);
			
		}else{
			console.error("Error: no selections in the history page");
		}
	},
	
	changePerms: function(field,record,index){
		var newVal = record.data.value;
		this.currentPage.permission_id = newVal;
		if (this.currentPage.database != undefined) {
			this.currentPage.database.savePermissions(this.currentPage);
		}else{
			console.error("Database not defined in current page:",this.currentPage);
		}		
	}
    

});

Ext.reg('histpanel', SwarmDoc.HistoryPanel);
