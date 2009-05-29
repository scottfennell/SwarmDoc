/**
 * @author stillboy
 */

NotoAir.Server = Ext.extend(Ext.util.Observable, {
	
	basePath : "",
	network: true,
	timeEP : "time.php",
	supEP : "syncUp.php",
	sdownEP : "syncDown.php",
	
	constructor: function(config){
		Ext.apply(this, config);
		NotoAir.Server.superclass.constructor.call(this);
		if(this.database == undefined){
			Console.error("Database not defined in server");
			return;
		}
		
		if(this.basePath == ''){
			console.log("BasePath is not set, will not actually sync");
			this.network = false;
		}
		
		this.addEvents({
			serverResponse : true,
			syncResponse: true,
			syncUpResponse: true,
			syncDownResponse: true,
			syncSuccess:true,
			failure:true,
		});
	},
	
	failure : function(res, req){
		//called on failure
		console.error("Network error", res,req);
	},
	
	syncUp : function(data){
		//Send new pages and data to the server
		// Basic request
		//Data is in the format of an array of sql read object 
		/*
		 * [
		 * 	{id:pid,data:"text data,name:"Page name",textid:5,reason:"Why?",texttime:"Y-M-D H:M:S",info:""
		 * ]
		 */
		console.log("Synctime from server:"+this.database.config.syncInfo.lastsynctime);
		
		if(this.database.config.syncInfo.lastsynctime != undefined){
			var lst = this.database.config.syncInfo.lastsynctime;
			var ls = new Date();
			ls = Date.parseDate(lst, "Y-m-d H:i:s");
			rd = ls.add(Date.MILLI, this.database.serverTimeDiff);
			rd = rd.add(Date.MINUTE, -5);//Subtract 5 minutes in case as page was not saved during a sync event
			var sincetime = rd.format("Y-m-d H:i:s");
		}else{
			//make an old time since we dont have a sync time...
			var sincetime = "2000-01-01 00:00:00";
		}
		
		if(this.database.config.username != undefined){
			var pack = {
				user: {
					username: this.database.config.username,
					password: this.database.config.password
				},
				pages: data,
				since: sincetime,
			};
		}else{
			var pack = {
				pages: data,
				since: sincetime
			};
		}
		
		if (this.network) {
			Ext.Ajax.request({
				url: this.basePath+this.supEP,
				scope: this,
				success: this.syncUpResponse,
				failure: this.failure,
				headers: {
					'NotoAirVersion': NotoAir.App.appversion
				},
				params: {
					pages: Ext.encode(pack),
					
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
		if(res.status != "success"){
			this.fireEvent("failure",res,req);
			return;
		}else{
			this.fireEvent("syncUpResponse",res);
			this.fireEvent("syncSuccess");
		}
		if(res.data != undefined && res.data.pages != undefined){
			//The server is returning pages, 
			for(var i =0; i<res.data.pages.length;i++){
				var pg = res.data.pages[i];
				if(pg.texttime != undefined){
					var sptime = Date.parseDate(pg.texttime, "Y-m-d H:i:s");
					console.log("Server time parsed "+sptime);
					var stime = this.database.serverTimeDiff*-1;
					sptime = sptime.add(Date.MILLI, stime);
					console.log("New local time from server time "+sptime);
					pg.texttime = sptime.format("Y-m-d H:i:s");
					//server time is in UTC time
				}
				this.database.insertPage(pg);
			}
		}
		
	},
	
	/**
	 * syncDown
	 * send only the data since the last time, or 0 if this is the first sync
	 * 
	 * @param {Object} servertime should be a parsable string that is converted to the servers time
	 */
	syncDown : function(servertime){
		
		if (this.network) {
			Ext.Ajax.request({
				url: this.basePath+this.sdownEP,
				scope: this,
				success: this.syncDownResponse,
				failure: this.failure,
				headers: {
					'NotoAirVersion': NotoAir.App.appversion
				},
				params: {
					since: servertime,
				}
			});
		}
	},
	
	syncDownResponse : function(res,req){
		this.fireEvent("serverResponse",res,req);
		try {
			var res = Ext.decode(res);
		} catch(e){
			this.fireEvent("failure",res,req);
			Conosole.error("Error decoding server response:"+e.description+" Server response:"+res);
			return;
		}
		//if ok,
		if(res.status != "success"){
			this.fireEvent("failure",res,req);
			return;
		}
		//Right now we are just concerned with hearing back from the server and finding out that it was
		//a success
		this.fireEvent("syncDownResponse",res);//Leave it as this?
	},
	
	/**
	 * Get the current time from the server
	 * the Date object can handle like the php date strings....
	 * Y-m-d H:i:s
	 */
	serverTime : function(){
		
		if (this.network) {
			Ext.Ajax.request({
				url: this.basePath+this.timeEP,
				scope: this,
				success: this.serverTimeResponse,
				failure: this.failure,
				headers: {
					'NotoAirVersion': NotoAir.App.appversion
				}
			});
		}
	},
	
	serverTimeResponse: function(res, req){
		this.fireEvent("serverResponse",res,req);
		try {
			var res = Ext.decode(res.responseText);
		} catch(e){
			this.fireEvent("failure",res,req);
			console.log(res);
			console.error("Error decoding server response:"+e.description+" Server response:"+res.responseText);
			return;
		}
		console.log(res);
		//if ok,
		if(res.status != "success"){
			this.fireEvent("failure",res,req);
			return;
		}
		if(res.data && res.data.time){
			var dt = Date.parseDate(res.data.time, "Y-m-d H:i:s" );
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
			this.fireEvent("serverTimeResponse",diff);//Leave it as this?
			console.log("Server time diff in milliseconds: "+diff);			
		}
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
