/* ***********************************************
	Advanced Strategies
	Need:
	object_model.js
	puzzle_class.js
*********************************************** */

/* ***********************************************
	Macro constants
*********************************************** */
// StateVertex Type
var ST_NONE = 0x0000;
var ST_WEAK = 0x0001;
var ST_STRONG = 0x0002;

// StateVertex Color
var SC_NONE = 0;
var SC_T2T = 0x0001;
var SC_T2F = 0x0002;
var SC_F2T = 0x0004;
var SC_F2F = 0x0008;

/* ***********************************************
	Global Functions
*********************************************** */
function _nextColor(iLinkType, iColor){
	var iColorNext = SC_NONE;
	if (iLinkType == ST_WEAK){
		if (iColor & SC_T2T){
			iColorNext |= SC_T2F;
		}
		if (iColor & SC_F2T){
			iColorNext |= SC_F2F;
		}
	}
	else if (iLinkType == ST_STRONG){
		if (iColor & SC_T2T){
			iColorNext |= SC_T2F;
		}
		else if (iColor & SC_T2F){
			iColorNext |= SC_T2T;
		}
		if (iColor & SC_F2T){
			iColorNext |= SC_F2F;
		}
		else if (iColor & SC_F2F){
			iColorNext |= SC_F2T;
		}
	}
	return iColorNext;
}

function _compareColor(iColor1, iColor2){
	// Beginning from T results in a contradiction
	if ( ((iColor1 & SC_T2T) && (iColor2 & SC_T2F)) || ((iColor1 & SC_T2F) && (iColor2 & SC_T2T)) ){
		return ST_WEAK;
	}
	// Beginning from F results in a contradiction
	else if ( ((iColor1 & SC_F2T) && (iColor2 & SC_F2F)) || ((iColor1 & SC_F2F) && (iColor2 & SC_F2T)) ){
		return ST_STRONG;
	}
	// No obvious contradiction has found
	else {
		return ST_NONE;
	}
}

/* ***********************************************
	Propagator class
*********************************************** */
function Propagator(iMaxDepth){
	this.discontinuity = [];
	this.maxDepth = iMaxDepth || 10;
	return this;
}

Propagator.prototype.test = function(oBegin){
	oBegin.propagate(this, null, SC_T2T | SC_F2F, 0);
}

/* ***********************************************
	StateVertex class
*********************************************** */
function StateVertex(iAd, iValue){
	this.ad = iAd;
	this.value = iValue;
	this.links = [];
	
	this.color = SC_NONE; // Current color
	this.colorer = null; // Colorer
	this.depth = 0;
	return this;
}

StateVertex.prototype.propagate = function(oPropagator, oColorer, iNewColor, iDepth){
	if (this.color){
		var iCompColor = _compareColor(this.color, iNewColor);
		// If a discontinuous loop is formed, stop propagation and report the discontinuity
		if (iCompColor){
			var oSuperStateVertex = new StateVertex(this.ad, this.value);
			oSuperStateVertex.colorer = oColorer;
			oPropagator.discontinuity.push({state1 : this, state2 : oSuperStateVertex, type : iCompColor});
			return;
		}
		if ((this.color & iNewColor) == this.color){
			// If the new chain has the same or less proof power, then discard it.
			if (this.color == iNewColor && this.depth <= iDepth){
				return;
			}
			// Otherwise, the the new chain has more proof power than the original one, hence we replace it.
		}
	}
	this.color = iNewColor;
	this.colorer = oColorer;
	this.depth = iDepth;
	if (iDepth < oPropagator.maxDepth){
		var iNextDepth = iDepth + 1;
		var iNextColor = 0;
		for (var iN = 0; this.links.length > iN; iN++){
			iNextColor = _nextColor(this.links[iN].type, this.color);
			if (iNextColor){
				this.links[iN].getPartner(this).propagate(oPropagator, this.links[iN], iNextColor, iNextDepth);
			}
		}
	}
}

StateVertex.prototype.findLink = function(iSrcAd, iSrcValue){
	var oPartner = null;
	for (var iN = 0; this.links.length > iN; iN++){
		oPartner = this.links[iN].getPartner(this);
		if (oPartner && oPartner.ad == iSrcAd && oPartner.value == iSrcValue){
			return this.links[iN];
		}
	}
	return null;
}

/* ***********************************************
	Linkage class
*********************************************** */
function Linkage(iType, oStFrom, oStTo){
	this.type = iType;
	this.from = oStFrom;
	this.to = oStTo;
	oStFrom.links.push(this);
	oStTo.links.push(this);
	return this;
}

