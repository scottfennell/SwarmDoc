/**
 * @author stillboy
 */
SwarmDoc.SettingsPanel = Ext.extend(Ext.form.FormPanel, {
	
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
				inputType: 'password',
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
		
		SwarmDoc.App.q.register({
		    target: this.encryptionPassword,
		    text: 'Encryption Password will be used to set the encryption password for private pages',
		});
		SwarmDoc.App.q.register({
		    target: this.encPassSave,
		    title: 'Save Password',
		    text: 'The password is saved in plain text on your machine, see the encryption help for more info',
		});
		
        this.addEvents({
    	    "closePanel": true,
			"save" : true,
			'usernameChange': true
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
        SwarmDoc.SettingsPanel.superclass.initComponent.apply(this, arguments);
    },
	
	afterRender: function(){
		SwarmDoc.SettingsPanel.superclass.afterRender.apply(this, arguments);
		//Check to see if the server is connected, 
		//TODO: maybe dont close, since we might be editing the server
		if(!this.database.server.netConnected){
			
			Ext.Msg.alert('Status', 'The network is not connected',function(){
				this.fireEvent("closePanel",this);	
			},
			this);
			
		}
		
	},
	
	closePanel : function(e,k){
		console.log(e.text);
		if(e.text == "Close"){
			this.fireEvent("closePanel",this);
		}else{
			this.save();
		}
        
    },
	
	savesss: function(){
		//get all elements, and 
		if(	this.webUsernameField.isDirty() || 
			this.webPasswordField.isDirty() || 
			this.webPathField.isDirty()){
				//Need to check with the server to see if
				var un = this.webUsernameField.getValue();
				var pw = this.webPasswordField.getValue();
				var path = this.webPathField.getValue();
				this.database.server.on('loginCheck', this.loginCheckResponse, this);
				this.database.server.checkLogin(un,pw,path,this.saveConfirmed, this);
			
		}else{
			this.fireEvent("closePanel",this);
		}
	},
	
	loginCheckResponse: function(res){
		if(res){
			this.saveConfirmed();
		}else{
			Ext.Msg.alert('Login is incorrect, please check your username, password, or path');
		}
	},
	
	save: function(){
		
		var newConfig = {
			username : this.webUsernameField.getValue(),
			password : this.webPasswordField.getValue(),
			webPath : this.webPathField.getValue(),
			encryptionPassword : this.encryptionPassword.getValue(),
			saveEncPass : this.encPassSave.getValue()
		};
		this.fireEvent("save",newConfig);
		this.fireEvent("closePanel",this);
		/*
		
		if(this.webUsernameField.isDirty()){
			if(this.database.config.username != ''){
				var oldun = this.database.config.username;
				Ext.Msg.confirm('Username Change', 'If you change your username, old pages in the database may become difficult to access, see help for more information.<br/><b>Click Yes to continue</b>', function(btn, text){
					if (btn == 'yes'){
						//Even though this is changed in the current config... for some reason it doesnt write
				        this.database.config.username = this.webUsernameField.getValue();
						this.fireEvent('usernameChange',oldun,this.database.config.username);
						this.database.updateUsername(oldun,this.database.config.username);
				    }
				},this);
			}else{
				this.database.config.username = this.webUsernameField.getValue();
				this.fireEvent('usernameChange','',this.database.config.username);
				this.database.updateUsername(oldun,this.database.config.username);
			}
		}
		if(this.webPasswordField.isDirty()){
			this.database.config.password = this.webPasswordField.getValue();
		}else{
			Ext.Msg.alert(this.webPasswordField.getValue());
		}
		if(this.webPathField.isDirty()){
			this.database.config.webPath = this.webPathField.getValue();
		}
		if(this.encryptionPassword.isDirty()){
			this.database.config.encryptionPassword = this.encryptionPassword.getValue();
		}
		
		this.database.config.saveEncPass = this.encPassSave.getValue();
		this.fireEvent("save",this);
		this.fireEvent("closePanel",this);
		*/
		
		
	}

});