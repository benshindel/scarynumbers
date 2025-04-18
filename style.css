/* Import font */
@import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');

body {
    font-family: 'VT323', monospace;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 20px;
    background-color: #00004d; /* Dark blue background */
    color: #ffffff; /* White text */
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
}

h1 {
    color: #87ceeb; /* Light blue title */
    letter-spacing: 2px;
    text-shadow: 1px 1px 2px #000000;
    font-size: 2.5em;
    margin-bottom: 15px; /* Space below title */
}

/* Styles for the file selector */
.file-selector-container {
    margin-bottom: 15px;
    padding: 10px;
    background-color: #000033; /* Match game container bg */
    border: 1px solid #87ceeb; /* Match game container border */
    display: inline-block; /* Fit content */
}

.file-selector-container label {
    margin-right: 10px;
    font-size: 20px; /* Match button font size */
    color: #87ceeb; /* Light blue label */
}

#file-select {
    font-family: 'VT323', monospace; /* Apply retro font */
    font-size: 18px; /* Slightly smaller than label */
    background-color: #1a1a4d; /* Dark blue background */
    color: #ffffff; /* White text */
    border: 1px solid #87ceeb; /* Light blue border */
    padding: 5px 8px;
    /* Remove default appearance */
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    /* Add custom arrow or leave as is for retro feel */
    cursor: pointer;
}

#file-select:focus {
    outline: 1px dashed #87ceeb; /* Retro focus outline */
}

#game-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: #000033;
    padding: 20px;
    border: 2px solid #87ceeb;
    box-shadow: 0 0 10px #87ceeb;
}

#game-grid {
    display: grid;
    grid-template-columns: repeat(16, 35px);
    grid-template-rows: repeat(8, 35px);
    gap: 1px;
    border: 1px solid #555;
    margin-bottom: 20px;
    position: relative;
    background-color: #333;
    padding: 1px;
    cursor: crosshair;
}

.grid-cell {
    width: 35px;
    height: 35px;
    border: 1px solid #444;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 24px;
    font-weight: normal;
    background-color: #1a1a4d;
    color: #ffffff;
    transition: transform 0.1s ease-out, background-color 0.1s ease, border-color 0.1s ease;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    position: relative;
    z-index: 5;
}

.grid-cell.scaling {
    z-index: 10;
}

.grid-cell.selected {
    background-color: #3d5a80;
    border-color: #87ceeb;
    color: #fff;
    z-index: 15 !important;
}

#controls {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
}

#bin-buttons button {
    padding: 10px 15px;
    font-size: 20px;
    margin: 5px;
    cursor: pointer;
    border: 1px solid #87ceeb;
    background-color: #000066;
    color: #ffffff;
    transition: background-color 0.2s ease;
    position: relative;
    overflow: hidden;
    min-width: 100px;
    text-align: center;
    font-family: 'VT323', monospace;
}

#bin-buttons button:hover {
    background-color: #000099;
}

#bin-buttons button .fill {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 0%;
    background-color: #87ceeb;
    opacity: 0.6;
    z-index: 1;
    transition: width 0.3s ease-in-out;
}

#bin-buttons button .btn-text {
    position: relative;
    z-index: 2;
}

#win-message {
    margin-top: 20px;
    padding: 20px;
    background-color: #003300;
    color: #00ff00;
    border: 1px solid #00ff00;
    text-align: center;
    font-size: 24px;
    text-shadow: 1px 1px 2px #000000;
}

#win-message h2 {
    margin: 0;
    color: #00ff00;
}
