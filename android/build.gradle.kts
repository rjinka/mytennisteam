// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    id("com.android.application") version "8.13.1" apply false
    id("org.jetbrains.kotlin.android") version "2.2.21" apply false
}

import com.rjinka.buildsrc.tasks.IncrementVersionTask

// Register a typed, cacheable gradle task that increments the properties file
tasks.register<IncrementVersionTask>("incrementVersion") {
    versionFile.set(rootProject.layout.projectDirectory.file("version.properties"))
}
