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
        controlLayer.name = "Arrow Controller";
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
        arrowLengthCtrl.property("ADBE Slider Control-0001").setValue(35);
        
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

        // Create single Shape Layer for the entire arrow
        var arrowLayer = comp.layers.addShape();
        arrowLayer.name = "Vector Arrow";
        arrowLayer.label = 1;
        // Set anchor and position to [0,0] so coordinates equal screen coordinates
        arrowLayer.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([0, 0]);
        arrowLayer.property("ADBE Transform Group").property("ADBE Position").setValue([0, 0]);
        
        var arrowContents = arrowLayer.property("ADBE Root Vectors Group");
        
        // ============================================
        // Arrow Head Group (add first so it renders on top)
        // ============================================
        var headGroup = arrowContents.addProperty("ADBE Vector Group");
        headGroup.name = "Arrow Head";
        var headGroupContents = headGroup.property("ADBE Vectors Group");
        
        var headPath = headGroupContents.addProperty("ADBE Vector Shape - Group");
        headPath.name = "Head Path";
        
        var headPathExpr = '';
        headPathExpr += 'var ctrl = thisComp.layer("Arrow Controller");\n';
        headPathExpr += 'var startPt = ctrl.effect("Start Point")("Point");\n';
        headPathExpr += 'var endPt = ctrl.effect("End Point")("Point");\n';
        headPathExpr += 'var arrowLen = ctrl.effect("Arrow Head Length")("Slider");\n';
        headPathExpr += 'var arrowWidth = ctrl.effect("Arrow Head Width")("Slider");\n';
        headPathExpr += 'var progress = clamp(ctrl.effect("Trim Progress (0-200%)")("Slider"), 0, 200);\n';
        headPathExpr += '\n';
        headPathExpr += 'var dir = endPt - startPt;\n';
        headPathExpr += 'var totalLen = length(dir);\n';
        headPathExpr += 'if (totalLen == 0) totalLen = 0.001;\n';
        headPathExpr += 'var normDir = dir / totalLen;\n';
        headPathExpr += 'var perpDir = [normDir[1], -normDir[0]];\n';
        headPathExpr += '\n';
        headPathExpr += 'var tip;\n';
        headPathExpr += 'if (progress <= 100) {\n';
        headPathExpr += '    tip = startPt + normDir * (progress / 100) * totalLen;\n';
        headPathExpr += '} else {\n';
        headPathExpr += '    tip = endPt;\n';
        headPathExpr += '}\n';
        headPathExpr += '\n';
        headPathExpr += 'var currentLen = length(tip - startPt);\n';
        headPathExpr += 'var effectiveArrowLen = Math.min(arrowLen, currentLen);\n';
        headPathExpr += 'var baseCenter = tip - normDir * effectiveArrowLen;\n';
        headPathExpr += '\n';
        headPathExpr += 'var widthScale = effectiveArrowLen / arrowLen;\n';
        headPathExpr += 'var effectiveWidth = arrowWidth * widthScale;\n';
        headPathExpr += '\n';
        headPathExpr += 'var baseLeft = baseCenter + perpDir * (effectiveWidth / 2);\n';
        headPathExpr += 'var baseRight = baseCenter - perpDir * (effectiveWidth / 2);\n';
        headPathExpr += '\n';
        headPathExpr += 'var p1 = tip;\n';
        headPathExpr += 'var p2 = baseLeft;\n';
        headPathExpr += 'var p3 = baseRight;\n';
        headPathExpr += 'createPath([p1, p2, p3], [], [], true);';
        
        headPath.property("ADBE Vector Shape").expression = headPathExpr;
        
        var headFill = headGroupContents.addProperty("ADBE Vector Graphic - Fill");
        headFill.property("ADBE Vector Fill Color").expression = 'thisComp.layer("Arrow Controller").effect("Arrow Color")("Color")';
        
        // Arrow Head Opacity for 100-200% phase
        var headOpacityExpr = '';
        headOpacityExpr += 'var progress = clamp(thisComp.layer("Arrow Controller").effect("Trim Progress (0-200%)")("Slider"), 0, 200);\n';
        headOpacityExpr += 'if (progress <= 100) {\n';
        headOpacityExpr += '    100;\n';
        headOpacityExpr += '} else {\n';
        headOpacityExpr += '    linear(progress, 100, 200, 100, 0);\n';
        headOpacityExpr += '}';
        headGroup.property("ADBE Vector Transform Group").property("ADBE Vector Group Opacity").expression = headOpacityExpr;
        
        // ============================================
        // Shaft Group
        // ============================================
        var shaftGroup = arrowContents.addProperty("ADBE Vector Group");
        shaftGroup.name = "Shaft";
        var shaftGroupContents = shaftGroup.property("ADBE Vectors Group");
        
        var shaftPath = shaftGroupContents.addProperty("ADBE Vector Shape - Group");
        shaftPath.name = "Shaft Path";
        
        var shaftPathExpr = '';
        shaftPathExpr += 'var ctrl = thisComp.layer("Arrow Controller");\n';
        shaftPathExpr += 'var startPt = ctrl.effect("Start Point")("Point");\n';
        shaftPathExpr += 'var endPt = ctrl.effect("End Point")("Point");\n';
        shaftPathExpr += 'var arrowLen = ctrl.effect("Arrow Head Length")("Slider");\n';
        shaftPathExpr += 'var progress = clamp(ctrl.effect("Trim Progress (0-200%)")("Slider"), 0, 200);\n';
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
        shaftStroke.property("ADBE Vector Stroke Color").expression = 'thisComp.layer("Arrow Controller").effect("Arrow Color")("Color")';
        shaftStroke.property("ADBE Vector Stroke Width").expression = 'thisComp.layer("Arrow Controller").effect("Shaft Thickness")("Slider")';
        shaftStroke.property("ADBE Vector Stroke Line Cap").setValue(2);
        
        try {
            var taperStartLen = shaftStroke.property("Taper").property("Start Length");
            if (taperStartLen) {
                taperStartLen.expression = 'thisComp.layer("Arrow Controller").effect("Taper Start Length")("Slider")';
            }
        } catch (taperErr) {}
        
        // Trim Paths for Shaft (100-200% phase)
        var shaftTrim = shaftGroup.property("ADBE Vectors Group").addProperty("ADBE Vector Filter - Trim");
        shaftTrim.name = "Trim Paths";
        
        var shaftTrimStartExpr = '';
        shaftTrimStartExpr += 'var progress = clamp(thisComp.layer("Arrow Controller").effect("Trim Progress (0-200%)")("Slider"), 0, 200);\n';
        shaftTrimStartExpr += 'if (progress <= 100) {\n';
        shaftTrimStartExpr += '    0;\n';
        shaftTrimStartExpr += '} else {\n';
        shaftTrimStartExpr += '    (progress - 100);\n';
        shaftTrimStartExpr += '}';
        shaftTrim.property("ADBE Vector Trim Start").expression = shaftTrimStartExpr;
        shaftTrim.property("ADBE Vector Trim End").setValue(100);

        alert("Vector Arrow created!\n\nLayers:\n- Arrow Controller (controls)\n- Vector Arrow (shape)\n\nControls:\n- Start Point / End Point\n- Arrow Head Length / Width\n- Shaft Thickness\n- Arrow Color\n- Taper Start Length\n- Trim Progress (0-200%)");

    } catch (e) {
        alert("Error: " + e.toString() + "\nLine: " + e.line);
    }

    app.endUndoGroup();
})();
