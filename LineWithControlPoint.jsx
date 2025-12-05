/**
 * AE Script: Line with Draggable Control Point (Optimized)
 * 
 * Features:
 * - Grid system: 100x100, centered on screen (1920x1080)
 * - Line equation: 2x - 3y = 0 (y = 2x/3)
 * - Draggable control point that moves along the line
 * - Vertical dashed line from control point to x-axis
 * 
 * Optimized: Only 2 layers (1 Null + 1 Shape Layer with all graphics)
 */

(function() {
    app.beginUndoGroup("Create Line with Control Point");

    // Constants
    var COMP_WIDTH = 1920;
    var COMP_HEIGHT = 1080;
    var GRID_SIZE = 100;
    var CENTER_X = COMP_WIDTH / 2;   // 960
    var CENTER_Y = COMP_HEIGHT / 2;  // 540

    // Create composition
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
        comp = app.project.items.addComp("Line Control Demo", COMP_WIDTH, COMP_HEIGHT, 1, 10, 30);
    }

    // Helper: Grid to Screen coordinates
    function gridToScreen(gridX, gridY) {
        return [CENTER_X + gridX * GRID_SIZE, CENTER_Y - gridY * GRID_SIZE];
    }

    // ========== Layer 1: Control Point (Null) ==========
    var controlNull = comp.layers.addNull();
    controlNull.name = "Control Point";
    var defaultGridPos = [3, 2];
    var defaultScreenPos = gridToScreen(defaultGridPos[0], defaultGridPos[1]);
    controlNull.position.setValue(defaultScreenPos);

    // Add Slider for coefficient k
    // k = gridX / 3, where point is at (3k, 2k) on line 2x - 3y = 0
    var sliderEffect = controlNull.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
    sliderEffect.name = "Coefficient (k)";
    sliderEffect.property("ADBE Slider Control-0001").expression = [
        '// k = gridX / 3, point at (3k, 2k)',
        'var screenX = transform.position[0];',
        'var gridX = (screenX - 960) / 100;',
        'gridX / 3;'
    ].join('\n');

    // Expression to constrain control point to line 2x - 3y = 0
    controlNull.position.expression = [
        '// Line: 2x - 3y = 0, so y = (2/3)x',
        'var pos = value;',
        'var screenX = pos[0];',
        'var gridX = (screenX - 960) / 100;',
        'var gridY = (2/3) * gridX;',
        'var screenY = 540 - gridY * 100;',
        '[screenX, screenY];'
    ].join('\n');

    // ========== Layer 2: All Graphics (Single Shape Layer) ==========
    // Use flat structure: all shapes directly in root contents (like LinearEquationsDemo.jsx)
    var shapeLayer = comp.layers.addShape();
    shapeLayer.name = "Graphics";
    shapeLayer.position.setValue([CENTER_X, CENTER_Y]);
    var contents = shapeLayer.property("ADBE Root Vectors Group");

    // ----- Main Line 2x-3y=0 (blue) -----
    var linePath = contents.addProperty("ADBE Vector Shape - Group");
    linePath.name = "Line 2x-3y=0";
    // Line endpoints: y = (2/3)x, extend to grid x = ±10
    var lineStartScreen = gridToScreen(-10, -20/3);
    var lineEndScreen = gridToScreen(10, 20/3);
    var linePathData = new Shape();
    linePathData.vertices = [
        [lineStartScreen[0] - CENTER_X, lineStartScreen[1] - CENTER_Y],
        [lineEndScreen[0] - CENTER_X, lineEndScreen[1] - CENTER_Y]
    ];
    linePathData.closed = false;
    linePath.property("ADBE Vector Shape").setValue(linePathData);
    var lineStroke = contents.addProperty("ADBE Vector Graphic - Stroke");
    lineStroke.property("ADBE Vector Stroke Color").setValue([0.2, 0.6, 1, 1]);
    lineStroke.property("ADBE Vector Stroke Width").setValue(3);

    // ----- Vertical Dashed Line (orange) -----
    var dashedPath = contents.addProperty("ADBE Vector Shape - Group");
    dashedPath.name = "Vertical Dashed Line";
    dashedPath.property("ADBE Vector Shape").expression = [
        'var ctrl = thisComp.layer("Control Point");',
        'var pos = ctrl.transform.position;',
        'var x = pos[0] - 960;',
        'var y = pos[1] - 540;',
        'createPath([[x, y], [x, 0]], [], [], false);'
    ].join('\n');
    var dashedStroke = contents.addProperty("ADBE Vector Graphic - Stroke");
    dashedStroke.property("ADBE Vector Stroke Color").setValue([1, 0.5, 0, 1]);
    dashedStroke.property("ADBE Vector Stroke Width").setValue(2);
    var dashedStrokeDashes = dashedStroke.property("ADBE Vector Stroke Dashes");
    dashedStrokeDashes.addProperty("ADBE Vector Stroke Dash 1").setValue(10);
    dashedStrokeDashes.addProperty("ADBE Vector Stroke Gap 1").setValue(8);

    // ----- X Axis Point (orange circle) -----
    var xPointGroup = contents.addProperty("ADBE Vector Group");
    xPointGroup.name = "X Axis Point";
    var xPointEllipse = xPointGroup.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Ellipse");
    xPointEllipse.property("ADBE Vector Ellipse Size").setValue([12, 12]);
    var xPointFill = xPointGroup.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Fill");
    xPointFill.property("ADBE Vector Fill Color").setValue([1, 0.5, 0, 1]);
    xPointGroup.property("ADBE Vector Transform Group").property("ADBE Vector Position").expression = [
        'var ctrl = thisComp.layer("Control Point");',
        '[ctrl.transform.position[0] - 960, 0];'
    ].join('\n');

    // ----- Control Point Visual (red circle) -----
    var ctrlPointGroup = contents.addProperty("ADBE Vector Group");
    ctrlPointGroup.name = "Control Point Visual";
    var ctrlPointEllipse = ctrlPointGroup.property("ADBE Vectors Group").addProperty("ADBE Vector Shape - Ellipse");
    ctrlPointEllipse.property("ADBE Vector Ellipse Size").setValue([20, 20]);
    var ctrlPointFill = ctrlPointGroup.property("ADBE Vectors Group").addProperty("ADBE Vector Graphic - Fill");
    ctrlPointFill.property("ADBE Vector Fill Color").setValue([1, 0.3, 0.3, 1]);
    ctrlPointGroup.property("ADBE Vector Transform Group").property("ADBE Vector Position").expression = [
        'var ctrl = thisComp.layer("Control Point");',
        'ctrl.transform.position - [960, 540];'
    ].join('\n');

    // Move control null to top
    controlNull.moveToBeginning();

    app.endUndoGroup();

    alert("Script completed! (Optimized: 2 layers)\n\nDrag 'Control Point' to move along the line.\nVertical dashed line shows projection to x-axis.");
})();
