var points = [];
var pointRadius = 8;
var canvas;
var widthAdjust = 1.04;
var heightAdjust = 1.25;
var numRandomPoints = 100;
var animationSpeed = 500;
var lineWeight = 1;

var currWidth;
var currHeight;

// Global variables necessary in drawing/animation
var finalHull;
var triangleLines = [];
var triangleLinesAnimate = [];

var upperTangentLines = [];
var lowerTangentLines = [];
var allLowerTangentLines = [];
var allUpperTangentLines = [];

var lowerTangentsToDraw = [];
var upperTangentsToDraw = [];

var topComplete = false;
var botComplete = false;
var subHullFound = false;
var upperTangentTemp;
var lowerTangentTemp;

var lTIdxDraw = 0;
var uTIdxDraw = 0;

// Timers used in animation 
var lowerTangentTimer;
var upperTangentTimer;


/*
* Clear all timers used for timing animation of upper/lower tangent walking.
*/
function stopAllTimers(){
	clearInterval(lowerTangentTimer);
	clearInterval(upperTangentTimer);

	//this is some hack-ish nonsense from SO, but for some reason all timers don't clear properly otherwise.
	// for reference: https://stackoverflow.com/questions/3141064/how-to-stop-all-timeouts-and-intervals-using-javascript/8345814#8345814
	var highestTimeoutId = setTimeout(";");
	for (var i = 0 ; i < highestTimeoutId ; i++) {
	    clearTimeout(i); 
	}
}


/*
* Updates correct lower tangent to draw for the tangent walking animation.
*/
function updateTempLower(){

	if(allLowerTangentLines.length > 0){

		lTIdxDraw++;
		if(botComplete){
			clearInterval(lowerTangentTimer);
			upperTangentTimer = setInterval(updateTempUpper, animationSpeed);
			lTIdxDraw--;
		}
			
		if(lTIdxDraw > allLowerTangentLines.length-1){
			clearInterval(lowerTangentTimer);
			lTIdxDraw = -999;
			upperTangentTimer = setInterval(updateTempUpper, animationSpeed);
		}
	}
}


/*
* Updates correct upper tangent to draw for the tangent walking animation.
*/
function updateTempUpper(){
	if(allUpperTangentLines.length > 0){
		uTIdxDraw++;
		if(topComplete){
			subHullFound = true;
		}
			
		if(uTIdxDraw > allUpperTangentLines.length-1){
			clearInterval(upperTangentTimer);
			//clearInterval(lowerTangentTimer);
			lowerTangentTimer = setInterval(updateTempLower, animationSpeed);
			uTIdxDraw = -999;
		}
	}
}


/*
* Runs after page has finished loading. Initializes event listeners for all buttons on page.
*/
window.onload = function(){

	// get the html dom elements
	var mergeButton = document.getElementById("mergeButton");

	// event listeners (call different functions with a button press)
	mergeButton.addEventListener("click", function(){
		stopAllTimers();
		finalHull = mergeHull(sortByX(points));
		lowerTangentTimer = setInterval(updateTempLower, animationSpeed);
	});

	var clearButton = document.getElementById("clearButton");

	clearButton.addEventListener("click", function(){
		points = [];
		triangleLines = [];
		triangleLinesAnimate = [];
		upperTangentLines = [];
		lowerTangentLines = [];
		finalHull = [];
		allLowerTangentLines = [];
		allUpperTangentLines = [];
		lowerTangentsToDraw = [];
		upperTangentsToDraw = [];
		uTIdxDraw = 0;
		lTIdxDraw = 0;

		topComplete = false;
		botComplete = false;
		subHullFound = false;
		stopAllTimers();
	});

	var randomButton = document.getElementById("randomButton");

	randomButton.addEventListener("click", function(){
		buffer = 50;
		currWidth = windowWidth/widthAdjust;
		currHeight = windowHeight/heightAdjust;
		// add points randomly within size of canvas (with a buffer on all sides to prevent points from being drawn on edges)
		for(var i=0; i<numRandomPoints; ++i){
			var newPointX = Math.floor(Math.random()*(currWidth-(buffer*1.5)))+buffer;
			var newPointY = Math.floor(Math.random()*(currHeight-buffer*1.5))+buffer;
			points.push( new Point(newPointX, newPointY) );
		}
	});

	var settingsButton = document.getElementById("settingsButton");

	settingsButton.addEventListener("click", function(){
		showSettings();
	});

	var saveButton = document.getElementById("saveButton");

	saveButton.addEventListener("click", function(){

		var animationSlider = document.getElementById("animationSlider");
		animationSpeed = 1550 - animationSlider.value;

		var randomPointsInput = document.getElementById("randomPointsInput");
		numRandomPoints = randomPointsInput.value;

		var pointRadiusSlider = document.getElementById("pointRadiusSlider");
		pointRadius = float(pointRadiusSlider.value);
		
		var lineWeightSlider = document.getElementById("lineWeightSlider");
		lineWeight = float(lineWeightSlider.value);
		showSettings();
	});
    
};

