// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    id("com.android.application") version "8.13.1" apply false
    id("org.jetbrains.kotlin.android") version "2.2.21" apply false
}


tasks.register("incrementVersion") {
    val versionFile = layout.projectDirectory.file("version.properties").asFile
    doLast {
        if (versionFile.exists()) {
            val properties = java.util.Properties()
            versionFile.inputStream().use { properties.load(it) }

            val oldVersionCode = properties.getProperty("VERSION_CODE", "1").toInt()
            val newVersionCode = oldVersionCode + 1

            val oldVersionName = properties.getProperty("VERSION_NAME", "1.0")
            val versionParts = oldVersionName.split(".").toMutableList()
            if (versionParts.isNotEmpty()) {
                val lastPart = versionParts.last().toIntOrNull() ?: 0
                versionParts[versionParts.lastIndex] = (lastPart + 1).toString()
            } else {
                versionParts.add("1")
            }
            val newVersionName = versionParts.joinToString(".")

            properties.setProperty("VERSION_CODE", newVersionCode.toString())
            properties.setProperty("VERSION_NAME", newVersionName)

            versionFile.outputStream().use { properties.store(it, null) }
            println("Incremented version to Code: $newVersionCode, Name: $newVersionName")
        } else {
            println("version.properties not found!")
        }
    }
}

