/* ***********************************************
	Need:
	object_model.js
	puzzle_class.js
	strategies.js
*********************************************** */

/* ***********************************************
	Global functions
*********************************************** */
var rThick = 4;
var rThinSep = 2;
var rBendParam = 10;
var rBegin = 4;

function _getCtxPos(iAd, iValue){
	var rX = 13.5;
	var rY = 13.5;
	// Endocellular modification
	rX += 15 * ((iValue - 1) % SDK_DEGREE);
	rY += 15 * Math.floor((iValue - 1) / SDK_DEGREE);
	// Intercellular modification
	rX += (45 + 2) * AD_COL[iAd]; // Add intercellular boundary
	rX += 4 * Math.floor(AD_COL[iAd] / SDK_DEGREE); // Add interbox spacing
	rY += (45 + 2) * AD_ROW[iAd]; // Add intercellular boundary
	rY += 4 * Math.floor(AD_ROW[iAd] / SDK_DEGREE); // Add interbox spacing
	return {x : rX, y : rY};
}

function _circleCs(oCtx, iAd, iValue){
	var oPos = _getCtxPos(iAd, iValue);
	oCtx.lineWidth = 1;
	oCtx.beginPath();
	oCtx.arc(oPos.x, oPos.y, 7.5, 0, 2*Math.PI);
	oCtx.stroke();
}

function _xMarkCs(oCtx, iAd, iValue){
	var oPos = _getCtxPos(iAd, iValue);
	oCtx.lineWidth = 1;
	oCtx.beginPath();
	oCtx.moveTo(oPos.x - 7.5, oPos.y - 7.5);
	oCtx.lineTo(oPos.x + 7.5, oPos.y + 7.5);
	oCtx.stroke();
	oCtx.beginPath();
	oCtx.moveTo(oPos.x + 7.5, oPos.y - 7.5);
	oCtx.lineTo(oPos.x - 7.5, oPos.y + 7.5);
	oCtx.stroke();
}

function _textCs(oCtx, iAd, sText){
	var oPos = _getCtxPos(iAd, 4);
	oCtx.fillText(sText, oPos.x, oPos.y + 22.5);
}

function _curveFromTo(oCtx, iAd1, iValue1, iAd2, iValue2, iType){
	var oPos1 = _getCtxPos(iAd1, iValue1);
	var oPos2 = _getCtxPos(iAd2, iValue2);
	var uVecX = oPos2.x - oPos1.x;
	var uVecY = oPos2.y - oPos1.y;
	var uLen = Math.sqrt(uVecX * uVecX + uVecY * uVecY);
	uVecX *= 1 / uLen;
	uVecY *= 1 / uLen;
	var rCtrX = 0.5 * (oPos1.x + oPos2.x) + (rBendParam / uLen) * (oPos1.y - oPos2.y);
	var rCtrY = 0.5 * (oPos1.y + oPos2.y) + (rBendParam / uLen) * (oPos2.x - oPos1.x);
	
	if (iType == ST_STRONG){
		oCtx.lineWidth = 4;
		oCtx.beginPath();
		oCtx.moveTo(oPos1.x + rBegin * uVecX, 
			oPos1.y + rBegin * uVecY);
		oCtx.quadraticCurveTo(rCtrX, 
			rCtrY, 
			oPos2.x - rBegin * uVecX, 
			oPos2.y - rBegin * uVecY);
		oCtx.stroke();
	}
	else if (iType == ST_WEAK){
		oCtx.lineWidth = 1;
		// Thin line 1
		oCtx.beginPath();
		oCtx.moveTo(oPos1.x + rBegin * uVecX - rThinSep * uVecY, 
			oPos1.y + rBegin * uVecY + rThinSep * uVecX);
		oCtx.quadraticCurveTo(rCtrX - uVecY, 
			rCtrY + uVecX, 
			oPos2.x - rBegin * uVecX - rThinSep * uVecY, 
			oPos2.y - rBegin * uVecY + rThinSep * uVecX);
		oCtx.stroke();
		// Thin line 2
		oCtx.beginPath();
		oCtx.moveTo(oPos1.x + rBegin * uVecX + rThinSep * uVecY, 
			oPos1.y + rBegin * uVecY - rThinSep * uVecX);
		oCtx.quadraticCurveTo(rCtrX + uVecY, 
			rCtrY - uVecX, 
			oPos2.x - rBegin * uVecX + rThinSep * uVecY, 
			oPos2.y - rBegin * uVecY - rThinSep * uVecX);
		oCtx.stroke();
	}
}

/* ***********************************************
	SampleList instance
*********************************************** */
var oSelectorNode = NodeObject();
oSelectorNode.selector = null;
oSelectorNode.index = -1;
oSelectorNode.puzzle = null;
oSelectorNode.samples = [];

oSelectorNode.initialize = function(vDomSelector){
	this.selector = $(vDomSelector);
	this.makeList();
}

oSelectorNode.clear = function(){
	if (! this.selector){
		return;
	}
	this.selector.children().remove();
}

oSelectorNode.makeList = function(){
	if (! this.selector){
		return;
	}
	this.clear();
	var oCurOption;
	for (var iN = 0; this.samples.length > iN; iN++){
		oCurOption = $("<option>").appendTo(this.selector).text(this.samples[iN].description);
		if (iN == this.index){
			oCurOption.attr("selected", true);
		}
	}
}

oSelectorNode.choose = function(iIndex){
	this.puzzle = null;
	if (iIndex == -1 || iIndex >= this.samples.length){
	}
	else {
		this.index = iIndex;
		if (this.selector){
			this.selector.children("option").attr("selected", false);
			this.selector.children("option:eq(" + this.index + ")").attr("selected", true);
		}
		this.load();
	}
	return this.puzzle;
}

oSelectorNode.load = function(){
	if (this.samples[this.index].type == "simple"){
		this.puzzle = Puzzle.fromSimpleNumberString(this.samples[this.index].string);
	}
	else if (this.samples[this.index].type == "long"){
		this.puzzle = Puzzle.fromLargeNumberString(this.samples[this.index].string);
	}
	return this.puzzle;
}

oSelectorNode.chooseRandom = function(){
	return this.choose(Math.floor(Math.random() * this.samples.length) % this.samples.length);
}

/* ***********************************************
	Printer instance
*********************************************** */
var oPrinterNode = new NodeObject();
oPrinterNode.printer = null;

oPrinterNode.initialize = function(vDomPrinter){
	this.printer=  $(vDomPrinter);
	this.clear();
};

oPrinterNode.clear = function(){
	if (! this.printer){
		return;
	}
	this.printer.children().remove();
	this.newline();
};

oPrinterNode.scrollToLast = function(oDomObj){
	if (! this.printer){
		return;
	}
	this.printer.prop("scrollTop", this.printer.prop("scrollHeight"));
};

oPrinterNode.append = function(oDomObj){
	if (! this.printer){
		return;
	}
	this.printer.append(oDomObj);
	this.scrollToLast();
};

oPrinterNode.newline = function(){
	this.append($("<div>"));
};

oPrinterNode.write = function(sText){
	if (! this.printer){
		return;
	}
	this.printer.children(":last").append($("<span>").html(sText));
	this.scrollToLast();
};

oPrinterNode.writeln = function(sText){
	if (! this.printer){
		return;
	}
	var asPrintLines = sText.split("\n");
	for (var i = 0; i < asPrintLines.length; i++){
		this.write(asPrintLines[i]);
		this.newline();
	}
};

