/**
 * VectorArrow.jsx
 * Creates a controllable vector arrow in After Effects.
 * @version 1.1
 */

(function() {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Please select a composition first.");
        return;
    }

    app.beginUndoGroup("Create Vector Arrow");

    try {
        // Grid settings: 100px per unit, origin at screen center
        // AE Y-axis points down, so vector (3, 2) means:
        // endX = centerX + 3 * 100 = 960 + 300 = 1260
        // endY = centerY - 2 * 100 = 540 - 200 = 340 (Y is inverted)
        var vectorX = 3;
        var vectorY = 2;
        var gridSize = 100;
        
        var startX = comp.width / 2;   // 960
        var startY = comp.height / 2;  // 540
        var endX = startX + vectorX * gridSize;      // 1260
        var endY = startY - vectorY * gridSize;      // 340 (subtract because Y is down in AE)

        // Create Control Layer
        var controlLayer = comp.layers.addNull();
        controlLayer.name = "Arrow Control";
        controlLayer.label = 9;
        // Set position to [0,0] so Point Control values equal screen coordinates
        controlLayer.property("ADBE Transform Group").property("ADBE Position").setValue([0, 0]);
        
        var effectsGroup = controlLayer.property("ADBE Effect Parade");
        
        var startPointCtrl = effectsGroup.addProperty("ADBE Point Control");
        startPointCtrl.name = "Start Point";
        startPointCtrl.property("ADBE Point Control-0001").setValue([startX, startY]);
        
        var endPointCtrl = effectsGroup.addProperty("ADBE Point Control");
        endPointCtrl.name = "End Point";
        endPointCtrl.property("ADBE Point Control-0001").setValue([endX, endY]);
        
        var arrowLengthCtrl = effectsGroup.addProperty("ADBE Slider Control");
        arrowLengthCtrl.name = "Arrow Head Length";
        arrowLengthCtrl.property("ADBE Slider Control-0001").setValue(20);
        
        var arrowWidthCtrl = effectsGroup.addProperty("ADBE Slider Control");
        arrowWidthCtrl.name = "Arrow Head Width";
        arrowWidthCtrl.property("ADBE Slider Control-0001").setValue(15);
        
        var shaftThicknessCtrl = effectsGroup.addProperty("ADBE Slider Control");
        shaftThicknessCtrl.name = "Shaft Thickness";
        shaftThicknessCtrl.property("ADBE Slider Control-0001").setValue(4);
        
        var colorCtrl = effectsGroup.addProperty("ADBE Color Control");
        colorCtrl.name = "Arrow Color";
        colorCtrl.property("ADBE Color Control-0001").setValue([1, 0.3, 0.3, 1]);
        
        var taperStartCtrl = effectsGroup.addProperty("ADBE Slider Control");
        taperStartCtrl.name = "Taper Start Length";
        taperStartCtrl.property("ADBE Slider Control-0001").setValue(0);
        
        var trimCtrl = effectsGroup.addProperty("ADBE Slider Control");
        trimCtrl.name = "Trim Progress (0-200%)";
        trimCtrl.property("ADBE Slider Control-0001").setValue(100);

        // Create Arrow Shaft
        var shaftLayer = comp.layers.addShape();
        shaftLayer.name = "Arrow Shaft";
        shaftLayer.label = 1;
        // Set anchor and position to [0,0] so fromComp works correctly
        shaftLayer.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([0, 0]);
        shaftLayer.property("ADBE Transform Group").property("ADBE Position").setValue([0, 0]);
        
        var shaftContents = shaftLayer.property("ADBE Root Vectors Group");
        var shaftGroup = shaftContents.addProperty("ADBE Vector Group");
        shaftGroup.name = "Shaft Group";
        var shaftGroupContents = shaftGroup.property("ADBE Vectors Group");
        
        var shaftPath = shaftGroupContents.addProperty("ADBE Vector Shape - Group");
        shaftPath.name = "Shaft Path";
        
        var shaftPathExpr = '';
        shaftPathExpr += 'var ctrl = thisComp.layer("Arrow Control");\n';
        shaftPathExpr += 'var startPt = ctrl.effect("Start Point")("Point");\n';
        shaftPathExpr += 'var endPt = ctrl.effect("End Point")("Point");\n';
        shaftPathExpr += 'var arrowLen = ctrl.effect("Arrow Head Length")("Slider");\n';
        shaftPathExpr += 'var progress = ctrl.effect("Trim Progress (0-200%)")("Slider");\n';
        shaftPathExpr += '\n';
        shaftPathExpr += 'var dir = endPt - startPt;\n';
        shaftPathExpr += 'var totalLen = length(dir);\n';
        shaftPathExpr += 'if (totalLen == 0) totalLen = 0.001;\n';
        shaftPathExpr += 'var normDir = dir / totalLen;\n';
        shaftPathExpr += '\n';
        shaftPathExpr += 'var currentTip;\n';
        shaftPathExpr += 'if (progress <= 100) {\n';
        shaftPathExpr += '    currentTip = startPt + normDir * (progress / 100) * totalLen;\n';
        shaftPathExpr += '} else {\n';
        shaftPathExpr += '    currentTip = endPt;\n';
        shaftPathExpr += '}\n';
        shaftPathExpr += '\n';
        shaftPathExpr += 'var currentLen = length(currentTip - startPt);\n';
        shaftPathExpr += 'var shaftEndLen = Math.max(0, currentLen - arrowLen);\n';
        shaftPathExpr += 'var shaftEnd = startPt + normDir * shaftEndLen;\n';
        shaftPathExpr += '\n';
        shaftPathExpr += 'var p1 = startPt;\n';
        shaftPathExpr += 'var p2 = shaftEnd;\n';
        shaftPathExpr += 'createPath([p1, p2], [], [], false);';
        
        shaftPath.property("ADBE Vector Shape").expression = shaftPathExpr;
        
        var shaftStroke = shaftGroupContents.addProperty("ADBE Vector Graphic - Stroke");
        shaftStroke.property("ADBE Vector Stroke Color").expression = 'thisComp.layer("Arrow Control").effect("Arrow Color")("Color")';
        shaftStroke.property("ADBE Vector Stroke Width").expression = 'thisComp.layer("Arrow Control").effect("Shaft Thickness")("Slider")';
        shaftStroke.property("ADBE Vector Stroke Line Cap").setValue(2);
        
        try {
            var taperStartLen = shaftStroke.property("Taper").property("Start Length");
            if (taperStartLen) {
                taperStartLen.expression = 'thisComp.layer("Arrow Control").effect("Taper Start Length")("Slider")';
            }
        } catch (taperErr) {}
        
        var shaftTrim = shaftContents.addProperty("ADBE Vector Filter - Trim");
        shaftTrim.name = "Trim Paths";
        
        var shaftTrimStartExpr = '';
        shaftTrimStartExpr += 'var progress = thisComp.layer("Arrow Control").effect("Trim Progress (0-200%)")("Slider");\n';
        shaftTrimStartExpr += 'if (progress <= 100) {\n';
        shaftTrimStartExpr += '    0;\n';
        shaftTrimStartExpr += '} else {\n';
        shaftTrimStartExpr += '    (progress - 100);\n';
        shaftTrimStartExpr += '}';
        shaftTrim.property("ADBE Vector Trim Start").expression = shaftTrimStartExpr;
        shaftTrim.property("ADBE Vector Trim End").setValue(100);

        // Create Arrow Head
        var arrowLayer = comp.layers.addShape();
        arrowLayer.name = "Arrow Head";
        arrowLayer.label = 1;
        // Set anchor and position to [0,0] so fromComp works correctly
        arrowLayer.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([0, 0]);
        arrowLayer.property("ADBE Transform Group").property("ADBE Position").setValue([0, 0]);
        
        var arrowContents = arrowLayer.property("ADBE Root Vectors Group");
        var arrowGroup = arrowContents.addProperty("ADBE Vector Group");
        arrowGroup.name = "Arrow Head Group";
        var arrowGroupContents = arrowGroup.property("ADBE Vectors Group");
        
        var arrowPath = arrowGroupContents.addProperty("ADBE Vector Shape - Group");
        arrowPath.name = "Arrow Head Path";
        
        var arrowPathExpr = '';
        arrowPathExpr += 'var ctrl = thisComp.layer("Arrow Control");\n';
        arrowPathExpr += 'var startPt = ctrl.effect("Start Point")("Point");\n';
        arrowPathExpr += 'var endPt = ctrl.effect("End Point")("Point");\n';
        arrowPathExpr += 'var arrowLen = ctrl.effect("Arrow Head Length")("Slider");\n';
        arrowPathExpr += 'var arrowWidth = ctrl.effect("Arrow Head Width")("Slider");\n';
        arrowPathExpr += 'var progress = ctrl.effect("Trim Progress (0-200%)")("Slider");\n';
        arrowPathExpr += '\n';
        arrowPathExpr += 'var dir = endPt - startPt;\n';
        arrowPathExpr += 'var totalLen = length(dir);\n';
        arrowPathExpr += 'if (totalLen == 0) totalLen = 0.001;\n';
        arrowPathExpr += 'var normDir = dir / totalLen;\n';
        arrowPathExpr += 'var perpDir = [normDir[1], -normDir[0]];\n';
        arrowPathExpr += '\n';
        arrowPathExpr += 'var tip;\n';
        arrowPathExpr += 'if (progress <= 100) {\n';
        arrowPathExpr += '    tip = startPt + normDir * (progress / 100) * totalLen;\n';
        arrowPathExpr += '} else {\n';
        arrowPathExpr += '    tip = endPt;\n';
        arrowPathExpr += '}\n';
        arrowPathExpr += '\n';
        arrowPathExpr += 'var currentLen = length(tip - startPt);\n';
        arrowPathExpr += 'var effectiveArrowLen = Math.min(arrowLen, currentLen);\n';
        arrowPathExpr += 'var baseCenter = tip - normDir * effectiveArrowLen;\n';
        arrowPathExpr += '\n';
        arrowPathExpr += 'var widthScale = effectiveArrowLen / arrowLen;\n';
        arrowPathExpr += 'var effectiveWidth = arrowWidth * widthScale;\n';
        arrowPathExpr += '\n';
        arrowPathExpr += 'var baseLeft = baseCenter + perpDir * (effectiveWidth / 2);\n';
        arrowPathExpr += 'var baseRight = baseCenter - perpDir * (effectiveWidth / 2);\n';
        arrowPathExpr += '\n';
        arrowPathExpr += 'var p1 = tip;\n';
        arrowPathExpr += 'var p2 = baseLeft;\n';
        arrowPathExpr += 'var p3 = baseRight;\n';
        arrowPathExpr += 'createPath([p1, p2, p3], [], [], true);';
        
        arrowPath.property("ADBE Vector Shape").expression = arrowPathExpr;
        
        var arrowFill = arrowGroupContents.addProperty("ADBE Vector Graphic - Fill");
        arrowFill.property("ADBE Vector Fill Color").expression = 'thisComp.layer("Arrow Control").effect("Arrow Color")("Color")';
        
        var arrowOpacityExpr = '';
        arrowOpacityExpr += 'var progress = thisComp.layer("Arrow Control").effect("Trim Progress (0-200%)")("Slider");\n';
        arrowOpacityExpr += 'if (progress <= 100) {\n';
        arrowOpacityExpr += '    100;\n';
        arrowOpacityExpr += '} else {\n';
        arrowOpacityExpr += '    linear(progress, 100, 200, 100, 0);\n';
        arrowOpacityExpr += '}';
        
        arrowLayer.property("ADBE Transform Group").property("ADBE Opacity").expression = arrowOpacityExpr;

        alert("Vector Arrow created!\n\nControls on 'Arrow Control' layer:\n- Start Point / End Point\n- Arrow Head Length / Width\n- Shaft Thickness\n- Arrow Color\n- Taper Start Length\n- Trim Progress (0-200%)");

    } catch (e) {
        alert("Error: " + e.toString() + "\nLine: " + e.line);
    }

    app.endUndoGroup();
})();
