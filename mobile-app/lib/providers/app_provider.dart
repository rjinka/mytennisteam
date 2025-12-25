import 'package:flutter/material.dart';
import '../api/api_service.dart';
import '../models/group.dart';
import '../models/schedule.dart';
import '../models/player.dart';
import '../models/court.dart';

class AppProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  
  List<Group> _groups = [];
  Group? _currentGroup;
  List<Schedule> _schedules = [];
  List<Player> _players = [];
  List<Court> _courts = [];
  bool _isLoading = false;

  List<Group> get groups => _groups;
  Group? get currentGroup => _currentGroup;
  List<Schedule> get schedules => _schedules;
  List<Player> get players => _players;
  List<Court> get courts => _courts;
  bool get isLoading => _isLoading;

  Future<void> refreshGroups() async {
    try {
      _groups = await _apiService.getPlayerGroups();
      if (_groups.isNotEmpty && _currentGroup == null) {
        _currentGroup = _groups.first;
        await refreshCurrentGroupData();
      }
      notifyListeners();
    } catch (e) {
      print('Failed to refresh groups: $e');
    }
  }

  void setCurrentGroup(Group? group) {
    _currentGroup = group;
    notifyListeners();
    if (group != null) {
      refreshCurrentGroupData();
    }
  }

  Future<void> refreshCurrentGroupData() async {
    if (_currentGroup == null) return;
    
    _isLoading = true;
    notifyListeners();

    try {
      final results = await Future.wait([
        _apiService.getSchedules(_currentGroup!.id),
        _apiService.getPlayers(_currentGroup!.id),
        _apiService.getCourts(_currentGroup!.id),
      ]);

      _schedules = results[0] as List<Schedule>;
      _players = results[1] as List<Player>;
      _courts = results[2] as List<Court>;
    } catch (e) {
      print('Failed to refresh group data: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