/* ***********************************************
	Canvas instance
*********************************************** */
var oCanvasNode = new NodeObject();
oCanvasNode.canvas = null;
oCanvasNode.cell = null;
oCanvasNode.metric = null;
oCanvasNode.graph = null;

oCanvasNode.initialize = function(vDomCanvas){
	this.canvas =  $(vDomCanvas);
	this.graph = null;
	this.draw();
};

oCanvasNode.draw = function(){
	if (! this.canvas){
		return;
	}
	this.cell = new Array(SDK_SIZE);
	this.canvas.children().remove();
	this.canvas.append($("<table>").addClass("pz_grid"));
	this.canvas.children("table").append($("<tbody>").addClass("pz_gridbody"));
	for (var iX = 0; SDK_DEGREE > iX; iX++){
		this.canvas.find("tbody").append("<tr>");
	}
	for (var iY = 0; SDK_DEGREE > iY; iY++){
		this.canvas.find("tr").append($("<td>").addClass("pz_box"));
	}
	for (var iB = 0; SDK_ORDER > iB; iB++){
		this.canvas.find("td").append($("<div>").addClass("pz_cell"));
	}
	this.canvas.find(".pz_cell").each(function(iPtr){
		var iW = iPtr % SDK_DEGREE;
		iPtr = (iPtr / SDK_DEGREE) >>> 0;
		var iY = iPtr % SDK_DEGREE;
		iPtr = (iPtr / SDK_DEGREE) >>> 0;
		var iZ = iPtr % SDK_DEGREE;
		iPtr = (iPtr / SDK_DEGREE) >>> 0;
		var iX = iPtr;
		var iAd = iW + SDK_DEGREE * (iZ + SDK_DEGREE * (iY + SDK_DEGREE * iX));
		oCanvasNode.cell[iAd] = this;
	});

	this.metric = {
		width : (this.canvas.children("table").outerWidth()),
		height : (this.canvas.children("table").outerHeight())
	};
	this.canvas.css("width", this.metric.width);
	this.canvas.css("height", this.metric.height);
	
	var oOffset = this.canvas.children("table").position();
	for (var iN = 0; SDK_ORDER > iN; iN++){
		var oPos = _getCtxPos(SDK_ORDER * iN, 5);
		this.canvas.append(
		$("<div>").addClass("pz_tag")
			.css("left", oOffset.left + oPos.x - 40)
			.css("top", oOffset.top + oPos.y - 6)
			.text(TEXTMAP_AD_ROW[iN])
		);
	}
	for (var iN = 0; SDK_ORDER > iN; iN++){
		var oPos = _getCtxPos(iN, 5);
		this.canvas.append(
		$("<div>").addClass("pz_tag")
			.css("left", oOffset.left + oPos.x - 3)
			.css("top", oOffset.top + oPos.y - 43)
			.text(TEXTMAP_AD_COL[iN])
		);
	}
};

oCanvasNode.write = function(oPz){
	this.clearHighlight();
	for (var iAd = 0; SDK_SIZE > iAd; iAd++){
		this.setByData(iAd, oPz.data[iAd]);
	}
	if (this.graph){
		$(this.graph).remove();
		this.graph = null;
	}
};

oCanvasNode.beginGraphics = function(){
	if (this.graph){
		$(this.graph).remove();
		this.graph = null;
	}
	this.graph = document.createElement("canvas");
	if (this.graph){
		var oOffset = this.canvas.children("table").position();
		$(this.graph).appendTo(this.canvas)
			.attr("width", this.metric.width).attr("height", this.metric.height)
			.css("position", "absolute")
			.css("top", oOffset.top).css("left", oOffset.left);
		return true;
	}
	else {
		return false;
	}
};

oCanvasNode.drawXMark = function(iAd, iData){
	if (! this.graph){
		return;
	}
	var oCtx = this.graph.getContext("2d");
	oCtx.globalAlpha = 0.7;
	oCtx.strokeStyle = "#FF0000";
	var iFt = 1;
	for (var iValue = 0; SDK_ORDER > iValue; iValue++){
		iFt = iFt << 1;
		if (iFt & iData){
			_xMarkCs(oCtx, iAd, iValue+1);
		}
	}
};

oCanvasNode.drawFootnote = function(iAd, sText){
	if (! this.graph){
		return;
	}
	var oCtx = this.graph.getContext("2d");
	oCtx.globalAlpha = 0.7;
	oCtx.font="10px Arial";
	oCtx.fillStyle = "#FF0000";
	_textCs(oCtx, iAd, sText);
};

oCanvasNode.drawLink = function(iAd1, iValue1, iAd2, iValue2, iType){
	if (! this.graph){
		return;
	}
	var oCtx = this.graph.getContext("2d");
	oCtx.globalAlpha = 0.7;
	oCtx.strokeStyle = "#000000";
	_circleCs(oCtx, iAd1, iValue1);
	_circleCs(oCtx, iAd2, iValue2);
	if (iType == ST_STRONG){
		oCtx.strokeStyle = "#0000FF";
		_curveFromTo(oCtx, iAd1, iValue1, iAd2, iValue2, ST_STRONG);
	}
	else {
		oCtx.strokeStyle = "#FF0000";
		_curveFromTo(oCtx, iAd1, iValue1, iAd2, iValue2, ST_WEAK);
	}
};

oCanvasNode.drawChain = function(oChain){
	if (! this.graph){
		return;
	}
	var oCtx = this.graph.getContext("2d");
	oCtx.globalAlpha = 0.7;
	var iAd1, iValue2;
	if (oChain.type == ST_STRONG){
		iAd1 = oChain.chain[0].ad;
		iValue1 = oChain.chain[0].value;
		for (var iN = 1; oChain.chain.length > iN; iN++){
			oCtx.strokeStyle = "#000000";
			_circleCs(oCtx, iAd1, iValue1);
			iAd2 = oChain.chain[iN].ad;
			iValue2 = oChain.chain[iN].value;
			if (iN % 2){
				oCtx.strokeStyle = "#0000FF";
				_curveFromTo(oCtx, iAd1, iValue1, iAd2, iValue2, ST_STRONG);
			}
			else {
				oCtx.strokeStyle = "#FF0000";
				_curveFromTo(oCtx, iAd1, iValue1, iAd2, iValue2, ST_WEAK);
			}
			iAd1 = iAd2;
			iValue1 = iValue2;
		}
	}
	else if (oChain.type == ST_WEAK){
		iAd1 = oChain.chain[0].ad;
		iValue1 = oChain.chain[0].value;
		for (var iN = 1; oChain.chain.length > iN; iN++){
			oCtx.strokeStyle = "#000000";
			_circleCs(oCtx, iAd1, iValue1);
			iAd2 = oChain.chain[iN].ad;
			iValue2 = oChain.chain[iN].value;
			if (iN % 2){
				oCtx.strokeStyle = "#FF0000";
				_curveFromTo(oCtx, iAd1, iValue1, iAd2, iValue2, ST_WEAK)
			}
			else {
				oCtx.strokeStyle = "#0000FF";
				_curveFromTo(oCtx, iAd1, iValue1, iAd2, iValue2, ST_STRONG)
			}
			iAd1 = iAd2;
			iValue1 = iValue2;
		}
	}
};

