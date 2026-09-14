package com.synking;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.PointF;
import android.graphics.Rect;
import android.net.Uri;
import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.face.Face;
import com.google.mlkit.vision.face.FaceContour;
import com.google.mlkit.vision.face.FaceDetection;
import com.google.mlkit.vision.face.FaceDetector;
import com.google.mlkit.vision.face.FaceDetectorOptions;
import com.google.mlkit.vision.face.FaceLandmark;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.util.List;

public class FaceDetectionModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;

    public FaceDetectionModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    @NonNull
    public String getName() {
        return "FaceDetection";
    }

    public static InputImage getInputImage(ReactApplicationContext reactContext, String url)
            throws IOException {
        if (url == null || url.trim().isEmpty()) {
            throw new IOException("Empty image path or URI");
        }

        if (url.startsWith("http://") || url.startsWith("https://")) {
            URL urlInput = new URL(url);
            Bitmap image = BitmapFactory.decodeStream(urlInput.openConnection().getInputStream());
            if (image == null) throw new IOException("Failed to decode remote image");
            return InputImage.fromBitmap(image, 0);
        }

        Uri uri = Uri.parse(url);
        String scheme = uri.getScheme();

        // Handle raw filesystem paths or file:// URIs
        if (scheme == null || "file".equalsIgnoreCase(scheme)) {
            String path = uri.getPath();
            if (path != null) {
                File file = new File(path);
                if (file.exists()) {
                    return InputImage.fromFilePath(reactContext, Uri.fromFile(file));
                }
            }
        }

        // Try standard Android ContentResolver / fromFilePath
        try {
            return InputImage.fromFilePath(reactContext, uri);
        } catch (Exception e) {
            // Fallback: Open InputStream directly via ContentResolver
            InputStream is = reactContext.getContentResolver().openInputStream(uri);
            if (is != null) {
                Bitmap bmp = BitmapFactory.decodeStream(is);
                is.close();
                if (bmp != null) {
                    return InputImage.fromBitmap(bmp, 0);
                }
            }
            throw new IOException("Failed to load InputImage from: " + url, e);
        }
    }

    private FaceDetectorOptions getOptions(ReadableMap map) {
        FaceDetectorOptions.Builder builder = new FaceDetectorOptions.Builder();
        if (map != null) {
            if (map.hasKey("performanceMode") && "accurate".equals(map.getString("performanceMode"))) {
                builder.setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_ACCURATE);
            } else {
                builder.setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_FAST);
            }

            if (map.hasKey("landmarkMode") && "all".equals(map.getString("landmarkMode"))) {
                builder.setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_ALL);
            } else {
                builder.setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_NONE);
            }

            if (map.hasKey("contourMode") && "all".equals(map.getString("contourMode"))) {
                builder.setContourMode(FaceDetectorOptions.CONTOUR_MODE_ALL);
            } else {
                builder.setContourMode(FaceDetectorOptions.CONTOUR_MODE_NONE);
            }

            if (map.hasKey("classificationMode") && "all".equals(map.getString("classificationMode"))) {
                builder.setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_ALL);
            } else {
                builder.setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_NONE);
            }

            if (map.hasKey("minFaceSize")) {
                double minFaceSize = map.getDouble("minFaceSize");
                if (minFaceSize > 0 && minFaceSize <= 1) {
                    builder.setMinFaceSize((float) minFaceSize);
                }
            }

            if (map.hasKey("trackingEnabled") && map.getBoolean("trackingEnabled")) {
                builder.enableTracking();
            }
        }
        return builder.build();
    }

    private ReadableMap rectToMap(Rect rect) {
        WritableMap map = Arguments.createMap();
        map.putInt("width", rect.width());
        map.putInt("height", rect.height());
        map.putInt("top", rect.top);
        map.putInt("left", rect.left);
        return map;
    }

    private ReadableMap pointToMap(PointF point) {
        WritableMap map = Arguments.createMap();
        map.putDouble("x", point.x);
        map.putDouble("y", point.y);
        return map;
    }

    private ReadableMap faceToMap(Face face, ReadableMap options) {
        WritableMap map = Arguments.createMap();
        map.putMap("frame", rectToMap(face.getBoundingBox()));
        map.putDouble("rotationX", face.getHeadEulerAngleX()); // Pitch (tilt up/down)
        map.putDouble("rotationY", face.getHeadEulerAngleY()); // Yaw (turn left/right)
        map.putDouble("rotationZ", face.getHeadEulerAngleZ()); // Roll (tilt side-to-side)

        if (face.getSmilingProbability() != null) {
            map.putDouble("smilingProbability", face.getSmilingProbability());
        }
        if (face.getLeftEyeOpenProbability() != null) {
            map.putDouble("leftEyeOpenProbability", face.getLeftEyeOpenProbability());
        }
        if (face.getRightEyeOpenProbability() != null) {
            map.putDouble("rightEyeOpenProbability", face.getRightEyeOpenProbability());
        }
        if (face.getTrackingId() != null) {
            map.putInt("trackingID", face.getTrackingId());
        }
        return map;
    }

    @ReactMethod
    public void detect(String url, final ReadableMap optionsMap, final Promise promise) {
        try {
            InputImage image = getInputImage(this.reactContext, url);
            FaceDetectorOptions options = getOptions(optionsMap);
            FaceDetector detector = FaceDetection.getClient(options);

            detector.process(image)
                    .addOnSuccessListener(new OnSuccessListener<List<Face>>() {
                        @Override
                        public void onSuccess(List<Face> faces) {
                            WritableArray result = Arguments.createArray();
                            if (faces != null) {
                                for (Face face : faces) {
                                    result.pushMap(faceToMap(face, optionsMap));
                                }
                            }
                            promise.resolve(result);
                        }
                    })
                    .addOnFailureListener(new OnFailureListener() {
                        @Override
                        public void onFailure(@NonNull Exception e) {
                            promise.reject("Face detection processing failed", e.getMessage(), e);
                        }
                    });
        } catch (Exception e) {
            promise.reject("Face detection IO failed", e.getMessage(), e);
        }
    }
}
