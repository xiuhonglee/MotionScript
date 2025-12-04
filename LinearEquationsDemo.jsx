/**
 * Linear Equations Demo Script for After Effects
 * 
 * Creates two lines through origin, each controlled by a draggable point.
 * Drag P1 to change Line 1, drag P2 to change Line 2.
 * Lines always pass through origin (0,0) and their control point.
 * 
 * Homogeneous equation form:
 *   Line 1: k1 * x + k2 * y = 0  (where k1 = P1.y, k2 = -P1.x)
 *   Line 2: k3 * x + k4 * y = 0  (where k3 = P2.y, k4 = -P2.x)
 * 
 * Coefficients are stored in "Equation Coefficients" null layer sliders.
 * 
 * Initial Control Points (grid coordinates):
 *   P1 = (3, 2)  -> k1=2, k2=-3
 *   P2 = (-4, 5) -> k3=5, k4=4
 * 
 * Grid: 100x100, centered at screen center (960, 540)
 * Screen: 1920 x 1080
 */

(function() {
    app.beginUndoGroup("Create Linear Equations Demo");
    
    // Constants
    var SCREEN_WIDTH = 1920;
    var SCREEN_HEIGHT = 1080;
    var GRID_SIZE = 100;
    var CENTER_X = SCREEN_WIDTH / 2;  // 960
    var CENTER_Y = SCREEN_HEIGHT / 2; // 540
    
    // Initial control points (grid coordinates)
    var P1 = [3, 2];
    var P2 = [-4, 5];
    
    /**
     * Convert grid coordinate to screen position
     * @param {number} gx - Grid X coordinate
     * @param {number} gy - Grid Y coordinate
     * @returns {Array} Screen position [x, y]
     */
    function gridToScreen(gx, gy) {
        return [CENTER_X + gx * GRID_SIZE, CENTER_Y - gy * GRID_SIZE];
    }
    
    // Get or create composition
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        comp = app.project.items.addComp("Linear Equations", SCREEN_WIDTH, SCREEN_HEIGHT, 1, 10, 30);
    }
    
    // ========== Create Origin Marker ==========
    var origin = comp.layers.addShape();
    origin.name = "Origin";
    origin.position.setValue([CENTER_X, CENTER_Y]);
    
    var originContents = origin.property("ADBE Root Vectors Group");
    var originEllipse = originContents.addProperty("ADBE Vector Shape - Ellipse");
    originEllipse.property("ADBE Vector Ellipse Size").setValue([12, 12]);
    var originFill = originContents.addProperty("ADBE Vector Graphic - Fill");
    originFill.property("ADBE Vector Fill Color").setValue([1, 1, 1, 1]);
    
    // ========== Create Control Point P1 ==========
    var point1 = comp.layers.addShape();
    point1.name = "P1";
    point1.position.setValue(gridToScreen(P1[0], P1[1]));
    
    var p1Contents = point1.property("ADBE Root Vectors Group");
    var p1Ellipse = p1Contents.addProperty("ADBE Vector Shape - Ellipse");
    p1Ellipse.property("ADBE Vector Ellipse Size").setValue([20, 20]);
    var p1Fill = p1Contents.addProperty("ADBE Vector Graphic - Fill");
    p1Fill.property("ADBE Vector Fill Color").setValue([1, 0.3, 0.3, 1]); // Red
    var p1Stroke = p1Contents.addProperty("ADBE Vector Graphic - Stroke");
    p1Stroke.property("ADBE Vector Stroke Color").setValue([1, 1, 1, 1]);
    p1Stroke.property("ADBE Vector Stroke Width").setValue(2);
    
    // ========== Create Control Point P2 ==========
    var point2 = comp.layers.addShape();
    point2.name = "P2";
    point2.position.setValue(gridToScreen(P2[0], P2[1]));
    
    var p2Contents = point2.property("ADBE Root Vectors Group");
    var p2Ellipse = p2Contents.addProperty("ADBE Vector Shape - Ellipse");
    p2Ellipse.property("ADBE Vector Ellipse Size").setValue([20, 20]);
    var p2Fill = p2Contents.addProperty("ADBE Vector Graphic - Fill");
    p2Fill.property("ADBE Vector Fill Color").setValue([0.3, 0.5, 1, 1]); // Blue
    var p2Stroke = p2Contents.addProperty("ADBE Vector Graphic - Stroke");
    p2Stroke.property("ADBE Vector Stroke Color").setValue([1, 1, 1, 1]);
    p2Stroke.property("ADBE Vector Stroke Width").setValue(2);
    
    // ========== Create Coefficient Sliders ==========
    // Equation form: k1*x + k2*y = 0, k3*x + k4*y = 0
    // For point (px, py) on line through origin: py*x - px*y = 0
    // So k1=py, k2=-px for Line 1; k3=py, k4=-px for Line 2
    var coeffNull = comp.layers.addNull();
    coeffNull.name = "Equation Coefficients";
    coeffNull.position.setValue([100, 100]);
    
    var sliderK1 = coeffNull.Effects.addProperty("ADBE Slider Control");
    sliderK1.name = "k1";
    sliderK1.property("Slider").setValue(P1[1]); // P1.y = 2
    
    var sliderK2 = coeffNull.Effects.addProperty("ADBE Slider Control");
    sliderK2.name = "k2";
    sliderK2.property("Slider").setValue(-P1[0]); // -P1.x = -3
    
    var sliderK3 = coeffNull.Effects.addProperty("ADBE Slider Control");
    sliderK3.name = "k3";
    sliderK3.property("Slider").setValue(P2[1]); // P2.y = 5
    
    var sliderK4 = coeffNull.Effects.addProperty("ADBE Slider Control");
    sliderK4.name = "k4";
    sliderK4.property("Slider").setValue(-P2[0]); // -P2.x = 4
    
    // Add expressions to sliders to auto-update from P1/P2 positions
    // Access via effect property chain
    var k1Prop = coeffNull.effect("k1")("Slider");
    var k2Prop = coeffNull.effect("k2")("Slider");
    var k3Prop = coeffNull.effect("k3")("Slider");
    var k4Prop = coeffNull.effect("k4")("Slider");
    
    var k1Expr = [
        'var centerX = ' + CENTER_X + ';',
        'var centerY = ' + CENTER_Y + ';',
        'var gridSize = ' + GRID_SIZE + ';',
        'var p = thisComp.layer("P1").position;',
        'Math.round((centerY - p[1]) / gridSize * 10) / 10;'
    ].join('\n');
    k1Prop.expression = k1Expr;
    
    var k2Expr = [
        'var centerX = ' + CENTER_X + ';',
        'var gridSize = ' + GRID_SIZE + ';',
        'var p = thisComp.layer("P1").position;',
        '-Math.round((p[0] - centerX) / gridSize * 10) / 10;'
    ].join('\n');
    k2Prop.expression = k2Expr;
    
    var k3Expr = [
        'var centerX = ' + CENTER_X + ';',
        'var centerY = ' + CENTER_Y + ';',
        'var gridSize = ' + GRID_SIZE + ';',
        'var p = thisComp.layer("P2").position;',
        'Math.round((centerY - p[1]) / gridSize * 10) / 10;'
    ].join('\n');
    k3Prop.expression = k3Expr;
    
    var k4Expr = [
        'var centerX = ' + CENTER_X + ';',
        'var gridSize = ' + GRID_SIZE + ';',
        'var p = thisComp.layer("P2").position;',
        '-Math.round((p[0] - centerX) / gridSize * 10) / 10;'
    ].join('\n');
    k4Prop.expression = k4Expr;
    
    // ========== Create Line 1 (through Origin and P1) ==========
    var line1 = comp.layers.addShape();
    line1.name = "Line 1";
    line1.position.setValue([CENTER_X, CENTER_Y]);
    
    var line1Contents = line1.property("ADBE Root Vectors Group");
    var line1Path = line1Contents.addProperty("ADBE Vector Shape - Group");
    line1Path.name = "Path 1";
    
    // Expression: line through origin and P1
    var line1Expr = [
        'var centerX = ' + CENTER_X + ';',
        'var centerY = ' + CENTER_Y + ';',
        'var gridSize = ' + GRID_SIZE + ';',
        'var p1Pos = thisComp.layer("P1").position;',
        'var gx = (p1Pos[0] - centerX) / gridSize;',
        'var gy = (centerY - p1Pos[1]) / gridSize;',
        'var k = (gx != 0) ? gy / gx : 1000;',
        'var x1 = -10, x2 = 10;',
        'var y1 = k * x1, y2 = k * x2;',
        'var pt1 = [x1 * gridSize, -y1 * gridSize];',
        'var pt2 = [x2 * gridSize, -y2 * gridSize];',
        'createPath([pt1, pt2], [], [], false);'
    ].join('\n');
    line1Path.property("ADBE Vector Shape").expression = line1Expr;
    
    var line1Stroke = line1Contents.addProperty("ADBE Vector Graphic - Stroke");
    line1Stroke.property("ADBE Vector Stroke Color").setValue([1, 0.3, 0.3, 1]);
    line1Stroke.property("ADBE Vector Stroke Width").setValue(3);
    
    // ========== Create Line 2 (through Origin and P2) ==========
    var line2 = comp.layers.addShape();
    line2.name = "Line 2";
    line2.position.setValue([CENTER_X, CENTER_Y]);
    
    var line2Contents = line2.property("ADBE Root Vectors Group");
    var line2Path = line2Contents.addProperty("ADBE Vector Shape - Group");
    line2Path.name = "Path 1";
    
    // Expression: line through origin and P2
    var line2Expr = [
        'var centerX = ' + CENTER_X + ';',
        'var centerY = ' + CENTER_Y + ';',
        'var gridSize = ' + GRID_SIZE + ';',
        'var p2Pos = thisComp.layer("P2").position;',
        'var gx = (p2Pos[0] - centerX) / gridSize;',
        'var gy = (centerY - p2Pos[1]) / gridSize;',
        'var k = (gx != 0) ? gy / gx : 1000;',
        'var x1 = -10, x2 = 10;',
        'var y1 = k * x1, y2 = k * x2;',
        'var pt1 = [x1 * gridSize, -y1 * gridSize];',
        'var pt2 = [x2 * gridSize, -y2 * gridSize];',
        'createPath([pt1, pt2], [], [], false);'
    ].join('\n');
    line2Path.property("ADBE Vector Shape").expression = line2Expr;
    
    var line2Stroke = line2Contents.addProperty("ADBE Vector Graphic - Stroke");
    line2Stroke.property("ADBE Vector Stroke Color").setValue([0.3, 0.5, 1, 1]);
    line2Stroke.property("ADBE Vector Stroke Width").setValue(3);
    
    // ========== Create P1 Coordinate Label ==========
    var labelP1 = comp.layers.addText("P1(3, 2)");
    labelP1.name = "Label P1";
    
    var labelP1PosExpr = [
        'var p = thisComp.layer("P1").position;',
        '[p[0] + 15, p[1] - 15];'
    ].join('\n');
    labelP1.position.expression = labelP1PosExpr;
    
    var labelP1TextExpr = [
        'var centerX = ' + CENTER_X + ';',
        'var centerY = ' + CENTER_Y + ';',
        'var gridSize = ' + GRID_SIZE + ';',
        'var p = thisComp.layer("P1").position;',
        'var gx = Math.round((p[0] - centerX) / gridSize * 10) / 10;',
        'var gy = Math.round((centerY - p[1]) / gridSize * 10) / 10;',
        '"P1(" + gx + ", " + gy + ")";'
    ].join('\n');
    labelP1.property("Source Text").expression = labelP1TextExpr;
    
    // ========== Create P2 Coordinate Label ==========
    var labelP2 = comp.layers.addText("P2(-4, 5)");
    labelP2.name = "Label P2";
    
    var labelP2PosExpr = [
        'var p = thisComp.layer("P2").position;',
        '[p[0] + 15, p[1] - 15];'
    ].join('\n');
    labelP2.position.expression = labelP2PosExpr;
    
    var labelP2TextExpr = [
        'var centerX = ' + CENTER_X + ';',
        'var centerY = ' + CENTER_Y + ';',
        'var gridSize = ' + GRID_SIZE + ';',
        'var p = thisComp.layer("P2").position;',
        'var gx = Math.round((p[0] - centerX) / gridSize * 10) / 10;',
        'var gy = Math.round((centerY - p[1]) / gridSize * 10) / 10;',
        '"P2(" + gx + ", " + gy + ")";'
    ].join('\n');
    labelP2.property("Source Text").expression = labelP2TextExpr;
    
    // Move lines below points in layer order
    line1.moveAfter(point2);
    line2.moveAfter(line1);
    origin.moveAfter(line2);
    
    app.endUndoGroup();
    
    alert("Linear Equations Demo Created!\n\n" +
          "拖动控制点来调整直线：\n" +
          "  - P1 (红点): 控制 Line 1\n" +
          "  - P2 (蓝点): 控制 Line 2\n\n" +
          "方程形式：k1*x + k2*y = 0\n" +
          "系数存储在 'Equation Coefficients' 图层的 Slider 中：\n" +
          "  - Line 1: k1, k2\n" +
          "  - Line 2: k3, k4\n\n" +
          "初始值：\n" +
          "  P1(3, 2) -> k1=2, k2=-3\n" +
          "  P2(-4, 5) -> k3=5, k4=4");
})();
