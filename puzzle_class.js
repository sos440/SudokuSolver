/* ***********************************************
	Macro constants
*********************************************** */
// Size constants
var SDK_DEGREE = 3;
var SDK_ORDER = SDK_DEGREE * SDK_DEGREE; // 9
var SDK_SUBSIZE = SDK_DEGREE * SDK_ORDER; // 27
var SDK_SIZE = SDK_ORDER * SDK_ORDER; // 81

var SDK_LEN_FT_BASIC = 3 * SDK_ORDER - 2 * SDK_DEGREE - 1; // 20
var SDK_LEN_FT_LOCK = SDK_ORDER - SDK_DEGREE; // 6

/* Candidate Set
	0 = Single - 1 / Divided - 0
	1~9 = Candidate set
*/
var CS_BASE = 1 << (SDK_ORDER + 1); // 1024 = 0x400
var CS_FILTER = CS_BASE - 1; // 1023 = 0x3FF
var CS_TOTAL = CS_FILTER - 1; // 1022 = 0x3FE

// Puzzle flag type
var PZ_NONE = 0x0000;
var PZ_SOLVED = 0x0001;
var PZ_INVALID = 0x0002;
var PZ_NON_UNIQUE = 0x0004;

// Logical unit type
var LT_NONE = 0x0000;
var LT_CELL = 0x0001;
var LT_ROW = 0x0002;
var LT_COL = 0x0003;
var LT_BOX = 0x0004;
var LT_GROUP = 0x0005;

// Address of Container Units
var AD_ROW = [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 7, 7, 7, 7, 8, 8, 8, 8, 8, 8, 8, 8, 8];
var AD_COL = [0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 1, 2, 3, 4, 5, 6, 7, 8];
var AD_BOX = [0, 0, 0, 1, 1, 1, 2, 2, 2, 0, 0, 0, 1, 1, 1, 2, 2, 2, 0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 3, 3, 3, 4, 4, 4, 5, 5, 5, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8, 6, 6, 6, 7, 7, 7, 8, 8, 8, 6, 6, 6, 7, 7, 7, 8, 8, 8];

// Text-map of address
var TEXTMAP_AD_ROW = ["A", "B", "C", "D", "E", "F", "G", "H", "J"];
var TEXTMAP_AD_COL = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
var TEXTMAP_AD_BOX = ["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3"];

/* ***********************************************
	Global functions of internal use
*********************************************** */
function _size(iData){
	var iSize = 0;
	(iData & 0x0002) && iSize++;
	(iData & 0x0004) && iSize++;
	(iData & 0x0008) && iSize++;
	(iData & 0x0010) && iSize++;
	(iData & 0x0020) && iSize++;
	(iData & 0x0040) && iSize++;
	(iData & 0x0080) && iSize++;
	(iData & 0x0100) && iSize++;
	(iData & 0x0200) && iSize++;
	return iSize;
}

function _value(iData){
	var iSize = 0;
	var iValue = 0;
	(iData & 0x0002) && (iSize++ || (iValue = 1));
	(iData & 0x0004) && (iSize++ || (iValue = 2));
	if (iSize == 2) return 0;
	(iData & 0x0008) && (iSize++ || (iValue = 3));
	if (iSize == 2) return 0;
	(iData & 0x0010) && (iSize++ || (iValue = 4));
	if (iSize == 2) return 0;
	(iData & 0x0020) && (iSize++ || (iValue = 5));
	if (iSize == 2) return 0;
	(iData & 0x0040) && (iSize++ || (iValue = 6));
	if (iSize == 2) return 0;
	(iData & 0x0080) && (iSize++ || (iValue = 7));
	if (iSize == 2) return 0;
	(iData & 0x0100) && (iSize++ || (iValue = 8));
	if (iSize == 2) return 0;
	(iData & 0x0200) && (iSize++ || (iValue = 9));
	if (iSize == 2) return 0;
	return (iSize == 1 ? iValue : 0);
}

function _candi(iData){
	var aCandi = [];
	(iData & 0x0002) && aCandi.push(1);
	(iData & 0x0004) && aCandi.push(2);
	(iData & 0x0008) && aCandi.push(3);
	(iData & 0x0010) && aCandi.push(4);
	(iData & 0x0020) && aCandi.push(5);
	(iData & 0x0040) && aCandi.push(6);
	(iData & 0x0080) && aCandi.push(7);
	(iData & 0x0100) && aCandi.push(8);
	(iData & 0x0200) && aCandi.push(9);
	return aCandi;
}

