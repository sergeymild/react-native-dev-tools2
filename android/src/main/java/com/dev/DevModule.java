package com.dev;

import android.app.Activity;
import android.content.Context;
import android.hardware.SensorManager;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.lifecycle.DefaultLifecycleObserver;
import androidx.lifecycle.LifecycleOwner;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.ShakeDetector;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.concurrent.TimeUnit;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okhttp3.ResponseBody;

@ReactModule(name = DevModule.NAME)
public class DevModule extends ReactContextBaseJavaModule implements DefaultLifecycleObserver {
  public static final String NAME = "DevTools";

  private final Logger logger;
  private final ShakeDetector shakeDetector;
  private boolean shakerEnabled = false;
  private boolean shakerStarted = false;

  public DevModule(ReactApplicationContext reactContext) {
    super(reactContext);
    logger = new Logger(new File(reactContext.getFilesDir(), "log.txt"));
    shakeDetector = new ShakeDetector(this::sendEvent);
  }

  @Override
  @NonNull
  public String getName() {
    return NAME;
  }

  @ReactMethod
  void enableShaker(boolean enabled, boolean deleteLogFile, Promise promise) {
    Activity activity = getCurrentActivity();
    if (activity == null) {
      promise.resolve(false);
      return;
    }
    activity.runOnUiThread(() -> {
      if (deleteLogFile) {
        if (logger.logFile.exists()) {
          if (!logger.logFile.delete()) {
            promise.resolve("errorDeleteLogFile");
          }
        }
      }
      shakerEnabled = enabled;
      Activity _activity = getCurrentActivity();
      if (_activity == null) return;
      LifecycleOwner currentActivity = (LifecycleOwner) _activity;
      if (enabled) {
        currentActivity.getLifecycle().addObserver(this);
        start();
      } else {
        currentActivity.getLifecycle().removeObserver(this);
        stop();
      }
      promise.resolve("success");
    });
  }

  @Override
  public void onStart(@NonNull LifecycleOwner owner) {
    System.out.println("🪇 onStart");
    start();
  }

  private void start() {
    if (shakerEnabled && !shakerStarted) {
      shakeDetector.start((SensorManager) getReactApplicationContext().getSystemService(Context.SENSOR_SERVICE));
      shakerStarted = true;
      System.out.println("🪇 started");
    }
  }

  private void stop() {
    if (shakerEnabled && shakerStarted) {
      shakeDetector.stop();
      shakerStarted = false;
      System.out.println("🪇 stopped");
    }
  }

  @Override
  public void onStop(@NonNull LifecycleOwner owner) {
    System.out.println("🪇 onStop");
    stop();
  }

  @ReactMethod
  void writeLog(@Nullable String message, Promise promise) {
    logger.writeLog(message, promise);
  }

  @ReactMethod
  void deleteLogFile(Promise promise) {
    logger.removeFile(promise);
  }

  @ReactMethod
  void logPath(Promise promise) {
    promise.resolve(logger.logFile.getAbsolutePath());
  }

  @ReactMethod
  void existsFile(Promise promise) {
    logger.handler.post(() -> {
      promise.resolve(logger.logFile.exists());
    });
  }

  @ReactMethod
  public void post(final ReadableMap options, final Promise promise) {
    try {
      URL url = new URL(options.getString("url"));
      OkHttpClient.Builder builder1 = new OkHttpClient().newBuilder();
      builder1.readTimeout(20, TimeUnit.SECONDS);
      OkHttpClient client = builder1.build();
      MultipartBody.Builder builder = new MultipartBody.Builder().setType(MultipartBody.FORM);

      if (!logger.logFile.exists()) {
        WritableMap map = Arguments.createMap();
        map.putString("type", "error");
        map.putString("error", "fileIsNoExists");
        promise.resolve(map);
        return;
      }

      MediaType filetype = MediaType.parse("txt");
      builder.addFormDataPart(
        "file",
        logger.logFile.getName(),
        RequestBody.create(filetype, logger.logFile)
      );

      Request.Builder postBuilder = new Request.Builder()
        .url(url)
        .post(builder.build());

      client.newCall(postBuilder.build()).enqueue(new Callback() {
        @Override
        public void onFailure(final Call call, final IOException e) {
          WritableMap map = Arguments.createMap();
          map.putString("type", "error");
          map.putString("error", e.toString());
          promise.resolve(map);
        }

        @Override
        public void onResponse(@NonNull final Call call, @NonNull final Response response) throws IOException {
          WritableMap map = Arguments.createMap();
          if (!response.isSuccessful()) {
            map.putString("type", "error");
            map.putString("error", response.message());
            promise.resolve(map);
            return;
          }
          map.putInt("code", response.code());
          map.putString("type", "success");
          map.putBoolean("data", true);
          promise.resolve(map);
        }
      });

    } catch (MalformedURLException e) {
      WritableMap map = Arguments.createMap();
      map.putString("type", "error");
      map.putString("error", "MalformedURLException");
    }
  }


  private void sendEvent() {
    if (!getReactApplicationContext().hasActiveCatalystInstance()) return;
    getReactApplicationContext()
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
      .emit("DevToolsData", Arguments.createMap());
  }

}
