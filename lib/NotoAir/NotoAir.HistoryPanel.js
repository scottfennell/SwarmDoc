/* NotoAir.HistoryPanel.js */

NotoAir.HistoryPanel = Ext.extend(Ext.Panel, {
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
        var outHtml = NotoAir.Templates.hist.apply(this.currentPage);
        
        var headerHtml = "<h1>"+this.currentPage.title+"</h1>";
        
        var header = new Ext.Panel({
            region: 'north',
            html: headerHtml
        });
		console.log("History sux");
		
		console.log("History Panel");
		var historyRecord = Ext.data.Record.create([
		    {name: 'id'},
			//{name: 'data'},                  // Map the Record's "firstname" field to the row object's key of the same name
		    //{name: 'page_id'},  // Map the "job" field to the row object's "occupation" key
		    {name: 'time'}
		]);
		console.log("History Panel 2");
        var reader = new Ext.data.JsonReader({
			root: "history",
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
								console.log(this);
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
        NotoAir.HistoryPanel.superclass.initComponent.apply(this, arguments);
    },
    
    afterRender: function(){
        NotoAir.HistoryPanel.superclass.afterRender.apply(this, arguments);
        //TODO: add listeners for history, and comparison
        //get the body element,
        //replace all the radio buttons with valid ones?
        //add listeners to each button and link
    },
    
    revert : function(o,e){
        NotoAir.App.closeHistory();
    },
    
    closePanel : function(){
        this.fireEvent("closePanel",this);
    },
    
    showHistory: function(o,e){
        //where o is the object that is clicked, shoud be able to get teh page 
        if(this.pageId != null){
            //this might work, not sure how we can make sure that o has id set
            var histId = this.currentPage.history[o.id];
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
        var retval = '<input type="checkbox" onClick="NotoAir.App.historyCompare()" name="comp-1-'+rowIndex+'">Compare?';
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
			console.log("Error: no selections in the history page");
		}
	}
    

});

Ext.reg('histpanel', NotoAir.HistoryPanel);
