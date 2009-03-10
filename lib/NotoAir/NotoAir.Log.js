/**
 * @author stillboy
 */
NotoAir.log = function(txt){
	//try to determine where we should be throwing this too...
	if(console.log != undefined){
		console.log(txt);
	}
}
