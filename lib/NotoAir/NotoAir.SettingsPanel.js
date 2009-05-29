/**
 * @author stillboy
 */
NotoAir.SettingsPanel = Ext.extend(Ext.form.FormPanel, {
	
	initComponent: function(){
        
        if(this.database == undefined){
            alert("database is undefined in all pages");
            return;
        }
		//make sure cofnig is read
		this.database.getConfig();
		/*
		 * Dont show password as plain text, do it for now cuz its easy
		if(this.database.config.password){
			var len = this.database.config.password.length;
			
		}
		*/
		
		this.webUsernameField = new Ext.form.TextField(
			{
				id: "webUserNameField",
				fieldLabel: "Username",
				value: this.database.config.username,
			});
		this.webPasswordField = new Ext.form.TextField(
			{
				id: "webPasswordField",
				fieldLabel: "Password",
				value: this.database.config.password,
			});
		this.webPathField = new Ext.form.TextField(
			{
				id: "webPathField",
				fieldLabel: "Sync Location",
				value: this.database.config.webPath,
			});
		
		this.encryptionPassword = new Ext.form.TextField(
			{
				id: "SyncPasswordField",
				fieldLabel: "Encryption Password",
				value: "",
			});
		this.encPassSave = new Ext.form.Checkbox(
			{
				id: "EncrypPassSave",
				fieldLabel: "Save Encryption Password",
				checked: this.database.config.saveEncPass,	
			});
		
		NotoAir.App.q.register({
		    target: this.encryptionPassword,
		    text: 'Encryption Password will be used to set the encryption password for private pages',
		});
		NotoAir.App.q.register({
		    target: this.encPassSave,
		    title: 'Save Password',
		    text: 'The password is saved in plain text on your machine, see the encryption help for more info',
		});
		
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
			items:[
				this.webUsernameField,
				this.webPasswordField,
				this.webPathField,
				this.encryptionPassword,
				this.encPassSave
			],
			
		});
        NotoAir.SettingsPanel.superclass.initComponent.apply(this, arguments);
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
		if(this.webUsernameField.isDirty()){
			this.database.config.username = this.webUsernameField.getValue();
		}
		if(this.webPasswordField.isDirty()){
			this.database.config.password = this.webPasswordField.getValue();
		}
		if(this.webPathField.isDirty()){
			this.database.config.webPath = this.webPathField.getValue();
		}
		if(this.encryptionPassword.isDirty()){
			this.database.config.encryptionPassword = this.encryptionPassword.getValue();
		}
		
		this.database.config.saveEncPass = this.encPassSave.getValue();

		this.fireEvent("save",this);
	}

});