/*
oCanvasNode.divideCell = function(iAd){
	var oCurCell = $(this.cell[iAd]);
	oCurCell.children().remove();
	for (var iValue = 1; SDK_ORDER >= iValue; iValue++){
		oCurCell.append($("<div>").addClass("pz_candi"));
	}
};

oCanvasNode.writeValue = function(iAd, iValue){
	var oCurCell = $(this.cell[iAd]);
	if (oCurCell.children(".pz_candi").length == SDK_ORDER){
		return;
	}
	oCurCell.children().remove();
	oCurCell.append($("<span>").css("vertical-align", "-3px").text(iValue));
};

oCanvasNode.writeCandi = function(iAd, iValue){
	var oCurCell = $(this.cell[iAd]);
	oCurCell = oCurCell.children(".pz_candi").eq(iValue - 1);
	oCurCell.children().remove();
	oCurCell.append($("<span>").text(iValue));
};

oCanvasNode.clearCell = function(){
	if (arguments.length == 1){
		var iAd = arguments[0];
		var oCurCell = $(this.cell[iAd]);
		oCurCell.children().remove();
	}
	else if (arguments.length == 2){
		var iAd = arguments[0];
		var iValue = arguments[1];
		var oCurCell = $(this.cell[iAd]);
		oCurCell = oCurCell.children(".pz_candi").eq(iValue - 1);
		oCurCell.children().remove();
	}
};
*/

oCanvasNode.setByData = function(iAd, iData){
	var oCurCell = $(this.cell[iAd]);
	oCurCell.children().remove();
	if (iData & 1){
		var iValue = _value(iData);
		if (iValue){
			oCurCell.append($("<span>").css("vertical-align", "-3px").text(iValue));
		}
	}
	else {
		var iFt = 1;
		for (var iValue = 1; SDK_ORDER >= iValue; iValue++){
			iFt = iFt << 1;
			oCurCell.append($("<div>").addClass("pz_candi").append($("<span>").text((iFt & iData) ? iValue : "")));
		}
	}
};

oCanvasNode.clearHighlight = function(){
	this.canvas.find("div")
		.removeClass("pzh_remove")
		.removeClass("pzh_basis")
		.removeClass("pzh_key")
		.removeClass("pzh_group")
		.removeClass("pzh_target")
		.removeClass("pzh_error")
		.removeClass("pzh_color1")
		.removeClass("pzh_color2");
};

oCanvasNode.highlight = function(){
	if (arguments.length == 2){
		var iAd = arguments[0];
		var sClass = arguments[1];
		$(this.cell[iAd]).addClass(sClass);
	}
	else if (arguments.length == 3){
		var iAd = arguments[0];
		var iData = arguments[1];
		var sClass = arguments[2];
		var iFt = 1;
		for (var iValue = 0; SDK_ORDER > iValue; iValue++){
			iFt = iFt << 1;
			if (iFt & iData){
				$(this.cell[iAd]).children(".pz_candi").eq(iValue).addClass(sClass);
			}
		}
	}
	else {
		return;
	}
};

/* ***********************************************
	MainSolver instance
*********************************************** */
var oMainSolver = new NodeObject();
oMainSolver.selector = oSelectorNode;
oMainSolver.printer = oPrinterNode;
oMainSolver.canvas = oCanvasNode;

oMainSolver.lang = "ko";
oMainSolver.mute = false;
oMainSolver.blind = true;

oMainSolver.puzzle = null;
oMainSolver.index = -1;
oMainSolver.step = 0;
oMainSolver.deferredRequest = [];
oMainSolver.automatic = false;
oMainSolver.timer = null;

oMainSolver.appendChild(oStgValidityCheck);
oMainSolver.appendChild(oStgElimObvious);
oMainSolver.appendChild(oStgNakedSingle);
oMainSolver.appendChild(oStgHiddenSingle);
oMainSolver.appendChild(oStgIntersectionLock);
oMainSolver.appendChild(oStgNakedPair);
oMainSolver.appendChild(oStgNakedTriple);
oMainSolver.appendChild(oStgHiddenPair);
oMainSolver.appendChild(oStgNakedQuadraple);
oMainSolver.appendChild(oStgHiddenTriple);
oMainSolver.appendChild(oStgXWing);
oMainSolver.appendChild(oStgYWing);
oMainSolver.appendChild(oStgSwordfish);
oMainSolver.appendChild(oStgJellyfish);
oMainSolver.appendChild(oStgAIC);
oMainSolver.appendChild(oStgBentNaked);

