package com.ramjin.mytennisteam

import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

import androidx.annotation.VisibleForTesting
import com.ramjin.mytennisteam.BuildConfig

object RetrofitClient {

    private const val BASE_URL = BuildConfig.BASE_URL

    var instance: ApiService = createApiService()
        @VisibleForTesting set

    private fun createApiService(): ApiService {
        val okHttpClientBuilder = OkHttpClient.Builder()

        val okHttpClient = okHttpClientBuilder.build()

        val retrofit = Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        return retrofit.create(ApiService::class.java)
    }
}
