package io.github.azzoxmxyt.pacificdrive;

import android.content.Context;
import android.hardware.input.InputManager;
import android.os.Bundle;
import android.view.InputDevice;
import android.view.KeyEvent;
import android.view.MotionEvent;
import com.getcapacitor.BridgeActivity;
import org.json.JSONArray;
import org.json.JSONObject;

/** Forward Android game controllers when the WebView Gamepad API is unavailable. */
public class MainActivity extends BridgeActivity implements InputManager.InputDeviceListener {
    private InputManager inputManager;
    private int controllerId = -1;
    private final float[] axes = new float[4];
    private final boolean[] keys = new boolean[17];
    private float leftTrigger = 0, rightTrigger = 0;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        inputManager = (InputManager) getSystemService(Context.INPUT_SERVICE);
        inputManager.registerInputDeviceListener(this, null);
    }
    private boolean controller(InputDevice device) {
        return device != null && (device.supportsSource(InputDevice.SOURCE_GAMEPAD)
            || device.supportsSource(InputDevice.SOURCE_JOYSTICK));
    }
    private void selectController(int id) {
        if (controllerId != id) { clear(); controllerId = id; }
    }
    private void clear() {
        java.util.Arrays.fill(axes, 0); java.util.Arrays.fill(keys, false);
        leftTrigger = rightTrigger = 0;
    }
    private int button(int key) {
        switch (key) {
            case KeyEvent.KEYCODE_BUTTON_A: return 0;
            case KeyEvent.KEYCODE_BUTTON_B: return 1;
            case KeyEvent.KEYCODE_BUTTON_X: return 2;
            case KeyEvent.KEYCODE_BUTTON_Y: return 3;
            case KeyEvent.KEYCODE_BUTTON_L1: return 4;
            case KeyEvent.KEYCODE_BUTTON_R1: return 5;
            case KeyEvent.KEYCODE_BUTTON_L2: return 6;
            case KeyEvent.KEYCODE_BUTTON_R2: return 7;
            case KeyEvent.KEYCODE_BUTTON_SELECT: return 8;
            case KeyEvent.KEYCODE_BUTTON_START: return 9;
            case KeyEvent.KEYCODE_BUTTON_THUMBL: return 10;
            case KeyEvent.KEYCODE_BUTTON_THUMBR: return 11;
            case KeyEvent.KEYCODE_DPAD_UP: return 12;
            case KeyEvent.KEYCODE_DPAD_DOWN: return 13;
            case KeyEvent.KEYCODE_DPAD_LEFT: return 14;
            case KeyEvent.KEYCODE_DPAD_RIGHT: return 15;
            default: return -1;
        }
    }
    @Override public boolean dispatchKeyEvent(KeyEvent event) {
        int index = button(event.getKeyCode());
        if (!controller(event.getDevice()) || index < 0) return super.dispatchKeyEvent(event);
        selectController(event.getDeviceId());
        if (event.getAction() == KeyEvent.ACTION_DOWN) keys[index] = true;
        else if (event.getAction() == KeyEvent.ACTION_UP) keys[index] = false;
        publish(true); return true;
    }
    @Override public boolean dispatchGenericMotionEvent(MotionEvent event) {
        if (!controller(event.getDevice()) || !event.isFromSource(InputDevice.SOURCE_JOYSTICK)
            || event.getActionMasked() != MotionEvent.ACTION_MOVE) return super.dispatchGenericMotionEvent(event);
        selectController(event.getDeviceId());
        axes[0] = event.getAxisValue(MotionEvent.AXIS_X);
        axes[1] = event.getAxisValue(MotionEvent.AXIS_Y);
        boolean useZ = event.getDevice().getMotionRange(MotionEvent.AXIS_Z, event.getSource()) != null;
        axes[2] = event.getAxisValue(useZ ? MotionEvent.AXIS_Z : MotionEvent.AXIS_RX);
        axes[3] = event.getAxisValue(useZ ? MotionEvent.AXIS_RZ : MotionEvent.AXIS_RY);
        leftTrigger = Math.max(event.getAxisValue(MotionEvent.AXIS_LTRIGGER), event.getAxisValue(MotionEvent.AXIS_BRAKE));
        rightTrigger = Math.max(event.getAxisValue(MotionEvent.AXIS_RTRIGGER), event.getAxisValue(MotionEvent.AXIS_GAS));
        publish(true); return true;
    }
    private void publish(boolean connected) {
        if (bridge == null || bridge.getWebView() == null) return;
        try {
            JSONObject state = new JSONObject();
            state.put("connected", connected); state.put("id", controllerId);
            JSONArray a = new JSONArray(), b = new JSONArray();
            for (float value : axes) a.put(value);
            for (int i = 0; i < keys.length; i++) {
                float value = keys[i] ? 1 : i == 6 ? leftTrigger : i == 7 ? rightTrigger : 0;
                b.put(Math.max(0, Math.min(1, value)));
            }
            state.put("axes", a); state.put("buttons", b);
            String script = "window.dispatchEvent(new CustomEvent('pacific-native-gamepad',{detail:" + state + "}));";
            bridge.getWebView().post(() -> bridge.getWebView().evaluateJavascript(script, null));
        } catch (org.json.JSONException ignored) { /* Input payload contains only primitive values. */ }
    }
    @Override public void onInputDeviceRemoved(int id) {
        if (id == controllerId) { clear(); publish(false); controllerId = -1; }
    }
    @Override public void onInputDeviceAdded(int id) {}
    @Override public void onInputDeviceChanged(int id) {
        if (id == controllerId) { clear(); publish(false); }
    }
    @Override public void onPause() { clear(); publish(false); super.onPause(); }
    @Override public void onDestroy() {
        if (inputManager != null) inputManager.unregisterInputDeviceListener(this);
        super.onDestroy();
    }
}
