import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/user.dart';
import '../models/group.dart';
import '../models/schedule.dart';
import '../models/player.dart';
import '../models/court.dart';
import '../config.dart';

class ApiService {
  static const String baseUrl = Config.apiBaseUrl;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  Future<Map<String, String>> _getHeaders() async {
    String? token = await _storage.read(key: 'auth_token');

    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  Future<dynamic> _handleResponse(http.Response response) async {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return json.decode(response.body);
    } else {
      throw Exception('API Error: ${response.statusCode} ${response.body}');
    }
  }

  // Auth
  Future<User> loginWithGoogle(String token) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/google/mobile'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'token': token}),
    );

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final data = json.decode(response.body);
      final String appToken = data['token'];
      await _storage.write(key: 'auth_token', value: appToken);
      return User.fromJson(data['user']);
    } else {
      throw Exception('Login Failed: ${response.body}');
    }
  }

  Future<User> getSelf() async {
    final headers = await _getHeaders();
    final response =
        await http.get(Uri.parse('$baseUrl/users/me'), headers: headers);
    return User.fromJson(await _handleResponse(response));
  }

  Future<void> logout() async {
    final headers = await _getHeaders();
    await http.post(Uri.parse('$baseUrl/users/logout'), headers: headers);
    await _storage.delete(key: 'auth_token');
  }

  // Groups
  Future<List<Group>> getPlayerGroups() async {
    final headers = await _getHeaders();
    final response =
        await http.get(Uri.parse('$baseUrl/groups/player'), headers: headers);
    final List<dynamic> data = await _handleResponse(response);
    return data.map((e) => Group.fromJson(e)).toList();
  }

  Future<Group> createGroup(String name) async {
    final headers = await _getHeaders();
    final response = await http.post(
      Uri.parse('$baseUrl/groups'),
      headers: headers,
      body: json.encode({'name': name}),
    );
    return Group.fromJson(await _handleResponse(response));
  }

  Future<Group> updateGroup(String id, Map<String, dynamic> data) async {
    final headers = await _getHeaders();
    final response = await http.put(
      Uri.parse('$baseUrl/groups/$id'),
      headers: headers,
      body: json.encode(data),
    );
    return Group.fromJson(await _handleResponse(response));
  }

  Future<void> deleteGroup(String id) async {
    final headers = await _getHeaders();
    await http.delete(Uri.parse('$baseUrl/groups/$id'), headers: headers);
  }

  Future<void> leaveGroup(String id) async {
    final headers = await _getHeaders();
    await http.post(Uri.parse('$baseUrl/groups/$id/leave'), headers: headers);
  }

  // Schedules
  Future<List<Schedule>> getSchedules(String groupId) async {
    final headers = await _getHeaders();
    final response = await http.get(Uri.parse('$baseUrl/schedules/$groupId'),
        headers: headers);
    final List<dynamic> data = await _handleResponse(response);
    return data.map((e) => Schedule.fromJson(e)).toList();
  }

  // Players
  Future<List<Player>> getPlayers(String groupId) async {
    final headers = await _getHeaders();
    final response = await http.get(Uri.parse('$baseUrl/players/$groupId'),
        headers: headers);
    final List<dynamic> data = await _handleResponse(response);
    return data.map((e) => Player.fromJson(e)).toList();
  }

  // Courts
  Future<List<Court>> getCourts(String groupId) async {
    final headers = await _getHeaders();
    final response =
        await http.get(Uri.parse('$baseUrl/courts/$groupId'), headers: headers);
    final List<dynamic> data = await _handleResponse(response);
    return data.map((e) => Court.fromJson(e)).toList();
  }
}
