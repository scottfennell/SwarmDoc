/**
 * @author stillboy
 */

NotoAir.Plugin = {
		
	init:function(){
		//suckers
	}
	,wikify:function(text, elm){
		//use scope when setting up event handlers.
		
		//parse text
		//update text
		//add and event handler within the scope of the above 'scope' var from the element elm
		
		//example
		elm.on('mousedown', this.handleLink, this, {delegate:'span.link'});
		return text;
	}
	,handleLink: function(e){
		//e is an Ext.EventObject
		//this needs be able to handle a event out of context of the page, 
	}
};
