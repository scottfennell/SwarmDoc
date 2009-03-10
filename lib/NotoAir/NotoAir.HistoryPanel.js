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
    	    "showHistory": true //I dont know what the true applies to
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

		var rowsel = new Ext.grid.CheckboxSelectionModel({
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
			sm: rowsel,
            columns: [
				rowsel,
                {id:'id', header: "ID", sortable: true, dataIndex: 'id'},
                //{header: "Page ID", sortable: true, dataIndex: 'page_id'},
                //{header: "Time",  sortable: true, renderer: Ext.util.Format.dateRenderer('m/d/Y'), dataIndex: 'time'},
				{header: "Time",  sortable: true, dataIndex: 'time'},
				//{header: "Compare",  sortable: false, dataIndex: 'time', renderer:this.gridCompareRenderer},
            ],
            viewConfig: {
                forceFit: true
            },
            //sm: new Ext.grid.RowSelectionModel({singleSelect:true}),
            //width:600,
            //height:300,
            frame:true,
            title:'History of page...',
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
	
	gridCompareRenderer: function(val, cell, record, rowIndex, colIndex, store){
		//renderer: function(val, cell, record, rowIndex, colIndex, store) {
        var retval = '<input type="checkbox" onClick="NotoAir.App.historyCompare()" name="comp-1-'+rowIndex+'">Compare?';
	    return retval;

	},
	
	rowSelect: function(rs, idx, record){
		//I am managing selections from the this.selections array, once compare is pressed, then we should 
		//get those bits....
		//console.log("Row Select", arguments);
		//var selections = rs.getSelections();
		//for(var i = 0; i < selections.length; i++){
		//	console.log(selections[i].data.id);
		//}
		if(this.selections != undefined && this.selections.length>1){
			var first = this.selections.shift();
			var firstRecord = this.selectionsRecord.shift();
			rs.deselectRow(first);
			console.log(record);
			this.selections.push(idx);
			this.selectionsRecord.push(record);
		}else{
			if(this.selections != undefined){
				this.selections.push(idx)
				this.selectionsRecord.push(record);
			}else{
				this.selections = [idx];
				this.selectionsRecord = [record];
			}
		}
		
		//return false;
	},
	
	compareSelectedTexts: function(){
		console.log("Test of output");
		if(this.selections.length == 2){
			console.log("compare");
			var selectOne = NotoAir.DB.getTextFromID(this.selectionsRecord[0].id);
			var selectTwo = NotoAir.DB.getTextFromID(this.selectionsRecord[1].id);	
			console.log(selectOne,selectTwo);
		}else{
			console.log("Error: no selections in the history page");
		}
	}
    

});

Ext.reg('histpanel', NotoAir.HistoryPanel);
