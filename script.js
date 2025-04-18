document.addEventListener('DOMContentLoaded', () => {
    // --- Constants and Globals ---
    const GRID_ROWS = 8;
    const GRID_COLS = 16;
    const TARGET_SCORE = 10;
    const MAX_SCALE = 1.6;
    const SCALE_RADIUS = 2.5;

    // --- DOM Elements ---
    const gridElement = document.getElementById('game-grid');
    const fileSelectElement = document.getElementById('file-select');
    const binButtons = {
        W: document.getElementById('bin-W'),
        F: document.getElementById('bin-F'),
        D: document.getElementById('bin-D'),
        M: document.getElementById('bin-M'),
    };
    const fillElements = {
        W: binButtons.W.querySelector('.fill'),
        F: binButtons.F.querySelector('.fill'),
        D: binButtons.D.querySelector('.fill'),
        M: binButtons.M.querySelector('.fill'),
    };
    const winMessageElement = document.getElementById('win-message');

    // --- Game State ---
    let grid = []; // 2D array holding the numbers
    let cellElements = []; // 2D array holding the DOM elements
    let isSelecting = false;
    let selectionStartCoords = null;
    let selectionEndCoords = null;
    let currentSelection = []; // Array of { row: r, col: c } objects

    // --- File Data and State ---
    let currentFileName = 'Tempe'; // Default file
    const fileData = {
        "Tempe": {
            name: "Tempe",
            scores: { W: 0, F: 0, D: 0, M: 0 },
            rules: {
                W: (d) => d.rows === 2 && d.cols === 3 && (d.counts[1] || 0) >= 1,
                F: (d) => d.rows === 2 && d.cols === 3 && (d.counts[7] || 0) >= 1,
                D: (d) => d.rows === 2 && d.cols === 3 && (d.counts[6] || 0) >= 1,
                M: (d) => d.rows === 2 && d.cols === 3 && (d.counts[8] || 0) >= 1,
            }
        },
        "Evanston": {
            name: "Evanston",
            scores: { W: 0, F: 0, D: 0, M: 0 },
            rules: {
                W: (d) => d.rows === 2 && d.cols === 3 && (d.counts[1] || 0) >= 2,
                F: (d) => d.rows === 2 && d.cols === 3 && d.topLeftValue === 7,
                D: (d) => d.rows === 2 && d.cols === 2 && (d.counts[6] || 0) >= 1,
                M: (d) => d.rows === 2 && d.cols === 3 && (d.counts[8] || 0) >= 2,
            }
        },
        "Rockville": {
            name: "Rockville",
            scores: { W: 0, F: 0, D: 0, M: 0 },
            rules: {
                W: (d) => d.rows === 2 && d.cols === 3 && d.topLeftValue === 1 && d.bottomRightValue === 1,
                F: (d) => d.rows === 2 && d.cols === 3 && d.numbers[1] && d.numbers[1][1] === 7, // Check lower middle (row 1, col 1 of selection)
                D: (d) => d.rows === 2 && d.cols === 2 && (d.counts[6] || 0) >= 3,
                M: (d) => d.rows === 4 && d.cols === 4 && (d.counts[8] || 0) >= 3,
            }
        }
    };

    // --- Initialization ---

    function initializeGrid() {
        // Only initialize grid numbers once, they persist across file changes
        if (grid.length === 0) {
            console.log("Initializing grid numbers for the first time.");
            grid = [];
            cellElements = []; // Also needs reset if grid is empty
            gridElement.innerHTML = ''; // Clear previous grid elements if any

            for (let r = 0; r < GRID_ROWS; r++) {
                grid[r] = [];
                cellElements[r] = [];
                for (let c = 0; c < GRID_COLS; c++) {
                    grid[r][c] = getRandomDigit();
                    const cell = document.createElement('div');
                    cell.classList.add('grid-cell');
                    cell.dataset.row = r;
                    cell.dataset.col = c;
                    cell.textContent = grid[r][c];
                    gridElement.appendChild(cell);
                    cellElements[r][c] = cell;
                }
            }
        } else {
             // If grid already exists, just ensure DOM elements match grid state
             // This might be needed if elements were somehow lost, but usually renderGrid is sufficient
             console.log("Grid numbers already exist. Ensuring DOM matches.");
             renderGrid(); // Make sure display matches existing grid
        }
         console.log("Grid Initialized/Verified");
    }

    function getRandomDigit() {
        return Math.floor(Math.random() * 10);
    }

    // --- Score Display (Button Fill) ---
    function updateScoreDisplay() {
        // Use scores from the currently selected file
        const currentScores = fileData[currentFileName].scores;
        console.log(`Updating display for file: ${currentFileName}`, currentScores);
        for (const binType in currentScores) {
            if (fillElements[binType]) {
                const score = currentScores[binType];
                const percentage = Math.min(100, (score / TARGET_SCORE) * 100);
                fillElements[binType].style.width = `${percentage}%`;
            }
        }
        // Check win condition for the current file whenever display is updated
        checkWinCondition();
    }

    // --- File Switching ---
    function handleFileChange(event) {
        const newFileName = event.target.value;
        if (newFileName !== currentFileName) {
            console.log(`Switching file from ${currentFileName} to ${newFileName}`);
            currentFileName = newFileName;

            // Reset visual state, but keep grid numbers
            clearSelectionHighlight();
            resetCellScales();
            currentSelection = [];
            selectionStartCoords = null;
            selectionEndCoords = null;
            winMessageElement.style.display = 'none'; // Hide win message
             Object.values(binButtons).forEach(button => button.disabled = false); // Ensure buttons are enabled


            // Update display to show scores for the new file
            updateScoreDisplay();
        }
    }

    // --- Selection Logic (Unchanged) ---
    function getCoordsFromEvent(event) {
        const target = event.target.closest('.grid-cell');
        if (target) {
            return {
                row: parseInt(target.dataset.row, 10),
                col: parseInt(target.dataset.col, 10)
            };
        }
        return null;
    }

    function handleMouseDown(event) {
        const coords = getCoordsFromEvent(event);
        if (coords) {
            isSelecting = true;
            selectionStartCoords = coords;
            selectionEndCoords = coords;
            clearSelectionHighlight();
            highlightSelection();
            gridElement.style.cursor = 'grabbing';
            event.preventDefault();
        }
    }

    function handleMouseMove(event) {
        if (!isSelecting) return;

        const gridRect = gridElement.getBoundingClientRect();
        const mouseX = event.clientX - gridRect.left;
        const mouseY = event.clientY - gridRect.top;

        const cellWidthWithGap = gridRect.width / GRID_COLS;
        const cellHeightWithGap = gridRect.height / GRID_ROWS;

        let targetCol = Math.floor(mouseX / cellWidthWithGap);
        let targetRow = Math.floor(mouseY / cellHeightWithGap);

        targetCol = Math.max(0, Math.min(GRID_COLS - 1, targetCol));
        targetRow = Math.max(0, Math.min(GRID_ROWS - 1, targetRow));

        const currentCoords = { row: targetRow, col: targetCol };

        if (currentCoords.row !== selectionEndCoords.row || currentCoords.col !== selectionEndCoords.col) {
            selectionEndCoords = currentCoords;
            highlightSelection();
        }
        event.preventDefault();
    }

    function handleMouseUp(event) {
        if (isSelecting) {
            isSelecting = false;
            gridElement.style.cursor = 'crosshair';
             if (currentSelection.length === 0 && selectionStartCoords) {
                 currentSelection = [selectionStartCoords];
                 highlightSelection();
            }
             console.log(`Selection finalized: ${currentSelection.length} cells`);
        }
    }

    function highlightSelection() {
        clearSelectionHighlight();
        currentSelection = [];
        if (!selectionStartCoords || !selectionEndCoords) return;
        const minRow = Math.min(selectionStartCoords.row, selectionEndCoords.row);
        const maxRow = Math.max(selectionStartCoords.row, selectionEndCoords.row);
        const minCol = Math.min(selectionStartCoords.col, selectionEndCoords.col);
        const maxCol = Math.max(selectionStartCoords.col, selectionEndCoords.col);
        for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
                if (cellElements[r] && cellElements[r][c]) {
                    cellElements[r][c].classList.add('selected');
                    currentSelection.push({ row: r, col: c });
                }
            }
        }
    }

    function clearSelectionHighlight() {
        document.querySelectorAll('.grid-cell.selected').forEach(cell => {
            cell.classList.remove('selected');
        });
    }

    // --- Hover/Scaling Logic (Unchanged) ---
    function gridMouseMove(event) {
        if (isSelecting) return;
        const gridRect = gridElement.getBoundingClientRect();
        const mouseX = event.clientX - gridRect.left;
        const mouseY = event.clientY - gridRect.top;
        const hoverCol = mouseX / (gridRect.width / GRID_COLS);
        const hoverRow = mouseY / (gridRect.height / GRID_ROWS);
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                if (cellElements[r] && cellElements[r][c]) {
                    const dx = (c + 0.5) - hoverCol;
                    const dy = (r + 0.5) - hoverRow;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    let scale = 1.0;
                    if (distance < SCALE_RADIUS * 1.5) {
                       scale = 1.0 + (MAX_SCALE - 1.0) * Math.exp(-(distance * distance) / (SCALE_RADIUS * SCALE_RADIUS));
                    }
                    scale = Math.max(1.0, scale);
                    cellElements[r][c].style.transform = `scale(${scale.toFixed(3)})`;
                    if (scale > 1.01) { cellElements[r][c].classList.add('scaling'); }
                    else { cellElements[r][c].classList.remove('scaling'); }
                }
            }
        }
    }

    function resetCellScales() {
        console.log("Resetting cell scales");
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                if (cellElements[r] && cellElements[r][c]) {
                    cellElements[r][c].style.transform = 'scale(1.0)';
                    cellElements[r][c].classList.remove('scaling');
                }
            }
        }
    }

    // --- Binning Logic ---

    function handleBinClick(binType) {
        if (currentSelection.length === 0) return;
        resetCellScales();

        console.log(`Attempting to bin selection into ${binType} for file ${currentFileName}`);
        const selectionDetails = getSelectionDetails(currentSelection);

        // Check rule for the current file
        const isCorrect = checkRule(binType, selectionDetails);

        // Get current scores for the active file
        const currentScores = fileData[currentFileName].scores;

        if (isCorrect && currentScores[binType] < TARGET_SCORE) {
            currentScores[binType]++; // Update score for the current file
            console.log(`Correct bin! Score for ${binType} in ${currentFileName} is now ${currentScores[binType]}`);
        } else if (isCorrect) {
             console.log(`Correct bin, but ${binType} score already maxed out for ${currentFileName}.`);
        } else {
            console.log("Incorrect bin.");
        }

        // Refill grid and update display (using current file's scores)
        removeAndRefill(currentSelection);
        updateScoreDisplay();

        // Reset selection state
        currentSelection = [];
        selectionStartCoords = null;
        selectionEndCoords = null;

        // Win condition is checked inside updateScoreDisplay now
    }

    // --- Rule Checking (Delegates to file-specific rules) ---
    function checkRule(binType, details) {
        if (!details) return false;
        // Get the rule function for the current file and bin type
        const ruleFn = fileData[currentFileName]?.rules?.[binType];
        if (typeof ruleFn === 'function') {
            try {
                return ruleFn(details); // Execute the rule function
            } catch (error) {
                 console.error(`Error executing rule ${binType} for file ${currentFileName}:`, error);
                 return false; // Treat errors as incorrect rule match
            }
        } else {
            console.warn(`Rule function not found for ${binType} in file ${currentFileName}`);
            return false; // No rule defined
        }
    }

    // getSelectionDetails remains the same logic, but ensure 'numbers' is robust
    function getSelectionDetails(selectedCoords) {
        if (!selectedCoords || selectedCoords.length === 0) return null;

        const minRow = Math.min(...selectedCoords.map(c => c.row));
        const maxRow = Math.max(...selectedCoords.map(c => c.row));
        const minCol = Math.min(...selectedCoords.map(c => c.col));
        const maxCol = Math.max(...selectedCoords.map(c => c.col));

        const rows = maxRow - minRow + 1;
        const cols = maxCol - minCol + 1;
        const numbers = []; // 2D array of numbers in the selection's bounding box
        const flatNumbers = [];
        let sum = 0;
        const counts = {};

        for (let r = minRow; r <= maxRow; r++) {
            const rowNumbers = [];
            for (let c = minCol; c <= maxCol; c++) {
                // Check bounds carefully before accessing grid
                if (r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS && grid[r] && grid[r][c] !== undefined) {
                    const num = grid[r][c];
                    rowNumbers.push(num); // Add number to the row array
                    // Only count/sum if the cell was actually selected (important if selection could be non-rectangular)
                    if (selectedCoords.some(coord => coord.row === r && coord.col === c)) {
                        flatNumbers.push(num);
                        sum += num;
                        counts[num] = (counts[num] || 0) + 1;
                    }
                } else {
                    rowNumbers.push(undefined); // Indicate out of bounds or error
                    console.warn(`Accessed invalid grid coordinate during selection details: [${r}][${c}]`);
                }
            }
            numbers.push(rowNumbers); // Add the completed row to the 2D array
        }

        // Ensure topLeftValue and bottomRightValue are accessed safely
        const topLeftValue = (grid[minRow] !== undefined && grid[minRow][minCol] !== undefined) ? grid[minRow][minCol] : undefined;
        const bottomRightValue = (grid[maxRow] !== undefined && grid[maxRow][maxCol] !== undefined) ? grid[maxRow][maxCol] : undefined;


        return {
            rows, cols, minRow, minCol, maxRow, maxCol,
            numbers, // 2D array [row][col] relative to selection top-left
            flatNumbers, // 1D array of selected numbers
            sum, counts, topLeftValue, bottomRightValue, coords: selectedCoords
        };
    }


    // --- Grid Refill Logic (Unchanged) ---
    function removeAndRefill(coordsToRemove) {
        const affectedCols = new Set();
        coordsToRemove.forEach(coord => {
            if (grid[coord.row] && grid[coord.row][coord.col] !== undefined) {
                 grid[coord.row][coord.col] = null;
                 affectedCols.add(coord.col);
            }
        });
        console.log(`Removed ${coordsToRemove.length} cells. Affecting columns:`, Array.from(affectedCols));
        affectedCols.forEach(col => {
            let emptyRow = GRID_ROWS - 1;
            let writeRow = GRID_ROWS - 1;
            while (emptyRow >= 0) {
                 while (emptyRow >= 0 && grid[emptyRow][col] !== null) { emptyRow--; }
                 if (emptyRow >= 0) {
                    writeRow = emptyRow;
                    let readRow = emptyRow - 1;
                    while (readRow >= 0 && grid[readRow][col] === null) { readRow--; }
                    if (readRow >= 0) {
                        grid[writeRow][col] = grid[readRow][col];
                        grid[readRow][col] = null;
                    }
                    emptyRow--;
                }
            }
            for (let r = 0; r < GRID_ROWS; r++) {
                if (grid[r][col] === null) { grid[r][col] = getRandomDigit(); }
                else { break; }
            }
        });
        renderGrid();
    }

    // renderGrid remains the same
     function renderGrid() {
        // console.log("Rendering grid updates"); // Can be noisy, disable if needed
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                 if (cellElements[r] && cellElements[r][c]) {
                     if (cellElements[r][c].textContent !== String(grid[r][c])) {
                         cellElements[r][c].textContent = grid[r][c];
                     }
                    cellElements[r][c].classList.remove('selected');
                 } else {
                     // This should ideally not happen after initialization
                     // console.error(`Error: Cell element at [${r}][${c}] not found during render.`);
                 }
            }
        }
     }

    // --- Win Condition ---
    function checkWinCondition() {
        // Check win condition for the CURRENTLY selected file
        const currentScores = fileData[currentFileName].scores;
        const won = Object.values(currentScores).every(score => score >= TARGET_SCORE);

        if (won) {
            winMessageElement.style.display = 'block';
            console.log(`File ${currentFileName} complete!`);
            // Disable buttons only, allow changing files still
            Object.values(binButtons).forEach(button => button.disabled = true);
            resetCellScales();
        } else {
             winMessageElement.style.display = 'none'; // Ensure message is hidden if not won
             // Ensure buttons are enabled if the file isn't won (might have been disabled by another file's win)
             Object.values(binButtons).forEach(button => button.disabled = false);
        }
    }

    // --- Event Listeners Setup ---
    function setupEventListeners() {
        // Grid interaction listeners
        gridElement.removeEventListener('mousedown', handleMouseDown); // Remove first to prevent duplicates
        gridElement.addEventListener('mousedown', handleMouseDown);

        document.removeEventListener('mousemove', handleMouseMove); // Use document for drag selection
        document.addEventListener('mousemove', handleMouseMove);

        document.removeEventListener('mouseup', handleMouseUp); // Use document for drag selection end
        document.addEventListener('mouseup', handleMouseUp);

        gridElement.removeEventListener('mousemove', gridMouseMove); // Grid specific for hover/scale
        gridElement.addEventListener('mousemove', gridMouseMove);

        gridElement.removeEventListener('mouseleave', resetCellScales);
        gridElement.addEventListener('mouseleave', resetCellScales);

        // File selector listener
        fileSelectElement.removeEventListener('change', handleFileChange); // Remove first
        fileSelectElement.addEventListener('change', handleFileChange);

        // Bin button listeners (Re-attach using clone/replace or simply re-add if safe)
         Object.entries(binButtons).forEach(([binType, button]) => {
             // Simpler re-attachment if no complex state is stored on the button itself
             button.replaceWith(button.cloneNode(true)); // Clone to remove old listeners
             // Re-find the button and its fill span in the DOM
             binButtons[binType] = document.getElementById(button.id);
             fillElements[binType] = binButtons[binType].querySelector('.fill');
             // Add the listener to the new button instance
             binButtons[binType].addEventListener('click', () => handleBinClick(binType));
         });


        console.log("Event listeners set up.");
    }

    // --- Start Game ---
    function startGame() {
        console.log("Starting game...");
        currentFileName = fileSelectElement.value || 'Tempe'; // Ensure currentFileName matches dropdown
        initializeGrid(); // Initialize grid numbers if needed, verify DOM otherwise
        // No need to reset all scores, load current file's scores
        updateScoreDisplay(); // Display scores for the initial file
        clearSelectionHighlight();
        currentSelection = [];
        selectionStartCoords = null;
        selectionEndCoords = null;
        // Win message display is handled by updateScoreDisplay/checkWinCondition
        setupEventListeners();
        resetCellScales();
        console.log(`Game ready. Current file: ${currentFileName}`);
    }

    startGame(); // Initialize the game

}); // End DOMContentLoaded
