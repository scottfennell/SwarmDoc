/**
 * @author stillboy
 */

NotoAir.AllPagesPanel = Ext.extend(Ext.Panel, {

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
				       
        var headerHtml = "<h1>All Pages</h1><p>Batch operators go here</p>";
        
		this.apmenu = new Ext.menu.Menu({
		    id: 'basicMenu',
		    items: [{
		            text: 'Delete',
		        }/*,
		        new Ext.menu.Item({
		            text: 'Another item',
		        }),
		        */
		    ],
			listeners: {
				click: this.optionsMenu,
				scope: this
			}
		});

		
        var header = new Ext.Panel({
            region: 'south',
            html: headerHtml,
        });
		
		var pageRecord = Ext.data.Record.create([
		    {name: 'id'},
			{name: 'name'},
		    {name: 'time'}
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
				{header: "Time", sortable: true, dataIndex: 'time'},
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
        NotoAir.AllPagesPanel.superclass.initComponent.apply(this, arguments);
    },
	
	afterRender: function(){
        NotoAir.AllPagesPanel.superclass.afterRender.apply(this, arguments);
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
			NotoAir.App.openPage(data);
			this.fireEvent("closeApPanel",this);
		}
		
    },
	
	optionsMenu: function(m, o, e){
		var selectedRecords = this.rowsel.getSelections();		
		switch (o.text){
			case "Delete":
				this.deletePages(selectedRecords);
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
	}
});

Ext.reg('allpagespanel', NotoAir.AllPagesPanel);
