 /*
NotoAir.DB

This is the database layer that is created by app and then used to query the local
or remote database.
*/

/*
 * 
 * This should extend the sql
 * Permission_id is unix like
 * 600 - rw-private
 * 660 - rw-group
 * 666 - rw-all
 * vd
 * 400 - r-private
 * 440 - r-private-group
 * 444 - r-all
 * 
 */

NotoAir.DB = Ext.extend(Ext.util.Observable, {

	database : null,
	dbtype : 'remote',
	url : 'http://192.168.1.33/dev/',
	pages : [],
	texts : [],
	defaultConfig : {
		version:"1.0",
		databaseFile:"NotoAir.db",
		username: "",
		password: "",
		webPath: "http://localhost/dev/NotoAirWeb/",
		saveEncPass: false,
		encryptionPassword:"",
		syncInfo:{}
	},
	
	constructor: function(config){
		Ext.apply(this, config);
		NotoAir.DB.superclass.constructor.call(this);
		
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
	    //var store = air.File.applicationStorageDirectory.resolvePath( );
	    //console.log("App path: ,  air.File.applicationDirectory);
		this.readConfig();
		this.database.open(this.config.databaseFile);
		this.createTables();
		this.server = new NotoAir.Server({database:this,basePath:this.config.webPath});
		this.server.on("syncSuccess",this.syncTime,this);
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
					"permission_id INTEGER DEFAULT 600,"+
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
	
	saveConfig : function(){
		if(!this.config.saveEncPass){
			this.encryptionPassword = "";
		}
		
		var file = air.File.applicationStorageDirectory.resolvePath("configuration.json"); 
		stream = new air.FileStream();
		stream.open(file, air.FileMode.WRITE);
		stream.writeUTFBytes(Ext.encode(this.config));
		stream.close();
	},
	       
	getPage : function(title){
	    //get the page object from the database, if it exists.
	    //if there is no page, then we insert a new page with the current title
	    
	    if(this.database != null){
	        var params = [title];
	        var pSql = "SELECT * FROM page WHERE name=?";
	        var pageR = this.database.queryBy(pSql,params);                
	        var np = new NotoAir.Page({database:this});
	        if(pageR.length > 0 ){
	            //should be 1 only
	            var pageId = pageR[0].id;
				//TODO i am pretty sure the page.body is no longer used and I just refer to text in the
				//index of history
				if (pageR[0].text_id > 0) {
					var textId = pageR[0].text_id;
					var textSql = "SELECT * FROM text WHERE id=?";
					var trow = this.database.queryBy(textSql, [textId]);
					np.body = trow[0].data;
				}
		        var ghSql = "SELECT id,time,reason,unique_id FROM text WHERE page_id=? ORDER BY time DESC";
	            var hist = this.database.queryBy(ghSql,[pageId]);
				
			    np.text = hist;
				if (pageR[0].text_id > 0) {
					var textId = pageR[0].text_id;
					var textSql = "SELECT * FROM text WHERE id=?";
					var trow = this.database.queryBy(textSql, [textId]);
					np.body = trow[0].data;
					if(trow.length>0 && trow[0].data != undefined && trow[0].data != null){
						np.text[0].data = trow[0].data; //since we already got the data, add it					
					}else{
						np.text[0].data = '';
					}
				}else{
					if (np.text.length > 0) {
						var textId = np.text[0].id;
						var textSql = "SELECT * FROM text WHERE id=?";
						var trow = this.database.queryBy(textSql, [textId]);
						np.body = trow[0].data;
						np.text[0].data = trow[0].data;
					}
				}
				np.id = pageId;   
				np.permission_id = pageR[0].permission_id;
				np.info = pageR[0].info;
				np.user_id = pageR[0].user_id;
				np.time = pageR[0].time;

	        }else{
				if (title == "Main Page") {
					np.body = "<h1>Default Main Page</h1><p>This is the main page, hit edit above to edit me click [[help]] for more info</p>";
					np.text = [{
						data: np.body
					}];
				}else if(title == "Help"){
					np.body = "<h1>Default Help</h1><p>This is the main page, hit edit above to edit me</p>";
					np.text = [{
						data: np.body
					}];		
					np.permission_id = 444;//Read by everyone		
					np.user_id = 0;						
				}
			}
			
			if (np.user_id != undefined && np.permission_id != undefined) {
				if (np.user_id == 0) {
					if (np.permission_id >= 600) {
						np.edit = true;
					}
					else {
						np.edit = false;
					}
				}
				else {
					//to fix group permissions, for now
					if (np.permission_id == 666) {
						np.edit = true;
					}
					else {
						np.edit = false;
					}
				}
			}else{
				np.edit = true;
			}
	        np.title = title;
	        return np;                
	    }else{
			console.error("database is not set in NotoAir.DB object");
	    }
	},
	
	/**
	 * savePage will save a page object to the database
	 * if the page.id var is not set or is negative, we assume this is a new page
	 * and will insert a new page into the databas
	 * 
	 * either way we will insert the text[0] var into the text db, 
	 * 
	 * @param {Object} page
	 */
	savePage : function(page){
	    /*
	        Page reference 
	    	this.body = ''; //GONE
	        this.title = '';
	        this.settings = [];
	        this.tags = [];
	        this.history = []; // this.text[]
	        this.database = null;    
	        this.textId = null;
	        this.isNew = true;
	    */
		this.fireEvent("beforeSavePage", page);
	    if(page.title != ""){
	        //get the previous page
	        if(this.database != null){
	            if(page.id == undefined || page.id < 0) {
					var npSql = "INSERT INTO page (name) VALUES (?)";
	                var pageObject = this.database.queryBy(npSql,[page.title]);
	                var cidSql = "SELECT * FROM page WHERE name=?";
	                //Create new page
	                var getId = "SELECT LAST_INSERT_ROWID()";
	                var rowId = this.database.query(getId);
					var pageObj = this.database.queryBy(cidSql,[page.title]);
					page.id = pageObj[0].id;
					this.fireEvent("newPage",page);
				}//else existing page
				
				var uniqueId = this.genUnique();
				//Save the text to the text table and update the page to point to the new text
				var inText = "INSERT INTO text (data,page_id,reason,unique_id) VALUES (?,?,?,?)";
                this.database.queryBy(inText, [page.text[0].data,page.id,page.text[0].reason,uniqueId]);

                var getId = "SELECT LAST_INSERT_ROWID()";
                var rowId = this.database.query(getId);
				page.text[0].id = rowId[0]["LAST_INSERT_ROWID()"];
                var updatePage = "UPDATE page SET text_id=? WHERE id=?";
                this.database.queryBy(updatePage, [rowId[0]["LAST_INSERT_ROWID()"], page.id]);

				this.fireEvent("savePage",page);
				this.fireEvent("afterSavePage",page);
				//force sync on save
				this.sync();
                return page;
	        }else{
				console.error("Database is not set in Notoair.DB object",this);
			}
	    }else{
			console.error("Trying to save a page without a title",page);
		}
	},
	
	/**
	 * take a unified page object, like the results from the server and insert
	 * This does not function within the normal 'savepage' so, we should not use that
	 * @param {Object} pageObj
	 */
	insertPage: function(pageObj){
		if(pageObj.name != undefined){
			var chkId = "SELECT id FROM page WHERE name=? LIMIT 1";
			var res = this.database.queryBy(chkId, [pageObj.name]);
			if(res.length>0){
				//found
				pageObj.id = res[0].id;
			}
		}
	
		if (pageObj.id == undefined) {
			var npSql = "INSERT INTO page (name) VALUES (?)";
			var pageObject = this.database.queryBy(npSql, [pageObj.name]);
			var cidSql = "SELECT * FROM page WHERE name=? LIMIT 1";
			//Create new page
			var getId = "SELECT LAST_INSERT_ROWID()";
			var rowId = this.database.query(getId);
			var resObj = this.database.queryBy(cidSql, [pageObj.name]);
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
			var sql = "INSERT INTO text (data,page_id,reason,unique_id) VALUES (?,?,?,?)";
			this.database.queryBy(sql, [pageObj.data,pageObj.id,pageObj.reason,pageObj.unique_id]);
		}else{
			//IF texttime is set, it needs to be in the correct format and already set
			var sql = "INSERT INTO text (data,page_id,reason,unique_id,time) VALUES (?,?,?,?,?)";
			this.database.queryBy(sql, [pageObj.data,pageObj.id,pageObj.reason,pageObj.unique_id,pageObj.texttime]);
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
				case "600":
				case "660":
				case "666":
				case "400":
				case "444":
				case "444":
				case "644":
					break;
				default:
					console.warn("Not saving permission, incorrect id",page);
					return false; //if I fell through, then dont save, only allow the above
				
			}
			var sql = "UPDATE page SET permission_id=? WHERE id=?";
			this.database.queryBy(sql,[page.permission_id,page.id]);
		}
	},
	
	/**
	 * getTextFromID will return the text for the text at id... simple accesspre
	 * @param {Object} id
	 */
	
	getTextFromID : function(id){
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
	
	/**
	 * getMostRecent will return the latest pages that have been updated for inserting into
	 * the menu for easy access..
	 */
	
	getMostRecent : function(){
	    var sql = "SELECT * FROM page JOIN text ON page.text_id=text.id "+
	              "WHERE 1 ORDER BY text.time DESC LIMIT 10";
	    var out = this.database.query(sql);
	    return out;
	},
	
	/**
	 * getAllPages will just get all the pages without any text data... 
	 * for showing in a table... etc
	 */	
	getAllPages : function(){
		var sql = "SELECT page.id AS id, page.name AS name, DATETIME(text.time) AS time, DATETIME(page.time) AS created, COUNT(text.id) AS textcount, page.permission_id AS permission_id FROM page JOIN text ON page.id=text.page_id  GROUP BY text.page_id ORDER BY text.time DESC";
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
		var sql = "UPDATE page SET permission_id='600' WHERE id=?";
		this.database.queryBy(sql,[pageId]);
		return true;
	},
	makePublic : function(pageId, pageName){
		var sql = "UPDATE page SET permission_id='644' WHERE id=?";
		this.database.queryBy(sql,[pageId]);
		return true;
	},
	
	netConnected: function(){
		return  true;
	},
	
	sync : function(){
		if(this.serverTimeDiff == undefined){
			//setup a listener for when this becomes ready, let server handle trying to connect
			this.server.on('serverTimeResponse',this.sync, this);
		}else{
			this._sync();
		}
	},
	
	_sync : function(){
		/**
		 * Check to see if we stored the last sync time, this should be the last time pulled from a sync
		 * off the database
		 * See http://www.sqlite.org/lang_datefunc.html for info on sqlite datetime
		 */
		if(!this.netConnected()){
			return;
		}
		
		if(this.config.syncInfo.lastsynctime){
			var sql = "SELECT page.id AS id,page.name AS name,page.info AS info,text.data AS data,datetime(text.time) AS texttime,text.reason AS reason,text.id AS textid, text.unique_id AS uniqueid FROM page JOIN text ON page.id=text.page_id WHERE DATETIME(text.time)>DATETIME(?) ORDER BY text.time DESC";
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
			var sql = "SELECT page.id AS id,page.name AS name,page.info AS info,text.data AS data,datetime(text.time) AS texttime,text.reason AS reason,text.id AS textid, text.unique_id AS uniqueid FROM page JOIN text ON page.id=text.page_id ORDER BY text.time DESC";
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
	
	addZero:function(tx){
		if(tx<10){
			return "0"+tx;
		}else{
			return ""+tx;
		}
	},
	
	genUnique:function(){
		var tm = new Date();
		var time = Date.UTC(tm.getFullYear(), tm.getMonth(), tm.getDay(), tm.getHours(), tm.getMinutes(), tm.getSeconds(),tm.getMilliseconds());
		var time = time.toString(16);
		var mod = Math.floor(Math.random()*100);		
		//1,241,142,698,481 //ms since epoch
		//   31,536,000,000 //ms per year
		//1,198,368,000,000
		time = time.substring(2);//lop off the most significant, for funsies
		mod = mod.toString(16);
		var all = mod + time;
		return all;
	},
	//Return a string of the javascript time for now in the format 
	//This should also 
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



		/*
		 * --pagesync
		 * pageid
		 * external_id
		 * external_source_id
		 * external_lasttime //the last time that i checked the server
		 * external_info //extended information about this page...
		 * 
		 * --externalsource
		 * id
		 * type - 0=server, 1=filesystem, 2=ftp, ... etc
		 * path - //
		 * info - //serialized information such as login information specific to type
		 * 
		 * --textsync
		 * text_id
		 * external_text_id
		 */