package com.starlight.sanctuary

import android.annotation.SuppressLint
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.webkit.*
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.webkit.WebViewAssetLoader
import java.io.File

class MainActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "MainActivity"
        private const val NOTIFICATION_CHANNEL_ID = "hakdog_notifications"
    }

    private lateinit var webView: WebView
    private lateinit var assetLoader: WebViewAssetLoader
    private lateinit var updateManager: KiroUpdateManager

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        updateManager = KiroUpdateManager(this)

        webView = WebView(this)
        setContentView(webView)

        createNotificationChannel()
        requestNotificationPermission()

        setupAssetLoader()
        makeWindowFullscreen()

        setupWebViewSettings()
        setupWebViewClients()
        setupBackNavigation()

        // Register the JavaScript-to-Native Bridge under "AndroidHost"
        webView.addJavascriptInterface(AndroidBridge(this), "AndroidHost")

        // Load via WebViewAssetLoader HTTPS domain
        loadSanctuaryUrl()

        // Non-intrusive background check for OTA updates on launch
        performStartupUpdateCheck()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = "Kiro Care & Update Notifications"
            val descriptionText = "Alerts about Kiro's wellbeing, OTA updates, and celestial transmissions."
            val importance = NotificationManager.IMPORTANCE_DEFAULT
            val channel = NotificationChannel(NOTIFICATION_CHANNEL_ID, name, importance).apply {
                description = descriptionText
            }
            val notificationManager: NotificationManager =
                getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= 33) {
            if (ContextCompat.checkSelfPermission(this, android.Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, arrayOf(android.Manifest.permission.POST_NOTIFICATIONS), 101)
            }
        }
    }

    /**
     * Configures the WebViewAssetLoader to serve files from local internal OTA storage
     * if an update has been extracted, or falls back to pre-bundled APK assets.
     */
    private fun setupAssetLoader() {
        val localUpdatePath = updateManager.getLocalUpdatePath()
        val builder = WebViewAssetLoader.Builder()

        if (localUpdatePath != null) {
            Log.i(TAG, "Loading assets from OTA internal storage: $localUpdatePath")
            builder.addPathHandler(
                "/assets/",
                WebViewAssetLoader.InternalStoragePathHandler(this, File(localUpdatePath))
            )
        } else {
            Log.i(TAG, "Loading pre-bundled APK assets")
            builder.addPathHandler(
                "/assets/",
                WebViewAssetLoader.AssetsPathHandler(this)
            )
        }

        assetLoader = builder.build()
    }

    private fun loadSanctuaryUrl() {
        webView.loadUrl("https://appassets.androidplatform.net/assets/index.html")
    }

    /**
     * Checks for new OTA updates silently in the background on startup.
     */
    private fun performStartupUpdateCheck() {
        updateManager.checkForUpdates(forceCheck = false) { result ->
            when (result) {
                is KiroUpdateManager.UpdateResult.Success -> {
                    Log.i(TAG, "Startup check: New OTA update ${result.version} downloaded and extracted.")
                    runOnUiThread {
                        sendSystemNotification(
                            "Celestial Update Ready! ✨",
                            "Version ${result.version} is installed. Tap 'Sync' or reopen to apply."
                        )
                        // Trigger in-app banner if UI is active
                        webView.evaluateJavascript(
                            "javascript:if(typeof showGitHubSyncBanner === 'function') showGitHubSyncBanner('v${result.version} ready! Tap to reload.');",
                            null
                        )
                    }
                }
                is KiroUpdateManager.UpdateResult.UpToDate -> {
                    Log.d(TAG, "Startup check: App is already up-to-date (${updateManager.getCurrentVersion()}).")
                }
                is KiroUpdateManager.UpdateResult.Error -> {
                    Log.w(TAG, "Startup OTA update check warning: ${result.message}")
                }
            }
        }
    }

    private fun makeWindowFullscreen() {
        try {
            WindowCompat.setDecorFitsSystemWindows(window, false)
            window.statusBarColor = Color.TRANSPARENT
            window.navigationBarColor = Color.TRANSPARENT

            window.decorView.post {
                try {
                    val controller = WindowCompat.getInsetsController(window, window.decorView)
                    controller?.let {
                        it.hide(WindowInsetsCompat.Type.statusBars() or WindowInsetsCompat.Type.navigationBars())
                        it.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebViewSettings() {
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true

            // Security Hardening: Strict sandbox isolation
            allowFileAccess = false
            allowContentAccess = false
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW

            mediaPlaybackRequiresUserGesture = false
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
            useWideViewPort = true
            loadWithOverviewMode = true
            cacheMode = WebSettings.LOAD_DEFAULT
        }

        if (BuildConfig.DEBUG) {
            WebView.setWebContentsDebuggingEnabled(true)
        }
    }

    private fun setupWebViewClients() {
        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView?,
                request: WebResourceRequest?
            ): WebResourceResponse? {
                return request?.url?.let { assetLoader.shouldInterceptRequest(it) }
            }

            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false
                val isMainFrame = request?.isForMainFrame ?: true
                if (isMainFrame && (url.startsWith("http://") || url.startsWith("https://"))) {
                    if (!url.contains("appassets.androidplatform.net")) {
                        try {
                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                            startActivity(intent)
                            return true
                        } catch (e: Exception) {
                            e.printStackTrace()
                        }
                    }
                }
                return false
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onGeolocationPermissionsShowPrompt(origin: String?, callback: GeolocationPermissions.Callback?) {
                if (origin != null && origin.startsWith("https://appassets.androidplatform.net")) {
                    callback?.invoke(origin, true, false)
                } else {
                    callback?.invoke(origin, false, false)
                }
            }
        }
    }

    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    finish()
                }
            }
        })
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
        webView.evaluateJavascript("javascript:if(window.appLifecycle && typeof window.appLifecycle.resumeGame === 'function') window.appLifecycle.resumeGame();", null)
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
        webView.evaluateJavascript("javascript:if(window.appLifecycle && typeof window.appLifecycle.pauseGame === 'function') window.appLifecycle.pauseGame();", null)
    }

    /**
     * Dispatches a system notification with pending intent to open MainActivity.
     */
    fun sendSystemNotification(title: String, message: String) {
        try {
            val notificationId = (System.currentTimeMillis() % 10000).toInt()
            val intent = Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            }
            val pendingIntent = PendingIntent.getActivity(
                this,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val builder = NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText(message)
                .setContentIntent(pendingIntent)
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)

            if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED || Build.VERSION.SDK_INT < 33) {
                NotificationManagerCompat.from(this).notify(notificationId, builder.build())
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to post notification", e)
        }
    }

    /**
     * JavaScript-to-Native Bridge registered as "AndroidHost"
     */
    inner class AndroidBridge(private val context: Context) {

        @JavascriptInterface
        fun sendNotification(title: String, message: String) {
            sendSystemNotification(title, message)
        }

        @JavascriptInterface
        fun getInstalledVersion(): String {
            return updateManager.getCurrentVersion()
        }

        @JavascriptInterface
        fun isUsingOtaUpdate(): Boolean {
            return updateManager.hasValidLocalUpdate()
        }

        /**
         * Triggered manually from the web UI (e.g. Sync button).
         */
        @JavascriptInterface
        fun checkForUpdates() {
            updateManager.checkForUpdates(forceCheck = true) { result ->
                runOnUiThread {
                    when (result) {
                        is KiroUpdateManager.UpdateResult.Success -> {
                            Toast.makeText(context, "Update ${result.version} downloaded! Applying...", Toast.LENGTH_SHORT).show()
                            setupAssetLoader()
                            loadSanctuaryUrl()
                        }
                        is KiroUpdateManager.UpdateResult.UpToDate -> {
                            Toast.makeText(context, "You are on the latest version (${updateManager.getCurrentVersion()}) ✨", Toast.LENGTH_SHORT).show()
                            webView.evaluateJavascript(
                                "javascript:if(typeof showPopToast === 'function') showPopToast('App is fully up-to-date! ✨', 3000);",
                                null
                            )
                        }
                        is KiroUpdateManager.UpdateResult.Error -> {
                            Toast.makeText(context, "Update check failed: ${result.message}", Toast.LENGTH_SHORT).show()
                            webView.evaluateJavascript(
                                "javascript:if(typeof showPopToast === 'function') showPopToast('Offline / could not check update', 3000);",
                                null
                            )
                        }
                    }
                }
            }
        }

        @JavascriptInterface
        fun applyUpdateAndReload() {
            runOnUiThread {
                setupAssetLoader()
                loadSanctuaryUrl()
            }
        }

        @JavascriptInterface
        fun clearOtaUpdates() {
            updateManager.clearUpdates()
            runOnUiThread {
                setupAssetLoader()
                loadSanctuaryUrl()
                Toast.makeText(context, "Reverted to default APK assets", Toast.LENGTH_SHORT).show()
            }
        }
    }
}

