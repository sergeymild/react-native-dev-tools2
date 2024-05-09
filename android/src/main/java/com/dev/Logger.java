package com.dev;

import android.os.Handler;
import android.os.HandlerThread;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.Promise;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;

public class Logger {
  File logFile;
  public Handler handler;

  public Logger(File logFile) {
    this.logFile = logFile;
    HandlerThread thread = new HandlerThread("DevToolsLoggerQueue");
    thread.start();
    handler = new Handler(thread.getLooper());
  }

  public void writeLog(@Nullable String message, @Nullable Promise promise) {
    if (message == null) {
      if (promise != null) promise.resolve(false);
      return;
    }
    handler.post(() -> {
      if (!logFile.exists()) {
        try {
          boolean isCreated = logFile.createNewFile();
          if (!isCreated) {
            throw new RuntimeException("Error create log file at path: " + logFile.getAbsolutePath());
          }
        } catch (IOException e) {
          throw new RuntimeException(e);
        }
      }

      try {
        FileOutputStream fileOutputStream = new FileOutputStream(logFile, true);
        fileOutputStream.write(message.getBytes(StandardCharsets.UTF_8));
        fileOutputStream.write("\n".getBytes(StandardCharsets.UTF_8));
        fileOutputStream.close();
        if (promise != null) promise.resolve(true);
      } catch (IOException e) {
        throw new RuntimeException(e);
      }
    });
  }

  public void removeFile(Promise promise) {
    handler.post(() -> {
      if (logFile.exists()) {
        logFile.delete();
        promise.resolve(true);
        return;
      }
      promise.resolve(false);
    });
  }
}
