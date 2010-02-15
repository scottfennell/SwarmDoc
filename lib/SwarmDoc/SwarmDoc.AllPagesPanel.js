/**
 * @author stillboy
 */

SwarmDoc.AllPagesPanel = Ext.extend(Ext.Panel, {

	pageId: null,
	layout: 'border',
	

    //unfortunatly doing things this way, i cant pass vars into constructior
    initComponent: function(){
        
        if(this.database == undefined){
            alert("database is undefined in all pages");
            return;
        }
		
        this.addEvents({
    	    "closeApPanel": true
    	});
		
		this.allPages = {
			pages: this.database.getAllPages()
		};
				       
        var headerHtml = "<h1>All Pages</h1><p>Select the pages and click the options drop down from above for batch operations</p><p>Total pages:"+this.allPages.pages.length+"</p>";
        
		this.apmenu = new Ext.menu.Menu({
		    id: 'basicMenu',
		    items: [{
		            text: 'Delete',
		        },{
					text: 'Make Private',
				},{
					text: 'Make Public',
				}
		    ],
			listeners: {
				click: this.optionsMenu,
				scope: this
			}
		});

		
        var header = new Ext.Panel({
            region: 'north',
            html: headerHtml,
        });
		
		var pageRecord = Ext.data.Record.create([
		    {name: 'id'},
			{name: 'name'},
			{name: 'textcount'},
		    {name: 'time'},
			{name: 'created'},
			{name: 'permission_id'},
			{name: 'username'}
		]);

        var reader = new Ext.data.JsonReader({
			root: "pages",
			id: "id"
		}, pageRecord);
		
		var dummyPage = {body:"CurrentBody", title:"Dummy", history:[{id:0,data:"stuff", page_id:0,time:"10:40"},{id:1,data:"suttefef", page_id:0,time:"10:41"}]};

		this.rowsel = new Ext.grid.CheckboxSelectionModel({
			singleSelect:false, 
			listeners:{
				rowselect: this.rowSelect,
				scope: this
			}
		});

        this.gridPanel = new Ext.grid.GridPanel({
            region: "center",
			store: new Ext.data.Store({
                reader: reader,
                data: this.allPages
            }),
			sm: this.rowsel,
            columns: [
				this.rowsel,
                {id:'id', header: "ID", sortable: true, dataIndex: 'id'},
				{header: "Name", sortable: true, dataIndex: 'name'},
				{header: "Edit Count", sortable: true, dataIndex: 'textcount'},
				{header: "Time", sortable: true,renderer:this.dateRenderer, dataIndex: 'time'},
				{header: "Created", sortable: true, dataIndex: 'created'},
				{header: "Access", sortable:true,renderer:this.permRenderer, dataIndex: 'permission_id'},
				{header: "Username", sortable:true, dataIndex: 'username'}
            ],
			listeners:{
				cellclick: this.cellClickListener,
				scope: this
			},
            viewConfig: {
                forceFit: true
            },
            frame:false,
            //title:'History of page...',
            iconCls:'icon-grid'
        });
		//this.gridPanel = gridPanel;
    	
        Ext.apply(this, {
			tbar:[
                {
	                text:'Back'
	                ,listeners:
	                    { 
	                        click:this.closePanel,
                            scope: this
                        }
                },{
					text: 'Options',
					menu: this.apmenu
				}
			],
			
			items:[
			    header,
				this.gridPanel			    
			],
			
			
			html: "All Pages... loading",
		});
        SwarmDoc.AllPagesPanel.superclass.initComponent.apply(this, arguments);
    },
	
	afterRender: function(){
        SwarmDoc.AllPagesPanel.superclass.afterRender.apply(this, arguments);
        //TODO: add listeners for history, and comparison
        //get the body element,
        //replace all the radio buttons with valid ones?
        //add listeners to each button and link
    },

    closePanel : function(){
        this.fireEvent("closeApPanel",this);
    },
		
	rowSelect: function(rs, idx, record){
		//console.log(rs,idx,record);
	},
	
	cellClickListener: function(grid, rowIndex, columnIndex, e) {
        var record = grid.getStore().getAt(rowIndex);  // Get the Record
        var fieldName = grid.getColumnModel().getDataIndex(columnIndex); // Get field name
        var data = record.get(fieldName);
		
		if(fieldName == 'name'){
			SwarmDoc.App.openPage(data);
			this.fireEvent("closeApPanel",this);
		}
		
    },
	dateRenderer: function(data, cell, record, rowIndex, columnIndex, store) {		
			var dts = Date.parseDate(data, "Y-m-d H:i:s" );
			var ttime = new Date();
			var offset = ttime.getGMTOffset();
			//offset is in format -0600;
			var osHour = parseInt(offset.substr(1,2));//should be 06
			var osMin = parseInt(offset.substr(3,2));
			if(offset[0]=="-"){
				var mul = -1;
			}else{
				var mul = 1;
			}
			dts = dts.add(Date.HOUR, mul*osHour);
			dts = dts.add(Date.MINUTE, mul*osMin);
			
			
			
			var diff = ttime.getElapsed(dts);
			//hour = 3,600,000
			//day = 86,400,000
			//
			if(diff > 86400000){
				//more than 1 day
				if(diff > 172800000){
					//more than 2 days
					if(diff > 2592000000){
						return data;
					}else{
						return "2 days ago";
					}
				}else{
					return "1 day ago";
				}
			}else{
				var hours = diff / 3600000;
				if (hours > 1) {
					hours = Math.floor(hours);
					var minutes = Math.floor((diff % 3600000) / 60000);
					var out = hours+" hours "+minutes+" minutes ago";
				}else{
					var minutes = Math.floor(diff / 60000);
					var out = minutes+" minutes ago";
				}
				return out;
			}
	},
	
	permRenderer: function(data, cell, record, rowIndex, columnIndex, store){
		if(data == 0){
			return 'Private';
		}else if (data == 1){
			return 'Public';
		}else if (data == 2){
			return 'Public Read'
		}else{
			return data;
		}
	},
	
	optionsMenu: function(m, o, e){
		var selectedRecords = this.rowsel.getSelections();		
		switch (o.text){
			case "Delete":
				this.deletePages(selectedRecords);
				break;
			case "Make Private":
				this.makePrivate(selectedRecords);
				break;
			case "Make Public":
				this.makePublic(selectedRecords);
				break;
			default:
				console.warn("Invalid option menu selected");
		}
	},
	
	deletePages:function(records){
		var recordStore = this.gridPanel.getStore();
		for(var i = 0; i< records.length; i++){
			if(this.database.deletePage(records[i].data.id, records[i].data.name)){
				recordStore.remove(records[i]);		
			}
		}
	},
	
	makePrivate:function(records){
		var recordStore = this.gridPanel.getStore();
		for(var i = 0; i< records.length; i++){
			if(this.database.makePrivate(records[i].data.id, records[i].data.name)){
				recordStore.remove(records[i]);		
			}
		}
	},
	
	makePublic:function(records){
		var recordStore = this.gridPanel.getStore();
		for (var i = 0; i < records.length; i++) {
			if (this.database.makePublic(records[i].data.id, records[i].data.name)) {
				recordStore.remove(records[i]);
			}
		}

	}
});

Ext.reg('allpagespanel', SwarmDoc.AllPagesPanel);
