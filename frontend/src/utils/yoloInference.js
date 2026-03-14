import * as ort from "onnxruntime-web";

// Classes from your custom dataset
export const YOLO_CLASSES = [
  "general_agents",
  "wheeled_assist",
  "non_wheeled_assist",
  "load_objects",
  "personal_transport",
];

// Helper to calculate IOU for Non-Maximum Suppression
function calculateIou(box1, box2) {
  const x1 = Math.max(box1[0], box2[0]);
  const y1 = Math.max(box1[1], box2[1]);
  const x2 = Math.min(box1[2], box2[2]);
  const y2 = Math.min(box1[3], box2[3]);
  const intersectionArea = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const box1Area = (box1[2] - box1[0]) * (box1[3] - box1[1]);
  const box2Area = (box2[2] - box2[0]) * (box2[3] - box2[1]);
  return intersectionArea / (box1Area + box2Area - intersectionArea);
}

// Non-Maximum Suppression to filter out overlapping boxes
function nonMaxSuppression(boxes, iouThreshold = 0.45) {
  const sortedBoxes = boxes.sort((a, b) => b.score - a.score);
  const selected = [];

  for (const currentBox of sortedBoxes) {
    let shouldSelect = true;
    for (const selectedBox of selected) {
      if (
        currentBox.class_id === selectedBox.class_id &&
        calculateIou(currentBox.box, selectedBox.box) > iouThreshold
      ) {
        shouldSelect = false;
        break;
      }
    }
    if (shouldSelect) {
      selected.push(currentBox);
    }
  }
  return selected;
}

export async function processImageWithModel(
  file,
  modelSession,
  width = 640,
  height = 640,
) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      try {
        // 1. Create a canvas to resize the image to 640x640
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        // Draw image scaled
        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height).data;

        // 2. Prepare the input tensor (1, 3, 640, 640)
        const redArray = new Float32Array(width * height);
        const greenArray = new Float32Array(width * height);
        const blueArray = new Float32Array(width * height);

        for (let i = 0; i < imageData.length; i += 4) {
          const pixelIndex = i / 4;
          // Normalize to 0-1
          redArray[pixelIndex] = imageData[i] / 255.0;
          greenArray[pixelIndex] = imageData[i + 1] / 255.0;
          blueArray[pixelIndex] = imageData[i + 2] / 255.0;
        }

        const transposedData = new Float32Array(3 * width * height);
        transposedData.set(redArray, 0);
        transposedData.set(greenArray, width * height);
        transposedData.set(blueArray, width * height * 2);

        const tensor = new ort.Tensor("float32", transposedData, [
          1,
          3,
          height,
          width,
        ]);

        // 3. Run Inference
        // The input name is usually "images" for YOLO exports
        const feeds = { images: tensor };
        const results = await modelSession.run(feeds);

        // The output is usually the first key in results
        const outputName = modelSession.outputNames[0];
        const outputData = results[outputName].data;
        const outputShape = results[outputName].dims; // e.g., [1, 9, 8400]

        // 4. Decode the output tensor into bounding boxes
        const numClasses = YOLO_CLASSES.length;
        const numAnchors = outputShape[2]; // 8400
        const boxes = [];

        const confidenceThreshold = 0.5; // Adjust this if needed

        // Output layout: [x_center, y_center, width, height, class_0, class_1, ...]
        for (let i = 0; i < numAnchors; i++) {
          let maxClassScore = 0;
          let classId = -1;

          // Find highest class confidence for this anchor
          for (let c = 0; c < numClasses; c++) {
            const score = outputData[(4 + c) * numAnchors + i];
            if (score > maxClassScore) {
              maxClassScore = score;
              classId = c;
            }
          }

          if (maxClassScore > confidenceThreshold) {
            const xc = outputData[0 * numAnchors + i];
            const yc = outputData[1 * numAnchors + i];
            const w = outputData[2 * numAnchors + i];
            const h = outputData[3 * numAnchors + i];

            // Convert from standard 640x640 coordinate space back to image percentage
            // so our frontend overlays work correctly
            const x1 = xc - w / 2;
            const y1 = yc - h / 2;
            const x2 = xc + w / 2;
            const y2 = yc + h / 2;

            const final_x_min = (x1 / width) * img.width;
            const final_y_min = (y1 / height) * img.height;
            const final_x_max = (x2 / width) * img.width;
            const final_y_max = (y2 / height) * img.height;

            boxes.push({
              class_id: classId,
              class_name: YOLO_CLASSES[classId],
              score: maxClassScore,
              box: [final_x_min, final_y_min, final_x_max, final_y_max],
              x_min: final_x_min,
              y_min: final_y_min,
              x_max: final_x_max,
              y_max: final_y_max,
            });
          }
        }

        // 5. Apply Non-Maximum Suppression
        const selectedBoxes = nonMaxSuppression(boxes);

        resolve({
          boxes: selectedBoxes,
          image_url: URL.createObjectURL(file), // Generate an object URL we can render
          inference_time: 0.1, // Simulated or we can calculate actual
        });
      } catch (error) {
        console.error("Error during inference generation:", error);
        reject(error);
      }
    };
    img.onerror = () =>
      reject(new Error("Failed to load image for processing"));
    img.src = URL.createObjectURL(file);
  });
}