function _candistr(iData){
	var aCandi = [];
	(iData & 0x0002) && aCandi.push(1);
	(iData & 0x0004) && aCandi.push(2);
	(iData & 0x0008) && aCandi.push(3);
	(iData & 0x0010) && aCandi.push(4);
	(iData & 0x0020) && aCandi.push(5);
	(iData & 0x0040) && aCandi.push(6);
	(iData & 0x0080) && aCandi.push(7);
	(iData & 0x0100) && aCandi.push(8);
	(iData & 0x0200) && aCandi.push(9);

	if (aCandi.length == 1){
		return aCandi[0].toString();
	}
	else if (aCandi.length > 1){
		return ("{" + aCandi.join(",") + "}");
	}
	else {
		return "{}";
	}
}

function _adstr(iAd){
	return (TEXTMAP_AD_ROW[AD_ROW[iAd]] + TEXTMAP_AD_COL[AD_COL[iAd]]);
}

function _cansee(iAd1, iAd2){
	return (AD_ROW[iAd1] == AD_ROW[iAd2] || AD_COL[iAd1] == AD_COL[iAd2] || AD_BOX[iAd1] == AD_BOX[iAd2]);
}

function _bothcansee(iAd1, iAd2){
	return ((iAd1 != iAd2) && (AD_ROW[iAd1] == AD_ROW[iAd2] || AD_COL[iAd1] == AD_COL[iAd2] || AD_BOX[iAd1] == AD_BOX[iAd2]));
}

/* ***********************************************
	Global varaibles
*********************************************** */

// A function that does nothing
var nullfunction = function(){};

// Re-definition of undefined variable.
var undefined = nullfunction();

/* ***********************************************
	Array class, method extension
*********************************************** */

/* Declaration of Methods */
Array.prototype.last = function(){
	if (this.length){
		return this[this.length - 1];
	}
};

/* ***********************************************
	String class, method extension
*********************************************** */

/* Declaration of Methods */
String.prototype.padZeros = function(iLen){
	var sRes = this.toString();
	while (sRes.length < iLen){
		sRes = "0" + sRes;
	}
	return sRes;
};

String.repeat = function(sStr, iRepeat){
	var sRes = "";
	for (var iN = 0; iRepeat > iN; iN++){
		sRes += sStr;
	}
	return sRes;
}

/* ***********************************************
	LargeNumber class
	- inherited from Previous Sudoku 0.3.1
*********************************************** */
function LargeNumber(iBase){
	/* Declaration of Properties*/
	this.digits = [0];
	this.map = LargeNumber.standardMap;
	this.base = iBase || 10;
	return this;
};

/* Declaration of Methods */
LargeNumber.prototype.toOtherBase = function(iBase){
	var aDigits = [0];
	var iTemp = 0;
	for (var iP = this.digits.length - 1; iP >= 0; iP--){
		for (var iQ = 0; aDigits.length > iQ; iQ++){
			aDigits[iQ] *= this.base;
		}
		aDigits[0] += this.digits[iP];
		for (var iQ = 0; aDigits.length > iQ; iQ++){
			iTemp = parseInt(aDigits[iQ] / iBase);
			aDigits[iQ] %= iBase;
			if (iTemp){
				if (aDigits.length == (iQ+1)){
					aDigits.push(iTemp);
				}
				else {
					aDigits[iQ+1] += iTemp;
				}
			}
		}
	}
	this.digits = aDigits;
	this.base = iBase;
	return this;
};
LargeNumber.prototype.toString = function(){
	var sRes = "";
	for (var iP = 0; this.digits.length > iP; iP++){
		sRes = this.map[this.digits[iP]] + sRes;
	}
	return sRes;
};

/* Declaration of Global Methods */
LargeNumber.standardMap = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
LargeNumber.fromString = function(sNum, iBase){
	var oNum = new LargeNumber(iBase);
	oNum.digits = new Array(sNum.length);
	for (var iP = 0; sNum.length > iP; iP++){
		for (var iQ = 0; oNum.map.length > iQ; iQ++){
			if (oNum.map[iQ] == sNum.charAt(iP)){
				break;
			}
		}
		if (iQ >= iBase){
			return null;
		}
		oNum.digits[sNum.length-1-iP] = iQ;
	}
	return oNum;
};

