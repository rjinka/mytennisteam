import 'package:flutter/material.dart';
import '../api/api_service.dart';
import '../models/user.dart';

class AuthProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  User? _user;
  bool _isLoading = true;

  User? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _user != null;

  AuthProvider() {
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    try {
      _user = await _apiService.getSelf();
    } catch (e) {
      print('User not authenticated or error: $e');
      _user = null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loginWithGoogle(String token) async {
    _isLoading = true;
    notifyListeners();
    try {
      _user = await _apiService.loginWithGoogle(token);
    } catch (e) {
      print('Login failed: $e');
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();
    try {
      await _apiService.logout();
      _user = null;
    } catch (e) {
      print('Logout failed: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
