import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// Load properties from local.properties file
val localProperties = Properties()
val localPropertiesFile = rootProject.file("local.properties")
if (localPropertiesFile.exists()) {
    localProperties.load(localPropertiesFile.inputStream())
}

android {
    namespace = "com.ramjin.mytennisteam"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.ramjin.mytennisteam"
        minSdk = 24
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        // Read the secret from local.properties and create a string resource
        resValue(
            "string",
            "server_client_id",
            localProperties.getProperty("SERVER_CLIENT_ID", "\"DUMMY_ID\"")
        )
    }

    testOptions {
        unitTests.isReturnDefaultValues = true
    }

    buildTypes {
        debug {
            buildConfigField("String", "BASE_URL", "\"http://10.0.2.2:3000/\"")
            buildConfigField("String", "WEB_APP_BASE_URL", "\"http://10.0.2.2:5000\"")
        }
        release {
            buildConfigField("String", "BASE_URL", "\"https://auth.mytennisteam.com/\"")
            buildConfigField("String", "WEB_APP_BASE_URL", "\"https://mytennisteam.com\"")
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlin {
        compilerOptions.jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
    }
    buildFeatures {
        viewBinding = true
        buildConfig = true
    }
}

dependencies {

    implementation("androidx.core:core-ktx:1.17.0")
    implementation("androidx.appcompat:appcompat:1.7.1")
    implementation("com.google.android.material:material:1.13.0")
    implementation("androidx.constraintlayout:constraintlayout:2.2.1")
    implementation("androidx.gridlayout:gridlayout:1.1.0") // Added for schedule detail view
    implementation("com.google.android.gms:play-services-auth:21.4.0")
    implementation("com.squareup.retrofit2:retrofit:3.0.0")
    implementation("com.squareup.retrofit2:converter-gson:3.0.0")
    implementation("com.squareup.okhttp3:logging-interceptor:5.3.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.10.2")
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.mockito:mockito-core:5.20.0")
    testImplementation("org.mockito.kotlin:mockito-kotlin:6.1.0")
    testImplementation("androidx.arch.core:core-testing:2.2.0")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.10.2")
    androidTestImplementation("androidx.test.ext:junit:1.3.0")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.7.0")

    implementation("androidx.credentials:credentials:1.6.0-beta03")
    implementation("androidx.credentials:credentials-play-services-auth:1.6.0-beta03")
    implementation("com.google.android.libraries.identity.googleid:googleid:1.1.1")

    // ViewModel and LiveData
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.9.4")
    implementation("androidx.lifecycle:lifecycle-livedata-ktx:2.9.4")
    implementation("androidx.lifecycle:lifecycle-viewmodel-savedstate:2.9.4")
    implementation("androidx.fragment:fragment-ktx:1.8.9")

    // Glide
    implementation("com.github.bumptech.glide:glide:5.0.5")

    // Swipe to Refresh
    implementation("androidx.swiperefreshlayout:swiperefreshlayout:1.2.0-beta01")
}