/* ***********************************************
	Cell class
	- contains a logical observations for a cell in a puzzle
	- intended as a data storage
*********************************************** */
function Cell(oPzRef, iAd){
	this.type = LT_CELL;
	this.ref = oPzRef;
	this.address = iAd;
	this.value = 0;
	this.size = SDK_ORDER;
	return this;
}

/* Declaration of Methods */
Cell.prototype.valueOf = function(){
	return this.ref.data[this.address];
};
Cell.prototype.toString = function(){
	return ("[object Cell(" + _adstr(this.address) + ":" + this.valueOf().toString(2).padZeros(SDK_ORDER + 1) + ")]");
};
Cell.prototype.update = function(bLeaveData){
	var iValue = 0;
	var iData = this.valueOf();
	var iSize = 0;
	while (iData = iData >>> 1){
		iValue++;
		if (iData & 1){
			iSize++;
		}
	}
	if (iSize == 1){
		this.value = iValue;
		if (! bLeaveData){
			this.ref.data[this.address] = (1 << iValue) | 1;
		}
	}
	else {
		this.value = 0;
	}
	this.size = iSize;
};

/* ***********************************************
	Puzzle class
	- contains a raw data of candidate sets
	- contains various scales of logical units, including cell, triad and so forth
*********************************************** */
function Puzzle(sName){
	this.name = sName || "noname";
	this.data = [];
	this.cell = [];
	for (var iAd = 0; SDK_SIZE > iAd; iAd++){
		this.data.push(CS_FILTER);
		this.cell.push(new Cell(this, iAd));
	}
	this.flag = PZ_NONE;
	return this;
}

Puzzle.prototype.toString = function(){
	return ("[object Puzzle]");
};
Puzzle.fromSimpleNumberString = function(sStr){
	var oPzNew = new Puzzle();
	loop_outer :
	for (var iAd = 0; iAd < SDK_SIZE && iAd < sStr.length; iAd++){
		for (var iLookup = 0; iLookup < LargeNumber.standardMap.length; iLookup++){
			if (LargeNumber.standardMap[iLookup] == sStr.charAt(iAd) && sStr.charAt(iAd) != "0"){
				oPzNew.cell[iAd].value = parseInt(sStr.charAt(iAd));
				oPzNew.cell[iAd].size = 1;
				oPzNew.data[iAd] = (1 << oPzNew.cell[iAd].value) | 1;
				continue loop_outer;
			}
		}
		oPzNew.cell[iAd].value = 0;
		oPzNew.cell[iAd].size = SDK_ORDER;
		oPzNew.data[iAd] = CS_FILTER;
	}
	return oPzNew;
}
Puzzle.fromLargeNumberString = function(sData){
	var oNum = LargeNumber.fromString(sData, 62);
	if (oNum){
		oNum.toOtherBase(CS_BASE);
		var oPzNew = new Puzzle();
		for (var iAd = 0; iAd < SDK_SIZE; iAd++){
			if (iAd >= oNum.digits.length){
				oPzNew.data[iAd] = CS_FILTER;
				oPzNew.cell[iAd].size = SDK_ORDER;
				oPzNew.cell[iAd].value = 0;
			}
			else {
				oPzNew.data[iAd] = oNum.digits[iAd] & CS_FILTER;
				oPzNew.cell[iAd].update();
			}
		}
		return oPzNew;
	}
	else {
		return null;
	}
};
Puzzle.prototype.toSimpleNumber = function(){
	var sStr = "";
	for (var iAd = 0; iAd < SDK_SIZE; iAd++){
		sStr += LargeNumber.standardMap[this.cell[iAd].value];
	}
	return sStr;
}
Puzzle.prototype.toLargeNumber = function(){
	var oNum = new LargeNumber(CS_BASE);
	oNum.digits = new Array(SDK_SIZE);
	for (var iAd = 0; iAd < SDK_SIZE; iAd++){
		oNum.digits[iAd] = this.data[iAd];
	}
	return oNum.toOtherBase(62);
};
Puzzle.prototype.fastClone = function(){
	var oPzNew = new Puzzle();
	oPzNew.data = this.data.concat();
	return oPzNew;
};
Puzzle.prototype.clone = function(){
	var oPzNew = new Puzzle();
	oPzNew.data = this.data.concat();
	for (var iAd = 0; iAd < SDK_SIZE; iAd++){
		oPzNew.cell[iAd].value = this.cell[iAd].value;
		oPzNew.cell[iAd].size = this.cell[iAd].size;
	}
	return oPzNew;
};