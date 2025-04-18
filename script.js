document.addEventListener('DOMContentLoaded', () => {
    const GRID_ROWS = 8;
    const GRID_COLS = 16;
    const TARGET_SCORE = 10;

    const gridElement = document.getElementById('game-grid');
    const scoreElements = {
        W: document.getElementById('score-W'),
        F: document.getElementById('score-F'),
        D: document.getElementById('score-D'),
        M: document.getElementById('score-M'),
    };
    const binButtons = {
        W: document.getElementById('bin-W'),
        F: document.getElementById('bin-F'),
        D: document.getElementById('bin-D'),
        M: document.getElementById('bin-M'),
    };
    const winMessageElement = document.getElementById('win-message');

    let grid = []; // 2D array holding the numbers
    let cellElements = []; // 2D array holding the DOM elements for cells
    let scores = { W: 0, F: 0, D: 0, M: 0 };

    let isSelecting = false;
    let selectionStartCoords = null; // { row: r, col: c }
    let selectionEndCoords = null; // { row: r, col: c }
    let currentSelection = []; // Array of { row: r, col: c } objects

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

    function updateScoreDisplay() {
        for (const bin in scores) {
            if (scoreElements[bin]) {
                scoreElements[bin].textContent = scores[bin];
            }
        }
    }

    // --- Selection Logic ---

    function getCoordsFromEvent(event) {
        const target = event.target;
        if (target && target.classList.contains('grid-cell')) {
            return {
                row: parseInt(target.dataset.row, 10),
                col: parseInt(target.dataset.col, 10)
            };
        }
        return null; // Click was not on a cell
    }

    function handleMouseDown(event) {
        const coords = getCoordsFromEvent(event);
        if (coords) {
            isSelecting = true;
            selectionStartCoords = coords;
            selectionEndCoords = coords; // Start and end are same initially
            clearSelectionHighlight(); // Clear previous selection
            highlightSelection(); // Highlight the single starting cell
            gridElement.style.cursor = 'grabbing'; // Change cursor during drag
            event.preventDefault(); // Prevent text selection browser behavior
        }
    }

    function handleMouseMove(event) {
        if (!isSelecting) return;

        // Calculate current cell based on mouse position relative to grid
        const gridRect = gridElement.getBoundingClientRect();
        const mouseX = event.clientX - gridRect.left;
        const mouseY = event.clientY - gridRect.top;

        // Estimate cell dimensions (including gaps)
        const cellWidthWithGap = gridRect.width / GRID_COLS;
        const cellHeightWithGap = gridRect.height / GRID_ROWS;

        // Calculate target column and row
        let targetCol = Math.floor(mouseX / cellWidthWithGap);
        let targetRow = Math.floor(mouseY / cellHeightWithGap);

        // Clamp values to grid boundaries
        targetCol = Math.max(0, Math.min(GRID_COLS - 1, targetCol));
        targetRow = Math.max(0, Math.min(GRID_ROWS - 1, targetRow));

        const currentCoords = { row: targetRow, col: targetCol };

        // Only update if the target cell has changed
        if (currentCoords.row !== selectionEndCoords.row || currentCoords.col !== selectionEndCoords.col) {
            selectionEndCoords = currentCoords;
            highlightSelection();
        }
        event.preventDefault();
    }


    function handleMouseUp(event) {
        if (isSelecting) {
            isSelecting = false;
            gridElement.style.cursor = 'crosshair'; // Reset cursor

            // Final selection is stored in currentSelection from the last mousemove highlight
            if (currentSelection.length === 0 && selectionStartCoords) {
                 // If mouseup happens on the start cell without moving
                 currentSelection = [selectionStartCoords];
                 highlightSelection(); // Ensure it's highlighted if needed
            }
             console.log(`Selection finalized: ${currentSelection.length} cells`);
        }
    }

    function highlightSelection() {
        clearSelectionHighlight(); // Clear previous highlight first
        currentSelection = []; // Reset the list of selected cells

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
        // Don't clear currentSelection here, wait until after binning or new selection start
    }


    // --- Binning Logic ---

    function handleBinClick(binType) {
        if (currentSelection.length === 0) {
            console.log("No selection to bin.");
            return; // Nothing selected
        }

        console.log(`Attempting to bin selection into ${binType}`);

        const selectionDetails = getSelectionDetails(currentSelection);
        const isCorrect = checkRule(binType, selectionDetails);

        if (isCorrect) {
            scores[binType]++;
            console.log(`Correct bin! Score for ${binType} is now ${scores[binType]}`);
        } else {
            console.log("Incorrect bin.");
        }

        removeAndRefill(currentSelection); // Always remove and refill
        updateScoreDisplay();
        clearSelectionHighlight(); // Clear visual selection
        currentSelection = []; // Clear internal selection data
        selectionStartCoords = null;
        selectionEndCoords = null;

        checkWinCondition();
    }

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
        const numbers = []; // Store numbers in their grid structure
        const flatNumbers = []; // Store numbers as a flat list
        let sum = 0;
        const counts = {}; // Count occurrences of each digit

        for (let r = minRow; r <= maxRow; r++) {
            const rowNumbers = [];
            for (let c = minCol; c <= maxCol; c++) {
                const num = grid[r][c];
                rowNumbers.push(num);
                flatNumbers.push(num);
                sum += num;
                counts[num] = (counts[num] || 0) + 1;
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
            numbers: numbers, // 2D array of numbers in selection
            flatNumbers: flatNumbers, // 1D array of numbers
            sum: sum,
            counts: counts,
            topLeftValue: grid[minRow][minCol],
            bottomRightValue: grid[maxRow][maxCol],
            coords: selectedCoords // Pass original coords if needed
        };
    }

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
                return false; // Unknown bin type
        }
    }

    // --- Grid Refill Logic ---

    function removeAndRefill(coordsToRemove) {
        const affectedCols = new Set();
        coordsToRemove.forEach(coord => {
            grid[coord.row][coord.col] = null; // Mark as empty
            affectedCols.add(coord.col);
        });

        console.log(`Removed ${coordsToRemove.length} cells. Affecting columns:`, Array.from(affectedCols));

        // Process each affected column
        affectedCols.forEach(col => {
            let emptyRow = GRID_ROWS - 1; // Start checking from bottom
            let writeRow = GRID_ROWS - 1; // Where to write the next non-empty cell

            // Move existing numbers down
            while (emptyRow >= 0) {
                // Find the next empty cell from the bottom up
                while (emptyRow >= 0 && grid[emptyRow][col] !== null) {
                    emptyRow--;
                }

                // If an empty cell was found, search for the next non-empty cell above it
                if (emptyRow >= 0) {
                    writeRow = emptyRow; // This is where the next non-empty should go
                    let readRow = emptyRow - 1;
                    while (readRow >= 0 && grid[readRow][col] === null) {
                        readRow--;
                    }

                    // If a non-empty cell was found above
                    if (readRow >= 0) {
                        grid[writeRow][col] = grid[readRow][col]; // Move number down
                        grid[readRow][col] = null; // Set original position to empty
                    }
                    emptyRow--; // Continue searching upwards from the row above the one we just potentially filled
                }
            } // Finished shifting down existing numbers

            // Fill remaining nulls at the top with new random digits
            for (let r = 0; r < GRID_ROWS; r++) {
                if (grid[r][col] === null) {
                    grid[r][col] = getRandomDigit();
                } else {
                    break; // Stop once we hit non-null cells (they are all shifted down)
                }
            }
        });

        // Update the DOM display
        renderGrid();
    }


    function renderGrid() {
        console.log("Rendering grid updates");
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                 // Check if cell element exists before updating
                if (cellElements[r] && cellElements[r][c]) {
                    cellElements[r][c].textContent = grid[r][c];
                    // Ensure no 'selected' class remains after refill
                    cellElements[r][c].classList.remove('selected');
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
            winMessageElement.style.display = 'block'; // Show win message
            console.log("Game Won!");
            // Optionally disable further interaction
            gridElement.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            Object.values(binButtons).forEach(button => button.disabled = true);
        }
    }

    // --- Event Listeners Setup ---

    function setupEventListeners() {
        // Use event delegation on the grid container
        gridElement.addEventListener('mousedown', handleMouseDown);
        // Attach mousemove and mouseup to the document to handle dragging outside the grid
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);


        // Bin button listeners
        for (const binType in binButtons) {
            binButtons[binType].addEventListener('click', () => handleBinClick(binType));
        }
        console.log("Event listeners set up.");
    }

    // --- Start Game ---
    function startGame() {
        console.log("Starting game...");
        initializeGrid();
        scores = { W: 0, F: 0, D: 0, M: 0 }; // Reset scores
        updateScoreDisplay();
        clearSelectionHighlight();
        currentSelection = [];
        selectionStartCoords = null;
        selectionEndCoords = null;
        winMessageElement.style.display = 'none'; // Hide win message
        Object.values(binButtons).forEach(button => button.disabled = false); // Enable buttons
        setupEventListeners(); // Re-attach if they were removed on win
        console.log("Game ready.");
    }

    startGame(); // Initialize the game when the script loads

}); // End DOMContentLoaded
