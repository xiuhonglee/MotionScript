/**
 * Linear Transform Demo
 * Demonstrates how a linear transformation affects a circular region
 * Left: Original 8x8 grid with circle (R')
 * Right: Transformed grid with ellipse T(R') - animated transformation
 * 
 * Matrix A = [[1.5, 0], [0, 1]] has det(A) = 1.5
 * This stretches horizontally by 1.5x
 */

(function() {
    app.beginUndoGroup("Linear Transform Demo");

    // ============ Validate Composition ============
    var comp = app.project.activeItem;
    if (!(comp && comp instanceof CompItem)) {
        alert("Please open a composition first.");
        return;
    }

    // ============ Configuration ============
    var config = {
        // Circle/grid settings
        circleRadius: 150,
        gridSize: 8,
        
        // Colors
        // #2196f3 = [33, 150, 243] -> [0.129, 0.588, 0.953]
        // #ff8200 = [255, 130, 0] -> [1, 0.51, 0]
        leftCircleColor: [0.129, 0.588, 0.953],   // #2196f3 blue
        rightCircleStartColor: [0.129, 0.588, 0.953], // #2196f3 blue (before transform)
        rightCircleEndColor: [1, 0.51, 0],        // #ff8200 orange (after transform)
        circleStrokeWidth: 3,
        gridColor: [0.7, 0.7, 0.7],
        gridStrokeWidth: 1,
        fillColor: [0.4, 0.8, 0.8],
        fillOpacity: 80,
        axesColor: [0.3, 0.3, 0.3],
        axesStrokeWidth: 2,
        textColor: [1, 1, 1],  // White text
        
        // Transformation matrix A = [[a, b], [c, d]]
        // det(A) = ad - bc = 1.5
        // Matrix with both x and y transformation + shear
        // A = [[1.2, 0.3], [0.2, 1.35]] => det = 1.2*1.35 - 0.3*0.2 = 1.62 - 0.06 = 1.56 ≈ 1.5
        matrix: {
            a: 1.2,
            b: 0.3,
            c: 0.2,
            d: 1.35
        },
        
        // Layout
        leftCenterX: null,   // Will be calculated
        rightCenterX: null,  // Will be calculated
        centerY: null,       // Will be calculated
        
        // Animation timing
        transformStartTime: 1.0,
        transformDuration: 2.0
    };

    // Calculate layout positions
    config.leftCenterX = comp.width * 0.25;
    config.rightCenterX = comp.width * 0.75;
    config.centerY = comp.height / 2;

    // ============ Helper Functions ============
    
    /**
     * Check if a square is completely inside the circle
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
     * Apply matrix transformation to a point
     * Note: AE uses screen coordinates (y increases downward)
     * Math coordinates have y increasing upward
     * We flip y before and after transformation to match math convention
     * 
     * Math: [x', y'] = A * [x, y]
     * AE:   [x', -y'] = A * [x, -y]  (flip y to math, transform, flip back)
     */
    function transformPoint(x, y, matrix) {
        // Flip y to math coordinates (up is positive)
        var mathY = -y;
        // Apply matrix transformation
        var newX = matrix.a * x + matrix.b * mathY;
        var newY = matrix.c * x + matrix.d * mathY;
        // Flip y back to AE coordinates (down is positive)
        return [newX, -newY];
    }

    /**
     * Create shape layer at specified position
     */
    function createShapeLayer(name, posX, posY) {
        var layer = comp.layers.addShape();
        layer.name = name;
        layer.position.setValue([posX, posY]);
        return layer;
    }

    // ============ Left Side (Original) ============

    /**
     * Create left axes layer
     */
    function createLeftAxes() {
        var layer = createShapeLayer("Left Axes", config.leftCenterX, config.centerY);
        var contents = layer.property("ADBE Root Vectors Group");
        var shapeGroup = contents.addProperty("ADBE Vector Group");
        shapeGroup.name = "Axes";
        var groupContents = shapeGroup.property("ADBE Vectors Group");
        
        var axisExtend = config.circleRadius + 30;
        
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
        
        var stroke = groupContents.addProperty("ADBE Vector Graphic - Stroke");
        stroke.property("ADBE Vector Stroke Color").setValue(config.axesColor);
        stroke.property("ADBE Vector Stroke Width").setValue(config.axesStrokeWidth);
        
        return layer;
    }

    /**
     * Create left grid layer
     */
    function createLeftGrid() {
        var layer = createShapeLayer("Left Grid", config.leftCenterX, config.centerY);
        var contents = layer.property("ADBE Root Vectors Group");
        var shapeGroup = contents.addProperty("ADBE Vector Group");
        shapeGroup.name = "Grid";
        var groupContents = shapeGroup.property("ADBE Vectors Group");
        
        var squareSize = (config.circleRadius * 2) / config.gridSize;
        var gridLeft = -config.circleRadius;
        var gridTop = -config.circleRadius;
        var gridRight = config.circleRadius;
        var gridBottom = config.circleRadius;
        
        // Vertical lines
        for (var i = 0; i <= config.gridSize; i++) {
            var x = gridLeft + i * squareSize;
            var path = groupContents.addProperty("ADBE Vector Shape - Group");
            var pathData = new Shape();
            pathData.vertices = [[x, gridTop], [x, gridBottom]];
            pathData.closed = false;
            path.property("ADBE Vector Shape").setValue(pathData);
        }
        
        // Horizontal lines
        for (var j = 0; j <= config.gridSize; j++) {
            var y = gridTop + j * squareSize;
            var path = groupContents.addProperty("ADBE Vector Shape - Group");
            var pathData = new Shape();
            pathData.vertices = [[gridLeft, y], [gridRight, y]];
            pathData.closed = false;
            path.property("ADBE Vector Shape").setValue(pathData);
        }
        
        var stroke = groupContents.addProperty("ADBE Vector Graphic - Stroke");
        stroke.property("ADBE Vector Stroke Color").setValue(config.gridColor);
        stroke.property("ADBE Vector Stroke Width").setValue(config.gridStrokeWidth);
        
        return layer;
    }

    /**
     * Create left filled squares layer
     */
    function createLeftSquares() {
        var layer = createShapeLayer("Left Squares", config.leftCenterX, config.centerY);
        var contents = layer.property("ADBE Root Vectors Group");
        var shapeGroup = contents.addProperty("ADBE Vector Group");
        shapeGroup.name = "Squares";
        var groupContents = shapeGroup.property("ADBE Vectors Group");
        
        var squareSize = (config.circleRadius * 2) / config.gridSize;
        
        for (var row = 0; row < config.gridSize; row++) {
            for (var col = 0; col < config.gridSize; col++) {
                var localX = -config.circleRadius + squareSize * (col + 0.5);
                var localY = -config.circleRadius + squareSize * (row + 0.5);
                
                if (isSquareInsideCircle(localX, localY, squareSize, config.circleRadius)) {
                    var rect = groupContents.addProperty("ADBE Vector Shape - Rect");
                    rect.property("ADBE Vector Rect Size").setValue([squareSize - 1, squareSize - 1]);
                    rect.property("ADBE Vector Rect Position").setValue([localX, localY]);
                }
            }
        }
        
        var fill = groupContents.addProperty("ADBE Vector Graphic - Fill");
        fill.property("ADBE Vector Fill Color").setValue(config.fillColor);
        fill.property("ADBE Vector Fill Opacity").setValue(config.fillOpacity);
        
        return layer;
    }

    /**
     * Create left circle layer
     */
    function createLeftCircle() {
        var layer = createShapeLayer("Left Circle", config.leftCenterX, config.centerY);
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
        stroke.property("ADBE Vector Stroke Color").setValue(config.leftCircleColor);
        stroke.property("ADBE Vector Stroke Width").setValue(config.circleStrokeWidth);
        
        return layer;
    }

    /**
     * Create left origin marker
     */
    function createLeftOrigin() {
        var layer = createShapeLayer("Left Origin", config.leftCenterX, config.centerY);
        var contents = layer.property("ADBE Root Vectors Group");
        var shapeGroup = contents.addProperty("ADBE Vector Group");
        shapeGroup.name = "Origin";
        var groupContents = shapeGroup.property("ADBE Vectors Group");
        
        var ellipse = groupContents.addProperty("ADBE Vector Shape - Ellipse");
        ellipse.property("ADBE Vector Ellipse Size").setValue([8, 8]);
        
        var fill = groupContents.addProperty("ADBE Vector Graphic - Fill");
        fill.property("ADBE Vector Fill Color").setValue([0, 0, 0]);
        
        return layer;
    }

    // ============ Right Side (Transformed with Animation) ============

    /**
     * Create right axes layer with transformation animation
     * Shows how basis vectors e1 and e2 are transformed
     */
    function createRightAxes() {
        var layer = createShapeLayer("Right Axes", config.rightCenterX, config.centerY);
        var contents = layer.property("ADBE Root Vectors Group");
        var shapeGroup = contents.addProperty("ADBE Vector Group");
        shapeGroup.name = "Axes";
        var groupContents = shapeGroup.property("ADBE Vectors Group");
        
        var axisExtend = config.circleRadius + 30;
        
        // X axis - animate from original to transformed (shows where e1 goes)
        var xAxis = groupContents.addProperty("ADBE Vector Shape - Group");
        var xAxisPath = xAxis.property("ADBE Vector Shape");
        
        var xPathStart = new Shape();
        xPathStart.vertices = [[-axisExtend, 0], [axisExtend, 0]];
        xPathStart.closed = false;
        
        // Transform x-axis endpoints
        var txLeft = transformPoint(-axisExtend, 0, config.matrix);
        var txRight = transformPoint(axisExtend, 0, config.matrix);
        
        var xPathEnd = new Shape();
        xPathEnd.vertices = [txLeft, txRight];
        xPathEnd.closed = false;
        
        xAxisPath.setValueAtTime(0, xPathStart);
        xAxisPath.setValueAtTime(config.transformStartTime, xPathStart);
        xAxisPath.setValueAtTime(config.transformStartTime + config.transformDuration, xPathEnd);
        
        // Y axis - animate from original to transformed (shows where e2 goes)
        var yAxis = groupContents.addProperty("ADBE Vector Shape - Group");
        var yAxisPath = yAxis.property("ADBE Vector Shape");
        
        var yPathStart = new Shape();
        yPathStart.vertices = [[0, -axisExtend], [0, axisExtend]];
        yPathStart.closed = false;
        
        // Transform y-axis endpoints
        var tyTop = transformPoint(0, -axisExtend, config.matrix);
        var tyBottom = transformPoint(0, axisExtend, config.matrix);
        
        var yPathEnd = new Shape();
        yPathEnd.vertices = [tyTop, tyBottom];
        yPathEnd.closed = false;
        
        yAxisPath.setValueAtTime(0, yPathStart);
        yAxisPath.setValueAtTime(config.transformStartTime, yPathStart);
        yAxisPath.setValueAtTime(config.transformStartTime + config.transformDuration, yPathEnd);
        
        var stroke = groupContents.addProperty("ADBE Vector Graphic - Stroke");
        stroke.property("ADBE Vector Stroke Color").setValue(config.axesColor);
        stroke.property("ADBE Vector Stroke Width").setValue(config.axesStrokeWidth);
        
        return layer;
    }

    /**
     * Create right grid layer with transformation animation
     */
    function createRightGrid() {
        var layer = createShapeLayer("Right Grid", config.rightCenterX, config.centerY);
        var contents = layer.property("ADBE Root Vectors Group");
        var shapeGroup = contents.addProperty("ADBE Vector Group");
        shapeGroup.name = "Grid";
        var groupContents = shapeGroup.property("ADBE Vectors Group");
        
        var squareSize = (config.circleRadius * 2) / config.gridSize;
        var gridLeft = -config.circleRadius;
        var gridTop = -config.circleRadius;
        var gridRight = config.circleRadius;
        var gridBottom = config.circleRadius;
        
        // Vertical lines - each line transforms from (x, y) to T(x, y)
        for (var i = 0; i <= config.gridSize; i++) {
            var x = gridLeft + i * squareSize;
            
            var path = groupContents.addProperty("ADBE Vector Shape - Group");
            var pathProp = path.property("ADBE Vector Shape");
            
            var startPath = new Shape();
            startPath.vertices = [[x, gridTop], [x, gridBottom]];
            startPath.closed = false;
            
            // Transform both endpoints of the vertical line
            var tTop = transformPoint(x, gridTop, config.matrix);
            var tBottom = transformPoint(x, gridBottom, config.matrix);
            
            var endPath = new Shape();
            endPath.vertices = [tTop, tBottom];
            endPath.closed = false;
            
            pathProp.setValueAtTime(0, startPath);
            pathProp.setValueAtTime(config.transformStartTime, startPath);
            pathProp.setValueAtTime(config.transformStartTime + config.transformDuration, endPath);
        }
        
        // Horizontal lines - each line transforms from (x, y) to T(x, y)
        for (var j = 0; j <= config.gridSize; j++) {
            var y = gridTop + j * squareSize;
            
            var path = groupContents.addProperty("ADBE Vector Shape - Group");
            var pathProp = path.property("ADBE Vector Shape");
            
            var startPath = new Shape();
            startPath.vertices = [[gridLeft, y], [gridRight, y]];
            startPath.closed = false;
            
            // Transform both endpoints of the horizontal line
            var tLeft = transformPoint(gridLeft, y, config.matrix);
            var tRight = transformPoint(gridRight, y, config.matrix);
            
            var endPath = new Shape();
            endPath.vertices = [tLeft, tRight];
            endPath.closed = false;
            
            pathProp.setValueAtTime(0, startPath);
            pathProp.setValueAtTime(config.transformStartTime, startPath);
            pathProp.setValueAtTime(config.transformStartTime + config.transformDuration, endPath);
        }
        
        var stroke = groupContents.addProperty("ADBE Vector Graphic - Stroke");
        stroke.property("ADBE Vector Stroke Color").setValue(config.gridColor);
        stroke.property("ADBE Vector Stroke Width").setValue(config.gridStrokeWidth);
        
        return layer;
    }

    /**
     * Create right filled parallelograms layer with transformation animation
     */
    function createRightSquares() {
        var layer = createShapeLayer("Right Squares", config.rightCenterX, config.centerY);
        var contents = layer.property("ADBE Root Vectors Group");
        var shapeGroup = contents.addProperty("ADBE Vector Group");
        shapeGroup.name = "Parallelograms";
        var groupContents = shapeGroup.property("ADBE Vectors Group");
        
        var squareSize = (config.circleRadius * 2) / config.gridSize;
        var halfSize = squareSize / 2;
        
        for (var row = 0; row < config.gridSize; row++) {
            for (var col = 0; col < config.gridSize; col++) {
                var localX = -config.circleRadius + squareSize * (col + 0.5);
                var localY = -config.circleRadius + squareSize * (row + 0.5);
                
                if (isSquareInsideCircle(localX, localY, squareSize, config.circleRadius)) {
                    // Create path for square -> parallelogram animation
                    var path = groupContents.addProperty("ADBE Vector Shape - Group");
                    var pathProp = path.property("ADBE Vector Shape");
                    
                    // Original square vertices (slightly smaller for gap)
                    var hs = (squareSize - 1) / 2;
                    var v1 = [localX - hs, localY - hs];
                    var v2 = [localX + hs, localY - hs];
                    var v3 = [localX + hs, localY + hs];
                    var v4 = [localX - hs, localY + hs];
                    
                    var startPath = new Shape();
                    startPath.vertices = [v1, v2, v3, v4];
                    startPath.closed = true;
                    
                    // Transformed parallelogram vertices
                    var tv1 = transformPoint(v1[0], v1[1], config.matrix);
                    var tv2 = transformPoint(v2[0], v2[1], config.matrix);
                    var tv3 = transformPoint(v3[0], v3[1], config.matrix);
                    var tv4 = transformPoint(v4[0], v4[1], config.matrix);
                    
                    var endPath = new Shape();
                    endPath.vertices = [tv1, tv2, tv3, tv4];
                    endPath.closed = true;
                    
                    pathProp.setValueAtTime(0, startPath);
                    pathProp.setValueAtTime(config.transformStartTime, startPath);
                    pathProp.setValueAtTime(config.transformStartTime + config.transformDuration, endPath);
                }
            }
        }
        
        var fill = groupContents.addProperty("ADBE Vector Graphic - Fill");
        fill.property("ADBE Vector Fill Color").setValue(config.fillColor);
        fill.property("ADBE Vector Fill Opacity").setValue(config.fillOpacity);
        
        return layer;
    }

    /**
     * Create right ellipse layer with transformation animation
     * Uses path with bezier curves to represent transformed circle (tilted ellipse)
     */
    function createRightCircle() {
        var layer = createShapeLayer("Right Ellipse", config.rightCenterX, config.centerY);
        var contents = layer.property("ADBE Root Vectors Group");
        var shapeGroup = contents.addProperty("ADBE Vector Group");
        shapeGroup.name = "Ellipse";
        var groupContents = shapeGroup.property("ADBE Vectors Group");
        
        // Create circle/ellipse using bezier path for accurate transformation
        // Use 4 points with bezier handles to approximate circle
        var r = config.circleRadius;
        var k = 0.5522847498; // Bezier approximation constant for circle
        
        var path = groupContents.addProperty("ADBE Vector Shape - Group");
        var pathProp = path.property("ADBE Vector Shape");
        
        // Original circle vertices (4 cardinal points)
        var circleVerts = [
            [r, 0],      // right
            [0, r],      // bottom
            [-r, 0],     // left
            [0, -r]      // top
        ];
        
        // Bezier handles for circle
        var circleInTangents = [
            [0, -r * k],
            [r * k, 0],
            [0, r * k],
            [-r * k, 0]
        ];
        var circleOutTangents = [
            [0, r * k],
            [-r * k, 0],
            [0, -r * k],
            [r * k, 0]
        ];
        
        var startPath = new Shape();
        startPath.vertices = circleVerts;
        startPath.inTangents = circleInTangents;
        startPath.outTangents = circleOutTangents;
        startPath.closed = true;
        
        // Transform all vertices and tangents
        var transformedVerts = [];
        var transformedInTangents = [];
        var transformedOutTangents = [];
        
        for (var i = 0; i < circleVerts.length; i++) {
            transformedVerts.push(transformPoint(circleVerts[i][0], circleVerts[i][1], config.matrix));
            transformedInTangents.push(transformPoint(circleInTangents[i][0], circleInTangents[i][1], config.matrix));
            transformedOutTangents.push(transformPoint(circleOutTangents[i][0], circleOutTangents[i][1], config.matrix));
        }
        
        var endPath = new Shape();
        endPath.vertices = transformedVerts;
        endPath.inTangents = transformedInTangents;
        endPath.outTangents = transformedOutTangents;
        endPath.closed = true;
        
        pathProp.setValueAtTime(0, startPath);
        pathProp.setValueAtTime(config.transformStartTime, startPath);
        pathProp.setValueAtTime(config.transformStartTime + config.transformDuration, endPath);
        
        var stroke = groupContents.addProperty("ADBE Vector Graphic - Stroke");
        var strokeColor = stroke.property("ADBE Vector Stroke Color");
        // Animate color from blue to orange during transformation
        strokeColor.setValueAtTime(0, config.rightCircleStartColor);
        strokeColor.setValueAtTime(config.transformStartTime, config.rightCircleStartColor);
        strokeColor.setValueAtTime(config.transformStartTime + config.transformDuration, config.rightCircleEndColor);
        stroke.property("ADBE Vector Stroke Width").setValue(config.circleStrokeWidth);
        
        return layer;
    }

    /**
     * Create right origin marker
     */
    function createRightOrigin() {
        var layer = createShapeLayer("Right Origin", config.rightCenterX, config.centerY);
        var contents = layer.property("ADBE Root Vectors Group");
        var shapeGroup = contents.addProperty("ADBE Vector Group");
        shapeGroup.name = "Origin";
        var groupContents = shapeGroup.property("ADBE Vectors Group");
        
        var ellipse = groupContents.addProperty("ADBE Vector Shape - Ellipse");
        ellipse.property("ADBE Vector Ellipse Size").setValue([8, 8]);
        
        var fill = groupContents.addProperty("ADBE Vector Graphic - Fill");
        fill.property("ADBE Vector Fill Color").setValue([0, 0, 0]);
        
        return layer;
    }

    /**
     * Create left R text label (static)
     */
    function createLeftText() {
        var textLayer = comp.layers.addText("R");
        textLayer.name = "Left Text R";
        textLayer.position.setValue([config.leftCenterX, config.centerY]);
        
        // Style the text
        var sourceText = textLayer.property("Source Text");
        var textDoc = sourceText.value;
        textDoc.fontSize = 48;
        textDoc.fillColor = config.textColor;
        textDoc.font = "Arial";
        textDoc.justification = ParagraphJustification.CENTER_JUSTIFY;
        sourceText.setValue(textDoc);
        
        // Center anchor point
        textLayer.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([0, 0]);
        
        return textLayer;
    }

    /**
     * Create right side text labels with opacity transition
     * R fades out, T(R) fades in during transformation
     */
    function createRightText() {
        // Create R text (fades out)
        var rLayer = comp.layers.addText("R");
        rLayer.name = "Right Text R";
        rLayer.position.setValue([config.rightCenterX, config.centerY]);
        
        var rSourceText = rLayer.property("Source Text");
        var rTextDoc = rSourceText.value;
        rTextDoc.fontSize = 48;
        rTextDoc.fillColor = config.textColor;
        rTextDoc.font = "Arial";
        rTextDoc.justification = ParagraphJustification.CENTER_JUSTIFY;
        rSourceText.setValue(rTextDoc);
        
        // Animate R opacity: 100 -> 0
        var rOpacity = rLayer.property("ADBE Transform Group").property("ADBE Opacity");
        rOpacity.setValueAtTime(0, 100);
        rOpacity.setValueAtTime(config.transformStartTime, 100);
        rOpacity.setValueAtTime(config.transformStartTime + config.transformDuration, 0);
        
        // Create T(R) text (fades in)
        var trLayer = comp.layers.addText("T(R)");
        trLayer.name = "Right Text T(R)";
        trLayer.position.setValue([config.rightCenterX, config.centerY]);
        
        var trSourceText = trLayer.property("Source Text");
        var trTextDoc = trSourceText.value;
        trTextDoc.fontSize = 48;
        trTextDoc.fillColor = config.textColor;
        trTextDoc.font = "Arial";
        trTextDoc.justification = ParagraphJustification.CENTER_JUSTIFY;
        trSourceText.setValue(trTextDoc);
        
        // Animate T(R) opacity: 0 -> 100
        var trOpacity = trLayer.property("ADBE Transform Group").property("ADBE Opacity");
        trOpacity.setValueAtTime(0, 0);
        trOpacity.setValueAtTime(config.transformStartTime, 0);
        trOpacity.setValueAtTime(config.transformStartTime + config.transformDuration, 100);
        
        return [rLayer, trLayer];
    }

    // ============ Build Animation ============
    
    // Layer label colors (1-16 in AE)
    // 9 = Blue, 14 = Cyan/Teal, 10 = Green, 15 = Pink/Magenta
    var leftLabelColor = 9;   // Blue for left side (original)
    var rightLabelColor = 14; // Cyan for right side (transformed)
    
    // Create left side layers (static, original)
    var layer;
    layer = createLeftText();
    layer.label = leftLabelColor;
    layer = createLeftOrigin();
    layer.label = leftLabelColor;
    layer = createLeftCircle();
    layer.label = leftLabelColor;
    layer = createLeftGrid();
    layer.label = leftLabelColor;
    layer = createLeftSquares();
    layer.label = leftLabelColor;
    layer = createLeftAxes();
    layer.label = leftLabelColor;
    
    // Create right side layers (animated transformation)
    var rightTextLayers = createRightText();
    rightTextLayers[0].label = rightLabelColor;  // R text
    rightTextLayers[1].label = rightLabelColor;  // T(R) text
    layer = createRightOrigin();
    layer.label = rightLabelColor;
    layer = createRightCircle();
    layer.label = rightLabelColor;
    layer = createRightGrid();
    layer.label = rightLabelColor;
    layer = createRightSquares();
    layer.label = rightLabelColor;
    layer = createRightAxes();
    layer.label = rightLabelColor;

    app.endUndoGroup();
    
    var det = config.matrix.a * config.matrix.d - config.matrix.b * config.matrix.c;
    alert("Linear Transform Demo created!\n\n" +
          "Matrix A = [[" + config.matrix.a + ", " + config.matrix.b + "], [" + config.matrix.c + ", " + config.matrix.d + "]]\n" +
          "det(A) = " + det + "\n\n" +
          "Left: Original R' (8×8 grid)\n" +
          "Right: Transformed T(R') with animation\n\n" +
          "Transform starts at " + config.transformStartTime + "s\n" +
          "Duration: " + config.transformDuration + "s");

})();
