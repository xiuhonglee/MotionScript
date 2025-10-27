/**
 * Handwriting Numbers Plugin for After Effects
 * Converts input numbers to handwriting effect using pre-composed number assets
 * Author: Xiuhong
 * Version: 1.0
 */

(function(thisObj) {
    "use strict";
    
    // Plugin configuration
    var PLUGIN_NAME = "Handwriting Numbers";
    var NUMBERS_FOLDER = "01_Numbers";
    var SCRIPT_VERSION = "1.0";
    
    /**
     * Main plugin function
     */
    function buildUI(thisObj) {
        var panel = (thisObj instanceof Panel) ? thisObj : new Window("palette", PLUGIN_NAME, undefined, {resizeable: true});
        
        // Main group
        var mainGroup = panel.add("group", undefined, "");
        mainGroup.orientation = "column";
        mainGroup.alignChildren = "fill";
        mainGroup.spacing = 10;
        mainGroup.margins = 16;
        
        // Title
        var titleGroup = mainGroup.add("group");
        titleGroup.add("statictext", undefined, PLUGIN_NAME + " v" + SCRIPT_VERSION);
        
        // Input section
        var inputGroup = mainGroup.add("group");
        inputGroup.orientation = "column";
        inputGroup.alignChildren = "fill";
        
        inputGroup.add("statictext", undefined, "Enter numbers to convert:");
        var numberInput = inputGroup.add("edittext", undefined, "");
        numberInput.characters = 20;
        numberInput.helpTip = "Enter numbers (0-9) to create handwriting effect. Use spaces to separate groups. Multi-digit groups will be combined into precompositions.";
        
        // Options section
        var optionsGroup = mainGroup.add("group");
        optionsGroup.orientation = "column";
        optionsGroup.alignChildren = "fill";
        
        // Spacing control
        var spacingGroup = optionsGroup.add("group");
        spacingGroup.add("statictext", undefined, "Number spacing:");
        var spacingSlider = spacingGroup.add("slider", undefined, 120, 50, 300);
        var spacingValue = spacingGroup.add("edittext", undefined, "120");
        spacingValue.characters = 4;
        
        // Group spacing control
        var groupSpacingGroup = optionsGroup.add("group");
        groupSpacingGroup.add("statictext", undefined, "Group spacing:");
        var groupSpacingSlider = groupSpacingGroup.add("slider", undefined, 200, 100, 500);
        var groupSpacingValue = groupSpacingGroup.add("edittext", undefined, "200");
        groupSpacingValue.characters = 4;
        
        // Animation timing
        var timingGroup = optionsGroup.add("group");
        timingGroup.add("statictext", undefined, "Group delay (seconds):");
        var delaySlider = timingGroup.add("slider", undefined, 0.5, 0, 2);
        var delayValue = timingGroup.add("edittext", undefined, "0.5");
        delayValue.characters = 4;
        
        // Preview section
        var previewGroup = mainGroup.add("group");
        previewGroup.orientation = "column";
        previewGroup.alignChildren = "fill";
        
        previewGroup.add("statictext", undefined, "Preview:");
        var previewText = previewGroup.add("statictext", undefined, "Enter numbers above to see preview");
        previewText.characters = 30;
        
        // Buttons section
        var buttonGroup = mainGroup.add("group");
        buttonGroup.alignment = "center";
        
        var createButton = buttonGroup.add("button", undefined, "Create Handwriting");
        var refreshButton = buttonGroup.add("button", undefined, "Refresh Assets");
        var helpButton = buttonGroup.add("button", undefined, "Help");
        
        // Close button (only for palette windows)
        if (!(thisObj instanceof Panel)) {
            var closeButton = buttonGroup.add("button", undefined, "Close");
            closeButton.onClick = function() {
                panel.close();
            };
        }
        
        // Current composition display
        var compInfoGroup = mainGroup.add("group");
        compInfoGroup.alignChildren = "fill";
        compInfoGroup.add("statictext", undefined, "Current composition:");
        var currentCompText = compInfoGroup.add("statictext", undefined, "None selected");
        currentCompText.characters = 25;
        
        // Add refresh composition button
        var refreshCompButton = compInfoGroup.add("button", undefined, "Refresh");
        
        // Status section
        var statusGroup = mainGroup.add("group");
        statusGroup.alignChildren = "fill";
        var statusText = statusGroup.add("statictext", undefined, "Ready");
        statusText.characters = 40;
        
        // Event handlers
        spacingSlider.onChanging = function() {
            spacingValue.text = Math.round(spacingSlider.value).toString();
        };
        
        spacingValue.onChanging = function() {
            var val = parseInt(spacingValue.text);
            if (!isNaN(val) && val >= 50 && val <= 300) {
                spacingSlider.value = val;
            }
        };
        
        groupSpacingSlider.onChanging = function() {
            groupSpacingValue.text = Math.round(groupSpacingSlider.value).toString();
        };
        
        groupSpacingValue.onChanging = function() {
            var val = parseInt(groupSpacingValue.text);
            if (!isNaN(val) && val >= 100 && val <= 500) {
                groupSpacingSlider.value = val;
            }
        };
        
        delaySlider.onChanging = function() {
            delayValue.text = delaySlider.value.toFixed(2);
        };
        
        delayValue.onChanging = function() {
            var val = parseFloat(delayValue.text);
            if (!isNaN(val) && val >= 0 && val <= 2) {
                delaySlider.value = val;
            }
        };
        
        numberInput.onChanging = function() {
            updatePreview();
        };
        
        function updatePreview() {
            var input = numberInput.text;
            if (input.length > 0) {
                var groups = parseNumberGroups(input);
                if (groups.length > 0) {
                    var previewStr = "Will create: ";
                    for (var i = 0; i < groups.length; i++) {
                        if (i > 0) previewStr += " | ";
                        if (groups[i].length > 1) {
                            previewStr += "[" + groups[i] + " precomp]";
                        } else {
                            previewStr += groups[i];
                        }
                    }
                    previewText.text = previewStr;
                } else {
                    previewText.text = "Enter numbers above to see preview";
                }
            } else {
                previewText.text = "Enter numbers above to see preview";
            }
        }
        
        /**
         * Parse input into number groups separated by spaces
         */
        function parseNumberGroups(input) {
            var groups = [];
            var parts = input.split(/\s+/); // Split by one or more spaces
            
            for (var i = 0; i < parts.length; i++) {
                var part = parts[i].replace(/[^0-9]/g, ''); // Keep only digits
                if (part.length > 0) {
                    groups.push(part);
                }
            }
            
            return groups;
        }
        
        createButton.onClick = function() {
            createHandwritingSequence();
        };
        
        refreshButton.onClick = function() {
            refreshNumberAssets();
        };
        
        helpButton.onClick = function() {
            showHelp();
        };
        
        /**
         * Main function to create handwriting sequence
         */
        function createHandwritingSequence() {
            try {
                var input = numberInput.text;
                var groups = parseNumberGroups(input);
                if (groups.length === 0) {
                    alert("Please enter some numbers first!");
                    return;
                }
                
                statusText.text = "Creating handwriting sequence...";
                
                // Check if project exists
                if (!app.project) {
                    alert("No project is open. Please open a project first!");
                    statusText.text = "No project open";
                    return;
                }
                
                app.beginUndoGroup("Create Handwriting Numbers");
                
                var activeComp = app.project.activeItem;
                if (!activeComp || !(activeComp instanceof CompItem)) {
                    // Try to find any composition in the project
                    var availableComps = [];
                    for (var i = 1; i <= app.project.numItems; i++) {
                        var item = app.project.item(i);
                        if (item instanceof CompItem) {
                            availableComps.push(item.name);
                        }
                    }
                    
                    if (availableComps.length === 0) {
                        alert("No compositions found in project. Please create a composition first!");
                        statusText.text = "No compositions available";
                        return;
                    } else {
                        var compNames = availableComps.join('\n');
                        alert("Please select a composition first!\n\nAvailable compositions:\n" + compNames + "\n\nTip: Click on a composition in the Project panel to select it.");
                        statusText.text = "Please select a composition";
                        return;
                    }
                }
                
                var numbersFolder = findNumbersFolder();
                if (!numbersFolder) {
                    alert("Cannot find '" + NUMBERS_FOLDER + "' folder in project. Please make sure your number compositions are in this folder.");
                    return;
                }
                
                var spacing = parseInt(spacingValue.text);
                var groupSpacing = parseInt(groupSpacingValue.text);
                var delay = parseFloat(delayValue.text);
                
                createNumberSequence(activeComp, groups, numbersFolder, spacing, groupSpacing, delay);
                
                statusText.text = "Handwriting sequence created successfully!";
                
            } catch (error) {
                alert("Error creating handwriting sequence: " + error.toString());
                statusText.text = "Error occurred";
            } finally {
                app.endUndoGroup();
            }
        }
        
        /**
         * Find the numbers folder in project
         */
        function findNumbersFolder() {
            for (var i = 1; i <= app.project.numItems; i++) {
                var item = app.project.item(i);
                if (item instanceof FolderItem && item.name === NUMBERS_FOLDER) {
                    return item;
                }
            }
            return null;
        }
        
        /**
         * Create the number sequence in composition
         */
        function createNumberSequence(comp, groups, numbersFolder, spacing, groupSpacing, delay) {
            var currentTime = comp.time;
            var precomps = [];
            
            // First, create precompositions for each group
            for (var g = 0; g < groups.length; g++) {
                var group = groups[g];
                if (group.length > 1) {
                    // Create precomp for multi-digit groups
                    var precomp = createGroupPrecomposition(group, numbersFolder, spacing, g + 1);
                    if (precomp) {
                        precomps.push(precomp);
                    }
                } else {
                    // Single digit - use original composition directly
                    var numberComp = findNumberComposition(numbersFolder, group);
                    if (numberComp) {
                        precomps.push(numberComp);
                    }
                }
            }
            
            // Then, arrange precomps in main composition
            if (precomps.length > 0) {
                arrangePrecompsInMainComp(comp, precomps, groups, groupSpacing, delay, currentTime);
            }
        }
        
        /**
         * Create a precomposition for a group of digits
         */
        function createGroupPrecomposition(group, numbersFolder, spacing, groupIndex) {
            try {
                var numbers = group.split('');
                var precompName = "Handwriting_Group_" + groupIndex + "_" + group;
                
                // Calculate precomp dimensions - each digit is 100px wide, height is 150px
                var precompWidth = numbers.length * 100;
                var precompHeight = 150;
                
                // Create precomposition with 2 minutes duration (composition length)
                // But animations are sequential 1 second each
                var precompDuration = 120; // 2 minutes composition duration
                var precomp = app.project.items.addComp(precompName, precompWidth, precompHeight, 1, precompDuration, 30);
                
                // Add number compositions to precomp with sequential timing
                for (var i = 0; i < numbers.length; i++) {
                    var digit = numbers[i];
                    var numberComp = findNumberComposition(numbersFolder, digit);
                    
                    if (numberComp) {
                        var layer = precomp.layers.add(numberComp);
                        layer.name = "Digit_" + digit + "_" + (i + 1);
                        
                        // Position the layer within precomp - each digit takes 100px width
                        var xPos = i * 100 + 50; // Center each digit in its 100px slot
                        layer.transform.position.setValue([xPos, precompHeight / 2]);
                        
                        // Set timing for strict sequential animation - each digit plays after previous finishes
                        // Each digit animation is 1 second, so start next digit after 1 second
                        layer.startTime = i * 1.0; // 1 second per digit animation
                        
                    } else {
                        statusText.text = "Warning: Could not find composition for number " + digit;
                    }
                }
                
                return precomp;
                
            } catch (error) {
                statusText.text = "Error creating precomp: " + error.toString();
                return null;
            }
        }
        
        /**
         * Arrange precompositions in main composition
         */
        function arrangePrecompsInMainComp(comp, precomps, groups, groupSpacing, delay, currentTime) {
            var totalWidth = calculatePrecompsTotalWidth(precomps, groupSpacing);
            var startX = comp.width / 2 - totalWidth / 2;
            var currentX = startX;
            var cumulativeTime = currentTime;
            
            for (var i = 0; i < precomps.length; i++) {
                var precompItem = precomps[i];
                var layer = comp.layers.add(precompItem);
                
                // Set layer name
                if (groups[i].length > 1) {
                    layer.name = "Handwriting_Group_" + (i + 1) + "_" + groups[i];
                } else {
                    layer.name = "Handwriting_Single_" + groups[i];
                }
                
                // Position the layer
                var layerWidth = precompItem.width;
                layer.transform.position.setValue([currentX + layerWidth / 2, comp.height / 2]);
                
                // Calculate group animation duration based on sequential playback
                var groupAnimationDuration;
                if (groups[i].length > 1) {
                    // Multi-digit group: each digit plays for 1 second sequentially
                    groupAnimationDuration = groups[i].length * 1.0; // 1 second per digit animation
                } else {
                    // Single digit: 1 second animation
                    groupAnimationDuration = 1.0; // 1 second animation
                }
                
                // Set timing - each group starts after previous group finishes
                layer.startTime = cumulativeTime;
                
                // Add fade-in animation
                layer.transform.opacity.setValueAtTime(layer.startTime, 0);
                layer.transform.opacity.setValueAtTime(layer.startTime + 0.1, 100);
                
                // Update cumulative time for next group
                cumulativeTime += groupAnimationDuration + delay;
                
                // Move to next position
                currentX += layerWidth + groupSpacing;
            }
        }
        
        /**
         * Calculate total width needed for precomps
         */
        function calculatePrecompsTotalWidth(precomps, groupSpacing) {
            var totalWidth = 0;
            
            for (var i = 0; i < precomps.length; i++) {
                totalWidth += precomps[i].width;
                if (i < precomps.length - 1) {
                    totalWidth += groupSpacing;
                }
            }
            
            return totalWidth;
        }
        
        /**
         * Calculate total width needed for all groups
         */
        function calculateTotalWidth(groups, spacing, groupSpacing) {
            var totalWidth = 0;
            
            for (var i = 0; i < groups.length; i++) {
                var groupLength = groups[i].length;
                if (groupLength > 0) {
                    // Each digit is 100px wide
                    var groupWidth = groupLength * 100;
                    totalWidth += groupWidth;
                    if (i < groups.length - 1) {
                        totalWidth += groupSpacing;
                    }
                }
            }
            
            return totalWidth;
        }
        
        /**
         * Find number composition in folder
         */
        function findNumberComposition(folder, digit) {
            for (var i = 1; i <= folder.numItems; i++) {
                var item = folder.item(i);
                if (item instanceof CompItem && item.name === digit) {
                    return item;
                }
            }
            return null;
        }
        
        /**
         * Refresh number assets
         */
        function refreshNumberAssets() {
            statusText.text = "Checking number assets...";
            
            var numbersFolder = findNumbersFolder();
            if (!numbersFolder) {
                statusText.text = "Numbers folder not found";
                return;
            }
            
            var foundNumbers = [];
            for (var i = 1; i <= numbersFolder.numItems; i++) {
                var item = numbersFolder.item(i);
                if (item instanceof CompItem && /^[0-9]$/.test(item.name)) {
                    foundNumbers.push(item.name);
                }
            }
            
            foundNumbers.sort();
            statusText.text = "Found numbers: " + foundNumbers.join(', ');
        }
        
        /**
         * Show help dialog
         */
        function showHelp() {
            var helpText = PLUGIN_NAME + " v" + SCRIPT_VERSION + "\n\n" +
                "How to use:\n" +
                "1. Make sure you have a '" + NUMBERS_FOLDER + "' folder in your project\n" +
                "2. Place your number compositions (named 0, 1, 2, etc.) in this folder\n" +
                "3. Select a composition where you want to add the handwriting\n" +
                "4. Enter numbers in the input field (use spaces to separate groups)\n" +
                "5. Adjust spacing and timing as needed\n" +
                "6. Click 'Create Handwriting' to generate the sequence\n\n" +
                "Features:\n" +
                "- Multi-digit groups are automatically combined into precompositions\n" +
                "- Example: '2 234 87' creates 3 items: single '2', precomp '234', precomp '87'\n" +
                "- Single digits use original compositions directly\n\n" +
                "Tips:\n" +
                "- Only numbers 0-9 are supported\n" +
                "- Each number should be a separate composition (100x150px, 2 minutes)\n" +
                "- Use spaces to create groups: '1 23' creates two groups\n" +
                "- Multi-digit precomps: width = digits × 100px, height = 150px\n" +
                "- Example: '234' creates 300×150px precomp\n" +
                "- Group spacing: distance between different groups\n" +
                "- Group delay: time gap between finishing one group and starting next\n" +
                "- Within precomps: digits play sequentially (1 second each)\n" +
                "- Multi-digit groups will be combined into precompositions";
            
            alert(helpText);
        }
        
        // Function to update current composition display
        function updateCurrentComp() {
            try {
                var activeComp = app.project ? app.project.activeItem : null;
                if (activeComp && activeComp instanceof CompItem) {
                    currentCompText.text = activeComp.name;
                } else {
                    currentCompText.text = "None selected";
                }
            } catch (e) {
                currentCompText.text = "Error checking composition";
            }
        }
        
        // Connect refresh button event
        refreshCompButton.onClick = function() {
            updateCurrentComp();
        };
        
        // Initialize
        refreshNumberAssets();
        updateCurrentComp();
        
        // Layout and show
        panel.layout.layout(true);
        
        if (panel instanceof Window) {
            panel.center();
            panel.show();
        } else {
            panel.layout.resize();
        }
        
        return panel;
    }
    
    // Build and show the panel
    buildUI(thisObj);
    
})(this);