/*
* Toggle visibility of the settings window
*/
function showSettings() {

	var containerElement = document.getElementById('allContent');
	containerElement.setAttribute('class', 'blur');

	var elt = document.getElementById("settings");
	var saveButton = document.getElementById("saveButton");

	if(elt.style.visibility == "visible"){
		elt.style.visibility = "hidden";
		saveButton.style.visibility = "hidden";
		containerElement.setAttribute('class', null);
	} else {
		elt.style.visibility = "visible";
		saveButton.style.visibility = "visible";
		containerElement.setAttribute('class', 'blur');
	}
}


/*
* Center the canvas for drawing in the center of the screen
*/
function centerCanvas(){
  var x = (windowWidth - width) / 2;
  var y = (windowHeight - height) / 1.6;
  canvas.position(x, y);
}


/*
* Required function for p5.js. Runs once on page load before other code is executed
*/
function setup() {
  //define canvas and its positioning
  currWidth = windowWidth/widthAdjust;
  currHeight = windowHeight/heightAdjust;
  canvas = createCanvas(currWidth, currHeight);
  canvas.parent('canvasHolder');
  centerCanvas();

  canvas.mouseClicked(addPoint);
  
  stroke(195,7,63);
  fill(195,7,63);             
  canvas.mouseClicked(addPoint);
}

/*
* Primary draw loop required for drawing/animation in p5.js - runs continuously at default frame rate. 
*/
function draw(){
	background(26, 26, 29);
	strokeWeight(lineWeight);
	
	drawTriangles();
	drawLowerTempTangents();
	drawUpperTempTangents();
	drawTangentLines();


	if(subHullFound){
		stopAllTimers();
		botComplete = false;
		lTIdxDraw++;
		topComplete = false;
		lowerTangentTimer = setInterval(updateTempLower, animationSpeed);
		subHullFound = false;
	}
	if (uTIdxDraw < 0 && lTIdxDraw < 0){
		drawFinalHull();
		for(var i=0; i<triangleLines.length; ++i){
			triangleLines[i] = new LineObj(0,0,0,0);
		}
		stopAllTimers();
	}
	
	strokeWeight(1);
	for(var i=0; i<points.length; ++i){
		ellipse(points[i].x, points[i].y, pointRadius);
	}

}

/**
 * Called whenever browser window size changes - changes canvas size accordingly
 */ 
function windowResized() {

	newWidth = windowWidth/widthAdjust;
	newHeight = windowHeight/heightAdjust;

	//maybe add: move existing points so they're placed appropriately 
	resizeCanvas(newWidth, newHeight);
	centerCanvas();
}


/**
 * Allows points to be added manually via mouse click
 */ 
function addPoint() {
	var p = new Point(mouseX, mouseY);
	points.push(p);
}


/*
* CORE CONVEX HULL FUNCTIONS
*/

/**
 * Main function for computing the convex hull using a divide and conquer technique
 * Parameters: An array of point objects
 * Return: An array representing the convex hull of the input points
 */ 
