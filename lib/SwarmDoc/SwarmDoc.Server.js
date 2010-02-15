/**
 * @author stillboy
 */

SwarmDoc.Server = Ext.extend(Ext.util.Observable, {
	
	basePath : "",
	netConnected: true,
	
	constructor: function(config){
		Ext.apply(this, config);
		SwarmDoc.Server.superclass.constructor.call(this);
		if(this.database == undefined){
			console.error("Database not defined in server");
			return;
		}
		
		if(this.basePath == ''){
			console.warn("BasePath is not set, will not actually sync");
			this.netConnected = false;
		}
		
		this.addEvents({
			serverResponse : true,
			syncResponse: true,
			syncUpResponse: true,
			syncDownResponse: true,
			syncSuccess:true,
			failure:true, // Any network failure
			success:true, // Any network success
			connection:true,
			loginCheck:true
		});		
		air.NativeApplication.nativeApplication.addEventListener(air.Event.NETWORK_CHANGE, this.networkEvent/*SwarmDoc.App.networkEvent*/);
		this.monitor = new air.URLMonitor(new air.URLRequest('http://www.adobe.com'));
		this.monitor.addEventListener(air.StatusEvent.STATUS, this.networkEvent/*SwarmDoc.App.networkEvent*/); 
        this.monitor.start(); 

	},
	
	updatePath : function(path){
		this.basePath = path;
	},
	
	//Anonymous function, when called from the network status, this 
	networkEvent : function(event){
		var serv = this.SwarmDoc.App.database.server;
		if(event.type == 'status'){
			if(event.target.available){
				this.netConnected = true;
				console.log("Connection Restored: "+new Date());
				serv.fireEvent('connection',true);
			}else{
				this.netConnected = false;
				console.log("Connection Lost: "+new Date());
				serv.fireEvent('connection',false);
			}
		}else if(event.type == 'networkChange'){
			//For a network change event, such as removing the cable, but i think url monitor does a fine job
		}
	},
	
	
	failure : function(res, req){
		//called on NETWORK failure for any network request, not if the contents is a failure
		//this should probably trigger the network event 
		console.log("Network error", res,req); // This is not really an error, just a notification
		//This would be because the network path is not available or the server is down
		//Really, I should change the monitor to also work with this.
	},
	
	/**
	 * Check username and password when saving settings 
	 * @param {Object} un
	 * @param {Object} pw
	 * @param {Object} path
	 */
	checkLogin : function(un,pw,path){
		var pack = {
			'action':'checklogin',
			'user': {
				'username': un,
				'password': pw
			}
		};
		if (this.netConnected) {
			Ext.Ajax.request({
				url: path,
				scope: this,
				success: this._checkLogin,
				failure: this.failure,
				headers: {
					'SwarmDocVersion': SwarmDoc.App.appversion
				},
				params: {
					data: Ext.encode(pack),
				}
			});
		}
	},
	
	/**
	 * Return function from login check for page
	 * Since this is used as a sort of advanced network check...
	 * @param {Object} res
	 * @param {Object} req
	 */
	
	_checkLogin : function(res,req){
		try {
			var res = Ext.decode(res.responseText);
		} catch(e){
			this.fireEvent("failure",res,req);
			console.error("Error decoding server response:"+e.description+" Server response:"+res);
			return;
		}		
		if(res.time != undefined){
			this.serverTime(res.time);
		}
		
		if(res.status != "success"){
			this.fireEvent('loginCheck',false,res);
			this.fireEvent("failure",res,req);
			return;
		}else{
			this.fireEvent('success');
			this.fireEvent('loginCheck',true,res);
		}
	},
	
	/**
	 * Syncup... is the general sync function
	 * @param {Object} data
	 */
	
	syncUp : function(data){
		//Send new pages and data to the server
		// Basic request
		//Data is in the format of an array of sql read object 
		/*
		 * [
		 * 	{id:pid,data:"text data,name:"Page name",textid:5,reason:"Why?",texttime:"Y-M-D H:M:S",info:""
		 * ]
		 */
		
		if(this.database.serverTimeDiff == undefined){
			console.warn("serverTimeDiff is undefined");
			return false;
		}
		if(this.database.config.syncInfo.lastsynctime != undefined){
			var lst = this.database.config.syncInfo.lastsynctime;
			var ls = new Date();
			ls = Date.parseDate(lst, "Y-m-d H:i:s");			
			
			if(ls == undefined){
				console.warn("Cannot parse last sync time",this.database.config.syncInfo.lastsynctime);
				return false;
			}
			rd = ls.add(Date.MILLI, this.database.serverTimeDiff);
			rd = rd.add(Date.MINUTE, -5);//Subtract 5 minutes in case as page was not saved during a sync event
			var sincetime = rd.format("Y-m-d H:i:s");
		}else{
			//make an old time since we dont have a sync time...
			var sincetime = "2000-01-01 00:00:00";
		}
		
		var pass = this.database.config.password;
		if(this.database.config.username != undefined){
			var pack = {
				user: {
					username: this.database.config.username,
					password: pass
				},
				pages: data,
				since: sincetime,
				action: "sync",
			};
		}else{
			var pack = {
				pages: data,
				since: sincetime,
				action: "sync"
			};
		}
		
		if (this.netConnected) {
			Ext.Ajax.request({
				url: this.basePath,
				scope: this,
				success: this.syncUpResponse,
				failure: this.failure,
				headers: {
					'SwarmDocVersion': SwarmDoc.App.appversion
				},
				params: {
					data: Ext.encode(pack),
					
				}
			});
		}
	},
	
	syncUpResponse : function(res,req){
		this.fireEvent("serverResponse",res,req);
		try {
			var res = Ext.decode(res.responseText);
		} catch(e){
			this.fireEvent("failure",res,req);
			console.error("Error decoding server response:"+e.description+" Server response:"+res);
			return;
		}
		//if ok,
		if(res.time != undefined){
			this.serverTime(res.time);
		}
		if(res.status != "success"){
			this.fireEvent("failure",res,req);
			return;
		}else{
			this.fireEvent("syncUpResponse",res);
			this.fireEvent("syncSuccess");
			this.fireEvent("success"); //lastsynctime is saved off of a successlistener
		}

		if(res.pages != undefined){
			//The server is returning pages, 
			for(var i =0; i<res.pages.length;i++){
				var pg = res.pages[i];
				if(pg.texttime != undefined){
					var sptime = Date.parseDate(pg.texttime, "Y-m-d H:i:s");
					var stime = this.database.serverTimeDiff*-1;
					sptime = sptime.add(Date.MILLI, stime);
					pg.texttime = sptime.format("Y-m-d H:i:s");
					//server time is in UTC time
				}
				this.database.insertPage(pg);
			}
		}

	},
	
	/**
	 * Get the current time from the server
	 * the Date object can handle like the php date strings....
	 * Y-m-d H:i:s
	 */
	serverTime : function(){
		
		if (this.netConnected) {
			var pack = {
				'action':'gettime'
			};
			
			Ext.Ajax.request({
				url: this.basePath,
				scope: this,
				success: this.serverTimeResponse,
				failure: this.failure,
				headers: {
					'SwarmDocVersion': SwarmDoc.App.appversion
				},
				params: {
					data: Ext.encode(pack),
					
				}
			});
		}
	},
	/**
	 * serverTimeResponse needs to go away and be integrated with syncUpResponse. Since the
	 * server time will be sent with every response
	 * 
	 * MAYBE.....
	 * 
	 * @param {Object} res
	 * @param {Object} req
	 */
	
	serverTimeResponse: function(res, req){
		this.fireEvent("serverResponse",res,req);
		try {
			var res = Ext.decode(res.responseText);
		} catch(e){
			this.fireEvent("failure",res,req);
			console.error("Error decoding server response:"+e.description+" Server response:"+res.responseText);
			return;
		}
		//if ok,
		if(res.status != "success"){
			this.fireEvent("failure",res,req);
			return;
		}
		if(res.time != undefined){
			this.serverTime(res.time);
		}
		this.fireEvent("success");
	},
	
	/**
	 * Take serverTime and set the serverTimeDiff in database
	 * @param {Object} serverTime
	 */
	serverTime: function(serverTime){
		var dt = Date.parseDate(serverTime, "Y-m-d H:i:s" );
		var cdate = this.getSyncDate();
		var diffMod = 1;
		if(dt > cdate){
			diffMod = 1;
		}else{
			diffMod = -1;
		}
		//diff should be the time i need to add to my cdate to get the servers time soo
		var diff = diffMod*cdate.getElapsed(dt);
		this.database.serverTimeDiff = diff; // Diff is in milliseconds, I assume that this will give a negative in some cases?
		//get same time as the server
		//var stime = cdate.add(Date.MILLI,diff);
	},
	
	/**
	 * Convert create a date object and convert it to the this comps UTC time so that diff will
	 * work with the time that we are pulling from the database.
	 */
	getSyncDate : function(){
		//TODO: make sure that this works when the timezone is ahead of the GMT (eastern europe, au, etc)
		var cdate = new Date();//make this UTC to match database checks
		cdate = cdate.add(Date.MINUTE,cdate.getTimezoneOffset());
		return cdate;
	}
});
