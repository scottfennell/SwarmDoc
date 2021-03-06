
/*
 *  * @author stillboy
 */
Ext.ns('SwarmDoc');

Ext.onReady(function(){
	
	Ext.QuickTips.init();
	
	//Setup console
	Ext.ns("console");
	
	//console = air.Introspector.Console;
	if(air.Introspector != undefined){
		console = air.Introspector.Console;
	}else{
		console.log = function(){
			//if(SwarmDoc.App != undefined && SwarmDoc.App.database != undefined){
			//	SwarmDoc.App.database.log("<h3>Log : "+new Date()+"</h3>",arguments);
			//}	
		}
		console.warn = function(){
			//if(SwarmDoc.App != undefined && SwarmDoc.App.database != undefined){
			//	SwarmDoc.App.database.log("<h3>Warn : "+new Date()+"</h3>",arguments);
			//}	
		}
		console.error = function(){
			alert(arguments);
			//if(SwarmDoc.App != undefined && SwarmDoc.App.database != undefined){
			//	SwarmDoc.App.database.log("<h3>Error : "+new Date()+"</h3>",arguments);
			//}	
		}
	}
	
	SwarmDoc.App = function(){
		//Startup and global variables (local globals)
		return {
			appversion: "0.1",
			init : function(){
				this.q = Ext.QuickTips.getQuickTip();
		        this.database = new SwarmDoc.DB();
				this.database.on("deletePage",this.deletePage, this);
				this.database.on("newPage",this.newPage, this);
				this.database.on("externalPageUpdate",this.externalUpdate,this);
			    this.wikiPanel = new SwarmDoc.WikiPanel();
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
			    this.rootNavNode.appendChild(new Ext.tree.TreeNode({text:"Main Page",leaf:true,iconCls:"x-tree-node-icon-home"}));
			    this.rootNavNode.appendChild(new Ext.tree.TreeNode({text:"All Pages",leaf:true,iconCls:"x-tree-node-icon-all"}));
				this.rootNavNode.appendChild(new Ext.tree.TreeNode({text:"Settings",leaf:true,iconCls:"x-tree-node-icon-settings"}));
				this.rootNavNode.appendChild(new Ext.tree.TreeNode({text:"Help",leaf:true,iconCls:"x-tree-node-icon-page"}));
				this.rootNavNode.appendChild(new Ext.tree.TreeNode({text:"Sync",leaf:true,iconCls:"x-tree-node-icon-sync"}));
			    this.rootNavRecentNode = new Ext.tree.TreeNode({text:"Recent Edits",leaf:false})
			    this.rootNavNode.appendChild(this.rootNavRecentNode);
			    //get 10 most recent and append to Recent Edits node
			    var recent = this.database.getMostRecent();

		        for(var i = 0; i<recent.length;i++){
		            this.rootNavRecentNode.appendChild(
		                new Ext.tree.TreeNode({text: recent[i].name, leaf: true, iconCls:"x-tree-node-icon-page"})
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
			        items: [
				        this.treePanel, //treePanel, 
				        this.centerContainer,
					]
			    });
			    this.wikiPanel.on("savepage", this.updateRecent, this);
			    this.wikiPanel.on("changepage",this.changePage,this);
			    this.wikiPanel.on("showHistory", this.showHistory, this);
			    this.wikiPanel.openPage(this.database.getPage("Main Page"));
		    },
		    /*
			Handle tree clicks -- check for a special entry in the switch, if there isnt any listed
			try pulling up the page
			*/
		    treeHandler : function(o,e){
				
		        switch(o.text){
		            case "All Pages":
						this.closeEditor();
		                this.showAllPagesPanel();
		                break;
					case "Recent Edits":
					case "Pages":
						break;//do nothing
					case "Settings":
						this.closeEditor();
						this.systemMenu();
						break;
					case "Sync":
						this.database.sync();
						break;
		            default:
						this.closeEditor();
		                this.openPage(o.text);
		        }
		    },
			
			alert: function(alert){
				Ext.Msg.alert("Notify",alert);
			},
		    
		    loadTree: function(){
		        SwarmDoc.App.updateRecent();
		    },
		    		    
		    //listener handler for the show history button
			//This adds a history panel to the center container ( a card layout ) so that the 
			//we can switch between the history and the page viewer
		    showHistory: function(wikiPanel, currentPage, historyOffset){
		        if(this.historyPanel !== undefined){
					this.centerContainer.remove(this.historyPanel, true);
				}
				this.historyPanel = new SwarmDoc.HistoryPanel({"currentPage":currentPage,"historyOffset":historyOffset});
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
				if(this.settingsPanel != undefined){
					this.centerContainer.remove(this.settingsPanel, true);
					this.settingsPanel = null;
				}
				this.settingsPanel = new SwarmDoc.SettingsPanel({
					database: this.database
				});
				//Does not work... the settings panel is getting destroyed before this is executed
				//this.settingsPanel.on("usernameChange", this.updateUsername,this);
				this.settingsPanel.on("closePanel", this.closeSettingsPanel, this);
				this.settingsPanel.on("save", this.updateExternal, this);
				this.centerContainer.add(this.settingsPanel);
				this.centerContainer.getLayout().setActiveItem(this.settingsPanel);
			},
			
			closeSettingsPanel : function(){
				//TODO: step back one level, if we have a stack... this should be ok...
				this.centerContainer.getLayout().setActiveItem(this.wikiPanel);
		        this.centerContainer.remove(this.settingsPanel, true);	
			},
			
			updateExternal : function(config){
				//Should check username and password with server right now... or at least try to
				console.log("SaveConfig");
				this.database.saveConfig(config);
			},
			
			//Compare was was clicked - the same basic functions as the above
			showHistoryDiffPanel : function(currentPage, startId, endId){
				if(this.dpanel !== undefined){
					this.centerContainer.remove(this.dpanel, true);
				}
				this.dpanel = new SwarmDoc.DiffPanel({"currentPage":currentPage,"startId":startId,"endId":endId});
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
				this.apPanel = new SwarmDoc.AllPagesPanel({"database":this.database});
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
				this.closeEditor();
				//console.log(t);
				//this.openPage(t.textContent);
				this.openPage(t.id);
		    },
			
			linkClick : function(evt,t,o){
				//Do some more error checking here
				console.log("LinkClick:",evt,t,o);
				if (Ext.isAir) {
					var req = new air.URLRequest(t);
					air.navigateToURL(req);
				}
			},
			
			openPage: function(pname){
				var activeItem = this.centerContainer.getLayout().activeItem;				
				if(activeItem != this.wikiPanel){
					this.centerContainer.remove(activeItem,true);
				}
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
		        if(SwarmDoc.App.treePanel != undefined){
		            if (page.title == undefined) {
						if (page.name != undefined) {
							page.title = page.name;
						}
						else {
							console.warn("SwarmDoc.App::newPage:Attempting to add a new page with no title to tree", page);
							return;
						}
					}//ok, just add as normal
					//SwarmDoc.App.treePanel.root.appendChild({text:page.title,leaf:true});
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
			
			closeEditor : function(){
				//Find out if the editor is open and trigger the switch to close it
				if(this.wikiPanel != undefined){
					if(this.wikiPanel.isEditor()){
						this.wikiPanel.showView();
					}
				}
			},
			
			externalUpdate : function(pname){
				/*
				 * Check to see if we are viewing the page that is being updated and update that page
				 */
				if(this.wikiPanel != undefined){
					if(this.wikiPanel.getCurrentPageName() == pname){
						if(!this.wikiPanel.isEditor()){
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
						console.warn("SwarmDoc.app::updateRecent - no title passed in arg:p",p);
						p = {title:"No title"};
					}
				}
				
                var existCheck = this.rootNavRecentNode.findChild("text", p.title);
                if(existCheck != null){
                    this.rootNavRecentNode.removeChild(existCheck);
                }
                if(this.rootNavRecentNode.item(0) != null){
	                this.rootNavRecentNode.insertBefore(
	                    new Ext.tree.TreeNode({text: p.title, leaf: true,iconCls:"x-tree-node-icon-page"}),
	                    this.rootNavRecentNode.item(0)
	                );
	            }else{
	                this.rootNavRecentNode.appendChild(
    	                new Ext.tree.TreeNode({text: p.title, leaf: true,iconCls:"x-tree-node-icon-page"})
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
	SwarmDoc.App.Templates = {
        categoryCombo : new Ext.XTemplate('<tpl for="."><div class="x-combo-list-item">{themeName}</div></tpl>'),
        ciCombo : new Ext.XTemplate('<tpl for="."><div class="x-combo-list-item">{text}</div></tpl>')
    };
	//SwarmDoc must be init'd after onReady
	SwarmDoc.App.init();	
});

