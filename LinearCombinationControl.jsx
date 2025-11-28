/**
 * Linear Combination Control System for After Effects
 * 
 * Creates a system where three control points move along vectors a1, a2, a3,
 * and their linear combination always equals a fixed target vector b.
 * 
 * Vectors: a1=(1,2), a2=(2,3), a3=(3,1)
 * Target: b=(4,2)
 * Initial coefficients: k1=-1, k2=1, k3=1
 * 
 * Architecture:
 * - Driver layer has Point Controls (Input_A1, Input_A2, Input_A3) for user to drag
 * - K1/K2/K3 sliders are computed from the active input
 * - Ctrl_A1/A2/A3 layers' positions are driven by K sliders
 * 
 * @author AI Assistant
 * @version 2.0
 */

(function() {
    // ============== Configuration ==============
    var config = {
        originX: 960,
        originY: 540,
        scale: 100,
        a1: [1, 2],
        a2: [2, 3],
        a3: [3, 1],
        b: [4, 2],
        k1: -1,
        k2: 1,
        k3: 1
    };

    /**
     * Converts vector coordinates to screen position
     * @param {number} vx - Vector x component
     * @param {number} vy - Vector y component
     * @returns {Array} Screen position [x, y]
     */
    function vectorToScreen(vx, vy) {
        return [
            config.originX + vx * config.scale,
            config.originY - vy * config.scale
        ];
    }

    // ============== Main Script ==============
    app.beginUndoGroup("Create Linear Combination Control");

    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
        alert("Please select a composition first.");
        return;
    }

    // ---------- Create Layers ----------
    
    // 1. Origin marker
    var originLayer = comp.layers.addNull();
    originLayer.name = "Origin";
    originLayer.position.setValue([config.originX, config.originY]);
    originLayer.label = 9;

    // 2. Target vector B endpoint
    var targetLayer = comp.layers.addNull();
    targetLayer.name = "Target_B";
    targetLayer.position.setValue(vectorToScreen(config.b[0], config.b[1]));
    targetLayer.label = 1;

    // 3. Driver layer with all controls
    var driverLayer = comp.layers.addNull();
    driverLayer.name = "Driver";
    driverLayer.position.setValue([100, 100]);
    driverLayer.label = 14;
    
    // Active slider (1, 2, or 3)
    var activeSlider = driverLayer.Effects.addProperty("ADBE Slider Control");
    activeSlider.name = "Active";
    activeSlider.property(1).setValue(1);
    
    // Point Controls for user input (these are what user drags)
    var inputA1 = driverLayer.Effects.addProperty("ADBE Point Control");
    inputA1.name = "Input_A1";
    inputA1.property(1).setValue(vectorToScreen(config.k1 * config.a1[0], config.k1 * config.a1[1]));
    
    var inputA2 = driverLayer.Effects.addProperty("ADBE Point Control");
    inputA2.name = "Input_A2";
    inputA2.property(1).setValue(vectorToScreen(config.k2 * config.a2[0], config.k2 * config.a2[1]));
    
    var inputA3 = driverLayer.Effects.addProperty("ADBE Point Control");
    inputA3.name = "Input_A3";
    inputA3.property(1).setValue(vectorToScreen(config.k3 * config.a3[0], config.k3 * config.a3[1]));
    
    // K sliders (computed values)
    driverLayer.Effects.addProperty("ADBE Slider Control").name = "K1";
    driverLayer.Effects.addProperty("ADBE Slider Control").name = "K2";
    driverLayer.Effects.addProperty("ADBE Slider Control").name = "K3";

    // 4. Control point layers (visual representation)
    var ctrlA1 = comp.layers.addNull();
    ctrlA1.name = "Ctrl_A1";
    ctrlA1.label = 11;

    var ctrlA2 = comp.layers.addNull();
    ctrlA2.name = "Ctrl_A2";
    ctrlA2.label = 12;

    var ctrlA3 = comp.layers.addNull();
    ctrlA3.name = "Ctrl_A3";
    ctrlA3.label = 16;

    // ============== Expressions ==============
    
    // Common helper functions as string
    var helperFunctions = [
        'var origin = [960, 540];',
        'var scale = 100;',
        'var a1 = [1, 2], a2 = [2, 3], a3 = [3, 1];',
        'var b = [4, 2];',
        '',
        'function getK(pos, a) {',
        '    var dx = (pos[0] - origin[0]) / scale;',
        '    var dy = -(pos[1] - origin[1]) / scale;',
        '    var lenSq = a[0]*a[0] + a[1]*a[1];',
        '    return (dx * a[0] + dy * a[1]) / lenSq;',
        '}',
        '',
        'function solveK1K2(k3) {',
        '    var rx = b[0] - k3 * a3[0];',
        '    var ry = b[1] - k3 * a3[1];',
        '    var det = a1[0]*a2[1] - a1[1]*a2[0];',
        '    return [(rx*a2[1] - ry*a2[0]) / det, (a1[0]*ry - a1[1]*rx) / det];',
        '}',
        '',
        'function solveK1K3(k2) {',
        '    var rx = b[0] - k2 * a2[0];',
        '    var ry = b[1] - k2 * a2[1];',
        '    var det = a1[0]*a3[1] - a1[1]*a3[0];',
        '    return [(rx*a3[1] - ry*a3[0]) / det, (a1[0]*ry - a1[1]*rx) / det];',
        '}',
        '',
        'function solveK2K3(k1) {',
        '    var rx = b[0] - k1 * a1[0];',
        '    var ry = b[1] - k1 * a1[1];',
        '    var det = a2[0]*a3[1] - a2[1]*a3[0];',
        '    return [(rx*a3[1] - ry*a3[0]) / det, (a2[0]*ry - a2[1]*rx) / det];',
        '}',
        ''
    ].join('\n');

    // K1 expression
    var k1Expression = helperFunctions + [
        'var active = Math.round(effect("Active")("Slider"));',
        'var p1 = effect("Input_A1")("Point");',
        'var p2 = effect("Input_A2")("Point");',
        'var p3 = effect("Input_A3")("Point");',
        '',
        'var result = 0;',
        'if (active == 1) {',
        '    result = getK(p1, a1);',
        '} else if (active == 2) {',
        '    result = solveK1K3(getK(p2, a2))[0];',
        '} else {',
        '    result = solveK1K2(getK(p3, a3))[0];',
        '}',
        'result;'
    ].join('\n');

    // K2 expression
    var k2Expression = helperFunctions + [
        'var active = Math.round(effect("Active")("Slider"));',
        'var p1 = effect("Input_A1")("Point");',
        'var p2 = effect("Input_A2")("Point");',
        'var p3 = effect("Input_A3")("Point");',
        '',
        'var result = 0;',
        'if (active == 1) {',
        '    result = solveK2K3(getK(p1, a1))[0];',
        '} else if (active == 2) {',
        '    result = getK(p2, a2);',
        '} else {',
        '    result = solveK1K2(getK(p3, a3))[1];',
        '}',
        'result;'
    ].join('\n');

    // K3 expression
    var k3Expression = helperFunctions + [
        'var active = Math.round(effect("Active")("Slider"));',
        'var p1 = effect("Input_A1")("Point");',
        'var p2 = effect("Input_A2")("Point");',
        'var p3 = effect("Input_A3")("Point");',
        '',
        'var result = 0;',
        'if (active == 1) {',
        '    result = solveK2K3(getK(p1, a1))[1];',
        '} else if (active == 2) {',
        '    result = solveK1K3(getK(p2, a2))[1];',
        '} else {',
        '    result = getK(p3, a3);',
        '}',
        'result;'
    ].join('\n');

    // Ctrl_A1 position: always follows K1, projected onto a1 direction
    var ctrlA1Expression = [
        'var origin = [960, 540];',
        'var scale = 100;',
        'var a1 = [1, 2];',
        'var k1 = thisComp.layer("Driver").effect("K1")("Slider");',
        '[origin[0] + k1 * a1[0] * scale, origin[1] - k1 * a1[1] * scale];'
    ].join('\n');

    // Ctrl_A2 position
    var ctrlA2Expression = [
        'var origin = [960, 540];',
        'var scale = 100;',
        'var a2 = [2, 3];',
        'var k2 = thisComp.layer("Driver").effect("K2")("Slider");',
        '[origin[0] + k2 * a2[0] * scale, origin[1] - k2 * a2[1] * scale];'
    ].join('\n');

    // Ctrl_A3 position
    var ctrlA3Expression = [
        'var origin = [960, 540];',
        'var scale = 100;',
        'var a3 = [3, 1];',
        'var k3 = thisComp.layer("Driver").effect("K3")("Slider");',
        '[origin[0] + k3 * a3[0] * scale, origin[1] - k3 * a3[1] * scale];'
    ].join('\n');

    // Apply expressions - access sliders by name through the layer
    driverLayer.effect("K1")("Slider").expression = k1Expression;
    driverLayer.effect("K2")("Slider").expression = k2Expression;
    driverLayer.effect("K3")("Slider").expression = k3Expression;
    
    ctrlA1.position.expression = ctrlA1Expression;
    ctrlA2.position.expression = ctrlA2Expression;
    ctrlA3.position.expression = ctrlA3Expression;

    app.endUndoGroup();

    alert("Linear Combination Control system created!\n\n" +
          "Usage:\n" +
          "1. Select the Driver layer\n" +
          "2. Set Active slider to 1, 2, or 3\n" +
          "3. Drag the corresponding Input_A1/A2/A3 Point Control in Effect Controls\n" +
          "4. Watch Ctrl_A1/A2/A3 layers move - the active one follows your drag (projected onto vector),\n" +
          "   and the other two auto-adjust to maintain b = (4,2)\n\n" +
          "Layers:\n" +
          "- Driver: Contains Active slider and Input_A1/A2/A3 point controls\n" +
          "- Ctrl_A1/A2/A3: Visual control points (driven by expressions)");

})();
