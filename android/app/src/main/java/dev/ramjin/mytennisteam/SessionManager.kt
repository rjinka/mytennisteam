package dev.ramjin.mytennisteam

import android.content.Context
import android.content.SharedPreferences

object SessionManager {
    private const val PREF_NAME = "MyTennisTeamSession"
    private const val AUTH_TOKEN = "auth_token"
    private const val USER_ID = "user_id"
    private const val IS_SUPER_ADMIN = "is_super_admin"

    private fun getSharedPreferences(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)
    }

    fun saveAuthToken(context: Context, token: String, userId: String, isSuperAdmin: Boolean) {
        val editor = getSharedPreferences(context).edit()
        editor.putString(AUTH_TOKEN, token)
        editor.putString(USER_ID, userId)
        editor.putBoolean(IS_SUPER_ADMIN, isSuperAdmin)
        editor.apply()
    }

    fun getAuthToken(context: Context): String? {
        return getSharedPreferences(context).getString(AUTH_TOKEN, null)
    }

    fun getUserId(context: Context): String? {
        return getSharedPreferences(context).getString(USER_ID, null)
    }

    fun isSuperAdmin(context: Context): Boolean {
        return getSharedPreferences(context).getBoolean(IS_SUPER_ADMIN, false)
    }

    fun clearAuthToken(context: Context) {
        val editor = getSharedPreferences(context).edit()
        editor.clear()
        editor.apply()
    }
}
