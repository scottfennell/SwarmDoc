 /*
NotoAir.DB

This is the database layer that is created by app and then used to query the local
or remote database.
*/

/*
 * 
 * This should extend the sql

NotoAir.SqlStore = Ext.extend(Ext.data.Store, {
	constructor: function(){
		NotoAir.SqlStore.superclass.constructor.call(this, {
	        sortInfo:{field: 'dueDate', direction: "ASC"},
	        groupField:'dueDate',
	        taskFilter: 'all',
	        reader: new Ext.data.JsonReader({
	            id: 'taskId',
				fields: tx.data.Task
	        })
	    });
		this.conn = tx.data.conn;
	    this.proxy = new Ext.sql.Proxy(tx.data.conn, 'task', 'taskId', this);
	}
});
*/
NotoAir.DB = function(){
    
    return {
        database : null,
        dbtype : 'remote',
        url : 'http://192.168.1.33/dev/',
        pages : [],
        texts : [],
        //TODO extend ext store and use event listeners
        npc : null, //npc = new page callback, call this function on a 

        
        init : function(){
            //startup
		    this.database = Ext.sql.Connection.getInstance();
		    this.database.open("NotoAir.db");
		    /*Table column type ref
		        *  TEXT (or STRING)
                * NUMERIC
                * INTEGER
                * REAL (or NUMBER)
                * BOOLEAN
                * DATE
                * XML
                * XMLLIST
                * OBJECT
                * NONE
		    */
		    console.log("App path: ",  air.File.applicationDirectory);
		    var pagesql =   "CREATE TABLE IF NOT EXISTS page ("+
		                "id INTEGER PRIMARY KEY AUTOINCREMENT,"+
        		        "name TEXT,"+
		                "text_id INTEGER DEFAULT 0,"+
		                "time DATE DEFAULT CURRENT_TIMESTAMP);"
		                
		    var textsql =   "CREATE TABLE IF NOT EXISTS text ("+
		                "id INTEGER PRIMARY KEY AUTOINCREMENT,"+
        		        "data TEXT DEFAULT '',"+
        		        "page_id INTEGER,"+
		                "time DATE DEFAULT CURRENT_TIMESTAMP);"
		                
		                
		    var dbout = this.database.query(pagesql); 
		    var dbout2 = this.database.query(textsql); 
        },
               
        getPage : function(title){
            //get the page object from the database, if it exists.
            //if there is no page, then we insert a new page with the current title
            
            if(this.database != null){
                var params = [title];
                var pSql = "SELECT * FROM page WHERE name=?";
                var pageR = this.database.queryBy(pSql,params);                
                var np = new NotoAir.Page({database:this});
                if(pageR.length > 0 && pageR[0].text_id > 0){
                    //should be 1 only
                    var pageId = pageR[0].id;
                    var textId = pageR[0].text_id;
                    var textSql = "SELECT * FROM text WHERE id=?";
                    var trow = this.database.queryBy(textSql,[textId]);
                    np.body = trow[0].data;
        	        var ghSql = "SELECT id,time FROM text WHERE page_id=? ORDER BY time DESC";
                    var hist = this.database.queryBy(ghSql,[pageId]);
                    if(hist.length > 1){
                        //hist.length--; dont decriment
                        np.history = hist;
                    }
					np.id = pageId;   
                }
                np.title = title;
                return np;                
            }else{
				console.error("database is not set in NotoAir.DB");
            }
        },
		/**
		 * savePage will save a page object to the database
		 * @param {Object} page
		 */
        savePage : function(page){
            /*
                Page reference 
            	this.body = '';
	            this.title = '';
	            this.settings = [];
	            this.tags = [];
	            this.history = [];
	            this.database = null;    
	            this.textId = null;
	            this.isNew = true;
            */
            if(page.title != ""){
                //get the previous page
                if(this.database != null){
                    var pSql = "SELECT * FROM page WHERE name=?";
                    var pageR = this.database.queryBy(pSql,[page.title]);
                    if(pageR.length>0){
                        //save the new text and update the pointer
                        console.log("Existing Page: "+page.title,pageR);
                        //pageR[0].id|name|text_id|time
                        var inText = "INSERT INTO text (data,page_id) VALUES (?,?)";
                        this.database.queryBy(inText, [page.body,pageR[0].id]);
                        var getId = "SELECT LAST_INSERT_ROWID()";
                        var rowId = this.database.query(getId);
	                    //return this.readResults(stmt.getResult());
	                    console.log(rowId[0]["LAST_INSERT_ROWID()"]);
	                    var updatePage = "UPDATE page SET text_id=? WHERE id=?";
	                    this.database.queryBy(updatePage, [rowId[0]["LAST_INSERT_ROWID()"], pageR[0].id]);
	                    console.log("update page");
	                    var ghSql = "SELECT id,time FROM text WHERE page_id=? ORDER BY time DESC";
	                    var hist = this.database.queryBy(ghSql,[pageR[0].id]);
	                    console.log("get hist");
	                    page.history = hist;
	                    return page;
                        
                    }else{
                        var npSql = "INSERT INTO page (name) VALUES (?)";
                        var pageObject = this.database.queryBy(npSql,[page.title]);
                        var cidSql = "SELECT * FROM page WHERE name=?";
                        pageObject = this.database.queryBy(cidSql,[page.title]);
                        console.log("Inserted new page: "+page.title,pageObject);
                        //var np = new NotoAir.Page({database:this});
                        //np.title = title;
                        return page;                
                    }
                }
            }
        },
        
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
        
        getMostRecent : function(){
            var sql = "SELECT * FROM page JOIN text ON page.text_id=text.id "+
                      "WHERE 1 ORDER BY text.time DESC LIMIT 10";
            var out = this.database.query(sql);
            console.log("Most Recent: ",out);
            return out;
        },
        
        addNewText : function(txt){
        
        },
        
        updateText : function(page /*this page*/){
            //get the new body,
            //save the page in the db to point to the latest text
            
            //CUrrently this just saves the page in the mini db. ok, array
            for(var i=0; i<this.pages.length; i++){
                if(this.pages[i].title == page.title){
                    //page already created
                    this.pages[i] = page;
                }
            }
        
        },
        
        saveText : function(txtObj){
            if(Ext.type(txtObj) == 'string'){
                //if the 
                this.texts[this.texts.length] = txtObj;
            }else{
                this.texts[txtObj.id] = txtObj.text;
            }
        
        },
        
        newPage : function(){
        
        },
		
		getAllPages : function(){
			var sql = "SELECT * FROM page";
            var out = this.database.query(sql);
            console.log("getAllPages: ",out);
            return out;
			
		},
        
        newCallback : function(cb){
            this.npc = cb;
        },
    }
}();
