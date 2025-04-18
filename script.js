document.addEventListener('DOMContentLoaded', () => {
    // --- Constants and Globals ---
    const GRID_ROWS = 8;
    const GRID_COLS = 16;
    const TARGET_SCORE = 10;
    const MAX_SCALE = 1.6;
    const SCALE_RADIUS = 2.5;
    const DEFAULT_FILE_NAME = "Tempe"; // Define default file

    // --- DOM Elements ---
    const gridElement = document.getElementById('game-grid');
    // File Selector Removed
    const rolodexFilenameElement = document.getElementById('rolodex-filename');
    const prevButtonElement = document.getElementById('rolodex-prev');
    const nextButtonElement = document.getElementById('rolodex-next');
    const binButtons = { /* ... same as before ... */ };
    const fillElements = { /* ... same as before ... */ };
    const winMessageElement = document.getElementById('win-message');

    // --- Game State ---
    let grid = [];
    let cellElements = [];
    let isSelecting = false;
    let selectionStartCoords = null;
    let selectionEndCoords = null;
    let currentSelection = [];

    // --- File Data and State ---
    // File Data object remains the same
    const fileData = {
        "Tempe": { name: "Tempe", scores: { W: 0, F: 0, D: 0, M: 0 }, rules: { /*...*/ } },
        "Evanston": { name: "Evanston", scores: { W: 0, F: 0, D: 0, M: 0 }, rules: { /*...*/ } },
        "Rockville": { name: "Rockville", scores: { W: 0, F: 0, D: 0, M: 0 }, rules: { /*...*/ } }
    };
    // Populate rules here (omitted for brevity, same as before)
    fileData["Tempe"].rules = {
        W: (d) => d.rows === 2 && d.cols === 3 && (d.counts[1] || 0) >= 1,
        F: (d) => d.rows === 2 && d.cols === 3 && (d.counts[7] || 0) >= 1,
        D: (d) => d.rows === 2 && d.cols === 3 && (d.counts[6] || 0) >= 1,
        M: (d) => d.rows === 2 && d.cols === 3 && (d.counts[8] || 0) >= 1,
    };
    fileData["Evanston"].rules = {
        W: (d) => d.rows === 2 && d.cols === 3 && (d.counts[1] || 0) >= 2,
        F: (d) => d.rows === 2 && d.cols === 3 && d.topLeftValue === 7,
        D: (d) => d.rows === 2 && d.cols === 2 && (d.counts[6] || 0) >= 1,
        M: (d) => d.rows === 2 && d.cols === 3 && (d.counts[8] || 0) >= 2,
    };
     fileData["Rockville"].rules = {
        W: (d) => d.rows === 2 && d.cols === 3 && d.topLeftValue === 1 && d.bottomRightValue === 1,
        F: (d) => d.rows === 2 && d.cols === 3 && d.numbers[1] && d.numbers[1][1] === 7,
        D: (d) => d.rows === 2 && d.cols === 2 && (d.counts[6] || 0) >= 3,
        M: (d) => d.rows === 4 && d.cols === 4 && (d.counts[8] || 0) >= 3,
    };


    const fileNames = Object.keys(fileData); // Get list of file names
    let currentFileIndex = fileNames.indexOf(DEFAULT_FILE_NAME); // Start with default file index
    let currentFileName = fileNames[currentFileIndex]; // Keep track of name too

    // --- Initialization --- (initializeGrid, getRandomDigit same as before)
    function initializeGrid() {
        if (grid.length === 0) {
            console.log("Initializing grid numbers for the first time.");
            grid = [];
            cellElements = [];
            gridElement.innerHTML = '';
            for (let r = 0; r < GRID_ROWS; r++) {
                grid[r] = []; cellElements[r] = [];
                for (let c = 0; c < GRID_COLS; c++) {
                    grid[r][c] = getRandomDigit();
                    const cell = document.createElement('div');
                    cell.classList.add('grid-cell');
                    cell.dataset.row = r; cell.dataset.col = c;
                    cell.textContent = grid[r][c];
                    gridElement.appendChild(cell);
                    cellElements[r][c] = cell;
                }
            }
        } else {
            console.log("Grid numbers already exist. Ensuring DOM matches.");
            renderGrid();
        }
        console.log("Grid Initialized/Verified");
    }
    function getRandomDigit() { return Math.floor(Math.random() * 10); }


    // --- Score Display (Button Fill) --- (updateScoreDisplay same as before)
    function updateScoreDisplay() {
        const currentScores = fileData[currentFileName].scores;
        console.log(`Updating display for file: ${currentFileName}`, currentScores);
        for (const binType in currentScores) {
            if (fillElements[binType]) {
                const score = currentScores[binType];
                const percentage = Math.min(100, (score / TARGET_SCORE) * 100);
                fillElements[binType].style.width = `${percentage}%`;
            }
        }
        checkWinCondition(); // Check win condition after updating display
    }


    // --- File Switching ---
    function switchToFile(newFileName) {
        if (newFileName !== currentFileName && fileData[newFileName]) {
            console.log(`Switching file from ${currentFileName} to ${newFileName}`);
            currentFileName = newFileName;
            currentFileIndex = fileNames.indexOf(newFileName); // Keep index synced

            // Update Rolodex display
            rolodexFilenameElement.textContent = currentFileName;
            rolodexFilenameElement.parentNode.classList.remove('animate-flip'); // Remove animation class if used
            // void rolodexFilenameElement.parentNode.offsetWidth; // Trigger reflow if needed for animation restart
            // rolodexFilenameElement.parentNode.classList.add('animate-flip'); // Add animation class if used


            // Reset visual state, but keep grid numbers
            clearSelectionHighlight();
            resetCellScales();
            currentSelection = [];
            selectionStartCoords = null;
            selectionEndCoords = null;
            winMessageElement.style.display = 'none';
            Object.values(binButtons).forEach(button => button.disabled = false);

            // Update display to show scores for the new file
            updateScoreDisplay();
        }
    }

    function handleRolodexNext() {
        const nextIndex = (currentFileIndex + 1) % fileNames.length;
        switchToFile(fileNames[nextIndex]);
    }

    function handleRolodexPrev() {
        const prevIndex = (currentFileIndex - 1 + fileNames.length) % fileNames.length;
        switchToFile(fileNames[prevIndex]);
    }

    // --- Selection Logic --- (getCoordsFromEvent, handleMouseDown, handleMouseMove, handleMouseUp, highlightSelection, clearSelectionHighlight same as before)
    function getCoordsFromEvent(event) { /* ... */ }
    function handleMouseDown(event) { /* ... */ }
    function handleMouseMove(event) { /* ... */ }
    function handleMouseUp(event) { /* ... */ }
    function highlightSelection() { /* ... */ }
    function clearSelectionHighlight() { /* ... */ }
    // Copy implementations from previous version if needed


    // --- Hover/Scaling Logic --- (gridMouseMove, resetCellScales same as before)
    function gridMouseMove(event) { /* ... */ }
    function resetCellScales() { /* ... */ }
     // Copy implementations from previous version if needed


    // --- Binning Logic --- (handleBinClick, checkRule, getSelectionDetails same as before)
    function handleBinClick(binType) {
        if (currentSelection.length === 0) return;
        resetCellScales();
        console.log(`Attempting to bin selection into ${binType} for file ${currentFileName}`);
        const selectionDetails = getSelectionDetails(currentSelection);
        const isCorrect = checkRule(binType, selectionDetails);
        const currentScores = fileData[currentFileName].scores;
        if (isCorrect && currentScores[binType] < TARGET_SCORE) {
            currentScores[binType]++;
            console.log(`Correct bin! Score for ${binType} in ${currentFileName} is now ${currentScores[binType]}`);
        } else if (isCorrect) {
             console.log(`Correct bin, but ${binType} score already maxed out for ${currentFileName}.`);
        } else {
            console.log("Incorrect bin.");
        }
        removeAndRefill(currentSelection);
        updateScoreDisplay(); // Checks win condition internally
        currentSelection = [];
        selectionStartCoords = null;
        selectionEndCoords = null;
    }

    function checkRule(binType, details) {
        if (!details) return false;
        const ruleFn = fileData[currentFileName]?.rules?.[binType];
        if (typeof ruleFn === 'function') {
            try { return ruleFn(details); }
            catch (error) { console.error(`Error executing rule ${binType} for file ${currentFileName}:`, error); return false; }
        } else { console.warn(`Rule function not found for ${binType} in file ${currentFileName}`); return false; }
    }

    function getSelectionDetails(selectedCoords) { /* ... */ }
     // Copy implementations from previous version if needed


    // --- Grid Refill Logic --- (removeAndRefill, renderGrid same as before)
    function removeAndRefill(coordsToRemove) { /* ... */ }
    function renderGrid() { /* ... */ }
    // Copy implementations from previous version if needed


    // --- Win Condition --- (checkWinCondition same as before)
    function checkWinCondition() {
        const currentScores = fileData[currentFileName].scores;
        const won = Object.values(currentScores).every(score => score >= TARGET_SCORE);
        if (won) {
            winMessageElement.style.display = 'block';
            console.log(`File ${currentFileName} complete!`);
            Object.values(binButtons).forEach(button => button.disabled = true);
            resetCellScales();
        } else {
             winMessageElement.style.display = 'none';
             Object.values(binButtons).forEach(button => button.disabled = false);
        }
    }


    // --- Event Listeners Setup ---
    function setupEventListeners() {
        // Remove potentially old listeners first
        gridElement.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        gridElement.removeEventListener('mousemove', gridMouseMove);
        gridElement.removeEventListener('mouseleave', resetCellScales);
        prevButtonElement.removeEventListener('click', handleRolodexPrev);
        nextButtonElement.removeEventListener('click', handleRolodexNext);
         Object.values(binButtons).forEach(button => {
             // Simple listener removal/re-add using cloning
              const newButton = button.cloneNode(true);
              button.parentNode.replaceChild(newButton, button);
         });


        // --- Add listeners ---
        gridElement.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        gridElement.addEventListener('mousemove', gridMouseMove);
        gridElement.addEventListener('mouseleave', resetCellScales);

        // Rolodex listeners
        prevButtonElement.addEventListener('click', handleRolodexPrev);
        nextButtonElement.addEventListener('click', handleRolodexNext);

        // Bin button listeners (re-query elements after cloning)
         Object.keys(binButtons).forEach(binType => {
             const button = document.getElementById(`bin-${binType}`); // Re-find button by ID
             if(button){
                 binButtons[binType] = button; // Update reference in map
                 fillElements[binType] = button.querySelector('.fill'); // Update fill element reference
                 button.addEventListener('click', () => handleBinClick(binType));
             } else {
                 console.error(`Could not re-find button with ID bin-${binType} after cloning.`);
             }
         });


        console.log("Event listeners set up.");
    }

    // --- Start Game ---
    function startGame() {
        console.log("Starting game...");
        // Initialize based on default file index
        currentFileIndex = fileNames.indexOf(DEFAULT_FILE_NAME);
        if(currentFileIndex === -1) currentFileIndex = 0; // Fallback if default not found
        currentFileName = fileNames[currentFileIndex];
        rolodexFilenameElement.textContent = currentFileName; // Set initial Rolodex text

        initializeGrid();
        updateScoreDisplay(); // Display scores for the initial file
        clearSelectionHighlight();
        currentSelection = [];
        selectionStartCoords = null;
        selectionEndCoords = null;
        setupEventListeners();
        resetCellScales();
        console.log(`Game ready. Current file: ${currentFileName}`);
    }

    // --- Utility Functions (copy from previous if needed) ---
    // Example implementations needed: getCoordsFromEvent, handleMouseDown, handleMouseMove, handleMouseUp, highlightSelection, clearSelectionHighlight, gridMouseMove, resetCellScales, getSelectionDetails, removeAndRefill, renderGrid

    // --- Start ---
    startGame(); // Initialize the game

}); // End DOMContentLoaded