function mergeHull(pointSet) {

	if(pointSet.length <= 3){
		pointsAndSegments = bruteForceHull(pointSet);	
		triangleLines = triangleLines.concat(pointsAndSegments[1]);
		return pointsAndSegments[0];
	}

	// The divide-and-conquer/MergeHull algorithm is dependent on the points being in general position (essentially, points are not colinear). This adds
	// an unnoticeable random amount to each of the points to make colinear points extremely unlikely.
	for(var i=0; i<pointSet.length; ++i){
		pointSet[i].x = pointSet[i].x + Math.random()*.0001;
	}

	//split sorted array into two halves.
	var midIndex = Math.floor(pointSet.length / 2.0);
	var firstHalf = pointSet.slice(0, midIndex);
	var secondHalf = pointSet.slice(midIndex);

	// Recursive calls to compute  hulls. hullA = CH(firstHalf), hullB=CH(secondHalf)
	var hullA = mergeHull(firstHalf);
	var hullB = mergeHull(secondHalf);

	//Compute the upper and lower tangent points of hullA and hullB
	var upperTangentIndices = upperTangent(hullA, hullB);
	var lowerTangentIndices = lowerTangent(hullA, hullB);

	var upperTangentAIndex = upperTangentIndices[0];
	var lowerTangentAIndex = lowerTangentIndices[0];
	var upperTangentBIndex = upperTangentIndices[1];
	var lowerTangentBIndex = lowerTangentIndices[1];

	/* 
	The remainder of this function is to concatenate/merge the two hulls.
	This involves finding the points between the upper tangent to the lower tangent
	in counterclockwise order.
	*/ 

	var upperTangentAPoint = hullA[upperTangentAIndex];
	var lowerTangentAPoint = hullA[lowerTangentAIndex];

	// Make the upper tangent point of hull A index 0.
	while(hullA[0] != upperTangentAPoint){
		hullA.push(hullA.shift());
	}

	// We need to update the index of hullA's lower index because it changed in the previous shifting operation.
	for(var i=0; i<hullA.length; ++i){
		if(hullA[i] == lowerTangentAPoint){
			lowerTangentAIndex = i;
			break;
		}
	}

	var half = hullA.slice(0, lowerTangentAIndex+1);

	var upperTangentBPoint = hullB[upperTangentBIndex];
	var lowerTangentBPoint = hullB[lowerTangentBIndex];

	// Make the lower tangent point of hullB index 0.
	while(hullB[0] != lowerTangentBPoint){
		hullB.push(hullB.shift());
	}

	// We need to update the index of hullB's upper index because it changed in the previous shifting operation.
	for(var i=0; i<hullB.length; ++i){
		if(hullB[i] == upperTangentBPoint){
			upperTangentBIndex = i;
			break;
		}
	}

	var merged = half.concat(hullB.slice(0, upperTangentBIndex+1));
	//print(merged);
	return merged;

}

/*
* Computes the next counterclockwise point in a hull. Note that hulls
* are maintained/stored in counterclockwise order.
* Parameters: An integer for current index and an array of point objects
* Return: An integer representing the index of the next (counterclockwise) point on the hull
*/ 
function nextCounterClockwisePoint(currentIndex, hull){
	var nextIndex = currentIndex + 1;
	if(nextIndex > hull.length-1){
		nextIndex = 0;
	}
	return nextIndex;
}

/*
* Computes the next clockwise point in a hull. Note that hulls
* are maintained/stored in counterclockwise order.
* Parameters: An integer for current index and an array of point objects
* Return: An integer representing the index of the next (clockwise) point on the hull
*/ 
function nextClockwisePoint(currentIndex, hull){
	var nextIndex = currentIndex - 1;
	if(nextIndex < 0){
		nextIndex = hull.length - 1;
	}
	return nextIndex;
}

