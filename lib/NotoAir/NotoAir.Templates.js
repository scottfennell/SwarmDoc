/*
NotoAir.Templates
Must create templates onload, so this function is set to be a global function to
create any templates that are needed 

*/

NotoAir.Templates = function(){
    //private
    var allHistoryTemplate = new Ext.XTemplate(
        '<div id="historyPanel">',
        '<h1>{title}</h1>',
        '<p>Edit History:<br/> ',
        '<table class="history" border="0" cellspacing="0" cellpadding="0">',
        '<thead><tr><th>Text ID</th><th>Edit Time</th><th>Compare</th><th></th><th>Revert</th></thead>',
        '<tbody>',
        '<tpl for="history">',
            '<tr>',
                '<td>{id}</td>',
                '<td>{time}</td>',
                '<td><input type="radio" /></td>',
                '<td><input type="radio" /></td>',
                '<td><a id="{id}">Revert</a></td>',
            '</tr>',
        '</tpl>',
        '</tbody>',
        '</table>',
        '</div>'
    );
    allHistoryTemplate.compile();
    
    return {
        //public object
        hist: allHistoryTemplate
    
    }
}();