oMainSolver.onupdaterequest = function(oUr){
	if (this.automatic){
		if (this.mute){
			oUr.inform = false;
		}
		if (this.blind){
			oUr.redraw = false;
		}
	}
	if (this.deferredRequest.length){
		var oCurUr = null;
		while (this.deferredRequest.length){
			oCurUr = this.deferredRequest.shift();
			oCurUr.action();
		}
		this.canvas.write(oCurUr.puzzle);
		return false;
	}
	

	if (this.automatic || oUr.forceAction){
		oUr.action();
	}
	else if (!(oUr.type == UR_NONE || oUr.type == UR_INITIALIZE)){
		this.deferredRequest.push(oUr);
	}
	switch (oUr.type){
	case UR_CRASH:
		if (this.lang == "ko"){
			this.printer.append($("<div>").addClass("stg_title").text("단계 #" + this.step + " : 정답 체크"));
			this.printer.newline();
			this.printer.writeln("값 사이의 충돌이 발생하였습니다!");
		}
		else {
			this.printer.append($("<div>").addClass("stg_title").text("Step #" + this.step + " : Validity Check"));
			this.printer.newline();
			this.printer.writeln("Crash has found!");
		}
		this.canvas.write(oUr.puzzle);
		for (var iN = 0; oUr.crashed.length > iN; iN++){
			this.canvas.highlight(oUr.crashed[iN].ad, "pzh_error");
		}
		this.finalize();
		return false;
		
	case UR_SOLVED:
		if (this.lang == "ko"){
			this.printer.append($("<div>").addClass("stg_title").text("단계 #" + this.step + " : 정답 체크"));
			this.printer.newline();
			this.printer.writeln("퍼즐이 풀렸습니다.");
		}
		else {
			this.printer.append($("<div>").addClass("stg_title").text("Step #" + this.step + " : Validity Check"));
			this.printer.newline();
			this.printer.writeln("This puzzle is solved.");
		}
		this.canvas.write(oUr.puzzle);
		this.finalize();
		return false;
		
	case UR_NO_16_THM:
		if (this.lang == "ko"){
			this.printer.append($("<div>").addClass("stg_title").text("단계 #" + this.step + " : 정답 체크"));
			this.printer.newline();
			this.printer.writeln("이 퍼즐은 17개 미만의 힌트를 가지므로, <em>17-힌트 정리</em>에 의하여 유일해를 갖지 않습니다.");
		}
		else {
			this.printer.append($("<div>").addClass("stg_title").text("Step #" + this.step + " : Validity Check"));
			this.printer.newline();
			this.printer.writeln("This puzzle cannot have a unique solution by <em>No 16-Clue Theorem</em>.");
		}
		this.canvas.write(oUr.puzzle);
		this.finalize();
		return false;
		
	case UR_OBVIOUS:
		if (oUr.inform){
			if (this.lang == "ko"){
				this.printer.append($("<div>").addClass("stg_title").text("단계 #" + this.step + " : 기본적인 후보 지우기."));
				this.printer.newline();
				this.printer.writeln("기본적인 스도쿠 규칙으로부터 후보를 지웠습니다.");
			}
			else {
				this.printer.append($("<div>").addClass("stg_title").text("Step #" + this.step + " : Obvious Candidate Removal"));
				this.printer.newline();
				this.printer.writeln("Obvious candidates are removed.");
			}
		}
		if (oUr.redraw){
			this.canvas.write(oUr.puzzle);
			var oRemoved = null;
			for (var iN = 0; oUr.removed.length > iN; iN++){
				oRemoved = oUr.removed[iN];
				this.canvas.highlight(oRemoved.ad, 1 << oRemoved.value, "pzh_remove");
			}
		}
		this.autoNextStep();
		return false;
		
	case UR_NAKED1:
		if (oUr.inform){
			if (this.lang == "ko"){
				this.printer.append($("<div>").addClass("stg_title").text("단계 #" + this.step + " : 드러난 단일후보"));
			}
			else {
				this.printer.append($("<div>").addClass("stg_title").text("Step #" + this.step + " : Naked Single"));
			}
			this.printer.newline();
			var oDetermined = null;
			for (var iN = 0; oUr.determined.length > iN; iN++){
				oDetermined = oUr.determined[iN];
				if (this.lang == "ko"){
					this.printer.writeln("-> 칸 " + oDetermined.adstr() + " 의 값이 결정되었습니다: " + oDetermined.value);
				}
				else {
					this.printer.writeln("-> " + oDetermined.adstr() + " set to " + oDetermined.value);
				}
			}
		}
		if (oUr.redraw){
			this.canvas.write(oUr.puzzle);
			var oDetermined = null;
			for (var iN = 0; oUr.determined.length > iN; iN++){
				oDetermined = oUr.determined[iN];
				this.canvas.highlight(oDetermined.ad, "pzh_basis");
			}
		}
		this.autoNextStep();
		return false;
		
	case UR_HIDDEN1:
		if (oUr.inform){
			if (this.lang == "ko"){
				this.printer.append($("<div>").addClass("stg_title").text("단계 #" + this.step + " : 숨은 단일후보"));
			}
			else {
				this.printer.append($("<div>").addClass("stg_title").text("Step #" + this.step + " : Hidden Single"));
			}
			this.printer.newline();
			var oDetermined = null;
			for (var iN = 0; oUr.determined.length > iN; iN++){
				oDetermined = oUr.determined[iN];
				this.printer.write(oDetermined.state.value + "@" + oDetermined.state.adstr());
				for (var iM = 0; oDetermined.basis.length > iM; iM++){
					switch (oDetermined.basis[iM].mode){
					case 0:
						if (this.lang == "ko"){
							this.printer.write(", 행 " + TEXTMAP_AD_ROW[oDetermined.basis[iM].pointer]);
						}
						else {
							this.printer.write(", at row " + TEXTMAP_AD_ROW[oDetermined.basis[iM].pointer]);
						}
						break;
					case 1:
						if (this.lang == "ko"){
							this.printer.write(", 열 " + TEXTMAP_AD_COL[oDetermined.basis[iM].pointer]);
						}
						else {
							this.printer.write(", at column " + TEXTMAP_AD_COL[oDetermined.basis[iM].pointer]);
						}
						break;
					case 2:
						if (this.lang == "ko"){
							this.printer.write(", 상자 " + TEXTMAP_AD_BOX[oDetermined.basis[iM].pointer]);
						}
						else {
							this.printer.write(", at box " + TEXTMAP_AD_BOX[oDetermined.basis[iM].pointer]);
						}
						break;
					}
				}
				this.printer.newline();
				if (this.lang == "ko"){
					this.printer.writeln("-> 칸 " + oDetermined.state.adstr() + " 의 값이 결정되었습니다 : " + oDetermined.state.value);
				}
				else {
					this.printer.writeln("-> " + oDetermined.state.adstr() + " set to " + oDetermined.state.value);
				}
			}
		}
		if (oUr.redraw){
			this.canvas.write(oUr.puzzle);
			this.canvas.beginGraphics();
			var oDetermined = null;
			for (var iN = 0; oUr.determined.length > iN; iN++){
				oDetermined = oUr.determined[iN];
				this.canvas.highlight(oDetermined.state.ad, 1 << oDetermined.state.value, "pzh_basis");
				this.canvas.highlight(oDetermined.candi.ad, oDetermined.candi.candi, "pzh_remove");
				this.canvas.drawXMark(oDetermined.candi.ad, oDetermined.candi.candi);
			}
		}
		this.autoNextStep();
		return false;
		
	case UR_NAKED2:
	case UR_NAKED3:
	case UR_NAKED4:
		if (oUr.inform){
			var iSetSize;
			if (this.lang == "ko"){
				switch (oUr.setSize){
				case 2:
					this.printer.append($("<div>").addClass("stg_title2").text("단계 #" + this.step + " : 드러난 후보쌍 (드러난 2-부분집합)"));
					break;
				case 3:
					this.printer.append($("<div>").addClass("stg_title2").text("단계 #" + this.step + " : 드러난 삼중쌍 (드러난 3-부분집합)"));
					break;
				case 4:
					this.printer.append($("<div>").addClass("stg_title2").text("단계 #" + this.step + " : 드러난 사중쌍 (드러난 4-부분집합)"));
					break;
				}
			}
			else {
				switch (oUr.setSize){
				case 2:
					this.printer.append($("<div>").addClass("stg_title2").text("Step #" + this.step + " : Naked Pair (Naked 2-Subset)"));
					break;
				case 3:
					this.printer.append($("<div>").addClass("stg_title2").text("Step #" + this.step + " : Naked Triple (Naked 3-Subset)"));
					break;
				case 4:
					this.printer.append($("<div>").addClass("stg_title2").text("Step #" + this.step + " : Naked Quad (Naked 4-Subset)"));
					break;
				}
			}
			this.printer.newline();
			var oMsg;
			var aRemoved;
			for (var iN = 0; oUr.messages.length > iN; iN++){
				oMsg = oUr.messages[iN];
				this.printer.write(_candistr(oMsg.filter) + "@[");
				for (var iM = 0; oUr.setSize > iM; iM++){
					this.printer.write((iM ? "|" : "") + oMsg.candi[iM].adstr());
				}
				this.printer.write("]");
				for (var iM = 0; oMsg.basis.length > iM; iM++){
					switch (oMsg.basis[iM].mode){
					case 0:
						if (this.lang == "ko"){
							this.printer.write(", 행 " + TEXTMAP_AD_ROW[oMsg.basis[iM].pointer]);
						}
						else {
							this.printer.write(", at row " + TEXTMAP_AD_ROW[oMsg.basis[iM].pointer]);
						}
						break;
					case 1:
						if (this.lang == "ko"){
							this.printer.write(", 열 " + TEXTMAP_AD_COL[oMsg.basis[iM].pointer]);
						}
						else {
							this.printer.write(", at column " + TEXTMAP_AD_COL[oMsg.basis[iM].pointer]);
						}
						break;
					case 2:
						if (this.lang == "ko"){
							this.printer.write(", 상자 " + TEXTMAP_AD_BOX[oMsg.basis[iM].pointer]);
						}
						else {
							this.printer.write(", at box " + TEXTMAP_AD_BOX[oMsg.basis[iM].pointer]);
						}
						break;
					}
				}
				this.printer.newline();
				aRemoved = oMsg.removed;
				for (var iM = 0; aRemoved.length > iM; iM++){
					if (this.lang == "ko"){
						this.printer.writeln("-> 칸 " + aRemoved[iM].adstr() + " 에서 다음 후보를 지웠습니다 : " + _candistr(aRemoved[iM].candi));
					}
					else {
						this.printer.writeln("-> " + _candistr(aRemoved[iM].candi) + " taken from " + aRemoved[iM].adstr());
					}
				}
			}
		}
		if (oUr.redraw){
			this.canvas.write(oUr.puzzle);
			this.canvas.beginGraphics();
			var oMsg;
			var aRemoved;
			for (var iN = 0; oUr.messages.length > iN; iN++){
				oMsg = oUr.messages[iN];
				for (var iM = 0; oUr.setSize > iM; iM++){
					// this.canvas.highlight(oMsg.candi[iM].ad, "pzh_group");
					this.canvas.highlight(oMsg.candi[iM].ad, oMsg.candi[iM].candi, "pzh_basis");
				}
				aRemoved = oMsg.removed;
				for (var iM = 0; aRemoved.length > iM; iM++){
					this.canvas.highlight(aRemoved[iM].ad, aRemoved[iM].candi, "pzh_remove");
					this.canvas.drawXMark(aRemoved[iM].ad, aRemoved[iM].candi);
				}
			}
		}
		this.autoNextStep();
		return false;
		
	case UR_HIDDEN2:
		if (oUr.inform){
			if (this.lang == "ko"){
				this.printer.append($("<div>").addClass("stg_title2").text("단계 #" + this.step + " : 숨은 후보쌍"));
			}
			else {
				this.printer.append($("<div>").addClass("stg_title2").text("Step #" + this.step + " : Hidden Pair"));
			}
			this.printer.newline();
			var oMsg;
			var aRemoved;
			for (var iN = 0; oUr.messages.length > iN; iN++){
				oMsg = oUr.messages[iN];
				this.printer.write(_candistr(oMsg.filter)
					 + "@[" + oMsg.candi1.adstr() + "|" + oMsg.candi2.adstr() + "]");
				for (var iM = 0; oMsg.basis.length > iM; iM++){
					switch (oMsg.basis[iM].mode){
					case 0:
						if (this.lang == "ko"){
							this.printer.write(", 행 " + TEXTMAP_AD_ROW[oMsg.basis[iM].pointer]);
						}
						else {
							this.printer.write(", at row " + TEXTMAP_AD_ROW[oMsg.basis[iM].pointer]);
						}
						break;
					case 1:
						if (this.lang == "ko"){
							this.printer.write(", 열 " + TEXTMAP_AD_COL[oMsg.basis[iM].pointer]);
						}
						else {
							this.printer.write(", at column " + TEXTMAP_AD_COL[oMsg.basis[iM].pointer]);
						}
						break;
					case 2:
						if (this.lang == "ko"){
							this.printer.write(", 상자 " + TEXTMAP_AD_BOX[oMsg.basis[iM].pointer]);
						}
						else {
							this.printer.write(", at box " + TEXTMAP_AD_BOX[oMsg.basis[iM].pointer]);
						}
						break;
					}
				}
				this.printer.newline();
				aRemoved = oMsg.removed;
				for (var iM = 0; aRemoved.length > iM; iM++){
					if (this.lang == "ko"){
						this.printer.writeln("-> 칸 " + aRemoved[iM].adstr() + " 에서 다음 후보를 지웠습니다 : " + _candistr(aRemoved[iM].candi));
					}
					else {
						this.printer.writeln("-> " + _candistr(aRemoved[iM].candi) + " taken from " + aRemoved[iM].adstr());
					}
				}
			}
		}
		if (oUr.redraw){
			this.canvas.write(oUr.puzzle);
			this.canvas.beginGraphics();
			var oMsg;
			var aRemoved;
			for (var iN = 0; oUr.messages.length > iN; iN++){
				oMsg = oUr.messages[iN];
				this.canvas.highlight(oMsg.candi1.ad, oMsg.candi1.candi, "pzh_basis");
				this.canvas.highlight(oMsg.candi2.ad, oMsg.candi2.candi, "pzh_basis");
				aRemoved = oMsg.removed;
				for (var iM = 0; aRemoved.length > iM; iM++){
					this.canvas.highlight(aRemoved[iM].ad, aRemoved[iM].candi, "pzh_remove");
					this.canvas.drawXMark(aRemoved[iM].ad, aRemoved[iM].candi);
				}
			}
		}
		this.autoNextStep();
		return false;
		
	case UR_HIDDEN3:
		if (oUr.inform){
			if (this.lang == "ko"){
				this.printer.append($("<div>").addClass("stg_title2").text("단계 #" + this.step + " : 숨은 삼중쌍"));
			}
			else {
				this.printer.append($("<div>").addClass("stg_title2").text("Step #" + this.step + " : Hidden Triple"));
			}
			this.printer.newline();
			var oMsg;
			var aRemoved;
			for (var iN = 0; oUr.messages.length > iN; iN++){
				oMsg = oUr.messages[iN];
				this.printer.write(_candistr(oMsg.filter)
					 + "@[" + oMsg.candi1.adstr() + "|" + oMsg.candi2.adstr() + "|" + oMsg.candi3.adstr() + "]");
				for (var iM = 0; oMsg.basis.length > iM; iM++){
					switch (oMsg.basis[iM].mode){
					case 0:
						if (this.lang == "ko"){
							this.printer.write(", 행 " + TEXTMAP_AD_ROW[oMsg.basis[iM].pointer]);
						}
						else {
							this.printer.write(", at row " + TEXTMAP_AD_ROW[oMsg.basis[iM].pointer]);
						}
						break;
					case 1:
						if (this.lang == "ko"){
							this.printer.write(", 열 " + TEXTMAP_AD_COL[oMsg.basis[iM].pointer]);
						}
						else {
							this.printer.write(", at column " + TEXTMAP_AD_COL[oMsg.basis[iM].pointer]);
						}
						break;
					case 2:
						if (this.lang == "ko"){
							this.printer.write(", 상자 " + TEXTMAP_AD_BOX[oMsg.basis[iM].pointer]);
						}
						else {
							this.printer.write(", at box " + TEXTMAP_AD_BOX[oMsg.basis[iM].pointer]);
						}
						break;
					}
				}
				this.printer.newline();
				aRemoved = oMsg.removed;
				for (var iM = 0; aRemoved.length > iM; iM++){
					if (this.lang == "ko"){
						this.printer.writeln("-> 칸 " + aRemoved[iM].adstr() + " 에서 다음 후보를 지웠습니다 : " + _candistr(aRemoved[iM].candi));
					}
					else {
						this.printer.writeln("-> " + _candistr(aRemoved[iM].candi) + " taken from " + aRemoved[iM].adstr());
					}
				}
			}
		}
		if (oUr.redraw){
			this.canvas.write(oUr.puzzle);
			this.canvas.beginGraphics();
			var oMsg;
			var aRemoved;
			for (var iN = 0; oUr.messages.length > iN; iN++){
				oMsg = oUr.messages[iN];
				this.canvas.highlight(oMsg.candi1.ad, oMsg.candi1.candi, "pzh_basis");
				this.canvas.highlight(oMsg.candi2.ad, oMsg.candi2.candi, "pzh_basis");
				this.canvas.highlight(oMsg.candi3.ad, oMsg.candi3.candi, "pzh_basis");
				aRemoved = oMsg.removed;
				for (var iM = 0; aRemoved.length > iM; iM++){
					this.canvas.highlight(aRemoved[iM].ad, aRemoved[iM].candi, "pzh_remove");
					this.canvas.drawXMark(aRemoved[iM].ad, aRemoved[iM].candi);
				}
			}
		}
		this.autoNextStep();
		return false;
		
	case UR_INTER_LOCK:
		if (oUr.inform){
			if (this.lang == "ko"){
				this.printer.append($("<div>").addClass("stg_title").text("단계 #" + this.step + " : 교차로 가두기"));
			}
			else {
				this.printer.append($("<div>").addClass("stg_title").text("Step #" + this.step + " : Intersection Lock"));
			}
			this.printer.newline();
			var aRemoved;
			var oMsg = oUr.message;
			this.printer.write(_candistr(oMsg.candi) + "@[");
			for (var iM = 0; oMsg.basis.length > iM; iM++){
				this.printer.write((iM ? "|" : "") + oMsg.basis[iM].adstr());
			}
			this.printer.write("]");
			if (oMsg.type == "pointing"){
				if (this.lang == "ko"){
					this.printer.write(" : 함께 모여 가리키는 쌍을 찾았습니다.");
				}
				else {
					this.printer.write(", forming pointing pair");
				}
			}
			else if (oMsg.type == "box"){
				if (this.lang == "ko"){
					this.printer.write(" : 함께모여 상자 안을 지우는 쌍을 찾았습니다.");
				}
				else {
					this.printer.write(", forming box reduction");
				}
			}
			this.printer.newline();
			aRemoved = oMsg.removed;
			for (var iM = 0; aRemoved.length > iM; iM++){
				if (this.lang == "ko"){
					this.printer.writeln("-> 칸 " + aRemoved[iM].adstr() + " 에서 다음 후보를 지웠습니다 : " + _candistr(aRemoved[iM].candi));
				}
				else {
					this.printer.writeln("-> " + _candistr(aRemoved[iM].candi) + " taken from " + aRemoved[iM].adstr());
				}
			}
		}
		if (oUr.redraw){
			this.canvas.write(oUr.puzzle);
			this.canvas.beginGraphics();
			var aBasis, aRemoved;
			var oMsg = oUr.message;
			aBasis = oMsg.basis;
			for (var iM = 0; aBasis.length > iM; iM++){
				this.canvas.highlight(aBasis[iM].ad, "pzh_group");
				this.canvas.highlight(aBasis[iM].ad, aBasis[iM].candi, "pzh_basis");
			}
			aRemoved = oMsg.removed;
			for (var iM = 0; aRemoved.length > iM; iM++){
				// this.canvas.highlight(aRemoved[iM].ad, "pzh_target");
				this.canvas.highlight(aRemoved[iM].ad, aRemoved[iM].candi, "pzh_remove");
				this.canvas.drawXMark(aRemoved[iM].ad, aRemoved[iM].candi);
			}
		}
		this.autoNextStep();
		return false;
		
	case UR_XWING:
	case UR_SWORDFISH:
	case UR_JELLYFISH:
	case UR_SQUIRMBAG:
		if (oUr.inform){
			if (this.lang == "ko"){
				switch (oUr.setSize){
				case 2:
					this.printer.append($("<div>").addClass("stg_title2").text("단계 #" + this.step + " : X-날개 (2-물고기)"));
					break;
				case 3:
					this.printer.append($("<div>").addClass("stg_title2").text("단계 #" + this.step + " : 황새치 (3-물고기)"));
					break;
				case 4:
					this.printer.append($("<div>").addClass("stg_title2").text("단계 #" + this.step + " : 해파리 (4-물고기)"));
					break;
				case 4:
					this.printer.append($("<div>").addClass("stg_title2").text("단계 #" + this.step + " : 천 가방 (5-물고기)"));
					break;
				}
			}
			else {
				switch (oUr.setSize){
				case 2:
					this.printer.append($("<div>").addClass("stg_title2").text("Step #" + this.step + " : X-Wing (2-Fish)"));
					break;
				case 3:
					this.printer.append($("<div>").addClass("stg_title2").text("Step #" + this.step + " : Swordfish (3-Fish)"));
					break;
				case 4:
					this.printer.append($("<div>").addClass("stg_title2").text("Step #" + this.step + " : Jellyfish (4-Fish)"));
					break;
				case 4:
					this.printer.append($("<div>").addClass("stg_title2").text("Step #" + this.step + " : Squirm Bag (5-Fish)"));
					break;
				}
			}
			this.printer.newline();
			var oMsg = oUr.message;
			switch (oMsg.mode){
			case 0:
				if (this.lang == "ko"){
					this.printer.write("행 " + oMsg.value + "@[");
				}
				else {
					this.printer.write("Rows " + oMsg.value + "@[");
				}
				for (var iM = 0; oMsg.basisPointer.length > iM; iM++){
					this.printer.write((iM ? "|" : "") + TEXTMAP_AD_ROW[oMsg.basisPointer[iM]] + "*");
				}
				if (this.lang == "ko"){
					this.printer.write("] 이 " + oUr.setSize + "-물고기를 형성합니다. 다음 열을 지웁니다 : " + oMsg.value + "@[");
				}
				else {
					this.printer.write("] formed a " + oUr.setSize + "-fish, eliminating the column wings: " + oMsg.value + "@[");
				}
				for (var iM = 0; oMsg.pointer.length > iM; iM++){
					this.printer.write((iM ? "|" : "") + "*" + TEXTMAP_AD_COL[oMsg.pointer[iM]]);
				}
				this.printer.writeln("].");
				break;
			case 1:
				if (this.lang == "ko"){
					this.printer.write("열 " + oMsg.value + "@[");
				}
				else {
					this.printer.write("Columns " + oMsg.value + "@[");
				}
				for (var iM = 0; oMsg.basisPointer.length > iM; iM++){
					this.printer.write((iM ? "|" : "") + "*" + TEXTMAP_AD_COL[oMsg.basisPointer[iM]]);
				}
				if (this.lang == "ko"){
					this.printer.write("] 이 " + oUr.setSize + "-물고기를 형성합니다. 다음 행을 지웁니다 : " + oMsg.value + "@[");
				}
				else {
					this.printer.write("] formed a " + oUr.setSize + "-fish, eliminating the row wings: " + oMsg.value + "@[");
				}
				for (var iM = 0; oMsg.pointer.length > iM; iM++){
					this.printer.write((iM ? "|" : "") + TEXTMAP_AD_ROW[oMsg.pointer[iM]] + "*");
				}
				this.printer.writeln("].");
				break;
			}
			var aRemoved = oMsg.removed;
			for (var iM = 0; aRemoved.length > iM; iM++){
				if (this.lang == "ko"){
					this.printer.writeln("-> 칸 " + aRemoved[iM].adstr() + " 에서 다음 후보를 지웠습니다 : " + _candistr(aRemoved[iM].candi));
				}
				else {
					this.printer.writeln("-> " + _candistr(aRemoved[iM].candi) + " taken from " + aRemoved[iM].adstr());
				}
			}
		}
		if (oUr.redraw){
			this.canvas.write(oUr.puzzle);
			this.canvas.beginGraphics();
			var oMsg = oUr.message;
			var aBasis = oMsg.basis;
			for (var iM = 0; aBasis.length > iM; iM++){
				this.canvas.highlight(aBasis[iM].ad, "pzh_group");
				this.canvas.highlight(aBasis[iM].ad, aBasis[iM].candi, "pzh_basis");
			}
			var aRemoved = oMsg.removed;
			for (var iM = 0; aRemoved.length > iM; iM++){
				this.canvas.highlight(aRemoved[iM].ad, "pzh_target");
				this.canvas.highlight(aRemoved[iM].ad, aRemoved[iM].candi, "pzh_remove");
				this.canvas.drawXMark(aRemoved[iM].ad, aRemoved[iM].candi);
			}
		}
		this.autoNextStep();
		return false;
		
	case UR_YWING:
		if (oUr.inform){
			if (this.lang == "ko"){
				this.printer.append($("<div>").addClass("stg_title2").text("단계 #" + this.step + " : Y-날개"));
			}
			else {
				this.printer.append($("<div>").addClass("stg_title2").text("Step #" + this.step + " : Y-Wing"));
			}
			this.printer.newline();
			var oMsg = oUr.message;
			if (this.lang == "ko"){
				this.printer.writeln("칸 " + oMsg.hinge.toString() + " 이 날개 " + oMsg.wing1.toString() + " 와 " + oMsg.wing2.toString() + " 에 방아쇠 역할을 합니다.");
			}
			else {
				this.printer.writeln(oMsg.hinge.toString() + " hinges " + oMsg.wing1.toString() + " and " + oMsg.wing2.toString());
			}
			var aRemoved = oMsg.removed;
			for (var iM = 0; aRemoved.length > iM; iM++){
				if (this.lang == "ko"){
					this.printer.writeln("-> 칸 " + aRemoved[iM].adstr() + " 에서 다음 후보를 지웠습니다 : " + _candistr(aRemoved[iM].candi));
				}
				else {
					this.printer.writeln("-> " + _candistr(aRemoved[iM].candi) + " taken from " + aRemoved[iM].adstr());
				}
			}
		}
		if (oUr.redraw){
			this.canvas.write(oUr.puzzle);
			this.canvas.beginGraphics();
			var oMsg = oUr.message;
			this.canvas.highlight(oMsg.hinge.ad, "pzh_basis");
			this.canvas.highlight(oMsg.wing1.ad, "pzh_group");
			this.canvas.highlight(oMsg.wing2.ad, "pzh_group");
			this.canvas.highlight(oMsg.wing1.ad, oMsg.wing1.candi & ~oMsg.hinge.candi, "pzh_basis");
			this.canvas.highlight(oMsg.wing2.ad, oMsg.wing2.candi & ~oMsg.hinge.candi, "pzh_basis");
			/*
			this.canvas.drawLink(oMsg.hinge.ad, _value(oMsg.hinge.candi & oMsg.wing1.candi), oMsg.wing1.ad, _value(oMsg.hinge.candi & oMsg.wing1.candi), ST_WEAK);
			this.canvas.drawLink(oMsg.hinge.ad, _value(oMsg.hinge.candi & oMsg.wing2.candi), oMsg.wing2.ad, _value(oMsg.hinge.candi & oMsg.wing2.candi), ST_WEAK);
			*/
			var aRemoved = oMsg.removed;
			for (var iM = 0; aRemoved.length > iM; iM++){
				this.canvas.highlight(aRemoved[iM].ad, "pzh_target");
				this.canvas.highlight(aRemoved[iM].ad, aRemoved[iM].candi, "pzh_remove");
				this.canvas.drawXMark(aRemoved[iM].ad, aRemoved[iM].candi);
			}
		}
		this.autoNextStep();
		return false;
		
	case UR_BENT_NAKED:
		if (oUr.inform){
			var oMsg = oUr.message;
			if (this.lang == "ko"){
				if (oMsg.type == STG_BN_STRONG){
					this.printer.append($("<div>").addClass("stg_title3").text("단계 #" + this.step + " : 휘어지게 드러난 부분집합 (강한 조건)"));
				}
				else if (oMsg.type == STG_BN_WEAK){
					this.printer.append($("<div>").addClass("stg_title3").text("단계 #" + this.step + " : 휘어지게 드러난 부분집합 (약한 조건)"));
				}
			}
			else {
				if (oMsg.type == STG_BN_STRONG){
					this.printer.append($("<div>").addClass("stg_title3").text("Step #" + this.step + " : Bent Naked Subsets (strong)"));
				}
				else if (oMsg.type == STG_BN_WEAK){
					this.printer.append($("<div>").addClass("stg_title3").text("Step #" + this.step + " : Bent Naked Subsets (weak)"));
				}
			}
			this.printer.newline();
			var aRemoved = oMsg.removed;
			var sAdStr0 = "", sAdStr1 = "", sAdStrHub = "";
			for (var iM = 0; oMsg.wing0.length > iM; iM++){
				sAdStr0 += (iM ? "|" : "") + oMsg.wing0[iM].adstr();
			}
			for (var iM = 0; oMsg.wing1.length > iM; iM++){
				sAdStr1 += (iM ? "|" : "") + oMsg.wing1[iM].adstr();
			}
			for (var iM = 0; oMsg.hub.length > iM; iM++){
				sAdStrHub += (iM ? "|" : "") + oMsg.hub[iM].adstr();
			}
			if (this.lang == "ko"){
				this.printer.writeln(_candistr(oMsg.candiWing0 | oMsg.candiWing1 | oMsg.candiIntersect)
					 + "@[" + sAdStr0 + "|" + sAdStrHub + "|" + sAdStr1 + "] 가 휘어지게 잠겼습니다.");
			}
			else {
				this.printer.writeln(_candistr(oMsg.candiWing0 | oMsg.candiWing1 | oMsg.candiIntersect)
					 + "@[" + sAdStr0 + "|" + sAdStrHub + "|" + sAdStr1 + "] is bent-locked.");
			}
			if (this.lang == "ko"){
				this.printer.writeln("날개 1 : " + _candistr(oMsg.candiWing0) + "@[" + sAdStr0 + "]");
				this.printer.writeln("날개 2 : " + _candistr(oMsg.candiWing1) + "@[" + sAdStr1 + "]");
				this.printer.writeln("다음 후보가 두 날개에 공통으로 포함되어 있습니다 : " + _candistr(oMsg.candiIntersect));
				this.printer.writeln("잠김 계수 (전체 후보 개수 - 전체 칸 개수) : " + oMsg.sigma);
				this.printer.writeln("잠김 계수와 공통 후보의 개수의 합인 " + (_size(oMsg.candiIntersect) + oMsg.sigma) + " 이(가) 2보다 작으므로, 휘어진 집합이 잠깁니다.");
			}
			else {
				this.printer.writeln("Wing 1 : " + _candistr(oMsg.candiWing0) + "@[" + sAdStr0 + "]");
				this.printer.writeln("Wing 2 : " + _candistr(oMsg.candiWing1) + "@[" + sAdStr1 + "]");
				this.printer.writeln("Common candidates in both wings : " + _candistr(oMsg.candiIntersect));
				this.printer.writeln("Lockedness Index : " + oMsg.sigma);
			}
			for (var iM = 0; aRemoved.length > iM; iM++){
				if (this.lang == "ko"){
					this.printer.writeln("-> 칸 " + aRemoved[iM].adstr() + " 에서 다음 후보를 지웠습니다 : " + _candistr(aRemoved[iM].candi));
				}
				else {
					this.printer.writeln("-> " + _candistr(aRemoved[iM].candi) + " taken from " + aRemoved[iM].adstr());
				}
			}
		}
		if (oUr.redraw){
			this.canvas.write(oUr.puzzle);
			this.canvas.beginGraphics();
			var oMsg = oUr.message;
			for (var iM = 0; oMsg.wing0.length > iM; iM++){
				this.canvas.highlight(oMsg.wing0[iM].ad, "pzh_group");
				this.canvas.highlight(oMsg.wing0[iM].ad, oMsg.wing0[iM].candi & oMsg.candiIntersect, "pzh_basis");
			}
			for (var iM = 0; oMsg.wing1.length > iM; iM++){
				this.canvas.highlight(oMsg.wing1[iM].ad, "pzh_group");
				this.canvas.highlight(oMsg.wing1[iM].ad, oMsg.wing1[iM].candi & oMsg.candiIntersect, "pzh_basis");
			}
			for (var iM = 0; oMsg.hub.length > iM; iM++){
				this.canvas.highlight(oMsg.hub[iM].ad, "pzh_basis");
			}
			var aRemoved = oMsg.removed;
			for (var iM = 0; aRemoved.length > iM; iM++){
				this.canvas.highlight(aRemoved[iM].ad, "pzh_target");
				this.canvas.highlight(aRemoved[iM].ad, aRemoved[iM].candi, "pzh_remove");
				this.canvas.drawXMark(aRemoved[iM].ad, aRemoved[iM].candi);
			}
		}
		this.autoNextStep();
		return false;

	case UR_AIC:
		if (oUr.inform){
			var oChain = oUr.message.chain;
			if (oUr.message.type == ST_STRONG){
				if (this.lang == "ko"){
					this.printer.append($("<div>").addClass("stg_title3").text("단계 #" + this.step + " : 교대 추론 고리 (강한 조건)"));
				}
				else {
					this.printer.append($("<div>").addClass("stg_title3").text("Step #" + this.step + " : Alternating Inference Chain (strong)"));
				}
				this.printer.newline();
				this.printer.write("X" + oChain[0].value + "@" + _adstr(oChain[0].ad));
				for (var iN = 1; oChain.length > iN; iN++){
					if ((iN % 2) == 1){
						this.printer.write("++>");
					}
					else {
						this.printer.write("-->X");
					}
					this.printer.write(oChain[iN].value + "@" + _adstr(oChain[iN].ad));
				}
				this.printer.newline();
				if (this.lang == "ko"){
					this.printer.writeln("-> 칸 " + _adstr(oChain[0].ad) + " 의 값이 결정되었습니다 : " + oChain[0].value);
				}
				else {
					this.printer.writeln("-> " + _adstr(oChain[0].ad) + " set to " + oChain[0].value);
				}
			}
			else if (oUr.message.type == ST_WEAK){
				if (this.lang == "ko"){
					this.printer.append($("<div>").addClass("stg_title3").text("Step #" + this.step + " : 교대 추론 고리 (약한 조건)"));
				}
				else {
					this.printer.append($("<div>").addClass("stg_title3").text("Step #" + this.step + " : Alternating Inference Chain (weak)"));
				}
				this.printer.newline();
				this.printer.write(oChain[0].value + "@" + _adstr(oChain[0].ad));
				for (var iN = 1; oChain.length > iN; iN++){
					if ((iN % 2) == 1){
						this.printer.write("-->X");
					}
					else {
						this.printer.write("++>");
					}
					this.printer.write(oChain[iN].value + "@" + _adstr(oChain[iN].ad));
				}
				this.printer.newline();
				if (this.lang == "ko"){
					this.printer.writeln("-> 칸 " + _adstr(oChain[0].ad) + " 에서 다음 후보를 지웠습니다 : " + oChain[0].value);
				}
				else {
					this.printer.writeln("-> " + oChain[0].value + " taken from " + _adstr(oChain[0].ad));
				}
			}
		}
		if (oUr.redraw){
			this.canvas.write(oUr.puzzle);
			this.canvas.beginGraphics();
			
			this.canvas.highlight(oUr.message.ad, oUr.message.candi, "pzh_remove");
			this.canvas.highlight(oUr.message.ad, "pzh_basis");
			this.canvas.drawXMark(oUr.message.ad, oUr.message.candi);
			var oChain = oUr.message.chain;
			for (var iN = 1; (oChain.length - 1) > iN; iN++){
				this.canvas.highlight(oChain[iN].ad, "pzh_group");
				this.canvas.highlight(oChain[iN].ad, 1 << oChain[iN].value, (iN % 2) ? "pzh_color1" : "pzh_color2");
			}
			this.canvas.drawChain(oUr.message);
		}
		this.autoNextStep();
		return false;
		
	case UR_INITIALIZE:
		this.canvas.write(oUr.puzzle);
		return false;
	
	case UR_NONE:
		while (true){
			this.index++;
			if (this.index == this.children.length){
				this.canvas.write(oUr.puzzle);
				if (this.lang == "ko"){
					this.printer.append($("<div>").addClass("stg_title").text("단계 #" + this.step + " : 메인 풀이 알고리즘"));
					this.printer.newline();
					this.printer.writeln("이 알고리즘으로 주어진 스도쿠를 전부 풀어낼 수 없습니다.");
				}
				else {
					this.printer.append($("<div>").addClass("stg_title").text("Step #" + this.step + " : Main Solver"));
					this.printer.newline();
					this.printer.writeln("This solver is not enough powerful to solve this puzzle.");
				}
				this.finalize();
				break;
			}
			else {
				if (! this.children[this.index].disabled){
					this.children[this.index].solverequest(new SolveRequest(this.puzzle));
					break;
				}
			}
		}
		return false;
	}
};

