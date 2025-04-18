document.addEventListener('DOMContentLoaded', () => {
    const GRID_ROWS = 8;
    const GRID_COLS = 16;
    const TARGET_SCORE = 10;
    const MAX_SCALE = 1.6; // How much the digit grows max
    const SCALE_RADIUS = 2.5; // How far the scaling effect reaches (in grid units)

    const gridElement = document.getElementById('game-grid');
    // Score Elements Removed
    const binButtons = { // Keep refs to buttons themselves
        W: document.getElementById('bin-W'),
        F: document.getElementById('bin-F'),
        D: document.getElementById('bin-D'),
        M: document.getElementById('bin-M'),
    };
    // Get references to the fill spans *within* buttons
    const fillElements = {
        W: binButtons.W.querySelector('.fill'),
        F: binButtons.F.querySelector('.fill'),
        D: binButtons.D.querySelector('.fill'),
        M: binButtons.M.querySelector('.fill'),
    }
    const winMessageElement = document.getElementById('win-message');

    let grid = []; // 2D array holding the numbers
    let cellElements = []; // 2D array holding the DOM elements for cells
    let scores = { W: 0, F: 0, D: 0, M: 0 };

    let isSelecting = false;
    let selectionStartCoords = null;
    let selectionEndCoords = null;
    let currentSelection = [];

    // --- Initialization ---

    function initializeGrid() {
        grid = [];
        cellElements = [];
        gridElement.innerHTML = ''; // Clear previous grid elements

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
        console.log("Grid Initialized");
    }

    function getRandomDigit() {
        return Math.floor(Math.random() * 10);
    }

    // --- Score Display (Button Fill) ---
    function updateScoreDisplay() {
        for (const binType in scores) {
            if (fillElements[binType]) {
                const score = scores[binType];
                // Cap score at TARGET_SCORE for percentage calculation
                const percentage = Math.min(100, (score / TARGET_SCORE) * 100);
                fillElements[binType].style.width = `${percentage}%`;
                console.log(`Updating ${binType} fill to ${percentage}%`);
            }
        }
    }

    // --- Selection Logic (Largely unchanged, just visual differences) ---

    function getCoordsFromEvent(event) {
        // Use closest() to handle clicks potentially hitting scaled text
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
         // Reset scales maybe? Or let selection highlight override? Let's try without reset first.
        // resetCellScales(); // Optionally reset scales on click start
        const coords = getCoordsFromEvent(event);
        if (coords) {
            isSelecting = true;
            selectionStartCoords = coords;
            selectionEndCoords = coords;
            clearSelectionHighlight();
            highlightSelection(); // Highlight the single starting cell
            gridElement.style.cursor = 'grabbing';
            event.preventDefault();
        }
    }

    function handleMouseMove(event) { // This listener is on DOCUMENT
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
            highlightSelection(); // Update selection rectangle highlight
        }
        event.preventDefault();
    }


    function handleMouseUp(event) { // This listener is on DOCUMENT
        if (isSelecting) {
            isSelecting = false;
            gridElement.style.cursor = 'crosshair'; // Reset cursor
            // Final selection is stored in currentSelection
             if (currentSelection.length === 0 && selectionStartCoords) {
                 currentSelection = [selectionStartCoords];
                 highlightSelection();
            }
             console.log(`Selection finalized: ${currentSelection.length} cells`);
             // Don't reset scales here, let the grid mousemove/mouseleave handle it
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
        // Don't clear currentSelection until after binning
    }

    // --- Hover/Scaling Logic ---

    function gridMouseMove(event) {
        // This listener is on the GRID element
        if (isSelecting) return; // Don't apply hover effect during selection drag

        const gridRect = gridElement.getBoundingClientRect();
        // Calculate mouse position relative to the grid container
        const mouseX = event.clientX - gridRect.left;
        const mouseY = event.clientY - gridRect.top;

        // Calculate which cell the mouse is conceptually over (even in the gaps)
        const hoverCol = mouseX / (gridRect.width / GRID_COLS);
        const hoverRow = mouseY / (gridRect.height / GRID_ROWS);

        // Apply scaling to all cells based on distance
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                if (cellElements[r] && cellElements[r][c]) {
                    // Calculate distance from cell center (r + 0.5, c + 0.5) to hover position
                    const dx = (c + 0.5) - hoverCol;
                    const dy = (r + 0.5) - hoverRow;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    // Calculate scale using exponential decay
                    // Scale = base_scale + added_scale * decay_factor
                    // decay_factor approaches 0 as distance increases
                    let scale = 1.0;
                    if (distance < SCALE_RADIUS * 1.5) { // Optimization: only calculate exp for nearby cells
                       scale = 1.0 + (MAX_SCALE - 1.0) * Math.exp(-(distance * distance) / (SCALE_RADIUS * SCALE_RADIUS));
                    }

                    // Clamp scale to prevent excessive shrinking if needed (optional)
                    scale = Math.max(1.0, scale); // Ensure minimum scale is 1

                    cellElements[r][c].style.transform = `scale(${scale.toFixed(3)})`; // Apply scale
                    // Add/remove a class for potential z-index styling
                    if (scale > 1.01) { // Use a small threshold
                         cellElements[r][c].classList.add('scaling');
                    } else {
                         cellElements[r][c].classList.remove('scaling');
                    }
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
        if (currentSelection.length === 0) {
            console.log("No selection to bin.");
            return;
        }
        // If a scale effect is active, reset it visually before proceeding
        resetCellScales();

        console.log(`Attempting to bin selection into ${binType}`);
        const selectionDetails = getSelectionDetails(currentSelection);
        const isCorrect = checkRule(binType, selectionDetails);

        // Only increment score if it's below the target
        if (isCorrect && scores[binType] < TARGET_SCORE) {
            scores[binType]++;
            console.log(`Correct bin! Score for ${binType} is now ${scores[binType]}`);
        } else if (isCorrect) {
             console.log(`Correct bin, but ${binType} score already maxed out.`);
        } else {
            console.log("Incorrect bin.");
        }

        removeAndRefill(currentSelection); // Always remove and refill
        updateScoreDisplay(); // Update button fill percentage
        // Selection highlight is cleared within removeAndRefill via renderGrid
        currentSelection = []; // Clear internal selection data
        selectionStartCoords = null;
        selectionEndCoords = null;

        checkWinCondition();
    }

    // getSelectionDetails remains the same
    function getSelectionDetails(selectedCoords) {
        if (!selectedCoords || selectedCoords.length === 0) {
            return null;
        }

        const minRow = Math.min(...selectedCoords.map(c => c.row));
        const maxRow = Math.max(...selectedCoords.map(c => c.row));
        const minCol = Math.min(...selectedCoords.map(c => c.col));
        const maxCol = Math.max(...selectedCoords.map(c => c.col));

        const rows = maxRow - minRow + 1;
        const cols = maxCol - minCol + 1;
        const numbers = [];
        const flatNumbers = [];
        let sum = 0;
        const counts = {};

        // Need to iterate based on actual selected coords, not just bounding box
        // if the selection wasn't perfectly rectangular (though it should be here)
        // But using bounding box is fine since selection logic creates rectangles.
        for (let r = minRow; r <= maxRow; r++) {
            const rowNumbers = [];
            for (let c = minCol; c <= maxCol; c++) {
                // Ensure this coord was actually part of the selection
                // (Handles potential non-rectangular cases, though less likely here)
                // if (selectedCoords.some(coord => coord.row === r && coord.col === c)) {
                    const num = grid[r][c];
                    rowNumbers.push(num);
                    flatNumbers.push(num);
                    sum += num;
                    counts[num] = (counts[num] || 0) + 1;
                // } else {
                //     rowNumbers.push(undefined); // Or handle differently if needed
                // }
            }
            numbers.push(rowNumbers);
        }

        return {
            rows: rows,
            cols: cols,
            minRow: minRow,
            minCol: minCol,
            maxRow: maxRow,
            maxCol: maxCol,
            numbers: numbers, // 2D array matching bounding box
            flatNumbers: flatNumbers, // 1D array of numbers in selection
            sum: sum,
            counts: counts,
            topLeftValue: grid[minRow][minCol],
            bottomRightValue: grid[maxRow][maxCol],
            coords: selectedCoords
        };
    }


    // checkRule remains the same
    function checkRule(binType, details) {
        if (!details) return false;

        switch (binType) {
            case 'W':
                // 2x3 (2 down, 3 across), upper left is 2, lower right is 3
                return details.rows === 2 && details.cols === 3 &&
                       details.topLeftValue === 2 && details.bottomRightValue === 3;
            case 'F':
                // 2x2, contains at least two 7's
                return details.rows === 2 && details.cols === 2 &&
                       (details.counts[7] || 0) >= 2;
            case 'D':
                // 2x3 (2 down, 3 across), contains at least two 6's
                return details.rows === 2 && details.cols === 3 &&
                       (details.counts[6] || 0) >= 2;
            case 'M':
                // 1x3 (1 down, 3 across), sums to 8
                return details.rows === 1 && details.cols === 3 &&
                       details.sum === 8;
            default:
                return false;
        }
    }

    // --- Grid Refill Logic (Remains the same logic) ---
    function removeAndRefill(coordsToRemove) {
        const affectedCols = new Set();
        coordsToRemove.forEach(coord => {
            if (grid[coord.row] && grid[coord.row][coord.col] !== undefined) {
                 grid[coord.row][coord.col] = null; // Mark as empty
                 affectedCols.add(coord.col);
            }
        });

        console.log(`Removed ${coordsToRemove.length} cells. Affecting columns:`, Array.from(affectedCols));

        affectedCols.forEach(col => {
            let emptyRow = GRID_ROWS - 1;
            let writeRow = GRID_ROWS - 1;

            while (emptyRow >= 0) {
                 while (emptyRow >= 0 && grid[emptyRow][col] !== null) {
                     emptyRow--;
                 }
                 if (emptyRow >= 0) {
                    writeRow = emptyRow;
                    let readRow = emptyRow - 1;
                    while (readRow >= 0 && grid[readRow][col] === null) {
                        readRow--;
                    }
                    if (readRow >= 0) {
                        grid[writeRow][col] = grid[readRow][col];
                        grid[readRow][col] = null;
                    }
                    emptyRow--;
                }
            } // Finished shifting down

            for (let r = 0; r < GRID_ROWS; r++) {
                if (grid[r][col] === null) {
                    grid[r][col] = getRandomDigit();
                } else {
                     break; // Assumes top rows are filled contiguously
                }
            }
        });

        renderGrid(); // Update DOM display
    }


    // renderGrid remains largely the same, ensures selection is cleared
     function renderGrid() {
        console.log("Rendering grid updates");
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                 if (cellElements[r] && cellElements[r][c]) {
                     // Update text content only if it changed (minor optimization)
                     if (cellElements[r][c].textContent !== String(grid[r][c])) {
                         cellElements[r][c].textContent = grid[r][c];
                     }
                    // Ensure no 'selected' class remains after refill/render
                    cellElements[r][c].classList.remove('selected');
                    // Optionally ensure scale is reset here too, though mouseleave should handle it
                    // cellElements[r][c].style.transform = 'scale(1.0)';
                    // cellElements[r][c].classList.remove('scaling');
                 } else {
                     console.error(`Error: Cell element at [${r}][${c}] not found during render.`);
                 }
            }
        }
     }

    // --- Win Condition ---

    function checkWinCondition() {
        const won = Object.values(scores).every(score => score >= TARGET_SCORE);
        if (won) {
            winMessageElement.style.display = 'block';
            console.log("Game Won!");
            // Disable grid interactions
            gridElement.removeEventListener('mousemove', gridMouseMove);
            gridElement.removeEventListener('mouseleave', resetCellScales);
            // Keep selection listeners potentially, or remove them
            gridElement.removeEventListener('mousedown', handleMouseDown);
            // Document listeners might still be active, remove if needed
            // document.removeEventListener('mousemove', handleMouseMove);
            // document.removeEventListener('mouseup', handleMouseUp);

            Object.values(binButtons).forEach(button => button.disabled = true);
             resetCellScales(); // Ensure scales are reset on win
        }
    }

    // --- Event Listeners Setup ---

    function setupEventListeners() {
        // Remove potentially old listeners first to prevent duplicates if re-initializing
        gridElement.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        gridElement.removeEventListener('mousemove', gridMouseMove);
        gridElement.removeEventListener('mouseleave', resetCellScales);
        Object.values(binButtons).forEach(button => {
             // Clone and replace to remove old listeners safely
             const newButton = button.cloneNode(true);
             // Copy fill span reference if needed, or re-query
             button.parentNode.replaceChild(newButton, button);
             // Re-find the fill span for the new button element
             const binType = newButton.id.split('-')[1]; // Assumes id="bin-W" format
             fillElements[binType] = newButton.querySelector('.fill');
             // Add listener to the new button
             newButton.addEventListener('click', () => handleBinClick(binType));
             // Update the reference in binButtons map
             binButtons[binType] = newButton;
        });


        // --- Add listeners ---
        // Selection listeners (mouse down on grid, move/up on document)
        gridElement.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove); // For dragging selection rect
        document.addEventListener('mouseup', handleMouseUp);   // For ending selection rect

        // Hover/Scale listeners (move/leave on grid)
        gridElement.addEventListener('mousemove', gridMouseMove); // For scaling effect
        gridElement.addEventListener('mouseleave', resetCellScales); // Reset scaling on leave

        // Bin button listeners (already re-added above)

        console.log("Event listeners set up.");
    }

    // --- Start Game ---
    function startGame() {
        console.log("Starting game...");
        initializeGrid();
        scores = { W: 0, F: 0, D: 0, M: 0 }; // Reset scores
        updateScoreDisplay(); // Reset button fills
        clearSelectionHighlight();
        currentSelection = [];
        selectionStartCoords = null;
        selectionEndCoords = null;
        winMessageElement.style.display = 'none';
        Object.values(binButtons).forEach(button => button.disabled = false); // Enable buttons
        setupEventListeners();
         resetCellScales(); // Ensure scales start reset
        console.log("Game ready.");
    }

    startGame(); // Initialize the game

}); // End DOMContentLoaded
