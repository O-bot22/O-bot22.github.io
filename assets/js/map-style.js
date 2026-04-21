// Style Constants
const highlight_color = "#c9ffc9";
const gradient_hue = 200;
const hover_color = "#66ff66";
const selected_color = '#000000';

// newsest used reight and left gradient colors
const rgb1 = [255, 0, 0];
const rgb2 = [0,0,255];
const gradient_opacity = .7;


/**
 * Generates an HSL color along a gradient of a specific hue.
 * @param {number} value - The input number.
 * @param {number} min - The minimum value of the range.
 * @param {number} max - The maximum value of the range.
 * @param {number} hue - The hue angle (0-360).
 * @returns {string} - A CSS HSL color string.
 */
function getHueGradient(value, min, max, hue) {
    // 1. Clamp the value to ensure it stays within the min/max bounds
    // const clamped = Math.max(min, Math.min(max, value));
    
    // 2. Calculate the percentage (0 to 1) of the value within the range
    const range = max - min;
    const percentage = range === 0 ? 0 : (value - min) / range;
    
    // 3. Map the percentage to Lightness (e.g., 90% is light, 30% is dark)
    // Adjust these numbers to change how "light" or "dark" the gradient gets
    const lightness = 90 - (percentage * 60); 
    
    return `hsl(${hue}, 100%, ${lightness}%)`;
}

// could add multi color if needed
/**
 * Maps a value to a color along a multi-stop gradient (RGB).
 */
function getMultiColorGradient(value, min, max, color1, color2, color3) {
    // 1. Normalize the value to a 0-1 scale
    const clamped = Math.max(min, Math.min(max, value));
    const range = max - min;
    let fade = range === 0 ? 0 : (clamped - min) / range;

    let start = color1;
    let end = color2;

    // 2. If we have 3 colors, decide which half of the range we are in
    if (color3) {
        fade = fade * 2; // Split into two 0-1 ranges
        if (fade >= 1) {
            fade -= 1;     // Second half (color2 to color3)
            start = color2;
            end = color3;
        } else {
            // First half (color1 to color2)
            start = color1;
            end = color2;
        }
    }

    // 2.5 Parse strings for fading
    const start_rgb = {
        r: parseInt(start.slice(1, 3), 16),
        g: parseInt(start.slice(3, 5), 16),
        b: parseInt(start.slice(5, 7), 16),
    };
    const end_rgb = {
        r: parseInt(end.slice(1, 3), 16),
        g: parseInt(end.slice(3, 5), 16),
        b: parseInt(end.slice(5, 7), 16),
    };

    // 3. Interpolate the R, G, and B values
    const r = Math.round(start_rgb.r + (end_rgb.r - start_rgb.r) * fade);
    const g = Math.round(start_rgb.g + (end_rgb.g - start_rgb.g) * fade);
    const b = Math.round(start_rgb.b + (end_rgb.b - start_rgb.b) * fade);

    return `rgb(${r}, ${g}, ${b})`;
}

function getRainbowGradient(value, min, max) {
    const clamped = Math.max(min, Math.min(max, value));
    const range = max - min;
    let d = range === 0 ? 0 : (clamped - min) / range;
    if (max === min) {
        d = .5; // default to middle color if no range
    }
    // find a color d% between a1 and a2
    const rgd_array = rgb1.map((p, i) => Math.floor(rgb1[i] + d * (rgb2[i] - rgb1[i])))
    return `rgba(${rgd_array.join(",")}, 1)`
}

export { getHueGradient, getMultiColorGradient, getRainbowGradient, highlight_color, hover_color, selected_color, gradient_opacity };