oMainSolver.onsolverequest = function(oSr){
	this.puzzle = oSr.puzzle;
	this.index = -1;
	this.step = 1;
	this.deferredRequest = [];
	this.timer = null;
	this.updaterequest(new UpdateRequest(UR_INITIALIZE, this.puzzle));
};

oMainSolver.nextStep = function(){
	this.updaterequest(new UpdateRequest(UR_NONE, this.puzzle));
};

oMainSolver.beginAutoNextStep = function(){
	this.automatic = true;
	this.timer = new Date();
	this.nextStep();
};

oMainSolver.finalize = function(){
	if (this.automatic){
		this.printer.append($("<div>").addClass("stg_stat").text("Statistics"));
		this.printer.newline();
		if (this.lang == "ko"){
			this.printer.writeln("- 걸린 시간 : " + (new Date().getTime() - this.timer.getTime()) + " 밀리초(ms)");
		}
		else {
			this.printer.writeln("- Elapsed time : " + (new Date().getTime() - this.timer.getTime()) + "ms");
		}
	}

	// Variable reset
	this.automatic = false;
	this.index = -1;
	this.step = 0;
	this.timer = null;
	this.deferredRequest = [];
};

oMainSolver.autoNextStep = function(){
	this.step++;
	this.index = -1;
	if (this.automatic){
		setTimeout(function(){oMainSolver.nextStep();}, 0);
	}
};