/*
* Compute the lower tangent between two convex hulls (hulls separated by a vertical line).
* Parameters: Two arrays of point objects, each representing a convex hull.
* Return: An array of two indices (one from hA, one from hB) that define the lower tangent.
*/
function lowerTangent(hA, hB){

	var a = maxXValueIndex(hA);

	var b = minXValueIndex(hB);

	// while a and b are not the indices of points of the lower tangent line,
	// move a clockwise and/or b counterclockwise until the two points form the lower tangent.
	var tangentFound = false;
	allLowerTangentLines.push(new LineObj(hA[a].x, hA[a].y, hB[b].x, hB[b].y));
	while (!tangentFound){
		tangentFound = true;

		while(isCounterClockwise(hB[b], hA[a], hA[nextClockwisePoint(a, hA)])){
			//move a clockwise
			a = nextClockwisePoint(a, hA);
			allLowerTangentLines.push(new LineObj(hA[a].x, hA[a].y, hB[b].x, hB[b].y));			
		}

		while(isClockwise(hA[a], hB[b], hB[nextCounterClockwisePoint(b, hB)])){
			//move b counterclockwise
			b = nextCounterClockwisePoint(b, hB);
			allLowerTangentLines.push(new LineObj(hA[a].x, hA[a].y, hB[b].x, hB[b].y));
			tangentFound = false;	
		}
	}
	lowerTangentLines.push(new LineObj(hA[a].x, hA[a].y, hB[b].x, hB[b].y));

	// return the indices of points defining the lower tangent line (one point from hull hA and one from hull hB)
	return [a, b];
}

/*
* Compute the upper tangent between two convex hulls hA and hB (hulls separated by a vertical line).
* Parameters: Two arrays of point objects, each representing a convex hull.
* Return: An array of two indices (one from hA, one from hB) that define the upper tangent. 
*/
function upperTangent(hA, hB){

	var a = maxXValueIndex(hA);

	var b = minXValueIndex(hB);

	// while a and b are not the indices of points of the upper tangent line for hA and hB,
	// move a counterclockwise or b clockwise until the two points form the upper tangent line.
	var tangentFound = false;
	allUpperTangentLines.push(new LineObj(hA[a].x, hA[a].y, hB[b].x, hB[b].y));

	while (!tangentFound){
		tangentFound = true;

		while(isCounterClockwise(hA[a], hB[b], hB[nextClockwisePoint(b, hB)])){
			b = nextClockwisePoint(b, hB);
			allUpperTangentLines.push(new LineObj(hA[a].x, hA[a].y, hB[b].x, hB[b].y));
		}

		while(isClockwise(hB[b], hA[a], hA[nextCounterClockwisePoint(a, hA)])){
			a = nextCounterClockwisePoint(a, hA);
			allUpperTangentLines.push(new LineObj(hA[a].x, hA[a].y, hB[b].x, hB[b].y));
			tangentFound = false;	
		}	
	}
	upperTangentLines.push(new LineObj(hA[a].x, hA[a].y, hB[b].x, hB[b].y));

	// return the indices of points defining the upper tangent line (one point from hull hA and one from hull hB)
	return [a, b];
}

/**
 * Compute convex hull with brute force
 * Parameters: An array of point objects
 * Return: returns an array of arrays: the array of counter clockwise points that make up the hull and an array of line objects that define the hull
 */ 
function bruteForceHull(newPoints) {
	var tempPoints = [];
	var lineSegments = [];
	if(newPoints.length == 1){

		tempPoints.push(newPoints[0]);
		return [tempPoints, lineSegments];

	} else if (newPoints.length == 2){
		
		var p1 = newPoints[0];
		var p2 = newPoints[1];

		if(p1.x < p2.x){
			tempPoints.push(p1);
			tempPoints.push(p2);
			lineSegments.push( new LineObj(p1.x, p1.y, p2.x, p2.y));
		} else {
			tempPoints.push(p2);
			tempPoints.push(p1);
			lineSegments.push(new LineObj(p2.x, p2.y, p1.x, p1.y));
		}

		
		return [tempPoints, lineSegments];

	} else {

		for(var i=0; i<newPoints.length; ++i){
			tempPoints.push(newPoints[i]);
		}
		var p1 = newPoints[0];
		var p2 = newPoints[1];
		var p3 = newPoints[2];

		if(isClockwise(p1,p2,p3)){
			tempPoints = newPoints.reverse();
			for(var i=0; i<3; ++i){
				p1 = tempPoints[i];
				p2 = tempPoints[(i+1)%3];
				lineSegments.push(new LineObj(p1.x, p1.y, p2.x, p2.y));

			}
			return [tempPoints,lineSegments];
		} else {
			tempPoints = newPoints;
			for(var i=0; i<3; ++i){
				p1 = tempPoints[i];
				p2 = tempPoints[(i+1)%3];
				lineSegments.push(new LineObj(p1.x, p1.y, p2.x, p2.y));
			}
			return [tempPoints,lineSegments];
		}
	}
}

