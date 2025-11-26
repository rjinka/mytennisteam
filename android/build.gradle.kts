// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    id("com.android.application") version "8.13.1" apply false
    id("org.jetbrains.kotlin.android") version "2.2.21" apply false
}

import java.util.Properties

// A simple Gradle task to increment the version stored in android/version.properties
// It increments the last numeric part of VERSION_NAME, and increases VERSION_CODE by 1.
tasks.register("incrementVersion") {
    doLast {
        val versionFile = file("version.properties")
        val props = Properties()
        if (versionFile.exists()) {
            versionFile.inputStream().use { props.load(it) }
        }
        val vName = props.getProperty("VERSION_NAME", "1.0")
        val vCode = props.getProperty("VERSION_CODE", "1").toInt()
        val parts = vName.split(".").toMutableList()
        if (parts.isEmpty()) parts.add("0")
        val lastIndex = parts.size - 1
        val lastNum = parts[lastIndex].toIntOrNull() ?: 0
        parts[lastIndex] = (lastNum + 1).toString()
        val newVName = parts.joinToString(".")
        val newVCode = vCode + 1
        props.setProperty("VERSION_NAME", newVName)
        props.setProperty("VERSION_CODE", newVCode.toString())
        versionFile.outputStream().use { props.store(it, null) }
        println("Bumped android version to $newVName (code $newVCode)")
    }
}