oMainSolver.loadFromSelector = function(){
	this.solverequest(new SolveRequest(this.selector.load()));
	this.printer.clear();
	this.printer.append($("<div>").addClass("stg_hdr").text(this.selector.samples[this.selector.index].description));
	this.printer.newline();
};

oMainSolver.loadFromString = function(oSampleObj){
	if (oSampleObj.type == "simple"){
		this.selector.puzzle = Puzzle.fromSimpleNumberString(oSampleObj.string);
	}
	else if (oSampleObj.type == "long"){
		this.selector.puzzle = Puzzle.fromLargeNumberString(oSampleObj.string);
	}
	this.solverequest(new SolveRequest(this.selector.puzzle));
	this.printer.clear();
	if (this.lang == "ko"){
		this.printer.append($("<div>").addClass("stg_hdr").text("문자열로 불러들인 퍼즐"));
	}
	else {
		this.printer.append($("<div>").addClass("stg_hdr").text("Loaded from String"));
	}
	this.printer.newline();
};

oMainSolver.exportString = function(){
	if (this.lang == "ko"){
		this.printer.append($("<div>").addClass("stg_title").text("내보내기"));
		this.printer.newline();
		this.printer.writeln("- 단순 코드 :");
		this.printer.writeln(this.puzzle.toSimpleNumber());
		this.printer.writeln("- 긴 코드 :");
		this.printer.writeln(this.puzzle.toLargeNumber().toString());
	}
	else {
		this.printer.append($("<div>").addClass("stg_title").text("Export"));
		this.printer.newline();
		this.printer.writeln("- Simple Code :");
		this.printer.writeln(this.puzzle.toSimpleNumber());
		this.printer.writeln("- Long Code :");
		this.printer.writeln(this.puzzle.toLargeNumber().toString());
	}
};