 /*
SwarmDoc.DB

This is the database layer that is created by app and then used to query the local
or remote database.
*/

/*
 * 
 * This should extend the sql
 * permission_id = 0 is private
 * permission_id = 1 is public
 * permission_id = 2 is read only public
 * 
 */

SwarmDoc.DB = Ext.extend(Ext.util.Observable, {

	database : null,
	dbtype : 'remote',
	//url : 'http://n/dev/',

	syncOk:true,
	pages : [],
	texts : [],
	defaultConfig : {
		version:"1.0",
		databaseFile:"SwarmDoc.db",
		username: "",
		password: "",
		webPath: "http://SwarmDoc.com/server/",
		saveEncPass: false,
		encryptionPassword:"",
		syncDelay: 60000, //Amount of time to run sync if we are connected
		syncInfo:{}
	},
	
	constructor: function(config){
		Ext.apply(this, config);
		SwarmDoc.DB.superclass.constructor.call(this);
		this.pendingSync = false;
		this.addEvents({
			open : true,
			close: true,
			newPage: true, //fire when a new page is added to the db
			savePage: true, //fires when the db returns, immediate if syncronous, on callback if async
			openPage: true, //same as above
			beforeSavePage: true, //fires before i try to save the page to the db 
			afterSavePage: true, //fires after return 
			beforeOpenPage: true,
			afterOpenPage: true,
			deletePage: true,
			externalPageUpdate: true,
		});
		this.database = Ext.sql.Connection.getInstance();
		this.readConfig();
		this.database.open(this.config.databaseFile);
		this.createTables();
		this.server = new SwarmDoc.Server({database:this,basePath:this.config.webPath});
		this.server.on("syncSuccess",this.syncTime,this);
		this.server.on("success",this.serverSuccess,this);
		this.server.on("failure",this.serverFailure,this);
		this.server.on("connection",this.networkStatus,this);
		this.server.serverTime();
		this.sync();

	},
	
	//create tables if they dont exist in the sql file...
	createTables : function(){
		var pagesql =   "CREATE TABLE IF NOT EXISTS page ("+
	                "id INTEGER PRIMARY KEY AUTOINCREMENT,"+
			        "name TEXT,"+
	                "text_id INTEGER DEFAULT 0,"+
					"info TEXT,"+//serialized information about this page
					"permission_id INTEGER DEFAULT 0,"+
					"username TEXT DEFAULT '',"+
					"user_id INTEGER DEFAULT 0,"+//0 is me, any other
					"group_id INTEGER DEFAULT 0,"+//0 is no group
	                "time DATE DEFAULT CURRENT_TIMESTAMP);"
		this.database.query(pagesql); 					

	    var textsql =  "CREATE TABLE IF NOT EXISTS text ("+
	                "id INTEGER PRIMARY KEY AUTOINCREMENT,"+
			        "data TEXT DEFAULT '',"+
			        "page_id INTEGER,"+
					"reason TEXT,"+
					"unique_id TEXT,"+
					"user_id INTEGER DEFAULT 0,"+
					"username TEXT,"+
	                "time DATE DEFAULT CURRENT_TIMESTAMP);"
	    this.database.query(textsql); 		
	},
	
	readConfig : function(){
		var file = air.File.applicationStorageDirectory.resolvePath("configuration.json"); 
		if (file.exists) {
			var fileStream = new air.FileStream();
			fileStream.open(file, air.FileMode.READ);
			var jsString = fileStream.readUTFBytes(fileStream.bytesAvailable);
			fileStream.close();
			//This might fail if there is no file?
			this.config = Ext.decode(jsString);
			//copy over any defaults if they are not overriden in the config file
			this.config = Ext.applyIf(this.config, this.defaultConfig);
		}else{
			Ext.Msg.alert('Status', 'Creating new configuration file');
			this.config = this.defaultConfig;
			this.saveConfig();
		}
	},
	
	getConfig : function(){
		if(this.config.version){
			return this.config;
		}else{
			this.readConfig();
			return this.config;
		}
	},
	
	saveConfig : function(config){
		if (config != undefined) {
			this.pendingConfig = config;
			if (this.server && this.server.netConnected) {
				this.server.on('loginCheck', this._applyConfig, this);
				this.server.checkLogin(config.username, config.password, config.webPath);
			}
		}else{
			this._saveConfig();
		}
	
	},
	
	_applyConfig : function(status){
		/*
		 * Callback for login check
		 * Apply the pending configuration options in status is true
		 */
		//Remove listener to ensure we dont get called again, or twice
		this.server.removeListener('loginCheck',this._applyConfig,this);
		if(!status){
			SwarmDoc.App.alert("Bad username and password, settings not saved");
			return;
		}else{
			if (this.pendingConfig != undefined) {
				//If the username was changed
				if(this.config.username != this.pendingConfig.username){
					this.updateUsername(this.config.username,this.pendingConfig.username);
					//Make sure to re-sync at an earlier date
					this.config.syncInfo = {};
				}
				this.config = Ext.applyIf(this.pendingConfig, this.config);
				//Reset server's basepath
				this.server.updatePath(this.config.webPath);
				this._saveConfig();
				//If we are here, loginCheck should have already confirmed that the network is
				//connected
				if (this.server!=undefined && this.server.netConnected) {
					this.netConnected = true;
				}
				this.sync();
				//this.pendingConfig.encryptionPassword = '';
				//this.config.username = this.pendingConfig.username;
				//this.config.password = this.pendingConfig.password;
				//this.config.webPath = this.pendingConfig.webPath;
				//this.config.encryptionPassword = this.pendingConfig.encryptionPassword;
				//this.config.saveEncPass = this.pendingConfig.saveEncPass;
				
				
			}else{
				console.warn("No pending config? WTF?");
			}
		}
	},
	
	_saveConfig : function(){
		
		/**
		 * Save this.config to file
		 */
		if(!this.config.saveEncPass){
			this.encryptionPassword = "";
		}		
		var file = air.File.applicationStorageDirectory.resolvePath("configuration.json"); 
		stream = new air.FileStream();
		stream.open(file, air.FileMode.WRITE);
		stream.writeUTFBytes(Ext.encode(this.config));
		stream.close();
		return true;
	},
	
	updateUsername : function(oldname,newname){
		
		/**
		 * updateUsername
		 * If the username was changed, specifically when we change the username
		 * after using the air app for a while, there will be pages with no 
		 * username, these must be updated before syncronization.
		 */
		if(oldname == ''){
			var updateNameSql = "UPDATE page SET username=? WHERE username=?";
			this.database.queryBy(updateNameSql,[newname,oldname]);
			var updateNameSqlText = "UPDATE text SET username=? WHERE username=?";
			this.database.queryBy(updateNameSqlText,[newname,oldname]);
		}
	},
	       
	getPage : function(title){
		
	    /**
	     * getPage will check the database for a given title and return it along with 
	     * a list of texts, will only return the text data for the most recent text
	     */
		//get the page object from the database, if it exists.
	    //if there is no page, then we insert a new page with the current title
	    if(this.database != null){
			//TODO: check to see if there is more than one page with the same title, 
			//if there is then we need to get the page that has the current username
			var unTitle = title.split(":");
			if(unTitle.length>1){
				//Using namespace
				var tusername = unTitle[0];
				title = unTitle[1];
			}else{
				//not using namespacing
				var tusername = '';
			}
			if (tusername != '') {
				var pSql = "SELECT * FROM page WHERE name=? AND username=?";
				var pageR = this.database.queryBy(pSql, [title, tusername]);
				//If this page is not found, create a new page object
				if(pageR.length == 0){
					//this.fetchPage(tusername,title);
					if (tusername == this.config.username) {
						//Make a new default page editable
						var np = new SwarmDoc.Page({
							database: this
						});
						np.title = tusername + ':' + title;
						np.permission_id = 0;
						np.edit = true;
						np.body = "";
						np.text = [{
							data: np.body
						}];
						return np;
					}
					else {
						var np = new SwarmDoc.Page({
							database: this
						});
						np.title = tusername + ':' + title;
						np.permission_id = 2;
						np.body = "<h1>Page Not Found in Local Database</h1><p>\"" + tusername + ':' + title + "\"</p>";
						np.text = [{
							data: np.body
						}];
						return np;
					}
				}
			}
			else {
				var params = [title];
				var pSql = "SELECT * FROM page WHERE name=?";
				var pageR = this.database.queryBy(pSql, params);
				//check for multiple pages found and make sure to use the one with this username
				if(pageR.length > 1){
					for(var i=0;i<pageR.length;i++){
						if(pageR[i].username == this.config.username){
							pageR[0] = pageR[i];//move to the 0th loc
							break;
						}
					}
				}
			}
	        var np = new SwarmDoc.Page({database:this});
	        if(pageR.length > 0 ){
				//The page was found, find associated text
	            //should be 1 only
	            var pageId = pageR[0].id;			
		        var textQuery = "SELECT id,time,reason,unique_id FROM text WHERE page_id=? ORDER BY time DESC";
	            np.text = this.database.queryBy(textQuery,[pageId]);
				
				if (np.text.length > 0) {
					var textId = np.text[0].id;
					var textSql = "SELECT * FROM text WHERE id=?";
					var trow = this.database.queryBy(textSql, [textId]);
					np.body = trow[0].data;
					if(trow.length>0 && trow[0].data != undefined && trow[0].data != null){
						np.text[0].data = trow[0].data; //since we already got the data, add it					
					}else{
						np.text[0].data = '';
					}
				}
				
				np.id = pageId;   
				np.permission_id = pageR[0].permission_id;
				np.info = pageR[0].info;
				np.user_id = pageR[0].user_id;
				np.username = pageR[0].username;
				np.time = pageR[0].time;

	        }else{
				//page not found
				//Insert default text
				if (title == "Main Page") {
					np.body = "<h1>Default Main Page</h1><p>This is the main page, hit edit above to edit me click [[help]] for more info</p>";
					np.text = [{
						data: np.body
					}];
					np.permission_id = 0;//Private
				}else if(title == "Help"){
					np.body = "<h1>Default Help</h1><p>This is the main page, hit edit above to edit me</p>";
					np.text = [{
						data: np.body
					}];		
					np.permission_id = 1;//Write by everyone		
					np.user_id = 0;						
				}
			}
			//System page
			if(np.permission_id == 10){
				np.edit = false;
			}
			
			if (np.user_id != undefined && np.permission_id != undefined) {
				if (np.user_id != 0) {
					if (np.permission_id != 2) {
						np.edit = true;
					}
					else {
						np.edit = false;
					}
				} else {
					np.edit = true;
				}
			}else{
				np.edit = true;
			}
			//Fix
	        np.title = title;
	        return np;                
	    }else{
			console.error("database is not set in SwarmDoc.DB object");
	    }
	},
	
	log : function(header,args){
		var log = '';
		if(args.length>0){
			for(var i=0;i<args.length;i++){
				log = log+"<br/>"+args[i];
			}
		}
		if(log == ''){
			return;
		}
		log = "<div class='logentry'>"+log+"</div>"
		var logPage = new SwarmDoc.Page({database:this});
		logPage.title = "SystemConsole";
		var logPage = this.database.queryBy("SELECT * FROM page WHERE name=?",['SystemConsole']);
		if(logPage.length>0){
			var logid = logPage[0].id;
		}else{
			this.database.queryBy("INSERT INTO page (name,permission_id,info) VALUES (?,?,?)",
				['SystemConsole',10,'specialPage']
			);
			var logPage = this.database.queryBy("SELECT * FROM page WHERE name=?",['SystemConsole']);
			var logid = logPage[0].id;
		}
		var logText = this.database.queryBy("SELECT * FROM text WHERE page_id=?",[logid]);
		if(logText.length>0){
			logText[0].data = logText[0].data+log;
			this.database.queryBy("UPDATE text SET data=? WHERE id=?", [logText[0].data,logText[0].id]);
		}else{
			var sql = "INSERT INTO text (data,page_id,reason,username,unique_id) VALUES (?,?,?,?,?)";
			this.database.queryBy(sql, [log,logid,'','','']);
		}		
	},
	
	_newPage : function(page){
		/*
		 * The page was not found or was another users and was not writable,
		 * create a new page for this user
		 */
		if(this.config.username != undefined){
			var newpageSql = "INSERT INTO page (name,username) VALUES (?,?)";
			this.database.queryBy(newpageSql,[page.title, this.config.username]);
			var pageObj = this.database.queryBy("SELECT * FROM page WHERE name=? AND username=?",[page.title,this.config.username]);
		}else{
			var npSql = "INSERT INTO page (name) VALUES (?)";
			this.database.queryBy(npSql,[page.title]);
			var pageObj = this.database.queryBy("SELECT * FROM page WHERE name=?",[page.title]);
		}
        //Create new page		
		page.id = pageObj[0].id;
		page.username = pageObj[0].username;
		this.fireEvent("newPage",page);
		return page;
	},
	
	savePage : function(page){
		/**
		 * savePage will save a page object to the database
		 * if the page.id var is not set or is negative, we assume this is a new page
		 * and will insert a new page into the databas
		 * 
		 * either way we will insert the text[0] var into the text db, 
		 * 
		 * @param {Object} page
		 */
		this.fireEvent("beforeSavePage", page);
	    if(page.title != ""){
	        //get the previous page
	        if(this.database != null){
	            if(page.id == undefined || page.id < 0) {
					page = this._newPage(page);
				}
				if(page.username != undefined && (page.username != this.config.username)){
					//We are trying to save a page that is not ours
					if(page.permission_id != 1){
						//not public writable
						//now we want to strip all old page stuff so... 
						var np = new SwarmDoc.Page({database:this});
						np.title = page.title;
						np.name = page.title;
						np.permission_id = 0;
						np.edit = true;
						np.body = page.text[0].data;
						np.text = [page.text[0]];
						page = this._newPage(np);
						
					}
				}
				//else existing page
				//page.id is now set regardless
				var uniqueId = this.genUnique();
				if(page.reason == "Why?"){
					page.reason = '';//Set to empty for default text
				}
				//Save the text to the text table and update the page to point to the new text
				var inText = "INSERT INTO text (data,page_id,reason,username,unique_id) VALUES (?,?,?,?,?)";
                this.database.queryBy(inText, [page.text[0].data,page.id,page.text[0].reason,page.username,uniqueId]);
                var getId = "SELECT LAST_INSERT_ROWID()";
                var rowId = this.database.query(getId);
				page.text[0].id = rowId[0]["LAST_INSERT_ROWID()"];
                //allow this but phase out
				var updatePage = "UPDATE page SET text_id=? WHERE id=?";
                this.database.queryBy(updatePage, [rowId[0]["LAST_INSERT_ROWID()"], page.id]);

				this.fireEvent("savePage",page);
				this.fireEvent("afterSavePage",page);
				//force sync on save
				this.sync();
                return page;
	        }else{
				console.error("Database is not set in SwarmDoc.DB object",this);
			}
	    }else{
			console.error("Trying to save a page without a title",page);
		}
	},
	
	insertPage: function(pageObj){
		
		/**
		 * take a unified page object, like the results from the server and insert
		 * This does not function within the normal 'savepage' so, we should not use that
		 * @param {Object} pageObj
		 */
		//Since this most likely came from a server, the username should be set for sure. 
		if(pageObj.username == undefined){
			pageObj.username = '';//Cannot be sure of where this came from
			console.warn('Page insert without username, setting to none - may lead to duplicate pages',pageObj);			
		}
		
		if(pageObj.name != undefined){
			var chkId = "SELECT id FROM page WHERE name=? AND username=? LIMIT 1";
			var res = this.database.queryBy(chkId, [pageObj.name,pageObj.username]);
			if(res.length>0){
				//found
				pageObj.id = res[0].id;
			}
		}
		
		if (pageObj.id == undefined) {
			var npSql = "INSERT INTO page (name,username,permission_id) VALUES (?,?,?)";
			var pageObject = this.database.queryBy(npSql, [pageObj.name,pageObj.username,pageObj.permission_id]);
			var cidSql = "SELECT * FROM page WHERE name=? AND username=? LIMIT 1";
			var resObj = this.database.queryBy(cidSql, [pageObj.name,pageObj.username]);			
			pageObj.id = resObj[0].id;
			this.fireEvent("newPage", resObj[0]);
		}

		//should have pageObj.id now, somehow
		if(pageObj.unique_id != undefined && pageObj.unique_id != ''){
			var chkUn = "SELECT id FROM text WHERE unique_id=?";
			var res = this.database.queryBy(chkUn, [pageObj.unique_id]);
			if(res.length>0){
				//Matches are not all that exciting...
				return;
			}
		}
		
		if(pageObj.reason == undefined){
			pageObj.reason = '';
		}
		if(pageObj.unique_id == undefined){
			pageObj.unique_id = '';
		}
		
		//if no time is defined, do not insert let the db add it
		if(pageObj.texttime == undefined){
			var sql = "INSERT INTO text (data,page_id,reason,username,unique_id) VALUES (?,?,?,?,?)";
			this.database.queryBy(sql, [pageObj.data,pageObj.id,pageObj.reason,pageObj.username,pageObj.unique_id]);
		}else{
			//IF texttime is set, it needs to be in the correct format and already set
			var sql = "INSERT INTO text (data,page_id,reason,username,unique_id,time) VALUES (?,?,?,?,?,?)";
			this.database.queryBy(sql, [pageObj.data,pageObj.id,pageObj.reason,pageObj.username,pageObj.unique_id,pageObj.texttime]);
		}		
		this.fireEvent("externalPageUpdate",pageObj.name);
		//Just insert the data and quit.
	},
	
	savePermissions:function(page){
		if(page.id != undefined){
			if(page.permission_id == undefined){
				return false;
			}
			switch (page.permission_id){
				case "600":page.permission_id=0;break;
				case "660":page.permission_id=0;break;
				case "666":page.permission_id=1;break;
				case "400":page.permission_id=0;break;
				case "444":page.permission_id=2;break;
				case "444":page.permission_id=2;break;
				case "644":page.permission_id=2;break;
			}
			var sql = "UPDATE page SET permission_id=? WHERE id=?";
			this.database.queryBy(sql,[page.permission_id,page.id]);
		}
	},
	
	getTextFromID : function(id){
		/**
		 * getTextFromID will return the text for the text at id... simple accesspre
		 * @param {Object} id
		 */
	
		if (arguments.length > 1) {
			var page_id = arguments[1];
			var hsql = "SELECT data FROM text WHERE id=? AND page_id=? LIMIT 1";
			var histObj = this.database.queryBy(hsql, [id, page_id.id]);
		}
		else {
			var hsql = "SELECT data FROM text WHERE id=? LIMIT 1";
			var histObj = this.database.queryBy(hsql, [id]);
		}
		if (histObj.length > 0) {
			return histObj[0].data;
		}else{
			return '';
		}
	},
	
	getMostRecent : function(){
	    /**
	 	* getMostRecent will return the latest pages that have been updated for inserting into
	 	* the menu for easy access..
	 	*/

		var sql = 	"SELECT "+
						"page.id AS id, "+
						"page.name AS name, "+
						"DATETIME(text.time) AS time, "+
						"DATETIME(page.time) AS created, "+
						"COUNT(text.id) AS textcount, "+
						"page.permission_id AS permission_id, "+
						"page.username AS username "+
					"FROM page JOIN text ON page.id=text.page_id "+
					"WHERE page.permission_id<10 ";
					"GROUP BY text.page_id ORDER BY text.time DESC LIMIT 10";
	    var out = this.database.query(sql);
	    return out;
	},
	
	getAllPages : function(){
		/**
	 	* getAllPages will just get all the pages without any text data... 
	 	* for showing in a table... etc
	 	*/	
		var sql = "SELECT page.id AS id, page.name AS name, DATETIME(text.time) AS time, DATETIME(page.time) AS created, COUNT(text.id) AS textcount, page.permission_id AS permission_id, page.username AS username FROM page JOIN text ON page.id=text.page_id WHERE page.permission_id<10 GROUP BY text.page_id ORDER BY text.time DESC";
	    var out = this.database.query(sql);
	    return out;
	},
	
	deletePage : function(pageId, pageName){
		var pagesql = "DELETE FROM page WHERE id=?";
		var textsql = "DELETE FROM text WHERE page_id=?";
		this.database.queryBy(pagesql, [pageId]);
		this.database.queryBy(textsql, [pageId]);
		this.fireEvent('deletePage', pageId, pageName);
		return true;
	},
	
	makePrivate : function(pageId, pageName){
		/**
		 * Listener for the page settings page, or history page.. 
		 */
		var sql = "UPDATE page SET permission_id='0' WHERE id=?";
		this.database.queryBy(sql,[pageId]);
		return true;
	},
	
	makePublic : function(pageId, pageName){
		/**
		 * Listener for the page settings page
		 */
		var sql = "UPDATE page SET permission_id='1' WHERE id=?";
		this.database.queryBy(sql,[pageId]);
		return true;
	},
	
	networkStatus : function(status){
		/*
		 * Event listener for server network events, this will try to sync once we know that we
		 * are back online
		 */
		
		if(status){
			this.netConnected = true;
			this.sync();
		}else{
			this.netConnected = false;
			if(this.syncTask != undefined){
				this.syncTask.cancel();
			}
		}
	},
	
	checkServerConnection : function(){
		
		/**
		 * use server.checklogin with saved username and such to see if we are 
		 * ok. 
		 */
		if(this.server == undefined)return false;
		this.server.checkLogin(this.config.username, this.config.password, this.config.webPath);
	},
	
	serverFailure : function(response,request){
		/**
		 * If we recieve a failure from server, shut everything down
		 */
		this.netConnected = false;
		if (this.syncTask != undefined) {
			this.syncTask.cancel();
		}
	},
	
	serverSuccess : function(){
		
		/**
		 * serverSuccess
		 * if we recieve a success from the server, then 
		 * A. diffTime should be set for sure
		 * B. we have a connection
		 * C. We can continue the sync process
		 * D. We have a confirmed login, if that was being checked, it will be saved now
		 * 
		 * Dont bother trying to sync here, that will lead to a loop, just restart the syncTask at
		 * the normal delay
		 */
		this.netConnected = true;
		if (this.syncTask != undefined) {
			this.syncTask.delay(this.config.syncDelay);
		}		
	},

	queueSync : function(){
		
		/**
		* If a network connection is successful, try and sync every few moments... 
	 	*/		
		//recieved response from the server, continue to call sync to get new updates from the server
		this.netConnected = true;
		if(this.syncTask == undefined){
			this.syncTask = new Ext.util.DelayedTask(this.sync,this);
			//Ten minutes
			this.syncTask.delay(this.config.syncDelay);
		}else{
			this.syncTask.delay(this.config.syncDelay);
		}
		
	},
	
	sync : function(){
		
		if(this.syncTask == undefined){
			//create the sync task
			this.syncTask = new Ext.util.DelayedTask(this.sync,this);
		}
		if(this.netConnected){
			//serverTimeDiff is ok, because any response sends that and any success means that is set
			this._sync();
			//setup the autoSync queue
			this.syncTask.delay(this.config.syncDelay);
		}else{
			//Attempt to check the network connection, 
			//just to resume if there was a fault for some reason
			//This will send login info and will return the success and time if ok
			this.checkServerConnection();
		}
	},
	
	_sync : function(){
		
		/**
		 * Check to see if we stored the last sync time, this should be the last time pulled from a sync
		 * off the database
		 * See http://www.sqlite.org/lang_datefunc.html for info on sqlite datetime
		 */
		if(!this.netConnected){
			return;
		}
		
		this.pendingSync = false;
		
		if(this.config.syncInfo.lastsynctime){
			var sql = "SELECT page.id AS id,page.name AS name,page.info AS info, page.username AS pageuser,page.permission_id AS permission_id, text.data AS data,datetime(text.time) AS texttime,text.reason AS reason,text.id AS textid, text.unique_id AS uniqueid FROM page JOIN text ON page.id=text.page_id WHERE DATETIME(text.time)>DATETIME(?) AND page.permission_id<10 ORDER BY text.time DESC";
			var res = this.database.queryBy(sql,[this.config.syncInfo.lastsynctime]);
			
			
			if (res.length > 0) {			
				/*****************************************************************************
				 Store the localTextTime so to call check for when uploading, 
					last sync time should be from right now, not from the last
				*******************************************************************************/
				this.config.syncInfo.localTextTime = res[0].texttime;
				this.saveConfig();
			}
			//res currently contains all the new text items that where created since the last sync.. ie, 
			//items that have not been syncronized
			//update all times to send to the server
			for(var i = 0; i<res.length;i++){
				var rd = new Date();
				rd = Date.parseDate(res[i].texttime, "Y-m-d H:i:s");
				rd = rd.add(Date.MILLI, this.serverTimeDiff);
				res[i].texttime = rd.format("Y-m-d H:i:s");
			}
			this.server.syncUp(res);
			//If i get the date from now, to get the UTC date, as that is what i am getting
			//this.getTime();// GET NOW to put into sync time, should only be stored after confirmation
			
		}else{
			//if no sync time is found, select all the items
			var sql = "SELECT page.id AS id,page.name AS name,page.info AS info,page.username AS pageuser, page.permission_id AS permission_id, text.data AS data,datetime(text.time) AS texttime,text.reason AS reason,text.id AS textid, text.unique_id AS uniqueid FROM page JOIN text ON page.id=text.page_id WHERE page.permission_id<10 ORDER BY text.time DESC";
			var res = this.database.query(sql);
			if(this.config.syncInfo == undefined){
				this.config.syncInfo = {};
			}
			
			if (res.length > 0) {
				this.config.syncInfo.localTextTime = res[0].texttime;
			}

			for(var i = 0; i<res.length;i++){
				var rd = new Date();
				rd = Date.parseDate(res[i].texttime, "Y-m-d H:i:s");
				rd = rd.add(Date.MILLI, this.serverTimeDiff);
				res[i].texttime = rd.format("Y-m-d H:i:s");
			}
			
			this.server.syncUp(res);
			//this.saveConfig();
		}
	},

	
	/**
	 * Generate a unique string as an ID for the text entry to ensure no collitions get saved
	 * This gets the current time in ms and appends two random digits in hex and returns the string
	 */
	genUnique:function(){
		var tm = new Date();
		var time = Date.UTC(tm.getFullYear(), tm.getMonth(), tm.getDay(), tm.getHours(), tm.getMinutes(), tm.getSeconds(),tm.getMilliseconds());
		var time = time.toString(16);
		var mod = Math.floor(Math.random()*100);		
		//1,241,142,698,481 //ms since epoch
		//   31,536,000,000 //ms per year
		//1,198,368,000,000
		// - no good reason ... time = time.substring(2);//lop off the most significant, for funsies
		mod = mod.toString(16);
		var all = mod + time;
		return all;
	},
	
	/**
	 * Get the time from the sqlite db and return. This is in UTC on linux,
	 * not sure if I can expect the same on other OSs
	 */	
	getTime:function(){
		//"Y-m-d H:i:s"
		var sql = "SELECT datetime('now') AS time";
		var res = this.database.query(sql);
		return res[0].time;
	},
	
	/**
	 * Event listener to save synctime after a successful sync. 
	 */
	syncTime : function(){
		var clocaltime = this.getTime();
		var sptime = Date.parseDate(clocaltime, "Y-m-d H:i:s");
		sptime = sptime.add(Date.MINUTE, -5);//subtract 5 minutes, just to be sure
		this.config.syncInfo.lastsynctime = sptime.format("Y-m-d H:i:s");
		this.saveConfig();
	}    
	
	
});