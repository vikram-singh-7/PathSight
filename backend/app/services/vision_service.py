import base64
import io
import time
import os
from datetime import datetime
from typing import List, Optional, Tuple
from app.models.schemas import DetectionItem, DetectionResponse

# Known obstacle classes from COCO dataset (relevant to campus navigation & mobility)
OBSTACLE_CLASSES = {
    "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck",
    "boat", "traffic light", "fire hydrant", "stop sign", "parking meter", "bench",
    "dog", "cat", "horse", "sheep", "cow", "elephant", "bear", "zebra", "giraffe",
    "backpack", "umbrella", "handbag", "suitcase", "chair", "couch", "potted plant",
    "bed", "dining table", "toilet", "tv", "laptop", "refrigerator", "bottle", "cup"
}

# High-priority physical obstruction classes
HAZARD_CLASSES = {
    "person", "chair", "couch", "dining table", "bench", "bicycle", "motorcycle",
    "car", "truck", "bus", "dog", "backpack", "suitcase", "fire hydrant", "potted plant"
}

class VisionService:
    def __init__(self):
        self.model = None
        self.is_loaded = False
        self.load_error: Optional[str] = None
        self.device = "cpu"
        self._try_load_model()

    def _try_load_model(self):
        try:
            from ultralytics import YOLO
            import torch

            self.device = "cuda" if torch.cuda.is_available() else "cpu"

            # Resolve model weights path
            curr_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            model_path = os.path.join(curr_dir, "models", "yolov8n.pt")
            if not os.path.exists(model_path):
                model_path = os.path.join(os.path.dirname(curr_dir), "yolov8n.pt")
            if not os.path.exists(model_path):
                model_path = "yolov8n.pt"

            self.model = YOLO(model_path)
            self.is_loaded = True
            self.load_error = None
            print(f"YOLOv8n model initialized successfully from {model_path} on {self.device}.")
        except Exception as e:
            self.is_loaded = False
            self.load_error = str(e)
            print(f"Warning: YOLOv8 model could not be loaded: {e}")

    def decode_image(self, base64_str: str):
        if "," in base64_str:
            base64_str = base64_str.split(",")[1]
        image_bytes = base64.b64decode(base64_str)
        from PIL import Image
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        return image

    def get_status(self):
        return {
            "model_name": "YOLOv8n (Pretrained COCO)",
            "is_loaded": self.is_loaded,
            "device": self.device,
            "load_error": self.load_error,
            "classes_tracked": len(OBSTACLE_CLASSES),
        }

    def detect(self, base64_image: str, confidence_threshold: float = 0.35) -> DetectionResponse:
        start_time = time.time()
        
        if not self.is_loaded:
            self._try_load_model()

        if not self.is_loaded or self.model is None:
            return DetectionResponse(
                timestamp=datetime.utcnow(),
                detections=[],
                primary_hazard=None,
                speech_summary="AI Vision model is loading. Please stand by.",
                processing_ms=round((time.time() - start_time) * 1000, 1)
            )

        try:
            image = self.decode_image(base64_image)
            img_width, img_height = image.size

            # Run real YOLO inference with optimized input size
            results = self.model.predict(
                source=image,
                conf=confidence_threshold,
                imgsz=416,
                device=self.device,
                verbose=False
            )

            detections: List[DetectionItem] = []
            primary_hazard: Optional[str] = None

            if results and len(results) > 0:
                result = results[0]
                boxes = result.boxes

                for box in boxes:
                    cls_id = int(box.cls[0].item())
                    label = result.names.get(cls_id, f"object_{cls_id}")
                    confidence = round(float(box.conf[0].item()), 2)
                    
                    # Coordinates normalized [ymin, xmin, ymax, xmax]
                    xyxy = box.xyxy[0].tolist()
                    xmin = max(0.0, xyxy[0] / img_width)
                    ymin = max(0.0, xyxy[1] / img_height)
                    xmax = min(1.0, xyxy[2] / img_width)
                    ymax = min(1.0, xyxy[3] / img_height)

                    box_width = xmax - xmin
                    box_height = ymax - ymin
                    box_area = box_width * box_height
                    center_x = (xmin + xmax) / 2.0

                    # Determine spatial position in horizontal field of view
                    if center_x < 0.36:
                        position = "left"
                    elif center_x > 0.64:
                        position = "right"
                    else:
                        position = "center"

                    # Determine visual proximity estimate based on bounding box visual footprint
                    # (Explicitly visual coverage, not a calibrated metric distance)
                    if box_area > 0.22 or box_height > 0.55:
                        proximity = "approaching"
                    elif box_area > 0.08 or box_height > 0.28:
                        proximity = "nearby"
                    else:
                        proximity = "distant"

                    is_obs = label in OBSTACLE_CLASSES
                    is_hazard = label in HAZARD_CLASSES

                    # Assistive phrasing
                    pos_text = "ahead center" if position == "center" else f"on your {position}"
                    advisory = f"{label.capitalize()} {pos_text} ({proximity} visual range)."

                    # Highlight the closest hazard in front of the user
                    if is_hazard and proximity in ("approaching", "nearby") and not primary_hazard:
                        primary_hazard = f"Caution: {label} {pos_text}."

                    detections.append(
                        DetectionItem(
                            label=label,
                            confidence=confidence,
                            box=[round(ymin, 3), round(xmin, 3), round(ymax, 3), round(xmax, 3)],
                            position=position,
                            visual_proximity=proximity,
                            is_obstacle=is_obs,
                            advisory_text=advisory
                        )
                    )

            # Sort detections: center and closer objects first
            detections.sort(
                key=lambda d: (
                    0 if d.position == "center" else 1,
                    0 if d.visual_proximity == "approaching" else 1 if d.visual_proximity == "nearby" else 2,
                    -d.confidence
                )
            )

            # Natural speech summary
            if not detections:
                speech_summary = "Path clear in camera view."
            elif primary_hazard:
                speech_summary = primary_hazard
            else:
                top_items = [d.label for d in detections[:2]]
                speech_summary = f"Detected {', '.join(top_items)} in view."

            processing_ms = round((time.time() - start_time) * 1000, 1)

            return DetectionResponse(
                timestamp=datetime.utcnow(),
                detections=detections,
                primary_hazard=primary_hazard,
                speech_summary=speech_summary,
                processing_ms=processing_ms
            )

        except Exception as e:
            return DetectionResponse(
                timestamp=datetime.utcnow(),
                detections=[],
                primary_hazard=None,
                speech_summary=f"Inference error: {str(e)[:60]}",
                processing_ms=round((time.time() - start_time) * 1000, 1)
            )

# Global singleton
vision_service = VisionService()
