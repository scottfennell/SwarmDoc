/**
 * @author stillboy
 */
// Ext.ux.HTMLEditorToolbar
// extension of Ext.Toolbar to cater for extensibility
Ext.ux.HTMLEditorToolbar = Ext.extend(Ext.Toolbar, {

  // overrides Ext.Toolbar.initComponent
  // first function to be called upon creation of toolbar
  initComponent: function() {

    // call Ext.Toolbar.initComponent
    Ext.ux.HTMLEditorToolbar.superclass.initComponent.call(this);

    // unable to use existing items collection for pre-render
    // configuration as it's updated by Ext.Toolbar during render
    this.tools = new Ext.util.MixedCollection(false, function(tool) {
      return tool.itemId || tool.id || Ext.id();
    });

  },

  // add tools (pre-render)
  addTools: function(tools) {
    tools = (tools instanceof Array) ? tools : [tools];
    for (var i = 0, len = tools.length; i < len; i++) {
      this.tools.add(tools[i]);
    }
  },

  // insert tools (pre-render)
  insertTools: function(index, tools) {
    tools = (tools instanceof Array) ? tools : [tools];
    for (var i = 0, len = tools.length; i < len; i++) {
      this.tools.insert(index + i, tools[i]);
    }
  },
  
  // insert tools before another tool (pre-render)
  insertToolsBefore: function(itemId, tools) {
    var index = this.tools.indexOfKey(itemId);
    this.insertTools(index, tools);
  },
  
  // insert tools after another tool (pre-render)
  insertToolsAfter: function(itemId, tools) {
    var index = this.tools.indexOfKey(itemId) + 1;
    this.insertTools(index, tools);
  },

  // render tools (performed after tools/plugins have been configured/reordered)
  renderTool: function(tool) {

    // cater for new tbcombo component
    // created to split configuration from render
    if (typeof tool == "object" && tool.xtype && tool.xtype == "tbcombo") {

      // not catered for in Ext.Toolbar.add function
      // as it defaults to addField instead of addItem
      this.addItem(Ext.ComponentMgr.create(tool));

    }
    else {
      
      // else use existing Ext.Toolbar.add function
      // to render tools
      this.add(tool);

    }

  },

  // overrides Ext.Toolbar.onRender
  onRender: function(ct, position) {
    
    // call Ext.Toolbar.onRender
    Ext.ux.HTMLEditorToolbar.superclass.onRender.call(this, ct, position);

    // loop through pre-configured/reordered tools and render each accordingly
    this.tools.each(this.renderTool, this);

  }
  
});

// Ext.ux.HTMLEditorToolbar.ComboBox
// created to handle the pre-configuration of a combobox (pre-render)
Ext.ux.HTMLEditorToolbar.ComboBox = function(config) {
  
  Ext.apply(this, config);

  // create combobox in memory before render
  var selEl = document.createElement("select");
  selEl.className = this.cls;
  for (var i = 0, len = this.opts.length; i < len; i++) {
    var opt = this.opts[i];
    var optEl = document.createElement('option');
    optEl.text = opt.text;
    optEl.value = opt.value;
    if (opt.selected) {
      optEl.selected = true;
      this.defaultValue = opt.value;
    }
    selEl.options.add(optEl);
  }
  if (! this.defaultValue) {
    this.defaultValue = this.opts[0].value;
  }
  
  // call Ext.Toolbar.Item constructor passing combobox
  Ext.ux.HTMLEditorToolbar.ComboBox.superclass.constructor.call(this, selEl);
  
}

// Ext.ux.HTMLEditorToolbar.ComboBox
// extension of Ext.Toolbar.Item
Ext.extend(Ext.ux.HTMLEditorToolbar.ComboBox, Ext.Toolbar.Item, {

  // overrides Ext.Toolbar.Item.render
  render: function(td) {
    
    // call Ext.Toolbar.Item.render
    Ext.ux.HTMLEditorToolbar.ComboBox.superclass.render.call(this, td);

    // add handler for combobox change event
    Ext.EventManager.on(this.el, 'change', this.handler, this.scope);
    
  }
  
});

// register Ext.ux.HTMLEditorToolbar.ComboBox as a new component
Ext.ComponentMgr.registerType('tbcombo', Ext.ux.HTMLEditorToolbar.ComboBox);