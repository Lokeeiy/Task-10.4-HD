document.addEventListener("DOMContentLoaded", () => {
    const socket = io(); 

    const canvas = document.getElementById("drawingCanvas");
    const ctx = canvas.getContext("2d");

    let drawing = false;
    let currentColor = "#000";
    let currentTool = "pen"; 
    let lineWidth = 2;

    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mousemove", draw);

    document.getElementById("eraseBtn").addEventListener("click", setTool);
    document.getElementById("penBtn").addEventListener("click", setTool);
    document.getElementById("rectangleBtn").addEventListener("click", setTool);
    document.getElementById("circleBtn").addEventListener("click", setTool);
    
    document.getElementById("colorPicker").addEventListener("input", changeColor);
    document.getElementById("lineWidthInput").addEventListener("input", changeLineWidth);

    const saveButton = document.getElementById("saveButton");
    saveButton.addEventListener("click", saveDrawing);

    function startDrawing(e) {
        drawing = true;
        draw(e); 
    }

    function stopDrawing() {
        drawing = false;
        socket.emit("stopDrawing");
    }

    function draw(e) {
        if (!drawing) return;

        const { offsetX, offsetY } = e;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = "round";
        ctx.strokeStyle = currentColor;

        if (currentTool === "pen") {
            ctx.lineTo(offsetX, offsetY);
            ctx.stroke();
            socket.emit("draw", { x: offsetX, y: offsetY, tool: currentTool, color: currentColor, lineWidth });
        } else if (currentTool === "erase") {
            ctx.clearRect(offsetX - 10, offsetY - 10, 20, 20); 
            socket.emit("erase", { x: offsetX, y: offsetY, tool: currentTool });
        } else if (currentTool === "rectangle") {
            const width = 50;
            const height = 30;
            ctx.clearRect(0, 0, canvas.width, canvas.height); 
            ctx.fillStyle = currentColor;
            ctx.fillRect(offsetX - width / 2, offsetY - height / 2, width, height);
            socket.emit("draw", { x: offsetX, y: offsetY, tool: currentTool, color: currentColor });
        } else if (currentTool === "circle") {
            const radius = 25;
            ctx.clearRect(0, 0, canvas.width, canvas.height); 
            ctx.fillStyle = currentColor;
            ctx.beginPath();
            ctx.arc(offsetX, offsetY, radius, 0, 2 * Math.PI);
            ctx.fill();
            socket.emit("draw", { x: offsetX, y: offsetY, tool: currentTool, color: currentColor });
        }
    }

    function setTool(e) {
        const selectedTool = e.target.id.replace("Btn", "");
        currentTool = selectedTool;
        if (selectedTool === "pen" || selectedTool === "erase") {

            canvas.style.cursor = "crosshair";
        } else {

            canvas.style.cursor = "default";
        }
    }

    function changeColor(e) {
        currentColor = e.target.value;
    }

    function changeLineWidth(e) {
        lineWidth = e.target.value;
    }

    function saveDrawing() {
        const imageFormat = prompt("Enter the image format (e.g., png, jpeg):").toLowerCase();

        if (["png", "jpeg"].includes(imageFormat)) {
            const imageData = canvas.toDataURL(`image/${imageFormat}`);
            const link = document.createElement("a");
            link.href = imageData;
            link.download = `drawing.${imageFormat}`;
            link.click();
        } else {
            alert("Invalid image format. Please enter 'png' or 'jpeg'.");
        }
    }
    socket.on("draw", (data) => {
        if (data.tool === "pen") {
            ctx.lineTo(data.x, data.y);
            ctx.lineWidth = data.lineWidth;
            ctx.strokeStyle = data.color;
            ctx.stroke();
        } else if (data.tool === "erase") {
            ctx.clearRect(data.x - 10, data.y - 10, 20, 20);
        } else if (data.tool === "rectangle") {
            const width = 50;
            const height = 30;
            ctx.fillStyle = data.color;
            ctx.fillRect(data.x - width / 2, data.y - height / 2, width, height);
        } else if (data.tool === "circle") {
            const radius = 25;
            ctx.fillStyle = data.color;
            ctx.beginPath();
            ctx.arc(data.x, data.y, radius, 0, 2 * Math.PI);
            ctx.fill();
        }
    });

    socket.on("stopDrawing", () => {
        ctx.beginPath();
    });
});
