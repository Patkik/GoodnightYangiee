/**
 * app.js
 * Core Application Lifecycle & JavaScript-to-Native Bridge (AndroidHost)
 * Provides safe notification dispatching, background pause/resume hooks,
 * and Kiro vital triggers.
 */

/**
 * Triggers a native system notification through the AndroidHost bridge.
 * Includes a fallback to local browser console logs if running outside Android container.
 */
function sendNativeNotification(title, message) {
  if (window.AndroidHost && typeof window.AndroidHost.sendNotification === 'function') {
    try {
      window.AndroidHost.sendNotification(title, message);
    } catch (e) {
      console.warn('Native notification bridge error:', e);
    }
  } else {
    console.log(`[Bridge Simulation] Notification Triggered:\nTitle: ${title}\nMessage: ${message}`);
  }
}

/**
 * Bidirectional Native-to-JavaScript Lifecycle Bridge
 * Called by Kotlin MainActivity onPause() / onResume()
 */
window.appLifecycle = {
  isPaused: false,

  pauseGame: function () {
    this.isPaused = true;
    console.log('[Lifecycle] App minimized: Suspending WebGL and audio rendering.');
    if (window.synthEngine) {
      window.synthEngine.stopAll();
    }
  },

  resumeGame: function () {
    this.isPaused = false;
    console.log('[Lifecycle] App resumed: Restoring WebGL and audio state.');
    if (window.kiroSceneInstance) {
      window.kiroSceneInstance.resize();
    }
  }
};

/**
 * Kiro Wellbeing & Vitals Notification Triggers
 */
function onKiroWellRested() {
  sendNativeNotification(
    "Kiro feels amazing! ✨",
    "Kiro is sparkling with a sweet golden aura. Come say hello!"
  );
}

function checkKiroVitals(food, water) {
  if (food <= 10) {
    sendNativeNotification(
      "Tummy Grumbles! 🍬",
      "Kiro is feeling hungry... Feed them some sweet space star candies!"
    );
  } else if (water <= 10) {
    sendNativeNotification(
      "Thirsty Kiro! 💧",
      "Kiro needs some refreshing water! Give them a drink."
    );
  }
}

/**
 * Triggers OTA update check via Kotlin AndroidHost bridge if running in native wrapper.
 * Returns true if handled by native bridge.
 */
function checkNativeOTAUpdate() {
  if (window.AndroidHost && typeof window.AndroidHost.checkForUpdates === 'function') {
    try {
      window.AndroidHost.checkForUpdates();
      return true;
    } catch (e) {
      console.warn('Native OTA update trigger error:', e);
    }
  }
  return false;
}

function getNativeInstalledVersion() {
  if (window.AndroidHost && typeof window.AndroidHost.getInstalledVersion === 'function') {
    try {
      return window.AndroidHost.getInstalledVersion();
    } catch (e) {
      console.warn('Native getInstalledVersion error:', e);
    }
  }
  return null;
}

// Global exports
window.sendNativeNotification = sendNativeNotification;
window.onKiroWellRested = onKiroWellRested;
window.checkKiroVitals = checkKiroVitals;
window.checkNativeOTAUpdate = checkNativeOTAUpdate;
window.getNativeInstalledVersion = getNativeInstalledVersion;

