package com.starlight.sanctuary

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.zip.ZipInputStream

class KiroUpdateManager(private val context: Context) {

    companion object {
        private const val TAG = "KiroUpdateManager"
        const val DEFAULT_REPO = "Patkik/GoodnightYangiee"
        private const val PREFS_NAME = "kiro_ota_prefs"
        private const val KEY_INSTALLED_VERSION = "installed_ota_version"
        private const val KEY_LAST_CHECK_TIME = "last_check_timestamp"
        private const val UPDATE_DIR_NAME = "kiro_updates"
        private const val STAGING_DIR_NAME = "kiro_updates_staging"
    }

    private val prefs: SharedPreferences =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    val updateDir: File = File(context.filesDir, UPDATE_DIR_NAME)
    private val stagingDir: File = File(context.filesDir, STAGING_DIR_NAME)

    sealed class UpdateResult {
        data class Success(val version: String, val releaseNotes: String) : UpdateResult()
        object UpToDate : UpdateResult()
        data class Error(val message: String, val exception: Throwable? = null) : UpdateResult()
    }

    /**
     * Returns the currently active version string.
     * Hierarchy:
     * 1. Saved OTA version tag in SharedPreferences (if update files are present)
     * 2. version field in bundled version.json
     * 3. BuildConfig.VERSION_NAME
     */
    fun getCurrentVersion(): String {
        val otaVersion = prefs.getString(KEY_INSTALLED_VERSION, null)
        if (!otaVersion.isNullOrEmpty() && hasValidLocalUpdate()) {
            return otaVersion
        }

        // Fallback: Read version.json from assets
        try {
            context.assets.open("version.json").use { stream ->
                val jsonStr = stream.bufferedReader().use { it.readText() }
                val json = JSONObject(jsonStr)
                val ver = json.optString("version", "")
                if (ver.isNotEmpty()) return ver
            }
        } catch (e: Exception) {
            Log.w(TAG, "Could not read version from bundled version.json: ${e.message}")
        }

        return BuildConfig.VERSION_NAME
    }

    /**
     * Checks if a valid OTA update folder exists with index.html
     */
    fun hasValidLocalUpdate(): Boolean {
        return updateDir.exists() && File(updateDir, "index.html").exists()
    }

    /**
     * Returns the absolute path of the local update directory if valid,
     * or null if we should fall back to APK bundled assets.
     */
    fun getLocalUpdatePath(): String? {
        return if (hasValidLocalUpdate()) {
            updateDir.absolutePath
        } else {
            null
        }
    }

    /**
     * Checks GitHub API for the latest release, downloads and extracts dist.zip if new.
     * Runs asynchronously on a background thread.
     */
    fun checkForUpdates(
        repoUrl: String = DEFAULT_REPO,
        forceCheck: Boolean = false,
        onResult: (UpdateResult) -> Unit
    ) {
        Thread {
            try {
                Log.d(TAG, "Checking for updates from repository: $repoUrl")
                val apiUrl = "https://api.github.com/repos/$repoUrl/releases/latest"
                val connection = (URL(apiUrl).openConnection() as HttpURLConnection).apply {
                    requestMethod = "GET"
                    setRequestProperty("User-Agent", "KiroSanctuary-AndroidApp/${BuildConfig.VERSION_NAME}")
                    setRequestProperty("Accept", "application/vnd.github.v3+json")
                    connectTimeout = 15000
                    readTimeout = 15000
                }

                val responseCode = connection.responseCode
                if (responseCode != HttpURLConnection.HTTP_OK) {
                    val errorMsg = "GitHub API returned HTTP $responseCode"
                    Log.w(TAG, errorMsg)
                    onResult(UpdateResult.Error(errorMsg))
                    return@Thread
                }

                val jsonResponse = connection.inputStream.bufferedReader().use { it.readText() }
                val releaseJson = JSONObject(jsonResponse)

                val latestTagName = releaseJson.optString("tag_name", "").trim()
                val releaseNotes = releaseJson.optString("body", "Updated celestial assets & audio")
                val currentVer = getCurrentVersion().trim()

                Log.d(TAG, "Current Version: $currentVer | Latest Tag on GitHub: $latestTagName")

                // Normalize version comparison (e.g. "v1.0.6" vs "1.0.6")
                val normalizedCurrent = currentVer.removePrefix("v").trim()
                val normalizedLatest = latestTagName.removePrefix("v").trim()

                if (latestTagName.isEmpty()) {
                    onResult(UpdateResult.Error("No valid tag found in latest release"))
                    return@Thread
                }

                if (!forceCheck && (latestTagName == currentVer || normalizedLatest == normalizedCurrent)) {
                    Log.d(TAG, "App is already up to date ($currentVer).")
                    prefs.edit().putLong(KEY_LAST_CHECK_TIME, System.currentTimeMillis()).apply()
                    onResult(UpdateResult.UpToDate)
                    return@Thread
                }

                // Locate dist.zip or fallback to GitHub zipball archive
                val downloadUrl = findDownloadUrl(releaseJson, repoUrl, latestTagName)
                if (downloadUrl.isEmpty()) {
                    val msg = "No valid download source found for release $latestTagName"
                    Log.w(TAG, msg)
                    onResult(UpdateResult.Error(msg))
                    return@Thread
                }

                Log.d(TAG, "Downloading OTA package from: $downloadUrl")
                downloadAndExtractUpdate(downloadUrl)

                // Validate downloaded package
                if (File(updateDir, "index.html").exists()) {
                    prefs.edit()
                        .putString(KEY_INSTALLED_VERSION, latestTagName)
                        .putLong(KEY_LAST_CHECK_TIME, System.currentTimeMillis())
                        .apply()

                    Log.i(TAG, "OTA Update successfully installed: $latestTagName")
                    onResult(UpdateResult.Success(latestTagName, releaseNotes))
                } else {
                    val err = "OTA package extraction failed: index.html missing"
                    Log.e(TAG, err)
                    onResult(UpdateResult.Error(err))
                }

            } catch (e: Exception) {
                Log.e(TAG, "Error checking or applying OTA update", e)
                onResult(UpdateResult.Error(e.message ?: "Unknown OTA error", e))
            }
        }.start()
    }