/*
* Parameters: Array of point objects
* Return: A sorted (by x coord) array of point objects
*/
function sortByX(pointSet) {
	return points.sort(function(a,b){
		return a.x - b.x;
	});
}

/*
* Determine if three points are in clockwise order.
* Parameters: Three point objects
* Return: A boolean (true if the points are in clockwise order, false otherwise)
*/
function isClockwise(p1,p2,p3){
	//this would ordinarily be < 0, however in the p5.js coordinate system y increases when moving downward from the top of the canvas.
	return (p2.x - p1.x)*(p3.y-p1.y) - (p3.x - p1.x)*(p2.y-p1.y) > 0;
}


/*
* Determine if three points are in counterclockwise order.
* Parameters: Three point objects
* Return: A boolean (true if the points are in clockwise order, false otherwise)
*/
function isCounterClockwise(p1,p2,p3){
	// this would ordinarily be > 0, however in the p5.js coordinate system y increases when moving downward from the top of the canvas.
	return (p2.x - p1.x)*(p3.y-p1.y) - (p3.x - p1.x)*(p2.y-p1.y) < 0;
}

/* 
* Parameters: An array of point objects
* Return: The point with the minimum x value from the input
*/
function minXValueIndex(inputPoints){

	var min = Number.MAX_VALUE;
	var index = 0;
	for(var i=0; i<inputPoints.length; ++i){
		if(inputPoints[i].x <= min){
			min = inputPoints[i].x;
			index = i;
		}
	}
	return index;
}

/* 
* Parameters: An array of point objects
* Return: The point with the maximum x value from the input
*/
function maxXValueIndex(inputPoints){
	var max = Number.MIN_VALUE;
	var index = 0;

	for(var i=0; i<inputPoints.length; ++i){
		if(inputPoints[i].x >= max){
			max = inputPoints[i].x;
			index = i;
		}
	}
	return index;
}


/*
* DRAWING FUNCTIONS
*/

/*
* Draw the triangles/lines found in the mergeHull base case.
*/
function drawTriangles(){


	fill(255);
	stroke(255);
	if(triangleLines.length != 0){
		for(var i=0; i<triangleLines.length; ++i){
			line(triangleLines[i].x1, triangleLines[i].y1, triangleLines[i].x2, triangleLines[i].y2);
		}
	}
	stroke(195,7,63);
	fill(195,7,63);
}

/*
* Draw upper / lower tangent lines
*/
function drawTangentLines(){
	fill(0,255,0);
	stroke(0,255,0);
	if(lowerTangentLines.length != 0){
		for(var i=0; i<lowerTangentsToDraw.length; ++i){
				line(lowerTangentLines[lowerTangentsToDraw[i]].x1, lowerTangentLines[lowerTangentsToDraw[i]].y1, lowerTangentLines[lowerTangentsToDraw[i]].x2, lowerTangentLines[lowerTangentsToDraw[i]].y2);
		}
	}

	if(upperTangentLines.length != 0){
		for (var i=0; i<upperTangentsToDraw.length; ++i){
			line(upperTangentLines[upperTangentsToDraw[i]].x1, upperTangentLines[upperTangentsToDraw[i]].y1, upperTangentLines[upperTangentsToDraw[i]].x2, upperTangentLines[upperTangentsToDraw[i]].y2);
		}
	}
	stroke(195,7,63);
	fill(195,7,63);
}

