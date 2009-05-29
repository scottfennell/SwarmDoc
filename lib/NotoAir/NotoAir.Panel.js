/**
 * @author stillboy
 * 
 * NotoAir.Panel
 * This is a generic for panel
 */

NotoAir.Panel = Ext.extend(Ext.form.FormPanel, {
	/*layout: 'border',*/

    initComponent: function(){
        
        if(this.database == undefined){
            alert("database is undefined in all pages");
            return;
        }
		
		if (this.formItems == undefined) {
			this.formItems = [{
				name: "cambells",
				type: "text"
			}, {
				name: "toodles",
				type: 'list'
			}, {
				name: "panic"
			}];
			this.formName = "Generic test form";
		}
		
        this.addEvents({
    	    "closePanel": true,
			"save" : true
    	});

        Ext.apply(this, {
			tbar:[
                {
	                text:'Save & Close'
	                ,listeners:
	                    { 
	                        click:this.closePanel,
                            scope: this
                        }
                },{
					text: 'Close',
					listeners:
	                    { 
	                        click:this.closePanel,
                            scope: this,
							options:{
								save:false
							}
                        }
				}
			],
			items: this.makeItemsFromSql(this.formItems),
			
		});
        NotoAir.Panel.superclass.initComponent.apply(this, arguments);
    },
	
	makeItems:function(){
		var add = false;
		this.fitems = [];
		if(this.formName){
			this.fitems.push(
				new Ext.Panel({
					html:"<h1>"+this.formName+"</h1>",
					bodyBorder:false
				})
			);
		}
		if(this.formItems){
			for(var i =0; i<this.formItems.length;i++){
				if (this.formItems[i].type != undefined) {
					if (this.formItems[i].type == 'text') {
						if (this.formItems[i].lable) {
							var label = this.formItems[i].lable;
						}
						else {
							var label = this.formItems[i].name;
						}
						
						if (this.formItems[i].value) {
							var val = this.formItems[i].value;
						}
						else {
							var val = '';
						}
						
						if(add){
							this.add(new Ext.form.TextField({
								id: this.formItems[i].name,
								fieldLabel: label,
								value: val,
							}));
						}else{
							this.fitems.push(new Ext.form.TextField({
								id: this.formItems[i].name,
								fieldLabel: label,
								value: val,
							}));
						}
					}
					else 
						//TODO fix the list box
						if (this.formItems[i].type == 'list') {
							if (this.formItems[i].lable) {
								var label = this.formItems[i].lable;
							}
							else {
								var label = this.formItems[i].name;
							}
							
							if (this.formItems[i].value) {
								var val = this.formItems[i].value;
							}
							else {
								var val = '';
							}
							
						}
						else 
							if (this.formItems[i].type == 'number') {
							
							}
				}
				else {
						if (this.formItems[i].lable) {
							var label = this.formItems[i].lable;
						}
						else {
							var label = this.formItems[i].name;
						}
						
						if (this.formItems[i].value) {
							var val = this.formItems[i].value;
						}
						else {
							var val = '';
						}
						
						if(add){
							this.add(new Ext.form.TextField({
								id: this.formItems[i].name,
								fieldLabel: label,
								value: val,
							}));
						}else{
							this.fitems.push(new Ext.form.TextField({
								id: this.formItems[i].name,
								fieldLabel: label,
								value: val,
							}));
						}

				}
			}
		}
		return this.fitems;
	},
	
	makeItemsFromSql : function(obj){
		//should be a single record,
		//loop through each entry, 
		this.fitems = [];
		for (attrname in obj) { 
			console.log(attrname);
			console.log(obj[attrname]);
			this.fitems.push(new Ext.form.TextField({
					id: attrname,
					fieldLabel: attrname,
					value: obj[attrname],
			}));
		}
		return this.fitems;
	},
	
	afterRender: function(){
        NotoAir.Panel.superclass.afterRender.apply(this, arguments);
    },

    closePanel : function(e,k){
		console.log(e.text);
		if(e.text == "Close"){
			
		}else{
			this.save();
		}
        this.fireEvent("closePanel",this);
    },
	
	save: function(){
		//get all elements, and 
		var frm = this.getForm();
		var fields = frm.items.items;//array of items in the form.
		var saved = {};
		for(var i=0; i<fields.length;i++){
			console.log(fields[i].id + " : " + fields[i].getValue());
			saved[fields[i].id] = fields[i].getValue();
		}
		saved.original = this.formItems;
		this.fireEvent("save",this,saved);
	}
		
});

Ext.reg('notoairformpanel', NotoAir.Panel);




 
