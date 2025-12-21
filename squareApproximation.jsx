/**
 * Square Approximation of Circle
 * Demonstrates how small squares can approximate a circular region
 * As the grid becomes finer, the approximation improves
 * 
 * Usage: Open a composition and run this script
 * Each shape element is created as a separate layer for easy maintenance
 */

(function() {
    app.beginUndoGroup("Square Approximation Demo");

    // ============ Validate Composition ============
    var comp = app.project.activeItem;
    if (!(comp && comp instanceof CompItem)) {
        alert("Please open a composition first.");
        return;
    }

    // ============ Configuration ============
    var config = {
        // Circle settings
        circleRadius: 300,
        circleStrokeColor: [0, 0, 0],
        circleStrokeWidth: 3,
        
        // Grid settings
        gridLevels: [4, 8, 16, 32, 64],  // Different grid densities
        gridColor: [0.7, 0.7, 0.7],
        gridStrokeWidth: 1,
        
        // Filled square settings
        fillColor: [0.4, 0.8, 0.8],  // Cyan/teal color
        fillOpacity: 80,
        
        // Timing (seconds)
        pauseDuration: 1.5,  // Pause after each grid refinement
        transitionDuration: 0.5
    };

    // Composition center for layer positioning
    var compCenterX = comp.width / 2;
    var compCenterY = comp.height / 2;

    // Use (0, 0) as center for shapes within each layer
    var centerX = 0;
    var centerY = 0;

    // Pre-calculate approximation percentages for each grid level
    // Percentage = (filled squares area) / (circle area) * 100
    var circleArea = Math.PI * config.circleRadius * config.circleRadius;
    var approximationData = [];

    // ============ Helper Functions ============
    
    /**
     * Check if a square is completely inside the circle
     * @param {number} squareX - Square center X
     * @param {number} squareY - Square center Y
     * @param {number} squareSize - Size of the square
     * @param {number} radius - Circle radius
     * @returns {boolean}
     */
    function isSquareInsideCircle(squareX, squareY, squareSize, radius) {
        var halfSize = squareSize / 2;
        var corners = [
            [squareX - halfSize, squareY - halfSize],
            [squareX + halfSize, squareY - halfSize],
            [squareX - halfSize, squareY + halfSize],
            [squareX + halfSize, squareY + halfSize]
        ];
        
        for (var i = 0; i < corners.length; i++) {
            var dist = Math.sqrt(corners[i][0] * corners[i][0] + corners[i][1] * corners[i][1]);
            if (dist > radius) {
                return false;
            }
        }
        return true;
    }

    /**
     * Create a new shape layer positioned at composition center
     * @param {string} name - Layer name
     * @returns {ShapeLayer}
     */
    function createCenteredShapeLayer(name) {
        var layer = comp.layers.addShape();
        layer.name = name;
        layer.position.setValue([compCenterX, compCenterY]);
        return layer;
    }

    /**
     * Count squares inside circle and calculate approximation percentage
     * @param {number} gridSize - Number of divisions per side
     * @returns {object} - {count, percentage}
     */
    function calculateApproximation(gridSize) {
        var squareSize = (config.circleRadius * 2) / gridSize;
        var count = 0;
        
        for (var row = 0; row < gridSize; row++) {
            for (var col = 0; col < gridSize; col++) {
                var localX = -config.circleRadius + squareSize * (col + 0.5);
                var localY = -config.circleRadius + squareSize * (row + 0.5);
                
                if (isSquareInsideCircle(localX, localY, squareSize, config.circleRadius)) {
                    count++;
                }
            }
        }
        
        var filledArea = count * squareSize * squareSize;
        var percentage = (filledArea / circleArea) * 100;
        
        return {
            count: count,
            percentage: percentage.toFixed(1)
        };
    }

    /**
     * Create filled squares layer for a given grid level
     * @param {number} gridSize - Number of divisions per side
     * @param {number} startTime - When this layer becomes visible
     * @param {number} endTime - When this layer becomes invisible
     * @returns {ShapeLayer}
     */
    function createFilledSquaresLayer(gridSize, startTime, endTime) {
        var squareSize = (config.circleRadius * 2) / gridSize;
        var layer = createCenteredShapeLayer("Squares " + gridSize + "x" + gridSize);
        
        var contents = layer.property("ADBE Root Vectors Group");
        var shapeGroup = contents.addProperty("ADBE Vector Group");
        shapeGroup.name = "Squares";
        
        var groupContents = shapeGroup.property("ADBE Vectors Group");
        
        // Iterate through grid and add squares that are inside the circle
        for (var row = 0; row < gridSize; row++) {
            for (var col = 0; col < gridSize; col++) {
                var localX = -config.circleRadius + squareSize * (col + 0.5);
                var localY = -config.circleRadius + squareSize * (row + 0.5);
                
                if (isSquareInsideCircle(localX, localY, squareSize, config.circleRadius)) {
                    var rect = groupContents.addProperty("ADBE Vector Shape - Rect");
                    rect.property("ADBE Vector Rect Size").setValue([squareSize - 1, squareSize - 1]);
                    rect.property("ADBE Vector Rect Position").setValue([localX, localY]);
                }
            }
        }
        
        // Add fill
        var fill = groupContents.addProperty("ADBE Vector Graphic - Fill");
        fill.property("ADBE Vector Fill Color").setValue(config.fillColor);
        fill.property("ADBE Vector Fill Opacity").setValue(config.fillOpacity);
        
        // Animate layer opacity for visibility control
        var opacity = layer.property("ADBE Transform Group").property("ADBE Opacity");
        opacity.setValueAtTime(startTime - 0.01, 0);
        opacity.setValueAtTime(startTime, 100);
        opacity.setValueAtTime(endTime - 0.01, 100);
        opacity.setValueAtTime(endTime, 0);
        
        return layer;
    }

    /**
     * Create grid lines layer for a given grid level
     * @param {number} gridSize - Number of divisions per side
     * @param {number} startTime - When this layer becomes visible
     * @param {number} endTime - When this layer becomes invisible
     * @returns {ShapeLayer}
     */
    function createGridLayer(gridSize, startTime, endTime) {
        var squareSize = (config.circleRadius * 2) / gridSize;
        var layer = createCenteredShapeLayer("Grid " + gridSize + "x" + gridSize);
        
        var contents = layer.property("ADBE Root Vectors Group");
        var shapeGroup = contents.addProperty("ADBE Vector Group");
        shapeGroup.name = "Grid Lines";
        
        var groupContents = shapeGroup.property("ADBE Vectors Group");
        
        var gridLeft = -config.circleRadius;
        var gridTop = -config.circleRadius;
        var gridRight = config.circleRadius;
        var gridBottom = config.circleRadius;
        
        // Vertical lines
        for (var i = 0; i <= gridSize; i++) {
            var x = gridLeft + i * squareSize;
            var path = groupContents.addProperty("ADBE Vector Shape - Group");
            var pathData = new Shape();
            pathData.vertices = [[x, gridTop], [x, gridBottom]];
            pathData.closed = false;
            path.property("ADBE Vector Shape").setValue(pathData);
        }
        
        // Horizontal lines
        for (var j = 0; j <= gridSize; j++) {
            var y = gridTop + j * squareSize;
            var path = groupContents.addProperty("ADBE Vector Shape - Group");
            var pathData = new Shape();
            pathData.vertices = [[gridLeft, y], [gridRight, y]];
            pathData.closed = false;
            path.property("ADBE Vector Shape").setValue(pathData);
        }
        
        // Add stroke
        var stroke = groupContents.addProperty("ADBE Vector Graphic - Stroke");
        stroke.property("ADBE Vector Stroke Color").setValue(config.gridColor);
        stroke.property("ADBE Vector Stroke Width").setValue(config.gridStrokeWidth);
        
        // Animate layer opacity for visibility control
        var opacity = layer.property("ADBE Transform Group").property("ADBE Opacity");
        opacity.setValueAtTime(startTime - 0.01, 0);
        opacity.setValueAtTime(startTime, 100);
        opacity.setValueAtTime(endTime - 0.01, 100);
        opacity.setValueAtTime(endTime, 0);
        
        return layer;
    }

    /**
     * Create circle outline layer
     * @returns {ShapeLayer}
     */
    function createCircleLayer() {
        var layer = createCenteredShapeLayer("Circle");
        
        var contents = layer.property("ADBE Root Vectors Group");
        var shapeGroup = contents.addProperty("ADBE Vector Group");
        shapeGroup.name = "Circle";
        
        var groupContents = shapeGroup.property("ADBE Vectors Group");
        
        var ellipse = groupContents.addProperty("ADBE Vector Shape - Ellipse");
        ellipse.property("ADBE Vector Ellipse Size").setValue([
            config.circleRadius * 2,
            config.circleRadius * 2
        ]);
        
        var stroke = groupContents.addProperty("ADBE Vector Graphic - Stroke");
        stroke.property("ADBE Vector Stroke Color").setValue(config.circleStrokeColor);
        stroke.property("ADBE Vector Stroke Width").setValue(config.circleStrokeWidth);
        
        return layer;
    }

    /**
     * Create coordinate axes layer
     * @returns {ShapeLayer}
     */
    function createAxesLayer() {
        var layer = createCenteredShapeLayer("Axes");
        
        var contents = layer.property("ADBE Root Vectors Group");
        var shapeGroup = contents.addProperty("ADBE Vector Group");
        shapeGroup.name = "Axes";
        
        var groupContents = shapeGroup.property("ADBE Vectors Group");
        
        var axisExtend = config.circleRadius + 50;
        
        // X axis
        var xAxis = groupContents.addProperty("ADBE Vector Shape - Group");
        var xPath = new Shape();
        xPath.vertices = [[-axisExtend, 0], [axisExtend, 0]];
        xPath.closed = false;
        xAxis.property("ADBE Vector Shape").setValue(xPath);
        
        // Y axis
        var yAxis = groupContents.addProperty("ADBE Vector Shape - Group");
        var yPath = new Shape();
        yPath.vertices = [[0, -axisExtend], [0, axisExtend]];
        yPath.closed = false;
        yAxis.property("ADBE Vector Shape").setValue(yPath);
        
        // Add stroke
        var stroke = groupContents.addProperty("ADBE Vector Graphic - Stroke");
        stroke.property("ADBE Vector Stroke Color").setValue([0.3, 0.3, 0.3]);
        stroke.property("ADBE Vector Stroke Width").setValue(2);
        
        return layer;
    }

    /**
     * Create origin point marker layer
     * @returns {ShapeLayer}
     */
    function createOriginMarkerLayer() {
        var layer = createCenteredShapeLayer("Origin");
        
        var contents = layer.property("ADBE Root Vectors Group");
        var shapeGroup = contents.addProperty("ADBE Vector Group");
        shapeGroup.name = "Origin Point";
        
        var groupContents = shapeGroup.property("ADBE Vectors Group");
        
        var ellipse = groupContents.addProperty("ADBE Vector Shape - Ellipse");
        ellipse.property("ADBE Vector Ellipse Size").setValue([10, 10]);
        
        var fill = groupContents.addProperty("ADBE Vector Graphic - Fill");
        fill.property("ADBE Vector Fill Color").setValue([0, 0, 0]);
        
        return layer;
    }

    /**
     * Create text layer showing approximation info
     * @param {Array} timingsData - Array of timing and approximation data
     * @returns {TextLayer}
     */
    function createInfoTextLayer(timingsData) {
        var textLayer = comp.layers.addText("");
        textLayer.name = "Info Text";
        
        // Position text below the circle
        textLayer.position.setValue([compCenterX, compCenterY + config.circleRadius + 60]);
        
        // Build expression for dynamic text
        var exprParts = ['var t = time;'];
        
        for (var i = 0; i < timingsData.length; i++) {
            var data = timingsData[i];
            var condition = (i === 0) ? 'if' : 'else if';
            var nextStart = (i < timingsData.length - 1) ? timingsData[i + 1].startTime : 9999;
            
            exprParts.push(
                condition + ' (t >= ' + data.startTime + ' && t < ' + nextStart + ') {'
            );
            exprParts.push(
                '    "' + data.gridSize + '×' + data.gridSize + ' → ' + data.percentage + '%";'
            );
            exprParts.push('}');
        }
        exprParts.push('else { ""; }');
        
        var sourceText = textLayer.property("Source Text");
        sourceText.expression = exprParts.join('\n');
        
        // Style the text
        var textDoc = sourceText.value;
        textDoc.fontSize = 36;
        textDoc.fillColor = [0.2, 0.2, 0.2];
        textDoc.font = "Arial";
        textDoc.justification = ParagraphJustification.CENTER_JUSTIFY;
        sourceText.setValue(textDoc);
        
        return textLayer;
    }

    // ============ Build Animation ============
    
    // Pre-calculate approximation for each grid level
    for (var i = 0; i < config.gridLevels.length; i++) {
        approximationData.push(calculateApproximation(config.gridLevels[i]));
    }
    
    // Calculate timing for each grid level
    var currentTime = 0.5;  // Start after a brief delay
    var timings = [];
    
    for (var i = 0; i < config.gridLevels.length; i++) {
        var startTime = currentTime;
        var displayDuration = config.pauseDuration + config.transitionDuration;
        
        // Last level stays until comp end
        var endTime = (i === config.gridLevels.length - 1) 
            ? comp.duration 
            : currentTime + displayDuration;
        
        timings.push({
            gridSize: config.gridLevels[i],
            startTime: startTime,
            endTime: endTime,
            percentage: approximationData[i].percentage,
            count: approximationData[i].count
        });
        
        currentTime = startTime + config.pauseDuration;
    }

    // Create layers (order matters for layer stacking)
    // Create from top to bottom (first created = top layer in timeline)
    
    // 1. Info text (topmost)
    createInfoTextLayer(timings);
    
    // 2. Origin marker
    createOriginMarkerLayer();
    
    // 3. Circle
    createCircleLayer();
    
    // 4. Grid lines for each level (in reverse order so smaller grids are on top)
    for (var i = timings.length - 1; i >= 0; i--) {
        createGridLayer(
            timings[i].gridSize,
            timings[i].startTime,
            timings[i].endTime
        );
    }
    
    // 5. Filled squares for each level (in reverse order)
    for (var i = timings.length - 1; i >= 0; i--) {
        createFilledSquaresLayer(
            timings[i].gridSize,
            timings[i].startTime,
            timings[i].endTime
        );
    }
    
    // 6. Axes (bottom layer)
    createAxesLayer();

    app.endUndoGroup();
    
    // Build percentage summary
    var percentSummary = [];
    for (var i = 0; i < timings.length; i++) {
        percentSummary.push(timings[i].gridSize + "×" + timings[i].gridSize + ": " + timings[i].percentage + "%");
    }
    
    alert("Square Approximation animation created!\n\n" +
          "Layers created: " + (4 + config.gridLevels.length * 2) + "\n" +
          "Grid levels: " + config.gridLevels.join(" → ") + "\n" +
          "Approximation: \n" + percentSummary.join("\n") + "\n\n" +
          "Each level pauses for " + config.pauseDuration + " seconds.");

})();
