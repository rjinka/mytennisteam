package com.rjinka.buildsrc.tasks

import org.gradle.api.DefaultTask
import org.gradle.api.file.RegularFileProperty
import org.gradle.api.tasks.*
import java.util.Properties
import javax.inject.Inject

@CacheableTask
abstract class IncrementVersionTask @Inject constructor() : DefaultTask() {
    @get:OutputFile
    abstract val versionFile: RegularFileProperty

    @TaskAction
    fun increment() {
        val file = versionFile.get().asFile
        val props = Properties()
        if (file.exists()) java.io.FileInputStream(file).use { props.load(it) }
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
        java.io.FileOutputStream(file).use { props.store(it, null) }
        logger.lifecycle("Bumped android version to $newVName (code $newVCode)")
    }
}
