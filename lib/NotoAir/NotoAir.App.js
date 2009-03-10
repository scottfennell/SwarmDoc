/*
 * @author stillboy
 */
Ext.ns('NotoAir');

Ext.onReady(function(){
	
	air.Introspector.Console.log("Test"); 
	Ext.ns("console");
	console = air.Introspector.Console;
    


	

	NotoAir.App = function(){
		//Startup and global variables (local globals)
		return {
			init : function(){
			    //TODO: get Items for the navigation tree
			    //TODO: get the Main Page
		        //this.data = new 

		        NotoAir.DB.init();
		        //TODO: extend Ext.data.store/sql so that we can add an event listener here the ext way
		        NotoAir.DB.newCallback(this.newPageCallback);
			    
			    this.linksPanel = new NotoAir.LinksPanel();
			    
			    this.wikiPanel = new NotoAir.WikiPanel();
			    
			    //var newPage = new NotoAir.page({database:this.data});
			    //newPage.setBody("<h1>NEWWWWW</h1>");
			    this.treePanel = new Ext.tree.TreePanel({
			            region: 'west',
			            collapsible: true,
			            title: 'Navigation',
			            xtype: 'treepanel',
			            width: 200,
			            autoScroll: true,
			            split: true,
			            //loader: new Ext.tree.TreeLoader(),
			            root: new Ext.tree.TreeNode({
			            //root: new Ext.tree.TreeNode({
			                expanded: true,
			                text: "turbo",
			                children: [{
			                    text: 'Main',
			                    leaf: true
			                }, {
			                    text: 'All Pages',
			                    leaf: true
			                }, {
			                    expanded: true,//if this is not expanded we cannot add to it while it is collapsed
			                    text: 'Recent Edits',
			                    leaf: false,
			                    //children:[
			                    //    {text:"super",leaf:true},
			                    //    {text:"super1",leaf:true}
			                    //]
			                }]
			            }),
			            rootVisible: true,
			            listeners: {
			                click: function(o,e){
			                    this.treeHandler(o,e);
			                },
			                scope: this
			            }
			        }
			    );
			    this.rootNavNode = this.treePanel.getRootNode();
			    this.rootNavNode.appendChild(new Ext.tree.TreeNode({text:"Main Page",leaf:true}));
			    this.rootNavNode.appendChild(new Ext.tree.TreeNode({text:"All Pages",leaf:true}));
			    this.rootNavRecentNode = new Ext.tree.TreeNode({text:"Recent Edits",leaf:false})
			    this.rootNavNode.appendChild(this.rootNavRecentNode);
			    //get 10 most recent and append to Recent Edits node
			    var recent = NotoAir.DB.getMostRecent();
		        for(var i = 0; i<recent.length;i++){
		            console.log("New recent node: "+recent[i].name);  
		            //this.recentTree.appendChild({
		            this.rootNavRecentNode.appendChild(
		                new Ext.tree.TreeNode({text: recent[i].name,leaf: true})
		            );
		        }
		        this.centerContainer = new Ext.Panel({
		            layout:'card',
		            region:'center',
		            border:false,
		            activeItem:0,
		            bodyBorder:false,
		            items: [this.wikiPanel]
		        });

			    this.window = new Ext.Viewport({
			        layout: 'border',
			        items: [{
			            region: 'north',
			            html: '<h1 class="x-panel-header">Page Title</h1>',
			            autoHeight: true,
			            border: false,
			            margins: '0 0 5 0'
			        },
			        this.treePanel, //treePanel, 
			        this.centerContainer,
			        {//bottom pane
		                region: 'south',
		                title: 'Information',
		                collapsible: true,
		                html: 'Information goes here',
		                split: true,
		                height: 100,
		                minHeight: 100
			        }]
			    });
			    this.wikiPanel.on("savepage", this.updateRecent, this);
			    this.wikiPanel.on("changepage",this.changePage,this);
			    this.wikiPanel.on("showHistory", this.showHistory, this);
			    this.wikiPanel.openPage(NotoAir.DB.getPage("Main Page"));
			    //this.changePage();
			    //setTimeout(this.loadTree,10); //cant seem to do this here- 
			    //this.updateRecent();
		    },
		    /*
			Handle tree clicks -- check for a special entry in the switch, if there isnt any listed
			try pulling up the page
			*/
		    treeHandler : function(o,e){
		        //o.text is the tree node text
		        console.log(o);
		        console.log(e);
		        switch(o.text){
		            case "All Pages":
		                this.specialPages(o,e)
		                break;
		            default:
		                this.wikiPanel.openPage(NotoAir.DB.getPage(o.text));
		                
		        }
		        //this.changePage();
		    },
		    
		    loadTree: function(){
		        console.log('called from settimeout');
		        NotoAir.App.updateRecent();
		    },
		    
		    //handler for special pages
		    specialPages: function(o,e){
		        //get the function
		        //o.text
		        
		        //create the panel and insert it inot the main windo
		        
		    
		    },
		    
		    //listener handler for the show history button
		    showHistory: function(wikiPanel, currentPage, historyOffset){
		        //this.wikiPanel.hide();
		        //this.centerContainer.remove(this.wikiPanel, false);

		        this.historyPanel = new NotoAir.HistoryPanel({"currentPage":currentPage,"historyOffset":historyOffset});
		        
		        this.centerContainer.add(this.historyPanel);
		        
		        //this.historyPanel.on("closePanel", this.closeHistory, this);
		        //this.historyPanel.on("showHistory", this.showPageHistory, this);

		        //this.centerContainer.doLayout();
		        this.centerContainer.getLayout().setActiveItem(1);
		    },
		    
		    closeHistory: function(){
		        //event handler for history panel
		        this.centerContainer.getLayout().setActiveItem(0);
		        this.centerContainer.remove(this.historyPanel, true);
		        //this.wikiPanel.show();
		        //this.centerContainer.doLayout();
		    
		    },
		    
		    showPageHistory: function(){
		        //event handler for history panel
		    
		    },
		    
		    wikiClick : function(evt,t,o){
		        air.trace("wikiClick start : "+new Date().getTime());
		        //should check for a valid 't' here but...
		        this.wikiPanel.openPage(NotoAir.DB.getPage(t.textContent));
		        air.trace("wikiClick beforeChangePage : "+new Date().getTime());
		        this.changePage();
		        air.trace("wikiClick return : "+new Date().getTime());
		        
		    },
	    
			/*
			changePage is called when a new Page is loaded into the WikiPanel
			*/
		    changePage : function(p){
		        //get the currentPage from the wiki panel, then insert the title into this
		        this.window.items.items[0].body.dom.innerHTML = 
		            '<h1 class="x-panel-header">'+this.wikiPanel.currentPage.title+'</h1>';
		    },
	    
			/*
			 * New page callback is run when a new page is created in the db, this should be 
			 * added to a most recent setting, this should manage a most recent branch in the 
			 * navigation tree
			 */
		    newPageCallback : function(page){
		        //TODO do something better here, but for now - just add to the tree
		        if(NotoAir.App.treePanel != undefined){
		            NotoAir.App.treePanel.root.appendChild({text:page.title,leaf:true});
		        }else{
		            console.log("cannot appendChild to tree panel, root is null");
		            console.log(NotoAir.App);
		        }
		    },
		    
		    updateRecent : function(p){
                //the tree should be populated on init, if not, then it does not matter
                //just add the most recent save.
                
                console.log("tree rendered?", NotoAir.App.treePanel.rendered);
                var existCheck = this.rootNavRecentNode.findChild("text", p.title);
                if(existCheck != null){
                    this.rootNavRecentNode.removeChild(existCheck);
                }
                if(this.rootNavRecentNode.item(0) != null){
	                this.rootNavRecentNode.insertBefore(
	                    new Ext.tree.TreeNode({text: p.title, leaf: true}),
	                    this.rootNavRecentNode.item(0)
	                );
	            }else{
	                this.rootNavRecentNode.appendChild(
    	                new Ext.tree.TreeNode({text: p.title, leaf: true})
    	            );
	            }
	            
	            if(this.rootNavRecentNode.childNodes.length > 9){
	                var nd = this.rootNavRecentNode.item(10);
	                if(nd != null){
	                    nd.remove();
	                }
	                
	            }
		    },
			
			historyCompare : function(){
				console.log("history compare", arguments);
			}
			
			
		}//end return
	}();
		//NotoAir must be init'd after onReady
	//NotoAir.approot = new NotoAir.App();	
	//Air.trace(NotoAir);
	NotoAir.App.init();
	air.trace("trace TEST");
	air.Introspector.Console.log("Test"); 
	
	
});