    /**
     * Finds download URL: checks for dist.zip asset first, falls back to release zipball or tag archive.
     */
    private fun findDownloadUrl(releaseJson: JSONObject, repoUrl: String, tagName: String): String {
        // 1. Check for dedicated dist.zip asset attached to release
        val assets = releaseJson.optJSONArray("assets")
        if (assets != null) {
            for (i in 0 until assets.length()) {
                val asset = assets.optJSONObject(i) ?: continue
                val name = asset.optString("name", "")
                if (name.equals("dist.zip", ignoreCase = true) || name.endsWith(".zip", ignoreCase = true)) {
                    val url = asset.optString("browser_download_url", "")
                    if (url.isNotEmpty()) return url
                }
            }
        }

        // 2. Fallback to GitHub's auto-generated zipball URL for the release
        val zipball = releaseJson.optString("zipball_url", "")
        if (zipball.isNotEmpty()) return zipball

        // 3. Fallback to tag archive download
        return "https://github.com/$repoUrl/archive/refs/tags/$tagName.zip"
    }

    /**
     * Downloads and extracts zip to a clean staging directory first,
     * then locates index.html and populates updateDir cleanly.
     * Includes Zip Slip vulnerability protection.
     */
    private fun downloadAndExtractUpdate(urlString: String) {
        // Clean staging directory
        if (stagingDir.exists()) stagingDir.deleteRecursively()
        stagingDir.mkdirs()

        val downloadConn = (URL(urlString).openConnection() as HttpURLConnection).apply {
            instanceFollowRedirects = true
            setRequestProperty("User-Agent", "KiroSanctuary-AndroidApp")
            setRequestProperty("Accept", "application/octet-stream, application/zip, */*")
            connectTimeout = 25000
            readTimeout = 35000
        }

        val canonicalStagingPath = stagingDir.canonicalPath

        ZipInputStream(downloadConn.inputStream.buffered()).use { zis ->
            var entry = zis.nextEntry
            while (entry != null) {
                val newFile = File(stagingDir, entry.name)

                // Zip Slip Path Traversal Protection
                val canonicalDestPath = newFile.canonicalPath
                if (!canonicalDestPath.startsWith(canonicalStagingPath + File.separator) &&
                    canonicalDestPath != canonicalStagingPath
                ) {
                    throw SecurityException("Zip entry is outside target dir: ${entry.name}")
                }

                if (entry.isDirectory) {
                    newFile.mkdirs()
                } else {
                    newFile.parentFile?.mkdirs()
                    FileOutputStream(newFile).use { fos ->
                        zis.copyTo(fos)
                    }
                }
                zis.closeEntry()
                entry = zis.nextEntry
            }
        }

        // Locate index.html anywhere within the extracted staging directory
        val indexFile = stagingDir.walkTopDown().firstOrNull { it.name == "index.html" && it.isFile }
        if (indexFile != null && indexFile.parentFile != null) {
            val contentDir = indexFile.parentFile!!
            if (updateDir.exists()) {
                updateDir.deleteRecursively()
            }
            updateDir.mkdirs()

            // Copy all extracted content into updateDir
            contentDir.copyRecursively(updateDir, overwrite = true)
            stagingDir.deleteRecursively()
        }
    }

    /**
     * Wipes downloaded updates and reverts to pre-bundled APK assets.
     */
    fun clearUpdates() {
        try {
            if (updateDir.exists()) updateDir.deleteRecursively()
            if (stagingDir.exists()) stagingDir.deleteRecursively()
            prefs.edit().remove(KEY_INSTALLED_VERSION).apply()
            Log.i(TAG, "OTA updates wiped; reverted to bundled APK assets.")
        } catch (e: Exception) {
            Log.e(TAG, "Error clearing OTA updates", e)
        }
    }
}
