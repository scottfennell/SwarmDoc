/*
 * @author stillboy
 */
Ext.ns('NotoAir');

Ext.onReady(function(){
	Ext.QuickTips.init();
	
	//Setup console
	Ext.ns("console");
	console = air.Introspector.Console;
	/*
	console.log = function(){
		
	}
	console.warn = function(){
		alert("warn");
	}
	console.error = function(){
		alert('error');
	}
	*/


	NotoAir.App = function(){
		//Startup and global variables (local globals)
		return {
			appversion: "0.1",
			init : function(){
				this.q = Ext.QuickTips.getQuickTip();
		        this.database = new NotoAir.DB();
				this.database.on("deletePage",this.deletePage, this);
				this.database.on("newPage",this.newPage, this);
				this.database.on("externalPageUpdate",this.externalUpdate,this);
			    this.linksPanel = new NotoAir.LinksPanel();			    
			    this.wikiPanel = new NotoAir.WikiPanel();
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
			                text: "Pages",
			                children: [{
			                    text: 'Main',
			                    leaf: true
			                }, {
			                    text: 'All Pages',
			                    leaf: true
							
			                },{
			                    text: 'Settings',
			                    leaf: true
			                }, {
			                    expanded: true,//if this is not expanded we cannot add to it while it is collapsed
			                    text: 'Recent Edits',
			                    leaf: false,
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
				this.rootNavNode.appendChild(new Ext.tree.TreeNode({text:"Settings",leaf:true}));
			    this.rootNavRecentNode = new Ext.tree.TreeNode({text:"Recent Edits",leaf:false})
			    this.rootNavNode.appendChild(this.rootNavRecentNode);
			    //get 10 most recent and append to Recent Edits node
			    var recent = this.database.getMostRecent();
		        for(var i = 0; i<recent.length;i++){
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
				
				this.windowToolbar = new Ext.Toolbar({
					region:'north',
					height:25

				});

			    this.window = new Ext.Viewport({
			        layout: 'border',
			        items: [
						this.windowToolbar,
				        this.treePanel, //treePanel, 
				        this.centerContainer,
						
				        {//bottom pane
			                region: 'south',
			                title: 'Help',
			                collapsible: true,
			                html: 'Information goes here',
			                split: true,
			                height: 100,
			                minHeight: 100,
							collapsed: true
			        }]
			    });
			    this.wikiPanel.on("savepage", this.updateRecent, this);
			    this.wikiPanel.on("changepage",this.changePage,this);
			    this.wikiPanel.on("showHistory", this.showHistory, this);

			    this.wikiPanel.openPage(this.database.getPage("Main Page"));
			    //this.changePage();
			    //setTimeout(this.loadTree,10); //cant seem to do this here- 
			    //this.updateRecent();
				this.windowToolbar.add({
					text:"System",
					handler: this.systemMenu,
					scope: this
				});
		    },
		    /*
			Handle tree clicks -- check for a special entry in the switch, if there isnt any listed
			try pulling up the page
			*/
		    treeHandler : function(o,e){
		        switch(o.text){
		            case "All Pages":
		                this.showAllPagesPanel();
		                break;
					case "Recent Edits":
						break;//do nothing
					case "Settings":
						this.systemMenu();
						break;
		            default:
		                this.openPage(o.text);
		        }
		    },
		    
		    loadTree: function(){
		        NotoAir.App.updateRecent();
		    },
		    		    
		    //listener handler for the show history button
			//This adds a history panel to the center container ( a card layout ) so that the 
			//we can switch between the history and the page viewer
		    showHistory: function(wikiPanel, currentPage, historyOffset){
		        if(this.historyPanel !== undefined){
					this.centerContainer.remove(this.historyPanel, true);
				}
				this.historyPanel = new NotoAir.HistoryPanel({"currentPage":currentPage,"historyOffset":historyOffset});
				this.historyPanel.on("showHistoryDiff", this.showHistoryDiffPanel, this);
		        this.centerContainer.add(this.historyPanel);		        
		        this.centerContainer.getLayout().setActiveItem(this.historyPanel);
		    },
		    
			//change to the main view and remove and destroy the history panel
		    closeHistory: function(){
		        this.centerContainer.getLayout().setActiveItem(this.wikiPanel);
		        this.centerContainer.remove(this.historyPanel, true);		    
		    },
			
			systemMenu : function(){
				//Todo, check for what panel to create...
				//var settings = this.database.getExternal();
				//console.log("Settings",settings);
				this.settingsPanel = new NotoAir.SettingsPanel({database:this.database});
				this.settingsPanel.on("closePanel", this.closeSettingsPanel, this);
				this.settingsPanel.on("save",this.updateExternal,this);
		        this.centerContainer.add(this.settingsPanel);		        
		        this.centerContainer.getLayout().setActiveItem(this.settingsPanel);
			},
			
			closeSettingsPanel : function(){
				//TODO: step back one level, if we have a stack... this should be ok...
				this.centerContainer.getLayout().setActiveItem(this.wikiPanel);
		        this.centerContainer.remove(this.settingsPanel, true);	
			},
			
			updateExternal : function(e){
				this.database.saveConfig();
			},
			
			//Compare was was clicked - the same basic functions as the above
			showHistoryDiffPanel : function(currentPage, startId, endId){
				if(this.dpanel !== undefined){
					this.centerContainer.remove(this.dpanel, true);
				}
				this.dpanel = new NotoAir.DiffPanel({"currentPage":currentPage,"startId":startId,"endId":endId});
				this.dpanel.on("closePanel",this.closeDiffPanel, this);
				this.centerContainer.add(this.dpanel);
				//TODO: 
				//Assume that we are stacked up in the cardlayout as WikiPanel->HistoryPanel->DiffPanel - this will not work
				//if we try to add a settings panel anywher in there.
				this.centerContainer.getLayout().setActiveItem(this.dpanel);
			},
			
			closeDiffPanel : function(){
				this.centerContainer.getLayout().setActiveItem(this.historyPanel);
				this.centerContainer.remove(this.dpanel, true);
				this.dpanel.purgeListeners();
			},
			
			showAllPagesPanel : function(){
				//TODO: check for existing AllPagesPanel, we might have not closed it
				if(this.apPanel !== undefined){
					this.centerContainer.remove(this.apPanel, true);
				}
				this.apPanel = new NotoAir.AllPagesPanel({"database":this.database});
				this.apPanel.on("closeApPanel",this.closeAllPagesPanel, this);
				this.centerContainer.add(this.apPanel);
				var lay = this.centerContainer.getLayout();
				lay.setActiveItem(this.apPanel);
			},
			
			closeAllPagesPanel : function(){
				this.centerContainer.getLayout().setActiveItem(this.wikiPanel);
				this.centerContainer.remove(this.apPanel, true);
				this.apPanel.purgeListeners();
			},
		    
			//handle a click on a link in a wiki page- should open the page, or open a new window if
			//so
		    wikiClick : function(evt,t,o){
		        //should check for a valid 't' here but...
				this.openPage(t.textContent);
		    },
			
			linkClick : function(evt,t,o){
				//Do some more error checking here
				if (Ext.isAir) {
					var req = new air.URLRequest(t);
					air.navigateToURL(req);
				}
			},
			
			openPage: function(pname){
				//TODO: check for other open panels...
				this.centerContainer.getLayout().setActiveItem(this.wikiPanel);
				this.wikiPanel.openPage(this.database.getPage(pname));
				this.changePage();
			},
	    
			/*
			changePage is called when a new Page is loaded into the WikiPanel
			*/
		    changePage : function(p){
		        //get the currentPage from the wiki panel, then insert the title into this
		        //this.window.items.items[0].body.dom.innerHTML = 
		        //    '<h1 class="x-panel-header">'+this.wikiPanel.currentPage.title+'</h1>';
		    },
	    
			/*
			 * New page callback is run when a new page is created in the db, this should be 
			 * added to a most recent setting, this should manage a most recent branch in the 
			 * navigation tree
			 */
		    newPage : function(page){
		        //TODO do something better here, but for now - just add to the tree
		        if(NotoAir.App.treePanel != undefined){
		            if (page.title == undefined) {
						if (page.name != undefined) {
							page.title = page.name;
						}
						else {
							console.warn("NotoAir.App::newPage:Attempting to add a new page with no title to tree", page);
							return;
						}
					}//ok, just add as normal
					NotoAir.App.treePanel.root.appendChild({text:page.title,leaf:true});
		        }else{
		            console.warn("cannot appendChild to tree panel, root is null");
		        }
		    },
			
			deletePage : function(pageId, pageName){
				if(this.treePanel != undefined){
					var re = this.treePanel.root.findChild("text", "Recent Edits");
					var chld = re.findChild("text",pageName);
					if(chld != null){
						this.treePanel.root.removeChild(chld);
					}
				}
			},
			
			externalUpdate : function(pname){
				if(this.wikiPanel != undefined){
					console.log("current page name is "+this.wikiPanel.getCurrentPageName());
					if(this.wikiPanel.getCurrentPageName() == pname){
						console.log("page name match "+this.wikiPanel.getCurrentPageName());
						if(!this.wikiPanel.isEditor()){
							console.log("Opening page from extern update");
							this.openPage(pname);
						}
					}
				}
				this.updateRecent(pname);
				
			},
		    
		    updateRecent : function(p){
                //the tree should be populated on init, if not, then it does not matter
                //just add the most recent save.
				if(p.title == undefined){
					if (Ext.type(p) == "string") {
						p = {
							title: p
						};
					}else if(p.name != undefined){
						p.title = p.name;
					}else{
						console.warn("NotoAir.app::updateRecent - no title passed in arg:p",p);
						p = {title:"No title"};
					}
				}
				
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
				//console.log("history compare", arguments);
			},
		}//end return
	}();
	//NotoAir must be init'd after onReady
	NotoAir.App.init();	
});