Linkage.prototype.getPartner = function(oStSrc){
	if (oStSrc.ad == this.from.ad && oStSrc.value == this.from.value){
		return this.to;
	}
	else if (oStSrc.ad == this.to.ad && oStSrc.value == this.to.value){
		return this.from;
	}
	else {
		return null;
	}
}

/* ***********************************************
	Strategy : Alternating Inference Chain
*********************************************** */
var oStgAIC = new NodeObject();

oStgAIC.onsolverequest = function(oSr){
	var oPz = oSr.puzzle;
	var iMaxLenBound = oSr.maxLenBound || 30;
	var oUr = new UpdateRequest(UR_NONE, oPz);
	var oMsg = null;
	
	// Step 1. Create Inference Graph
	// Create an 2D array indexed by (Address, Value) pair
	var aStateVertices = [];
	var aGrid = new Array(SDK_SIZE);
	for (var iAd = 0; SDK_SIZE > iAd; iAd++){
		aGrid[iAd] = new Array(SDK_ORDER);
	}
	
	// Scan Endocellular Link
	var oCurStateVertex = null;
	var aLocalStateVertices = null;
	var iSize = 0;
	var iCandi = 0, iFt = 0;
	for (var iAd = 0; SDK_SIZE > iAd; iAd++){
		// If mumtivalued cell is detected
		iSize = oPz.cell[iAd].size;
		if (iSize > 1){
			// Initialize local settings
			aLocalStateVertices = [];
			iCandi = oPz.data[iAd];
			iFt = 1;
			for (var iValue = 1; SDK_ORDER >= iValue; iValue++){
				iFt = iFt << 1;
				if (iFt & iCandi){
					oCurStateVertex = new StateVertex(iAd, iValue);
					aGrid[iAd][iValue - 1] = oCurStateVertex;
					aStateVertices.push(oCurStateVertex);
					for (var iN = 0; aLocalStateVertices.length > iN; iN++){
						if (iSize == 2){
							new Linkage(ST_STRONG, oCurStateVertex, aLocalStateVertices[iN]);
						}
						else {
							new Linkage(ST_WEAK, oCurStateVertex, aLocalStateVertices[iN]);
						}
					}
					aLocalStateVertices.push(oCurStateVertex);
				}
			} // End of Loop : endocellular link creation
		}
	} // End of Loop : cell scan

	// Scan Intercellular Link
	var apLu = null;
	var aMultivalued = null;
	var oFindLink = null;
	for (var iMode = 0; 3 > iMode; iMode++){
		// Loop for each logical unit in the given mod
		for (var iPtrLu = 0; SDK_ORDER > iPtrLu; iPtrLu++){
			switch (iMode){
				case 0 :
				apLu = LU_ROW_DATA[iPtrLu];
				break;
				case 1 :
				apLu = LU_COL_DATA[iPtrLu];
				break;
				case 2 :
				apLu = LU_BOX_DATA[iPtrLu];
				break;
			}
			// Create a list of multivalued cells in the given logical unit
			aMultivalued = [];
			for (var iPtr = 0; SDK_ORDER > iPtr; iPtr++){
				iAd = apLu[iPtr];
				if (oPz.cell[iAd].size > 1){
					aMultivalued.push(iAd);
				}
			}
			if (aMultivalued.length < 2){
				continue;
			}
			// For each number, create a list of multvalued cells that contains the given candidate
			iFt = 1;
			for (var iValue = 1; SDK_ORDER >= iValue; iValue++){
				iFt = iFt << 1;
				aLocalStateVertices = [];
				// Create a list
				for (var iN = 0; aMultivalued.length > iN; iN++){
					if (oPz.data[aMultivalued[iN]] & iFt){
						aLocalStateVertices.push(aMultivalued[iN]);
					}
				}
				// If a strong link is possible
				if (aLocalStateVertices.length == 2){
					oCurStateVertex = aGrid[aLocalStateVertices[0]][iValue - 1];
					oFindLink = oCurStateVertex.findLink(aLocalStateVertices[1], iValue);
					// If there is already a link between them
					if (oFindLink){
						oFindLink.type = ST_STRONG;
					}
					// Otherwise
					else {
						new Linkage(ST_STRONG, oCurStateVertex, aGrid[aLocalStateVertices[1]][iValue - 1]);
					}
				}
				// If not, create a weak intercellular links
				else {
					for (var iPtr1 = 0; aLocalStateVertices.length > iPtr1; iPtr1++){
						for (var iPtr2 = iPtr1 + 1; aLocalStateVertices.length > iPtr2; iPtr2++){
							oCurStateVertex = aGrid[aLocalStateVertices[iPtr1]][iValue - 1];
							oFindLink = oCurStateVertex.findLink(aLocalStateVertices[iPtr2], iValue);
							// If there is no link between them
							if (! oFindLink){
								new Linkage(ST_WEAK, oCurStateVertex, aGrid[aLocalStateVertices[iPtr2]][iValue - 1]);
							}
						} // End of Loop : create weak linkage, inner loop
					} // End of Loop : create weak linkage, outer loop
				}
			} // End of Loop : value
		} // End of Loop : logical unit
	} // End of Loop : mode

	// Scan discontinuous loops
	var oBeginStateVertex = null;
	var oPropa = null;
	var oCurDisconn = null;
	var iDisconnType = ST_NONE;
	var iLinkType = ST_NONE;
	var aTmpStateVertices = null;
	detect_disconn :
	for (var iMaxLen = 2; iMaxLenBound >= iMaxLen; iMaxLen++){
		for (var iN = 0; aStateVertices.length > iN; iN++){
			oPropa = new Propagator(iMaxLen);
			oBeginStateVertex = aStateVertices[iN];
			oPropa.test(oBeginStateVertex);
			if (oPropa.discontinuity.length){
				for (var iM = 0; oPropa.discontinuity.length > iM; iM++){
					bUpdated = true;
					aLocalStateVertices = [];
					oCurDisconn = oPropa.discontinuity[iM];
					iDisconnType = oCurDisconn.type;
					// If the found discontinuity is proved to form a discontinuous loop,
					// Create a loop
					oCurStateVertex = oCurDisconn.state1;
					iLinkType = ST_NONE;
					while (true){
						aLocalStateVertices.unshift({ad : oCurStateVertex.ad, value : oCurStateVertex.value, linkType : iLinkType});
						if (oCurStateVertex.colorer){
							iLinkType = oCurStateVertex.colorer.type;
							oCurStateVertex = oCurStateVertex.colorer.getPartner(oCurStateVertex);
						}
						else {
							break;
						}
					}
					oCurStateVertex = oCurDisconn.state2;
					iLinkType = oCurStateVertex.colorer.type;
					oCurStateVertex = oCurStateVertex.colorer.getPartner(oCurStateVertex);
					while (true){
						aLocalStateVertices.last().linkType = iLinkType;
						aLocalStateVertices.push({ad : oCurStateVertex.ad, value : oCurStateVertex.value, linkType : ST_NONE});
						if (oCurStateVertex.colorer){
							iLinkType = oCurStateVertex.colorer.type;
							oCurStateVertex = oCurStateVertex.colorer.getPartner(oCurStateVertex);
						}
						else {
							break;
						}
					}
					// Report
					oMsg = {
						type : iDisconnType, 
						chain : aLocalStateVertices,
						ad : aLocalStateVertices[0].ad,
						value : aLocalStateVertices[0].value
					}
					if (iDisconnType == ST_WEAK){
						oMsg.candi = 1 << aLocalStateVertices[0].value;
					}
					else if (iDisconnType == ST_STRONG){
						oMsg.candi = oPz.data[aLocalStateVertices[0].ad] & ~(1 << aLocalStateVertices[0].value);
					}
					break detect_disconn;
				}
			}
			// Erase all colors
			for (var iM = 0; aStateVertices.length > iM; iM++){
				aStateVertices[iM].color = SC_NONE;
				aStateVertices[iM].colorer = null;
				aStateVertices[iM].depth = 0;
			}
		} // for each beginning point
	} // for each max length
	
	if (oMsg){
		oUr.type = UR_AIC;
		oUr.message = oMsg;
		oUr.action = this.actionDetermine;
	}
	this.parent.updaterequest(oUr);
	return false;
};

oStgAIC.actionDetermine = function(){
	var oPz = this.puzzle;
	// Weak discontinuity
	if (this.message.type == ST_WEAK){
		oPz.data[this.message.chain[0].ad] &= ~(1 << this.message.chain[0].value);
	}
	// Strong discontinuity
	else if (this.message.type == ST_STRONG){
		oPz.data[this.message.chain[0].ad] = (1 << this.message.chain[0].value) | 1;
	}
	oPz.cell[this.message.chain[0].ad].update(true);
};