/*
* Determine if a lower tangent is contained (overlapped) by another hull for drawing.
*/
function checkOverlapping(currentLine, compareTo){
	if(currentLine.x1 == compareTo.x1 && currentLine.y1 == compareTo.y1){
		if(currentLine.x2 < compareTo.x2 && currentLine.y2 < compareTo.y2){			
			return true;
		}
	}

	if(currentLine.x1 == compareTo.x1 && currentLine.y1 == compareTo.y1){
		if(currentLine.x2 < compareTo.x2 && currentLine.y2 > compareTo.y2){
			return true;
		}
	}

	if(currentLine.x2 == compareTo.x2 && currentLine.y2 == compareTo.y2){
		if(currentLine.x1 > compareTo.x1 && currentLine.y1 < compareTo.y1){
			return true;
		}
	}

	if(currentLine.x2 == compareTo.x2 && currentLine.y2 == compareTo.y2){
		if(currentLine.x1 > compareTo.x1 && currentLine.y1 > compareTo.y1){
			return true;
		}
	}

	if(currentLine.x2 == compareTo.x2 && currentLine.y2 == compareTo.y2){
		if(currentLine.x1 > compareTo.x2){
			return true;
		}
	}

	if(currentLine.y1 < compareTo.y1 && currentLine.y2 < compareTo.y2){
		if(currentLine.x1 > compareTo.x1 && currentLine.x2 < compareTo.x2){
			return true;
		}
	}

	//danger zone - verify if this is actually true
	if(currentLine.x1 > compareTo.x1 && currentLine.x2 < compareTo.x2){
		return true;
	}
	return false;
}

/*
* Determine if a upper tangent is contained (overlapped) by another hull for drawing.
*/
function checkOverlappingUpper(currentLine, compareTo){
	
	if(currentLine.x1 == compareTo.x1 && currentLine.y1 == compareTo.y1){
		if(currentLine.y2 > compareTo.y2 && currentLine.x2 < compareTo.x2){
			return true;
		}
	}

	if(currentLine.x2 == compareTo.x2 && currentLine.y2 == compareTo.y2){
		if(currentLine.y1 > compareTo.y1 && currentLine.x1 > compareTo.x1){
			return true;
		}
	}

	if(currentLine.y1 > compareTo.y1 && currentLine.y2 > compareTo.y2){
		if(currentLine.x1 > compareTo.x1 && currentLine.x2 < compareTo.x2){
			return true;
		}

	}

	if(currentLine.x1 > compareTo.x1 && currentLine.x2 < compareTo.x2){
		return true;
	}

	if(currentLine.x1 == compareTo.x1 && currentLine.y1 == compareTo.y1){
		if(currentLine.x2 < compareTo.x2){
			return true;
		}
	}
	//FIXME: finish the rest of the cases for this functions.

	// if(currentLine.x2 == compareTo.x2 && currentLine.y2 == compareTo.y2){
	// 	print(currentLine);
	// 	print(compareTo);
	// }
	return false;
	
}


/*
* Draw the temporary lower tangents during the tangent walk.
*/
function drawLowerTempTangents(){

	fill(0,255,0);
	stroke(255,255,0);
	if(allLowerTangentLines.length != 0 && lTIdxDraw > -1){
		if(allLowerTangentLines[lTIdxDraw]){
			line(allLowerTangentLines[lTIdxDraw].x1, allLowerTangentLines[lTIdxDraw].y1, allLowerTangentLines[lTIdxDraw].x2, allLowerTangentLines[lTIdxDraw].y2);
		}		
	}

	var tempLine;
	if(lTIdxDraw > -1){
		for(var i=0; i<lowerTangentLines.length; ++i){
			if(allLowerTangentLines[lTIdxDraw]){
				if(allLowerTangentLines[lTIdxDraw].x1 == lowerTangentLines[i].x1 && allLowerTangentLines[lTIdxDraw].y1 == lowerTangentLines[i].y1
					&&  allLowerTangentLines[lTIdxDraw].x2 == lowerTangentLines[i].x2 && allLowerTangentLines[lTIdxDraw].y2 == lowerTangentLines[i].y2){
					allLowerTangentLines[lTIdxDraw] = new LineObj(0,0,0,0);
					lowerTangentsToDraw.push(i);
					botComplete = true;
					tempLine = lowerTangentLines[i];
				}
			}
		}

		for(var i=0; i<lowerTangentLines.length; ++i){
			if(tempLine){
				if(checkOverlapping(lowerTangentLines[i], tempLine)){
					lowerTangentLines[i] = new LineObj(0,0,0,0);
				}
			}
		}
	}
	stroke(195,7,63);
	fill(195,7,63);
}

