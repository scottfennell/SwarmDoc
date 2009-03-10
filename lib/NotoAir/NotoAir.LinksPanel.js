/**
 * @author stillboy
 */
NotoAir.LinksPanel = Ext.extend(Ext.Panel, {
	/*
	linksPanel is a simple panel that should handle the links interface 
	Basically this will handle the main navigation links.
	*/  
	 // configurables
	id:'action-panel',
	region:'west',
	split:true,
	collapsible: true,
	collapseMode: 'mini',
	width:200,
	minWidth: 150,
	border: false,
	baseCls:'x-plain'
	,cls:'link-panel' //?
	,links:[{
			text:'Link 1'
			,href:'#'
		},{
			text:'Link 2'
			,href:'#'
		},{
			text:'Link 3'
			,href:'#'
		}]
	,layout:'fit'
	,tpl:new Ext.XTemplate('<ul><tpl for="links"><li><a class="examplelink" href="{href}">{text}</a></li></tpl></ul>')
	,afterRender:function() {
		// call parent
		NotoAir.LinksPanel.superclass.afterRender.apply(this, arguments);
		// create links
		this.tpl.overwrite(this.body, {links:this.links});
	
	}
	,addLink: function(linkObj){
		switch(Ext.type(linkObj)){
			case "array":
				Ext.each(linkObj, addLink, this);
				break;
			case "object":
				this.links[this.links.length] = linkObj;
				this.tpl.overwrite(this.body, {links:this.links});
				break;
			case "string":
				this.links[this.links.length] = {text:linkObj,href:'#'};
				this.tpl.overwrite(this.body, {links:this.links});
				break;
			default:
				console.log("Adding link to links panel is wrong type:"+linkObj);
		}
	}
	,clearLinks: function(){
		this.links = [];
		this.tpl.overwrite(this.body, {links:this.links});
	}
	,refreshLinks: function(linksObj){
		this.clearLinks();
		this.addLink(linksObj);
	}
}); // e/o extend
Ext.reg('linkspanel', NotoAir.LinksPanel);
