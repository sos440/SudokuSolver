/* ***********************************************
	Macro constants
*********************************************** */
// Event Type
var ON_UPDATE_REQUEST = 0x0001;
var ON_SOLVE_REQUEST = 0x0002;

// UpdateRequest Type
var UR_NONE = 0x0000;
var UR_INITIALIZE = 0xFFFF;

var UR_SOLVED = 0x0001;
var UR_CRASH = 0x0002;
var UR_NO_16_THM = 0x0003;

var UR_OBVIOUS = 0x0004;

var UR_NAKED1 = 0x0005;
var UR_NAKED2 = 0x0006;
var UR_NAKED3 = 0x0007;
var UR_NAKED4 = 0x0008;

var UR_HIDDEN1 = 0x0009;
var UR_HIDDEN2 = 0x000A;
var UR_HIDDEN3 = 0x000B;
var UR_HIDDEN4 = 0x000C;

var UR_INTER_LOCK = 0x000D;

var UR_XWING = 0x0101;
var UR_SWORDFISH = 0x0102;
var UR_JELLYFISH = 0x0103;
var UR_SQUIRMBAG = 0x0104;
var UR_YWING = 0x0105;
var UR_XCYCLE = 0x0106;

var UR_AIC = 0x0201;

var UR_BENT_NAKED = 0x301;

/* ***********************************************
	EventListener class
*********************************************** */
function EventListener(iType, fEventHandler, oNoBody){
	this.handle = (EventListener.nextHandle++);
	this.type = iType;
	this.body = oNoBody;
	this.eventHandler = fEventHandler;
	return this;
}

EventListener.nextHandle = 0;
EventListener.prototype.toString = function(){
	return ("[object EventListener]");
};
EventListener.prototype.listen = function(oEvent){
	var vResponse = this.eventHandler.call(this.body, oEvent);
	if (vResponse == undefined || vResponse){
		return true;
	}
	else {
		return false;
	}
}

/* ***********************************************
	NodeObject class
*********************************************** */
function NodeObject(){
	// Basic properties
	this.handle = (NodeObject.nextHandle++);
	this.parent = null;
	this.children = [];
	this.listeners = [];
	this.disabled = false;
	
	// Pre-defined event listeners
	this.addEventListener(ON_UPDATE_REQUEST, NodeObject._updaterequest);
	this.addEventListener(ON_SOLVE_REQUEST, NodeObject._solverequest);
	return this;
}

NodeObject.nextHandle = 0;
NodeObject.prototype.toString = function(){
	return ("[object NodeObject]");
};
// Node structure related methods
NodeObject.prototype.appendChild = function(oNodeObject){
	if (oNodeObject instanceof NodeObject){
		// Only free NodeObject element can be appended
		if (oNodeObject.parent){
			return null;
		}
		oNodeObject.parent = this;
		this.children.push(oNodeObject);
		return oNodeObject;
	}
	else {
		return null;
	}
};
NodeObject.prototype.removeChild = function(oNodeObject){
	var oRemovedNode = null;
	for (var iN = 0; this.children.length > iN; iN++){
		if (this.children[iN].handle == oNodeObject.handle){
			// Remove the node and make it free
			oRemovedNode = this.children.splice(iN, 1);
			oRemovedNode.parent = null;
			break;
		}
	}
	return oRemovedNode;
};
// Event structure related methods
NodeObject.prototype.addEventListener = function(iType, fEventHandler){
	var oEventListener = new EventListener(iType, fEventHandler, this);
	this.listeners.push(oEventListener);
	return oEventListener.handle;
};
NodeObject.prototype.removeEventListener = function(iHandle){
	for (var iN = 0; this.listeners.length > iN; iN++){
		if (this.listeners[iN].handle == iHandle){
			return this.listeners.splice(iN, 1);
		}
	}
	return null;
};
NodeObject.prototype.fireEvent = function(iType, oEvent){
	var oCurListener;
	var bBubbleEvent = true;
	for (var iN = 0; this.listeners.length > iN; iN++){
		oCurListener = this.listeners[iN];
		if (oCurListener.type == iType){
			bBubbleEvent &= oCurListener.listen(oEvent);
		}
	}
	// If there is a parent node to listen the bubble,
	if (this.parent && bBubbleEvent){
		this.parent.fireEvent(iType, oEvent);
	}
};
// Pre-defined event listeners related methods
// onUpdateRequest event listener
NodeObject._updaterequest = function(oEvent){
	if (this.onupdaterequest){
		return this.onupdaterequest(oEvent);
	}
	else {
		return true;
	}
};
NodeObject.prototype.onupdaterequest = null;
NodeObject.prototype.updaterequest = function(oEvent){
	this.fireEvent(ON_UPDATE_REQUEST, oEvent);
}
// onSolveRequest event listener
NodeObject._solverequest = function(oEvent){
	if (this.onsolverequest){
		return this.onsolverequest(oEvent);
	}
	else {
		return true;
	}
};
NodeObject.prototype.onsolverequest = null;
NodeObject.prototype.solverequest = function(oEvent){
	this.fireEvent(ON_SOLVE_REQUEST, oEvent);
}

/* ***********************************************
	UpdateRequest class
*********************************************** */
function UpdateRequest(iType, oPz){
	this.type = iType || UR_NONE;
	this.puzzle = oPz;
	this.action = nullfunction;
	
	this.forceAction = false;
	this.inform = true;
	this.redraw = true;
	return this;
}

/* ***********************************************
	SolveRequest class
*********************************************** */
function SolveRequest(oPz){
	this.puzzle = oPz;
	return this;
}