/*
* Draw the temporary upper tangents during the tangent walk.
*/
function drawUpperTempTangents(){
	fill(0,255,0);
	stroke(255,150,0);
	if(allUpperTangentLines.length != 0 && uTIdxDraw > -1){
		
		line(allUpperTangentLines[uTIdxDraw].x1, allUpperTangentLines[uTIdxDraw].y1, allUpperTangentLines[uTIdxDraw].x2, allUpperTangentLines[uTIdxDraw].y2);
	}

	var tempLine;
	if(uTIdxDraw > -1){
		for(var i=0; i<upperTangentLines.length; ++i){
			if(allUpperTangentLines[uTIdxDraw].x1 == upperTangentLines[i].x1 && allUpperTangentLines[uTIdxDraw].y1 == upperTangentLines[i].y1
				&&  allUpperTangentLines[uTIdxDraw].x2 == upperTangentLines[i].x2 && allUpperTangentLines[uTIdxDraw].y2 == upperTangentLines[i].y2){

				allUpperTangentLines[uTIdxDraw] = new LineObj(0,0,0,0);
				upperTangentsToDraw.push(i);
				topComplete = true;
				tempLine = upperTangentLines[i];	
			}

		}

		for(var i=0; i<upperTangentLines.length; ++i){
			if(tempLine){
				if(checkOverlappingUpper(upperTangentLines[i], tempLine)){
					upperTangentLines[i] = new LineObj(0,0,0,0);
				}
			}
		}

	}

	stroke(195,7,63);
	fill(195,7,63);

}

/*
* Create line objects for the final hull - the mergehull function returns a list of points that corresponds to the points on the final hull.
*/
function getFinalHullLines(finalPoints){
	var finalHullLines = [];
	for(var i=0; i<finalPoints.length; ++i){
		if((i+1) < finalPoints.length){
			finalHullLines.push(new LineObj(finalPoints[i].x, finalPoints[i].y, finalPoints[i+1].x, finalPoints[i+1].y));
		} else {
			finalHullLines.push(new LineObj(finalPoints[i].x, finalPoints[i].y, finalPoints[0].x, finalPoints[0].y));
		}
		
	}
	return finalHullLines;
}

/*
* Draw the completed convex hull in green.
*/
function drawFinalHull(){
	fill(0,255,0);
	stroke(0,255,0);

	var finalHullLines = getFinalHullLines(finalHull);
	for(var i=0; i<finalHullLines.length; ++i){
		line(finalHullLines[i].x1, finalHullLines[i].y1, finalHullLines[i].x2, finalHullLines[i].y2);
	}
	// just in case some tangent lines weren't properly deleted during the merging process:
	for(var i=0; i<upperTangentLines.length; ++i){
		upperTangentLines[i] = new LineObj(0,0,0,0);
	}
	for(var i=0; i<lowerTangentLines.length; ++i){
		lowerTangentLines[i] = new LineObj(0,0,0,0);
	}

	stroke(195,7,63);
	fill(195,7,63);
}


/*
* UTILITY CLASSES
*/

// lines
class LineObj {
	constructor (x1,y1, x2,y2){
		this.x1 = x1;
		this.y1 = y1;
		this.x2 = x2;
		this.y2 = y2;
	}

	getLength(){
		return Math.sqrt((this.x2-this.x1)^2 + (this.y2-this.y1)^2);
	}

	getSlope(){
		return ((this.y2-this.y1) / (this.x2-this.x1));
	}
}

// points
class Point {
	constructor(x,y) {
		this.x = x;
		this.y = y;
	}
}


